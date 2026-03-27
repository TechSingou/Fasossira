import {
    Injectable, NotFoundException, ConflictException,
    BadRequestException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ScheduleEntity, ScheduleStatus } from './entities/schedule.entity';
import { CreateScheduleDto, UpdateScheduleDto, GenerateSchedulesDto } from './dto/schedule.dto';
import { TripsService } from '../trips/trips.service';
import { BusesService } from '../buses/buses.service';

export interface GenerateResult {
    created: number;
    skipped: string[];
    schedules: ScheduleEntity[];
}

@Injectable()
export class SchedulesService {
    private readonly logger = new Logger(SchedulesService.name);

    constructor(
        @InjectRepository(ScheduleEntity)
        private readonly scheduleRepo: Repository<ScheduleEntity>,
        private readonly tripsService: TripsService,
        private readonly busesService: BusesService,
    ) { }

    // ─── findAll avec filtres ──────────────────────────────────

    async findAll(
        companyId: string,
        filters: {
            date?: string;
            routeId?: string;
            busId?: string;
            status?: ScheduleStatus;
        } = {},
    ) {
        const qb = this.scheduleRepo
            .createQueryBuilder('s')
            .leftJoinAndSelect('s.trip', 'trip')
            .leftJoinAndSelect('trip.route', 'route')
            .leftJoinAndSelect('s.bus', 'bus')
            .where('s.companyId = :companyId', { companyId })
            .orderBy('s.departureDateTime', 'ASC');

        if (filters.date) qb.andWhere('s.date = :date', { date: filters.date });
        if (filters.busId) qb.andWhere('s.busId = :busId', { busId: filters.busId });
        if (filters.status) qb.andWhere('s.status = :status', { status: filters.status });
        if (filters.routeId) qb.andWhere('trip.routeId = :routeId', { routeId: filters.routeId });

        return qb.getMany();
    }

    // ─── Voyages pour la vente guichet / en route ──────────────
    //
    // Retourne la structure complète attendue par TicketOfficeComponent :
    //   schedule.trip.route.stops[]  → selects de segment
    //   schedule.availableSeats      → sièges libres affichés
    //   schedule.bus                 → plaque + capacité
    //
    // Différence avec findAll() :
    //   - charge route.stops (JOIN supplémentaire)
    //   - filtre optionnel par nom de ville (fromStop / toStop)
    //   - exclut les schedules CANCELLED et COMPLETED

    async findForSale(
        companyId: string,
        date: string,
        fromStop?: string,
        toStop?: string,
    ) {
        const qb = this.scheduleRepo
            .createQueryBuilder('s')
            .leftJoinAndSelect('s.trip', 'trip')
            .leftJoinAndSelect('trip.route', 'route')
            .leftJoinAndSelect('route.stops', 'stops')
            .leftJoinAndSelect('s.bus', 'bus')
            .where('s.companyId = :companyId', { companyId })
            .andWhere('s.date = :date', { date })
            .andWhere('s.status NOT IN (:...excluded)', {
                excluded: [ScheduleStatus.CANCELLED, ScheduleStatus.COMPLETED],
            })
            .orderBy('s.departureDateTime', 'ASC')
            .addOrderBy('stops.order', 'ASC');

        const schedules = await qb.getMany();

        return schedules
            // Filtrage optionnel par ville de départ / arrivée
            .filter((s) => {
                if (!s.trip?.route?.stops?.length) return true;
                const stopNames = s.trip.route.stops.map((st) => st.cityName.toLowerCase());
                if (fromStop && !stopNames.some((n) => n.includes(fromStop.toLowerCase()))) return false;
                if (toStop && !stopNames.some((n) => n.includes(toStop.toLowerCase()))) return false;
                return true;
            })
            .map((s) => ({
                id: s.id,
                date: s.date,
                departureDateTime: s.departureDateTime,
                arrivalDateTime: s.arrivalDateTime,
                status: s.status,
                totalSeats: s.totalSeats,
                availableSeats: s.totalSeats, // Étape 4 : ReservationsService.getAvailableSeatsMap()
                trip: {
                    departureTime: s.trip.departureTime,
                    arrivalTime: s.trip.arrivalTime,
                    route: {
                        id: s.trip.route?.id ?? '',
                        name: s.trip.route?.name ?? '—',
                        stops: (s.trip.route?.stops ?? [])
                            .sort((a, b) => a.order - b.order)
                            .map((st) => ({
                                id: st.id,
                                order: st.order,
                                cityName: st.cityName,
                            })),
                    },
                },
                bus: {
                    plate: s.bus?.plate ?? '—',
                    capacity: s.bus?.capacity ?? 0,
                },
            }));
    }

    // ─── Planning du jour ──────────────────────────────────────

    async getPlanning(companyId: string, date: string) {
        const schedules = await this.findAll(companyId, { date });

        return schedules.map((s) => ({
            id: s.id,
            date: s.date,
            departureTime: s.trip.departureTime,
            arrivalTime: s.trip.arrivalTime,
            departureDateTime: s.departureDateTime,
            arrivalDateTime: s.arrivalDateTime,
            route: s.trip.route ? s.trip.route.name : 'Route inconnue',
            tripId: s.tripId,
            bus: {
                id: s.bus.id,
                plate: s.bus.plate,
                capacity: s.bus.capacity,
            },
            totalSeats: s.totalSeats,
            availableSeats: s.totalSeats, // ← Étape 4 : soustraire les réservations
            status: s.status,
        }));
    }

    async findOne(companyId: string, id: string) {
        const schedule = await this.scheduleRepo.findOne({
            where: { id, companyId },
            relations: ['trip', 'trip.route', 'bus'],
        });
        if (!schedule) throw new NotFoundException('Schedule introuvable');
        return schedule;
    }

    // ─── Créer un schedule ─────────────────────────────────────

    async create(companyId: string, dto: CreateScheduleDto) {
        const trip = await this.tripsService.findOne(companyId, dto.tripId);
        const bus = await this.busesService.findOne(companyId, dto.busId);

        // ✅ buildDateTimes gère les voyages nocturnes (arr <= dep → +1 jour)
        const { departureDateTime, arrivalDateTime } =
            this.buildDateTimes(dto.date, trip.departureTime, trip.arrivalTime);

        await this.checkBusConflict(bus.id, departureDateTime, arrivalDateTime, companyId);

        const schedule = this.scheduleRepo.create({
            companyId,
            tripId: trip.id,
            busId: bus.id,
            date: dto.date,
            departureDateTime,
            arrivalDateTime,
            totalSeats: bus.capacity,
            status: ScheduleStatus.SCHEDULED,
        });

        const saved = await this.scheduleRepo.save(schedule);
        this.logger.log(`Schedule créé : ${trip.departureTime} le ${dto.date} — bus ${bus.plate}`);
        return this.findOne(companyId, saved.id);
    }

    // ─── Générer des schedules en série ───────────────────────

    // async generate(companyId: string, dto: GenerateSchedulesDto): Promise<GenerateResult> {
    //     const trip = await this.tripsService.findOne(companyId, dto.tripId);
    //     const bus = await this.busesService.findOne(companyId, dto.busId);

    //     const start = new Date(dto.startDate);
    //     const end = new Date(dto.endDate);

    //     if (end <= start) {
    //         throw new BadRequestException('endDate doit être postérieure à startDate');
    //     }
    //     const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    //     if (diffDays > 365) {
    //         throw new BadRequestException('La période ne peut pas dépasser 365 jours');
    //     }

    //     const created: ScheduleEntity[] = [];
    //     const skipped: string[] = [];

    //     const cursor = new Date(start);
    //     while (cursor <= end) {
    //         const isoDay = cursor.getDay() === 0 ? 7 : cursor.getDay();
    //         const dateStr = cursor.toISOString().split('T')[0];

    //         if (dto.weekDays.includes(isoDay)) {
    //             // ✅ buildDateTimes gère les voyages nocturnes
    //             const { departureDateTime, arrivalDateTime } =
    //                 this.buildDateTimes(dateStr, trip.departureTime, trip.arrivalTime);

    //             try {
    //                 await this.checkBusConflict(bus.id, departureDateTime, arrivalDateTime, companyId);

    //                 const schedule = await this.scheduleRepo.save(
    //                     this.scheduleRepo.create({
    //                         companyId,
    //                         tripId: trip.id,
    //                         busId: bus.id,
    //                         date: dateStr,
    //                         departureDateTime,
    //                         arrivalDateTime,
    //                         totalSeats: bus.capacity,
    //                         status: ScheduleStatus.SCHEDULED,
    //                     }),
    //                 );
    //                 created.push(schedule);
    //             } catch {
    //                 skipped.push(dateStr);
    //             }
    //         }

    //         cursor.setDate(cursor.getDate() + 1);
    //     }

    //     this.logger.log(
    //         `Génération terminée : ${created.length} créés, ${skipped.length} ignorés`,
    //     );

    //     return { created: created.length, skipped, schedules: created };
    // }

    // ─── Générer des schedules en série ───────────────────────
    //
    // OPTIMISATION vs version précédente :
    //   Avant : checkBusConflict() → 1 requête SQL par jour candidat (N+1)
    //           → jusqu'à 365 queries pour une génération annuelle
    //
    //   Après : 1 seule requête pour charger tous les conflits existants
    //           sur la période, puis lookup O(1) en mémoire via un Set<string>
    //           de clés composites "busId|date" pour la détection rapide.
    //
    //   Note : on ne peut pas se limiter à date IN (...) car un voyage nocturne
    //   peut déborder sur le lendemain. On charge donc par plage de dates
    //   [startDate, endDate+1] et on filtre par chevauchement de créneaux
    //   horaires via la logique de fenêtre (dep < arrOther && arr > depOther).

    async generate(companyId: string, dto: GenerateSchedulesDto): Promise<GenerateResult> {
        const trip = await this.tripsService.findOne(companyId, dto.tripId);
        const bus = await this.busesService.findOne(companyId, dto.busId);

        const start = new Date(dto.startDate);
        const end = new Date(dto.endDate);

        if (end <= start) {
            throw new BadRequestException('endDate doit être postérieure à startDate');
        }
        const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays > 365) {
            throw new BadRequestException('La période ne peut pas dépasser 365 jours');
        }

        // ── 1. Calculer les créneaux candidats (jours filtrés par weekDays) ──────
        //
        // On construit la liste AVANT les requêtes DB pour :
        //  a) Savoir exactement quels jours on va tenter de créer
        //  b) Passer une seule requête de conflits avec les bons créneaux

        interface Candidate {
            dateStr: string;
            departureDateTime: Date;
            arrivalDateTime: Date;
        }

        const candidates: Candidate[] = [];
        const cursor = new Date(start);

        while (cursor <= end) {
            // getDay() retourne 0=dim…6=sam, ISO 8601 : 1=lun…7=dim
            const isoDay = cursor.getDay() === 0 ? 7 : cursor.getDay();
            const dateStr = cursor.toISOString().split('T')[0];

            if (dto.weekDays.includes(isoDay)) {
                const { departureDateTime, arrivalDateTime } =
                    this.buildDateTimes(dateStr, trip.departureTime, trip.arrivalTime);
                candidates.push({ dateStr, departureDateTime, arrivalDateTime });
            }

            cursor.setDate(cursor.getDate() + 1);
        }

        if (candidates.length === 0) {
            return { created: 0, skipped: [], schedules: [] };
        }

        // ── 2. Charger tous les conflits potentiels en UNE seule requête ─────────
        //
        // On récupère tous les schedules non annulés du bus sur la période.
        // La plage est étendue d'un jour après endDate pour capturer les voyages
        // nocturnes commencés avant minuit du dernier jour candidat.

        const endDateExtended = new Date(end);
        endDateExtended.setDate(endDateExtended.getDate() + 1);
        const endDateStr = endDateExtended.toISOString().split('T')[0];

        const existingSchedules = await this.scheduleRepo.find({
            where: {
                companyId,
                busId: bus.id,
                date: Between(dto.startDate, endDateStr),
            },
            select: ['id', 'date', 'departureDateTime', 'arrivalDateTime', 'status'],
        });

        // Filtrer les annulés en mémoire (plus simple que d'ajouter NOT IN à la query)
        const activeExisting = existingSchedules.filter(
            (s) => s.status !== ScheduleStatus.CANCELLED,
        );

        // ── 3. Itérer sur les candidats avec lookup en mémoire ────────────────────

        const created: ScheduleEntity[] = [];
        const skipped: string[] = [];

        // Les inserts sont regroupés par batch de 50 pour éviter de surcharger
        // la connexion DB si la période est longue (ex : 6 mois, 26 lundis)
        const toInsert: Partial<ScheduleEntity>[] = [];

        for (const candidate of candidates) {
            const hasConflict = activeExisting.some(
                (existing) =>
                    existing.departureDateTime < candidate.arrivalDateTime &&
                    existing.arrivalDateTime > candidate.departureDateTime,
            );

            if (hasConflict) {
                skipped.push(candidate.dateStr);
                continue;
            }

            toInsert.push({
                companyId,
                tripId: trip.id,
                busId: bus.id,
                date: candidate.dateStr,
                departureDateTime: candidate.departureDateTime,
                arrivalDateTime: candidate.arrivalDateTime,
                totalSeats: bus.capacity,
                status: ScheduleStatus.SCHEDULED,
            });
        }

        // ── 4. Bulk insert par lots de 50 ─────────────────────────────────────────

        const BATCH_SIZE = 50;
        for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
            const batch = toInsert.slice(i, i + BATCH_SIZE);
            const entities = this.scheduleRepo.create(batch);
            const saved = await this.scheduleRepo.save(entities);
            created.push(...saved);
        }

        this.logger.log(
            `Génération terminée : ${created.length} créé(s), ${skipped.length} conflit(s) ignoré(s) ` +
            `[trip: ${trip.departureTime}→${trip.arrivalTime}, bus: ${bus.plate}]`,
        );

        return { created: created.length, skipped, schedules: created };
    }

    // ─── Update ────────────────────────────────────────────────
    async update(companyId: string, id: string, dto: UpdateScheduleDto): Promise<ScheduleEntity> {
        const schedule = await this.findOne(companyId, id);

        // ─── TODO Étape 4 — RÉSERVATIONS ────────────────────────
        // Avant de permettre la modification de date ou de busId, vérifier
        // qu'aucune réservation active n'existe pour ce schedule.
        // ─────────────────────────────────────────────────────────

        // Objet de mise à jour explicite — évite les comportements silencieux
        // de save() sur une entité chargée via QueryBuilder (TypeORM ne tracke
        // pas les changements → certaines colonnes comme totalSeats sont ignorées)
        const updatePayload: Partial<ScheduleEntity> = {};

        // Mise à jour du bus
        if (dto.busId && dto.busId !== schedule.busId) {
            const bus = await this.busesService.findOne(companyId, dto.busId);
            updatePayload.busId = bus.id;
            updatePayload.totalSeats = bus.capacity; // ← capacité du nouveau bus
        }

        // Mise à jour de la date
        if (dto.date && dto.date !== schedule.date) {
            const trip = await this.tripsService.findOne(companyId, schedule.tripId);
            // buildDateTimes gère les voyages nocturnes (arr <= dep → +1 jour)
            const { departureDateTime, arrivalDateTime } =
                this.buildDateTimes(dto.date, trip.departureTime, trip.arrivalTime);
            updatePayload.date = dto.date;
            updatePayload.departureDateTime = departureDateTime;
            updatePayload.arrivalDateTime = arrivalDateTime;
        }

        if (dto.status) {
            updatePayload.status = dto.status;
        }

        // Conflit vérifié APRÈS avoir calculé toutes les nouvelles valeurs
        // (bus et date peuvent changer simultanément)
        if (dto.busId || dto.date) {
            await this.checkBusConflict(
                updatePayload.busId ?? schedule.busId,
                updatePayload.departureDateTime ?? schedule.departureDateTime,
                updatePayload.arrivalDateTime ?? schedule.arrivalDateTime,
                companyId,
                id, // exclure le schedule courant
            );
        }

        // UPDATE SQL explicite — toutes les colonnes de updatePayload sont garanties
        // d'être écrites : UPDATE schedules SET busId=?, totalSeats=?, ... WHERE id=? AND companyId=?
        await this.scheduleRepo.update({ id, companyId }, updatePayload);

        // Rechargement complet avec relations fraîches (bus, trip, route) depuis la DB
        return this.findOne(companyId, id);
    }

    // ─── Remove ────────────────────────────────────────────────

    async remove(companyId: string, id: string) {
        const schedule = await this.findOne(companyId, id);
        if (schedule.status === ScheduleStatus.IN_PROGRESS) {
            throw new BadRequestException('Un voyage en cours ne peut pas être supprimé');
        }
        await this.scheduleRepo.remove(schedule);
        return { message: 'Schedule supprimé' };
    }

    // ─── Helpers ───────────────────────────────────────────────

    /**
     * Construit les dates/heures absolues d'un schedule.
     * Gère les voyages nocturnes : si arrivalTime <= departureTime,
     * l'arrivée est le lendemain (+1 jour).
     *
     * Exemples :
     *  06:30 → 14:00 : départ et arrivée le même jour
     *  18:00 → 02:00 : départ J, arrivée J+1
     *  23:00 → 00:30 : départ J, arrivée J+1
     */
    buildDateTimes(date: string, depTime: string, arrTime: string) {
        const departureDateTime = new Date(`${date}T${depTime}:00`);
        const arrivalDateTime = new Date(`${date}T${arrTime}:00`);

        // Voyage nocturne : l'arrivée passe minuit
        if (arrivalDateTime <= departureDateTime) {
            arrivalDateTime.setDate(arrivalDateTime.getDate() + 1);
        }

        return { departureDateTime, arrivalDateTime };
    }

    private async checkBusConflict(
        busId: string,
        departureDateTime: Date,
        arrivalDateTime: Date,
        companyId: string,
        excludeId?: string,
    ): Promise<void> {
        const qb = this.scheduleRepo.createQueryBuilder('s')
            .where('s.companyId = :companyId', { companyId })
            .andWhere('s.busId = :busId', { busId })
            .andWhere('s.status != :cancelled', { cancelled: ScheduleStatus.CANCELLED })
            .andWhere('s.departureDateTime < :arrivalDateTime', { arrivalDateTime })
            .andWhere('s.arrivalDateTime > :departureDateTime', { departureDateTime });

        if (excludeId) {
            qb.andWhere('s.id != :excludeId', { excludeId });
        }

        const conflict = await qb.getOne();
        if (conflict) {
            throw new ConflictException(
                `Ce bus est déjà assigné à un voyage qui se chevauche le ${conflict.date}`,
            );
        }
    }

    async findAvailableBuses(companyId: string, tripId: string, date: string) {
        const trip = await this.tripsService.findOne(companyId, tripId);
        const { departureDateTime, arrivalDateTime } =
            this.buildDateTimes(date, trip.departureTime, trip.arrivalTime);
        return this.busesService.findAvailable(companyId, departureDateTime, arrivalDateTime);
    }
}

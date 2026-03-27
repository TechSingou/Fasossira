import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TripEntity } from './entities/trip.entity';
import { CreateTripDto, UpdateTripDto } from './dto/trip.dto';

@Injectable()
export class TripsService {
    private readonly logger = new Logger(TripsService.name);

    constructor(
        @InjectRepository(TripEntity)
        private readonly tripRepo: Repository<TripEntity>,
    ) { }

    async findAll(companyId: string) {
        return this.tripRepo.find({
            where: { companyId },
            relations: ['route'],
            order: { departureTime: 'ASC' },
        });
    }

    async findOne(companyId: string, id: string) {
        const trip = await this.tripRepo.findOne({
            where: { id, companyId },
            relations: ['route'],
        });
        if (!trip) throw new NotFoundException('Trip introuvable');
        return trip;
    }

    async create(companyId: string, dto: CreateTripDto) {
        this.validateTimes(dto.departureTime, dto.arrivalTime);

        const trip = this.tripRepo.create({ ...dto, companyId });
        const saved = await this.tripRepo.save(trip);
        this.logger.log(`Trip créé : ${saved.departureTime}→${saved.arrivalTime} (${companyId})`);
        return this.findOne(companyId, saved.id); // retourner avec la route populée
    }

    async update(companyId: string, id: string, dto: UpdateTripDto) {
        const trip = await this.findOne(companyId, id);
        const newDep = dto.departureTime ?? trip.departureTime;
        const newArr = dto.arrivalTime ?? trip.arrivalTime;
        this.validateTimes(newDep, newArr);
        Object.assign(trip, dto);
        return this.tripRepo.save(trip);
    }

    async remove(companyId: string, id: string) {
        const trip = await this.findOne(companyId, id);
        await this.tripRepo.remove(trip);
        return { message: 'Trip supprimé' };
    }

    /**
     * Valide la cohérence des horaires.
     *
     * Un horaire est valide dans deux cas :
     *  - Voyage de jour   : dep < arr  (ex: 06:30 → 14:00)
     *  - Voyage nocturne  : dep > arr  (ex: 18:00 → 02:00, arrivée le lendemain)
     *
     * Le seul cas invalide est dep === arr (durée nulle).
     * La gestion du +1 jour sur arrivalDateTime est faite dans
     * SchedulesService.buildDateTimes() au moment de la planification.
     */
    private validateTimes(dep: string, arr: string): void {
        if (dep === arr) {
            throw new BadRequestException(
                `L'heure de départ et d'arrivée ne peuvent pas être identiques (${dep})`,
            );
        }
        // dep > arr = voyage nocturne → valide, pas d'exception
    }
}

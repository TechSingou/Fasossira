import {
    Entity, PrimaryGeneratedColumn, Column,
    ManyToOne, JoinColumn, Index,
    CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { ScheduleEntity } from '../../schedules/entities/schedule.entity';
import { ReservationStatus, SaleChannel } from '../../shared/types';

@Entity('reservations')
@Index(['companyId'])
@Index(['companyId', 'scheduleId'])
@Index(['companyId', 'createdAt'])
@Index(['reference'], { unique: true })
// Index pour la logique d'overlap de segment (requête critique perf)
@Index(['scheduleId', 'seatNumber', 'status'])
export class ReservationEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // ─── Multi-tenancy ─────────────────────────────────────────
    @Column({ type: 'uuid' })
    companyId: string;

    // ─── Référence unique imprimée sur le billet ────────────────
    // Format : REF-YYYY-XXXXXXXX (généré par TicketsService)
    @Column({ length: 30, unique: true })
    reference: string;

    // ─── Schedule ──────────────────────────────────────────────
    @Column({ type: 'uuid' })
    scheduleId: string;

    @ManyToOne(() => ScheduleEntity, { onDelete: 'RESTRICT', eager: false })
    @JoinColumn({ name: 'scheduleId' })
    schedule: ScheduleEntity;

    // ─── Siège ─────────────────────────────────────────────────
    // Numéro physique du siège dans le bus (1..capacity)
    @Column({ type: 'int' })
    seatNumber: number;

    // ─── Segment du voyage ─────────────────────────────────────
    // Référencent les `order` des RouteStops (pas les IDs)
    // Permet l'overlap check : un siège peut être revendu sur
    // un sous-trajet non chevauchant (ex: Bamako→Ségou libère
    // le siège pour Ségou→Mopti sur le même voyage)
    @Column({ type: 'int' })
    fromStopOrder: number;

    @Column({ type: 'int' })
    toStopOrder: number;

    // Noms dénormalisés pour l'impression du billet (évite les JOINs)
    @Column({ length: 100 })
    fromCityName: string;

    @Column({ length: 100 })
    toCityName: string;

    // ─── Passager ──────────────────────────────────────────────
    @Column({ length: 150 })
    passengerName: string;

    @Column({ length: 30 })
    passengerPhone: string;

    // ─── Prix ──────────────────────────────────────────────────
    // Copié depuis SegmentPriceEntity à la création — snapshot
    // immuable (le prix peut changer après, le billet reste valide)
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({ length: 3, default: 'XOF' })
    currency: string;

    // ─── Canal de vente ────────────────────────────────────────
    @Column({ type: 'enum', enum: SaleChannel })
    saleChannel: SaleChannel;

    // ─── Statut ────────────────────────────────────────────────
    @Column({
        type: 'enum',
        enum: ReservationStatus,
        default: ReservationStatus.CONFIRMED,
    })
    status: ReservationStatus;

    // ─── Agent qui a vendu ─────────────────────────────────────
    // Nullable : vente en route peut être anonyme
    @Column({ type: 'uuid', nullable: true })
    soldByUserId: string | null;

    // ─── Timestamps ────────────────────────────────────────────
    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

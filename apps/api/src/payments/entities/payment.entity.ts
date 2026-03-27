import {
    Entity, PrimaryGeneratedColumn, Column,
    OneToOne, JoinColumn, Index,
    CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { ReservationEntity } from '../../reservations/entities/reservation.entity';
import { PaymentMethod, PaymentStatus } from '../../shared/types';

@Entity('payments')
@Index(['companyId'])
@Index(['reservationId'], { unique: true }) // 1 paiement par réservation
export class PaymentEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // ─── Multi-tenancy ─────────────────────────────────────────
    @Column({ type: 'uuid' })
    companyId: string;

    // ─── Réservation associée ──────────────────────────────────
    @Column({ type: 'uuid' })
    reservationId: string;

    @OneToOne(() => ReservationEntity, { onDelete: 'CASCADE', eager: false })
    @JoinColumn({ name: 'reservationId' })
    reservation: ReservationEntity;

    // ─── Montant ───────────────────────────────────────────────
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({ length: 3, default: 'XOF' })
    currency: string;

    // ─── Mode de paiement ──────────────────────────────────────
    @Column({ type: 'enum', enum: PaymentMethod })
    method: PaymentMethod;

    // ─── Statut ────────────────────────────────────────────────
    @Column({
        type: 'enum',
        enum: PaymentStatus,
        default: PaymentStatus.PAID,
    })
    status: PaymentStatus;

    // ─── Référence externe (Mobile Money) ──────────────────────
    // Numéro de transaction Orange Money / Moov Money
    // Null pour les paiements Cash
    @Column({ length: 100, nullable: true })
    externalRef: string | null;

    // ─── Timestamps ────────────────────────────────────────────
    @CreateDateColumn()
    paidAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

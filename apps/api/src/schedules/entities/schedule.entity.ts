import {
    Entity, PrimaryGeneratedColumn, Column,
    ManyToOne, JoinColumn, Index,
    CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { TripEntity } from '../../trips/entities/trip.entity';
import { BusEntity } from '../../buses/entities/bus.entity';

export enum ScheduleStatus {
    SCHEDULED = 'SCHEDULED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
}

@Entity('schedules')
@Index(['companyId'])
@Index(['companyId', 'date'])
@Index(['busId', 'departureDateTime'])
export class ScheduleEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    companyId: string;

    @Column({ type: 'uuid' })
    tripId: string;

    @ManyToOne(() => TripEntity, { onDelete: 'CASCADE', eager: false })
    @JoinColumn({ name: 'tripId' })
    trip: TripEntity;

    @Column({ type: 'uuid' })
    busId: string;

    @ManyToOne(() => BusEntity, { onDelete: 'RESTRICT', eager: false })
    @JoinColumn({ name: 'busId' })
    bus: BusEntity;

    // Date du voyage ex: "2026-03-15"
    @Column({ type: 'date' })
    date: string;

    // DateTimes calculés au moment de la création pour les requêtes de conflit
    @Column({ type: 'timestamptz' })
    departureDateTime: Date;

    @Column({ type: 'timestamptz' })
    arrivalDateTime: Date;

    @Column({
        type: 'enum',
        enum: ScheduleStatus,
        default: ScheduleStatus.SCHEDULED,
    })
    status: ScheduleStatus;

    // copié depuis bus.capacity à la création, immuable ensuite
    @Column({ type: 'int' })
    totalSeats: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
import {
    Entity, PrimaryGeneratedColumn, Column,
    ManyToOne, JoinColumn, Index,
    CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { RouteEntity } from '../../routes/entities/route.entity';

@Entity('trips')
@Index(['companyId'])
@Index(['companyId', 'routeId'])
export class TripEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    companyId: string;

    @Column({ type: 'uuid' })
    routeId: string;

    @ManyToOne(() => RouteEntity, { onDelete: 'CASCADE', eager: false })
    @JoinColumn({ name: 'routeId' })
    route: RouteEntity;

    // Heure de départ fixe du modèle ex: "06:30"
    @Column({ length: 5 })
    departureTime: string;

    // Heure d'arrivée estimée ex: "14:00"
    @Column({ length: 5 })
    arrivalTime: string;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
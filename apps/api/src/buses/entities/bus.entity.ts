import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';

export enum BusType {
    COASTER = 'COASTER',
    SPRINTER = 'SPRINTER',
    GRAND_BUS = 'GRAND_BUS',
}

export enum BusStatus {
    ACTIVE = 'ACTIVE',
    MAINTENANCE = 'MAINTENANCE',
    RETIRED = 'RETIRED',
}

@Entity('buses')
@Index(['companyId'])
@Index(['companyId', 'status'])
export class BusEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    companyId: string;

    @Column({ length: 20 })
    plate: string; // ex: "AA-123-BM"

    @Column({ length: 100 })
    brand: string; // ex: "Toyota"

    @Column({ length: 100 })
    model: string; // ex: "Coaster 2022"

    @Column({ type: 'enum', enum: BusType })
    type: BusType;

    @Column({ type: 'int' })
    capacity: number; // nombre de sièges

    @Column({ type: 'enum', enum: BusStatus, default: BusStatus.ACTIVE })
    status: BusStatus;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn,
} from 'typeorm';
import { CompanyEntity } from '../../companies/entities/company.entity';

@Entity('agencies')
@Index(['companyId'])
@Index(['companyId', 'isActive'])
export class AgencyEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // ─── Multi-tenancy ─────────────────────────────────────────
    @Column({ type: 'uuid' })
    companyId: string;

    @ManyToOne(() => CompanyEntity, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'companyId' })
    company: CompanyEntity;

    // ─── Identité ──────────────────────────────────────────────
    @Column({ length: 150 })
    name: string;                    // ex: "Agence Sogoniko"

    @Column({ length: 100 })
    city: string;                    // ex: "Bamako"

    @Column({ length: 255, nullable: true })
    address: string | null;          // Adresse physique complète

    @Column({ length: 30, nullable: true })
    phone: string | null;

    @Column({ length: 150, nullable: true })
    managerName: string | null;      // Nom du responsable d'agence

    // ─── État ──────────────────────────────────────────────────
    @Column({ default: true })
    isActive: boolean;

    // ─── Timestamps ────────────────────────────────────────────
    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

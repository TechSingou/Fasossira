// apps/api/src/auth/entities/user.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { UserRole } from '../../shared/types';
import { CompanyEntity } from '../../companies/entities/company.entity';
import { AgencyEntity } from '../../agencies/entities/agency.entity';

@Entity('users')
@Index(['email'], { unique: true })
@Index(['companyId'])
@Index(['companyId', 'isActive'])
@Index(['agencyId'])  // Performance : UsersService.findAll() filtre souvent par agencyId
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ─── Multi-tenancy ─────────────────────────────────────────
  // SUPER_ADMIN a companyId = null
  @Column({ type: 'uuid', nullable: true })
  companyId: string | null;

  @ManyToOne(() => CompanyEntity, { onDelete: 'CASCADE', nullable: true, eager: false })
  @JoinColumn({ name: 'companyId' })
  company: CompanyEntity;

  // ─── Agent scope ───────────────────────────────────────────
  // @Column déclare la colonne FK (UUID brut) — utilisé dans find/where/create
  // @ManyToOne déclare la relation — utilisé dans leftJoin et les selects imbriqués
  // Les deux sont nécessaires : @Column pour les queries directes (where: { agencyId }),
  // @ManyToOne pour les JOINs (leftJoin('u.agency', 'agency'))
  @Column({ type: 'uuid', nullable: true })
  agencyId: string | null;

  @ManyToOne(() => AgencyEntity, { onDelete: 'SET NULL', nullable: true, eager: false })
  @JoinColumn({ name: 'agencyId' })
  agency: AgencyEntity | null;

  // ─── Identity ──────────────────────────────────────────────
  @Column({ length: 150 })
  name: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ select: false }) // Jamais retourné dans les queries par défaut
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.AGENT })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  // ─── Refresh token (stocké hashé) ──────────────────────────
  @Column({ type: 'text', nullable: true, select: false })
  refreshTokenHash: string | null;

  // ─── Timestamps ────────────────────────────────────────────
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// apps/api/src/companies/entities/company-settings.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  OneToOne, JoinColumn, UpdateDateColumn,
} from 'typeorm';
import { CompanyEntity } from './company.entity';

@Entity('company_settings')
export class CompanySettingsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  companyId: string;

  @OneToOne(() => CompanyEntity, (c) => c.settings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'companyId' })
  company: CompanyEntity;

  // ─── White-label ───────────────────────────────────────────
  @Column({ type: 'text', nullable: true })
  logoUrl: string | null;

  @Column({ length: 7, default: '#0B3D91' }) // Hex color
  primaryColor: string;

  @Column({ length: 7, default: '#E63B2E' })
  secondaryColor: string;

  @Column({ length: 200 })
  companyDisplayName: string;

  @Column({ type: 'text', default: '' })
  ticketFooter: string;

  @Column({ length: 100, default: '' })
  supportContact: string;

  @UpdateDateColumn()
  updatedAt: Date;
}

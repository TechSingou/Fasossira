// apps/api/src/companies/entities/company.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToOne, OneToMany, Index,
} from 'typeorm';
import { CompanySettingsEntity } from './company-settings.entity';
import { SubscriptionEntity } from '../../plans/entities/subscription.entity';

@Entity('companies')
@Index(['slug'], { unique: true })
export class CompanyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  name: string;

  // Identifiant URL unique : ex "sotrama-bamako"
  @Column({ length: 100, unique: true })
  slug: string;

  @Column({ length: 200 })
  city: string;

  @Column({ length: 50 })
  phone: string;

  @Column({ default: true })
  isActive: boolean;

  // ─── Relations ─────────────────────────────────────────────
  @OneToOne(() => CompanySettingsEntity, (s) => s.company, { cascade: true })
  settings: CompanySettingsEntity;

  @OneToMany(() => SubscriptionEntity, (s) => s.company)
  subscriptions: SubscriptionEntity[];

  // ─── Timestamps ────────────────────────────────────────────
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

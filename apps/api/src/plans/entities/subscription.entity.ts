import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, Index, CreateDateColumn,
} from 'typeorm';
import { SubscriptionStatus } from '../../shared/types';
import { CompanyEntity } from '../../companies/entities/company.entity';
import { SubscriptionPlanEntity } from './subscription-plan.entity';

@Entity('subscriptions')
@Index(['companyId', 'status'])
export class SubscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  companyId: string;

  @ManyToOne(() => CompanyEntity, (c) => c.subscriptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'companyId' })
  company: CompanyEntity;

  @Column({ type: 'uuid' })
  planId: string;

  @ManyToOne(() => SubscriptionPlanEntity, (p) => p.subscriptions)
  @JoinColumn({ name: 'planId' })
  plan: SubscriptionPlanEntity;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @CreateDateColumn()
  createdAt: Date;
}

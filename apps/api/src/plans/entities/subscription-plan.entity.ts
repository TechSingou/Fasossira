import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { SubscriptionEntity } from './subscription.entity';

@Entity('subscription_plans')
export class SubscriptionPlanEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, unique: true })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column()
  maxBuses: number;

  @Column()
  maxAgencies: number;

  @Column()
  maxUsers: number;

  @Column({ type: 'jsonb', default: '[]' })
  features: string[];

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => SubscriptionEntity, (s) => s.plan)
  subscriptions: SubscriptionEntity[];
}

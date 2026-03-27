// apps/api/src/routes/entities/route.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  OneToMany, Index,
} from 'typeorm';
import { RouteStopEntity } from './route-stop.entity';
import { SegmentPriceEntity } from './segment-price.entity';

@Entity('routes')
@Index(['companyId'])
@Index(['companyId', 'isActive'])
export class RouteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ─── Multi-tenancy ─────────────────────────────────────────
  @Column({ type: 'uuid' })
  companyId: string;

  // ─── Data ──────────────────────────────────────────────────
  @Column({ length: 200 })
  name: string; // ex: "Bamako → Mopti"

  @Column({ type: 'text', default: '' })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  // ─── Relations ─────────────────────────────────────────────
  @OneToMany(() => RouteStopEntity, (s) => s.route, {
    cascade: true,
    eager: false,
  })
  stops: RouteStopEntity[];

  @OneToMany(() => SegmentPriceEntity, (p) => p.route, {
    cascade: true,
    eager: false,
  })
  segmentPrices: SegmentPriceEntity[];

  // ─── Timestamps ────────────────────────────────────────────
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// apps/api/src/routes/entities/segment-price.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, Index, UpdateDateColumn,
} from 'typeorm';
import { RouteEntity } from './route.entity';

@Entity('segment_prices')
// Index composite : garantit un seul prix par segment par route
@Index(['routeId', 'fromStopOrder', 'toStopOrder'], { unique: true })
@Index(['companyId'])
export class SegmentPriceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ─── Multi-tenancy ─────────────────────────────────────────
  @Column({ type: 'uuid' })
  companyId: string;

  // ─── Relation route ────────────────────────────────────────
  @Column({ type: 'uuid' })
  routeId: string;

  @ManyToOne(() => RouteEntity, (r) => r.segmentPrices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'routeId' })
  route: RouteEntity;

  // ─── Segment ───────────────────────────────────────────────
  // Référencent les `order` des RouteStops, PAS les IDs
  // ex: Bamako(1) → Ségou(2) : fromStopOrder=1, toStopOrder=2
  // ex: Bamako(1) → Mopti(4) : fromStopOrder=1, toStopOrder=4
  @Column({ type: 'int' })
  fromStopOrder: number;

  @Column({ type: 'int' })
  toStopOrder: number;

  // ─── Prix ──────────────────────────────────────────────────
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number; // FCFA

  @Column({ length: 3, default: 'XOF' })
  currency: string;

  @UpdateDateColumn()
  updatedAt: Date;
}

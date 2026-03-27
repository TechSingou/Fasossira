// apps/api/src/routes/entities/route-stop.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { RouteEntity } from './route.entity';

@Entity('route_stops')
@Index(['routeId', 'order'], { unique: true }) // Ordre unique par route
@Index(['companyId'])
export class RouteStopEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ─── Multi-tenancy (dénormalisé pour perf) ─────────────────
  @Column({ type: 'uuid' })
  companyId: string;

  // ─── Relation route ────────────────────────────────────────
  @Column({ type: 'uuid' })
  routeId: string;

  @ManyToOne(() => RouteEntity, (r) => r.stops, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'routeId' })
  route: RouteEntity;

  // ─── Data ──────────────────────────────────────────────────
  @Column({ length: 100 })
  cityName: string; // ex: "Bamako", "Ségou", "San", "Mopti"

  // CRITIQUE : définit l'ordre des segments et le pricing
  // order=1 → premier arrêt (départ), order=N → dernier arrêt (arrivée)
  @Column({ type: 'int' })
  order: number;

  @Column({ type: 'int', default: 0 })
  distanceFromStart: number; // km depuis le premier arrêt
}

// apps/api/src/routes/routes.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoutesController } from './routes.controller';
import { RoutesService } from './routes.service';
import { RouteEntity } from './entities/route.entity';
import { RouteStopEntity } from './entities/route-stop.entity';
import { SegmentPriceEntity } from './entities/segment-price.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RouteEntity,
      RouteStopEntity,
      SegmentPriceEntity,
    ]),
    AuthModule,
  ],
  controllers: [RoutesController],
  providers: [RoutesService],
  exports: [RoutesService], // Exporté pour ReservationsModule (Étape 4)
})
export class RoutesModule {}

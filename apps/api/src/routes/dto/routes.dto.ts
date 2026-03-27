// apps/api/src/routes/dto/routes.dto.ts
import {
  IsString, IsNotEmpty, IsInt, IsOptional,
  IsNumber, Min, IsBoolean, ValidateNested, IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── Route ──────────────────────────────────────────────────

export class CreateRouteDto {
  @ApiProperty({ example: 'Bamako → Mopti' })
  @IsString() @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Route principale nord Mali' })
  @IsString() @IsOptional()
  description?: string;
}

export class UpdateRouteDto {
  @ApiPropertyOptional()
  @IsString() @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString() @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsBoolean() @IsOptional()
  isActive?: boolean;
}

// ─── RouteStop ──────────────────────────────────────────────

export class CreateRouteStopDto {
  @ApiProperty({ example: 'Bamako' })
  @IsString() @IsNotEmpty()
  cityName: string;

  @ApiProperty({ example: 1, description: 'Position dans la route (1-based)' })
  @IsInt() @Min(1)
  order: number;

  @ApiPropertyOptional({ example: 0, description: 'Distance km depuis le départ' })
  @IsInt() @Min(0) @IsOptional()
  distanceFromStart?: number;
}

export class UpdateStopsDto {
  @ApiProperty({ type: [CreateRouteStopDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRouteStopDto)
  stops: CreateRouteStopDto[];
}

// ─── SegmentPrice ───────────────────────────────────────────

export class UpsertSegmentPriceDto {
  @ApiProperty({ example: 1, description: 'order du stop de départ' })
  @IsInt() @Min(1)
  fromStopOrder: number;

  @ApiProperty({ example: 2, description: 'order du stop d\'arrivée' })
  @IsInt() @Min(1) // Min(1) pas Min(2) — la validation from < to est faite dans le service
  toStopOrder: number;

  @ApiProperty({ example: 4500, description: 'Prix en FCFA' })
  @IsNumber() @Min(0)
  price: number;
}

export class BulkUpsertSegmentPricesDto {
  @ApiProperty({ type: [UpsertSegmentPriceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertSegmentPriceDto)
  prices: UpsertSegmentPriceDto[];
}

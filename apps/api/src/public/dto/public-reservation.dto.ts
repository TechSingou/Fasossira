/**
 * apps/api/src/public/dto/public-reservation.dto.ts
 *
 * Fix : ajout du support multi-passagers via PassengerDto[].
 * Le DTO accepte désormais 1 à 10 passagers dans `passengers`.
 */
import {
  IsString, IsNotEmpty, IsUUID, IsInt,
  IsEnum, IsOptional, Min, Max, MinLength, MaxLength,
  ValidateNested, ArrayMinSize, ArrayMaxSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../../shared/types';

/** Un passager avec son siège */
export class PublicPassengerDto {
  @ApiProperty({ example: 14 })
  @IsInt() @Min(1) @Max(200)
  seatNumber: number;

  @ApiProperty({ example: 'Amadou Diallo' })
  @IsString() @IsNotEmpty() @MinLength(2) @MaxLength(150)
  passengerName: string;

  @ApiProperty({ example: '+22376123456' })
  @IsString() @IsNotEmpty() @MaxLength(30)
  passengerPhone: string;
}

export class PublicReservationDto {
  @ApiProperty({ example: 'uuid-du-schedule' })
  @IsUUID()
  scheduleId: string;

  @ApiProperty({ example: 1 })
  @IsInt() @Min(1)
  fromStopOrder: number;

  @ApiProperty({ example: 4 })
  @IsInt() @Min(2)
  toStopOrder: number;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ example: 'OM-123456789' })
  @IsString() @IsOptional() @MaxLength(100)
  externalRef?: string;

  @ApiProperty({ type: [PublicPassengerDto], description: '1 à 10 passagers' })
  @ValidateNested({ each: true })
  @Type(() => PublicPassengerDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  passengers: PublicPassengerDto[];
}

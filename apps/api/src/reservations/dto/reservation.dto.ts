import {
    IsString, IsNotEmpty, IsUUID, IsInt,
    IsEnum, IsOptional, Min, Max,
    MinLength, MaxLength, ValidateNested, ArrayMinSize, ArrayMaxSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { SaleChannel, PaymentMethod } from '../../shared/types';

// ─── Passager individuel dans une réservation groupée ────────

export class PassengerDto {
    @ApiProperty({ example: 14, description: 'Numéro de siège (1..capacity)' })
    @IsInt() @Min(1) @Max(200)
    seatNumber: number;

    @ApiProperty({ example: 'Amadou Diallo' })
    @IsString() @IsNotEmpty() @MinLength(2) @MaxLength(150)
    passengerName: string;

    @ApiProperty({ example: '+22376123456' })
    @IsString() @IsNotEmpty() @MaxLength(30)
    passengerPhone: string;
}

// ─── Réservation unique (1 passager) ─────────────────────────

export class CreateReservationDto {
    @ApiProperty({ example: 'uuid-du-schedule' })
    @IsUUID()
    scheduleId: string;

    @ApiProperty({ example: 14, description: 'Numéro de siège (1..capacity)' })
    @IsInt() @Min(1) @Max(200)
    seatNumber: number;

    @ApiProperty({ example: 1, description: 'order du stop de départ' })
    @IsInt() @Min(1)
    fromStopOrder: number;

    @ApiProperty({ example: 4, description: 'order du stop d\'arrivée' })
    @IsInt() @Min(2)
    toStopOrder: number;

    @ApiProperty({ example: 'Amadou Diallo' })
    @IsString() @IsNotEmpty() @MinLength(2) @MaxLength(150)
    passengerName: string;

    @ApiProperty({ example: '+22376123456' })
    @IsString() @IsNotEmpty() @MaxLength(30)
    passengerPhone: string;

    @ApiProperty({ enum: SaleChannel })
    @IsEnum(SaleChannel)
    saleChannel: SaleChannel;

    @ApiProperty({ enum: PaymentMethod })
    @IsEnum(PaymentMethod)
    paymentMethod: PaymentMethod;

    @ApiPropertyOptional({ example: 'OM-123456789' })
    @IsString() @IsOptional() @MaxLength(100)
    externalRef?: string;
}

// ─── Réservation groupée (N passagers, même voyage & segment) ─
//
// Atomique : si un seul siège est déjà pris, TOUT est rollbacké.
// Tous les passagers partagent : scheduleId, segment, canal, paiement.
// Chaque PassengerDto apporte : seatNumber, passengerName, passengerPhone.

export class CreateBulkReservationsDto {
    @ApiProperty({ example: 'uuid-du-schedule' })
    @IsUUID()
    scheduleId: string;

    @ApiProperty({ example: 1, description: 'order du stop de départ' })
    @IsInt() @Min(1)
    fromStopOrder: number;

    @ApiProperty({ example: 4, description: 'order du stop d\'arrivée' })
    @IsInt() @Min(2)
    toStopOrder: number;

    @ApiProperty({ enum: SaleChannel })
    @IsEnum(SaleChannel)
    saleChannel: SaleChannel;

    @ApiProperty({ enum: PaymentMethod })
    @IsEnum(PaymentMethod)
    paymentMethod: PaymentMethod;

    @ApiPropertyOptional({ example: 'OM-123456789' })
    @IsString() @IsOptional() @MaxLength(100)
    externalRef?: string;

    @ApiProperty({ type: [PassengerDto], description: '1 à 10 passagers' })
    @ValidateNested({ each: true })
    @Type(() => PassengerDto)
    @ArrayMinSize(1)
    @ArrayMaxSize(10)
    passengers: PassengerDto[];
}

// ─── Annulation ───────────────────────────────────────────────

export class CancelReservationDto {
    @ApiPropertyOptional({ example: 'Annulation à la demande du passager' })
    @IsString() @IsOptional() @MaxLength(500)
    reason?: string;
}

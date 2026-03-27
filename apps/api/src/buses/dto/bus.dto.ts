import {
    IsString, IsNotEmpty, IsInt, IsEnum, IsOptional, Min, Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BusType, BusStatus } from '../entities/bus.entity';

export class CreateBusDto {
    @ApiProperty({ example: 'AA-123-BM' })
    @IsString() @IsNotEmpty()
    plate: string;

    @ApiProperty({ example: 'Toyota' })
    @IsString() @IsNotEmpty()
    brand: string;

    @ApiProperty({ example: 'Coaster 2022' })
    @IsString() @IsNotEmpty()
    model: string;

    @ApiProperty({ enum: BusType })
    @IsEnum(BusType)
    type: BusType;

    @ApiProperty({ example: 30 })
    @IsInt() @Min(1) @Max(100)
    capacity: number;
}

export class UpdateBusDto {
    @ApiPropertyOptional()
    @IsString() @IsOptional()
    plate?: string;

    @ApiPropertyOptional()
    @IsString() @IsOptional()
    brand?: string;

    @ApiPropertyOptional()
    @IsString() @IsOptional()
    model?: string;

    @ApiPropertyOptional({ enum: BusType })
    @IsEnum(BusType) @IsOptional()
    type?: BusType;

    @ApiPropertyOptional()
    @IsInt() @Min(1) @Max(100) @IsOptional()
    capacity?: number;

    @ApiPropertyOptional({ enum: BusStatus })
    @IsEnum(BusStatus) @IsOptional()
    status?: BusStatus;
}
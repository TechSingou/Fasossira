import {
    IsString, IsNotEmpty, IsUUID, IsEnum, IsOptional,
    Matches,
    IsArray,
    ArrayMinSize,
    ArrayMaxSize,
    IsInt,
    Min,
    Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ScheduleStatus } from '../entities/schedule.entity';
import { Type } from 'class-transformer';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export class CreateScheduleDto {
    @ApiProperty({ example: 'uuid-du-trip' })
    @IsUUID()
    tripId: string;

    @ApiProperty({ example: 'uuid-du-bus' })
    @IsUUID()
    busId: string;

    @ApiProperty({ example: '2026-03-15' })
    @IsString() @IsNotEmpty()
    @Matches(DATE_REGEX, { message: 'Format YYYY-MM-DD requis' })
    date: string;
}

export class UpdateScheduleDto {
    @ApiPropertyOptional({ example: 'uuid-du-bus' })
    @IsUUID() @IsOptional()
    busId?: string;

    @ApiPropertyOptional({ enum: ScheduleStatus })
    @IsEnum(ScheduleStatus) @IsOptional()
    status?: ScheduleStatus;

    @ApiPropertyOptional({ example: '2026-03-15' })
    @IsString() @IsOptional()
    @Matches(DATE_REGEX, { message: 'Format YYYY-MM-DD requis' })
    date?: string;
}

export class GenerateSchedulesDto {
    @ApiProperty({ example: 'uuid-du-trip' })
    @IsUUID()
    tripId: string;

    @ApiProperty({ example: 'uuid-du-bus' })
    @IsUUID()
    busId: string;

    @ApiProperty({ example: '2026-03-10' })
    @IsString() @Matches(DATE_REGEX, { message: 'Format YYYY-MM-DD requis' })
    startDate: string;

    @ApiProperty({ example: '2026-04-10' })
    @IsString() @Matches(DATE_REGEX, { message: 'Format YYYY-MM-DD requis' })
    endDate: string;

    @ApiProperty({
        example: [1, 3, 5],
        description: '1=Lundi … 7=Dimanche. Vide = tous les jours.',
    })
    @IsArray()
    @ArrayMinSize(1) @ArrayMaxSize(7)
    @IsInt({ each: true }) @Min(1, { each: true }) @Max(7, { each: true })
    @Type(() => Number)
    weekDays: number[]; // ISO : 1=Lun, 7=Dim
}
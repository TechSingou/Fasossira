import {
    IsString, IsNotEmpty, IsUUID, IsOptional, IsBoolean, Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
const TIME_MSG = 'Format HH:mm requis (ex: 06:30)';

export class CreateTripDto {
    @ApiProperty({ example: 'uuid-de-la-route' })
    @IsUUID()
    routeId: string;

    @ApiProperty({ example: '06:30' })
    @IsString() @IsNotEmpty() @Matches(TIME_REGEX, { message: TIME_MSG })
    departureTime: string;

    @ApiProperty({ example: '14:00' })
    @IsString() @IsNotEmpty() @Matches(TIME_REGEX, { message: TIME_MSG })
    arrivalTime: string;
}

export class UpdateTripDto {
    @ApiPropertyOptional()
    @IsString() @Matches(TIME_REGEX, { message: TIME_MSG }) @IsOptional()
    departureTime?: string;

    @ApiPropertyOptional()
    @IsString() @Matches(TIME_REGEX, { message: TIME_MSG }) @IsOptional()
    arrivalTime?: string;

    @ApiPropertyOptional()
    @IsBoolean() @IsOptional()
    isActive?: boolean;
}
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus } from '../../shared/types';

export class UpdatePaymentDto {
    @ApiPropertyOptional({ enum: PaymentStatus })
    @IsEnum(PaymentStatus) @IsOptional()
    status?: PaymentStatus;

    @ApiPropertyOptional({ example: 'OM-123456789' })
    @IsString() @IsOptional() @MaxLength(100)
    externalRef?: string;
}

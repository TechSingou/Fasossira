import {
    IsString, IsNotEmpty, IsOptional, IsBoolean,
    MinLength, MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateAgencyDto {
    @ApiProperty({ example: 'Agence Sogoniko' })
    @IsString() @IsNotEmpty() @MinLength(2) @MaxLength(150)
    name: string;

    @ApiProperty({ example: 'Bamako' })
    @IsString() @IsNotEmpty() @MaxLength(100)
    city: string;

    @ApiPropertyOptional({ example: 'Rue 42, Sogoniko, Bamako' })
    @IsString() @IsOptional() @MaxLength(255)
    address?: string;

    @ApiPropertyOptional({ example: '+22376123456' })
    @IsString() @IsOptional() @MaxLength(30)
    phone?: string;

    @ApiPropertyOptional({ example: 'Aminata Coulibaly' })
    @IsString() @IsOptional() @MaxLength(150)
    managerName?: string;
}

export class UpdateAgencyDto extends PartialType(CreateAgencyDto) {
    @ApiPropertyOptional()
    @IsBoolean() @IsOptional()
    isActive?: boolean;
}

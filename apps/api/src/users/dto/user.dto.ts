import {
    IsString, IsNotEmpty, IsEmail, IsOptional, IsBoolean,
    IsEnum, IsUUID, MinLength, MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { UserRole } from '../../shared/types';

export class CreateUserDto {
    @ApiProperty({ example: 'Amadou Diallo' })
    @IsString() @IsNotEmpty() @MinLength(2) @MaxLength(150)
    name: string;

    @ApiProperty({ example: 'amadou.diallo@sotrama.ml' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'MotDePasse123!', description: 'Min 8 caractères' })
    @IsString() @MinLength(8) @MaxLength(100)
    password: string;

    @ApiProperty({ enum: [UserRole.ADMIN, UserRole.AGENT], description: 'ADMIN ou AGENT' })
    @IsEnum([UserRole.ADMIN, UserRole.AGENT])
    role: UserRole.ADMIN | UserRole.AGENT;

    @ApiPropertyOptional({ description: 'UUID de l\'agence (obligatoire si role=AGENT)' })
    @IsUUID() @IsOptional()
    agencyId?: string;
}

export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['password', 'email'] as const)) {
    @ApiPropertyOptional()
    @IsBoolean() @IsOptional()
    isActive?: boolean;
}

export class ResetPasswordDto {
    @ApiProperty({ example: 'NouveauMotDePasse123!' })
    @IsString() @MinLength(8) @MaxLength(100)
    newPassword: string;
}

export class ChangePasswordDto {
    @ApiProperty()
    @IsString() @IsNotEmpty()
    currentPassword: string;

    @ApiProperty({ example: 'NouveauMotDePasse123!' })
    @IsString() @MinLength(8) @MaxLength(100)
    newPassword: string;
}

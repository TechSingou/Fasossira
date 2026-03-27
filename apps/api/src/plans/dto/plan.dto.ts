// apps/api/src/plans/dto/plan.dto.ts
import {
  IsString, IsNumber, IsArray, IsOptional, IsBoolean,
  MinLength, Min, ArrayNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreatePlanDto {
  @ApiProperty({ example: 'Pro' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 75000, description: 'Prix mensuel en FCFA' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 20, description: 'Nombre max de bus (-1 = illimité)' })
  @IsNumber()
  maxBuses: number;

  @ApiProperty({ example: 10, description: 'Nombre max d\'agences (-1 = illimité)' })
  @IsNumber()
  maxAgencies: number;

  @ApiProperty({ example: 50, description: 'Nombre max d\'utilisateurs (-1 = illimité)' })
  @IsNumber()
  maxUsers: number;

  @ApiProperty({
    example: ['Vente guichet', 'Rapports avancés', 'Multi-agences'],
    description: 'Liste des fonctionnalités incluses',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  features: string[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePlanDto extends PartialType(CreatePlanDto) {}

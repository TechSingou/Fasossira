// apps/api/src/companies/dto/company.dto.ts
import {
  IsString, IsUUID, IsOptional, IsEmail,
  MinLength, Matches, IsHexColor, MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

// ─── Création d'un tenant complet ─────────────────────────────
// Regroupe : Company + CompanySettings + User admin + Subscription
export class CreateCompanyBodyDto {
  @ApiProperty({ example: 'Sotrama Bamako' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({
    example: 'sotrama-bamako',
    description: 'Identifiant URL unique, kebab-case uniquement',
  })
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Le slug ne peut contenir que des lettres minuscules, chiffres et tirets',
  })
  @MinLength(3)
  slug: string;

  @ApiProperty({ example: 'Bamako' })
  @IsString()
  @MinLength(2)
  city: string;

  @ApiProperty({ example: '+223 20 22 33 44' })
  @IsString()
  phone: string;

  @ApiProperty({ description: 'UUID du plan SaaS à assigner' })
  @IsUUID()
  planId: string;

  @ApiProperty({ example: 'admin@sotrama-bamako.ml' })
  @IsEmail()
  adminEmail: string;

  @ApiProperty({ example: 'Koné Traoré' })
  @IsString()
  @MinLength(2)
  adminName: string;

  @ApiPropertyOptional({
    example: 'MonMotDePasse123',
    description: 'Mot de passe admin (optionnel — généré automatiquement si absent, min. 8 caractères)',
  })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit faire au moins 8 caractères' })
  adminPassword?: string;
}

// ─── Changement de plan d'un tenant ──────────────────────────
export class AssignPlanDto {
  @ApiProperty({ description: 'UUID du nouveau plan à assigner' })
  @IsUUID()
  planId: string;
}

// ─── Mise à jour infos société ────────────────────────────────
export class UpdateCompanyInfoDto {
  @ApiPropertyOptional({ example: 'Sotrama Bamako — Nouveau nom' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: 'Ségou' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;
}

// ─── Mise à jour du branding white-label ─────────────────────
export class UpdateCompanySettingsBodyDto {
  @ApiPropertyOptional({ example: 'Sotrama Bamako Express', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  companyDisplayName?: string;

  @ApiPropertyOptional({ example: '#0B3D91', description: 'Couleur principale (hex 6 digits)' })
  @IsOptional()
  @IsHexColor()
  primaryColor?: string;

  @ApiPropertyOptional({ example: '#E63B2E', description: 'Couleur secondaire (hex 6 digits)' })
  @IsOptional()
  @IsHexColor()
  secondaryColor?: string;

  @ApiPropertyOptional({ example: 'Votre sécurité est notre priorité', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  ticketFooter?: string;

  @ApiPropertyOptional({ example: '+223 20 22 33 44', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  supportContact?: string;

  /**
   * Accepte une URL de logo OU null pour supprimer le logo existant.
   * On transforme la chaîne vide en null pour la robustesse.
   */
  @ApiPropertyOptional({ example: '/uploads/logos/logo-123.png', nullable: true })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  logoUrl?: string | null;
}

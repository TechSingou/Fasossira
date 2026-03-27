// apps/api/src/companies/companies.controller.ts
import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  ParseUUIDPipe, UseGuards, UseInterceptors,
  UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../auth/decorators/tenant-scope.decorator';
import { UserRole } from '../shared/types';
import { CreateCompanyBodyDto, AssignPlanDto, UpdateCompanySettingsBodyDto } from './dto/company.dto';
import { PlanLimitsService } from '../common/services/plan-limits.service';

const LOGO_UPLOAD_DIR = join(process.cwd(), 'uploads', 'logos');
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

@ApiTags('Companies')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('companies')
export class CompaniesController {
  constructor(
    private readonly companiesService: CompaniesService,
    private readonly planLimits: PlanLimitsService,
  ) {}

  // ── GET /companies — tous les tenants + usage ─────────────────
  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Lister tous les tenants avec stats d'usage" })
  findAll() {
    return this.companiesService.findAll();
  }

  // ── GET /companies/stats — KPIs dashboard SuperAdmin ─────────
  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Stats globales plateforme (MRR, tenants actifs, nouveaux)' })
  getGlobalStats() {
    return this.companiesService.getGlobalStats();
  }

  // ── GET /companies/me — infos du tenant connecté (Admin) ──────
  // ⚠️ DOIT être avant @Get(':id') pour éviter que NestJS match "me" comme UUID
  @Get('me')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Informations de mon entreprise (Admin)' })
  getMyCompany(@TenantId() companyId: string) {
    return this.companiesService.findOne(companyId);
  }

  // ── GET /companies/me/settings — branding du tenant ───────────
  // ⚠️ DOIT être avant @Get(':id') ET avant @Patch(':id/*')
  // ✅ Accessible ADMIN + AGENT : les agents ont besoin du branding pour
  //    l'interface (couleurs sidebar) et l'impression des tickets
  @Get('me/settings')
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  @ApiOperation({ summary: 'Parametres de branding white-label du tenant (Admin + Agent)' })
  getMySettings(@TenantId() companyId: string) {
    return this.companiesService.getSettings(companyId);
  }

  // ── GET /companies/me/quotas — quotas du tenant connecté ──────
  @Get('me/quotas')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Quotas d'utilisation du plan actuel (Admin)" })
  getMyQuotas(@TenantId() companyId: string) {
    return this.planLimits.getTenantQuotas(companyId);
  }

  // ── PATCH /companies/me/settings — branding white-label ──────
  // ⚠️ DOIT être avant @Patch(':id/...') pour éviter le conflit de route
  @Patch('me/settings')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Mettre a jour le branding white-label de son tenant' })
  updateSettings(
    @TenantId() companyId: string,
    @Body() dto: UpdateCompanySettingsBodyDto,
  ) {
    return this.companiesService.updateSettings(companyId, dto);
  }

  // ── POST /companies/me/logo — upload logo ─────────────────────
  @Post('me/logo')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Uploader le logo (JPEG/PNG/WebP/SVG, max 2 MB)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          if (!existsSync(LOGO_UPLOAD_DIR)) mkdirSync(LOGO_UPLOAD_DIR, { recursive: true });
          cb(null, LOGO_UPLOAD_DIR);
        },
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
          cb(null, `logo-${unique}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME.includes(file.mimetype)) {
          return cb(new BadRequestException('Format non supporte. Utilisez JPEG, PNG, WebP ou SVG.'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: MAX_SIZE_BYTES },
    }),
  )
  async uploadLogo(
    @TenantId() companyId: string,
    @UploadedFile() file: any,
  ) {
    if (!file) throw new BadRequestException('Aucun fichier recu');
    const logoUrl = `/uploads/logos/${file.filename}`;
    return this.companiesService.updateSettings(companyId, { logoUrl });
  }

  // ── DELETE /companies/me/logo — supprimer le logo ────────────
  // ⚠️ DOIT être avant @Get(':id') pour éviter le conflit de route
  @Delete('me/logo')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Supprimer le logo du tenant' })
  deleteLogo(@TenantId() companyId: string) {
    return this.companiesService.updateSettings(companyId, { logoUrl: null });
  }

  // ── GET /companies/:id ────────────────────────────────────────
  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.companiesService.findOne(id);
  }

  // ── POST /companies — creer un tenant complet ─────────────────
  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Creer un nouveau tenant (company + admin + subscription)' })
  create(@Body() dto: CreateCompanyBodyDto) {
    return this.companiesService.create(dto);
  }

  // ── PATCH /companies/:id/suspend ──────────────────────────────
  @Patch(':id/suspend')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Suspendre un tenant' })
  suspend(@Param('id', ParseUUIDPipe) id: string) {
    return this.companiesService.toggleActive(id, false);
  }

  // ── PATCH /companies/:id/activate ────────────────────────────
  @Patch(':id/activate')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Reactiver un tenant suspendu' })
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.companiesService.toggleActive(id, true);
  }

  // ── PATCH /companies/:id/plan — changer de plan ───────────────
  @Patch(':id/plan')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Assigner ou changer le plan d'un tenant" })
  assignPlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignPlanDto,
  ) {
    return this.companiesService.assignPlan(id, dto);
  }
}

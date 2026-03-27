// apps/api/src/companies/companies.service.ts
import {
  Injectable, NotFoundException, ConflictException,
  BadRequestException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CompanyEntity } from './entities/company.entity';
import { CompanySettingsEntity } from './entities/company-settings.entity';
import { SubscriptionEntity } from '../plans/entities/subscription.entity';
import { SubscriptionPlanEntity } from '../plans/entities/subscription-plan.entity';
import { UserEntity } from '../auth/entities/user.entity';
import { AgencyEntity } from '../agencies/entities/agency.entity';
import { BusEntity } from '../buses/entities/bus.entity';
import { UpdateCompanySettingsDto, UserRole, SubscriptionStatus } from '../shared/types';
import { AuthService } from '../auth/auth.service';
import { CreateCompanyBodyDto, AssignPlanDto } from './dto/company.dto';

export interface UsageStats {
  buses: number; agencies: number; users: number;
  maxBuses: number; maxAgencies: number; maxUsers: number;
}

export interface TenantSummary {
  id: string; name: string; slug: string; city: string; phone: string;
  isActive: boolean; createdAt: Date; updatedAt: Date;
  settings: CompanySettingsEntity | null;
  activePlan: SubscriptionPlanEntity | null;
  subscription: SubscriptionEntity | null;
  usage: UsageStats;
}

export interface GlobalStats {
  totalTenants: number; activeTenants: number; suspendedTenants: number;
  mrr: number; newThisMonth: number;
}

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);

  constructor(
    @InjectRepository(CompanyEntity)
    private readonly companyRepo: Repository<CompanyEntity>,
    @InjectRepository(CompanySettingsEntity)
    private readonly settingsRepo: Repository<CompanySettingsEntity>,
    @InjectRepository(SubscriptionEntity)
    private readonly subRepo: Repository<SubscriptionEntity>,
    @InjectRepository(SubscriptionPlanEntity)
    private readonly planRepo: Repository<SubscriptionPlanEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(AgencyEntity)
    private readonly agencyRepo: Repository<AgencyEntity>,
    @InjectRepository(BusEntity)
    private readonly busRepo: Repository<BusEntity>,
    private readonly authService: AuthService,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(): Promise<TenantSummary[]> {
    const companies = await this.companyRepo.find({
      relations: ['settings', 'subscriptions', 'subscriptions.plan'],
      order: { createdAt: 'DESC' },
    });
    return Promise.all(companies.map((c) => this.toTenantSummary(c)));
  }

  async getGlobalStats(): Promise<GlobalStats> {
    const [totalTenants, activeTenants] = await Promise.all([
      this.companyRepo.count(),
      this.companyRepo.count({ where: { isActive: true } }),
    ]);

    const activeSubs = await this.subRepo.find({
      where: { status: SubscriptionStatus.ACTIVE },
      relations: ['plan'],
    });
    const mrr = activeSubs.reduce((sum, s) => sum + Number(s.plan?.price ?? 0), 0);

    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);
    const newThisMonth = await this.companyRepo
      .createQueryBuilder('c')
      .where('c."createdAt" >= :date', { date: firstOfMonth })
      .getCount();

    return { totalTenants, activeTenants, suspendedTenants: totalTenants - activeTenants, mrr, newThisMonth };
  }

  async create(dto: CreateCompanyBodyDto): Promise<{ company: TenantSummary; tempPassword: string }> {
    const slugExists = await this.companyRepo.findOne({ where: { slug: dto.slug } });
    if (slugExists) throw new ConflictException(`Le slug "${dto.slug}" est déjà utilisé`);

    const emailExists = await this.userRepo.findOne({ where: { email: dto.adminEmail.toLowerCase() } });
    if (emailExists) throw new ConflictException(`L'email "${dto.adminEmail}" est déjà utilisé`);

    const plan = await this.planRepo.findOne({ where: { id: dto.planId, isActive: true } });
    if (!plan) throw new BadRequestException('Plan invalide ou inactif');

    const tempPassword = dto.adminPassword ?? this.generateTempPassword();
    const isCustomPassword = !!dto.adminPassword;

    return this.dataSource.transaction(async (manager) => {
      const company = await manager.save(manager.create(CompanyEntity, {
        name: dto.name, slug: dto.slug, city: dto.city, phone: dto.phone, isActive: true,
      }));

      await manager.save(manager.create(CompanySettingsEntity, {
        companyId: company.id,
        companyDisplayName: dto.name,
        primaryColor: '#0B3D91',
        secondaryColor: '#E63B2E',
        ticketFooter: `${dto.name} — Votre sécurité est notre priorité`,
        supportContact: dto.phone,
      }));

      const hashedPassword = await this.authService.hashPassword(tempPassword);
      await manager.save(manager.create(UserEntity, {
        companyId: company.id,
        name: dto.adminName,
        email: dto.adminEmail.toLowerCase(),
        password: hashedPassword,
        role: UserRole.ADMIN,
        agencyId: null,
        isActive: true,
      }));

      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);
      await manager.save(manager.create(SubscriptionEntity, {
        companyId: company.id, planId: plan.id,
        startDate, endDate, status: SubscriptionStatus.ACTIVE,
      }));

      this.logger.log(`Tenant créé : ${company.slug} | Plan : ${plan.name} | Password: ${isCustomPassword ? 'custom' : tempPassword}`);

      const full = await manager.findOne(CompanyEntity, {
        where: { id: company.id },
        relations: ['settings', 'subscriptions', 'subscriptions.plan'],
      });
      if (!full) throw new Error(`Company ${company.id} not found after creation`);
      return { company: await this.toTenantSummary(full), tempPassword: isCustomPassword ? null : tempPassword };
    });
  }

  async findOne(companyId: string): Promise<TenantSummary> {
    const company = await this.companyRepo.findOne({
      where: { id: companyId },
      relations: ['settings', 'subscriptions', 'subscriptions.plan'],
    });
    if (!company) throw new NotFoundException('Compagnie introuvable');
    return this.toTenantSummary(company);
  }

  async assignPlan(companyId: string, dto: AssignPlanDto): Promise<SubscriptionEntity> {
    const company = await this.companyRepo.findOne({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Compagnie introuvable');

    const plan = await this.planRepo.findOne({ where: { id: dto.planId, isActive: true } });
    if (!plan) throw new BadRequestException('Plan invalide ou inactif');

    await this.subRepo.update(
      { companyId, status: SubscriptionStatus.ACTIVE },
      { status: SubscriptionStatus.EXPIRED },
    );

    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    const saved = await this.subRepo.save(
      this.subRepo.create({ companyId, planId: dto.planId, startDate, endDate, status: SubscriptionStatus.ACTIVE }),
    );
    this.logger.log(`Plan changé : ${company.slug} → ${plan.name}`);
    return saved;
  }

  async toggleActive(companyId: string, isActive: boolean): Promise<CompanyEntity> {
    const company = await this.companyRepo.findOne({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Compagnie introuvable');
    company.isActive = isActive;
    const saved = await this.companyRepo.save(company);
    this.logger.log(`Tenant ${isActive ? 'réactivé' : 'suspendu'} : ${company.slug}`);
    return saved;
  }

  async getSettings(companyId: string): Promise<CompanySettingsEntity> {
    const settings = await this.settingsRepo.findOne({ where: { companyId } });
    if (!settings) throw new NotFoundException('Parametres introuvables');
    return settings;
  }

  async updateSettings(companyId: string, dto: UpdateCompanySettingsDto) {
    const settings = await this.settingsRepo.findOne({ where: { companyId } });
    if (!settings) throw new NotFoundException('Parametres introuvables');
    Object.assign(settings, dto);
    return this.settingsRepo.save(settings);
  }

  private getActiveSub(subs: SubscriptionEntity[]): SubscriptionEntity | undefined {
    return subs?.find((s) => s.status === SubscriptionStatus.ACTIVE);
  }

  private async toTenantSummary(company: CompanyEntity): Promise<TenantSummary> {
    const [buses, agencies, users] = await Promise.all([
      this.busRepo.count({ where: { companyId: company.id } }),
      this.agencyRepo.count({ where: { companyId: company.id } }),
      this.userRepo.count({ where: { companyId: company.id } }),
    ]);
    const activeSub = this.getActiveSub(company.subscriptions ?? []);
    return {
      id: company.id, name: company.name, slug: company.slug,
      city: company.city, phone: company.phone,
      isActive: company.isActive, createdAt: company.createdAt, updatedAt: company.updatedAt,
      settings: company.settings ?? null,
      activePlan: activeSub?.plan ?? null,
      subscription: activeSub ?? null,
      usage: {
        buses, agencies, users,
        maxBuses:    activeSub?.plan?.maxBuses    ?? 0,
        maxAgencies: activeSub?.plan?.maxAgencies ?? 0,
        maxUsers:    activeSub?.plan?.maxUsers    ?? 0,
      },
    };
  }

  private generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }
}

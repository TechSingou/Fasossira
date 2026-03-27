import { Repository } from 'typeorm';
import { AgencyEntity } from './entities/agency.entity';
import { UserEntity } from '../auth/entities/user.entity';
import { CreateAgencyDto, UpdateAgencyDto } from './dto/agency.dto';
import { PlanLimitsService } from '../common/services/plan-limits.service';
export interface AgentSummary {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    createdAt: Date;
}
export interface AgencyWithStats extends AgencyEntity {
    agentCount: number;
    activeAgentCount: number;
}
export declare class AgenciesService {
    private readonly agencyRepo;
    private readonly userRepo;
    private readonly planLimits;
    private readonly logger;
    constructor(agencyRepo: Repository<AgencyEntity>, userRepo: Repository<UserEntity>, planLimits: PlanLimitsService);
    findAll(companyId: string, onlyActive?: boolean): Promise<AgencyWithStats[]>;
    findOne(companyId: string, id: string): Promise<AgencyWithStats>;
    findAgents(companyId: string, agencyId: string): Promise<AgentSummary[]>;
    create(companyId: string, dto: CreateAgencyDto): Promise<AgencyEntity>;
    update(companyId: string, id: string, dto: UpdateAgencyDto): Promise<AgencyEntity>;
    remove(companyId: string, id: string): Promise<{
        message: string;
    }>;
}

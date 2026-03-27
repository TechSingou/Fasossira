import { AgenciesService } from './agencies.service';
import { CreateAgencyDto, UpdateAgencyDto } from './dto/agency.dto';
export declare class AgenciesController {
    private readonly agenciesService;
    constructor(agenciesService: AgenciesService);
    findAll(companyId: string, active?: string): Promise<import("./agencies.service").AgencyWithStats[]>;
    findOne(companyId: string, id: string): Promise<import("./agencies.service").AgencyWithStats>;
    findAgents(companyId: string, id: string): Promise<import("./agencies.service").AgentSummary[]>;
    create(companyId: string, dto: CreateAgencyDto): Promise<import("./entities/agency.entity").AgencyEntity>;
    update(companyId: string, id: string, dto: UpdateAgencyDto): Promise<import("./entities/agency.entity").AgencyEntity>;
    remove(companyId: string, id: string): Promise<{
        message: string;
    }>;
}

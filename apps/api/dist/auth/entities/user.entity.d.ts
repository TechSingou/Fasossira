import { UserRole } from '../../shared/types';
import { CompanyEntity } from '../../companies/entities/company.entity';
import { AgencyEntity } from '../../agencies/entities/agency.entity';
export declare class UserEntity {
    id: string;
    companyId: string | null;
    company: CompanyEntity;
    agencyId: string | null;
    agency: AgencyEntity | null;
    name: string;
    email: string;
    password: string;
    role: UserRole;
    isActive: boolean;
    refreshTokenHash: string | null;
    createdAt: Date;
    updatedAt: Date;
}

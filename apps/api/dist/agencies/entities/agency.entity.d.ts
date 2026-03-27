import { CompanyEntity } from '../../companies/entities/company.entity';
export declare class AgencyEntity {
    id: string;
    companyId: string;
    company: CompanyEntity;
    name: string;
    city: string;
    address: string | null;
    phone: string | null;
    managerName: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

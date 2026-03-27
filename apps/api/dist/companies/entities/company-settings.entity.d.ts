import { CompanyEntity } from './company.entity';
export declare class CompanySettingsEntity {
    id: string;
    companyId: string;
    company: CompanyEntity;
    logoUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
    companyDisplayName: string;
    ticketFooter: string;
    supportContact: string;
    updatedAt: Date;
}

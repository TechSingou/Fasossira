export declare class CreateCompanyBodyDto {
    name: string;
    slug: string;
    city: string;
    phone: string;
    planId: string;
    adminEmail: string;
    adminName: string;
    adminPassword?: string;
}
export declare class AssignPlanDto {
    planId: string;
}
export declare class UpdateCompanyInfoDto {
    name?: string;
    city?: string;
    phone?: string;
}
export declare class UpdateCompanySettingsBodyDto {
    companyDisplayName?: string;
    primaryColor?: string;
    secondaryColor?: string;
    ticketFooter?: string;
    supportContact?: string;
    logoUrl?: string | null;
}

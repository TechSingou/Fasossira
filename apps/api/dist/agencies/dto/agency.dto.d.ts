export declare class CreateAgencyDto {
    name: string;
    city: string;
    address?: string;
    phone?: string;
    managerName?: string;
}
declare const UpdateAgencyDto_base: import("@nestjs/common").Type<Partial<CreateAgencyDto>>;
export declare class UpdateAgencyDto extends UpdateAgencyDto_base {
    isActive?: boolean;
}
export {};

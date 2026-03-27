export declare class CreatePlanDto {
    name: string;
    price: number;
    maxBuses: number;
    maxAgencies: number;
    maxUsers: number;
    features: string[];
    isActive?: boolean;
}
declare const UpdatePlanDto_base: import("@nestjs/common").Type<Partial<CreatePlanDto>>;
export declare class UpdatePlanDto extends UpdatePlanDto_base {
}
export {};

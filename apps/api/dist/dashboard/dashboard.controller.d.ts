import { DashboardService } from './dashboard.service';
export declare enum PeriodPreset {
    TODAY = "today",
    WEEK = "week",
    MONTH = "month",
    CUSTOM = "custom"
}
export declare class DashboardQueryDto {
    period?: PeriodPreset;
    from?: string;
    to?: string;
}
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getStats(companyId: string, query: DashboardQueryDto): Promise<import("./dashboard.service").DashboardStats>;
}

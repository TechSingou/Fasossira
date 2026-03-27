export declare enum UserRole {
    SUPER_ADMIN = "SUPER_ADMIN",
    ADMIN = "ADMIN",
    AGENT = "AGENT"
}
export declare enum SubscriptionStatus {
    ACTIVE = "ACTIVE",
    EXPIRED = "EXPIRED",
    SUSPENDED = "SUSPENDED"
}
export declare enum BusStatus {
    ACTIVE = "ACTIVE",
    MAINTENANCE = "MAINTENANCE",
    RETIRED = "RETIRED"
}
export declare enum ScheduleStatus {
    SCHEDULED = "SCHEDULED",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}
export declare enum SaleChannel {
    AGENCY = "AGENCY",
    ON_ROUTE = "ON_ROUTE",
    ONLINE = "ONLINE"
}
export declare enum ReservationStatus {
    CONFIRMED = "CONFIRMED",
    CANCELLED = "CANCELLED"
}
export declare enum PaymentMethod {
    CASH = "CASH",
    MOBILE_MONEY_ORANGE = "MOBILE_MONEY_ORANGE",
    MOBILE_MONEY_MOOV = "MOBILE_MONEY_MOOV",
    CARD = "CARD"
}
export declare enum PaymentStatus {
    PAID = "PAID",
    PENDING = "PENDING",
    REFUNDED = "REFUNDED"
}
export interface JwtPayload {
    sub: string;
    email: string;
    role: UserRole;
    companyId: string;
    tenantId: string;
    iat?: number;
    exp?: number;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: {
        id: string;
        name: string;
        email: string;
        role: UserRole;
        companyId: string | null;
    };
}
export interface LoginDto {
    email: string;
    password: string;
}
export interface RefreshTokenDto {
    refreshToken: string;
}
export interface CreateCompanyDto {
    name: string;
    slug: string;
    city: string;
    phone: string;
    planId: string;
    adminEmail: string;
    adminName: string;
}
export interface UpdateCompanySettingsDto {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    companyDisplayName?: string;
    ticketFooter?: string;
    supportContact?: string;
}
export interface CreateUserDto {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    agencyId?: string;
}
export declare function segmentsOverlap(fromA: number, toA: number, fromB: number, toB: number): boolean;

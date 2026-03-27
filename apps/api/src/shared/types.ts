// ============================================================
// FASOSSIRA — Types partagés (copie locale pour l'API)
// Source : libs/shared-types/src/models/index.ts
// ⚠️  Ne pas modifier ici — modifier dans libs/shared-types
//     puis resynchroniser avec : npm run sync:types
// ============================================================

// ─── ENUMS ──────────────────────────────────────────────────

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  AGENT = 'AGENT',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  SUSPENDED = 'SUSPENDED',
}

export enum BusStatus {
  ACTIVE = 'ACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  RETIRED = 'RETIRED',
}

export enum ScheduleStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum SaleChannel {
  AGENCY = 'AGENCY',
  ON_ROUTE = 'ON_ROUTE',
  ONLINE = 'ONLINE',
}

export enum ReservationStatus {
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  MOBILE_MONEY_ORANGE = 'MOBILE_MONEY_ORANGE',
  MOBILE_MONEY_MOOV = 'MOBILE_MONEY_MOOV',
  CARD = 'CARD',
}

export enum PaymentStatus {
  PAID = 'PAID',
  PENDING = 'PENDING',
  REFUNDED = 'REFUNDED',
}

// ─── AUTH ───────────────────────────────────────────────────

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

// ─── DTOs ───────────────────────────────────────────────────

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

// ─── SEGMENT OVERLAP (logique critique MVP §7.1) ─────────────

export function segmentsOverlap(
  fromA: number, toA: number,
  fromB: number, toB: number,
): boolean {
  return fromA < toB && toA > fromB;
}

// =============================================================
// FASOSSIRA — Shared Types (libs/shared-types/src/models)
// Utilisés côté NestJS (entities) ET Angular (interfaces)
// =============================================================

// ─── ENUMS ────────────────────────────────────────────────────

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
  ONLINE = 'ONLINE',   // ← portail public
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

// ─── PLATFORM & MULTI-TENANT ─────────────────────────────────

export interface Company {
  id: string;
  name: string;
  slug: string;           // Sous-domaine unique
  city: string;
  phone: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionPlan {
  id: string;
  name: string;           // Starter | Pro | Enterprise
  price: number;          // FCFA / mois
  maxBuses: number;
  maxAgencies: number;
  maxUsers: number;
  features: string[];
}

export interface Subscription {
  id: string;
  companyId: string;
  planId: string;
  plan?: SubscriptionPlan;
  startDate: Date;
  endDate: Date;
  status: SubscriptionStatus;
}

export interface CompanySettings {
  id: string;
  companyId: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  companyDisplayName: string;
  ticketFooter: string;
  supportContact: string;
}

// ─── USERS & AGENCIES ────────────────────────────────────────

export interface User {
  id: string;
  companyId: string;
  agencyId: string | null;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
}

export interface Agency {
  id: string;
  companyId: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  isActive: boolean;
}

// ─── FLEET ───────────────────────────────────────────────────

export interface Bus {
  id: string;
  companyId: string;
  plate: string;
  brand: string;
  model: string;
  capacity: number;
  status: BusStatus;
}

// ─── TRANSPORT NETWORK ───────────────────────────────────────

export interface Route {
  id: string;
  companyId: string;
  name: string;
  description: string;
  stops?: RouteStop[];
  segmentPrices?: SegmentPrice[];
}

export interface RouteStop {
  id: string;
  routeId: string;
  cityName: string;
  order: number;            // 1-based, determines valid segments
  distanceFromStart: number; // km
}

export interface SegmentPrice {
  id: string;
  routeId: string;
  fromStopOrder: number;
  toStopOrder: number;
  price: number;            // FCFA
  currency: string;         // 'XOF'
}

export interface Trip {
  id: string;
  companyId: string;
  routeId: string;
  route?: Route;
  departureTime: string;    // 'HH:mm'
  arrivalTime: string;      // 'HH:mm'
  busId: string | null;     // Bus par défaut (optionnel)
}

export interface Schedule {
  id: string;
  companyId: string;
  tripId: string;
  trip?: Trip;
  busId: string;
  bus?: Bus;
  date: string;             // 'YYYY-MM-DD'
  departureDateTime: Date;
  status: ScheduleStatus;
  reservationsCount?: number;   // Computed
  availableSeats?: number;      // Computed
}

// ─── RESERVATIONS ────────────────────────────────────────────

export interface Reservation {
  id: string;
  companyId: string;
  scheduleId: string;
  schedule?: Schedule;
  agencyId: string;
  agentId: string;
  seatNumber: number;
  fromStopOrder: number;    // Segment start (CRITICAL for overlap logic)
  toStopOrder: number;      // Segment end   (CRITICAL for overlap logic)
  saleChannel: SaleChannel;
  passengerName: string;
  passengerPhone: string;
  amount: number;
  status: ReservationStatus;
  createdAt: Date;
  payment?: Payment;
  ticket?: Ticket;
}

export interface Payment {
  id: string;
  reservationId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt: Date | null;
  mobileMoneyRef?: string;  // Référence Orange/Moov Money
}

export interface Ticket {
  id: string;
  reservationId: string;
  reference: string;        // REF-{YEAR}-{8_CHARS}
  qrCode: string;           // Base64 encoded QR
  issuedAt: Date;
  printCount: number;
}

// ─── API RESPONSES ────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ─── AUTH ─────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string;          // userId
  email: string;
  role: UserRole;
  companyId: string;    // null pour SUPER_ADMIN
  tenantId: string;     // alias companyId pour clarté
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: Pick<User, 'id' | 'name' | 'email' | 'role' | 'companyId'>;
}

// ─── SEAT AVAILABILITY (logique critique MVP 7.1) ─────────────

export interface SeatStatus {
  seatNumber: number;
  status: 'FREE' | 'OCCUPIED';
}

/**
 * Vérifie si deux segments de sièges se chevauchent.
 * Logique MVP section 7.1 : un siège est occupé si une réservation ACTIVE
 * existe avec un chevauchement : fromA < toB && toA > fromB
 */
export function segmentsOverlap(
  fromA: number, toA: number,
  fromB: number, toB: number
): boolean {
  return fromA < toB && toA > fromB;
}

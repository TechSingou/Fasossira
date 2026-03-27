// =============================================================
// FASOSSIRA — DTOs partagés (Request / Response)
// Utilisés pour la validation NestJS et le typage Angular
// =============================================================

import { UserRole, PaymentMethod, SaleChannel, ScheduleStatus } from '../models';

// ─── AUTH ─────────────────────────────────────────────────────

export interface LoginDto {
  email: string;
  password: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

// ─── COMPANIES ────────────────────────────────────────────────

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

// ─── USERS ────────────────────────────────────────────────────

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  agencyId?: string;
}

// ─── BUSES ────────────────────────────────────────────────────

export interface CreateBusDto {
  plate: string;
  brand: string;
  model: string;
  capacity: number;
}

// ─── ROUTES ───────────────────────────────────────────────────

export interface CreateRouteDto {
  name: string;
  description?: string;
}

export interface CreateRouteStopDto {
  cityName: string;
  order: number;
  distanceFromStart: number;
}

export interface UpsertSegmentPriceDto {
  fromStopOrder: number;
  toStopOrder: number;
  price: number;
}

// ─── TRIPS & SCHEDULES ────────────────────────────────────────

export interface CreateTripDto {
  routeId: string;
  departureTime: string;  // 'HH:mm'
  arrivalTime: string;    // 'HH:mm'
  busId?: string;
}

export interface CreateScheduleDto {
  tripId: string;
  busId: string;
  date: string;           // 'YYYY-MM-DD'
}

export interface GetAvailableSchedulesDto {
  fromStopOrder: number;
  toStopOrder: number;
  date: string;
}

// ─── RESERVATIONS ─────────────────────────────────────────────

export interface CreateReservationDto {
  scheduleId: string;
  seatNumber: number;
  fromStopOrder: number;
  toStopOrder: number;
  saleChannel: SaleChannel;
  passengerName: string;
  passengerPhone: string;
  paymentMethod: PaymentMethod;
  mobileMoneyRef?: string;  // Si Orange/Moov Money
}

// ─── QUERY PARAMS ─────────────────────────────────────────────

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface ScheduleQuery extends PaginationQuery {
  date?: string;
  routeId?: string;
  status?: ScheduleStatus;
}

export interface ReservationQuery extends PaginationQuery {
  scheduleId?: string;
  agencyId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;        // nom passager ou référence billet
}

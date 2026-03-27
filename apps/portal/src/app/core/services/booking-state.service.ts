// apps/portal/src/app/core/services/booking-state.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { PublicSchedule, PublicReservationResult } from './public-search.service';

export interface BookingPassenger {
  seatNumber:     number;
  passengerName:  string;
  passengerPhone: string;
}

export interface BookingState {
  schedule:      PublicSchedule | null;
  fromStopOrder: number;
  toStopOrder:   number;
  fromCityName:  string;
  toCityName:    string;
  passengers:    BookingPassenger[];
  paymentMethod: string;
  result:        PublicReservationResult | null;
}

const KEY   = 'fas_portal_booking';
const EMPTY: BookingState = {
  schedule: null, fromStopOrder: 0, toStopOrder: 0,
  fromCityName: '', toCityName: '',
  passengers: [], paymentMethod: 'CASH', result: null,
};

@Injectable({ providedIn: 'root' })
export class BookingStateService {
  private readonly _state = signal<BookingState>(this._load());

  readonly state    = this._state.asReadonly();
  readonly schedule = computed(() => this._state().schedule);
  readonly result   = computed(() => this._state().result);

  setSchedule(s: PublicSchedule, from: number, to: number, fromCity: string, toCity: string): void {
    this._patch({ schedule: s, fromStopOrder: from, toStopOrder: to, fromCityName: fromCity, toCityName: toCity, passengers: [] });
  }
  setPassengers(passengers: BookingPassenger[]): void { this._patch({ passengers }); }
  setPayment(paymentMethod: string): void              { this._patch({ paymentMethod }); }
  setResult(result: PublicReservationResult): void     { this._patch({ result }); }

  reset(): void { sessionStorage.removeItem(KEY); this._state.set({ ...EMPTY }); }

  private _patch(partial: Partial<BookingState>): void {
    const next = { ...this._state(), ...partial };
    this._state.set(next);
    try { sessionStorage.setItem(KEY, JSON.stringify(next)); } catch { /* quota */ }
  }

  private _load(): BookingState {
    try {
      const raw = sessionStorage.getItem(KEY);
      return raw ? { ...EMPTY, ...JSON.parse(raw) } : { ...EMPTY };
    } catch { return { ...EMPTY }; }
  }
}

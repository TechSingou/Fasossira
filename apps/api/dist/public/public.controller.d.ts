import { PublicService } from './public.service';
import { PublicReservationDto } from './dto/public-reservation.dto';
export declare class PublicController {
    private readonly publicService;
    constructor(publicService: PublicService);
    search(date: string, fromStop?: string, toStop?: string, companySlug?: string): Promise<{
        scheduleId: string;
        date: string;
        departureDateTime: Date;
        arrivalDateTime: Date;
        status: import("../schedules/entities/schedule.entity").ScheduleStatus;
        totalSeats: number;
        availableSeats: number;
        company: {
            id: string;
            name: string;
            slug: string;
            city: string;
            primaryColor: string;
            logoUrl: string;
        };
        trip: {
            departureTime: string;
            arrivalTime: string;
            route: {
                id: string;
                name: string;
                stops: {
                    id: string;
                    order: number;
                    cityName: string;
                }[];
            };
        };
        bus: {
            plate: string;
            capacity: number;
        };
    }[]>;
    getSeatMap(scheduleId: string, from: number, to: number): Promise<{
        scheduleId: string;
        totalSeats: number;
        fromStopOrder: number;
        toStopOrder: number;
        seats: {
            seatNumber: number;
            status: string;
        }[];
        availableCount: number;
    }>;
    createReservation(dto: PublicReservationDto): Promise<{
        count: number;
        totalAmount: number;
        currency: string;
        fromCityName: string;
        toCityName: string;
        reservations: {
            reference: string;
            passengerName: string;
            passengerPhone: string;
            seatNumber: number;
            amount: number;
            currency: string;
            status: import("../shared/types").ReservationStatus;
            createdAt: Date;
        }[];
    }>;
    getTicket(reference: string, phone: string): Promise<{
        reference: string;
        passengerName: string;
        passengerPhone: string;
        seatNumber: number;
        fromCityName: string;
        toCityName: string;
        departureDateTime: Date;
        arrivalDateTime: Date;
        busPlate: string;
        amount: number;
        currency: string;
        paymentMethod: string;
        status: import("../shared/types").ReservationStatus;
        createdAt: Date;
        company: {
            name: string;
            primaryColor: string;
            logoUrl: string;
        };
    }>;
}

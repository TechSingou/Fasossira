import { ReservationEntity } from '../../reservations/entities/reservation.entity';
import { PaymentMethod, PaymentStatus } from '../../shared/types';
export declare class PaymentEntity {
    id: string;
    companyId: string;
    reservationId: string;
    reservation: ReservationEntity;
    amount: number;
    currency: string;
    method: PaymentMethod;
    status: PaymentStatus;
    externalRef: string | null;
    paidAt: Date;
    updatedAt: Date;
}

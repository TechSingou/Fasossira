import { PaymentsService } from './payments.service';
import { UpdatePaymentDto } from './dto/payment.dto';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    findAll(companyId: string, date?: string): Promise<import("./entities/payment.entity").PaymentEntity[]>;
    findByReservation(companyId: string, reservationId: string): Promise<import("./entities/payment.entity").PaymentEntity>;
    update(companyId: string, id: string, dto: UpdatePaymentDto): Promise<import("./entities/payment.entity").PaymentEntity>;
}

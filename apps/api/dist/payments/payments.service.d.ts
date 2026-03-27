import { Repository } from 'typeorm';
import { PaymentEntity } from './entities/payment.entity';
import { UpdatePaymentDto } from './dto/payment.dto';
export declare class PaymentsService {
    private readonly paymentRepo;
    private readonly logger;
    constructor(paymentRepo: Repository<PaymentEntity>);
    findByReservation(companyId: string, reservationId: string): Promise<PaymentEntity>;
    findAll(companyId: string, date?: string): Promise<PaymentEntity[]>;
    update(companyId: string, id: string, dto: UpdatePaymentDto): Promise<PaymentEntity>;
}

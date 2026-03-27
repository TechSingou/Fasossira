import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentEntity } from './entities/payment.entity';
import { UpdatePaymentDto } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);

    constructor(
        @InjectRepository(PaymentEntity)
        private readonly paymentRepo: Repository<PaymentEntity>,
    ) { }

    async findByReservation(companyId: string, reservationId: string) {
        const payment = await this.paymentRepo.findOne({
            where: { reservationId, companyId },
        });
        if (!payment) throw new NotFoundException('Paiement introuvable');
        return payment;
    }

    async findAll(companyId: string, date?: string) {
        const qb = this.paymentRepo
            .createQueryBuilder('p')
            .leftJoinAndSelect('p.reservation', 'r')
            .where('p.companyId = :companyId', { companyId })
            .orderBy('p.paidAt', 'DESC');

        if (date) {
            qb.andWhere('DATE(p.paidAt) = :date', { date });
        }

        return qb.getMany();
    }

    async update(companyId: string, id: string, dto: UpdatePaymentDto) {
        const payment = await this.paymentRepo.findOne({ where: { id, companyId } });
        if (!payment) throw new NotFoundException('Paiement introuvable');

        await this.paymentRepo.update({ id, companyId }, dto);
        this.logger.log(`Paiement ${id} mis à jour — statut : ${dto.status ?? 'inchangé'}`);
        return this.paymentRepo.findOne({ where: { id, companyId } });
    }
}

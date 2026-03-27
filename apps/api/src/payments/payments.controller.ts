import {
    Controller, Get, Patch,
    Param, Query, Body, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { UpdatePaymentDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../auth/decorators/tenant-scope.decorator';
import { UserRole } from '../shared/types';

@ApiTags('Payments')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Get()
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Lister les paiements du jour (admin)' })
    @ApiQuery({ name: 'date', required: false, description: 'YYYY-MM-DD' })
    findAll(
        @TenantId() companyId: string,
        @Query('date') date?: string,
    ) {
        return this.paymentsService.findAll(companyId, date);
    }

    @Get('reservation/:reservationId')
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiOperation({ summary: 'Paiement lié à une réservation' })
    findByReservation(
        @TenantId() companyId: string,
        @Param('reservationId', ParseUUIDPipe) reservationId: string,
    ) {
        return this.paymentsService.findByReservation(companyId, reservationId);
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Mettre à jour un paiement (statut, ref externe)' })
    update(
        @TenantId() companyId: string,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdatePaymentDto,
    ) {
        return this.paymentsService.update(companyId, id, dto);
    }
}

import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../auth/decorators/tenant-scope.decorator';
import { UserRole } from '../shared/types';

@ApiTags('Tickets')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tickets')
export class TicketsController {
    constructor(private readonly ticketsService: TicketsService) { }

    @Get(':reference')
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiOperation({ summary: 'Récupérer un billet par sa référence (impression / QR code)' })
    @ApiParam({ name: 'reference', example: 'REF-2026-A7F2K1PB' })
    getTicket(
        @TenantId() companyId: string,
        @Param('reference') reference: string,
    ) {
        return this.ticketsService.getTicket(companyId, reference);
    }
}

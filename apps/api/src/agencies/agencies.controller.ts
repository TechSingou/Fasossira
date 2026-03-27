import {
    Controller, Get, Post, Patch, Delete,
    Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AgenciesService } from './agencies.service';
import { CreateAgencyDto, UpdateAgencyDto } from './dto/agency.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../auth/decorators/tenant-scope.decorator';
import { UserRole } from '../shared/types';

@ApiTags('Agencies')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('agencies')
export class AgenciesController {
    constructor(private readonly agenciesService: AgenciesService) { }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiOperation({ summary: 'Lister toutes les agences du tenant' })
    @ApiQuery({ name: 'active', required: false, type: Boolean })
    findAll(
        @TenantId() companyId: string,
        @Query('active') active?: string,
    ) {
        return this.agenciesService.findAll(companyId, active === 'true');
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiOperation({ summary: 'Détail d\'une agence avec compteurs' })
    findOne(
        @TenantId() companyId: string,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.agenciesService.findOne(companyId, id);
    }

    @Get(':id/agents')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Lister les agents d\'une agence' })
    findAgents(
        @TenantId() companyId: string,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.agenciesService.findAgents(companyId, id);
    }

    @Post()
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Créer une agence' })
    create(
        @TenantId() companyId: string,
        @Body() dto: CreateAgencyDto,
    ) {
        return this.agenciesService.create(companyId, dto);
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Modifier une agence' })
    update(
        @TenantId() companyId: string,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateAgencyDto,
    ) {
        return this.agenciesService.update(companyId, id, dto);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Supprimer une agence (seulement si aucun agent rattaché)' })
    remove(
        @TenantId() companyId: string,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.agenciesService.remove(companyId, id);
    }
}

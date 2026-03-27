import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TripsService } from './trips.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../auth/decorators/tenant-scope.decorator';
import { UserRole } from '../shared/types';
import { CreateTripDto, UpdateTripDto } from './dto/trip.dto';

@ApiTags('Trips')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) { }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  findAll(@TenantId() companyId: string) {
    return this.tripsService.findAll(companyId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  findOne(
    @TenantId() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tripsService.findOne(companyId, id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Créer un modèle de trip (route + horaire)' })
  create(
    @TenantId() companyId: string,
    @Body() dto: CreateTripDto,
  ) {
    return this.tripsService.create(companyId, dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(
    @TenantId() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTripDto,
  ) {
    return this.tripsService.update(companyId, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(
    @TenantId() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tripsService.remove(companyId, id);
  }
}
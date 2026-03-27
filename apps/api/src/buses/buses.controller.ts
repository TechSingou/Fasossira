import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards, ParseUUIDPipe,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { BusesService } from './buses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../auth/decorators/tenant-scope.decorator';
import { UserRole } from '../shared/types';
import { CreateBusDto, UpdateBusDto } from './dto/bus.dto';
import { BusStatus } from './entities/bus.entity';

@ApiTags('Flotte')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('buses')
export class BusesController {
  constructor(private readonly busesService: BusesService) { }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  @ApiOperation({ summary: 'Lister tous les bus du tenant' })
  findAll(@TenantId() companyId: string) {
    return this.busesService.findAll(companyId);
  }

  @Get('active')
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  @ApiOperation({ summary: 'Bus actifs uniquement' })
  findActive(@TenantId() companyId: string) {
    return this.busesService.findAll(companyId, BusStatus.ACTIVE);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  findOne(
    @TenantId() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.busesService.findOne(companyId, id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Ajouter un bus à la flotte' })
  create(
    @TenantId() companyId: string,
    @Body() dto: CreateBusDto,
  ) {
    return this.busesService.create(companyId, dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(
    @TenantId() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBusDto,
  ) {
    return this.busesService.update(companyId, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(
    @TenantId() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.busesService.remove(companyId, id);
  }
}
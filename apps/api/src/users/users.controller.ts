import {
    Controller, Get, Post, Patch, Delete,
    Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import {
    CreateUserDto, UpdateUserDto,
    ResetPasswordDto, ChangePasswordDto,
} from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../auth/decorators/tenant-scope.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, JwtPayload } from '../shared/types';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Lister tous les utilisateurs du tenant' })
    @ApiQuery({ name: 'agencyId', required: false })
    @ApiQuery({ name: 'role', required: false, enum: [UserRole.ADMIN, UserRole.AGENT] })
    @ApiQuery({ name: 'isActive', required: false, type: Boolean })
    findAll(
        @TenantId() companyId: string,
        @Query('agencyId') agencyId?: string,
        @Query('role') role?: UserRole,
        @Query('isActive') isActive?: string,
    ) {
        const activeFilter = isActive === undefined ? undefined : isActive === 'true';
        return this.usersService.findAll(companyId, { agencyId, role, isActive: activeFilter });
    }

    @Get('me')
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiOperation({ summary: 'Profil de l\'utilisateur connecté' })
    getMe(
        @TenantId() companyId: string,
        @CurrentUser() user: JwtPayload,
    ) {
        return this.usersService.findOne(companyId, user.sub);
    }

    @Patch('me/change-password')
    @Roles(UserRole.ADMIN, UserRole.AGENT)
    @ApiOperation({ summary: 'Changer son propre mot de passe' })
    changePassword(
        @TenantId() companyId: string,
        @CurrentUser() user: JwtPayload,
        @Body() dto: ChangePasswordDto,
    ) {
        return this.usersService.changePassword(companyId, user.sub, dto);
    }

    @Get(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Détail d\'un utilisateur' })
    findOne(
        @TenantId() companyId: string,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.usersService.findOne(companyId, id);
    }

    @Post()
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Créer un utilisateur (ADMIN ou AGENT)' })
    create(
        @TenantId() companyId: string,
        @Body() dto: CreateUserDto,
    ) {
        return this.usersService.create(companyId, dto);
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Modifier un utilisateur' })
    update(
        @TenantId() companyId: string,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateUserDto,
    ) {
        return this.usersService.update(companyId, id, dto);
    }

    @Patch(':id/toggle-active')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Activer / Désactiver un utilisateur' })
    toggleActive(
        @TenantId() companyId: string,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.usersService.toggleActive(companyId, id);
    }

    @Patch(':id/reset-password')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Réinitialiser le mot de passe d\'un utilisateur (Admin)' })
    resetPassword(
        @TenantId() companyId: string,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: ResetPasswordDto,
    ) {
        return this.usersService.resetPassword(companyId, id, dto);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Supprimer un utilisateur' })
    remove(
        @TenantId() companyId: string,
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: JwtPayload,
    ) {
        return this.usersService.remove(companyId, id, user.sub);
    }
}

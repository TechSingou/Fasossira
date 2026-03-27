import { Repository } from 'typeorm';
import { UserEntity } from '../auth/entities/user.entity';
import { AgencyEntity } from '../agencies/entities/agency.entity';
import { CreateUserDto, UpdateUserDto, ResetPasswordDto, ChangePasswordDto } from './dto/user.dto';
import { UserRole } from '../shared/types';
import { PlanLimitsService } from '../common/services/plan-limits.service';
export type UserPublic = Omit<UserEntity, 'password' | 'refreshTokenHash'>;
export declare class UsersService {
    private readonly userRepo;
    private readonly agencyRepo;
    private readonly planLimits;
    private readonly logger;
    private readonly BCRYPT_ROUNDS;
    constructor(userRepo: Repository<UserEntity>, agencyRepo: Repository<AgencyEntity>, planLimits: PlanLimitsService);
    findAll(companyId: string, filters?: {
        agencyId?: string;
        role?: UserRole;
        isActive?: boolean;
    }): Promise<UserPublic[]>;
    findOne(companyId: string, id: string): Promise<UserPublic>;
    create(companyId: string, dto: CreateUserDto): Promise<UserPublic>;
    update(companyId: string, id: string, dto: UpdateUserDto): Promise<UserPublic>;
    resetPassword(companyId: string, id: string, dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    changePassword(companyId: string, id: string, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    toggleActive(companyId: string, id: string): Promise<UserPublic>;
    remove(companyId: string, id: string, requesterId: string): Promise<{
        message: string;
    }>;
}

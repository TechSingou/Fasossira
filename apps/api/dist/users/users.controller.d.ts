import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, ResetPasswordDto, ChangePasswordDto } from './dto/user.dto';
import { UserRole, JwtPayload } from '../shared/types';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(companyId: string, agencyId?: string, role?: UserRole, isActive?: string): Promise<import("./users.service").UserPublic[]>;
    getMe(companyId: string, user: JwtPayload): Promise<import("./users.service").UserPublic>;
    changePassword(companyId: string, user: JwtPayload, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    findOne(companyId: string, id: string): Promise<import("./users.service").UserPublic>;
    create(companyId: string, dto: CreateUserDto): Promise<import("./users.service").UserPublic>;
    update(companyId: string, id: string, dto: UpdateUserDto): Promise<import("./users.service").UserPublic>;
    toggleActive(companyId: string, id: string): Promise<import("./users.service").UserPublic>;
    resetPassword(companyId: string, id: string, dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    remove(companyId: string, id: string, user: JwtPayload): Promise<{
        message: string;
    }>;
}

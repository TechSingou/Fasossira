import { UserRole } from '../../shared/types';
export declare class CreateUserDto {
    name: string;
    email: string;
    password: string;
    role: UserRole.ADMIN | UserRole.AGENT;
    agencyId?: string;
}
declare const UpdateUserDto_base: import("@nestjs/common").Type<Partial<Omit<CreateUserDto, "email" | "password">>>;
export declare class UpdateUserDto extends UpdateUserDto_base {
    isActive?: boolean;
}
export declare class ResetPasswordDto {
    newPassword: string;
}
export declare class ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}
export {};

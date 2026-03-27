import { AuthService } from './auth.service';
import { JwtPayload, LoginDto } from '../shared/types';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<import("../shared/types").AuthTokens>;
    refresh(req: any): Promise<import("../shared/types").AuthTokens>;
    logout(user: JwtPayload): Promise<void>;
    me(user: JwtPayload): Promise<Omit<import("./entities/user.entity").UserEntity, "password" | "refreshTokenHash">>;
}

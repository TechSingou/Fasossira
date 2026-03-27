import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserEntity } from './entities/user.entity';
import { LoginDto } from '../shared/types';
import { AuthTokens } from '../shared/types';
export declare class AuthService {
    private readonly userRepo;
    private readonly jwtService;
    private readonly config;
    private readonly logger;
    constructor(userRepo: Repository<UserEntity>, jwtService: JwtService, config: ConfigService);
    login(dto: LoginDto): Promise<AuthTokens>;
    refreshTokens(userId: string, refreshToken: string): Promise<AuthTokens>;
    logout(userId: string): Promise<void>;
    getMe(userId: string): Promise<Omit<UserEntity, 'password' | 'refreshTokenHash'>>;
    hashPassword(password: string): Promise<string>;
    private generateTokens;
    private updateRefreshTokenHash;
}

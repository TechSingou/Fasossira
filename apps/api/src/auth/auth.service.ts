// apps/api/src/auth/auth.service.ts
import {
  Injectable, UnauthorizedException, NotFoundException,
  ConflictException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UserEntity } from './entities/user.entity';
import { LoginDto } from '../shared/types';
import { JwtPayload, AuthTokens, UserRole } from '../shared/types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ─── Login ─────────────────────────────────────────────────
  async login(dto: LoginDto): Promise<AuthTokens> {
    // Récupère le user avec le password (select: false dans l'entity)
    const user = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase(), isActive: true },
      select: ['id', 'name', 'email', 'password', 'role', 'companyId', 'agencyId', 'isActive'],
    });

    if (!user) {
      // Délai constant pour éviter le timing attack
      await bcrypt.compare('dummy', '$2b$10$dummyhashtopreventtimingattack00000');
      throw new UnauthorizedException('Identifiants incorrects');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

    this.logger.log(`Login: ${user.email} (${user.role})`);
    return tokens;
  }

  // ─── Refresh ───────────────────────────────────────────────
  async refreshTokens(userId: string, refreshToken: string): Promise<AuthTokens> {
    const user = await this.userRepo.findOne({
      where: { id: userId, isActive: true },
      select: ['id', 'name', 'email', 'role', 'companyId', 'refreshTokenHash'],
    });

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Session expirée, veuillez vous reconnecter');
    }

    const tokenValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!tokenValid) {
      throw new UnauthorizedException('Token invalide');
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);
    return tokens;
  }

  // ─── Logout ────────────────────────────────────────────────
  async logout(userId: string): Promise<void> {
    await this.userRepo.update(userId, { refreshTokenHash: null });
  }

  // ─── Get Me ────────────────────────────────────────────────
  async getMe(userId: string): Promise<Omit<UserEntity, 'password' | 'refreshTokenHash'>> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }

  // ─── Hash password ─────────────────────────────────────────
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  // ─── Private helpers ───────────────────────────────────────
  private async generateTokens(user: UserEntity): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId || '',
      tenantId: user.companyId || '',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET', 'refresh-secret-change!'),
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes en secondes
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
      },
    };
  }

  private async updateRefreshTokenHash(userId: string, refreshToken: string): Promise<void> {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.userRepo.update(userId, { refreshTokenHash: hash });
  }
}

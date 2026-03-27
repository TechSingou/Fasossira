"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcryptjs");
const user_entity_1 = require("./entities/user.entity");
let AuthService = AuthService_1 = class AuthService {
    constructor(userRepo, jwtService, config) {
        this.userRepo = userRepo;
        this.jwtService = jwtService;
        this.config = config;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async login(dto) {
        const user = await this.userRepo.findOne({
            where: { email: dto.email.toLowerCase(), isActive: true },
            select: ['id', 'name', 'email', 'password', 'role', 'companyId', 'agencyId', 'isActive'],
        });
        if (!user) {
            await bcrypt.compare('dummy', '$2b$10$dummyhashtopreventtimingattack00000');
            throw new common_1.UnauthorizedException('Identifiants incorrects');
        }
        const passwordValid = await bcrypt.compare(dto.password, user.password);
        if (!passwordValid) {
            throw new common_1.UnauthorizedException('Identifiants incorrects');
        }
        const tokens = await this.generateTokens(user);
        await this.updateRefreshTokenHash(user.id, tokens.refreshToken);
        this.logger.log(`Login: ${user.email} (${user.role})`);
        return tokens;
    }
    async refreshTokens(userId, refreshToken) {
        const user = await this.userRepo.findOne({
            where: { id: userId, isActive: true },
            select: ['id', 'name', 'email', 'role', 'companyId', 'refreshTokenHash'],
        });
        if (!user || !user.refreshTokenHash) {
            throw new common_1.UnauthorizedException('Session expirée, veuillez vous reconnecter');
        }
        const tokenValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
        if (!tokenValid) {
            throw new common_1.UnauthorizedException('Token invalide');
        }
        const tokens = await this.generateTokens(user);
        await this.updateRefreshTokenHash(user.id, tokens.refreshToken);
        return tokens;
    }
    async logout(userId) {
        await this.userRepo.update(userId, { refreshTokenHash: null });
    }
    async getMe(userId) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('Utilisateur introuvable');
        return user;
    }
    async hashPassword(password) {
        return bcrypt.hash(password, 10);
    }
    async generateTokens(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            companyId: user.companyId || '',
            tenantId: user.companyId || '',
        };
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload),
            this.jwtService.signAsync(payload, {
                secret: this.config.get('JWT_REFRESH_SECRET', 'refresh-secret-change!'),
                expiresIn: '7d',
            }),
        ]);
        return {
            accessToken,
            refreshToken,
            expiresIn: 15 * 60,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                companyId: user.companyId,
            },
        };
    }
    async updateRefreshTokenHash(userId, refreshToken) {
        const hash = await bcrypt.hash(refreshToken, 10);
        await this.userRepo.update(userId, { refreshTokenHash: hash });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.UserEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map
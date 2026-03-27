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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const public_decorator_1 = require("../auth/decorators/public.decorator");
const public_service_1 = require("./public.service");
const public_reservation_dto_1 = require("./dto/public-reservation.dto");
let PublicController = class PublicController {
    constructor(publicService) {
        this.publicService = publicService;
    }
    search(date, fromStop, toStop, companySlug) {
        if (!date)
            throw new common_1.BadRequestException('Le paramètre date est obligatoire');
        return this.publicService.search({ date, fromStop, toStop, companySlug });
    }
    getSeatMap(scheduleId, from, to) {
        return this.publicService.getSeatMap(scheduleId, from, to);
    }
    createReservation(dto) {
        return this.publicService.createReservation(dto);
    }
    getTicket(reference, phone) {
        if (!phone)
            throw new common_1.BadRequestException('Le paramètre phone est obligatoire');
        return this.publicService.getTicket(reference, phone);
    }
};
exports.PublicController = PublicController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiOperation)({ summary: 'Rechercher des voyages disponibles (public)' }),
    (0, swagger_1.ApiQuery)({ name: 'date', required: true, description: 'YYYY-MM-DD' }),
    (0, swagger_1.ApiQuery)({ name: 'fromStop', required: false, description: 'Ville de départ (partiel)' }),
    (0, swagger_1.ApiQuery)({ name: 'toStop', required: false, description: 'Ville d\'arrivée (partiel)' }),
    (0, swagger_1.ApiQuery)({ name: 'companySlug', required: false, description: 'Slug de la compagnie (ex: sotrama-bamako)' }),
    __param(0, (0, common_1.Query)('date')),
    __param(1, (0, common_1.Query)('fromStop')),
    __param(2, (0, common_1.Query)('toStop')),
    __param(3, (0, common_1.Query)('companySlug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], PublicController.prototype, "search", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('seat-map/:scheduleId'),
    (0, swagger_1.ApiOperation)({ summary: 'Plan des sièges d\'un voyage (public)' }),
    (0, swagger_1.ApiParam)({ name: 'scheduleId' }),
    (0, swagger_1.ApiQuery)({ name: 'from', type: 'number', description: 'fromStopOrder' }),
    (0, swagger_1.ApiQuery)({ name: 'to', type: 'number', description: 'toStopOrder' }),
    __param(0, (0, common_1.Param)('scheduleId')),
    __param(1, (0, common_1.Query)('from', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('to', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", void 0)
], PublicController.prototype, "getSeatMap", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('reservations'),
    (0, swagger_1.ApiOperation)({ summary: 'Créer une réservation publique (guest)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [public_reservation_dto_1.PublicReservationDto]),
    __metadata("design:returntype", void 0)
], PublicController.prototype, "createReservation", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('ticket/:reference'),
    (0, swagger_1.ApiOperation)({ summary: 'Récupérer un billet par référence (public)' }),
    (0, swagger_1.ApiParam)({ name: 'reference', example: 'REF-2026-A7F2K1PB' }),
    (0, swagger_1.ApiQuery)({ name: 'phone', required: true, description: 'Téléphone du passager (vérification)' }),
    __param(0, (0, common_1.Param)('reference')),
    __param(1, (0, common_1.Query)('phone')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PublicController.prototype, "getTicket", null);
exports.PublicController = PublicController = __decorate([
    (0, swagger_1.ApiTags)('Public'),
    (0, common_1.Controller)('public'),
    __metadata("design:paramtypes", [public_service_1.PublicService])
], PublicController);
//# sourceMappingURL=public.controller.js.map
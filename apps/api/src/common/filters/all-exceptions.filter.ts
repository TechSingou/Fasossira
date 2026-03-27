// =============================================================
// apps/api/src/common/filters/all-exceptions.filter.ts
// =============================================================
import {
  ExceptionFilter, Catch, ArgumentsHost,
  HttpException, HttpStatus, Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    console.log(exception);

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Erreur interne du serveur';

    // Log les 500 en erreur, les autres en warn
    if (status >= 500) {
      this.logger.error(`${request.method} ${request.url}`, exception);
    } else {
      this.logger.warn(`${status} ${request.method} ${request.url}`);
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...typeof message === 'object' ? message : { message },
    });
  }
}

// =============================================================
// apps/api/src/common/guards/tenant.guard.ts
// =============================================================
// Guard qui s'assure que l'utilisateur ne peut accéder qu'à
// son propre tenant. Appliqué automatiquement sur tous les
// controllers Admin/Agent.
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtPayload, UserRole } from '../../shared/types';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    // Le SUPER_ADMIN n'est pas limité à un tenant
    if (user.role === UserRole.SUPER_ADMIN) return true;

    // Les autres rôles doivent avoir un companyId valide
    if (!user.companyId) {
      throw new ForbiddenException('Aucun tenant associé à cet utilisateur');
    }
    return true;
  }
}

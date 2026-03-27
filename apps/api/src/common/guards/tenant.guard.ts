import {
  Injectable, CanActivate, ExecutionContext, ForbiddenException,
} from '@nestjs/common';
import { JwtPayload, UserRole } from '../../shared/types';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    if (user.role === UserRole.SUPER_ADMIN) return true;

    if (!user.companyId) {
      throw new ForbiddenException('Aucun tenant associé à cet utilisateur');
    }
    return true;
  }
}

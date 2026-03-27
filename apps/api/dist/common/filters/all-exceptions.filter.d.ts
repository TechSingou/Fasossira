import { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
export declare class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger;
    catch(exception: unknown, host: ArgumentsHost): void;
}
import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class TenantGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean;
}

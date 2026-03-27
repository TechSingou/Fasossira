/**
 * apps/api/src/auth/decorators/public.decorator.ts
 *
 * Marque un endpoint comme public — bypass JwtAuthGuard.
 * Usage : @Public() sur un @Get() ou @Post()
 */
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

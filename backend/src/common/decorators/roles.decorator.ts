import { SetMetadata } from '@nestjs/common';

/**
 * Roles that can appear in a JWT: end user, platform admin tiers, or the
 * short-lived 'register' role carried by a registration token during onboarding.
 */
export type AppRole = 'user' | 'admin' | 'superadmin' | 'register';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);

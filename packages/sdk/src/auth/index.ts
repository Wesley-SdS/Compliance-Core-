export { BetterAuthGuard, BETTER_AUTH_INSTANCE } from './better-auth.guard';
export { RBACGuard } from './rbac.guard';
export { ROLES_KEY, Roles } from './rbac.guard';
export { VektusWebhookGuard } from './vektus-webhook.guard';
export { CurrentUser } from './user.decorator';
export type { AuthUser } from './user.decorator';
export { AuthModule } from './auth.module';
export { createBetterAuthInstance } from './better-auth.config';
export type { BetterAuthInstance, BetterAuthOptions, SendEmailFn, SendEmailParams } from './better-auth.config';

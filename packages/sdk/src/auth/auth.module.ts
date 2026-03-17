import { Module } from '@nestjs/common';
import { ClerkAuthGuard } from './clerk-auth.guard';
import { RBACGuard } from './rbac.guard';
import { VektusWebhookGuard } from './vektus-webhook.guard';

@Module({
  providers: [ClerkAuthGuard, RBACGuard, VektusWebhookGuard],
  exports: [ClerkAuthGuard, RBACGuard, VektusWebhookGuard],
})
export class AuthModule {}

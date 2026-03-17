import { Module, DynamicModule, Global } from '@nestjs/common';
import { BetterAuthGuard, BETTER_AUTH_INSTANCE } from './better-auth.guard';
import { RBACGuard } from './rbac.guard';
import { VektusWebhookGuard } from './vektus-webhook.guard';
import { createBetterAuthInstance, type BetterAuthOptions } from './better-auth.config';

@Global()
@Module({})
export class AuthModule {
  static register(options: BetterAuthOptions): DynamicModule {
    const authInstance = createBetterAuthInstance(options);

    return {
      module: AuthModule,
      providers: [
        {
          provide: BETTER_AUTH_INSTANCE,
          useValue: authInstance,
        },
        BetterAuthGuard,
        RBACGuard,
        VektusWebhookGuard,
      ],
      exports: [BETTER_AUTH_INSTANCE, BetterAuthGuard, RBACGuard, VektusWebhookGuard],
    };
  }
}

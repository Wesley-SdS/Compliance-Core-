import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import type { BetterAuthInstance } from './better-auth.config.js';

export const BETTER_AUTH_INSTANCE = 'BETTER_AUTH_INSTANCE';

@Injectable()
export class BetterAuthGuard implements CanActivate {
  constructor(
    @Inject(BETTER_AUTH_INSTANCE) private readonly auth: BetterAuthInstance,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    try {
      const headers = new Headers();
      // Forward relevant headers
      if (request.headers.authorization) {
        headers.set('authorization', request.headers.authorization);
      }
      if (request.headers.cookie) {
        headers.set('cookie', request.headers.cookie);
      }

      const session = await this.auth.api.getSession({ headers });

      if (!session || !session.user) {
        throw new UnauthorizedException('Invalid or expired session');
      }

      request.user = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: (session.user as any).role || 'user',
        vertical: (session.user as any).vertical || undefined,
        tenantId: (session.user as any).tenantId || undefined,
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid or expired session');
    }
  }
}

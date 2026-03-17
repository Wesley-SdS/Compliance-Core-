import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException('Missing auth token');

    try {
      // In production, verify with Clerk SDK: createClerkClient({ secretKey }).verifyToken(token)
      // For now, decode JWT payload (Clerk tokens are JWTs)
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('Invalid token format');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());

      request.user = {
        id: payload.sub,
        role: payload.metadata?.role || 'user',
        vertical: payload.metadata?.vertical,
        tenantId: payload.org_id || payload.metadata?.tenantId,
        email: payload.email,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

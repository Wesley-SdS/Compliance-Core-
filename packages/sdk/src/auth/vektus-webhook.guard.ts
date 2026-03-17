import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';

@Injectable()
export class VektusWebhookGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const signature = request.headers['x-vektus-signature'] as string;
    const secret = process.env.VEKTUS_WEBHOOK_SECRET;

    if (!secret) throw new ForbiddenException('Webhook secret not configured');
    if (!signature) throw new ForbiddenException('Missing webhook signature');

    const rawBody = typeof request.body === 'string' ? request.body : JSON.stringify(request.body);
    const expected = `sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}`;

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      throw new ForbiddenException('Invalid webhook signature');
    }
    return true;
  }
}

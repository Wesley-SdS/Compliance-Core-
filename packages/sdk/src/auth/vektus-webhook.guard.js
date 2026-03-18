"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VektusWebhookGuard = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
let VektusWebhookGuard = class VektusWebhookGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const signature = request.headers['x-vektus-signature'];
        const secret = process.env.VEKTUS_WEBHOOK_SECRET;
        if (!secret)
            throw new common_1.ForbiddenException('Webhook secret not configured');
        if (!signature)
            throw new common_1.ForbiddenException('Missing webhook signature');
        const rawBody = typeof request.body === 'string' ? request.body : JSON.stringify(request.body);
        const expected = `sha256=${(0, crypto_1.createHmac)('sha256', secret).update(rawBody).digest('hex')}`;
        const sigBuf = Buffer.from(signature);
        const expBuf = Buffer.from(expected);
        if (sigBuf.length !== expBuf.length || !(0, crypto_1.timingSafeEqual)(sigBuf, expBuf)) {
            throw new common_1.ForbiddenException('Invalid webhook signature');
        }
        return true;
    }
};
exports.VektusWebhookGuard = VektusWebhookGuard;
exports.VektusWebhookGuard = VektusWebhookGuard = __decorate([
    (0, common_1.Injectable)()
], VektusWebhookGuard);
//# sourceMappingURL=vektus-webhook.guard.js.map
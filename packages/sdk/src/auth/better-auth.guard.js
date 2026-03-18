"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BetterAuthGuard = exports.BETTER_AUTH_INSTANCE = void 0;
const common_1 = require("@nestjs/common");
exports.BETTER_AUTH_INSTANCE = 'BETTER_AUTH_INSTANCE';
let BetterAuthGuard = class BetterAuthGuard {
    auth;
    constructor(auth) {
        this.auth = auth;
    }
    async canActivate(context) {
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
                throw new common_1.UnauthorizedException('Invalid or expired session');
            }
            request.user = {
                id: session.user.id,
                email: session.user.email,
                name: session.user.name,
                role: session.user.role || 'user',
                vertical: session.user.vertical || undefined,
                tenantId: session.user.tenantId || undefined,
            };
            return true;
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException)
                throw error;
            throw new common_1.UnauthorizedException('Invalid or expired session');
        }
    }
};
exports.BetterAuthGuard = BetterAuthGuard;
exports.BetterAuthGuard = BetterAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(exports.BETTER_AUTH_INSTANCE)),
    __metadata("design:paramtypes", [Object])
], BetterAuthGuard);
//# sourceMappingURL=better-auth.guard.js.map
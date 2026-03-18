"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AuthModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const better_auth_guard_1 = require("./better-auth.guard");
const rbac_guard_1 = require("./rbac.guard");
const vektus_webhook_guard_1 = require("./vektus-webhook.guard");
const better_auth_config_1 = require("./better-auth.config");
let AuthModule = AuthModule_1 = class AuthModule {
    static register(options) {
        const authInstance = (0, better_auth_config_1.createBetterAuthInstance)(options);
        return {
            module: AuthModule_1,
            providers: [
                {
                    provide: better_auth_guard_1.BETTER_AUTH_INSTANCE,
                    useValue: authInstance,
                },
                better_auth_guard_1.BetterAuthGuard,
                rbac_guard_1.RBACGuard,
                vektus_webhook_guard_1.VektusWebhookGuard,
            ],
            exports: [better_auth_guard_1.BETTER_AUTH_INSTANCE, better_auth_guard_1.BetterAuthGuard, rbac_guard_1.RBACGuard, vektus_webhook_guard_1.VektusWebhookGuard],
        };
    }
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = AuthModule_1 = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({})
], AuthModule);
//# sourceMappingURL=auth.module.js.map
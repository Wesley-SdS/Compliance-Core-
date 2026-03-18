"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceLogger = void 0;
const common_1 = require("@nestjs/common");
let ComplianceLogger = class ComplianceLogger {
    context = 'ComplianceCore';
    setContext(context) {
        this.context = context;
    }
    log(message, ...args) {
        console.log(JSON.stringify({ level: 'info', context: this.context, message, timestamp: new Date().toISOString(), ...this.extractMeta(args) }));
    }
    error(message, trace, ...args) {
        console.error(JSON.stringify({ level: 'error', context: this.context, message, trace, timestamp: new Date().toISOString(), ...this.extractMeta(args) }));
    }
    warn(message, ...args) {
        console.warn(JSON.stringify({ level: 'warn', context: this.context, message, timestamp: new Date().toISOString(), ...this.extractMeta(args) }));
    }
    debug(message, ...args) {
        console.debug(JSON.stringify({ level: 'debug', context: this.context, message, timestamp: new Date().toISOString(), ...this.extractMeta(args) }));
    }
    verbose(message, ...args) {
        console.log(JSON.stringify({ level: 'verbose', context: this.context, message, timestamp: new Date().toISOString(), ...this.extractMeta(args) }));
    }
    extractMeta(args) {
        const last = args[args.length - 1];
        return typeof last === 'object' && last !== null ? last : {};
    }
};
exports.ComplianceLogger = ComplianceLogger;
exports.ComplianceLogger = ComplianceLogger = __decorate([
    (0, common_1.Injectable)({ scope: common_1.Scope.TRANSIENT })
], ComplianceLogger);
//# sourceMappingURL=logger.js.map
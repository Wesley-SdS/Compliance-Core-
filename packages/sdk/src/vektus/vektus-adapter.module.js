"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VektusAdapterModule = void 0;
const common_1 = require("@nestjs/common");
const vektus_adapter_service_js_1 = require("./vektus-adapter.service.js");
let VektusAdapterModule = class VektusAdapterModule {
};
exports.VektusAdapterModule = VektusAdapterModule;
exports.VektusAdapterModule = VektusAdapterModule = __decorate([
    (0, common_1.Module)({
        providers: [vektus_adapter_service_js_1.VektusAdapterService],
        exports: [vektus_adapter_service_js_1.VektusAdapterService],
    })
], VektusAdapterModule);
//# sourceMappingURL=vektus-adapter.module.js.map
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoreEngineModule = void 0;
const common_1 = require("@nestjs/common");
const score_engine_service_js_1 = require("./score-engine.service.js");
let ScoreEngineModule = class ScoreEngineModule {
};
exports.ScoreEngineModule = ScoreEngineModule;
exports.ScoreEngineModule = ScoreEngineModule = __decorate([
    (0, common_1.Module)({
        providers: [score_engine_service_js_1.ScoreEngineService],
        exports: [score_engine_service_js_1.ScoreEngineService],
    })
], ScoreEngineModule);
//# sourceMappingURL=score-engine.module.js.map
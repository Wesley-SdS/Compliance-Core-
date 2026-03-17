import { Injectable, LoggerService as NestLoggerService, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class ComplianceLogger implements NestLoggerService {
  private context = 'ComplianceCore';

  setContext(context: string) {
    this.context = context;
  }

  log(message: string, ...args: any[]) {
    console.log(JSON.stringify({ level: 'info', context: this.context, message, timestamp: new Date().toISOString(), ...this.extractMeta(args) }));
  }

  error(message: string, trace?: string, ...args: any[]) {
    console.error(JSON.stringify({ level: 'error', context: this.context, message, trace, timestamp: new Date().toISOString(), ...this.extractMeta(args) }));
  }

  warn(message: string, ...args: any[]) {
    console.warn(JSON.stringify({ level: 'warn', context: this.context, message, timestamp: new Date().toISOString(), ...this.extractMeta(args) }));
  }

  debug(message: string, ...args: any[]) {
    console.debug(JSON.stringify({ level: 'debug', context: this.context, message, timestamp: new Date().toISOString(), ...this.extractMeta(args) }));
  }

  verbose(message: string, ...args: any[]) {
    console.log(JSON.stringify({ level: 'verbose', context: this.context, message, timestamp: new Date().toISOString(), ...this.extractMeta(args) }));
  }

  private extractMeta(args: any[]): Record<string, unknown> {
    const last = args[args.length - 1];
    return typeof last === 'object' && last !== null ? last : {};
  }
}

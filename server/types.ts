import type { IncomingMessage, ServerResponse } from 'http';

declare module 'express-session' {
  interface SessionData {
    userId: number;
    nextCode: Date;
  }
}

export interface ApiRequest extends IncomingMessage {
  body: any;
  session: import('express-session').Session & Partial<import('express-session').SessionData>;
  protocol: string;
}

export interface ApiResponse extends ServerResponse {}

export interface RouteDefinition {
  path: string;
  handler: (req: ApiRequest, res: ApiResponse) => any;
}

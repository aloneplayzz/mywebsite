declare module 'passport-github2' {
  import { Strategy as PassportStrategy } from 'passport';
  
  export interface Profile {
    id: string;
    displayName: string;
    username?: string;
    profileUrl?: string;
    emails?: Array<{ value: string }>;
    photos?: Array<{ value: string }>;
    provider: string;
    _json: any;
    _raw: string;
  }

  export interface StrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope?: string | string[];
    userAgent?: string;
    sessionKey?: string;
    passReqToCallback?: boolean;
  }

  export type VerifyCallback = (err?: Error | null, user?: any, info?: any) => void;

  export type VerifyFunction = (
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback
  ) => void;

  export class Strategy extends PassportStrategy {
    constructor(
      options: StrategyOptions,
      verify: VerifyFunction
    );
    name: string;
    authenticate(req: any, options?: any): void;
  }
}

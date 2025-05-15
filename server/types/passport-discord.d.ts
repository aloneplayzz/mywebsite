declare module 'passport-discord' {
  import { Strategy as PassportStrategy } from 'passport';
  
  export interface Profile {
    id: string;
    username: string;
    discriminator: string;
    avatar?: string;
    email?: string;
    verified?: boolean;
    provider: string;
    locale?: string;
    accessToken: string;
    refreshToken: string;
    fetchedAt: Date;
    guilds?: any[];
    _json: any;
    _raw: string;
  }

  export interface StrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope?: string | string[];
    prompt?: string;
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

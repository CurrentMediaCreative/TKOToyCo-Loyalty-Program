/**
 * Type declarations for jsonwebtoken
 */

import * as jwt from "jsonwebtoken";

declare module "jsonwebtoken" {
  export interface SignOptions {
    expiresIn?: string | number;
    notBefore?: string | number;
    audience?: string | string[];
    algorithm?: string;
    header?: object;
    encoding?: string;
    issuer?: string;
    subject?: string;
    jwtid?: string;
    noTimestamp?: boolean;
    keyid?: string;
    mutatePayload?: boolean;
  }
}

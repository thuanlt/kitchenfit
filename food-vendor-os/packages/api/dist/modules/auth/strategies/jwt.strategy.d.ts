import { Strategy } from 'passport-jwt';
export interface JwtPayload {
    sub: string;
    storeId: string;
    phone: string;
    role: string;
}
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    constructor();
    validate(payload: JwtPayload): Promise<JwtPayload>;
}
export {};

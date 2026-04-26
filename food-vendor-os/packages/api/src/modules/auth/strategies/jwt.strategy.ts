import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AUTH_CONSTANTS } from '../constants';

export interface JwtPayload {
  sub: string;      // staff_id
  storeId: string;
  phone: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: AUTH_CONSTANTS.JWT_SECRET,
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (!payload.sub || !payload.storeId) {
      throw new UnauthorizedException('Token không hợp lệ');
    }
    return payload;
  }
}
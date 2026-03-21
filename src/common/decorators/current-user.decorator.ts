import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface UserPayload {
  id: string;
  email: string;
  role: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserPayload => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return (request as unknown as Record<string, unknown>)['user'] as UserPayload;
  },
);

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface AdminPayload {
  id: string;
  email: string;
}

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AdminPayload => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return (request as unknown as Record<string, unknown>)['admin'] as AdminPayload;
  },
);

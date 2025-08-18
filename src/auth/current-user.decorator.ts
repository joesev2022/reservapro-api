import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type JwtUser = { userId: string; email: string; role: 'admin'|'trabajador'|'cliente' };

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return req.user as JwtUser;
  },
);

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GrammyExecutionContext, GrammyException } from '@grammyjs/nestjs';

import { UsersService } from '@/services/users.service';

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly ADMIN_IDS = [];

  constructor(
    private readonly usersService: UsersService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GrammyExecutionContext.create(context);
    const { from } = ctx.getContext();
    const admins = await this.usersService.findAllAdmins();
    const isAdmin = admins.find(user => user.uid == from.id);

    if (!isAdmin) {
      throw new GrammyException('Ты не админ! 😡');
    }

    return true;
  }
}

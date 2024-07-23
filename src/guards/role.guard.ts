import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { InjectRepository } from "@nestjs/typeorm";
import { GrammyExecutionContext, GrammyException } from '@grammyjs/nestjs';

import { Repository, DataSource, Not, IsNull } from "typeorm";

import { Roles } from "../decorators/roles.decorator";
import { User } from "@/entitys/user.entity";

@Injectable()
export class RoleGuard implements CanActivate {
  //private readonly ADMIN_IDS = [1655038489, 5174898144];

  constructor(
    private reflector: Reflector,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get(Roles, context.getHandler());
    console.log(">>>> Roles guard roles:", roles);

    const ctx = GrammyExecutionContext.create(context);
    const { from } = ctx.getContext();

    console.log("user id:", from!.id);

    const user = await this.userRepository.findOne({ where: { uid: from!.id }, relations: { role: true } });
    console.log("user:", user);

    if (user && user.role.name == "banned") {
      console.log(">>> Roles guard alarm - BANNED USER:", from!.id);
      throw new GrammyException("Ты забанен! 😡");
    }

    if (!roles) {
      return true;
    }

    if (user && roles.includes(user.role.name)) {
      return true;
    } else {
      console.log(">>> Roles guard alarm:", from!.id);
      throw new GrammyException("Необходима авторизация! 😡");
    }

  }
}

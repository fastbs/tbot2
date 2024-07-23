import { Module, Logger } from '@nestjs/common';
import { HttpModule } from "@nestjs/axios";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InjectBot } from '@grammyjs/nestjs';
import { Bot, Context } from 'grammy';

import { DachaBotName } from './bot.constants';
import { DachaUpdate } from './bot.update';
import { ResponseTime } from './lib';

import { DachaService } from "@/services/dacha.service";
import { HAService } from "@/services/ha.service";
import { UsersService } from "@/services/users.service";

import { Camera } from "@/entitys/camera.entity";
import { Device } from "@/entitys/device.entity";
import { Sensor } from "@/entitys/sensor.entity";
import { Control } from "@/entitys/control.entity";
import { Password } from "@/entitys/password.entity";
import { User } from "@/entitys/user.entity";
import { Role } from "@/entitys/role.entity";
import { Command } from '@/entitys/command.entity';



const logger = new Logger('bot:bot.module');

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([Camera, Device, Sensor, Control, Password, User, Role, Command])],
  providers: [DachaUpdate, DachaService, HAService, UsersService],
})
export class DachaBotModule {
  constructor(@InjectBot(DachaBotName) private readonly bot: Bot<Context>) {
    this.bot.use(ResponseTime);
    logger.log('DachaBotModule initialized');
  }
}

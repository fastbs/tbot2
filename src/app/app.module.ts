import { Module, NestModule, MiddlewareConsumer, Logger } from '@nestjs/common';
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { NestjsGrammyModule } from '@grammyjs/nestjs';

import { LoggerMiddleware } from '@/middleware/logger.middleware';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DachaBotModule } from '@/bot/bot.module';
import { DachaBotName } from '@/bot/bot.constants';

import { Camera } from "@/entitys/camera.entity";
import { Device } from "@/entitys/device.entity";
import { Sensor } from "@/entitys/sensor.entity";
import { Control } from "@/entitys/control.entity";
import { Password } from "@/entitys/password.entity";
import { User } from "@/entitys/user.entity";
import { Role } from "@/entitys/role.entity";
import { Command } from '@/entitys/command.entity';



const logger = new Logger('bot:app.module');

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, }),
    TypeOrmModule.forRoot({
      type: "sqlite",
      database: process.env.DATABASE,
      entities: [Camera, Device, Sensor, Control, Password, User, Role, Command],
      synchronize: true,
    }),
    NestjsGrammyModule.forRoot({
      botName: DachaBotName,
      token: process.env.BOT_TOKEN,
      include: [DachaBotModule],
      pollingOptions: {
        allowed_updates: ['chat_member', 'message', 'callback_query'],
      },
    }),
    DachaBotModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule implements NestModule {
  constructor() {
    logger.debug(`Initializing AppModule`);
  }

  async configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes("*");
  }
}

import { Logger, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import cloneDeep from "lodash/clone";
import { Bot, Context, InlineKeyboard } from 'grammy';
import {
  Admin,
  CallbackQuery,
  Ctx,
  Hears,
  Help,
  InjectBot,
  Message,
  Start,
  Update,
  ChatType,
  On,
  Command,
  UpdateFilter,
  GrammyException,
} from '@grammyjs/nestjs';

import { DachaBotName } from './bot.constants';
import {
  //AdminGuard,
  GrammyExceptionFilter,
  ResponseTimeInterceptor,
  ReverseTextPipe,
} from './lib';

import { Roles } from '@/decorators/roles.decorator';
import { RoleGuard } from '@/guards/role.guard';
import { AdminGuard } from '@/guards/admin.guard';

import { DachaService } from '@/services/dacha.service';
import { HAService } from '@/services/ha.service';
import { UsersService } from '@/services/users.service';

import { Camera } from "@/entitys/camera.entity";
import { User } from '@/entitys/user.entity';
import { CreateUserDto } from '@/entitys/dto/create-user.dto';

const logger = new Logger('bot:echo.update');
const Url1 = "https://astronomer.ru/data/nick.jpg";
const Url2 = "https://astronomer.ru/data/zais.jpg";
const changePics = [Url1, Url2];

@Update()
@UseInterceptors(ResponseTimeInterceptor)
@UseFilters(GrammyExceptionFilter)
export class DachaUpdate {
  constructor(
    @InjectBot(DachaBotName)
    private readonly bot: Bot<Context>,
    private readonly dachaService: DachaService,
    private readonly haService: HAService,
    private readonly usersService: UsersService,
  ) {
    logger.debug(
      `Initializing`,
      bot.isInited() ? bot.botInfo.first_name : '(pending)',
    );
  }

  // ***** Начало, авторизация *****

  @Roles(["admin", "user"])
  @UseGuards(RoleGuard)
  @Start()
  async onStart(@Ctx() ctx: Context) {
    const user = await this.usersService.getUserByUid(ctx.from.id);
    const commands = await this.usersService.getUserCommands(user.id);
    const buttons = [];
    commands.forEach(command => buttons.push([InlineKeyboard.text(command.label, command.name)]));
    return ctx.reply('Доступные команды:', {
      reply_markup: InlineKeyboard.from(buttons),
    });
  }

  @Command("password") // /(password (\S+))/gm)
  async onPasswordCommand(@Ctx() ctx: Context) {
    const pass = await this.usersService.findPassword(ctx.match as string);
    if (pass) {
      let user = new User();
      const fu = await this.usersService.getUserByUid(ctx.from.id);
      if (fu) {
        user = await this.usersService.setUserRole(fu.id, pass.role.id);
      } else {
        const cu: CreateUserDto = {
          uid: ctx.from.id,
          name: ctx.from.first_name,
          username: ctx.from.username,
          roleId: pass.role.id,
        }
        user = await this.usersService.createUser(cu);
      }
      ctx.reply(`Доступ предоставлен 🐇🦔👌\nПользователь: <b>${user.username}</b>\nУровень доступа: <b>${user.role.name}</b>`, { parse_mode: "HTML" });
    } else {
      throw new GrammyException("Неверный пароль! 😡");
    }
  }


  // ***** Камеры *****

  @Roles(['admin', 'user'])
  @UseGuards(RoleGuard)
  @CallbackQuery("cameras")
  async onCamerasAction(@Ctx() ctx: Context) {
    const cameras = await this.dachaService.findAllCameras();
    const buttons = [];
    const buttonsRow = [];
    cameras.forEach((cam, idx) => {
      buttonsRow.push(InlineKeyboard.text(cam.short_name, "camera-" + cam.id)); //    Markup.button.callback(cam.short_name, "camera-" + cam.id));
      if (buttonsRow.length == 3) {
        buttons.push(cloneDeep(buttonsRow));
        buttonsRow.length = 0;
      }
    });
    if (buttonsRow.length) {
      buttons.push(cloneDeep(buttonsRow));
    }
    buttons.push([InlineKeyboard.text("Все камеры", "camera-all")]);

    return ctx.reply("Наши камеры:", {
      reply_markup: InlineKeyboard.from(buttons),
    });
  }


  @Roles(['admin', 'user'])
  @UseGuards(RoleGuard)
  @CallbackQuery(/camera-(\d+)/gm)
  async cameraAction(@Ctx() ctx: Context) {
    let camId = Number(/camera-(\d+)/.exec(ctx.match[0])[1]);
    const cam = await this.dachaService.getCamera(camId);
    if (cam) {
      this.showCamPicture(cam, ctx);
    }
  }

  @Roles(['admin', 'user'])
  @UseGuards(RoleGuard)
  @CallbackQuery("camera-all")
  async cameraAllAction(@Ctx() ctx: Context) {
    const cams = await this.dachaService.findAllCameras();
    cams.forEach(async (cam) => this.showCamPicture(cam, ctx));
  }

  async showCamPicture(cam: Camera, ctx: Context) {
    const cs = cam.second == "" ? cam.main : cam.second;
    this.haService.getEntityState(cs).subscribe({
      next: (res) =>
        ctx.replyWithPhoto(process.env.HA_URL + res.data.attributes.entity_picture, { caption: cam.name }).catch((err: Error) => ctx.reply("Ошибка камеры " + cam.name + ":" + err.message)),
      error: (err: Error) => ctx.reply("Ошибка камеры " + cam.name + ":" + err.message),
      complete: () => console.log("***** showCamPicture - getEntityState completed")
    });
  }


  // ***** Наблюдаемые устройства *****

  @Roles(['admin', 'user'])
  @UseGuards(RoleGuard)
  @CallbackQuery("devices")
  async onDevicesAction(@Ctx() ctx: Context) {
    const devices = await this.dachaService.findAllSensoredDevices();
    const buttons = [];
    devices.forEach((dev, idx) => {
      buttons.push([InlineKeyboard.text(dev.name, "device-" + dev.id)]);
    });

    return ctx.reply("Наши устройства:", {
      reply_markup: InlineKeyboard.from(buttons),
    });

  }

  @Roles(['admin', 'user'])
  @UseGuards(RoleGuard)
  @CallbackQuery(/device-(\d+)/gm)
  async deviceAction(@Ctx() ctx: Context) {
    let devId = Number(/device-(\d+)/.exec(ctx.match[0])[1]);
    const dev = await this.dachaService.getDevice(devId);
    if (dev) {
      ctx.reply(`Показания устройства <b>${dev.name}:</b>`, { parse_mode: "HTML" });
      dev.sensors.forEach(async (sensor) => {
        this.haService.getEntityState(sensor.object_id).subscribe({
          next: (res) => ctx.reply(`${sensor.name}: ${res.data.state} ${sensor.unit_of_measurement}`),
          error: (err: Error) => ctx.reply("Ошибка сенсора " + sensor.name + ":" + err.message),
          complete: () => console.log("***** deviceAction - getEntityState completed")
        });
      });
    }
  }


  // ***** Управляемые устройства *****

  @Roles(['admin'])
  @UseGuards(RoleGuard)
  @CallbackQuery("controls")
  async controlsCommand(@Ctx() ctx: Context) {
    const devices = await this.dachaService.findAllControlledDevices();
    const buttons = [];
    devices.forEach((dev, idx) => {
      buttons.push([InlineKeyboard.text(dev.name, "control-" + dev.id)]);
    });

    return ctx.reply("Управляемые устройства:", {
      reply_markup: InlineKeyboard.from(buttons),
    });
  }

  @Roles(['admin'])
  @UseGuards(RoleGuard)
  @CallbackQuery(/control-(\d+)/gm) //(/control(\d+)-(\w+)/gm)
  async controlAction(@Ctx() ctx: Context) {
    let devId = Number(/control-(\d+)/.exec(ctx.match[0])[1]);
    const dev = await this.dachaService.getDevice(devId);
    if (dev) {
      ctx.reply(`Состояние устройства <b>${dev.name}:</b>`, { parse_mode: "HTML" });
      dev.controls.forEach(async (control) => {
        this.haService.getEntityState(control.entity_id).subscribe({
          next: res => {
            switch (control.type) {
              case "switch":
                const action = this.getSwitchedState("turn_" + res.data.state);
                ctx.reply(`${control.name}: ${action.state}`, { reply_markup: new InlineKeyboard().text(action.text, `command-${control.id}-${action.command}`) });
                break;
              default:
                ctx.reply(`${control.name}: ${res.data.state}`);
                break;
            }
          },
          error: (err: Error) => ctx.reply("Ошибка " + control.name + ":" + err.message),
          complete: () => console.log("***** controlAction - getEntityState completed")
        });
      });
    }
  }

  @Roles(['admin'])
  @UseGuards(RoleGuard)
  @CallbackQuery(/command-(\d+)-(\w+)/gm) // (/control(\d+)((-(\w+))?(-(\w+))?)?/gm)
  async commandAction(@Ctx() ctx: Context) {
    const args = /command-(\d+)-(\w+)/.exec(ctx.match[0]);
    const controlId = Number(args[1]);
    const command = String(args[2]);
    const control = await this.dachaService.getControl(controlId);
    if (control) {
      switch (control.type) {
        case "switch":
          this.haService.callService("switch", command, control.entity_id).subscribe({
            next: res => {
              const action = this.getSwitchedState(command);
              ctx.editMessageText(`${control.name}: ${action.state}`, { reply_markup: new InlineKeyboard().text(action.text, `command-${control.id}-${action.command}`) });
            },
            error: (err: Error) => ctx.reply("Ошибка устройства " + control.name + ":" + err.message),
          });
          break;
        default:
          ctx.reply(`${control.name}: Неопознанная команда`);
          break;
      }
    }
  }

  getSwitchedState(command: string) {
    return command == "turn_on" ? { state: "Включено", command: "turn_off", text: "Выключить" } : { state: "Выключено", command: "turn_on", text: "Включить" };
  }


  // ***** Всякое *****

  @Help()
  async onHelp(@Ctx() ctx: Context) {
    return ctx.reply('Я дачный бот. Чего надо?');
  }

  @Admin()
  @UseGuards(AdminGuard)
  async onAdminCommand(@Ctx() ctx: Context) {
    return ctx.reply('Барин! Сколько лет! Сколько зим!');
  }

  @Command("pic")
  async picCommand(@Ctx() ctx: Context) {
    console.log("ctx:", ctx);
    console.log("ctx.chat:", ctx.chat);
    await ctx.reply("Навага - это вещь! 👍");
    await ctx.replyWithPhoto(Url1);
  }

  @Command("change")
  async changeCommand(@Ctx() ctx: Context) {
    ctx.replyWithPhoto(
      changePics[0],
      {
        reply_markup: new InlineKeyboard().text(
          'Swap media',
          'swap_media-1',
        )
      }
    );
  }

  @CallbackQuery(/(swap_media-(\d+))/gm)
  async swapMediaAction(@Ctx() ctx: Context) {
    let idx = Number(/swap_media-(\d+)/.exec(ctx.match[0])[1]);
    if (idx) {
      idx = idx == 1 ? 2 : 1;
      ctx.editMessageMedia(
        { type: "photo", media: changePics[idx - 1] },
        { reply_markup: new InlineKeyboard().text('Swap again', 'swap_media-' + idx) }
      );
    }
  }


  @Hears('greetings')
  async onMessage(
    @Ctx() ctx: Context,
    @Message('text', new ReverseTextPipe()) reversedText: string,
  ) {
    return ctx.reply(reversedText);
  }

  @On('chat_member')
  @UpdateFilter((ctx) => ctx.chatMember?.new_chat_member.status === 'member')
  greetNewMember(@Ctx() ctx: Context) {
    return ctx.reply(
      `Welcome to our chat, ${ctx.chatMember.new_chat_member.user.first_name}!`,
    );
  }

  @On('message')
  @ChatType('private')
  onPrivateMessage(@Ctx() ctx: Context) {
    return ctx.reply(
      'Hello! This is private chat. You can continue to tell me your secrets',
    );
  }
}

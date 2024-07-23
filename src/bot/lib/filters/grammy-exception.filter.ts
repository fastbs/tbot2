import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { GrammyArgumentsHost } from '@grammyjs/nestjs';

@Catch()
export class GrammyExceptionFilter implements ExceptionFilter {
  async catch(exception: Error, host: ArgumentsHost): Promise<void> {
    const grammyHost = GrammyArgumentsHost.create(host);
    const ctx = grammyHost.getContext();
    console.error(exception);

    await ctx.reply(`<b>Ошибка</b>: ${exception.message}`, { parse_mode: "HTML" });
  }
}

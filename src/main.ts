import {NestFactory} from '@nestjs/core';
// import Logger from './app/lib/Logger';
import { AppModule } from './app/app.module';

async function bootstrap() {
  // const logger = new Logger('Main');
  const app = await NestFactory.create(AppModule, {
    // logger,
  });

  const port = Number.parseInt(process.env.PORT || '3001', 10);
  // app.use(logger.logInfo());
  app.enableCors();
  // app.use(logger.logError());
  await app.listen(port);
}

bootstrap();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from './common/config';

const config = ConfigService.load();
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(config.test_crud.port, () => {
    console.log(
      `server is running on http://localhost:${config.test_crud.port}/graphql`,
    );
  });
}
bootstrap();

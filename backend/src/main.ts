import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DateTimeInterceptor } from './common/date-time.interceptor';

async function bootstrap() {
	const app = await NestFactory.create(AppModule, { cors: true });
	app.useGlobalPipes(
		new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
	);
	app.useGlobalInterceptors(new DateTimeInterceptor());
	const port = process.env.PORT ? Number(process.env.PORT) : 3000;
	await app.listen(port);
}

bootstrap();
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { DateTimeInterceptor } from './common/date-time.interceptor';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	const origins = process.env.CORS_ORIGINS?.split(',').map((value) => value.trim());
	app.enableCors({
		origin: origins && origins.length > 0 ? origins : true,
		credentials: true,
	});
	app.useGlobalPipes(
		new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
	);
	app.useGlobalInterceptors(new DateTimeInterceptor());
	const swaggerConfig = new DocumentBuilder()
		.setTitle('EV Charging Vendor API')
		.setDescription('Vendor onboarding and management APIs')
		.setVersion('1.0.0')
		.addBearerAuth()
		.build();
	const document = SwaggerModule.createDocument(app, swaggerConfig);
	SwaggerModule.setup('api/docs', app, document);
	const port = process.env.PORT ? Number(process.env.PORT) : 3000;
	await app.listen(port);
}

bootstrap();
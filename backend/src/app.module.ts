import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { MqttModule } from './mqtt/mqtt.module';
import { DevicesModule } from './modules/devices/devices.module';
import { StationsModule } from './modules/stations/stations.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { RealtimeModule } from './realtime/realtime.module';

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		AuthModule,
		DatabaseModule,
		MqttModule,
		DevicesModule,
		StationsModule,
		BookingsModule,
		SessionsModule,
		RealtimeModule,
	],
})
export class AppModule {}

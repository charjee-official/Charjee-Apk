import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { MqttModule } from './mqtt/mqtt.module';
import { AdminModule } from './modules/admin/admin.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { DevicesModule } from './modules/devices/devices.module';
import { StationsModule } from './modules/stations/stations.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { RealtimeModule } from './realtime/realtime.module';
import { VendorsModule } from './modules/vendors/vendors.module';
import { SettingsModule } from './modules/settings/settings.module';
import { UsersModule } from './modules/users/users.module';

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		AuthModule,
		DatabaseModule,
		MqttModule,
		AdminModule,
		AlertsModule,
		DevicesModule,
		StationsModule,
		BookingsModule,
		SessionsModule,
		SettingsModule,
		VendorsModule,
		RealtimeModule,
		UsersModule,
	],
})
export class AppModule {}

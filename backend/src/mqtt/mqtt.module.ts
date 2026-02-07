import { forwardRef, Module } from '@nestjs/common';
import { DevicesModule } from '../modules/devices/devices.module';
import { SessionsModule } from '../modules/sessions/sessions.module';
import { MqttService } from './mqtt.service';

@Module({
  imports: [DevicesModule, forwardRef(() => SessionsModule)],
  providers: [MqttService],
  exports: [MqttService],
})
export class MqttModule {}

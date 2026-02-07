import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { connect, IClientOptions, MqttClient } from 'mqtt';
import { EnergyDataPayload, ReportType } from '../modules/sessions/session.types';
import { DevicesService } from '../modules/devices/devices.service';
import { SessionsService } from '../modules/sessions/sessions.service';

type PowerCommand = 'turn_on' | 'turn_off';

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private client?: MqttClient;

  constructor(
    private readonly sessionsService: SessionsService,
    private readonly devicesService: DevicesService,
  ) {}

  onModuleInit() {
    this.connect();
  }

  onModuleDestroy() {
    this.client?.end(true);
  }

  publishTurnOn(deviceId: string, timer: string, sessionId: string) {
    this.publishControl(deviceId, 'turn_on', timer, sessionId);
  }

  publishTurnOff(deviceId: string, timer: string, sessionId: string) {
    this.publishControl(deviceId, 'turn_off', timer, sessionId);
  }

  private connect() {
    const brokerUrl = process.env.MQTT_BROKER_URL;
    if (!brokerUrl) {
      this.logger.error('MQTT_BROKER_URL is not set');
      return;
    }

    const options: IClientOptions = {
      clientId: process.env.MQTT_CLIENT_ID,
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_PASSWORD,
      clean: true,
      keepalive: 60,
      reconnectPeriod: 5000,
    };

    this.client = connect(brokerUrl, options);

    this.client.on('connect', () => {
      this.logger.log('MQTT connected');
      this.client?.subscribe('+/energy/data', { qos: 0 }, (err) => {
        if (err) {
          this.logger.error(`MQTT subscribe failed: ${err.message}`);
        }
      });
    });

    this.client.on('message', (topic, payload) => {
      this.handleMessage(topic, payload);
    });

    this.client.on('error', (err) => {
      this.logger.error(`MQTT error: ${err.message}`);
    });
  }

  private handleMessage(topic: string, payload: Buffer) {
    if (!topic.endsWith('/energy/data')) {
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(payload.toString('utf-8'));
    } catch (error) {
      this.logger.warn('MQTT payload is not valid JSON');
      return;
    }

    if (!this.isEnergyDataPayload(parsed)) {
      this.logger.warn('MQTT payload does not match energy/data schema');
      return;
    }

    void this.handleEnergyData(topic, parsed);
  }

  private async handleEnergyData(topic: string, data: EnergyDataPayload) {
    const deviceId = data.id;
    this.logger.debug(
      `Telemetry ${deviceId} rpt=${data.rpt} st=${data.st} ts=${data.ts} topic=${topic}`,
    );
    void this.devicesService.markOnline(deviceId);
    await this.sessionsService.handleEnergyData(data);
  }

  private publishControl(
    deviceId: string,
    power: PowerCommand,
    timer: string,
    sessionId: string,
  ) {
    if (!this.client) {
      this.logger.error('MQTT client not connected');
      return;
    }

    const topic = `${deviceId}/energy/control`;
    const payload = {
      Device_id: deviceId,
      power,
      timer,
      session_id: sessionId,
    };

    this.client.publish(topic, JSON.stringify(payload), { qos: 0 }, (err) => {
      if (err) {
        this.logger.error(`MQTT publish failed: ${err.message}`);
      }
    });
  }

  private isEnergyDataPayload(value: unknown): value is EnergyDataPayload {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const payload = value as Record<string, unknown>;
    const rpt = payload.rpt;
    const st = payload.st;
    const ts = payload.ts;

    const validRpt = rpt === 's' || rpt === 'i' || rpt === 'f' || rpt === 'a';
    const validSt = typeof st === 'number';
    const validTs = typeof ts === 'number';
    const validId = typeof payload.id === 'string' && payload.id.length > 0;

    return validRpt && validSt && validTs && validId;
  }
}

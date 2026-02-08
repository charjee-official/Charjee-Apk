import { Controller, Get } from '@nestjs/common';

@Controller('admin')
export class AdminController {
  @Get('time-test')
  timeTest() {
    return {
      ok: true,
      now: new Date(),
      sampleSession: {
        startedAt: new Date(),
        endedAt: new Date(Date.now() + 45 * 60_000),
      },
      sampleStrings: [
        '2026-02-08T10:15:00Z',
        '2026-02-08 10:15',
        '08-02-2026 10:15',
        'not-a-date',
      ],
    };
  }
}

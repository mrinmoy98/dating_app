import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  // Simple health probe. "/" itself is served by the static React build
  // (see main.ts useStaticAssets), so we don't define a route for it here.
  @Public()
  @Get('health')
  health() {
    return { status: 'ok', service: 'dating-app-api' };
  }
}

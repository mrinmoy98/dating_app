import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import * as fs from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import helmet from 'helmet';


async function bootstrap() {
  const ssl = process.env.SSL === 'true';
  let httpsOptions = null;
  if (ssl) {
    httpsOptions = {
      key: fs.readFileSync(process.env.SSL_KEY_PATH || ''),
      cert: fs.readFileSync(process.env.SSL_CERT_PATH || ''),
    };
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    httpsOptions,
    logger: ['error', 'warn', 'log'],
  });

  app.use(
    helmet({
      crossOriginResourcePolicy: false,
      // The admin panel (public/admin.html) is served over http on LAN/dev and
      // shows user photos uploaded from any host, so relax two CSP defaults:
      //  - allow images from any http/https host (+ data/blob)
      //  - don't force-upgrade http requests to https (breaks http on LAN)
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'img-src': ["'self'", 'data:', 'blob:', 'http:', 'https:'],
          'media-src': ["'self'", 'data:', 'blob:', 'http:', 'https:'],
          'upgrade-insecure-requests': null,
        },
      },
    }),
  );

  app.set('trust proxy', 1);

  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  // Static assets = the admin panel only. User media lives on Cloudinary.
  app.useStaticAssets(join(__dirname, '..', 'public'), { prefix: '/' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalInterceptors(new ResponseInterceptor());

  const config = new DocumentBuilder()
    .setTitle('Dating App API')
    .setDescription(
      '**Dating App** — REST API for the mobile client and the admin dashboard.\n\n' +
      '- End users: phone + OTP flow under `/api/auth/*`, then complete registration.\n' +
      '- Admins: email + password under `/admin/auth/*`; all other `/admin/*` routes need the admin role.\n\n' +
      'Click **Authorize** and paste your JWT to try protected routes.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'JWT',
    )
    .addTag('User Auth', 'Phone/OTP login & registration (mobile app)')
    .addTag('User Profile', 'Current user profile & photo upload')
    .addTag('Admin Auth', 'Admin login (dashboard)')
    .addTag('Admin Users', 'User management & platform stats')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = Number(process.env.PORT) || 4000;
  const hostname = process.env.HOSTNAME || 'localhost';
  await app.listen(port, hostname, () => {
    const protocol = ssl ? 'https' : 'http';
    console.log(`\n💘 Dating App API running at ${protocol}://${hostname}:${port}/`);
    console.log(`📚 Swagger docs: ${protocol}://${hostname}:${port}/api-docs\n`);
  });
}
bootstrap();

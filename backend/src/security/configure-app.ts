import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { allowedOrigins, apiPrefix, trustProxyHops } from './http-config';

/**
 * Settings applied to the real server and to tests, so what is tested is what runs.
 * Headers: helmet's defaults except the content-security-policy (this server returns JSON, and the policy
 * would only get in the way of the API docs page), with resources allowed to be read cross-origin by CORS clients.
 */
export function configureApp(app: NestExpressApplication, env: NodeJS.ProcessEnv = process.env) {
  // Behind a reverse proxy every request looks like it comes from the proxy unless this is set,
  // which would make rate limiting treat a whole school as one user. Set TRUST_PROXY_HOPS=1 there.
  const hops = trustProxyHops(env.TRUST_PROXY_HOPS);
  if (hops > 0) app.set('trust proxy', hops);

  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.enableCors({
    origin: allowedOrigins(),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe());

  const prefix = apiPrefix(env.API_PREFIX);
  if (prefix) app.setGlobalPrefix(prefix);
}

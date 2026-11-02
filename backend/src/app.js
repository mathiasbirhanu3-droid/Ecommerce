const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const pinoHttp = require('pino-http');
const swaggerUi = require('swagger-ui-express');

const { env } = require('./config/env');
const { isProd } = require('./config/env');
const { logger, genReqId } = require('./utils/logger');
const { globalLimiter, authLimiter } = require('./middleware/rateLimiters');
const apiRoutes = require('./routes');
const { notFound } = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const openapiSpec = require('./docs/openapi');

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));

app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

app.use(mongoSanitize());
app.use(hpp());

app.use(globalLimiter);
app.use('/api/v1/auth', authLimiter);

app.use(
  pinoHttp({
    logger,
    genReqId,
    autoLogging: { ignore: (req) => req.url === '/api/v1/health' },
  })
);

app.use('/api/v1', apiRoutes);

// Executable docs (NFR-08) — OFF in production by default (defense-in-depth;
// it reveals route structure). To expose in prod deliberately: wrap in an env flag.
if (!isProd) {
  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));
}

app.get('/', (req, res) =>
  res.json({ success: true, message: 'Vendora API v1 is running', data: { docs: '/api/v1/docs' } })
);

app.all('*', notFound); // Express 4 pinned — v5 changes wildcard semantics
app.use(errorHandler);

module.exports = app;
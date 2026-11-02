const swaggerJsdoc = require('swagger-jsdoc');

const spec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Vendora API',
      version: '1.0.0',
      description: 'Multi-vendor marketplace API — /api/v1. Owner: Mathias Birhanu.',
    },
    servers: [{ url: 'http://localhost:5000' }],
    components: {
      securitySchemes: {
        cookieAuth: { type: 'apiKey', in: 'cookie', name: 'token' }, // ADR-04
      },
    },
    tags: [
      { name: 'Auth', description: 'Register, login, session, password reset' },
      { name: 'Users', description: 'Profile, password, default address' },
    ],
  },
  apis: ['./src/modules/**/*.routes.js'], // annotations live beside the routes they describe
});

module.exports = spec;
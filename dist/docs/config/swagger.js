import swaggerJSDoc from 'swagger-jsdoc';
import fs from 'fs';
import path from 'path';
// Read package.json manually since direct JSON imports are not supported in ESM
const packageJson = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8'));
const { version } = packageJson;
const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'JobRunner API Documentation',
        version,
        description: 'API documentation for the JobRunner backend service',
        license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT',
        },
        contact: {
            name: 'Muve Solutions LLP',
            url: 'https://example.com',
            email: 'info@example.com',
        },
    },
    servers: [
        {
            url: 'http://localhost:4000',
            description: 'Development server',
        },
        {
            url: 'https://api.example.com',
            description: 'Production server',
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
            apiKeyAuth: {
                type: 'apiKey',
                in: 'header',
                name: 'X-API-Key',
                description: 'API key authentication'
            },
        },
    },
    security: [
        {
            bearerAuth: [],
        },
        {
            apiKeyAuth: [],
        },
    ],
};
const options = {
    swaggerDefinition,
    apis: [
        './src/docs/schemas/*.ts',
        './src/docs/routes/*.ts',
    ],
};
const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;

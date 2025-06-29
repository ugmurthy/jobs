import swaggerJSDoc from 'swagger-jsdoc';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json manually since direct JSON imports are not supported in ESM
const packageJson = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8')
);
const { version } = packageJson;

// Define Swagger definition directly in this script
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
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

// Define paths
const swaggerJsonPath = path.resolve(__dirname, '../src/swagger.json');
const typesOutputPath = path.resolve(__dirname, '../src/types/api.ts');

// Define Swagger options
const options = {
  swaggerDefinition,
  apis: [
    './src/docs/schemas/*.ts',
    './src/docs/routes/*.ts',
  ],
};

/**
 * Generate Swagger/OpenAPI documentation from JSDoc comments
 * @param options SwaggerJSDoc options
 * @param outputPath Path to output the generated Swagger JSON
 */
function generateDocs(options, outputPath) {
  try {
    // Generate Swagger specification
    console.log('Generating Swagger documentation...');
    const swaggerSpec = swaggerJSDoc(options);

    // Ensure the output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write the Swagger specification to a JSON file
    fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2));
    console.log(`Swagger JSON file written to: ${outputPath}`);
    
    return swaggerSpec;
  } catch (error) {
    console.error('Error generating Swagger documentation:', error);
    throw error;
  }
}

/**
 * Generate TypeScript types from OpenAPI specification
 * @param swaggerJsonPath Path to the Swagger JSON file
 * @param outputPath Path to output the generated TypeScript types
 */
function generateTypes(swaggerJsonPath, outputPath) {
  try {
    // Ensure the swagger.json file exists
    if (!fs.existsSync(swaggerJsonPath)) {
      throw new Error(`Swagger JSON file not found at: ${swaggerJsonPath}`);
    }

    // Ensure the output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate types using openapi-typescript
    console.log(`Generating TypeScript types from ${swaggerJsonPath} to ${outputPath}`);
    
    // Execute the openapi-typescript command
    execSync(`npx openapi-typescript ${swaggerJsonPath} --output ${outputPath}`);
    
    console.log('TypeScript types generated successfully');
  } catch (error) {
    console.error('Error generating TypeScript types:', error);
    throw error;
  }
}

// Generate Swagger documentation
try {
  console.log('Generating API documentation...');
  
  // Generate Swagger JSON
  const swaggerSpec = generateDocs(options, swaggerJsonPath);
  
  // Generate TypeScript types from Swagger JSON
  generateTypes(swaggerJsonPath, typesOutputPath);
  
  console.log('API documentation generated successfully!');
} catch (error) {
  console.error('Error generating API documentation:', error);
  process.exit(1);
}
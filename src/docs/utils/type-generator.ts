import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Generate TypeScript types from OpenAPI specification
 * @param swaggerJsonPath Path to the Swagger JSON file
 * @param outputPath Path to output the generated TypeScript types
 */
export const generateTypes = (
  swaggerJsonPath: string,
  outputPath: string
): void => {
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
};
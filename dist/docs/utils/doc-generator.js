import fs from 'fs';
import path from 'path';
import swaggerJSDoc from 'swagger-jsdoc';
/**
 * Generate Swagger/OpenAPI documentation from JSDoc comments
 * @param options SwaggerJSDoc options
 * @param outputPath Path to output the generated Swagger JSON
 */
export const generateDocs = (options, outputPath) => {
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
    }
    catch (error) {
        console.error('Error generating Swagger documentation:', error);
        throw error;
    }
};
/**
 * Check if the Swagger documentation needs to be regenerated
 * @param sourcePaths Array of source file paths to check
 * @param swaggerJsonPath Path to the Swagger JSON file
 * @returns True if the documentation needs to be regenerated
 */
export const shouldRegenerateDocs = (sourcePaths, swaggerJsonPath) => {
    // If the Swagger JSON file doesn't exist, regenerate
    if (!fs.existsSync(swaggerJsonPath)) {
        return true;
    }
    // Get the last modified time of the Swagger JSON file
    const swaggerStats = fs.statSync(swaggerJsonPath);
    const swaggerMtime = swaggerStats.mtime.getTime();
    // Check if any source file is newer than the Swagger JSON file
    for (const sourcePath of sourcePaths) {
        try {
            const sourceStats = fs.statSync(sourcePath);
            if (sourceStats.mtime.getTime() > swaggerMtime) {
                return true;
            }
        }
        catch (error) {
            // If the source file doesn't exist, ignore it
            console.warn(`Source file not found: ${sourcePath}`);
        }
    }
    return false;
};

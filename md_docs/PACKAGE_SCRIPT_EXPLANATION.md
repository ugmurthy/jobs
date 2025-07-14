# Package.json Scripts Explanation

The scripts you asked about form an automated documentation and type generation workflow for your API. Here's what each one does:

## `"generate-docs": "node scripts/generate-docs.js"`
This script executes the Node.js script at `scripts/generate-docs.js`, which:
- Uses `swagger-jsdoc` to scan your codebase (specifically files in `./src/docs/schemas/*.ts` and `./src/docs/routes/*.ts`)
- Extracts JSDoc comments and generates an OpenAPI/Swagger specification
- Outputs this specification as JSON to `src/swagger.json`

## `"prebuild": "pnpm run generate-docs"`
This is an npm lifecycle hook that automatically runs before the `build` script. It ensures your API documentation is generated/updated before the application is built. This guarantees that your documentation always reflects the current state of your codebase.

## `"generate-types": "openapi-typescript src/swagger.json --output src/types/api.ts"`
This script uses the `openapi-typescript` tool to:
- Take your Swagger specification (`src/swagger.json`) as input
- Generate TypeScript type definitions that match your API
- Output these types to `src/types/api.ts`

These types provide type safety when working with your API endpoints, request parameters, and response objects.

## `"postgenerate-docs": "pnpm run generate-types"`
This is another npm lifecycle hook that automatically runs after the `generate-docs` script completes. It ensures that whenever your API documentation is updated, your TypeScript types are also regenerated to match.

## Execution Flow

The complete workflow works like this:
1. When you run `pnpm build` (line 16 in package.json), it triggers `prebuild`
2. `prebuild` runs `generate-docs` to create/update the Swagger documentation
3. After `generate-docs` completes, `postgenerate-docs` automatically runs
4. `postgenerate-docs` executes `generate-types` to create TypeScript types from the Swagger spec
5. Finally, the actual `build` script runs TypeScript compilation (`tsc`)

This automation ensures your API documentation and TypeScript types stay in sync with your codebase whenever you build the project.

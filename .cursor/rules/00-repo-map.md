# Flowise Repository Map

## Overview
Flowise is a monorepo containing 4 main packages for building AI agents and LLM orchestration workflows.

## Package Structure
- **`packages/server/`** → Backend API, authentication, SSO, database, middleware
- **`packages/ui/`** → React frontend, branding, UI components, user interface
- **`packages/components/`** → Node integrations, LLM providers, tools, vector stores
- **`packages/api-documentation/`** → Swagger/OpenAPI documentation server

## Development Modes

### Production Mode
```bash
pnpm build  # Build all packages
pnpm start  # Start production server on :3000
```

### Development Mode
```bash
pnpm dev    # Hot reload on :8080 (UI) and :3000 (API)
```

### Global Installation
```bash
npm install -g flowise
npx flowise start  # Quick start on :3000
```

### Docker Mode
```bash
cd docker
docker compose up -d  # Containerized deployment
```

## Navigation Heuristics

### Locate Before Edit Protocol
1. **Always search first** using semantic search to understand existing patterns
2. **Check similar implementations** before creating new ones
3. **Verify file locations** match the package structure above
4. **Read related files** to understand dependencies and interfaces

### Package Boundaries
- **Server changes** → Only modify `packages/server/**` files
- **UI changes** → Only modify `packages/ui/**` files  
- **Node/integration changes** → Only modify `packages/components/**` files
- **API docs changes** → Only modify `packages/api-documentation/**` files

## Key Directories

### Backend (`packages/server/`)
- `src/controllers/` → API route handlers
- `src/enterprise/sso/` → SSO providers (Auth0, Azure, Google, GitHub)
- `src/enterprise/middleware/` → Authentication middleware
- `src/routes/` → Express route definitions
- `src/database/` → Database models and migrations

### Frontend (`packages/ui/`)
- `src/ui-component/` → Reusable UI components
- `src/views/` → Page components (chatflows, settings, etc.)
- `src/assets/images/` → Branding assets and icons
- `src/layout/` → Layout components and navigation

### Components (`packages/components/`)
- `src/nodes/` → Node implementations by category
- `src/credentials/` → Credential management
- `src/Interface.ts` → Core interfaces and types

## Safety Constraints

### Testing Requirements
- **Always test** authentication changes in isolation
- **Verify SSO** configuration before deployment
- **Test API endpoints** after route modifications
- **Validate UI changes** across different themes (light/dark)

### Environment Variables
- **Gate new features** behind environment variables
- **Use feature flags** for experimental functionality
- **Never hardcode** sensitive configuration
- **Configure in packages/server/.env** for server settings
- **Configure in packages/ui/.env** for frontend settings (VITE_PORT)

### Breaking Changes
- **Maintain backward compatibility** for API changes
- **Version node interfaces** when modifying INode structure
- **Update documentation** for any public API changes

## File Patterns
- **Routes**: `packages/server/src/routes/*.ts`
- **Controllers**: `packages/server/src/controllers/*.ts`
- **SSO**: `packages/server/src/enterprise/sso/*.ts`
- **UI Components**: `packages/ui/src/ui-component/**/*.jsx`
- **Node Types**: `packages/components/src/nodes/*/`
- **API Docs**: `packages/api-documentation/src/yml/swagger.yml`

## Build Requirements
- **Node.js**: >= 18.15.0
- **Package Manager**: PNPM (required for monorepo)
- **Memory**: May need `NODE_OPTIONS="--max-old-space-size=4096"` for build
- **Ports**: 3000 (API), 8080 (UI dev), 6655 (API docs)

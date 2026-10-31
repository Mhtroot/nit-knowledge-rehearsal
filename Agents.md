# AGENTS.md - Agent Instructions & Architecture Guide

Welcome to **AgenticBots_ServiceBase**. This file serves as the single source of truth and operating handbook for AI agents (and human developers) working on this codebase.

---

## ⚠️ CRITICAL AGENT DIRECTIVES

### 1. Mandatory Nest CLI Usage
**ALWAYS use the Nest CLI (`npx nest g <schematic> <name>`) when generating new components, modules, services, controllers, or resources.**
- **Do NOT manually create boilerplate files** when a Nest CLI generator exists.
- The Nest CLI ensures:
  - Correct NestJS architectural placement and schematic standards.
  - Automatic registration and importing in parent modules (e.g., updating `app.module.ts` or feature modules).
  - Creation of matching `.spec.ts` test files.
- See the [Nest CLI Command Reference](#nest-cli-command-reference) section below for exact syntax.

### 2. Self-Updating Documentation Protocol
**Keep this document alive.**
- Whenever you introduce **significant changes** to the architecture, add new modules, alter authentication/authorization schemes, add new core dependencies, modify database patterns, or change deployment/testing workflows, **you MUST update this `Agents.md` file accordingly**.
- Do not let this documentation drift from the actual state of the codebase.

---

## 🏛️ Project Architecture Overview

This project is a scalable backend service built on the **NestJS 11** framework (Node.js runtime + TypeScript), following modular design, strict dependency injection, and clean separation of concerns.

```
                           +------------------------+
                           |       main.ts          |
                           | (Bootstrap, Pipes,     |
                           |  Swagger, CORS, Env)   |
                           +-----------+------------+
                                       |
                                       v
                           +------------------------+
                           |       AppModule        |
                           +-----------+------------+
                                       |
                   +-------------------+-------------------+
                   |                                       |
                   v                                       v
         +--------------------+                 +--------------------+
         |     AuthModule     |                 |  DbContextModule   |
         | (JWT, Passport)    |                 | (PrismaClient, DB) |
         +--------------------+                 +--------------------+
                   |                                       |
                   v                                       v
         [Feature Modules...] -----------------> [DbContextService]
     (Controller -> Service -> DB)                         |
                                                           v
                                                  [MariaDB / MySQL DB]
```

### Core Architecture Layers:

1. **Application Bootstrap (`src/main.ts`)**:
   - Environment loading via Node.js native `process.loadEnvFile()` (no extra dotenv dependency needed).
   - Global validation via `ValidationPipe` with `{ whitelist: true, forbidNonWhitelisted: true, transform: true }`.
   - Dynamic CORS configuration via `CORS_ORIGIN` env variable.
   - OpenAPI / Swagger documentation mounted at `/docs` (JSON spec at `/docs/json`, YAML at `/docs/yaml`) with Bearer Auth enabled.

2. **Root Module (`src/app.module.ts`)**:
   - Root orchestrator aggregating feature modules (`DbContextModule`, `AuthModule`, and any newly created business feature modules).

3. **Database Layer (`prisma/` & `src/db-context/`)**:
   - **ORM**: Prisma v7 (`@prisma/client`, `prisma`).
   - **Database Provider**: MariaDB / MySQL using `@prisma/adapter-mariadb`.
   - **Configuration**: a single `DATABASE_URL` (`mysql://user:pass@host:port/db`) env variable is used by both `prisma.config.ts` (migrations/generate) and the runtime `DbContextService`.
   - **Generated client**: `prisma/schema.prisma` uses the `prisma-client` generator with output `src/generated/prisma` (git-ignored, compiled into `dist/`). Run `npm run db:generate` (`prisma generate`) after `npm install` and after every schema change. Import types from `../generated/prisma/client`, never from `@prisma/client`.
   - **`DbContextService` (`src/db-context/db-context.service.ts`)**:
     - The single owner of the `PrismaClient`; exposes it as the readonly `db` property (the dbContext).
     - Builds the `@prisma/adapter-mariadb` adapter from `DATABASE_URL`, connects and runs a heartbeat (`SELECT 1`) on `OnModuleInit`, disconnects on `OnModuleDestroy`.
   - **`DbContextModule`** is `@Global()` and exports `DbContextService`, so feature modules do not need to import it.
   - **Usage pattern**: every model gets its own service (`npx nest g resource <name>`) that injects `DbContextService` and queries via `this.dbContext.db.<model>`. Controllers never touch `dbContext` directly:
     ```typescript
     @Injectable()
     export class UsersService {
       constructor(private readonly dbContext: DbContextService) {}

       findById(id: number) {
         return this.dbContext.db.user.findUnique({ where: { id } });
       }
     }
     ```

4. **Authentication & Authorization Layer (`src/auth/`)**:
   - **Standard JWT & Passport Integration**: Uses `@nestjs/jwt` and `@nestjs/passport` with `passport-jwt` strategy, verified locally using `JWT_SECRET` (symmetric HS256).
   - **`JwtStrategy` (`src/auth/jwt.strategy.ts`)**: Passport JWT strategy that extracts Bearer tokens, verifies them against `JWT_SECRET`, and validates the token payload (`JwtPayload`).
   - **`AuthService` (`src/auth/auth.service.ts`)**: Helper service providing `signToken(payload)` and `verifyToken(token)` via `@nestjs/jwt`.
   - **Guards (`src/auth/guards/`)**:
     - `JwtAuthGuard`: generic JWT guard (`AuthGuard('jwt')`) allowing any valid authenticated user.
     - `AdminGuard`: requires `role === 'admin'` and `type === 'access'`, attaches `req.user` (`JwtPayload`) to `AuthedRequest` (`src/auth/authed-request.ts`).
     - `UserGuard`: requires `role === 'user'` and `type === 'access'`, attaches `req.user`.
   - **`AuthModule`** exports `AuthService`, `JwtModule`, `PassportModule`, `JwtStrategy`, `AdminGuard`, `UserGuard`, and `JwtAuthGuard`. Feature modules import `AuthModule` to use the guards and auth services.
   - **`AuthTestModule` (`src/auth-test/`)**: sample `admin/me` and `user/me` routes for verifying auth wiring; remove it from `AppModule` for production if not needed.
   - **Swagger Integration**: Protected controller routes must be annotated with `@ApiBearerAuth()` and `@UseGuards(AdminGuard | UserGuard)`.

---

## 📁 Repository Structure

```
.
├── .env.example              # Template for required environment variables
├── nest-cli.json             # NestJS CLI configuration
├── package.json              # Project scripts and dependencies
├── prisma.config.ts          # Prisma v7 configuration (migrations, schema, datasource)
├── prisma/
│   └── schema.prisma         # Prisma schema definitions (models, relations)
├── src/
│   ├── main.ts               # Application entry point & global configuration
│   ├── app.module.ts         # Root module
│   ├── app.controller.ts     # Health / root endpoints
│   ├── app.service.ts        # Root business logic
│   ├── auth/                 # Central authentication & JWT verification
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts   # Token signing and verification helper
│   │   ├── authed-request.ts # AuthedRequest type
│   │   ├── jwt.interface.ts  # JwtPayload and Role definitions
│   │   ├── jwt.strategy.ts   # Passport JWT Strategy (HS256 via JWT_SECRET)
│   │   └── guards/           # AdminGuard, UserGuard, JwtAuthGuard (+ specs)
│   ├── auth-test/            # Sample protected routes (module + controller)
│   ├── db-context/           # Database access module
│   │   ├── db-context.module.ts  # Global module
│   │   └── db-context.service.ts # Owns PrismaClient (`db`) + lifecycle
│   └── generated/prisma/     # Generated Prisma client (git-ignored)
└── test/                     # End-to-end tests
    ├── app.e2e-spec.ts
    └── jest-e2e.json
```

---

## ⚡ Nest CLI Command Reference

Always use `npx nest` commands when generating code:

| Task | Command | Description |
| :--- | :--- | :--- |
| **New Full Resource** | `npx nest g resource <name>` | Generates module, controller, service, DTOs, and specs in one step |
| **New Module** | `npx nest g module <name>` | Generates a new module and imports it into parent module |
| **New Controller** | `npx nest g controller <name>` | Generates a controller and registers it in its module |
| **New Service** | `npx nest g service <name>` | Generates a service provider and registers it in its module |
| **New Guard** | `npx nest g guard <path/name>` | Generates a CanActivate guard |
| **New Pipe** | `npx nest g pipe <path/name>` | Generates a PipeTransform |
| **New Interceptor** | `npx nest g interceptor <path/name>` | Generates a NestInterceptor |
| **New Filter** | `npx nest g filter <path/name>` | Generates an ExceptionFilter |

> **Flag Tips:**
> - To skip spec file creation when writing tests separately: `--no-spec`
> - To preview generation without writing files: `--dry-run`

---

## 🛠️ Development & Operational Workflows

### Package Installation
```bash
npm install
```

### Local Development
```bash
npm run start:dev       # Starts server with file-watching enabled
```

### Production Build & Run
```bash
npm run build           # Compiles TypeScript into dist/
npm run start:prod      # Runs node dist/main
```

### Linting & Formatting
```bash
npm run lint            # ESLint check & auto-fix
npm run format          # Prettier formatting across src/ and test/
```

### Testing
```bash
npm run test            # Run unit tests (Jest)
npm run test:watch      # Run tests in watch mode
npm run test:cov        # Generate test coverage report
npm run test:e2e        # Run e2e integration tests (Supertest)
```

### Prisma & Database Commands
```bash
npx prisma format                         # Format schema.prisma
npm run db:generate                       # Generate Prisma Client into src/generated/prisma
npx prisma migrate dev --name <migration> # Create and run database migrations
npx prisma db push                        # Push schema directly to database (dev/prototyping)
npx prisma studio                         # Launch visual database GUI
```

---

## 📐 Coding Conventions & Best Practices

### 1. DTOs and Validation
- Every incoming HTTP payload MUST have a corresponding DTO class.
- Always use `class-validator` decorators (`@IsString()`, `@IsNotEmpty()`, `@IsOptional()`, `@IsEmail()`, etc.) and `class-transformer` (`@Type()`).
- Document all DTO properties with `@ApiProperty()` or `@ApiPropertyOptional()` for OpenAPI / Swagger.

### 2. Dependency Injection
- Never manually instantiate dependencies using `new ClassName()`.
- Use constructor injection:
  ```typescript
  @Injectable()
  export class ProductsService {
    constructor(private readonly dbContext: DbContextService) {}
  }
  ```
- Avoid circular dependencies. If two modules require each other, extract shared logic into a separate module or use `forwardRef()` only as a last resort.

### 3. Controller Design & REST Standards
- Keep controllers lean; business logic belongs in services.
- Always apply appropriate HTTP decorators: `@Get()`, `@Post()`, `@Put()`, `@Patch()`, `@Delete()`.
- Explicitly use HTTP status codes when deviating from defaults (e.g. `@HttpCode(HttpStatus.CREATED)`).
- Protect sensitive endpoints with `@UseGuards(AdminGuard)` or `@UseGuards(UserGuard)` and document them with `@ApiBearerAuth()`.

### 4. Error Handling
- Use NestJS standard `HttpException` classes:
  - `BadRequestException` (400)
  - `UnauthorizedException` (401)
  - `ForbiddenException` (403)
  - `NotFoundException` (404)
  - `ConflictException` (409)
  - `InternalServerErrorException` (500)
- Do not let unhandled raw database errors bubble up to the client; catch and transform them into semantic HTTP exceptions.

### 5. Environment Variables
- Do NOT hardcode secrets, ports, or credentials.
- When introducing a new environment variable:
  1. Add it to `.env.example` with a clear comment/placeholder.
  2. Access it via `process.env.VARIABLE_NAME`.
  3. Update `Agents.md` if the variable alters architectural setup.

---

## 🔒 Security & Guardrails

- **Never bypass `ValidationPipe`:** The application relies on `{ whitelist: true, forbidNonWhitelisted: true }` to strip unknown fields and prevent mass assignment attacks.
- **Authentication**: All service tokens are verified locally using symmetric `JWT_SECRET` (HS256) via Passport and `@nestjs/jwt` (switched from IAM RS256 by user authorization).
- **Never expose sensitive fields:** Exclude password hashes, internal IDs, or raw credentials in responses.

# AGENTS.md - Agent Instructions & Architecture Guide

Welcome to **AgenticBots_ServiceBase**. This file serves as the single source of truth and operating handbook for AI agents (and human developers) working on this codebase.

---

## ⚠️ CRITICAL AGENT DIRECTIVES
*DO NOT COMMIT OR PUSH ANYTHING ON GITHUB. ACT AS SENIOR BACKEND DEVELOPER. FOLLOW THE PROJECT STRUCTURE.*

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
                           |  Swagger, CORS, Static)|
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
         | (JWT, Bcrypt, RLS) |                 | (PrismaClient, DB) |
         +--------------------+                 +--------------------+
                   |                                       |
                   v                                       v
         [Feature Modules...] -----------------> [DbContextService]
     (Controller -> Service -> Repo)                       |
     (News, Workshops, Excel)                              v
                                                  [MariaDB / MySQL DB]
```

### Core Architecture Layers:

1. **Application Bootstrap (`src/main.ts`)**:
   - Environment loading via Node.js native `process.loadEnvFile()` when `.env` exists.
   - Global validation via `ValidationPipe` with `{ whitelist: true, forbidNonWhitelisted: true, transform: true }`.
   - Dynamic CORS configuration via `CORS_ORIGIN` env variable (`*` fallback).
   - Static file serving:
     - `/frontend` directory served at root.
     - `/assets` directory mounted with prefix `/assets/` (serving uploaded images from `/assets/images/`).
   - OpenAPI / Swagger documentation mounted at `/docs` (JSON spec at `/docs/json`, YAML at `/docs/yaml`) with Bearer Auth enabled.

2. **Root Module (`src/app.module.ts`)**:
   - Root orchestrator aggregating core and feature modules:
     - `DbContextModule` (Global database layer)
     - `AuthModule` (Authentication & authorization)
     - `NewsModule` (News articles and media attachments)
     - `WorkshopModule` (Workshops & banners)
     - `ExcelModule` (User demographics spreadsheet export)

3. **Database Layer (`prisma/` & `src/db-context/`)**:
   - **ORM**: Prisma v7 (`@prisma/client`, `prisma`).
   - **Database Provider**: MariaDB / MySQL using `@prisma/adapter-mariadb`.
   - **Configuration**: `DATABASE_URL` (`mysql://user:pass@host:port/db`) env variable used by `prisma.config.ts` (migrations/generate) and runtime `DbContextService`.
   - **Generated client**: `prisma/schema.prisma` outputs to `src/generated/prisma` (git-ignored, compiled into `dist/`). Run `npm run db:generate` (`prisma generate`) after schema changes. Always import types from `src/generated/prisma/client`.
   - **`DbContextService` (`src/db-context/db-context.service.ts`)**:
     - The single owner of `PrismaClient`, exposed as the readonly `db` property.
     - Instantiates the `@prisma/adapter-mariadb` adapter from `DATABASE_URL`, connects and executes a heartbeat query (`SELECT 1`) on `OnModuleInit`, disconnects on `OnModuleDestroy`.
   - **`DbContextModule`** is `@Global()` and exports `DbContextService`, so feature modules do not need to re-import it.
   - **Repository Pattern**: Business services delegate direct queries to dedicated repositories, which inject `DbContextService`:
     ```typescript
     @Injectable()
     export class WorkshopRepository {
       constructor(private readonly dbContext: DbContextService) {}

       findUnique(id: number) {
         return this.dbContext.db.workshop.findUnique({ where: { id } });
       }
     }
     ```

4. **Authentication & Authorization Layer (`src/auth/`)**:
   - **JWT Token Management**: Direct verification using `@nestjs/jwt` (`JwtService.verifyAsync()`) with symmetric `JWT_SECRET` (HS256).
   - **Password Security**: Bcrypt-based hashing and validation via helper functions (`src/auth/helper/password.helper.ts`).
   - **Guards (`src/auth/guards/`)**:
     - `AdminAuthGuard`: Extracts Bearer token, verifies signature, verifies `role === 'admin'`, and populates `req.user` (`JwtPayload`).
     - `AuthGuard` (User Guard): Extracts Bearer token, verifies signature, verifies `role === 'user'`, and populates `req.user`.
   - **Controllers & Endpoints**:
     - `AdminAuthController` (`/auth`):
       - `POST /auth/login/admin`: Authenticate admin with username/password, returns JWT.
       - `POST /auth/admin`: Register a new admin account (hashes password with bcrypt).
     - `AuthController` (`/auth`):
       - `POST /auth/user`: Register participant user with optional national code (`ssn`), full name, phone number (normalizes Iranian prefixes `+98`/`98` to `0`), and family metrics (`childCount`, `teenageCount`, `adultCount`).
       - `GET /auth/validate/user`: Validates user Bearer token (`AuthGuard`).

5. **News & Media Layer (`src/news/`)**:
   - **Models**: `News` (title, description, timestamps) and `NewsImage` (path, newsId) managed via `NewsRepository` and `NewsImageRepository`.
   - **Local Storage**: Uploaded news images are stored on disk in `/assets/images/` via Multer (`newsMulterOptions` in `src/news/helpers/news-storage.ts`).
   - **Endpoints**:
     - `POST /news`: Create news with optional multi-image uploads (`AdminAuthGuard`).
     - `GET /news` & `GET /news/:id`: Public endpoints returning news articles with image paths.
     - `PATCH /news/:id`: Update title/description with optional image attachments (`AdminAuthGuard`).
     - `DELETE /news/:id`: Remove article and purge physical files from disk (`AdminAuthGuard`).
   - **File Safety**: Automatic disk cleanup of orphaned files on failed upload operations or item deletions (`deleteImageFile`).

6. **Workshops Layer (`src/workshops/`)**:
   - **Model**: `Workshop` (id, title, description, bannerPath).
   - **Endpoints**:
     - `GET /workshop` & `GET /workshop/:id`: Public access to workshop entries.
     - `POST /workshop`: Create workshop with optional banner upload (`AdminAuthGuard`, `bannerPath` saved to `/assets/images/`).
     - `PUT /workshop/:id`: Update workshop fields and/or replace banner (`AdminAuthGuard`).
     - `DELETE /workshop/:id`: Delete workshop and delete associated banner image file (`AdminAuthGuard`).

7. **Excel Export Layer (`src/excel/`)**:
   - **Endpoints**:
     - `GET /export`: Protected by `AdminAuthGuard`. Fetches registered users and their household metrics, generates an `.xlsx` workbook via `exceljs`, and streams it back as `users.xlsx` with appropriate headers.

8. **Containerization & Deployment Layer**:
   - **`Dockerfile`**: Multi-stage build (Node 22 Alpine) compiling TypeScript and generating Prisma client in `builder`, executing on a lean `production` image.
   - **`docker-entrypoint.sh`**: Runs `npx prisma db push` before booting the application via `exec node dist/main.js`.
   - **`docker-compose.yml`**:
     - `db`: MariaDB 11 service (`elm-db`) with persistent volume `db_data` and internal health checks.
     - `app`: NestJS service dependent on healthy `db`, with mounted volume `app_assets:/app/assets` to persist uploaded media files.

---

## 📁 Repository Structure

```
.
├── .dockerignore             # Docker build ignores
├── .env.example              # Template for required environment variables
├── assets/                   # Static runtime storage (git-ignored)
│   ├── excel/                # Exported/temporary excel files
│   └── images/               # Uploaded news & workshop images
├── docker-compose.yml        # Docker compose stack (MariaDB + NestJS app)
├── docker-entrypoint.sh      # Container entrypoint (prisma db push + node start)
├── Dockerfile                # Multi-stage production container build
├── frontend/                 # Static frontend client files
├── nest-cli.json             # NestJS CLI configuration
├── package.json              # Project scripts and dependencies
├── prisma.config.ts          # Prisma v7 configuration
├── prisma/
│   └── schema.prisma         # Prisma schema definitions (Admin, User, News, NewsImage, Workshop)
├── src/
│   ├── main.ts               # Application entry point, Swagger, CORS, Static Assets
│   ├── app.module.ts         # Root module
│   ├── app.controller.ts     # Health / root endpoints
│   ├── app.service.ts        # Root business logic
│   ├── auth/                 # Central authentication & JWT verification
│   │   ├── auth.module.ts
│   │   ├── controllers/      # AdminAuthController, AuthController
│   │   ├── core/             # AuthedRequest, JwtPayload, Role types
│   │   ├── dto/              # CreateAdminDto, CreateUserDto
│   │   ├── guards/           # AdminAuthGuard, AuthGuard (User)
│   │   ├── helper/           # Bcrypt password hashing & comparison
│   │   └── services/         # AdminService, AdminRepository, UserService, UserAuthRepository
│   ├── db-context/           # Database access module
│   │   ├── db-context.module.ts  # Global module
│   │   └── db-context.service.ts # Owns PrismaClient (`db`) + pool lifecycle
│   ├── excel/                # Excel export module
│   │   ├── excel.module.ts
│   │   ├── controllers/      # ExcelController (GET /export)
│   │   ├── helpers/          # Excel generation helpers
│   │   └── services/         # ExcelService (exceljs workbook creation)
│   ├── generated/prisma/     # Generated Prisma client (git-ignored)
│   ├── news/                 # News & media module
│   │   ├── news.module.ts
│   │   ├── controllers/      # NewsController (Admin CRUD + public read)
│   │   ├── core/             # NewsEntity types
│   │   ├── dto/              # CreateNewsDto, UpdateNewsDto
│   │   ├── helpers/          # Multer disk storage & deleteImageFile helper
│   │   └── services/         # NewsService, NewsRepository, NewsImageService, NewsImageRepository
│   └── workshops/            # Workshop management module
│       ├── workshop.module.ts
│       ├── controllers/      # WorkshopController (Admin CRUD + public read)
│       ├── core/             # Workshop types
│       ├── dto/              # CreateWorkshopDto, UpdateWorkshopDto
│       └── services/         # WorkshopService, WorkshopRepository
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

### Docker Workflows
```bash
docker compose up -d --build   # Build and start MariaDB and app services in background
docker compose logs -f app     # Follow application logs
docker compose down            # Stop and remove containers (data persisted in volumes)
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

### 2. Dependency Injection & Repository Pattern
- Never manually instantiate dependencies using `new ClassName()`.
- Inject dependencies via constructors.
- Maintain the separation of concerns: **Controller -> Service -> Repository -> `DbContextService`**.
- Avoid circular dependencies. If two modules require each other, extract shared logic into a separate module or use `forwardRef()` only as a last resort.

### 3. Controller Design & REST Standards
- Keep controllers lean; business logic belongs in services and database queries belong in repositories.
- Always apply appropriate HTTP decorators: `@Get()`, `@Post()`, `@Put()`, `@Patch()`, `@Delete()`.
- Explicitly use HTTP status codes when deviating from defaults (e.g. `@HttpCode(HttpStatus.CREATED)`).
- Protect sensitive endpoints with `@UseGuards(AdminAuthGuard)` or `@UseGuards(AuthGuard)` and document them with `@ApiBearerAuth()`.

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
- **Authentication**: All service tokens are verified locally using symmetric `JWT_SECRET` (HS256) directly with `@nestjs/jwt`.
- **Passswords**: Always hash credentials using `hashPassword` (bcrypt) before saving to the database.
- **Never expose sensitive fields:** Exclude password hashes, internal secrets, or raw credentials in responses.

# AGENTS.md - Agent Coding Guidelines

This document provides guidelines for agents working on the tracking-sheet codebase.

## Project Overview

- **Framework**: AdonisJS v7 with React/Inertia
- **Language**: TypeScript (required)
- **Database**: SQLite with Lucid ORM
- **Testing**: Japa (unit, functional, browser suites)
- **Node**: >=24.0.0

## Commands

### Development

```bash
npm run dev          # Start dev server with HMR
npm start            # Start production server
```

### Building

```bash
npm run build        # Production build
npm run typecheck    # TypeScript check (app + inertia)
```

### Testing

```bash
npm run test                          # Run all test suites
node ace test --suites=unit           # Run specific suite (unit/functional/browser)
node ace test tests/unit/user.spec.ts # Run single test file
node ace test --watch                 # Watch mode
```

### Linting & Formatting

```bash
npm run lint      # ESLint
npm run format    # Prettier (write)
```

## Code Style

### Formatting

- **Indentation**: 2 spaces (enforced by .editorconfig)
- **Line endings**: LF, **Charset**: UTF-8
- **Trailing whitespace**: Trimmed, **Final newline**: Required

### TypeScript

- Use TypeScript for all files (no `.js` in app/)
- Enable `strict: true` (inherited from @adonisjs/tsconfig)
- Define return types for functions when not trivial
- Use interface over type for object shapes

### Naming Conventions

- **Classes**: PascalCase (e.g., `User`, `SessionController`)
- **Files**: kebab-case (e.g., `auth-middleware.ts`)
- **Variables/functions**: camelCase
- **React components**: PascalCase (file and export)

### Imports (use path aliases)

```typescript
import User from '#models/user'
import SessionController from '#controllers/session_controller'
import { signupValidator } from '#validators/user'
import AuthMiddleware from '#middleware/auth_middleware'
import hash from '@adonisjs/core/services/hash'
```

### Database Models (Lucid ORM)

- Extend `BaseModel` via schema composition
- Use decorators: `@column()`, `@column.dateTime()`
- Define `$columns` static property
- Use `DateTime` from luxon for timestamps

```typescript
export class UserSchema extends BaseModel {
  static $columns = ['id', 'email', 'createdAt'] as const
  $columns = UserSchema.$columns

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare email: string
}
```

### Validation (Vine.js)

- Create validators in `app/validators/`
- Use `vine.create()` to compile schema

```typescript
import vine from '@vinejs/vine'
export const createUserValidator = vine.create({
  email: vine.string().email(),
  password: vine.string().minLength(8),
})
```

### Controllers

- Single responsibility per action
- Return Inertia responses via `inertia.render()`
- Use `HttpContext` for request/response access

```typescript
import type { HttpContext } from '@adonisjs/core/http'
export default class SessionController {
  async create({ inertia }: HttpContext) {
    return inertia.render('auth/login', {})
  }
}
```

### Middleware

- Class-based middleware with `handle(ctx, next, options?)` method
- Define `redirectTo` for auth failures

### Error Handling

- Use global `ExceptionHandler` in `app/exceptions/handler.ts`
- Define status pages for error codes
- Use `super.handle()` / `super.report()` in custom handlers

### React Components (Inertia)

- Functional components with TypeScript, `.tsx` extension
- Props interface for type safety
- Inertia pages in `inertia/pages/`

```tsx
interface Props {
  user: { id: number; name: string }
}
export default function Home({ user }: Props) {
  return <div>Hello {user.name}</div>
}
```

### Testing (Japa)

- Test files: `tests/unit/**/*.spec.ts`, `tests/functional/**/*.spec.ts`
- Use `@japa/assert` for assertions
- Use `@japa/plugin-adonisjs` for AdonisJS test helpers

```typescript
import { test } from '@japa/runner'
test('get user by id', async ({ assert, client }) => {
  const response = await client.get('/users/1')
  assert.equal(response.status(), 200)
})
```

### Git & Commits

- Do not commit secrets (`.env`, credentials)
- Run lint/typecheck before committing

## File Structure

```
app/
├── controllers/    # HTTP controllers
├── exceptions/      # Error handlers
├── middleware/      # HTTP middleware
├── models/          # Database models
├── transformers/    # API transformers
├── validators/      # Vine.js validators
inertia/pages/       # React pages
tests/
├── unit/           # Unit tests
├── functional/     # Functional tests
```

## Known Configuration

- Prettier: `@adonisjs/prettier-config`
- ESLint: `@adonisjs/eslint-config`
- Vite for frontend bundling
- hot-hook for HMR on backend changes

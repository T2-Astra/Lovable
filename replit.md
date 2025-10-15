# AI-Powered Web Application Builder

## Overview

This is an AI-powered web application builder that allows users to create applications and websites through conversational prompts. The platform generates clean, editable code in real-time and provides a live preview of the built application. Users can manage multiple projects, view conversation history with the AI, edit generated code, and preview their applications instantly.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- **React 18** with TypeScript for type-safe component development
- **Vite** as the build tool and development server, providing fast hot module replacement (HMR)
- **Wouter** for lightweight client-side routing (alternative to React Router)
- **TanStack Query** (React Query) for server state management, caching, and data fetching

**UI Design System**
- **shadcn/ui** components built on Radix UI primitives for accessible, customizable components
- **Tailwind CSS** for utility-first styling with custom design tokens
- **Design philosophy**: Hybrid approach combining reference-based landing pages (inspired by Linear, Vercel, Replit) with a minimal, code-focused application interface
- **Typography**: Inter for interface text, JetBrains Mono for code display
- **Color scheme**: Dark mode primary with purple accent colors (270° hue, 70% saturation, 60% lightness)

**Key UI Components**
- Monaco Editor integration (`@monaco-editor/react`) for syntax-highlighted code editing
- Real-time live preview system using iframe sandboxing
- Project sidebar with file tree navigation
- Conversation history display with user/assistant message differentiation

### Backend Architecture

**Server Framework**
- **Express.js** with TypeScript running on Node.js
- **ESM modules** (type: "module") for modern JavaScript imports
- Custom middleware for request logging and error handling

**API Structure**
- RESTful endpoints organized by resource:
  - `/api/projects` - Project CRUD operations
  - `/api/conversations/:projectId` - Conversation history per project
  - `/api/code-files/:projectId` - Code file management per project
  - `/api/generate` - AI code generation endpoint (streaming responses)

**Storage Strategy**
- In-memory storage implementation (`MemStorage` class) using JavaScript Maps
- Interface-based storage abstraction (`IStorage`) allowing for future database integration
- Data models: Projects, Conversations, CodeFiles with relationships

**Development Environment**
- Vite development server integration in middleware mode
- Hot reload support with Replit-specific plugins for development
- Production build uses esbuild for server bundling

### Data Storage

**Current Implementation**
- In-memory storage using Map data structures (ephemeral)
- UUID-based entity identification using Node's `crypto.randomUUID()`

**Database Schema (Configured for Future Use)**
- **Drizzle ORM** configured with PostgreSQL dialect
- Schema defined in `shared/schema.ts` with three main tables:
  - `projects`: id, name, description, createdAt, updatedAt
  - `conversations`: id, projectId (FK), role, content, timestamp
  - `code_files`: id, projectId (FK), filename, content, language, updatedAt
- Foreign key relationships with cascade delete on project removal
- **Neon Database** serverless PostgreSQL integration ready (`@neondatabase/serverless`)

**Validation**
- Zod schemas generated from Drizzle tables for runtime type validation
- Shared schema types between client and server via `@shared` path alias

### External Dependencies

**AI/Code Generation**
- AI code generation endpoint implemented but provider not specified in codebase
- Streaming response architecture for real-time code generation updates

**Development Tools**
- **Replit Platform Integration**:
  - `@replit/vite-plugin-runtime-error-modal` for error overlays
  - `@replit/vite-plugin-cartographer` for development tooling
  - `@replit/vite-plugin-dev-banner` for development environment indicators
  - Only loaded in development when `REPL_ID` environment variable is present

**UI Component Libraries**
- Radix UI primitives (20+ packages) for accessible headless components
- Lucide React for consistent iconography
- React Hook Form with Zod resolvers for form validation
- Monaco Editor for code editing capabilities

**Database & Session**
- Neon serverless PostgreSQL (configured, not actively used)
- `connect-pg-simple` for PostgreSQL-backed session storage
- Drizzle Kit for schema migrations

**Styling & Utilities**
- Tailwind CSS with PostCSS processing
- `class-variance-authority` for component variant management
- `clsx` and `tailwind-merge` for conditional class composition
- `date-fns` for date manipulation
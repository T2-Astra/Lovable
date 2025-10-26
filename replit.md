# AI Website Builder

An AI-powered full-stack website builder similar to Bolt.new that uses Google's Gemini API to generate complete web applications from natural language prompts.

## Overview

This application allows users to describe a web application in plain English and watch as AI generates a complete, working project with live preview. The interface features a three-panel workspace inspired by professional code editors, with file explorer, code viewer, and live preview.

## Features

- **AI Code Generation**: Uses Gemini 2.5 Flash to generate complete web applications from text prompts
- **Live Preview**: Instant preview of generated HTML/CSS/JavaScript applications in an iframe
- **File Explorer**: Tree view of all generated project files with expandable folders
- **Code Editor**: Syntax-highlighted code viewer for examining generated files
- **Smart Templates**: Quick-start examples for common application types
- **Session Persistence**: Projects are stored per-session for the duration of your visit
- **Responsive Design**: Works beautifully across desktop, tablet, and mobile devices
- **Dark Mode**: Full dark mode support with theme toggle

## Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Shadcn UI** - Component library
- **TanStack Query** - Data fetching and state management
- **Wouter** - Lightweight routing

### Backend
- **Express.js** - Web server
- **Google Gemini AI** - Code generation
- **Express Session** - Session management
- **Zod** - Runtime validation
- **TypeScript** - Type safety

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── Workspace.tsx         # Main workspace layout
│   │   │   ├── PromptInput.tsx       # Prompt input with examples
│   │   │   ├── FileTree.tsx          # File explorer component
│   │   │   ├── CodeEditor.tsx        # Code viewer
│   │   │   ├── PreviewPanel.tsx      # Live preview iframe
│   │   │   ├── GenerationProgress.tsx # Generation progress overlay
│   │   │   ├── EmptyState.tsx        # Empty state illustration
│   │   │   └── ThemeToggle.tsx       # Dark/light mode toggle
│   │   ├── pages/         # Page components
│   │   └── App.tsx        # App root
│   └── index.html         # HTML entry point
├── server/                # Backend Express server
│   ├── gemini.ts         # Gemini AI integration
│   ├── routes.ts         # API endpoints
│   ├── storage.ts        # In-memory storage
│   ├── preview.ts        # Preview HTML generator
│   └── index.ts          # Server entry point
└── shared/               # Shared types and schemas
    └── schema.ts         # TypeScript types and Zod schemas
```

## API Endpoints

- `POST /api/generate` - Generate a new project from a prompt
- `GET /api/templates` - Get available project templates
- `GET /api/project` - Get the current session's project
- `DELETE /api/project` - Clear the current project
- `GET /api/preview` - Get rendered HTML preview of the project

## Environment Variables

- `GEMINI_API_KEY` - Google Gemini API key (required)
- `SESSION_SECRET` - Session encryption secret (auto-generated if not provided)
- `PORT` - Server port (default: 5000)

## How It Works

1. **User Input**: User describes their desired application in the prompt input
2. **AI Generation**: The prompt is sent to Gemini 2.5 Flash with structured output schema
3. **Code Parsing**: The AI returns a JSON structure with files, dependencies, and metadata
4. **Storage**: The generated project is stored in the user's session
5. **Display**: Files are displayed in the explorer, and the first file is selected
6. **Preview**: For static projects, HTML/CSS/JS are bundled and displayed in an iframe
7. **Interaction**: Users can browse files, view code, and see the live result

## Current Limitations

- **No Editing**: Generated code is read-only (viewing only, no editing)
- **Session Only**: Projects are not persisted to database, only in-memory during session
- **No Export**: Cannot download generated projects as ZIP files yet
- **System Fonts Only**: Uses system fonts instead of custom web fonts to maintain cross-origin isolation for WebContainer

## Future Enhancements

- Real-time streaming of AI generation progress
- Code editing capabilities with live preview updates
- Project export as ZIP files
- User accounts and project history
- Collaborative editing features
- Version control integration
- Custom web font support with proper CORS configuration

## Development

The project uses a full-stack TypeScript setup with hot module reloading:

```bash
npm run dev
```

This starts both the Express backend and Vite frontend development servers on port 5000.

## Design Philosophy

The interface follows these design principles:

- **Developer-Centric**: Familiar patterns from VS Code and professional IDEs
- **Minimal Cognitive Load**: Clean, predictable interface with clear visual hierarchy
- **Responsive by Default**: Works seamlessly across all device sizes
- **Accessible**: Proper ARIA labels, keyboard navigation, and screen reader support
- **Performance First**: Virtualized file trees, lazy loading, and optimized rendering

## Testing Status

✅ **All Core Features Tested and Working**

The application has been thoroughly tested with end-to-end tests covering:
- Prompt input validation and user interaction
- AI code generation via Gemini API
- File tree navigation and file selection
- Code editor display and syntax highlighting
- Live preview rendering in iframe
- Dark/light theme toggling
- Progress modal during generation
- Responsive viewport controls

All tests passed successfully with real Gemini API integration.

## Recent Changes (October 26, 2025)

### WebContainer Support Enabled
- **Cross-Origin Isolation**: Added `Cross-Origin-Embedder-Policy: require-corp` and `Cross-Origin-Opener-Policy: same-origin` headers to enable SharedArrayBuffer support
- **WebContainer Preview**: React, Next.js, and framework projects now work with WebContainer for in-browser build and preview
- **System Fonts**: Replaced Google Fonts with system font stacks to maintain cross-origin isolation compliance
- **Code Formatting**: Enhanced Gemini prompts with explicit 2-space indentation and alignment instructions for cleaner generated code

### Previous Updates
- Fixed Gemini API response schema to properly handle generated projects
- Added session management for proper per-user project storage
- Implemented preview HTML generator for static projects
- Created comprehensive component library with consistent design
- Added dark mode support with system preference detection
- Implemented proper error handling and validation throughout
- Successfully integrated and tested Gemini 2.5 Flash for code generation

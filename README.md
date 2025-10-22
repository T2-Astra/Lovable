# 🚀 Astra - Open Source AI Web Builder

<div align="center">

![Astra Logo](https://img.shields.io/badge/Astra-AI%20Web%20Builder-blue?style=for-the-badge&logo=react)

**Build Something Extraordinary with AI**

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)

[Demo](https://github.com/T2-Astra/Lovable) • [Documentation](#documentation) • [Contributing](#contributing) • [License](#license)

</div>

## ✨ Overview

**Astra** is a powerful, open-source AI-powered web builder that lets you create production-ready applications by simply describing what you want to build. Inspired by tools like Lovable and Bolt, Astra combines the power of AI with an intuitive interface to make web development accessible to everyone.

### 🎯 Key Features

- **🤖 AI-Powered Generation**: Describe your app in plain English and watch AI generate production-ready code
- **⚡ Real-Time Preview**: See your application come to life instantly with live preview
- **🎨 Beautiful UI**: Modern, responsive design with animated backgrounds and smooth transitions
- **🌙 Dark/Light Mode**: Seamless theme switching with proper color adaptation
- **📝 Code Editor**: Full-featured Monaco editor with syntax highlighting and IntelliSense
- **💬 Conversational Interface**: Chat with AI to iterate and improve your application
- **📁 Project Management**: Organize your projects with persistent storage
- **🔄 Live Editing**: Edit code directly and see changes in real-time
- **📱 Responsive Design**: Works perfectly on desktop, tablet, and mobile devices

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions
- **Monaco Editor** - VS Code-powered code editor
- **Radix UI** - Accessible, unstyled UI components
- **Wouter** - Minimalist routing library
- **TanStack Query** - Powerful data synchronization

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **TypeScript** - Type-safe server development
- **Drizzle ORM** - Type-safe database toolkit
- **PostgreSQL** - Robust relational database
- **WebSocket** - Real-time communication
- **Zod** - Schema validation

### AI Integration
- **OpenRouter API** - Access to multiple AI models
- **Streaming Responses** - Real-time AI response streaming
- **Context Management** - Intelligent conversation context

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- OpenRouter API key (or compatible AI API)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/T2-Astra/Lovable.git
   cd Lovable
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env with your configuration
   OPENROUTER_API_KEY=your_api_key_here
   DATABASE_URL=your_postgresql_connection_string
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5000` to start building!

## 📖 Documentation

### Project Structure

```
astra/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── ui/        # Base UI components (shadcn/ui)
│   │   │   ├── BackgroundPaths.tsx  # Animated background
│   │   │   ├── CodeEditor.tsx       # Monaco code editor
│   │   │   ├── LivePreview.tsx      # Real-time preview
│   │   │   └── ThemeToggle.tsx      # Dark/light mode toggle
│   │   ├── pages/         # Application pages
│   │   │   ├── Home.tsx   # Landing page with chat interface
│   │   │   └── Builder.tsx # Code editor and builder interface
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utility functions and configurations
├── server/                # Backend Express application
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes
│   └── storage.ts        # Database operations
├── shared/               # Shared types and schemas
│   └── schema.ts         # Database schema and types
└── package.json          # Project dependencies and scripts
```

### Core Components

#### 🏠 Home Page (`client/src/pages/Home.tsx`)
- Landing page with animated background
- AI chat interface for describing applications
- Real-time streaming responses
- Project creation and management

#### 🔧 Builder Page (`client/src/pages/Builder.tsx`)
- Full-featured code editor with Monaco
- Live preview panel
- File management system
- Conversation history
- Real-time collaboration features

#### 🎨 Background Animation (`client/src/components/BackgroundPaths.tsx`)
- Animated SVG paths with Framer Motion
- Multiple gradient layers
- Smooth floating animations
- Performance-optimized rendering

### API Endpoints

- `POST /api/generate` - Generate code from AI prompt
- `GET /api/conversations/:projectId` - Get conversation history
- `GET /api/code-files/:projectId` - Get project files
- `PUT /api/code-files/:id` - Update code file
- `POST /api/projects` - Create new project

## 🎨 Features in Detail

### AI Code Generation
Astra uses advanced AI models to understand natural language descriptions and generate:
- Complete React components
- HTML/CSS layouts
- JavaScript functionality
- TypeScript interfaces
- Responsive designs
- Interactive features

### Real-Time Preview
The live preview system:
- Compiles code in real-time
- Shows immediate visual feedback
- Handles errors gracefully
- Supports hot reloading
- Works with external libraries

### Code Editor
Built on Monaco Editor (VS Code's editor):
- Syntax highlighting for multiple languages
- IntelliSense and auto-completion
- Error detection and highlighting
- Code formatting and linting
- Vim/Emacs key bindings support

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Contribution Guidelines

- Follow the existing code style and conventions
- Write clear, descriptive commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

### Areas for Contribution

- 🐛 Bug fixes and improvements
- ✨ New AI model integrations
- 🎨 UI/UX enhancements
- 📚 Documentation improvements
- 🧪 Test coverage expansion
- 🌐 Internationalization
- 📱 Mobile experience improvements

## 🗺️ Roadmap

### Short Term (Q1 2025)
- [ ] Enhanced AI model support
- [ ] Improved code generation accuracy
- [ ] Better error handling and recovery
- [ ] Mobile-responsive builder interface
- [ ] Export to popular frameworks (Next.js, Nuxt, etc.)

### Medium Term (Q2-Q3 2025)
- [ ] Collaborative editing features
- [ ] Version control integration (Git)
- [ ] Component library system
- [ ] Template marketplace
- [ ] Advanced deployment options
- [ ] Plugin system for extensions

### Long Term (Q4 2025+)
- [ ] Visual drag-and-drop interface
- [ ] Database schema generation
- [ ] API endpoint generation
- [ ] Multi-language support
- [ ] Enterprise features and SSO
- [ ] Advanced analytics and insights

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 Krish Mhatre

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🙏 Acknowledgments

- Inspired by [Lovable](https://lovable.dev) and [Bolt](https://bolt.new)
- Built with amazing open-source technologies
- Special thanks to the React, TypeScript, and AI communities

## 📞 Support

- 📧 Email: [support@astra-builder.dev](mailto:support@astra-builder.dev)
- 💬 Discord: [Join our community](https://discord.gg/astra-builder)
- 🐛 Issues: [GitHub Issues](https://github.com/T2-Astra/Lovable/issues)
- 📖 Docs: [Documentation](https://docs.astra-builder.dev)

---

<div align="center">

**Built with ❤️ by [Krish Mhatre](https://github.com/krishmhatre) and the Astra community**

[⭐ Star this repo](https://github.com/T2-Astra/Lovable) • [🐛 Report Bug](https://github.com/T2-Astra/Lovable/issues) • [💡 Request Feature](https://github.com/T2-Astra/Lovable/issues)

</div>
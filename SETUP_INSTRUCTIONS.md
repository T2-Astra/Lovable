# Setup Instructions for AI Website Builder

## ✅ Server is Running!

Your development server is now running on **http://localhost:5000**

## 🚀 Quick Start

1. **Open your browser** and navigate to:
   ```
   http://localhost:5000
   ```

2. **Get a Gemini API Key** (Required for AI code generation):
   - Visit: https://aistudio.google.com/app/apikey
   - Create a new API key
   - Set it in your environment:
   ```powershell
   $env:GEMINI_API_KEY = "your_api_key_here"
   ```

3. **Restart the server** after setting the API key:
   - Stop the current server (Ctrl+C in the terminal where it's running)
   - Run the start script again:
   ```powershell
   .\start-dev.ps1
   ```

## 📋 What Was Fixed

The project had a few issues when moving from Replit to Windows:

1. **Windows Compatibility**: Fixed `reusePort` option that's not supported on Windows
2. **Database Optional**: Made the DATABASE_URL optional - the app works without it (project history feature will be disabled)
3. **Environment Setup**: Created startup script and environment configuration guide

## 🎯 Features

- **AI Code Generation**: Generate complete web applications from text prompts using Google Gemini
- **Live Preview**: See your generated application running in real-time
- **File Explorer**: Browse through all generated files
- **Code Editor**: View syntax-highlighted code
- **Templates**: Quick-start with React, Next.js, or vanilla JavaScript templates

## 🔧 Environment Variables

### Required
- `GEMINI_API_KEY` - Your Google Gemini API key for AI code generation

### Optional
- `DATABASE_URL` - PostgreSQL connection string (only needed for project history feature)
- `SESSION_SECRET` - Custom session secret (auto-generated if not provided)
- `PORT` - Server port (default: 5000)

## 📝 How to Use

1. **Start the Server**:
   ```powershell
   .\start-dev.ps1
   ```
   Or manually:
   ```powershell
   $env:NODE_ENV = "development"
   npx tsx server/index.ts
   ```

2. **Open the App**: Navigate to http://localhost:5000 in your browser

3. **Generate a Project**:
   - Enter a description of what you want to build
   - Optionally select a template (React, Next.js, or Vanilla)
   - Click "Generate"
   - Watch as AI creates your application!

4. **Explore the Code**:
   - Browse files in the file tree
   - Click on any file to view its code
   - See the live preview in the right panel

## 🛠️ Development Commands

- **Start Dev Server**: `npm run dev` or `.\start-dev.ps1`
- **Build for Production**: `npm run build`
- **Start Production**: `npm start`
- **Type Check**: `npm run check`

## ⚠️ Important Notes

- **API Key Required**: The app won't be able to generate projects without a valid GEMINI_API_KEY
- **Database Optional**: Project history features require a PostgreSQL database, but the core functionality works without it
- **Windows-Specific**: This setup has been optimized for Windows. The original Replit configuration used Linux-specific options.

## 🐛 Troubleshooting

### Server won't start
- Make sure no other application is using port 5000
- Check that Node.js v18+ is installed: `node --version`
- Verify dependencies are installed: `npm install`

### "No projects generated" error
- Make sure you've set the GEMINI_API_KEY environment variable
- Restart the server after setting the API key
- Check the server console for any error messages

### Database errors
- These are normal if you haven't set up a DATABASE_URL
- The app will still work for generating and viewing projects
- Only the project history feature requires a database

## 📚 Additional Resources

- [Gemini API Documentation](https://ai.google.dev/docs)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)

## 🎉 Enjoy Building!

You're all set! Start creating amazing web applications with AI assistance.


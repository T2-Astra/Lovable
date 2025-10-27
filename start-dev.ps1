# Development server startup script for Windows
Write-Host "Starting AI Website Builder..." -ForegroundColor Cyan
Write-Host ""

# Set environment variables
$env:NODE_ENV = "development"

# Check if GEMINI_API_KEY is set
if (-not $env:GEMINI_API_KEY) {
    Write-Host "⚠️  WARNING: GEMINI_API_KEY is not set!" -ForegroundColor Yellow
    Write-Host "   Get your API key from: https://aistudio.google.com/app/apikey" -ForegroundColor Yellow
    Write-Host "   Set it with: `$env:GEMINI_API_KEY='your_key_here'" -ForegroundColor Yellow
    Write-Host ""
}

# Start the server
Write-Host "Starting development server on http://localhost:5000" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

npx tsx server/index.ts


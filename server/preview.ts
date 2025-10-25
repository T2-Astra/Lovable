import type { ProjectFile } from "@shared/schema";

/**
 * Generate a standalone HTML preview that bundles all project files
 * This allows simple projects to run in an iframe without WebContainer
 */
export function generatePreviewHTML(files: ProjectFile[], dependencies?: Record<string, string>): string {
  // Check if this is a React/Next.js/framework project
  const isReactProject = files.some(f => 
    f.path.includes('App.jsx') || 
    f.path.includes('App.tsx') ||
    f.path.includes('main.jsx') ||
    f.path.includes('main.tsx')
  );
  
  const isNextProject = files.some(f => 
    f.path.includes('pages/') || 
    f.path.includes('app/layout')
  );
  
  const hasPackageJson = files.some(f => f.path === 'package.json');
  const hasDependencies = dependencies && Object.keys(dependencies).length > 0;
  
  // If it's a framework project, show helpful message
  if ((isReactProject || isNextProject || hasPackageJson) && hasDependencies) {
    const frameworkName = isNextProject ? 'Next.js' : isReactProject ? 'React' : 'Framework';
    const fileList = files.map(f => `<li><code>${f.path}</code></li>`).join('');
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${frameworkName} Project Preview</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      padding: 40px;
      max-width: 600px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 {
      color: #333;
      margin-bottom: 16px;
      font-size: 28px;
    }
    .subtitle {
      color: #666;
      margin-bottom: 24px;
      font-size: 16px;
    }
    .info-box {
      background: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-box h3 {
      color: #667eea;
      font-size: 14px;
      text-transform: uppercase;
      margin-bottom: 8px;
      font-weight: 600;
    }
    .file-list {
      max-height: 200px;
      overflow-y: auto;
      margin-top: 12px;
      padding-left: 20px;
    }
    .file-list li {
      margin: 4px 0;
      color: #555;
      font-size: 14px;
    }
    code {
      background: #e9ecef;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 13px;
      color: #333;
    }
    .note {
      margin-top: 20px;
      padding: 12px;
      background: #fff3cd;
      border-radius: 4px;
      color: #856404;
      font-size: 14px;
      line-height: 1.6;
    }
    .steps {
      margin-top: 16px;
      padding-left: 20px;
    }
    .steps li {
      margin: 8px 0;
      color: #555;
    }
    .icon {
      font-size: 48px;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">⚛️</div>
    <h1>${frameworkName} Project Generated!</h1>
    <p class="subtitle">Your project has been successfully generated with ${files.length} files.</p>
    
    <div class="info-box">
      <h3>📁 Generated Files</h3>
      <ul class="file-list">
        ${fileList}
      </ul>
    </div>
    
    <div class="note">
      <strong>⚡ Live Preview Not Available</strong><br>
      This ${frameworkName} project requires npm modules and a build process to run. 
      The generated code is ready to download and run locally!
    </div>
    
    <div class="info-box">
      <h3>🚀 To Run This Project Locally:</h3>
      <ol class="steps">
        <li>Download the generated files</li>
        <li>Run <code>npm install</code> to install dependencies</li>
        <li>Run <code>npm run dev</code> to start the development server</li>
        <li>Open your browser to view the application</li>
      </ol>
    </div>
  </div>
</body>
</html>
    `.trim();
  }
  
  // For vanilla HTML/CSS/JS projects, bundle them normally
  const htmlFile = files.find(f => f.path.endsWith('.html') || f.path === 'index.html');
  const cssFiles = files.filter(f => f.language === 'css');
  const jsFiles = files.filter(f => f.language === 'javascript');
  
  if (!htmlFile) {
    // Generate a basic HTML structure if none exists
    const styles = cssFiles.map(f => f.content).join('\n');
    const scripts = jsFiles.map(f => f.content).join('\n');
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Application</title>
  <style>
    ${styles}
  </style>
</head>
<body>
  <div id="app"></div>
  <script>
    ${scripts}
  </script>
</body>
</html>
    `.trim();
  }
  
  let html = htmlFile.content;
  
  // Inject CSS into the HTML
  if (cssFiles.length > 0) {
    const styleTag = `\n<style>\n${cssFiles.map(f => `/* ${f.path} */\n${f.content}`).join('\n\n')}\n</style>`;
    if (html.includes('</head>')) {
      html = html.replace('</head>', `${styleTag}\n</head>`);
    } else {
      html = `<head>${styleTag}</head>${html}`;
    }
  }
  
  // Inject JavaScript into the HTML
  if (jsFiles.length > 0) {
    const scriptTag = `\n<script>\n${jsFiles.map(f => `// ${f.path}\n${f.content}`).join('\n\n')}\n</script>`;
    if (html.includes('</body>')) {
      html = html.replace('</body>', `${scriptTag}\n</body>`);
    } else {
      html = `${html}\n${scriptTag}`;
    }
  }
  
  return html;
}

/**
 * Check if a project can be previewed with simple iframe (static HTML/CSS/JS)
 * vs requiring WebContainer (React, build tools, etc.)
 */
export function canUseSimplePreview(files: ProjectFile[], dependencies: Record<string, string>): boolean {
  // If there are npm dependencies, we need WebContainer
  if (Object.keys(dependencies).length > 0) {
    return false;
  }
  
  // If there are TypeScript or JSX files, we need a build step
  const hasTypeScript = files.some(f => 
    f.language === 'typescript' || 
    f.path.endsWith('.tsx') || 
    f.path.endsWith('.ts') ||
    f.path.endsWith('.jsx')
  );
  if (hasTypeScript) {
    return false;
  }
  
  // If there are build config files, we need WebContainer
  const hasBuildConfig = files.some(f => 
    f.path.includes('package.json') || 
    f.path.includes('vite.config') || 
    f.path.includes('next.config') ||
    f.path.includes('tsconfig.json') ||
    f.path.includes('webpack.config') ||
    f.path.includes('rollup.config')
  );
  if (hasBuildConfig) {
    return false;
  }
  
  // Check for modern framework indicators
  const hasFrameworkFiles = files.some(f => 
    f.path.includes('src/App.jsx') ||
    f.path.includes('src/App.tsx') ||
    f.path.includes('src/main.jsx') ||
    f.path.includes('src/main.tsx') ||
    f.path.includes('pages/_app') ||
    f.path.includes('app/layout')
  );
  if (hasFrameworkFiles) {
    return false;
  }
  
  // Otherwise, it's simple HTML/CSS/JS that can run in an iframe
  return true;
}

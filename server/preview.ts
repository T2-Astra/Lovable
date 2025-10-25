import type { ProjectFile } from "@shared/schema";

/**
 * Generate a standalone HTML preview that bundles all project files
 * This allows simple projects to run in an iframe without WebContainer
 */
export function generatePreviewHTML(files: ProjectFile[]): string {
  const htmlFile = files.find(f => f.path.endsWith('.html') || f.path === 'index.html');
  const cssFiles = files.filter(f => f.language === 'css');
  const jsFiles = files.filter(f => f.language === 'javascript' || f.language === 'typescript');
  
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
  <div id="app">
    <h1>Generated Application</h1>
    <p>No HTML file was generated. The application consists of ${files.length} files.</p>
  </div>
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

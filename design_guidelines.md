# Design Guidelines: AI-Powered Web Application Builder

## Design Approach

**Primary Strategy**: Hybrid Approach
- **Landing/Marketing Pages**: Reference-based, inspired by modern developer tools (Linear, Vercel, Replit)
- **Application Interface**: Design system approach using a minimal, code-focused aesthetic

**Key References**:
- Linear: Clean typography, restrained color usage, sophisticated interactions
- Vercel: Bold typography, high contrast, technical precision
- Replit: Playful yet professional, approachable coding interface
- GitHub: Familiar developer patterns, clear information hierarchy

## Core Design Elements

### A. Color Palette

**Dark Mode Primary** (default theme):
- Background: 220 13% 9%
- Surface: 220 13% 12%
- Surface elevated: 220 13% 16%
- Border: 220 13% 22%
- Text primary: 0 0% 98%
- Text secondary: 220 9% 65%

**Brand Colors**:
- Primary: 270 70% 60% (vibrant purple - AI/tech association)
- Primary hover: 270 70% 55%
- Success: 142 76% 45% (code execution success)
- Warning: 38 92% 50%
- Error: 0 72% 51%

**Light Mode** (for landing pages):
- Background: 0 0% 100%
- Surface: 220 13% 98%
- Text primary: 220 13% 9%
- Border: 220 13% 91%

### B. Typography

**Font Families**:
- **Primary Interface**: Inter (via Google Fonts) - exceptional readability, modern
- **Monospace/Code**: JetBrains Mono - designed for developers, excellent code legibility
- **Marketing Headlines**: Inter Display (bolder weights 700-800)

**Type Scale**:
- Hero headline: text-6xl (60px) md:text-7xl (72px), font-bold
- Section headline: text-4xl (36px) md:text-5xl (48px), font-bold
- Subsection: text-2xl (24px), font-semibold
- Body large: text-lg (18px), font-normal
- Body: text-base (16px), font-normal
- Small/captions: text-sm (14px)
- Code: text-sm (14px) in monospace

### C. Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24, 32
- Micro spacing: p-2, m-4 (8-16px)
- Component spacing: p-6, p-8 (24-32px)
- Section spacing: py-16, py-20, py-24 (64-96px desktop)
- Generous whitespace: py-32 for hero sections

**Grid System**:
- Container: max-w-7xl (1280px) mx-auto px-4 sm:px-6 lg:px-8
- Content sections: max-w-6xl
- Text content: max-w-4xl for readability
- Editor/Code areas: Full width with internal padding

### D. Component Library

**Landing Page Components**:

1. **Hero Section**:
   - Full viewport height (min-h-screen) with centered content
   - Large headline emphasizing AI capabilities
   - Interactive demo preview or animated code generation showcase
   - Primary CTA: "Start Building" + Secondary: "Watch Demo"
   - Subtle animated grid background or gradient mesh

2. **Features Section** (3-column grid):
   - Icon + Heading + Description cards
   - Features: AI-Powered Generation, Live Preview, One-Click Deploy
   - Icons from Heroicons (outline style)
   - Hover state: subtle lift (translate-y-1) and glow

3. **How It Works** (Visual Flow):
   - Horizontal step indicators (1 → 2 → 3)
   - Screenshots/illustrations of: Prompt Entry → AI Generation → Live Preview
   - Use numbered badges with gradient backgrounds

4. **Code Example Showcase**:
   - Side-by-side: Prompt input on left, Generated code on right
   - Syntax highlighted code blocks (use highlight.js or prism.js)
   - "Try it yourself" interactive element

5. **Testimonials/Social Proof**:
   - 2-column layout with developer avatars
   - Include GitHub stars count, user count metrics
   - Compact cards with quotes

**Application Interface Components**:

1. **Top Navigation Bar**:
   - Height: h-14 (56px)
   - Logo + Project name + User menu
   - Dark background (surface color)
   - Subtle bottom border

2. **Prompt Input Panel** (Primary interaction):
   - Floating card design with elevated shadow
   - Large textarea with placeholder: "Describe the app you want to build..."
   - Character count indicator
   - "Generate" button (primary purple, prominent)
   - Example prompts as chips below input

3. **Editor/Preview Split View**:
   - Resizable panels (60/40 default split)
   - Code editor: Monaco editor styling with dark theme
   - Live preview: iframe with loading states
   - Tab system: Files, Preview, Console

4. **Sidebar Navigation**:
   - Width: w-64 (256px) collapsible to w-16
   - Project files tree view
   - Recent projects list
   - Settings/API key management

5. **Generation Status**:
   - Toast notifications for generation events
   - Progress indicator during AI processing
   - Animated code cursor during generation
   - Success/error states with appropriate colors

### E. Imagery

**Landing Page Images**:
- **Hero Image**: Large, high-quality screenshot of the application interface in use, showing code editor + live preview. Position: Right side of hero, taking 50% width on desktop. Should showcase the actual product with syntax-highlighted code visible.
- **Feature Illustrations**: Custom illustrations or screenshots for each feature card - keep consistent style (either all illustrations or all screenshots)
- **Developer Photos**: Authentic photos for testimonials section to build trust

**Application Interface**:
- **Empty States**: Friendly illustrations when no project is open
- **Loading States**: Animated code generation visualization

### F. Interactive Elements

**Buttons**:
- Primary: Purple gradient background, white text, rounded-lg, px-6 py-3
- Secondary: Outline with purple border, hover fills background
- Ghost: Transparent, hover shows subtle background
- All buttons: smooth transitions (150ms), hover lift effect

**Code Blocks**:
- Dark theme with syntax highlighting
- Copy button on hover (top-right corner)
- Line numbers for longer snippets
- Rounded corners (rounded-lg)

**Cards**:
- Background: surface color
- Border: 1px solid border color
- Hover: subtle border glow (primary color at 20% opacity)
- Shadow: minimal, increases on hover
- Rounded: rounded-xl

**Forms**:
- Input fields: dark background, purple focus ring
- Labels: text-sm, text-secondary above inputs
- Validation: inline error messages in error color

### G. Animations

**Sparingly Used**:
- Hero section: Subtle floating animation on hero image (3-4s cycle)
- Code generation: Typing cursor effect during AI processing
- Page transitions: Fade in content on scroll (intersection observer)
- Button hovers: Scale slightly (scale-105) with smooth transition
- NO: Parallax scrolling, excessive animations, distracting motion

### H. Layout Structure

**Landing Page Sections** (in order):
1. Hero (with product screenshot)
2. Features (3-column grid)
3. How It Works (visual flow diagram)
4. Code Example Showcase
5. Pricing/CTA (if applicable)
6. Testimonials (2-column)
7. Footer (comprehensive with links, newsletter, social)

**Application Layout**:
```
┌─────────────────────────────────────┐
│     Top Nav Bar (h-14)               │
├──────┬──────────────────────────────┤
│      │  Prompt Input (sticky top)    │
│ Side │                               │
│ bar  ├──────────────┬───────────────┤
│      │  Code Editor │ Live Preview  │
│(w-64)│   (60%)      │    (40%)      │
│      │              │               │
└──────┴──────────────┴───────────────┘
```

## Accessibility & Responsiveness

- Maintain WCAG AA contrast ratios minimum
- Focus indicators: 2px purple outline offset by 2px
- Keyboard navigation: all interactive elements accessible
- Mobile: Stack editor/preview vertically, collapsible sidebar
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)

## Key Differentiators

- **Developer-First**: Familiar patterns from VSCode, GitHub
- **AI-Focused**: Purple brand color signals AI capability
- **Professional Polish**: No gimmicks, production-ready feel
- **Performance**: Fast load times, optimized code display
- **Trust**: Show real code, real previews, transparent process
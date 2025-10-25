# Design Guidelines: AI-Powered Full-Stack Website Builder

## Design Approach

**Selected Approach**: Design System + Reference-Based Hybrid
- **Primary Reference**: Bolt.new's developer-centric interface patterns
- **Design System Foundation**: VS Code's component patterns for familiarity with developers
- **Justification**: Developer productivity tools require predictable, efficient interfaces with minimal cognitive load. Drawing from established code editor patterns ensures immediate usability.

## Core Layout Architecture

### Primary Application Structure
**Three-Panel Split Layout**:
- **Left Sidebar** (w-64): Project files, configuration, templates selector
- **Center Panel** (flex-1): Dual-mode interface - Prompt Input (when idle) + Code Editor (during/after generation)
- **Right Panel** (flex-1): Live preview with responsive viewport controls

**Responsive Breakpoint Strategy**:
- Desktop (lg:): Full three-panel layout
- Tablet (md:): Collapsible sidebar, tabbed center/right panels
- Mobile: Stacked single-column with bottom navigation tabs

### Vertical Rhythm & Spacing
Primary spacing units: **2, 3, 4, 6, 8**
- Component padding: p-4, p-6
- Section gaps: space-y-4, gap-6
- Panel margins: m-0 (panels should be edge-to-edge for maximized workspace)
- Header/footer: py-3, px-6

## Typography System

**Font Families**:
- **UI Text**: Inter (via Google Fonts) - Clean, modern sans-serif for interface elements
- **Code**: JetBrains Mono (via Google Fonts) - Optimized for code readability
- **Headings**: Inter SemiBold/Bold

**Hierarchy**:
- **Primary Headlines**: text-2xl font-semibold (Project name, main headers)
- **Section Headers**: text-lg font-medium (Panel titles, file headers)
- **Body Text**: text-sm (General UI text, labels)
- **Small Text**: text-xs (Metadata, timestamps, secondary info)
- **Code**: text-sm font-mono (Editor content, terminal output)

## Component Library

### Navigation & Controls

**Top Application Bar** (h-14):
- Logo/branding (left)
- Project name/breadcrumb (center-left)
- Action buttons: Save, Share, Deploy (right)
- User profile menu (far right)
- Spacing: px-6, items-center justified

**Sidebar Navigation**:
- Collapsible file tree with indent levels (pl-4 per level)
- File icons using Heroicons (DocumentTextIcon, FolderIcon, etc.)
- Add file/folder actions on hover
- Templates gallery section at bottom

**Preview Panel Controls** (h-12):
- Responsive viewport toggles (Mobile/Tablet/Desktop icons)
- Refresh preview button
- Open in new tab action
- Device frame selector dropdown

### Primary Interface Components

**Prompt Input Section** (Initial State):
- Large textarea (min-h-32) with placeholder: "Describe the website you want to build..."
- Character count indicator (bottom-right)
- Submit button (primary action, h-12 w-full)
- Example prompts gallery below (grid-cols-2 gap-4, each p-4 with border)
- Templates quick-start cards (grid-cols-3 gap-4)

**Code Editor Panel**:
- File tabs bar (h-10) with close buttons
- Monaco/CodeMirror integration area (h-full)
- Line numbers (w-12)
- Minimap (w-20, right edge)
- Status bar (h-6 bottom): Language indicator, line/column, file size

**Live Preview Frame**:
- Iframe container with device frame borders
- Loading state with skeleton UI
- Error boundary display for runtime errors
- Console output toggle (bottom drawer, h-48 when open)

### Generation Feedback UI

**Active Generation Overlay**:
- Semi-transparent backdrop
- Centered progress card (max-w-md):
  - AI thinking animation (Lottie or CSS)
  - Generation steps list with checkmarks
  - Current file being created (text-sm text-muted)
  - Cancel generation button (secondary)

**File Change Indicators**:
- Toast notifications (top-right, max-w-sm) for each file created/modified
- Slide-in animation, auto-dismiss after 3s
- Stack multiple toasts with gap-2

### Data Display Components

**File Tree Items** (h-8):
- Icon + filename layout (gap-2)
- Truncate long names with tooltip
- Modified indicator (small dot)
- Right-click context menu support

**Dependencies List** (Sidebar Bottom Panel):
- Package name + version (text-sm)
- Install status badge
- Update available indicator
- Add dependency input field (h-10)

**Console/Terminal Output**:
- Tabbed interface (Logs, Errors, Network)
- Monospace text with syntax highlighting for errors
- Clear output button (top-right)
- Auto-scroll toggle
- Timestamp column (text-xs, w-20)

## Interaction Patterns

**Split Panel Resizing**:
- Draggable dividers (w-1, hover:w-2) between panels
- Cursor: col-resize on hover
- Minimum panel widths: 280px (sidebar), 400px (center/right)
- Double-click divider to reset to defaults

**Keyboard Shortcuts Bar**:
- Collapsible bottom banner (h-8) showing common shortcuts
- Toggle with Cmd+K
- Shortcuts: Cmd+S (save), Cmd+Enter (generate), Cmd+P (preview toggle)

**Modal Dialogs**:
- Template selector: Full-screen overlay with gallery (grid-cols-4)
- Settings: Centered modal (max-w-2xl) with tabbed interface
- Share dialog: Centered (max-w-md) with link copy and embed code

## Accessibility Standards

- Focus indicators: 2px outline with 2px offset
- All interactive elements minimum 44x44px touch targets
- ARIA labels on icon-only buttons
- Keyboard navigation through all panels (Tab, Shift+Tab)
- Screen reader announcements for generation steps

## Images

**Hero Section**: Not applicable - this is a productivity tool, launches directly to workspace

**Empty State Illustrations**:
- **Empty Project State**: Illustration showing code + preview panels with sparkles (center of workspace, max-w-md)
- **Template Cards**: Preview thumbnails for each template (aspect-ratio-video, rounded-lg borders)
- **Loading States**: Subtle animated gradient placeholders matching panel dimensions

**Location & Usage**:
- Template thumbnails in sidebar and template selector modal
- Empty state illustration only when no project is active
- All illustrations should be inline SVGs for performance

## Animation Guidelines

Use animations sparingly and purposefully:
- **File creation**: Subtle slide-in from left (200ms)
- **Panel transitions**: Smooth resize with transform (150ms cubic-bezier)
- **Generation progress**: Pulsing glow on active step (1s infinite)
- **Preview loading**: Skeleton fade-in (300ms)

Avoid: Excessive transitions on typing, hover states, or frequent UI updates

## Special Considerations

**Performance Priority**:
- Virtualized file tree for large projects (render only visible items)
- Debounced preview updates (500ms after code changes)
- Lazy load preview iframe content

**Developer Experience**:
- Maintain consistent spacing across panels for visual harmony
- Use monospace fonts consistently for all code-related content
- Clear visual hierarchy between active/inactive panels
- Status indicators for API calls, builds, deployments

This design prioritizes workspace efficiency, clear information hierarchy, and familiar patterns from established developer tools while maintaining a modern, polished aesthetic.
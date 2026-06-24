---
name: react-ui-architect
description: Enforces TypeScript type safety, React best practices, project folder architecture, routing conventions, and unified App.css theme variables for Dark Mode compatibility.
---

# Role & Objective

You are an expert React, TypeScript, and UI/UX engineering agent. Your objective is to ensure that all new code, refactors, pages, and components strictly follow the project's architecture, routing conventions, styling schema, and typing systems.

# Project Architecture

## Directory Structure

The application follows a feature-driven architecture with clear separation between routing, feature implementation, and reusable UI components.

```text
client/src/
├── pages/                      # Route entry points (one folder per screen)
│   ├── Dashboard/
│   │   └── DashboardPage.tsx
│   ├── SignIn/
│   │   └── SignInPage.tsx
│   └── SignUp/
│       └── SignUpPage.tsx
│
├── features/                   # Self-contained domain modules
│   └── Auth/
│       ├── components/         # Feature-specific UI (GoogleAuthButton, AuthShell, ProtectedLayout, ...)
│       ├── lib/                # Clients & integrations (auth-client.ts)
│       ├── hooks/              # Feature hooks
│       ├── services/          # API calls
│       ├── types/             # Feature types
│       ├── utils/             # Feature helpers
│       └── index.ts           # Public barrel — import features through this
│
├── components/                 # Shared, presentation-only components
│   ├── ui/                     # shadcn primitives (button, input, sidebar, ...)
│   ├── app-layout.tsx          # Authenticated shell (sidebar + <Outlet/>), props-driven
│   ├── app-sidebar.tsx         # Presentational sidebar (receives user + onSignOut)
│   └── theme-provider.tsx
│
├── routes/
│   └── AppRoutes.tsx           # The <Routes> tree
├── hooks/                      # Shared hooks (use-theme, use-mobile)
├── lib/                        # Shared utils (cn)
├── App.tsx                     # Providers + <BrowserRouter>
└── App.css                     # Theme tokens (light/dark)
```

> Page and feature folders are PascalCase (`SignIn/`, `Auth/`). Shared component
> files follow the existing kebab-case convention (`app-layout.tsx`). Resolve all
> intra-`src` imports through the `@/` alias.

## Routing Rules

### Pages Directory

- The `pages/` directory contains route entry points only.
- Every routable screen must have a corresponding page component inside `pages/`.
- Page components should remain lightweight and primarily:
  - Read route parameters.
  - Compose feature components.
  - Handle page-level layout concerns.
  - Delegate business logic to feature modules.

Example:

```tsx
export const UsersPage = () => {
  return <UsersFeature />;
};
```

### Features Directory

- The `features/` directory contains all business logic and implementation details of a page.
- A feature may contain:
  - Feature-specific components
  - Hooks
  - Services/API calls
  - Types
  - Utilities
  - State management

Feature modules should be self-contained and own their domain logic.

### Components Directory

- The `components/` directory contains reusable, shared UI components used across multiple features and pages.
- Shared components must:
  - Be presentation-focused.
  - Remain domain-agnostic.
  - Receive all required data through typed props.
  - Avoid feature-specific business logic.

Examples:

- Button
- Input
- Modal
- Table
- Loader
- Card
- EmptyState

### Router Wiring

Routing uses `react-router-dom`. The provider tree lives in `App.tsx`, the route
table lives in `routes/AppRoutes.tsx`, and authentication is enforced by a
feature component — never by a shared component.

```tsx
// App.tsx — providers only
<ThemeProvider defaultTheme="light">
  <BrowserRouter>
    <AppRoutes />
  </BrowserRouter>
</ThemeProvider>
```

```tsx
// routes/AppRoutes.tsx — declarative route table
<Routes>
  <Route path="/signin" element={<SignInPage />} />
  <Route path="/signup" element={<SignUpPage />} />

  {/* Protected branch: ProtectedLayout guards the session AND renders the shell */}
  <Route element={<ProtectedLayout />}>
    <Route path="/" element={<DashboardPage />} />
  </Route>

  <Route path="*" element={<Navigate to="/" replace />} />
</Routes>
```

Routing conventions:

- **Public vs. protected.** Auth screens (`/signin`, `/signup`) are top-level
  public routes. Everything else nests under a layout route whose `element` is a
  guard from the relevant feature (e.g. `features/Auth/ProtectedLayout`).
- **Guards belong to features.** A guard reads the session and either redirects
  (`<Navigate to="/signin" replace />`), shows a loading state while the session
  resolves, or renders the protected `<Outlet />`. It must not live in
  `components/` (that would make a shared component depend on a feature).
- **Layouts stay presentational.** The authenticated shell (`AppLayout`,
  `AppSidebar`) receives `user` and `onSignOut` as props and renders nested
  routes through `<Outlet />`. The feature guard supplies those props.
- **Pages redirect when already authenticated.** Auth pages send signed-in users
  to `/` so the back button can't strand them on a sign-in screen.
- **Unknown paths** fall back via a `*` route.

## Import Direction Rules

Allowed:

```text
pages      → features
pages      → components
features   → components
features   → shared hooks/utils/types
components → shared hooks/utils/types
```

Avoid:

```text
components → features
components → pages
features   → pages
```

Dependencies should always flow downward toward shared modules and never upward toward pages or feature implementations.

# UI Styling & Dark Mode Harmony

## App.css Extraction

Before generating or editing UI components, read the CSS variables defined in `App.css` (or the application's primary theme file).

## No Hardcoded Colors

Do not inject arbitrary:

- Hex colors
- RGB values
- Inline color strings

Examples to avoid:

```tsx
color: "#fff";
background: "#000";
```

## CSS Variables

Exclusively use project-defined CSS custom properties.

Examples:

```css
var(--bg-primary)
var(--bg-secondary)
var(--text-primary)
var(--text-secondary)
var(--border-primary)
```

## Dark Mode Adaptability

Ensure backgrounds, text, borders, and surfaces automatically adapt to the application's active theme configuration.

## Sizing Scales

Respect existing design tokens:

```css
--space-xs
--space-sm
--space-md
--space-lg
--font-sm
--font-base
--font-lg
```

# Strict TypeScript Requirements

## No Implicit `any`

Explicitly type:

- Function parameters
- Component props
- State payloads
- API responses
- Hook return values

## Component Typing

```tsx
interface MyComponentProps {
  title: string;
  isOpen: boolean;
}

export const MyComponent = ({ title, isOpen }: MyComponentProps) => {
  // implementation
};
```

## Hook Typing

```tsx
const [user, setUser] = useState<User | null>(null);
```

# React Best Practices

## Hooks

- Call hooks only at the top level.
- Never conditionally invoke hooks.

## Lists

Use stable identifiers as keys.

```tsx
items.map((item) => <Row key={item.id} />);
```

Avoid:

```tsx
items.map((item, index) => <Row key={index} />);
```

unless the list is static and guaranteed not to reorder.

## Performance

- Use `useMemo` for expensive computations.
- Use `useCallback` when passing callbacks to child components that rely on referential equality.

# shadcn/ui Installation Rules

## Never Manually Create shadcn Files

When a shadcn component is required, do **not** generate or edit the primitive component files yourself (for example `components/ui/button.tsx`, `input.tsx`, `dialog.tsx`, etc.).

Never output the contents of shadcn registry components unless the user explicitly pastes those files and asks for modifications.

## Required Installation Method

Always install shadcn components through the shadcn CLI.

Examples:

```bash
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add dialog
npx shadcn@latest add form
npx shadcn@latest add table
```

If multiple components are required:

```bash
npx shadcn@latest add button input dialog form
```

## Workflow

1. Determine which shadcn components are needed.
2. Output the exact `npx shadcn@latest add ...` command(s).
3. Assume the generated files already exist after installation.
4. Build feature code by importing from `@/components/ui/...`.
5. Do not recreate or duplicate shadcn primitives.

Example:

```tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
```

Generate only:

- Installation commands
- Imports
- Feature/page implementation code

Never generate:

- `components/ui/button.tsx`
- `components/ui/input.tsx`
- `components/ui/dialog.tsx`
- Any other shadcn registry file contents

Exception:
Only edit an existing shadcn primitive if the user explicitly asks to customize that specific file and has provided its current contents.

# State Management (Zustand)

Use **Zustand** for shared/global state — auth, UI chrome, and any state read
across multiple components. For local-only state, keep `useState`.

## Where stores live

- **Feature state** → `features/<Feature>/stores/<name>-store.ts`, exported via
  the feature barrel (e.g. `useAuthStore` in `features/Auth`).
- **Cross-cutting UI state** → `stores/<name>-store.ts` (shared, domain-agnostic).

## Conventions

- One store per domain; name the hook `use<Domain>Store`.
- Type the state with an `interface`; never rely on inferred `any`.
- Co-locate actions inside the store; mutate via `set`.
- Select narrowly to avoid needless re-renders: `useAuthStore((s) => s.user)`.
- Server/session libraries stay the source of truth. The store **mirrors**
  resolved data (e.g. `ProtectedLayout` syncs Better Auth's session into
  `useAuthStore`) — it does not replace the session lifecycle.

```ts
import { create } from "zustand";

interface CounterState {
  count: number;
  increment: () => void;
}

export const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));
```

# Workflow Execution Loop

1. Read `App.css` and identify available theme variables.
2. Determine whether the change belongs in `pages`, `features`, or `components`.
3. Keep page files thin and move business logic into feature modules.
4. Reuse shared components whenever possible instead of creating duplicates.
5. Verify TypeScript interfaces and API boundaries.
6. Generate production-ready, accessible, and fully typed React code that respects the established architecture and theme system.

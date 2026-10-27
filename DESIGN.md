# StudyNest Design System

**Ink & Paper.** StudyNest should feel like a good notebook: warm paper, one ink
for everything you act on, and a highlighter for the few things that need to
jump out. Colour carries meaning; it is never decoration.

Source of truth: `client/src/App.css`. This file explains it.

---

## 1. Colour

### 1.1 How the tokens are organised

| Tier          | Example                               | Who uses it                                                      |
| ------------- | ------------------------------------- | ---------------------------------------------------------------- |
| **Primitive** | `--ink-700`, `--paper-150`            | Only `App.css`. Never referenced in components.                  |
| **Semantic**  | `--primary`, `--muted`, `--highlight` | Components, via Tailwind: `bg-primary`, `text-muted-foreground`. |

Light and dark mode only remap semantic → primitive. A component written with
semantic classes is dark-mode correct for free.

### 1.2 Primitives

Five families, all in OKLCH so steps are perceptually even.

**Paper** — warm neutral (hue ≈ 80). Every surface, line and body text.

| Token       | Hex       | Used for (light / dark)      |
| ----------- | --------- | ---------------------------- |
| `paper-50`  | `#FEFDFB` | card, popover / —            |
| `paper-100` | `#FAF8F4` | page background / —          |
| `paper-150` | `#F3F0E9` | muted, hover, sidebar / —    |
| `paper-200` | `#E4DFD6` | border / body text           |
| `paper-300` | `#DAD3CA` | input border / —             |
| `paper-400` | `#A9A49B` | — / muted text               |
| `paper-500` | `#6C635A` | muted text / —               |
| `paper-600` | `#3B3732` | — / input border             |
| `paper-700` | `#312D29` | — / border                   |
| `paper-800` | `#26211C` | body text / muted, hover     |
| `paper-850` | `#1D1A17` | — / card, popover            |
| `paper-900` | `#141210` | — / page background, sidebar |

**Ink** — the brand (hue ≈ 270). Primary actions, links, active state, focus.

| Token     | Hex       | Used for (light / dark)        |
| --------- | --------- | ------------------------------ |
| `ink-50`  | `#E5EBFB` | secondary (tinted surface) / — |
| `ink-200` | `#CAD3F3` | — / text on tinted surface     |
| `ink-300` | `#9BADF1` | — / primary                    |
| `ink-400` | `#798DDC` | — / focus ring                 |
| `ink-500` | `#4F6DCC` | focus ring / —                 |
| `ink-700` | `#2F479B` | primary / —                    |
| `ink-800` | `#25397E` | text on tinted surface / —     |
| `ink-900` | `#232A42` | — / secondary (tinted surface) |
| `ink-950` | `#10172D` | — / text on primary            |

**Marigold** — the highlighter (hue ≈ 80). Revision, emphasis, text selection.

| Token          | Hex       | Used for (light / dark) |
| -------------- | --------- | ----------------------- |
| `marigold-100` | `#FDE8B4` | highlight / —           |
| `marigold-200` | `#F6D389` | — / text on highlight   |
| `marigold-400` | `#EAAA40` | chart-2                 |
| `marigold-700` | `#724310` | text on highlight / —   |
| `marigold-900` | `#463111` | — / highlight           |

**Fern** (success) and **Brick** (destructive).

| Token       | Hex       | Used for (light / dark) |
| ----------- | --------- | ----------------------- |
| `fern-300`  | `#6EBF8C` | — / success             |
| `fern-600`  | `#2A7449` | success / —             |
| `fern-950`  | `#0A1A10` | — / text on success     |
| `brick-400` | `#E86154` | — / destructive         |
| `brick-600` | `#BC3328` | destructive / —         |

### 1.3 Semantic tokens

Tailwind class = `bg-<token>`, `text-<token>`, `border-<token>`.

| Token                  | Light                                 | Dark           | Meaning                                                         |
| ---------------------- | ------------------------------------- | -------------- | --------------------------------------------------------------- |
| `background`           | paper-100                             | paper-900      | Page                                                            |
| `foreground`           | paper-800                             | paper-200      | Body text                                                       |
| `card` / `popover`     | paper-50                              | paper-850      | Raised surface (sits _lighter_ than the page)                   |
| `muted`                | paper-150                             | paper-800      | Sunken / quiet surface, progress track                          |
| `muted-foreground`     | paper-500                             | paper-400      | Secondary text, captions, icons                                 |
| `accent`               | paper-150                             | paper-800      | **Hover** surface only (shadcn convention — not a brand colour) |
| `border`               | paper-200                             | paper-700      | Dividers, card edges                                            |
| `input`                | paper-300                             | paper-600      | Form-field borders                                              |
| `primary`              | ink-700                               | ink-300        | The one action per view, links, active item, progress fill      |
| `secondary`            | ink-50                                | ink-900        | Tinted ink surface: selected chip, icon badge, tonal button     |
| `secondary-foreground` | ink-800                               | ink-200        | Text/icon on `secondary`                                        |
| `highlight`            | marigold-100                          | marigold-900   | Highlighter: "Revise", topic nodes, `::selection`               |
| `highlight-foreground` | marigold-700                          | marigold-200   | Text on `highlight`                                             |
| `success`              | fern-600                              | fern-300       | Done, on track                                                  |
| `destructive`          | brick-600                             | brick-400      | Delete, errors, overdue                                         |
| `ring`                 | ink-500                               | ink-400        | Focus outline                                                   |
| `sidebar-*`            | paper-150 base, ink text on active    | paper-900 base | Navigation chrome                                               |
| `chart-1…5`            | ink, marigold, fern, brick, paper-500 | lighter steps  | Categorical order for any chart                                 |

### 1.4 Rules of use

- **One ink per screen.** At most one solid `bg-primary` button in a view. Everything else is `outline`, `ghost` or `secondary`.
- **Tint with tokens, not opacity.** Use `bg-secondary text-secondary-foreground` for a soft ink tint — not `bg-primary/10 text-primary`. Opacity tints shift hue on warm paper and break in dark mode.
  Exception: `bg-destructive/10` + `border-destructive/40` for inline error banners.
- **Marigold is a highlighter, not a theme.** If more than ~5% of a screen is marigold, something is wrong.
- **Status colours mean status.** `success` only for done/on-track, `destructive` only for delete/error/overdue. Never use them for decoration or categories.
- **Hover is neutral, selection is ink.** Hover → `bg-accent`; selected/active → `border-primary bg-secondary`.
- **No raw colours in components.** No hex, no `bg-blue-500`, no `oklch()` in `className` or `style`. If a token is missing, add it to `App.css` (both modes) and this file.

### 1.5 Contrast (WCAG 2.1)

All text pairs pass AA (4.5:1). Measured:

| Pair                              | Light | Dark |
| --------------------------------- | ----- | ---- |
| foreground on background          | 15.1  | 14.0 |
| muted-foreground on muted         | 5.2   | 6.5  |
| primary-foreground on primary     | 8.3   | 8.2  |
| primary on background (links)     | 7.9   | 8.6  |
| secondary-foreground on secondary | 9.0   | 9.6  |
| highlight-foreground on highlight | 6.9   | 8.6  |
| success on card                   | 5.6   | 7.9  |
| destructive on card               | 5.7   | 5.2  |

---

## 2. Typography

One superfamily (Adobe Source), loaded from Google Fonts in `client/index.html`.

| Token        | Family          | Use                                                    |
| ------------ | --------------- | ------------------------------------------------------ |
| `font-sans`  | Source Sans 3   | All UI and body text (default on `body`)               |
| `font-serif` | Source Serif 4  | `h1`, `h2` (page and dialog titles) — applied globally |
| `font-mono`  | Source Code Pro | Code, JSON input, share links                          |

| Size        | rem / line-height | Use                      |
| ----------- | ----------------- | ------------------------ |
| `text-xs`   | 0.75 / 1rem       | Captions, chips, legends |
| `text-sm`   | 0.875 / 1.25rem   | UI default               |
| `text-base` | 1 / 1.5rem        | Reading text, journal    |
| `text-lg`   | 1.125 / 1.75rem   | Stat figures             |
| `text-xl`   | 1.25 / 1.75rem    | Page titles (serif)      |

Weights: 400 body, 500 labels/buttons, 600 headings. Avoid 700 except numeric stats.
Use `tabular-nums` for any number that updates or sits in a column.

---

## 3. Spacing & Layout

Tailwind's 4px scale. Prefer these steps:

| Step | px  | Use                             |
| ---- | --- | ------------------------------- |
| `2`  | 8   | Inside chips, icon-to-label gap |
| `3`  | 12  | List item padding               |
| `4`  | 16  | Card padding, page gutter       |
| `6`  | 24  | Between sections                |
| `8`  | 32  | Between major regions           |

Reading width caps at `max-w-2xl` (42rem). Touch targets ≥ 44px on mobile (`h-11 md:h-9`).

---

## 4. Shape & Depth

| Token          | Value | Use                         |
| -------------- | ----- | --------------------------- |
| `rounded-sm`   | 4px   | Chips, inline code          |
| `rounded-md`   | 6px   | Buttons, inputs             |
| `rounded-lg`   | 8px   | Cards, list rows, nodes     |
| `rounded-xl`   | 12px  | Large panels, canvases      |
| `rounded-full` | —     | Pills, avatars, icon badges |

**Depth comes from surface + border, not shadow.** `shadow-xs … shadow-md` are
defined as no-ops in `App.css`, so shadcn primitives render flat. Only
floating layers (dialog, sheet) use `shadow-lg` and up.
Raised = `bg-card border`; sunken = `bg-muted`.

---

## 5. Hard constraints

- No gradients, glows, glassmorphism (`backdrop-blur`), or coloured shadows.
- No pure `#000` / `#FFF` — use `paper-900` / `paper-50`.
- No raw colour values in components (see 1.4).
- Solid, flat fills for buttons; hover = `/90` of the same token.
- Every new colour token must ship with a light **and** dark value and pass AA.

---

## 6. Changes from the first draft (and why)

| Draft                               | Now                                | Why                                                                                                            |
| ----------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Rose `#E11D48` for primary buttons  | Ink `#2F479B` for primary          | Rose and destructive red read as the same thing — every "Save" would look like "Delete".                       |
| Deep indigo `#1E1B4B` as primary    | Ink-700, a step lighter            | `#1E1B4B` is ~1.05:1 against body text; links and active states were indistinguishable.                        |
| Stone grey `#78716C` muted text     | `#6C635A`                          | `#78716C` is 4.4:1 on the muted surface — just under AA.                                                       |
| No accent / status colours          | Marigold highlight, fern success   | Revision items and "on track" needed a meaning-carrying colour that isn't the brand ink.                       |
| Inter + Merriweather (never loaded) | Source Sans 3 / Serif 4 / Code Pro | Fonts weren't actually loaded; Inter is the default "generated UI" look. Source is a coherent, bookish family. |

# Best Practices - Magni (Frontend)

Guidelines for building and extending the **Magni** React Native (Expo) frontend. This document is intended both as a reference for developers getting familiar with the codebase and as context for AI-assisted development prompts.

---

## Clean Code Principles

Write code that is easy to read, understand, and maintain. Every function, component, and module should have a single, clear purpose.

### Naming

- Use **descriptive, intention-revealing names**. A reader should understand what a variable, function, or component does without needing to trace through its implementation.
- Prefer full words over abbreviations (`workoutHistory` not `wkHist`, `isLoading` not `ld`).
- Boolean variables and props should read as yes/no questions: `isVisible`, `hasError`, `canSubmit`.
- Event handler props use an `on` prefix (`onSave`, `onDismiss`); internal handler functions use a `handle` prefix (`handleSave`, `handleDismiss`).

### Functions and Components

- Follow the **Single Responsibility Principle**. Each function should do one thing. Each component should render one conceptual piece of UI.
- Keep functions short. If a function needs a comment explaining a section of its body, that section is a candidate for extraction into a named function.
- Avoid deeply nested conditionals. Use early returns and guard clauses to keep the happy path unindented.
- Prefer **pure functions** where possible. Given the same inputs, they should produce the same outputs with no side effects.

### Code Organization

- Keep files focused. A file that exports a component should contain that component and its closely related helpers — nothing more.
- Order imports consistently: React/React Native, third-party libraries, internal modules (contexts, hooks, services, constants), then relative imports.
- Co-locate types with the code that uses them. Shared domain types belong in `lib/models/`.

---

## Efficiency

Write code that does exactly what is needed — no more, no less.

- **Avoid unnecessary re-renders.** Use `React.memo`, `useMemo`, and `useCallback` where profiling shows a measurable benefit, but do not apply them prematurely or blanket-wrap every component.
- **Minimize state.** Derive values from existing state rather than storing redundant copies. If a value can be computed from props or other state, compute it.
- **Batch related state updates.** Group state that changes together into a single `useState` object or use `useReducer` when state transitions are complex.
- **Avoid premature abstraction.** Do not generalize code until there is a real, demonstrated need. Duplication is cheaper than the wrong abstraction.
- **Keep bundle size in check.** Import only what you need from libraries. Prefer lightweight alternatives when a heavy dependency is only partially used.

---

## Component Reusability

Reuse components wherever possible and refactor existing components to be reusable where it makes sense. However, **reusability must not compromise readability**. A component that is technically reusable but difficult to understand or configure is worse than two simple, purpose-built components.

### When to Extract a Reusable Component

- The same visual pattern or interaction appears (or is about to appear) in **two or more places**.
- An existing component has grown large and a clearly bounded section can stand on its own.
- A piece of UI has a well-defined interface that can be expressed with a small number of props.

### When NOT to Force Reusability

- Two components look similar but serve fundamentally different purposes and are likely to diverge.
- Making a component "generic" would require a sprawling props interface, excessive conditional logic, or render-prop gymnastics that obscure intent.
- The abstraction only saves a few lines and adds indirection.

### Guidelines

- **Props over configuration objects.** Keep the component API flat and explicit. A reader should understand what a component does by scanning its props.
- **Composition over inheritance.** Use `children` and render props to compose behavior rather than building deep component hierarchies.
- **Sensible defaults.** Reusable components should work with minimal props. Optional props should have defaults that produce the most common behavior.
- **Refactor incrementally.** When making an existing component reusable, do it in a separate commit so the refactor is reviewable on its own.

---

## Atomic and Small Components

Components should be **small, focused, and composable**. Break down complex UIs into a tree of simple building blocks.

- **One concern per component.** A component handles layout, *or* data fetching, *or* user interaction — not all three. Screen-level components compose smaller pieces; they should contain minimal logic themselves.
- **Extract early.** If a component's render function is longer than roughly 80–100 lines, look for sections to extract. If a block of JSX is wrapped in a conditional or a `.map()`, it is almost always a candidate.
- **Hooks for logic.** Move stateful logic, side effects, and data transformations into custom hooks. The component itself should primarily be concerned with rendering. See the existing hooks in `hooks/` (`useWorkoutData`, `useWorkoutForm`, `useWorkoutCompletion`, `useDailyStats`) for examples of this pattern.
- **Flat component trees.** Avoid deeply nested wrapper components. If multiple layers of `<Wrapper>` exist solely to pass context or apply layout, flatten the structure or use composition.

---

## Styling

All styling must align with the existing design system defined in `lib/constants/ui.ts`.

### Design Tokens

Use the established tokens for all visual properties:

- **Colors:** Access through the `useThemeColors()` hook, which returns `LIGHT_COLORS` or `DARK_COLORS` depending on the user's preference. Never hard-code color values in component styles.
- **Spacing:** Use `SPACING` constants (`xs` through `xxxl`) for margins, padding, and gaps.
- **Typography:** Use `TYPOGRAPHY.sizes` and `TYPOGRAPHY.weights`. Do not introduce ad-hoc font sizes or weights.
- **Border radius:** Use `BORDER_RADIUS` constants.
- **Shadows:** Use `SHADOWS` presets (`sm`, `md`, `lg`).

### Styling Conventions

- Use `StyleSheet.create()` for static styles. Apply dynamic, theme-dependent overrides inline via the `style` prop.
- Keep styles close to the component that uses them — defined at the bottom of the same file.
- Avoid style objects that are dozens of properties long. If a style block is complex, consider whether the component should be broken down further.

### New Tokens

If a new feature needs a color, spacing value, or typographic style that does not exist in `ui.ts`, propose an addition to the design tokens rather than introducing a one-off value. New tokens should be intentional and broadly applicable.

---

## Responsive Design

**Magni** runs on native mobile (iOS and Android) and web via Expo. Every component and screen must work well across these targets.

- **Use flexbox.** React Native's layout engine is flexbox. Use `flex`, `flexDirection`, `alignItems`, and `justifyContent` for responsive layouts. Avoid fixed widths and heights except for intentionally fixed-size elements like icons or avatars.
- **Respect platform differences.** Use `Platform.OS` checks sparingly and only when there is a genuine behavioral or visual difference that cannot be handled by flexbox or safe area insets alone.
- **Safe areas.** Account for notches, status bars, and home indicators using `react-native-safe-area-context`.
- **Scroll.** Any screen or section that may overflow must scroll. Use `ScrollView` or `FlatList` as appropriate — prefer `FlatList` for long or dynamic lists for performance.
- **Test across targets.** Before considering a feature complete, verify it on web (the primary deployment target), and on at least one mobile form factor.

---

## Accessibility

Every feature must be usable by people who rely on screen readers, keyboard navigation, or other assistive technologies. Accessibility is not a follow-up task — it is part of building the feature.

### Core Requirements

- **Label all interactive elements.** Every `TouchableOpacity`, `Pressable`, button, and input must have an `accessibilityLabel` that describes its purpose (e.g., `accessibilityLabel="Delete workout"`).
- **Assign semantic roles.** Use `accessibilityRole` to communicate the element type: `"button"`, `"link"`, `"header"`, `"image"`, `"checkbox"`, etc.
- **Communicate state.** Use `accessibilityState` for toggleable or stateful elements: `{ selected: true }`, `{ disabled: true }`, `{ checked: true }`.
- **Group related content.** Use `accessible={true}` on container views that should be announced as a single unit.
- **Announce dynamic changes.** When content changes in response to an action (e.g., a toast appearing, a form error surfacing), use `AccessibilityInfo.announceForAccessibility()` or `accessibilityLiveRegion="polite"` so screen readers notify the user.

### Visual Accessibility

- **Color contrast.** Text must meet a minimum contrast ratio of **4.5:1** against its background (WCAG AA). Use the existing theme colors, which are designed with contrast in mind.
- **Touch targets.** Interactive elements should have a minimum size of **44×44 points** (Apple HIG) / **48×48 dp** (Material). Use `hitSlop` to increase the tappable area without affecting layout when the visual element is smaller.
- **Do not rely on color alone** to convey meaning. Pair color indicators with text labels, icons, or patterns.

### Keyboard and Focus

- **Focusable elements.** Ensure all interactive elements are reachable via keyboard tab navigation on web.
- **Focus order.** The tab order should follow visual reading order. Avoid using `tabIndex` to create non-obvious focus sequences.
- **Visible focus indicators.** On web, interactive elements should have a clear focus ring or style change when focused via keyboard.

---

## Existing Patterns to Follow

The codebase has established conventions that should be followed for consistency.

| Pattern | Location | Usage |
|---------|----------|-------|
| **React Context** for global state | `contexts/` | Theme, auth, toasts, weight period. Wrap providers in `_layout.tsx`. |
| **Custom hooks** for logic extraction | `hooks/` | Data fetching, form state, computed values. Components stay declarative. |
| **Singleton services** for persistence | `lib/services/` | AsyncStorage operations, API calls. Access via `Service.getInstance()`. |
| **Domain models** as TypeScript types | `lib/models/` | Shared type definitions for workouts, weight, averages. |
| **Design tokens** for theming | `lib/constants/ui.ts` | Colors, spacing, typography, shadows, border radius. |
| **Feature-based component folders** | `components/<feature>/` | Group related components by domain (workouts, weight, settings, auth). |
| **Shared UI at components root** | `components/` | Cross-cutting UI: `Toast`, `ErrorBoundary`, `DatePickerModal`, confirmation system. |
| **Thin route files** | `app/` | Route files compose feature components. They should contain minimal logic. |

---

## Summary

1. Write clean, readable code with clear names and single-responsibility functions.
2. Keep components small, atomic, and composable.
3. Reuse components where a genuine pattern exists — do not force abstraction.
4. Use the design system tokens in `lib/constants/ui.ts`; never hard-code visual values.
5. Build every screen to work on web, iOS, and Android.
6. Make every feature accessible from the start: labels, roles, contrast, touch targets.
7. Follow established project patterns for state, services, and file organization.

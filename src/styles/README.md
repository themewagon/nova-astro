# CSS Layers

`global.css` is the only global stylesheet entry point. Imports are combined
during the build, so splitting source files does not create additional browser
requests.

## File Responsibilities

- `fonts.css` loads local fonts.
- `themes.css` contains generated design profile tokens.
- `tailwind-bridge.css` connects Tailwind to the tokens.
- `foundations.css` contains document foundations, accessibility rules and base UI variables.
- `components.css` contains shared components, typography, buttons, forms and prose styles.
- `navigation.css` contains the mobile drawer and shared navigation states.
- `section-patterns.css` contains section background patterns and image overlays.
- `ui-theme.css` contains UI compatibility variables and shadcn variables.
- `patterns.css` contains shared library patterns extracted from the foundations, including marquees, galleries and patterns from earlier client deliveries.
- `motion.css` contains the shared animation system.

## Performance

The default build uses one global CSS file. Do not split CSS into multiple files
only because the source files are separated. Project-specific styles may be
moved into a separate import only when a concrete build measurement shows a
benefit for CSS size, critical rendering or LCP.

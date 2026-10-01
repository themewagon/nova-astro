# Design Rules: Nova

**Read this first before any visual work.**

---

## 1. What to never do

### 🚫 Dots and indicators
BAD:
```html
<span class="size-1.5 rounded-full bg-brand-primary"></span>
<span class="h-2 w-2 rounded-full bg-green-500"></span>
```
GOOD: Do not use dots. At all. If you need a separator, use text, a line or a geometric shape.

### 🚫 Pulsing elements
BAD:
```html
<div class="animate-pulse h-2 w-2 rounded-full bg-red-500"></div>
```
GOOD: Zero `animate-pulse`. Use static accents or nothing.

### 🚫 Fake quotes
BAD:
```html
<p class="border-l-2 pl-8 italic text-brand-dark/60">Quote</p>
```
GOOD: Use a dedicated quote block with a left border and an SVG quote mark.

### 🚫 Hardcoded colors
BAD:
```css
background: #2563eb;
color: #333;
border: 1px solid #e5e7eb;
```
GOOD: Always use tokens. `var(--color-brand-primary)`, `text-brand-dark/70`, `border-brand-dark/10`.

### 🚫 Direct layout classes on atoms
BAD: `<Heading tag="h2" class="mt-10 mb-20" />`
GOOD: Let the parent control spacing through `SectionHeader`, `ButtonGroup` or a container div.

### 🚫 Raw HTML instead of atoms
BAD: `<section class="py-16"><h2 class="text-3xl">Title</h2><p class="text-lg">Description</p></section>`
GOOD: `<Section tone="page"><Container><Heading tag="h2" variant="section-title">Title</Heading><Text variant="lead">Description</Text></Container></Section>`

### 🚫 Ghost buttons with opacity
GOOD: `<button class="bg-white/5 text-brand-dark/70">` is invisible on a light background.
GOOD: A ghost button uses a border and solid text. Always keep it visible.

### 🚫 Buttons without text swap
BAD: A custom `<a class="ui-button">` with only text, or relying on the hover effect to appear automatically.
GOOD: `Button.astro` includes text swap by default. It wraps two spans in `.ui-button-text-wrap`, rolls the text over 600ms on hover and adds the fill through `::after`. Set `hoverText` only when the hover label should differ. Without it, the roll displays the same text. Write the raw wrapper manually only where `Button.astro` cannot be used, such as the navbar or cookie consent, and always include the full `.ui-button-text-wrap` and `ui-type-cta-label`. Without that class, the text uses the body font instead of the CTA font.

### 🚫 Dark sections
BAD: `<Section tone="base">` on a dark background without white text.
GOOD: Use only `page` for white, `base` for off-white and `accent` for the brand accent. Do not introduce navy or black section tones.

### 🚫 Generic three-column layouts everywhere
BAD: "Three columns, six cards, evenly distributed" looks like every other template.
GOOD: Vary the layouts. Use 2+1, staggered arrangements and grids with different proportions. Avoid predictable repetition.

### 🚫 Custom hover lift on cards
BAD: `class="rounded-2xl border hover:-translate-y-1 hover:shadow-xl transition-all"` on a card. Every block would have a different animation, and `motion.css` already overrides it through the higher-specificity `translate` property used by reveal motion.
GOOD: Use the `ui-card-interactive` class on the card container. One animation applies to all interactive cards in the template: `translateY(-0.25rem)` through `transform`, a brand-primary border at 34% opacity and a shadow with a 250ms easeOutCubic transition. The `data-motion` interaction is handled globally in `motion.css`. Add the class only to cards that should react to hover. Static cards remain static.

---

## 2. Design preferences

- **Mobile-first:** default classes are mobile, `md:` is desktop
- **Typography:** do not use Inter, Roboto or Space Grotesk. Nova self-hosts Outfit, Satoshi and Gambarino in `src/styles/fonts.css`. Load new fonts through `npm run assets:fonts`, never through Google Fonts CDN. Use `--font-sans` and `--font-heading` from `themes.css`.
- **Colors:** muted palette plus one accent. No purple-blue gradients
- **Layout:** use generous space and do not make sections dense
- **Photography:** WebP, maximum 200KB, without stock photos of smiling people
- **Motion:** subtle scroll reveal. Decorations are static by default, and explicit exceptions must respect reduced motion
- **Separators:** use thin lines, beams and geometric shapes, not dots

---

## 3. Mandatory technical rules

1. Every text element goes through `Text.astro` or `Heading.astro`, never raw `<p>` or `<h1>` elements
2. Every section uses `Section.astro` with `Container.astro` inside
3. Use aliases for imports: `@components/`, `@utils/`, `@data/`
4. Add a trailing slash `/` to all internal links
5. After changes, run `npm run check:atomic -- --scan-dirs src/components/[name]`
6. Lighthouse targets: Performance 95+, Accessibility 95+, SEO 100
7. Every button or CTA uses the `Button.astro` atom. Text swap and the `::after` fill are enabled by default. Use `hoverText` only to change the hover label
8. Every interactive card uses the `ui-card-interactive` class on its container. The contract lives in `components.css` and interacts with motion through `motion.css`. Do not use custom `hover:-translate-y-*`, `hover:shadow-*` or `hover:border-*` classes on cards. The contract test is `card-contract.test.ts`

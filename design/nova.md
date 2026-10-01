---
name: Nova, Creative Agency
colors:
  surface: "#fffdf9"
  surface-dim: "#f4f0e9"
  surface-bright: "#ffffff"
  surface-container-lowest: "#fffdf9"
  surface-container-low: "#f7f3ed"
  surface-container: "#eee8df"
  surface-container-high: "#ddd4c9"
  surface-container-highest: "#b9aea2"
  on-surface: "#161616"
  on-surface-variant: "#68635d"
  outline: "#b9aea2"
  outline-variant: "#ddd4c9"
  surface-tint: "#b98b6e"
  primary: "#161616"
  accent: "#b98b6e"
  on-primary: "#fffdf9"
  primary-container: "#eee8df"
  on-primary-container: "#161616"
  secondary: "#68635d"
  on-secondary: "#fffdf9"
  secondary-container: "#f4f0e9"
  on-secondary-container: "#161616"
  tertiary: "#b98b6e"
  on-tertiary: "#fffdf9"
  tertiary-container: "#ead9cc"
  on-tertiary-container: "#4f3223"
  error: "#b42318"
  on-error: "#ffffff"
  error-container: "#fddbd7"
  on-error-container: "#641b16"
  success: "#2f6b4f"
  on-success: "#ffffff"
  success-container: "#dcefe4"
  on-success-container: "#173d2b"
  warning: "#9a621b"
  on-warning: "#ffffff"
  warning-container: "#f8e7c8"
  on-warning-container: "#59370d"
  info: "#285b77"
  on-info: "#ffffff"
  info-container: "#dcecf4"
  on-info-container: "#17394b"
  background: "#fffdf9"
  on-background: "#161616"
  brand-primary: "#161616"
  brand-accent: "#b98b6e"
  brand-dark: "#161616"
  brand-light: "#fffdf9"
  brand-cream: "#f4f0e9"
typography:
  display:
    fontFamily: Satoshi, sans-serif
    fontSize: 64px
    fontWeight: "700"
    lineHeight: 0.96
    letterSpacing: -0.065em
  headline:
    fontFamily: Satoshi, sans-serif
    fontSize: 42px
    fontWeight: "700"
    lineHeight: 0.98
    letterSpacing: -0.055em
  title:
    fontFamily: Satoshi, sans-serif
    fontSize: 20px
    fontWeight: "700"
    lineHeight: 1.3
  body:
    fontFamily: Satoshi, sans-serif
    fontSize: 16px
    fontWeight: "400"
    lineHeight: 1.65
  label:
    fontFamily: Satoshi, sans-serif
    fontSize: 11px
    fontWeight: "600"
    lineHeight: 1.2
    letterSpacing: 0.18em
rounded:
  sm: 0.5rem
  DEFAULT: 0.75rem
  md: 1rem
  lg: 1.5rem
  xl: 2rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 32px
  xl: 64px
  container-px: "clamp(1rem, 4vw, 4rem)"
  section-py: "clamp(4rem, 8vw, 7.5rem)"
elevation:
  soft: "0 14px 40px -24px rgb(22 22 22 / 0.28)"
  strong: "0 28px 80px -32px rgb(22 22 22 / 0.38)"
ui:
  text-on-light: "#161616"
  text-on-light-subtle: "rgba(22, 22, 22, 0.64)"
  text-on-dark: "#fffdf9"
  text-on-dark-subtle: "rgba(255, 253, 249, 0.68)"
  type-lead-tracking: "-0.01em"
  type-lead-leading: "1.55"
  type-body-leading: "1.65"
  type-heading-tracking: "-0.065em"
  button-radius: "9999px"
  button-hover-effect: "lift"
  bg-base: "var(--color-brand-cream)"
  bg-page: "var(--color-brand-light)"
  bg-surface: "var(--color-surface)"
  bg-accent: "var(--color-brand-accent)"
fonts:
  sans: "Satoshi, sans-serif"
  heading: "Satoshi, sans-serif"
animations:
  scroll: "scroll 36s linear infinite"
---

# Nova, Visual Direction

Nova is an elegant template for a creative studio, digital agency or premium brand. The site should feel calm, refined and capable. Clear hierarchy, strong photography and controlled contrast are the priorities.

## Composition Principles

- Keep the main background light and warm, with subtle tonal changes between sections.
- Use black for navigation, statistics, strong headings and the closing call to action.
- Use the copper accent sparingly in highlighted words, icons, links and buttons.
- Cards should have soft corners, thin borders and generous internal space.
- Break the regular grid with a large image, 2+1 proportions and wide content bands.
- Keep motion calm: section reveals, subtle image zoom and scrolling logos without pulsing effects.

## Homepage Order

1. Floating navigation over a light hero.
2. Hero with a large headline, portrait, two CTAs and four metrics.
3. Trust bar with logos.
4. Bento portfolio with two main projects and one wider frame.
5. Four services in cards with simple icons.
6. Team section with an image and a list of benefits.
7. Dark CTA with a mountain photograph as the strong closing section.
8. Minimal footer on a dark background.

## Photography

Nova production assets live in `public/assets/images/t001-nova/`. The source reference is kept in Templar documentation and is not used as a production image. Every asset should have alt text, and images must keep the proportions expected by the component.

## Main Constraints

- Do not use purple gradients, arbitrary badges or decorative dots.
- Do not make sections dense with too many cards or evenly repeated columns.
- Do not add new fonts from a CDN. Use `Outfit` for headings and `Satoshi` for body text.
- Do not apply colors directly in components. Colors must come from the `nova` profile tokens.

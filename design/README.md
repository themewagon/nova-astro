# Nova Visual Profile

This repository publishes one coherent visual profile: `nova.md`. The file
describes the color, spacing, radius, typography and animation tokens used by
the Nova template components.

## Synchronization

After changing tokens, run:

```bash
npm run design:sync
npm run design:lint
```

The script synchronizes the profile to `src/styles/themes.css`,
`src/styles/tailwind-theme.css` and `tailwind.tokens.js`. Generated files remain
in the repository so builds are reproducible after cloning.

Nova is the only profile supported by the site and the internal Studio. New
visual directions should be developed in a separate repository or as a new
template, rather than as a hidden switch in this product.

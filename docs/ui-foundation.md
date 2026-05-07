# UI Foundation

Friends Hub uses a small visual stack:

- shadcn-style local components for accessible primitives.
- Tailwind design tokens in `app/globals.css` and `tailwind.config.js`.
- `motion` for subtle interface animation.
- lucide icons for tool buttons and empty states.

## Reusable Files

- `components/ui/badge.tsx`: compact status and metadata labels.
- `components/ui/motion-shell.jsx`: shared Motion wrappers for panels, entrances, and staggered lists.
- `components/ui/effect-preset-card.jsx`: preset selector card for future ComfyUI-powered visual effects.
- `lib/visual-effects.js`: initial clean preset model for ComfyUI workflows.

## Direction

Core app screens should stay clear and functional. Visual effects belong mostly in gallery, event poster/invite creation, and generated media history. ComfyUI workflow details should stay behind simple presets, sliders, and upload/select controls.

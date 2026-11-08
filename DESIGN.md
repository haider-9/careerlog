# Careerlog design system

## Product intent

Careerlog is a calm, utility-first job search operating system. The interface favors strongly legible information architecture, disciplined spacing, and restrained motion over decoration. It should feel editorial and confident rather than noisy or trend-driven.

## Color tokens

- Background: `#F5F3EF`
- Foreground: `#242522`
- Primary accent: `#FF6B35`
- Muted olive: `#75836C`
- Stone border: `#DEDCD5`
- Surface cards: `#FFFDFB`
- Muted low-contrast text: `#5E635D`

Use the warm neutral background as the default canvas. The primary accent is reserved for meaningful actions and status emphasis; it should never dominate the entire interface.

## Typography

- Headings: Manrope
- Body/UI: DM Sans
- Metadata: IBM Plex Mono

Use sentence-case headings with tight tracking, and keep body text comfortable and clear. Use monospace for counts, dates, and status metadata only.

## Spacing and rhythm

- Base spacing unit: 8px
- Layout scales: 8, 16, 24, 32, 40, 48, 64
- Apply consistent vertical rhythm between sections and cards
- Favor whitespace around tables and forms rather than extra ornaments

## Border radius

- Small controls: 10px
- Cards and panels: 16px
- Large layout surfaces: 20px

The radius should remain understated. The app should not feel like a rounded dashboard template.

## Component principles

- Buttons: clear hierarchy; primary for decisive actions, secondary for non-critical actions
- Cards: lightweight surfaces for grouping information, never decorative containers
- Tables: dense, readable rows with clear row hover feedback
- Forms: explicit labels, modest field height, high contrast, accessible focus states

## Shadows

Keep shadows low-contrast and subtle. Use them sparingly to separate floating UI areas, not as decorative effects.

## Responsive layout

- Mobile: stacked navigation, generous tap targets, single-column cards
- Tablet: compact sidebar or top navigation adaptation
- Desktop: persistent left sidebar, main content with denser table layouts

## Interaction patterns

- Use short transitions for hover, open, and close states
- Page transitions should be subtle and restrained
- Prefer meaningful motion over motion for its own sake
- Use reduced-motion support via system preferences when available

## Accessibility rules

- Maintain 4.5:1 minimum contrast on text
- Ensure keyboard navigation across all interactive elements
- Provide visible focus states on core controls
- Keep labels associated directly with form controls
- Avoid relying on color alone to communicate meaning

## Motion guidance

Keep animation purposeful: drawer open/close, button feedback, and minimal loading transitions only. Avoid decorative gradients, floating motion, or wearisome animations.

## Design checklist

Before shipping a page, verify:

- information hierarchy reads clearly in seconds
- whitespace is intentional and consistent
- table density remains usable at desktop widths
- the page works well in both light and dark themes
- the interface feels professional rather than generic

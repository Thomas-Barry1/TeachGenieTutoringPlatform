# TeachGenie Theme Colors

## Overview
This document outlines the official theme colors for the TeachGenie platform, including their usage guidelines and implementation details.

## Primary Theme Colors

### 1. Deep Blue (`#214966`)
- **Hex**: `#214966`
- **Usage**: Primary brand color, main headings, primary text
- **Purpose**: Establishes trust, professionalism, and authority
- **Best for**: Headings, important text, primary actions

### 2. Orange (`#e38614`)
- **Hex**: `#e38614`
- **Usage**: Accent color, call-to-action buttons, highlights
- **Purpose**: Creates urgency, draws attention, encourages action
- **Best for**: CTAs, ratings, important highlights, step indicators

### 3. Teal (`#05aaae`)
- **Hex**: `#05aaae`
- **Usage**: Secondary accent, supporting elements, interactive elements
- **Purpose**: Provides visual interest, supports primary actions
- **Best for**: Secondary buttons, icons, supporting text, borders

## Extended Color Variations

### Deep Blue Variations
- **Light**: `#2a5a7a` - Hover states, lighter backgrounds
- **Dark**: `#1a3d52` - Darker backgrounds, deep sections

### Orange Variations
- **Light**: `#f39c1f` - Hover states, lighter accents
- **Dark**: `#d17a12` - Pressed states, darker accents

### Teal Variations
- **Light**: `#0bb8bc` - Hover states, lighter backgrounds
- **Dark**: `#049a9e` - Pressed states, darker backgrounds

## Implementation

### Tailwind CSS Classes
The colors are available as Tailwind utility classes:

```css
/* Background colors */
bg-teachgenie-deep-blue
bg-teachgenie-orange
bg-teachgenie-teal

/* Text colors */
text-teachgenie-deep-blue
text-teachgenie-orange
text-teachgenie-teal

/* Extended variations */
bg-teachgenie-deep-blue-light
bg-teachgenie-orange-light
bg-teachgenie-teal-light
```

### CSS Custom Properties
Available globally as CSS variables:

```css
:root {
  --teachgenie-deep-blue: #214966;
  --teachgenie-orange: #e38614;
  --teachgenie-teal: #05aaae;
}
```

### Utility Classes
Pre-built component classes:

```css
.btn-teachgenie-primary    /* Orange gradient button */
.btn-teachgenie-secondary  /* White button with teal border */
```

## Usage Guidelines

### Color Combinations
- **Primary + Secondary**: Deep Blue + Orange for main CTAs
- **Primary + Accent**: Deep Blue + Teal for supporting elements
- **Accent + Secondary**: Orange + Teal for highlights and ratings

### Accessibility
- **Contrast**: All color combinations meet WCAG AA standards
- **Text**: Use Deep Blue on white/light backgrounds
- **Icons**: Use white icons on Deep Blue backgrounds
- **Buttons**: Orange buttons with white text for primary actions

### Do's and Don'ts
✅ **Do**:
- Use Deep Blue for main headings and important text
- Use Orange for primary CTAs and important highlights
- Use Teal for secondary actions and supporting elements
- Maintain consistent color usage across components

❌ **Don't**:
- Use all three colors in a single gradient
- Use light colors on light backgrounds
- Use colors without considering contrast ratios
- Mix theme colors with non-brand colors

## Examples

### Hero Section
```tsx
<section className="bg-gradient-to-br from-teachgenie-deep-blue via-white to-teachgenie-teal/20">
  <h1 className="text-teachgenie-deep-blue">Learn from the Best Tutors</h1>
  <button className="btn-teachgenie-primary">Find Your Perfect Tutor</button>
</section>
```

### Feature Cards
```tsx
<div className="bg-white border border-teachgenie-teal/30">
  <div className="bg-teachgenie-deep-blue rounded-2xl">
    <Icon className="text-white" />
  </div>
  <h3 className="text-teachgenie-deep-blue">Feature Title</h3>
</div>
```

### Testimonials
```tsx
<div className="bg-gradient-to-r from-teachgenie-orange to-teachgenie-orange-light">
  <StarIcon className="text-white" />
</div>
```

## File Locations
- **Tailwind Config**: `tailwind.config.ts`
- **CSS Variables**: `src/app/globals.css`
- **Documentation**: `THEME_COLORS.md`

## Maintenance
- Colors are defined in both Tailwind config and CSS variables
- Changes should be made in both locations
- Test contrast ratios when making color adjustments
- Update this documentation when colors change

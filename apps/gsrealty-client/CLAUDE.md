# gsrealty-client CLAUDE.md

## Frontend Development Rules

### No Emojis
Do NOT use emojis anywhere in the frontend code, including:
- Component headings and labels
- Button text
- Placeholder text
- Comments
- Console logs

Use Lucide React icons instead of emojis when visual indicators are needed.

### Icon Alignment
Icons in buttons and navigation items should always be placed TO THE LEFT of text, not above.
- Use `inline-flex items-center` on container elements (Links, anchors inside asChild buttons)
- Use `mr-2` or `mr-3` margin on icons for spacing
- Never use `flex-col` for icon+text layouts in buttons

### Button asChild Pattern
When using the Button component with `asChild` prop, the child Link or anchor element must have `inline-flex items-center` to maintain proper icon alignment:

```tsx
// Correct - standard button
<Button asChild>
  <Link href="/path" className="inline-flex items-center">
    <Icon className="mr-2 h-4 w-4" />
    Button Text
  </Link>
</Button>

// Correct - navigation item (add w-full for full-width)
<Button asChild className="glass-nav-item">
  <Link href="/path" className="inline-flex items-center w-full">
    <Icon className="mr-3 h-5 w-5" />
    Nav Item
  </Link>
</Button>

// Incorrect - icon will appear above text
<Button asChild>
  <Link href="/path">
    <Icon className="mr-2 h-4 w-4" />
    Button Text
  </Link>
</Button>
```

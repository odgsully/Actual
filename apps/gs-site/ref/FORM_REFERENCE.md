# Productivity Accountability Form - Reference

This document describes the Google Form to be replicated in gs-site.

## Optimized Images

All images in `ref/optimized/` (total ~540KB):

| File | Description |
|------|-------------|
| `form-page1-header.png` | Page 1 top: Header, Date field, Time selection |
| `form-page1-footer.png` | Page 1 bottom: Date/Time complete, Next button |
| `form-page2-header.png` | Page 2 top: Deep Work hours, accomplishments |
| `form-page2-footer.png` | Page 2 bottom: Multi-select, PDF tracking, rating |
| `life-in-weeks.png` | Life in Weeks visualization ("Memento Mori") |

---

## Form Structure

### Page 1 of 2 - Check-In Time

**Header:**
- Title: "Productivity Accountability Form"
- Star Wars Tatooine themed banner image
- Mission quote: "Keep the main thing the main thing. My Mission: LEGM. My mission unto: $$$$"

**Fields:**

1. **Date** (required)
   - Type: Date picker
   - Format: mm/dd/yyyy

2. **Time** (required)
   - Type: Multiple choice (checkboxes)
   - Options:
     - Noon
     - 2:45pm
     - 5:45pm
     - Other: [text input]

**Navigation:** Next button → Page 2

---

### Page 2 of 2 - Daily Report

**Fields:**

3. **Deep Work Hrs: Noon** (optional)
   - Type: Short text
   - Placeholder: "Your answer"

4. **Deep Work Hrs: 2:45pm** (optional)
   - Type: Short text
   - Placeholder: "Your answer"

5. **Deep Work Hrs: 5:45pm** (optional)
   - Type: Short text
   - Placeholder: "Your answer"

6. **Deep Work Hrs: EOD** (optional)
   - Type: Short text
   - Placeholder: "Your answer"

7. **What'd you get done?** (optional)
   - Type: Long text / paragraph
   - Placeholder: "Your answer"

8. **Improve how?** (optional)
   - Type: Long text / paragraph
   - Placeholder: "Your answer"

9. **Multi Select** (optional)
   - Type: Checkboxes (multi-select)
   - Options:
     - Clean Desk
     - Clean Desktop

10. **working on any large .pdf's not yet added to Notebook, MCP, RAG, Bookmark, print, Document?** (optional)
    - Type: Checkboxes
    - Options:
      - Yes
      - Yes; Added

11. **what .pdf(s) were added?** (optional, conditional)
    - Type: Short text
    - Placeholder: "Your answer"

12. **Notion Calendar Grade** (required)
    - Type: Linear scale
    - Range: 1 to 5
    - Visual: Radio buttons in horizontal row

**Navigation:** Back button, Submit button

---

## Implementation Notes

### Morning vs Evening Phase
- **Time = Noon**: Morning check-in
- **Time = 2:45pm / 5:45pm**: Afternoon check-ins
- **Time = EOD**: Evening wrap-up (fills all Deep Work fields)

### Data Storage
- Consider storing to Notion database (like Habits)
- Or local Supabase table
- Fields map naturally to productivity tracking

### Life in Weeks Graphic
- Separate visualization component
- "Memento Mori" life calendar
- Shows weeks lived vs remaining (assuming ~80 year life)
- Could be standalone GraphicTile

---

## Quick Path Reference

```
apps/gs-site/ref/
├── optimized/
│   ├── form-page1-header.png   (204KB)
│   ├── form-page1-footer.png   (52KB)
│   ├── form-page2-header.png   (112KB)
│   ├── form-page2-footer.png   (68KB)
│   └── life-in-weeks.png       (104KB)
├── google-form/                 (original 2x images)
├── life-in-weeks/              (original image)
└── FORM_REFERENCE.md           (this file)
```

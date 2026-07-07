# Weigh — an evidence-weighted priority tool

A small web app that scores product ideas by **evidence quality per day of build cost** — not just how many people mentioned a problem, but how strong that evidence actually is, weighed against how expensive the idea is to build.

**[Live demo →](#)** *(add your GitHub Pages link here once deployed)*

![Screenshot of the ranked idea board](screenshot_demo.png)

## Why I built this

During a product strategy internship at an agtech startup, I ran dozens of farmer discovery interviews to figure out which product idea to pitch to the CEO. The hard part was never counting how many people mentioned a problem — it was being honest that a farmer's unprompted complaint is worth more evidence than my own guess about what might help them, and that a cheap idea with modest evidence isn't automatically a worse bet than an expensive idea with strong evidence.

I did that weighing by hand, in my head, across three ideas, for weeks. This is a small tool version of that judgment call — something that forces the trade-off to be explicit instead of implicit, and shows its math instead of hiding it behind a single opaque "priority score."

The three demo ideas seeded in the app are generalized versions of the ones I actually pitched — the evidence descriptions are anonymized and the underlying interview data isn't included, but the scoring logic and the relative ranking are real.

## How the score works

Every idea has two inputs:

1. **Evidence**, added one piece at a time, each graded by strength:
   - **Direct quote (weight 3)** — something a person said unprompted, in their own words
   - **Stated pain, inferred fit (weight 2)** — they described a problem, and this idea is my inference about what would help
   - **Structural finding (weight 1.5)** — something observed indirectly, not stated by anyone directly
   - **External benchmark (weight 1)** — a comparable company's reported number, not primary evidence

2. **Build cost**, in estimated days, with a flag for whether that estimate is solid or depends on an open question that hasn't been answered yet.

The **evidence score** is the sum of every evidence entry's weight. The **priority score** is evidence score divided by build cost — evidence weight earned per day of engineering time. Ideas are ranked by priority score, highest first.

This means a cheap idea with modest evidence can outrank an expensive idea with strong evidence. That's not a bug — it's the actual trade-off a real prioritization decision has to make, and the tool is built to surface it rather than smooth it over.

## What it looks like

Each idea renders as a card with a segmented bar — the "weighing bar" — where each segment is one piece of evidence, sized by its relative contribution to the total score. It's a direct visual answer to "why did this idea rank where it did," rather than a number you have to trust blindly.

## Tech

Plain HTML, CSS, and JavaScript. No frameworks, no build step, no dependencies beyond two Google Fonts. Data persists in the browser via `localStorage`, so ideas you add stick around on refresh but never leave your machine.

```
index.html    structure and the evidence-row template
style.css     the whole visual design, incl. the weighing bar
script.js     scoring logic, rendering, localStorage persistence
```

## Running it locally

No build step — just open `index.html` in a browser, or serve the folder with any static server:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploying to GitHub Pages

1. Push this folder to a GitHub repo
2. In the repo settings, under **Pages**, set the source to your main branch, root directory
3. GitHub will publish it at `https://<username>.github.io/<repo-name>/`

## What I'd build next

- Adjustable weight values, so the strength scale isn't hardcoded
- A way to compare two scoring runs side by side, for when new evidence changes a ranking
- Export/import so a board can be shared as a file, not just kept in one browser's local storage

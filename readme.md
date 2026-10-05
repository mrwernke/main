# Math Projects

This repository contains the SAT Math Prep site and a growing collection of math applets.

## Projects

- `sat-math-prep/` - SAT Math Prep application and its standalone Vite project.
- `math-applets/domain-range-helper/` - first math applet, under development.
- `math-applets/absolute-value-graphing/` - guided absolute-value graphing lab.
- `math-applets/quadratic-graphing/` - quadratic graphing lab with standard, factored, and vertex form practice.
- `main-site/` - Wernke's World of Math directory linking to the applets.

## Math applets

The applets are standalone static sites; no Base44 backend or build is required.
To preview the directory and applets together, serve the repository root with a
static HTTP server and open `main-site/` or `math-applets/quadratic-graphing/`.

The quadratic lab uses eight functions in each form. All have integer
coefficients, vertices, and plotted table points; factored form keeps integer
roots. Vertex options 3 and 5 are swapped from the original order, and its
appended options 6-8 have irrational x-intercepts through vertical shifts.
Standard and factored forms preserve their first six options and append two.
Switching form or function starts a fresh
practice attempt. Standard and vertex forms use a five-row table; factored form
uses the vertex, roots, and the a-value to plot five points. When both roots
are already one unit from the vertex (factored options 3 and 5), only those
three distinct points are required; the extra a-value question is skipped.
All forms finish
with domain/range, extrema, y-intercept, and end behavior (question 8).
On desktop, standard and vertex forms keep the starting questions in the left column,
with the table on the right and the graph below it; smaller screens stack the
steps. Factored form places its opening questions on the left and the graph
on the right, with a stacked fraction for averaging the roots. Its a-value
directions specify the number of units up (positive a) or down (negative a).
Points are plotted by clicking the coordinate plane. The y-intercept
is entered as `(0, y)`, and completing a practice attempt triggers the same
confetti animation as the absolute-value lab.

Run the quadratic model tests with:

```bash
node --test math-applets/quadratic-graphing/model.test.mjs
```

## SAT Math Prep

Run the SAT Math Prep project locally from its directory:

```bash
cd sat-math-prep
npm install
npm run dev
```

GitHub Pages assembles the directory, math applets, and SAT Math Prep project
using `.github/workflows/deploy-pages.yml`. The quadratic lab's HTML, CSS, and
JavaScript files are included in that deployment.
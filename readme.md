# Wernke's Math Resources

This repository is the home for the whole site: the main homepage, a growing
collection of math applets, and the SAT Math Prep app (development currently
paused) as subdirectories.

## Projects

- `main-site/` - Wernke's Math Resources homepage: four unit dropdowns listing skills (with applet links where available) above the applet directory cards.
- `math-applets/domain-range-helper/` - first math applet, under development.
- `math-applets/absolute-value-graphing/` - guided absolute-value graphing lab.
- `math-applets/quadratic-graphing/` - quadratic graphing lab with standard, factored, and vertex form practice.
- `math-applets/quadratic-from-graph/` - write all three quadratic forms from a marked graph, with box-method multiplication.
- `math-applets/quadratic-factoring/` - factor monic quadratic expressions using a live multiplication box.
- `math-applets/absolute-value-equations/` - guided and independent practice solving a|bx + c| + d = e equations.
- `math-applets/absolute-value-features/` - identify key characteristics of absolute value graphs.
- `math-applets/quadratic-features/` - the same characteristics lab for quadratic graphs.
- `math-applets/function-transformations/` - identify transformations of a parent function f(x).
- `math-applets/absolute-value-transformations/` - the same transformations lab for |x|.
- `math-applets/quadratic-transformations/` - the same transformations lab for x².
- `sat-math-prep/` - SAT Math Prep application and its standalone Vite project (development paused).

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
practice attempt. The lab also accepts a `?form=standard|factored|vertex` query
parameter to preselect a form on load (used by the skill links on the main site). Standard and vertex forms use a five-row table; factored form
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

The equation-from-a-graph lab uses eight integer-root graphs. Each marks the
vertex, points one unit to either side, and both x- and y-intercepts. Coincident
points share a marker. The larger graph has no visible point labels or coordinate
list; students read the grid. A screen-reader description retains point details.
Incorrect a-values reveal a vertical arrow from the vertex by signed a and a
one-unit horizontal arrow to the neighboring point. Students enter vertex form, factored
form, three box-method products, combined terms inside parentheses, and finally
standard form after distributing a. Root order can be reversed; the box uses
the student's accepted factor order, displayed with simplified plus/minus signs
above the box. Linear box products accept terms such as
`-2x`, `x`, `-x`, or `0`; equation blanks take signed numeric coefficients.
Completing the lab shows confetti and a summary labeled Vertex Form, Factored
Form, and Standard Form. Starting another graph clears the celebration.
The lab reuses the quadratic grapher's model and base stylesheet, so both
applets must be served together.

```bash
node --test math-applets/quadratic-from-graph/model.test.mjs
```

The box-method factoring lab has two problem types: twenty expressions with
`a = 1` and sixteen with `a = 2–9` (two per leading coefficient).
The `a = 1` practice begins with
`x² - 5x - 14`. Students enter signed integers in the top and left blanks.
Difference-of-squares practice includes `x² - 9`, `x² - 16`, `x² - 25`,
`x² - 36`, `x² - 49`, and `x² - 100`; the center circle shows `0x` so the opposite
linear terms must cancel.
Regular quadratics are mixed among these examples, with constants ranging from
-100 to 100 and two zero-constant problems: `x² + 5x` and `x² - 6x`.
Constants in the 50-70 range include 56, -60, and 63.
The off-diagonal products update as they type. The bottom-right constant and
central middle-term circle independently turn green with a check or red with
an X for the product and sum conditions. Both conditions must match to unlock
two complete-factor inputs inside parentheses. Students type factors such as
`x+3` and `x-4` (or `x` for a zero constant), then submit. Only a correct
submission reveals the factored expression, confetti, and Next Example button.
Changing either box input clears the final answer. Reversed factor order, repeated factors,
zero constants, and a zero middle term are supported. Blank or invalid inputs
do not receive a correct/incorrect result. This applet also requires the
quadratic grapher's shared stylesheet, number parser, and confetti module.
For `a = 2–9`, students also enter positive integer coefficients on the row
and column x labels. The upper-left leading term gets its own product check as soon as both
x-coefficients are entered, without waiting for the constants. All four box
cells are square; the center circle's diameter is 90% of a cell's height.
The middle-term check adds the cross products, not just the constants.
All three conditions must match before students submit complete factors such
as `2x-5` and `3x+4`. Changing any box input clears the final answer;
switching problem type resets the example and all progress.

```bash
node --test math-applets/quadratic-factoring/model.test.mjs
```

The absolute value equation solver walks through three guided problems of the
form `a|bx + c| + d = e`; only the third uses a b-value other than 1, and every
problem has two distinct integer solutions. Students pick the correct next step
from multiple-choice questions (undo the constant, divide by a, then write two
equations equal to +m and −m) and the matching algebra appears below the
equation after each correct choice — the constant subtraction lines up under both
sides and the division appears as stacked fractions. The lab finishes with an
`x =` blank under each branch equation; both correct answers fire the shared
confetti. A dropdown on the equation card jumps among Guided Problems 1–3 and
Practice 1–3; the practice set gives no hints and accepts both solutions in
either order, and finishing the third guided problem offers a
try-on-your-own button. The applet reuses the quadratic grapher's stylesheet
and confetti module, so both applets must be served together.

```bash
node --test math-applets/absolute-value-equations/model.test.mjs
```

The characteristics labs (absolute value and quadratic) share one codebase in
`math-applets/absolute-value-features/`; the quadratic page sets
`data-family="quadratic"` and reuses the stylesheet, app, and model from the
absolute value folder. Each lab offers five graphs of `y = a·g(x − h) + k` with
integer vertex and intercepts, including one example with the vertex on the
x-axis and one with no x-intercepts. Eight questions appear one at a time as
each is answered: domain true/false, range with a four-way inequality dropdown
(>, ≥, <, ≤), line of symmetry, vertex, max/min extremum sentence,
x-intercepts, y-intercept, and the graphers' end-behavior selects. A correct
answer keeps the entered result visible but removes the check button and
feedback. When a graph has fewer than two x-intercepts, the x-intercept
question first asks for the count — zero ends with "Correct, there are none."
and one reveals a single ordered-pair blank. Completing all eight questions
fires the shared confetti.

```bash
node --test math-applets/absolute-value-features/model.test.mjs
```

The transformation labs (generic function, absolute value, and quadratic) share
one codebase in `math-applets/function-transformations/`; the other two pages
set `data-family` and reuse its stylesheet, app, and model. Each lab shows four
examples of `a·g(x − h) + k` mixing positive and negative values, with and
without reflections and dilations. Students first check all transformations
that apply from six options (horizontal/vertical reflect, dilate, and shift),
then describe each one: a vertical reflection is listed as a given, the
vertical dilation factor is typed, and the shifts use right/left and up/down
dropdowns with positive amounts. A correct description fires the shared
confetti with a Next Example button.

```bash
node --test math-applets/function-transformations/model.test.mjs
```

## SAT Math Prep

Development of the SAT Math Prep app is currently paused. It lives in
`sat-math-prep/` as a standalone subproject; run it locally from its directory:

```bash
cd sat-math-prep
npm install
npm run dev
```

GitHub Pages assembles the main site, math applets, and SAT Math Prep project
using `.github/workflows/deploy-pages.yml`. The site deploys from the
`mrwernke/main` repository, so everything is served under the `/main/` base
path with `main-site/index.html` at the root. The quadratic lab's HTML, CSS,
and JavaScript files are included in that deployment.
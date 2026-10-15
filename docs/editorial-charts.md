# Editorial charts

Editorial charts are shared Portable Text blocks for News articles and Public
Information Guides. Each language version stores its own labels, explanation,
values, and source. Charts are generated as static HTML and SVG; they do not
load a charting library or require JavaScript.

## Choosing a chart

- **Vertical bar:** compare values across a modest number of categories when
  labels are short.
- **Horizontal bar:** compare categories with longer Nepali or Norwegian
  labels.
- **Grouped bar:** compare multiple series side by side for each category.
- **Stacked bar:** show how positive and negative parts contribute to a total
  in each category. Positive and negative values stack from zero in opposite
  directions.
- **Line:** show change across ordered categories, especially time periods.
- **Area:** show composition changing across ordered categories. Multiple
  series use stacked positive and negative areas so their fills do not obscure
  one another.
- **Donut or pie:** show a limited part-to-whole comparison. Prefer no more
  than six segments; eight is the maximum. Use another chart type when there
  are many small segments or values are close together.

## Entering categories and series

Categories are entered in editorial order; that order is preserved in the
chart and data table. Add one series per measure or comparison group. Each
series has a label and one numeric value for each category. For example, a
grouped comparison of 2024 and 2025 uses two categories and two series, each
with two values.

Pie and donut charts use the same stored fields: category labels become slice
labels, and one series contains the values. Use exactly one series, at least
two positive segments, and no negative values. Percentages are calculated from
the values automatically. Do not enter percentage values separately.

The Studio enforces matching category/value counts, finite numbers, unique
labels, a maximum of 24 Cartesian categories, a maximum of five series, and
chart-specific pie/donut restrictions. It warns about long labels, more than
four series, more than 12 bar categories, and more than six pie/donut segments.
Long labels are accepted but should be checked at mobile widths.

## Units, precision, and source

Use a controlled unit where possible (NOK, million NOK, billion NOK, percent,
people, days, or hours). Select the custom-unit option for another short unit.
Decimal precision is limited to zero through three places. The chart uses the
content page language for number formatting: Nepali pages use `ne-NP` and
Norwegian pages use `nb-NO`. The site’s existing number policy is otherwise
unchanged.

Use a short value prefix or suffix only when it improves clarity and does not
duplicate the unit. When the unit is percent, do not put `%` in the value
suffix; the Studio rejects it and the renderer drops it, so output can never
read "12% prosent". Choosing the custom unit requires a custom-unit text.
Pie and donut charts show calculated percentages unless “show percentages” is
explicitly switched off; it has no effect on other chart types. Cite the source label and, when available, an HTTPS source
URL and source date. Use the note for methodological context or qualifications.

## Mobile readability and accessibility

Keep the number of categories and series modest. The renderer draws two
server-side layouts for every bar, line and area chart and CSS picks one from
the width of the chart container (no JavaScript, no hydration): a compact layout
(container under 35rem) and a wide layout. The thresholds live in
`CHART_LAYOUTS` in `src/lib/editorialChart/geometry.ts` and depend on the chart
type, category count, series count, longest category label and layout width.

- Horizontal bars never scroll sideways. The label column is capped
  (132 units compact, 260 wide), labels wrap, and the plot gets the rest; the
  chart grows taller instead of wider.
- Vertical, grouped and stacked bars, and line and area charts, fit the compact
  layout when every category gets a minimum slot (bars 40 units, grouped bars
  16 per series, line points 44 apart) and its wrapped labels fit.
- Datasets that cannot meet those minimums (for example 20+ categories or five
  grouped series) scroll inside their own focusable container with edge shadows
  and a short hint. The page itself never scrolls horizontally.
- The height under the x-axis follows the number of label lines actually needed.

The chart title, summary, unit line, legend and complete data table remain
available at every viewport. The unit (and, for a single-series chart, the
series name) is shown once under the title instead of on every tick.

Legend rules: pie and donut charts show their legend unless “Show legend” is
switched off. Single-series bar, line and area charts hide it automatically.
Charts with several series always show the series key, whatever “Show legend”
says, so the graphic is never understandable only through the table. A true zero
draws no bar or slice but is still labelled and listed in the table.

The static graphic is accompanied by a keyboard-operable data-table disclosure
that includes all categories, series, values, units, and (where enabled)
calculated percentages. The table and visual use the same normalized values.
The data table works with JavaScript disabled. In print the table is always
output, even when the disclosure is closed: browsers that support
`::details-content` render the closed content, and others hide the disclosure
and print a dedicated copy. These rules are scoped to `.editorial-chart__data`
and do not touch other `<details>` elements.
The chart title is styled text inside the figure, not a heading, because the
block cannot know the surrounding heading level. Series are labelled in text
and use a controlled palette plus distinct fill patterns, dash styles and
numbered pie/donut slices. Patterns and dashes follow the series position, not
the chosen colour, so changing a colour never changes the identifier. Colour is
not the only means of identification.
Chart element ids come from the Sanity `_key`, or a stable content hash when
no key exists, so static output is identical between builds. If the visual
cannot be drawn, it is omitted and the summary and full data table remain. The
graphic has no animation or hover-only values.

Review the chart at a narrow mobile width and confirm that labels are not
confusing or obscured. If a comparison cannot be understood without shrinking
text or relying on color, simplify the chart or provide a clearer textual
explanation.

## Adding another chart type

Keep `categories + series.values` as the shared persisted model whenever the
new type can represent those relationships. Add the controlled chart type and
its validation rules in `sanity/schemaTypes/editorialChart.ts`; add any safe
compatibility checks in `src/lib/editorialChart/normalize.ts`; implement
geometry in `src/lib/editorialChart/geometry.ts`; and update the shared Astro
renderer and chart tests. Preserve the HTML table fallback and add tests for
the new type’s value constraints, geometry, and accessible output. Do not
persist library-specific properties.

## Rollout and rollback

Deploy the chart-capable frontend before enabling chart authoring in the
Sanity Studio. Verify each type in the Studio object editor and confirm the
deployed frontend can render it with controlled editorial content before
publishing. Do not activate or alter
Norwegian Guide routes as part of chart rollout.

For rollback, first stop editors from adding new chart blocks. Keep the
chart-compatible frontend deployed while charts remain published. If the
frontend must be rolled back to a version that does not know this object type,
remove or replace published chart blocks before that rollback; otherwise
Portable Text content may not render correctly in the older frontend. No
content migration is part of this feature.

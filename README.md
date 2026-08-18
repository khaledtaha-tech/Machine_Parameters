# Pipe & Fittings Process Control V2
Static HTML/CSS/JavaScript app for pipe extrusion and fitting injection operating conditions and before/after trials.

## Render
- Service type: Static Site
- Build command: leave blank
- Publish directory: the folder containing `index.html`

## V2 changes
- Standard templates automatically load temperatures, machine speed, pressure, output, dimensions and injection/extrusion conditions.
- Additional trial metadata: color, cavities, batches, preparing/mixing/pelletizing dates.
- Local browser storage; backend can be added later.

## Excel import

Starting a new record now uses a three-step guided flow: choose **Normal Operation or Trial**, choose **Pipes or Fittings**, then select the Excel workbook or continue with manual entry.

The interface includes built-in **Dark** and **Light** Cobalt & Amber themes. The selected theme is remembered automatically in the browser.
- Every saved record includes **Print / PDF** actions. The generated A4 engineering report contains metadata, grouped parameters, before/after differences, the adopted production rate, observations and conclusion. Choose **Save as PDF** in the browser print dialog.
- Choose **Operating Conditions** or **Trial / Before & After**.
- Choose **Pipe** or **Fittings**, then press **Import from Excel**.
- The importer reads the matching `Pipes` or `Fittings` sheet, validates the approved six-column template, and shows a preview before changing the form.
- `Information` values are shown once, `Comparison` values use Normal/Before and Trial/After, and `Calculated` values are recalculated by the application.
- For pipes, output is calculated from cycle time and haul-off speed. When both methods are available, the user must choose which result to adopt.
- Importing never saves a record automatically. Review the populated form and press **Save Record**.

The Excel reader is included locally in `vendor/xlsx.full.min.js`; no build step is required.

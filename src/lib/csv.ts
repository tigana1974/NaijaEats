/** Shared CSV export helpers used across the admin app. */

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = typeof v === "object" ? JSON.stringify(v) : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
}

/**
 * Build a CSV from rows and trigger a browser download.
 * `columns` maps CSV header → row key (or accessor fn). If omitted, the keys
 * of the first row are used.
 */
export function exportCsv<T extends Record<string, any>>(
  filename: string,
  rows: T[],
  columns?: Record<string, keyof T | ((row: T) => unknown)>,
) {
  if (!rows.length) {
    downloadTextFile(filename, "No data\n", "text/csv");
    return;
  }
  const cols =
    columns ??
    (Object.fromEntries(Object.keys(rows[0]).map((k) => [k, k])) as Record<
      string,
      keyof T | ((row: T) => unknown)
    >);
  const headers = Object.keys(cols);
  const lines = [headers.map(csvEscape).join(",")];
  for (const row of rows) {
    lines.push(
      headers
        .map((h) => {
          const acc = cols[h];
          return csvEscape(typeof acc === "function" ? acc(row) : row[acc]);
        })
        .join(","),
    );
  }
  downloadTextFile(filename, lines.join("\r\n") + "\r\n", "text/csv");
}

export function downloadTextFile(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Open a print-friendly window with the given HTML body and trigger the
 * browser print dialog (users can "Save as PDF"). Returns false if the popup
 * was blocked.
 */
export function printHtml(title: string, bodyHtml: string): boolean {
  const w = window.open("", "_blank", "noopener,width=900,height=700");
  if (!w) return false;
  w.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
  body { font-family: -apple-system, "Segoe UI", Roboto, sans-serif; color: #111; margin: 32px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  h2 { font-size: 14px; margin: 24px 0 8px; }
  .muted { color: #666; font-size: 12px; }
  table { border-collapse: collapse; width: 100%; margin-top: 12px; font-size: 12.5px; }
  th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
  th { background: #f6f6f6; text-transform: uppercase; font-size: 10.5px; letter-spacing: 0.04em; }
  tr:nth-child(even) td { background: #fafafa; }
  .right { text-align: right; }
  @media print { body { margin: 12mm; } }
</style>
</head>
<body>${bodyHtml}</body>
</html>`);
  w.document.close();
  w.focus();
  // Give the window a tick to layout before printing.
  setTimeout(() => w.print(), 250);
  return true;
}

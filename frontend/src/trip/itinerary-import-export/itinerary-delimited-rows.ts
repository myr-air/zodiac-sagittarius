export function parseDelimitedRows(source: string, delimiter: "," | "\t"): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const text = source.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (inQuotes) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"' && cell.trim() === "") {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (inQuotes) throw new Error("CSV import has an unterminated quoted cell.");
  row.push(cell);
  rows.push(row);
  return rows;
}

export function detectDelimiter(source: string): "," | "\t" {
  const lines = source.split(/\r?\n/).slice(0, 12);
  const tabCount = lines.reduce(
    (total, line) => total + (line.match(/\t/g)?.length ?? 0),
    0,
  );
  const commaCount = lines.reduce(
    (total, line) => total + (line.match(/,/g)?.length ?? 0),
    0,
  );
  return tabCount > commaCount ? "\t" : ",";
}

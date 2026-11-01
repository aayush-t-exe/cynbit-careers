// A minimal one-page PDF writer (Helvetica, real text layer), so sample résumés
// and tests don't need a PDF library. Lines starting with "# " print as headings.
export function makePdf(lines: string[]): Uint8Array {
  // PDF strings escape backslash and parentheses with a backslash.
  const backslash = String.fromCharCode(92);
  const escape = (text: string) =>
    [...text.normalize("NFKD")]
      .filter((char) => char.charCodeAt(0) >= 32 && char.charCodeAt(0) <= 126)
      .map((char) => (char === backslash || char === "(" || char === ")" ? backslash + char : char))
      .join("");

  let y = 800;
  const ops: string[] = ["BT"];
  for (const line of lines) {
    const heading = line.startsWith("# ");
    const size = heading ? 13 : 10.5;
    y -= heading ? 22 : 15;
    ops.push(`/${heading ? "F2" : "F1"} ${size} Tf 1 0 0 1 56 ${y} Tm (${escape(heading ? line.slice(2) : line)}) Tj`);
  }
  ops.push("ET");
  const stream = ops.join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];

  let body = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(body));
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(body);
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  body += offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new Uint8Array(Buffer.from(body, "latin1"));
}

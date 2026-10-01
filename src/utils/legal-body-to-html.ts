function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Zamienia adresy e-mail w tekscie na linki mailto.
 * Why: tresci prawne (polityka, regulamin) zawieraja {{COMPANY_EMAIL}},
 * a escapeHtml nie moze zamienic maila na link samodzielnie — inaczej adres
 * zostaje golym tekstem, zamiast klikalnym odnosnikiem.
 */
function linkifyEmails(text: string): string {
  return text.replace(
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    (match) => `<a href="mailto:${match}">${match}</a>`,
  );
}

/**
 * Turns simple legal document text into HTML: intro paragraphs, then blocks
 * starting with "## " become h2 + following paragraph(s). Matches Keystatic/mdoc style.
 */
export function legalBodyToHtml(md: string): string {
  const chunks = md.trim().split(/\n(?=## )/);
  let html = "";
  for (const chunk of chunks) {
    const t = chunk.trim();
    if (!t) continue;
    if (t.startsWith("## ")) {
      const nl = t.indexOf("\n");
      const heading = (nl === -1 ? t.slice(3) : t.slice(3, nl)).trim();
      const rest = nl === -1 ? "" : t.slice(nl + 1).trim();
      const id = slugifyHeading(heading);
      html += `<section id="${escapeHtml(id)}"><h2>${escapeHtml(heading)}</h2>`;
      if (rest) {
        for (const para of rest
          .split(/\n\n+/)
          .map((p) => p.trim())
          .filter(Boolean)) {
          html += `<p>${linkifyEmails(escapeHtml(para))}</p>`;
        }
      }
      html += `</section>`;
    } else {
      for (const para of t
        .split(/\n\n+/)
        .map((p) => p.trim())
        .filter(Boolean)) {
        html += `<p>${linkifyEmails(escapeHtml(para))}</p>`;
      }
    }
  }
  return html;
}

function slugifyHeading(heading: string): string {
  return heading
    .replace(/^\d+\.\s*/, "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "");
}

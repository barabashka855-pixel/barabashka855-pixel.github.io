/** @param {string} value */
function normalizeText(value) { return value.normalize("NFKC").toLocaleLowerCase("ru").replaceAll("ё", "е").replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").trim(); }
/** @param {unknown} value */
export function normalizeQuery(value) {
  const raw = Array.isArray(value) ? value.find(v => typeof v === "string") : value;
  return typeof raw === "string" ? normalizeText(raw.slice(0, 200)) : "";
}
const stopwords = new Set(["как", "что", "и", "или", "в", "во", "на", "от", "с", "со", "у", "для", "по", "не", "ли"]);
/** @param {string} value */
function words(value) { return normalizeText(value).split(" ").filter(w => w && !stopwords.has(w)); }
/** @param {string} word */
function stem(word) { return word.length > 5 ? word.replace(/(ами|ями|ого|ему|ыми|ими|ов|ев|ам|ям|ах|ях|ый|ий|ая|ое|ые|ие|а|я|ы|и|у|ю|е|о)$/u, "") : word; }
/** @param {Array<{title:string,description:string,url:string,navTitle?:string,aliases?:string[],summary?:string[],sections:Array<{title:string,text:string,points?:string[],table?:{rows:string[][]}}>}>} articles */
export function searchDocuments(articles) {
  return articles.map(a => ({ title: a.title, text: a.description, href: a.url,
    labels: [a.title, a.navTitle, ...(a.aliases ?? [])].filter(Boolean).join(" "),
    body: [...(a.summary ?? []), ...a.sections.flatMap(s => [s.title, s.text, ...(s.points ?? []), ...(s.table?.rows.flat() ?? [])])].join(" ") }));
}
/** @param {ReturnType<typeof searchDocuments>} pages @param {unknown} query */
export function findResults(pages, query) {
  const q = normalizeQuery(query); const terms = words(q).map(stem);
  if (!terms.length) return [];
  return pages.map(page => {
    const labels = normalizeText(page.labels); const body = normalizeText(page.body);
    const tokens = words(labels + " " + body).map(stem);
    const matches = terms.every(term => tokens.some(token => token === term || (term.length >= 4 && token.startsWith(term))));
    if (!matches && !labels.includes(q) && !body.includes(q)) return { page, score: 0 };
    return { page, score: 1 + (labels.includes(q) ? 12 : 0) + (body.includes(q) ? 3 : 0) + terms.filter(term => words(labels).map(stem).includes(term)).length * 2 };
  }).filter(x => x.score > 0).sort((a,b) => b.score - a.score).map(x => x.page);
}

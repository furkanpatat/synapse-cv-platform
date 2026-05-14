/**
 * Web Speech API's tr-TR mode transcribes English technical terms
 * phonetically — "React" becomes "riakt", "Kubernetes" becomes "kıbırnitis",
 * etc. This module normalises the most common mishearings back to their
 * canonical English form so the AI evaluator and the on-screen caption
 * both look professional.
 *
 * We deliberately keep the mapping conservative: only replace whole-word
 * matches (with Turkish suffix tolerance) so we don't accidentally mangle
 * legitimate Turkish words.
 */

// Common Web-Speech tr-TR mishearings → canonical term.
// Add entries as you encounter them in real use.
const TECH_NORMALISATIONS: Array<[RegExp, string]> = [
  // Frontend
  [/\briak?t?\b/giu, "React"],
  [/\bri[ae]ct\b/giu, "React"],
  [/\bvi[ou]\b/giu, "Vue"],
  [/\banguler\b/giu, "Angular"],
  [/\beng[uı]ler\b/giu, "Angular"],
  [/\bne[xks]t\s*c[ie]y[sc]\b/giu, "Next.js"],
  [/\bsv[ae]lt\b/giu, "Svelte"],
  [/\btay[lp]e\s*sk?ript\b/giu, "TypeScript"],
  [/\bcav[ae]\s*sk?ript\b/giu, "JavaScript"],
  [/\bcss\b/giu, "CSS"],
  [/\bhtml\b/giu, "HTML"],
  [/\btayl[uı]ind\b/giu, "Tailwind"],

  // Backend
  [/\bcav[ae]\b/giu, "Java"],
  [/\bspr?ing\s*b[uo]ot\b/giu, "Spring Boot"],
  [/\bp[aı]yt?on\b/giu, "Python"],
  [/\bdjang[oö]\b/giu, "Django"],
  [/\bfl[ae]sk?\b/giu, "Flask"],
  [/\bf[ae]st[ae]p[iı]\b/giu, "FastAPI"],
  [/\bn[ou]d\s*c[ie]y[sc]\b/giu, "Node.js"],
  [/\bgolan\b/giu, "Go"],
  [/\br[au]st\b/giu, "Rust"],
  [/\bk[ou]?tl[iı]n\b/giu, "Kotlin"],

  // Data / infra
  [/\bp[oö]stgr[ie][sz]?\b/giu, "PostgreSQL"],
  [/\bm[ai]y\s*ess?\s*ku\s*el\b/giu, "MySQL"],
  [/\bmong[oö](\s*d[bi])?\b/giu, "MongoDB"],
  [/\bredd?[iı]s\b/giu, "Redis"],
  [/\b[ek]l[ae]st[iı]k(?:\s*s[ie]r?[cç])?\b/giu, "Elasticsearch"],
  [/\brab+[iı]t\s*m[ae]ku\b/giu, "RabbitMQ"],
  [/\bk[ae]fk[ae]\b/giu, "Kafka"],
  [/\bd[oö]k[ie]r\b/giu, "Docker"],
  [/\bk[uı]bı?rn[ie]t[ie]s\b/giu, "Kubernetes"],
  [/\bk[uı]bı?rn[ie]t[iı]z\b/giu, "Kubernetes"],
  [/\bsp[ae]rk?\b/giu, "Spark"],
  [/\b[ae]y[rw]e?\s*fl[ou]\b/giu, "Airflow"],

  // Cloud
  [/\b[ae]y\s*d[ou]bl?(?:y[uı])?\s*e[sz]\b/giu, "AWS"],
  [/\bgc?p?\b/giu, "GCP"],
  [/\b[ae]j[uı]r\b/giu, "Azure"],

  // AI / ML
  [/\bp[aı]y\s*t[oö]rç?\b/giu, "PyTorch"],
  [/\bt[ie]nsr?[ou]\s*fl?[ou]\b/giu, "TensorFlow"],
  [/\bgemin[iı]\b/giu, "Gemini"],
  [/\b[oö]\s*pn?\s*[ae][yi]\b/giu, "OpenAI"],
  [/\bllm\b/giu, "LLM"],
  [/\b[ae]p[iı]\b/giu, "API"],

  // Concepts
  [/\bgr[ae]f\s*kı?[uı]\s*el\b/giu, "GraphQL"],
  [/\bce\s*es[oö]n\b/giu, "JSON"],
  [/\bre?st\s*fu?l\b/giu, "REST"],
  [/\bs[oö]l[iı]d\b/giu, "SOLID"],
  [/\bd[ie]vop[sz]\b/giu, "DevOps"],
  [/\bs[ei]r?\s*v[ie]r\s*l[ie]s\b/giu, "serverless"],
  [/\bm[iı]kr[ou]\s*serv[iı]s\b/giu, "mikroservis"],
];

/**
 * Normalise a transcript chunk — fixes common Web Speech tr-TR mishearings
 * of English technical terms. Pure function, safe to call on every interim
 * caption update.
 */
export function normaliseTechTerms(text: string): string {
  if (!text) return text;
  let out = text;
  for (const [pattern, replacement] of TECH_NORMALISATIONS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

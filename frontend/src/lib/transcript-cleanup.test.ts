import { describe, expect, it } from "vitest";

import { normaliseTechTerms } from "./transcript-cleanup";

/**
 * Web Speech tr-TR transcribes English tech terms phonetically; we map
 * the worst offenders back so the AI grader (and the on-screen caption)
 * see professional spellings.
 *
 * If a regression silently drops one of these mappings, the AI judge
 * will start docking points for "low technical vocabulary" against
 * candidates who actually said the right thing. So the matrix is small
 * but high-impact.
 */
describe("normaliseTechTerms", () => {
  it("returns empty/whitespace input unchanged", () => {
    expect(normaliseTechTerms("")).toBe("");
    expect(normaliseTechTerms("   ")).toBe("   ");
  });

  it("maps the most common Web Speech mishearings to canonical names", () => {
    // Each input is what Web Speech tr-TR actually produces for the
    // intended technical term, matched against the regex dictionary in
    // transcript-cleanup.ts. Adding a new mapping there must come with
    // a new line here.
    const cases: Array<[string, string]> = [
      // Frontend
      ["riak projesi yazdım", "React projesi yazdım"],
      ["taype skript kullanırım", "TypeScript kullanırım"],
      // Backend
      ["payton ile fastapi", "Python ile FastAPI"],
      // Infra
      ["doker içinde kıbırnitis", "Docker içinde Kubernetes"],
      ["postgre ve mongo", "PostgreSQL ve MongoDB"],
    ];
    for (const [input, expected] of cases) {
      expect(normaliseTechTerms(input)).toBe(expected);
    }
  });

  it("preserves punctuation and surrounding text", () => {
    const before = "React, TypeScript ve Docker konusunda 3 yıllık deneyim.";
    expect(normaliseTechTerms(before)).toBe(before); // already canonical
  });

  it("is case-insensitive on the input but emits canonical capitalisation", () => {
    expect(normaliseTechTerms("RIAKT öğrendim")).toBe("React öğrendim");
    // The dictionary targets Web-Speech mishearings, NOT the canonical
    // spellings themselves — "payton" is what tr-TR STT produces for
    // "Python", whereas a literal "python" would already be canonical.
    expect(normaliseTechTerms("PAYTON ve postgre")).toBe("Python ve PostgreSQL");
  });
});

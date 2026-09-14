/**
 * 귀인사주 v2 해석 Quality Gate
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.GuiinQualityGate = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  const VERSION = "2.0.0";

  function countDeclaredMismatch(text) {
    const s = String(text || "");
    const declared = [
      ["한 가지",1],["두 가지",2],["세 가지",3],["네 가지",4],["다섯 가지",5]
    ].find(([label]) => s.includes(label));
    if (!declared) return null;
    const numbered = [...s.matchAll(/(?:^|\n)\s*(\d+)[.)]\s+/g)].map(m => Number(m[1]));
    const circled = (s.match(/[①②③④⑤⑥⑦⑧⑨⑩]/g) || []).length;
    const observed = numbered.length ? Math.max(...numbered) : circled;
    if (!observed || observed === declared[1]) return null;
    return { declared: declared[1], observed };
  }

  function repeatedParagraphs(text) {
    const rows = String(text || "").split(/\n{2,}/)
      .map(x => x.replace(/\s+/g, " ").trim()).filter(x => x.length >= 35);
    const seen = new Set(), dup = [];
    for (const row of rows) {
      const key = row.toLowerCase();
      if (seen.has(key)) dup.push(row);
      seen.add(key);
    }
    return dup;
  }

  function validatePlainText(text) {
    const errors = [], warnings = [];
    const s = String(text || "").trim();
    if (!s) errors.push("empty_answer");
    if (s.length < 30) warnings.push("answer_too_short");
    if (/^#{1,6}\s/m.test(s) || /\*\*[^*]+\*\*/.test(s) || /__[^_]+__/.test(s)) warnings.push("markdown_symbols_present");
    if (/무조건\s*(이혼|파산|사고|수술|죽|망)/.test(s) ||
        /(반드시|확실히)\s*(이혼|파산|사고|수술|실패|합격|결혼)/.test(s)) {
      errors.push("deterministic_fear_claim");
    }
    if (/(암|우울증|조현병|불임|심장병|당뇨)\s*(이다|입니다|걸린다|걸립니다|확정)/.test(s)) {
      errors.push("medical_diagnosis_claim");
    }
    const mismatch = countDeclaredMismatch(s);
    if (mismatch) errors.push(`item_count_mismatch:${mismatch.declared}:${mismatch.observed}`);
    const repeated = repeatedParagraphs(s);
    if (repeated.length) warnings.push(`repeated_paragraphs:${repeated.length}`);
    return { ok: errors.length === 0, errors, warnings };
  }

  function validateStructuredReport(report) {
    const errors = [], warnings = [];
    if (!report || typeof report !== "object") return { ok:false, errors:["report_required"], warnings };
    if (!Array.isArray(report.sections) || !report.sections.length) errors.push("sections_required");
    else report.sections.forEach((section,i) => {
      if (!section?.title) errors.push(`section_${i}_title_required`);
      if (!section?.body) errors.push(`section_${i}_body_required`);
      const q = validatePlainText(section?.body);
      q.errors.forEach(x => errors.push(`section_${i}:${x}`));
      q.warnings.forEach(x => warnings.push(`section_${i}:${x}`));
      if (!Array.isArray(section?.evidence) || !section.evidence.length) warnings.push(`section_${i}:evidence_missing`);
    });
    return { ok: errors.length === 0, errors, warnings };
  }

  return { VERSION, validatePlainText, validateStructuredReport, countDeclaredMismatch, repeatedParagraphs };
});

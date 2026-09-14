/**
 * 귀인사주 Engine v2 안전 패치
 *
 * 역할
 * 1) 기존 saju-engine.js의 계산식을 다시 작성하지 않고 결과/메타데이터만 보강
 * 2) 엔진 버전 단일화
 * 3) 대운 구간을 [시작, 다음 시작) 반열린구간으로 통일
 * 4) 출생시간 미상일 때 일주/월주/연주/대운 시작나이의 가능한 범위를 표시
 * 5) 절입 경계에서 외부 정밀 역서 검증이 필요한 경우를 명시
 *
 * 브라우저: saju-engine.js 다음에 로드
 * Node: require("./saju-engine-v2-patch.js") 하면 기존 엔진을 보강한 객체 반환
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./saju-engine.js"));
  } else {
    root.GuiinSaju = factory(root.GuiinSaju);
  }
})(typeof self !== "undefined" ? self : this, function (S) {
  "use strict";

  if (!S || typeof S.calculate !== "function") {
    throw new Error("GuiinSaju core engine must be loaded before saju-engine-v2-patch.js");
  }

  if (S.__GUIIN_ENGINE_V2_PATCHED__) return S;

  const ENGINE_VERSION = "6.1.0-master-v2";
  const RULE_VERSION = "2026-09-14-v2";
  const originalCalculate = S.calculate.bind(S);
  const originalBoundaryDiagnostics =
    typeof S.boundaryDiagnostics === "function" ? S.boundaryDiagnostics.bind(S) : null;

  function plain(v) {
    if (v == null) return v;
    return JSON.parse(JSON.stringify(v));
  }

  function finite(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  function pillarKo(p) {
    if (!p) return null;
    return p.ko || `${p.stem || ""}${p.branch || ""}` || null;
  }

  function unique(arr) {
    return [...new Set(arr.filter(Boolean))];
  }

  function currentLuckAtAge(luckRows, ageExact) {
    const age = finite(ageExact);
    if (!Array.isArray(luckRows) || age == null) return null;

    for (let i = 0; i < luckRows.length; i++) {
      const row = luckRows[i];
      const start = finite(row?.fromAgeExact ?? row?.fromAge);
      const nextStart = finite(luckRows[i + 1]?.fromAgeExact ?? luckRows[i + 1]?.fromAge);
      const legacyEnd = finite(row?.toAgeExact ?? row?.toAge);
      const end = nextStart != null ? nextStart : legacyEnd;

      if (start == null || end == null) continue;
      if (age >= start && age < end) return plain(row);
    }
    return null;
  }

  function modernKstMs(input, hour, minute) {
    return Date.UTC(
      Number(input.year),
      Number(input.month) - 1,
      Number(input.day),
      Number(hour) || 0,
      Number(minute) || 0
    ) - 9 * 3600000;
  }

  function nearestSolarTerm(input, hour, minute) {
    if (typeof S.solarTermMs !== "function") return null;

    const year = Number(input.year);
    if (!Number.isFinite(year)) return null;

    const t = modernKstMs(input, hour, minute);
    let best = null;

    for (let y = year - 1; y <= year + 1; y++) {
      for (let n = 0; n < 24; n++) {
        const ms = S.solarTermMs(y, n);
        const distanceMinutes = Math.abs(t - ms) / 60000;
        if (!best || distanceMinutes < best.distanceMinutes) {
          best = {
            year: y,
            index: n,
            name: Array.isArray(S.SOLAR_TERM_NAMES) ? S.SOLAR_TERM_NAMES[n] : null,
            utcMs: ms,
            distanceMinutes
          };
        }
      }
    }

    return best;
  }

  function timeUnknownCandidates(input) {
    if (!input?.hourUnknown) return null;

    // 하루 중 여러 시점을 표본으로 계산해 "정오를 확정 출생시간처럼 사용"하지 않게 한다.
    // 절입이 새벽/오전/오후/야간에 있는 경우와 23시 일주경계를 모두 잡기 위한 표본.
    const samples = [
      [0, 0],
      [3, 0],
      [6, 0],
      [9, 0],
      [12, 0],
      [15, 0],
      [18, 0],
      [21, 0],
      [22, 59],
      [23, 0],
      [23, 59]
    ];

    const rows = [];
    for (const [hour, minute] of samples) {
      try {
        const c = originalCalculate({
          ...input,
          hourUnknown: false,
          hour,
          minute,
          // 시간 자체를 모르므로 진태양시 보정을 임의의 가짜 시간에 적용하지 않는다.
          trueSolarApply: false
        });

        rows.push({
          hour,
          minute,
          pillars: {
            year: pillarKo(c?.pillars?.year),
            month: pillarKo(c?.pillars?.month),
            day: pillarKo(c?.pillars?.day)
          },
          startAgeExact: finite(c?.startAgeExact)
        });
      } catch (_) {
        // 일부 표본 실패가 전체 명식 계산을 깨뜨리지 않도록 제외
      }
    }

    const startAges = rows.map(x => x.startAgeExact).filter(Number.isFinite);
    const yearPillars = unique(rows.map(x => x.pillars.year));
    const monthPillars = unique(rows.map(x => x.pillars.month));
    const dayPillars = unique(rows.map(x => x.pillars.day));

    return {
      sampled_times: rows.map(x => ({
        hour: x.hour,
        minute: x.minute,
        year: x.pillars.year,
        month: x.pillars.month,
        day: x.pillars.day,
        startAgeExact: x.startAgeExact
      })),
      year_pillar_candidates: yearPillars,
      month_pillar_candidates: monthPillars,
      day_pillar_candidates: dayPillars,
      year_pillar_ambiguous: yearPillars.length > 1,
      month_pillar_ambiguous: monthPillars.length > 1,
      day_pillar_ambiguous: dayPillars.length > 1,
      daeun_start_age_range: startAges.length
        ? {
            min: Math.min(...startAges),
            max: Math.max(...startAges),
            spanYears: Math.max(...startAges) - Math.min(...startAges)
          }
        : null
    };
  }

  function buildPrecisionMeta(input) {
    const out = {
      timezone_model: "fixed-modern-kst",
      historical_timezone_verified: false,
      overseas_timezone_verified: false,
      solar_term_solver: "apparent-solar-longitude-approximate",
      solar_term_external_validation_required: false,
      nearest_solar_term: null
    };

    if (!input?.hourUnknown) {
      const near = nearestSolarTerm(input, Number(input.hour) || 0, Number(input.minute) || 0);
      if (near) {
        out.nearest_solar_term = {
          name: near.name,
          distanceMinutes: Math.round(near.distanceMinutes * 10) / 10
        };
        // 현재 공식 Golden audit에서 최대 13분 오차가 관찰됐으므로
        // 30분 이내는 유료 결과 확정 전 외부 정밀 역서 검증 대상으로 올린다.
        out.solar_term_external_validation_required = near.distanceMinutes <= 30;
      }
    }

    return out;
  }

  function enhancedBoundaryDiagnostics(input) {
    const base = originalBoundaryDiagnostics
      ? (originalBoundaryDiagnostics(input) || [])
      : [];

    const out = Array.isArray(base) ? base.map(x => ({ ...x })) : [];

    if (input?.hourUnknown) {
      if (!out.some(x => x?.type === "hour-unknown")) {
        out.push({
          type: "hour-unknown",
          level: "info",
          text: "출생시간 미상이라 시주와 시간 민감 해석을 확정하지 않습니다."
        });
      }
      out.push({
        type: "unknown-time-candidate-check",
        level: "info",
        text: "23시 일주 경계와 절입일 가능성을 포함해 하루의 후보 명식을 비교합니다."
      });
      return out;
    }

    const near = nearestSolarTerm(input, Number(input.hour) || 0, Number(input.minute) || 0);
    if (near && near.distanceMinutes <= 30) {
      out.push({
        type: "solar-term-precision-gate",
        level: "critical-check",
        minutes: Math.round(near.distanceMinutes),
        term: near.name,
        text: `${near.name || "절입"} 경계와 약 ${Math.round(near.distanceMinutes)}분 이내입니다. 현재 근사 절기시각만으로 유료 결과를 확정하지 말고 정밀 역서와 교차검증해야 합니다.`
      });
    }

    return out;
  }

  function patchedCalculate(input) {
    const sourceInput = { ...(input || {}) };
    const result = originalCalculate(input);

    const candidateInfo = timeUnknownCandidates(sourceInput);
    const precision = buildPrecisionMeta(sourceInput);
    const diagnostics = enhancedBoundaryDiagnostics(sourceInput);

    result.calculation = {
      ...(result.calculation || {}),
      engineVersion: ENGINE_VERSION,
      ruleVersion: RULE_VERSION,
      boundaryDiagnostics: diagnostics,
      precision
    };

    result.method = {
      ...(result.method || {}),
      engineVersion: ENGINE_VERSION,
      ruleVersion: RULE_VERSION
    };

    result.evidence = {
      ...(result.evidence || {}),
      engineVersion: ENGINE_VERSION,
      ruleVersion: RULE_VERSION
    };

    result.uncertainty = {
      ...(result.uncertainty || {}),
      birth_time_unknown: !!sourceInput.hourUnknown,
      hour_pillar: sourceInput.hourUnknown ? "unavailable" : "available",
      daeun_transition: sourceInput.hourUnknown ? "range" : "calculated",
      historical_timezone: "not_verified",
      overseas_timezone: "not_verified",
      solar_term_precision:
        precision.solar_term_external_validation_required ? "external_validation_required" : "approximate",
      unknown_time_candidates: candidateInfo
    };

    if (candidateInfo?.daeun_start_age_range) {
      result.startAgeExactRange = plain(candidateInfo.daeun_start_age_range);
    }

    return result;
  }

  S.calculate = patchedCalculate;
  S.boundaryDiagnostics = enhancedBoundaryDiagnostics;
  S.currentLuckAtAge = currentLuckAtAge;
  S.timeUnknownCandidates = timeUnknownCandidates;
  S.ENGINE_VERSION = ENGINE_VERSION;
  S.CALCULATION_RULE_VERSION = RULE_VERSION;
  S.__GUIIN_ENGINE_V2_PATCHED__ = true;

  const disclosure = Object.freeze({
    version: ENGINE_VERSION,
    ruleVersion: RULE_VERSION,
    pillars: "연주=입춘, 월주=절입, 일주 경계 선택형(23시/자정), 시주=일간×시지",
    solarTerms: "태양 겉보기 황경 근사 계산. 절입 30분 이내는 정밀 역서 외부검증 대상으로 표시",
    daeun: "순역행 기존 공식 유지. 대운 구간은 [시작, 다음 시작) 반열린구간 사용",
    unknownTime: "출생시간 미상은 정오 확정으로 취급하지 않고 후보 일주·월주·연주와 대운 시작나이 범위를 표시",
    timezone: "현재 핵심엔진의 역사적 timezone/DST 및 해외 IANA timezone은 아직 정밀검증 대상",
    elementDistribution: "지장간 가중 오행 분포이며 용신/실제 오행 강약과 동일하지 않음"
  });

  S.GUIIN_METHOD_DISCLOSURE_V2 = disclosure;

  try {
    if (typeof window !== "undefined") {
      window.GUIIN_METHOD_DISCLOSURE = disclosure;
      window.GUIIN_SAJU_ENGINE_VERSION = ENGINE_VERSION;
    }
  } catch (_) {}

  return S;
});

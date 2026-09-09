/**
 * 귀인사주 — 사주팔자 계산 엔진
 * 연주: 입춘 기준 / 월주: 절입 기준 / 일주: 율리우스일 / 시주: 야자시(23시부터 다음날 자시)
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.GuiinSaju = factory();
})(typeof self !== "undefined" ? self : this, function () {
  const STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
  const STEMS_H = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
  const BRANCHES_H = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const ANIMALS = ["쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양", "원숭이", "닭", "개", "돼지"];
  const STEM_EL = ["목", "목", "화", "화", "토", "토", "금", "금", "수", "수"];
  const BRANCH_EL = ["수", "토", "목", "목", "토", "화", "화", "토", "금", "금", "토", "수"];
  const STEM_YIN = [false, true, false, true, false, true, false, true, false, true];
  const EL_KO = { 목: "목(木)", 화: "화(火)", 토: "토(土)", 금: "금(金)", 수: "수(水)" };
  const EL_COLOR = { 목: "#2f7d4a", 화: "#c23b2e", 토: "#c4a035", 금: "#8a8f99", 수: "#2b6cb0" };

  const TEN_GODS = [
    "비견",
    "겁재",
    "식신",
    "상관",
    "편재",
    "정재",
    "편관",
    "정관",
    "편인",
    "정인",
  ];

  // 월주 천간: 연간에 따른 인월 시작 천간
  const MONTH_STEM_START = [2, 4, 6, 8, 0, 2, 4, 6, 8, 0]; // 甲己丙, 乙庚戊, 丙辛庚, 丁壬壬, 戊癸甲

  // 시주 천간: 일간에 따른 자시 시작 천간
  const HOUR_STEM_START = [0, 2, 4, 6, 8, 0, 2, 4, 6, 8];

  // 1900~2100 절입(절기 중 '절') 근사 — 입춘=0 … 소한 직전 소한은 별도
  // 각 연도 입춘부터 12절의 UTC ms는 계산식으로 구함
  function julianDay(y, m, d) {
    const a = Math.floor((14 - m) / 12);
    const yy = y + 4800 - a;
    const mm = m + 12 * a - 3;
    return (
      d +
      Math.floor((153 * mm + 2) / 5) +
      365 * yy +
      Math.floor(yy / 4) -
      Math.floor(yy / 100) +
      Math.floor(yy / 400) -
      32045
    );
  }

  function julianDayTime(y, m, d, h, mi) {
    return julianDay(y, m, d) + (h - 12) / 24 + mi / 1440;
  }

  // 절기 시각 (KST) — 1900년 소한을 기준으로 한 전통 근사식
  // n: 0=소한, 1=입춘, 2=경칩, ... 23=동지 다음 소한 직전 대한
  // 24절기 순서: 0소한 1대한 2입춘 3우수 4경칩 5춘분 6청명 7곡우
  // 8입하 9소만 10망종 11하지 12소서 13대서 14입추 15처서
  // 16백로 17추분 18한로 19상강 20입동 21소설 22대설 23동지
  function solarTermMs(year, n) {
    const termInfo = [
      0, 21208, 42467, 63836, 85337, 107014, 128867, 150921, 173149, 195551,
      218072, 240693, 263343, 285989, 308563, 331033, 353350, 375494, 397447,
      419210, 440795, 462224, 483532, 504758,
    ];
    return (
      Date.UTC(1900, 0, 6, 2, 5) +
      31556925974.7 * (year - 1900) +
      termInfo[n] * 60000
    );
  }

  // 입력은 한국시간(KST, UTC+9)
  function birthMsKst(y, m, d, h, mi) {
    return Date.UTC(y, m - 1, d, h, mi, 0) - 9 * 3600000;
  }

  function jieMonthAndYear(y, m, d, h, mi) {
    const t = birthMsKst(y, m, d, h, mi);
    const JIE = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];

    function monthStartMs(yearFor, monthIndex) {
      if (monthIndex <= 10) return solarTermMs(yearFor, 2 + monthIndex * 2);
      if (monthIndex === 11) return solarTermMs(yearFor + 1, 0);
      return solarTermMs(yearFor + 1, 2);
    }

    const lichunThis = solarTermMs(y, 2);
    const sohanThis = solarTermMs(y, 0);
    const yearForPillar = t >= lichunThis ? y : y - 1;
    let monthIndex = 11;
    for (let i = 0; i < 12; i++) {
      if (t >= monthStartMs(yearForPillar, i) && t < monthStartMs(yearForPillar, i + 1)) {
        monthIndex = i;
        break;
      }
    }

    return { yearForPillar, monthIndex, lichunThis, sohanThis };
  }

  function hourBranchIndex(h, mi) {
    // 23:00-00:59 자시(0), 01-02 축 … 21-22 해
    const minutes = h * 60 + mi;
    if (minutes >= 23 * 60 || minutes < 60) return 0;
    return Math.floor((minutes - 60) / 120) + 1;
  }

  function tenGod(dayStem, otherStem) {
    const dEl = STEM_EL[dayStem];
    const oEl = STEM_EL[otherStem];
    const samePolarity = STEM_YIN[dayStem] === STEM_YIN[otherStem];
    const cycle = ["목", "화", "토", "금", "수"];
    const di = cycle.indexOf(dEl);
    const oi = cycle.indexOf(oEl);
    const diff = (oi - di + 5) % 5;
    // 0 same el: 비견(same) 겁재(diff)
    // 1 I generate: 식신(same) 상관(diff)
    // 2 I generate2 / wealth: 편재(same yang pair?) 정재
    // Traditional: 생하는 것=식상, 극하는 것=재성, 극하는 것(내가 극함)=재, 극아=관, 생아=인
    let base;
    if (diff === 0) base = 0;
    else if (diff === 1) base = 2;
    else if (diff === 2) base = 4;
    else if (diff === 3) base = 6;
    else base = 8;
    // 음양이 같으면 편(비견/식신/편재/편관/편인), 다르면 정(겁재? wait)
    // 비견 = same element + same yin/yang
    // 겁재 = same element + opposite
    // 식신 = I generate + same
    // 상관 = I generate + opposite
    // 편재 = I conquer + same
    // 정재 = I conquer + opposite
    // 편관 = conquers me + same
    // 정관 = conquers me + opposite
    // 편인 = generates me + same
    // 정인 = generates me + opposite
    return TEN_GODS[base + (samePolarity ? 0 : 1)];
  }

  function pillarName(si, bi) {
    return {
      ko: STEMS[si] + BRANCHES[bi],
      hanja: STEMS_H[si] + BRANCHES_H[bi],
      stem: STEMS[si],
      stemH: STEMS_H[si],
      branch: BRANCHES[bi],
      branchH: BRANCHES_H[bi],
      stemIndex: si,
      branchIndex: bi,
      stemEl: STEM_EL[si],
      branchEl: BRANCH_EL[bi],
      animal: ANIMALS[bi],
    };
  }

  function calculate(input) {
    const year = +input.year;
    const month = +input.month;
    const day = +input.day;
    let hour = input.hourUnknown ? 12 : +input.hour;
    let minute = input.hourUnknown ? 0 : +(input.minute || 0);
    const gender = input.gender === "여" ? "여" : "남";

    const { yearForPillar, monthIndex } = jieMonthAndYear(year, month, day, hour, minute);

    const yearStem = ((yearForPillar - 4) % 10 + 10) % 10;
    const yearBranch = ((yearForPillar - 4) % 12 + 12) % 12;

    const monthBranch = (monthIndex + 2) % 12; // 0 -> 인(2)
    const monthStem = (MONTH_STEM_START[yearStem] + monthIndex) % 10;

    // 일주: JDN. 1984-02-02 = 甲子일? 실제 1984-02-02는 목요일.
    // 율리우스 정수일 기준 60갑자 순환.
    // (jdn + 49) % 60 === 0 → 甲子  is common for noon-based
    const jdn = julianDay(year, month, day);
    // 검증용 날짜: 1990-10-10 = 戊申
    // JDN 1990-10-10 = 2448175
    // 戊=4, 申=8 → index 60 cycle: stem = idx%10, branch=idx%12
    // 날짜 상수는 1984-02-02 丙寅 및 1990-10-10 戊申과 대조함.
    // Use: dayIndex = jdn + OFFSET
    const dayIndex = ((jdn + 49) % 60 + 60) % 60;
    let dayStem = dayIndex % 10;
    let dayBranch = dayIndex % 12;

    // 야자시: 23시 이후는 다음날 일주
    if (!input.hourUnknown && hour >= 23) {
      const next = ((dayIndex + 1) % 60 + 60) % 60;
      dayStem = next % 10;
      dayBranch = next % 12;
    }

    const hBranch = input.hourUnknown ? null : hourBranchIndex(hour, minute);
    const hStem = input.hourUnknown ? null : (HOUR_STEM_START[dayStem] + hBranch) % 10;

    const yearP = pillarName(yearStem, yearBranch);
    const monthP = pillarName(monthStem, monthBranch);
    const dayP = pillarName(dayStem, dayBranch);
    const hourP = hStem == null ? null : pillarName(hStem, hBranch);

    const pillars = [yearP, monthP, dayP];
    if (hourP) pillars.push(hourP);

    yearP.god = tenGod(dayStem, yearStem);
    monthP.god = tenGod(dayStem, monthStem);
    dayP.god = "일간";
    if (hourP) hourP.god = tenGod(dayStem, hStem);

    const elCount = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
    pillars.forEach((p) => {
      elCount[p.stemEl] += 1.2;
      elCount[p.branchEl] += 0.8;
    });

    // 대운: 양남음여 순행
    const yangYear = !STEM_YIN[yearStem];
    const forward = (yangYear && gender === "남") || (!yangYear && gender === "여");

    // 대운 시작 나이: 절입까지 남은 날 / 3
    const JIE = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
    function monthStartMs(yfp, mi) {
      if (mi <= 10) return solarTermMs(yfp, 2 + mi * 2);
      if (mi === 11) return solarTermMs(yfp + 1, 0);
      return solarTermMs(yfp + 1, 2);
    }
    const birth = birthMsKst(year, month, day, hour, minute);
    let startAge = 1;
    if (forward) {
      const next = monthStartMs(yearForPillar, monthIndex + 1);
      const days = Math.max(1, (next - birth) / 86400000);
      startAge = Math.max(1, Math.round(days / 3));
    } else {
      const prev = monthStartMs(yearForPillar, monthIndex);
      const days = Math.max(1, (birth - prev) / 86400000);
      startAge = Math.max(1, Math.round(days / 3));
    }

    const STAGES = ["장생","목욕","관대","건록","제왕","쇠","병","사","묘","절","태","양"];
    // 양간 장생 지지, 음간은 역행
    const CHANGSAENG = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3];
    function stageOf(stemIdx, branchIdx) {
      const start = CHANGSAENG[stemIdx];
      const yin = STEM_YIN[stemIdx];
      const diff = yin ? (start - branchIdx + 12) % 12 : (branchIdx - start + 12) % 12;
      return STAGES[diff];
    }
    function triadKey(bi) {
      if ([2, 6, 10].includes(bi)) return "인오술";
      if ([5, 9, 1].includes(bi)) return "사유축";
      if ([8, 0, 4].includes(bi)) return "신자진";
      return "해묘미";
    }
    const DOHWA = { 인오술: 3, 사유축: 6, 신자진: 9, 해묘미: 0 };
    const YEOKMA = { 인오술: 8, 사유축: 11, 신자진: 2, 해묘미: 5 };
    const HWAGAE = { 인오술: 10, 사유축: 1, 신자진: 4, 해묘미: 7 };
    const YANGIN = [3, 4, 6, 7, 6, 5, 9, 10, 0, 1];
    const CHEONEUL = { 0: [1, 7], 1: [0, 8], 2: [11, 9], 3: [11, 9], 4: [1, 7], 5: [0, 8], 6: [5, 3], 7: [2, 6], 8: [2, 6], 9: [5, 3] };
    const branchSet = pillars.map((p) => p.branchIndex);
    function hasBr(idx) { return branchSet.includes(idx); }
    const yearTri = triadKey(yearBranch);
    const dayTri = triadKey(dayBranch);
    const extras = [];
    const cheon = CHEONEUL[dayStem] || [];
    if (cheon.some(hasBr)) extras.push({ key: "천을귀인", easy: "막힌 일이 풀리거나 도움을 받기 쉬운 글자" });
    if (hasBr(DOHWA[yearTri]) || hasBr(DOHWA[dayTri])) extras.push({ key: "도화", easy: "눈에 잘 띄고 호감·관심과 연결되는 글자" });
    if (hasBr(YEOKMA[yearTri]) || hasBr(YEOKMA[dayTri])) extras.push({ key: "역마", easy: "이동·바쁨·환경 변화가 잦아질 수 있는 글자" });
    if (hasBr(HWAGAE[yearTri]) || hasBr(HWAGAE[dayTri])) extras.push({ key: "화개", easy: "혼자 있는 시간, 공부·취향이 깊어지는 글자" });
    if (hasBr(YANGIN[dayStem])) extras.push({ key: "양인", easy: "추진력이 세고, 과하면 부딪히기 쉬운 글자" });
    yearP.stage = stageOf(dayStem, yearBranch);
    monthP.stage = stageOf(dayStem, monthBranch);
    dayP.stage = stageOf(dayStem, dayBranch);
    if (hourP) hourP.stage = stageOf(dayStem, hBranch);

    const luck = [];
    let ls = monthStem;
    let lb = monthBranch;
    for (let i = 0; i < 8; i++) {
      if (forward) {
        ls = (ls + 1) % 10;
        lb = (lb + 1) % 12;
      } else {
        ls = (ls + 9) % 10;
        lb = (lb + 11) % 12;
      }
      const p = pillarName(ls, lb);
      p.fromAge = startAge + i * 10;
      p.toAge = p.fromAge + 9;
      p.god = tenGod(dayStem, ls);
      p.stage = stageOf(dayStem, lb);
      luck.push(p);
    }

    return {
      input: {
        name: input.name || "이름 없음",
        gender,
        year,
        month,
        day,
        hour: input.hourUnknown ? null : hour,
        minute: input.hourUnknown ? null : minute,
        hourUnknown: !!input.hourUnknown,
        calendar: input.calendar || "양력",
      },
      yearForPillar,
      pillars: { year: yearP, month: monthP, day: dayP, hour: hourP },
      dayMaster: {
        stem: STEMS[dayStem],
        hanja: STEMS_H[dayStem],
        el: STEM_EL[dayStem],
        yin: STEM_YIN[dayStem] ? "음" : "양",
      },
      elCount,
      luck,
      startAge,
      forward,
      extras,
      stages: {
        year: yearP.stage,
        month: monthP.stage,
        day: dayP.stage,
        hour: hourP ? hourP.stage : null,
      },
    };
  }

  function normalizeEl(elCount) {
    const total = Object.values(elCount).reduce((a, b) => a + b, 0) || 1;
    const out = {};
    for (const k of ["목", "화", "토", "금", "수"]) out[k] = Math.round((elCount[k] / total) * 100);
    return out;
  }

  return {
    version: "2.0.0",
    STEMS,
    STEMS_H,
    BRANCHES,
    BRANCHES_H,
    ANIMALS,
    STEM_EL,
    BRANCH_EL,
    EL_KO,
    EL_COLOR,
    TEN_GODS,
    calculate,
    normalizeEl,
    tenGod,
    pillarName,
  };
});

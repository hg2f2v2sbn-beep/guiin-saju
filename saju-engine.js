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
    const lichunThis = solarTermMs(y, 2);
    const sohanThis = solarTermMs(y, 0);
    const yearForPillar = t >= lichunThis ? y : y - 1;
    function monthStartMs(yearFor, monthIndex) {
      if (monthIndex <= 10) return solarTermMs(yearFor, 2 + monthIndex * 2);
      if (monthIndex === 11) return solarTermMs(yearFor + 1, 0);
      return solarTermMs(yearFor + 1, 2);
    }
    let monthIndex = 11;
    for (let i = 0; i < 12; i++) {
      const start = monthStartMs(yearForPillar, i);
      const end = monthStartMs(yearForPillar, i + 1);
      if (t >= start && t < end) { monthIndex = i; break; }
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


  // 지장간: 지지 안에 포함된 천간을 전통적 비중으로 단순 가중합니다.
  // 이 비중은 오행 분포를 더 세밀하게 보여주기 위한 규칙 기반 값이며 용신 판정이 아닙니다.
  const HIDDEN_STEMS = [
    [[9,1.0]],                         // 자 癸
    [[5,0.6],[9,0.3],[7,0.1]],       // 축 己癸辛
    [[0,0.6],[2,0.3],[4,0.1]],       // 인 甲丙戊
    [[1,1.0]],                         // 묘 乙
    [[4,0.6],[1,0.3],[9,0.1]],       // 진 戊乙癸
    [[2,0.6],[6,0.3],[4,0.1]],       // 사 丙庚戊
    [[3,0.7],[5,0.3]],               // 오 丁己
    [[5,0.6],[3,0.3],[1,0.1]],       // 미 己丁乙
    [[6,0.6],[8,0.3],[4,0.1]],       // 신 庚壬戊
    [[7,1.0]],                         // 유 辛
    [[4,0.6],[7,0.3],[3,0.1]],       // 술 戊辛丁
    [[8,0.7],[0,0.3]]                // 해 壬甲
  ];
  const BRANCH_COMBINE = {0:1,1:0,2:11,11:2,3:10,10:3,4:9,9:4,5:8,8:5,6:7,7:6};
  const BRANCH_CLASH = {0:6,6:0,1:7,7:1,2:8,8:2,3:9,9:3,4:10,10:4,5:11,11:5};
  const BRANCH_HARM = {0:7,7:0,1:6,6:1,2:5,5:2,3:4,4:3,8:11,11:8,9:10,10:9};
  const BRANCH_BREAK = {0:9,9:0,1:4,4:1,2:11,11:2,3:6,6:3,5:8,8:5,7:10,10:7};
  const STEM_COMBINE = {0:5,5:0,1:6,6:1,2:7,7:2,3:8,8:3,4:9,9:4};

  function enrichHidden(p, dayStem) {
    p.hidden = HIDDEN_STEMS[p.branchIndex].map(([si,w],idx)=>({
      stem: STEMS[si], stemH: STEMS_H[si], stemIndex: si, element: STEM_EL[si],
      god: tenGod(dayStem, si), weight: w, role: idx===0 ? "본기" : "여기"
    }));
    return p;
  }

  function chartRelations(ps) {
    const keys=["year","month","day","hour"];
    const labels={year:"년주",month:"월주",day:"일주",hour:"시주"};
    const arr=ps.map((p,i)=>p?{p,key:keys[i],label:labels[keys[i]]}:null).filter(Boolean), out=[];
    const push=(type,x,y,layer)=>out.push({
      type, layer, a:x.p[layer==="천간"?"stem":"branch"], b:y.p[layer==="천간"?"stem":"branch"],
      aKey:x.key,bKey:y.key,aLabel:x.label,bLabel:y.label
    });
    for(let i=0;i<arr.length;i++) for(let j=i+1;j<arr.length;j++){
      const x=arr[i],y=arr[j],a=x.p,b=y.p;
      if(STEM_COMBINE[a.stemIndex]===b.stemIndex) push("천간합",x,y,"천간");
      if(BRANCH_COMBINE[a.branchIndex]===b.branchIndex) push("육합",x,y,"지지");
      if(BRANCH_CLASH[a.branchIndex]===b.branchIndex) push("충",x,y,"지지");
      if(BRANCH_HARM[a.branchIndex]===b.branchIndex) push("해",x,y,"지지");
      if(BRANCH_BREAK[a.branchIndex]===b.branchIndex) push("파",x,y,"지지");
    }
    // 대표적인 지지 형 관계. 자형(辰辰·午午·酉酉·亥亥)도 포함.
    const punishPairs=[[2,5],[5,8],[8,2],[1,10],[10,7],[7,1],[0,3]];
    const selfPunish=new Set([4,6,9,11]);
    for(let i=0;i<arr.length;i++) for(let j=i+1;j<arr.length;j++){
      const x=arr[i],y=arr[j],a=x.p.branchIndex,b=y.p.branchIndex;
      if(punishPairs.some(([u,v])=>(a===u&&b===v)||(a===v&&b===u)) || (a===b&&selfPunish.has(a))) push("형",x,y,"지지");
    }
    // 삼합은 세 지지가 모두 원국에 존재할 때 한 묶음으로 표시.
    const triads=[{b:[8,0,4],name:"신자진 수국"},{b:[2,6,10],name:"인오술 화국"},{b:[5,9,1],name:"사유축 금국"},{b:[11,3,7],name:"해묘미 목국"}];
    triads.forEach(t=>{
      const found=arr.filter(x=>t.b.includes(x.p.branchIndex));
      if(new Set(found.map(x=>x.p.branchIndex)).size===3) out.push({
        type:"삼합",layer:"지지",name:t.name,
        members:found.map(x=>({key:x.key,label:x.label,branch:x.p.branch}))
      });
    });
    return out;
  }


  // Korean lunar calendar conversion table, 1900–2050.
  // The conversion is used only to normalize a user-entered lunar birth date to a solar date;
  // saju pillars are then calculated from the normalized solar date and solar terms.
  const LUNAR_BASE_YEAR=1900, LUNAR_MAX_YEAR=2050;
  const LUNAR_YEAR_DATA=[0x830084bd,0x82c404ae,0x82c60a57,0x82fe554d,0xc2c40d26,0x82c60d95,0x83014655,0x82c4056a,0xc2c609ad,0x8300255d,0x82c404ae,0x83006a5b,0xc2c40a4d,0x82c40d25,0x83005da9,0x82c60b55,0xc2c4056a,0x83002ada,0x82c6095d,0x830074bb,0xc2c4049b,0x82c40a4b,0x83005b4b,0x82c406a9,0xc2c40ad4,0x83024bb5,0x82c402b6,0x82c6095b,0xc3002537,0x82c40497,0x82fe6656,0x82c40e4a,0xc2c60ea5,0x830156a9,0x82c605b5,0x82c402b6,0xc30138ae,0x82c4092e,0x83017c8d,0x82c40c95,0xc2c40d4a,0x83016d8a,0x82c60b69,0x82c6056d,0xc301425b,0x82c4025d,0x82c4092d,0x83002d2b,0xc2c40a95,0x83007d55,0x82c40b4a,0x82c60b55,0xc3015555,0x82c604db,0x82c4025b,0x83013857,0xc2c4052b,0x83008a9b,0x82c40695,0x82c406aa,0xc3006aea,0x82c60ab5,0x82c404b6,0x83004aae,0xc2c60a57,0x82c40527,0x82fe3726,0x82c60d95,0xc30076b5,0x82c4056a,0x82c609ad,0x830054dd,0xc2c404ae,0x82c40a4e,0x83004d4d,0x82c40d25,0xc3008d59,0x82c40b54,0x82c60d6a,0x8301695a,0xc2c6095b,0x82c4049b,0x83004a9b,0x82c40a4b,0xc300ab27,0x82c406a5,0x82c406d4,0x83026b75,0xc2c402b6,0x82c6095b,0x830054b7,0x82c40497,0xc2c4064b,0x82fe374a,0x82c60ea5,0x830086d9,0xc2c605ad,0x82c402b6,0x8300596e,0x82c4092e,0xc2c40c96,0x83004e95,0x82c40d4a,0x82c60da5,0xc3002755,0x82c4056c,0x83027abb,0x82c4025d,0xc2c4092d,0x83005cab,0x82c40a95,0x82c40b4a,0xc3013b4a,0x82c60b55,0x8300955d,0x82c404ba,0xc2c60a5b,0x83005557,0x82c4052b,0x82c40a95,0xc3004b95,0x82c406aa,0x82c60ad5,0x830026b5,0xc2c404b6,0x83006a6e,0x82c60a57,0x82c40527,0xc2fe56a6,0x82c60d93,0x82c405aa,0x83003b6a,0xc2c6096d,0x8300b4af,0x82c404ae,0x82c40a4d,0xc3016d0d,0x82c40d25,0x82c40d52,0x83005dd4,0xc2c60b6a,0x82c6096d,0x8300255b,0x82c4049b,0xc3007a57,0x82c40a4b,0x82c40b25,0x83015b25,0xc2c406d4,0x82c60ada,0x830138b6];
  function lunarData(y){ if(y<LUNAR_BASE_YEAR||y>LUNAR_MAX_YEAR) throw new Error("음력 입력은 1900~2050년만 지원합니다."); return LUNAR_YEAR_DATA[y-LUNAR_BASE_YEAR]>>>0; }
  function lunarLeapMonth(y){ return (lunarData(y)>>>12)&15; }
  function lunarMonthDays(y,m,leap=false){
    if(m<1||m>12) throw new Error("음력 월을 확인해 주세요.");
    const d=lunarData(y), lm=(d>>>12)&15;
    if(leap){ if(lm!==m) throw new Error(`${y}년 음력 ${m}월은 윤달이 아닙니다.`); return ((d>>>16)&1)?30:29; }
    return ((d>>>(12-m))&1)?30:29;
  }
  function lunarYearDays(y){ return (lunarData(y)>>>17)&0x1ff; }
  function lunarToSolar(y,m,d,leap=false){
    y=Number(y);m=Number(m);d=Number(d);leap=!!leap;
    if(!Number.isInteger(y)||!Number.isInteger(m)||!Number.isInteger(d)) throw new Error("음력 생년월일을 확인해 주세요.");
    const md=lunarMonthDays(y,m,leap); if(d<1||d>md) throw new Error(`${y}년 음력 ${m}월${leap?" 윤달":""}은 ${md}일까지입니다.`);
    let offset=0;
    for(let yy=1900;yy<y;yy++) offset+=lunarYearDays(yy);
    const lm=lunarLeapMonth(y);
    for(let mm=1;mm<m;mm++){ offset+=lunarMonthDays(y,mm,false); if(lm===mm) offset+=lunarMonthDays(y,mm,true); }
    if(leap) offset+=lunarMonthDays(y,m,false);
    offset+=d-1;
    const dt=new Date(Date.UTC(1900,0,31)+offset*86400000);
    return {year:dt.getUTCFullYear(),month:dt.getUTCMonth()+1,day:dt.getUTCDate(),source:{year:y,month:m,day:d,leap},leapMonth:lm};
  }

  function calculate(input) {
    const originalInput={...input};
    let lunarConversion=null;
    if(input.calendar==="음력"){ lunarConversion=lunarToSolar(input.year,input.month,input.day,!!input.leapMonth); input={...input,...lunarConversion,calendar:"양력"}; }
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

    // 일주: JDN. 1984-02-02 = 丙寅일 실제 1984-02-02는 목요일.
    // 표준: AJD 0.0 = 음... 갑자일 = JDN 11 이 정씨 공식
    // (jdn + 49) % 60 === 0 → 甲子  is common for noon-based
    const jdn = julianDay(year, month, day);
    // 검증용 상수: 1990-10-10 = 戊申
    // JDN 1990-10-10 = 2448175
    // 己=5, 未=7 → index 60 cycle: stem = idx%10, branch=idx%12, 己未 idx where 5,7
    // idx ≡ 5 (mod 10), idx ≡ 7 (mod 12)
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
    pillars.forEach(p => enrichHidden(p, dayStem));

    yearP.god = tenGod(dayStem, yearStem);
    monthP.god = tenGod(dayStem, monthStem);
    dayP.god = "일간";
    if (hourP) hourP.god = tenGod(dayStem, hStem);

    const elCount = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
    pillars.forEach((p) => {
      // 겉으로 드러난 천간 + 지지 내부 지장간을 함께 반영
      elCount[p.stemEl] += 1.0;
      p.hidden.forEach(h => { elCount[h.element] += h.weight; });
    });

    // 대운: 양남음여 순행
    const yangYear = !STEM_YIN[yearStem];
    const forward = (yangYear && gender === "남") || (!yangYear && gender === "여");

    // 대운 시작 나이: 절입까지 남은 날 / 3
    const JIE = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
    function monthStartMs(yfp, mi) {
      if (mi <= 10) return solarTermMs(yfp, JIE[mi]);
      if (mi === 11) return solarTermMs(yfp + 1, 0);
      return solarTermMs(yfp + 1, 2); // next 인월 = 다음 입춘
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
        calendar: originalInput.calendar || "양력",
        leapMonth: !!originalInput.leapMonth,
        originalDate: originalInput.calendar==="음력"?{year:originalInput.year,month:originalInput.month,day:originalInput.day,leap:!!originalInput.leapMonth}:null,
        normalizedSolarDate: lunarConversion?{year,month,day}:null,
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
      relations: chartRelations(pillars),
      stars: specialStars({year:yearP,month:monthP,day:dayP,hour:hourP}, dayStem),
      twelveStages: twelveStagesForPillars({year:yearP,month:monthP,day:dayP,hour:hourP}, dayStem),
      calculation: {
        engineVersion: "2.1.0-lunar-calendar",
        solarTerms: "근사 절기식 · 경계 진단 포함",
        lunarConversion: lunarConversion?`음력 ${originalInput.year}.${originalInput.month}.${originalInput.day}${originalInput.leapMonth?" 윤달":""} → 양력 ${year}.${month}.${day}`:"양력 직접 입력",
        timezone: "KST UTC+9",
        trueSolarTime: false,
        longitudeCorrection: false,
        dayBoundary: "23:00 다음 일주 적용",
        elementMethod: "천간 + 지장간 가중",
        boundaryDiagnostics: boundaryDiagnostics({year,month,day,hour,minute,hourUnknown:!!input.hourUnknown})
      },
      luck,
      startAge,
      forward,
    };
  }

  // 신살/귀인 보조 계산층.
  // 신살은 유파별 기준 차이가 있어 원국의 핵심 판단보다 낮은 우선순위의 참고 정보로 제공합니다.
  const SINSAL_50_CATALOG=[{name:"겁살",group:"12신살"},{name:"재살",group:"12신살"},{name:"천살",group:"12신살"},{name:"지살",group:"12신살"},{name:"도화살",group:"12신살"},{name:"월살",group:"12신살"},{name:"망신살",group:"12신살"},{name:"장성살",group:"12신살"},{name:"반안살",group:"12신살"},{name:"역마살",group:"12신살"},{name:"육해살",group:"12신살"},{name:"화개살",group:"12신살"},{name:"천을귀인",group:"귀인·길신"},{name:"천덕귀인",group:"귀인·길신"},{name:"월덕귀인",group:"귀인·길신"},{name:"문창귀인",group:"귀인·길신"},{name:"태극귀인",group:"귀인·길신"},{name:"복성귀인",group:"귀인·길신"},{name:"금여성",group:"귀인·길신"},{name:"관귀학관",group:"귀인·길신"},{name:"천문성",group:"귀인·길신"},{name:"천의성",group:"귀인·길신"},{name:"건록",group:"귀인·길신"},{name:"암록",group:"귀인·길신"},{name:"협록",group:"귀인·길신"},{name:"문곡귀인",group:"귀인·길신"},{name:"학당귀인",group:"귀인·길신"},{name:"홍염살",group:"매력·관계"},{name:"원진살",group:"매력·관계"},{name:"귀문관살",group:"매력·관계"},{name:"고란살",group:"매력·관계"},{name:"고신살",group:"매력·관계"},{name:"과숙살",group:"매력·관계"},{name:"양인살",group:"강한 기운"},{name:"괴강살",group:"강한 기운"},{name:"백호살",group:"강한 기운"},{name:"현침살",group:"강한 기운"},{name:"탕화살",group:"강한 기운"},{name:"낙정관살",group:"강한 기운"},{name:"공망",group:"특수"},{name:"천라지망",group:"특수"},{name:"삼기",group:"특수"},{name:"월공",group:"특수"},{name:"상문살",group:"특수"},{name:"조객살",group:"특수"},{name:"형살",group:"지지 관계"},{name:"충살",group:"지지 관계"},{name:"파살",group:"지지 관계"},{name:"해살",group:"지지 관계"},{name:"삼합",group:"지지 관계"}];
  const SINSAL_50_DEFAULT_META={"겁살":{group:"12신살",short:"12신살에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"재살":{group:"12신살",short:"12신살에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"천살":{group:"12신살",short:"12신살에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"지살":{group:"12신살",short:"12신살에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"도화살":{group:"12신살",short:"12신살에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"월살":{group:"12신살",short:"12신살에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"망신살":{group:"12신살",short:"12신살에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"장성살":{group:"12신살",short:"12신살에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"반안살":{group:"12신살",short:"12신살에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"역마살":{group:"12신살",short:"12신살에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"육해살":{group:"12신살",short:"12신살에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"화개살":{group:"12신살",short:"12신살에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"천을귀인":{group:"귀인·길신",short:"귀인·길신에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"천덕귀인":{group:"귀인·길신",short:"귀인·길신에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"월덕귀인":{group:"귀인·길신",short:"귀인·길신에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"문창귀인":{group:"귀인·길신",short:"귀인·길신에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"태극귀인":{group:"귀인·길신",short:"귀인·길신에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"복성귀인":{group:"귀인·길신",short:"귀인·길신에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"금여성":{group:"귀인·길신",short:"귀인·길신에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"관귀학관":{group:"귀인·길신",short:"귀인·길신에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"천문성":{group:"귀인·길신",short:"귀인·길신에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"천의성":{group:"귀인·길신",short:"귀인·길신에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"건록":{group:"귀인·길신",short:"귀인·길신에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"암록":{group:"귀인·길신",short:"귀인·길신에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"협록":{group:"귀인·길신",short:"귀인·길신에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"문곡귀인":{group:"귀인·길신",short:"귀인·길신에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"학당귀인":{group:"귀인·길신",short:"귀인·길신에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"홍염살":{group:"매력·관계",short:"매력·관계에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"원진살":{group:"매력·관계",short:"매력·관계에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"귀문관살":{group:"매력·관계",short:"매력·관계에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"고란살":{group:"매력·관계",short:"매력·관계에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"고신살":{group:"매력·관계",short:"매력·관계에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"과숙살":{group:"매력·관계",short:"매력·관계에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"양인살":{group:"강한 기운",short:"강한 기운에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"괴강살":{group:"강한 기운",short:"강한 기운에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"백호살":{group:"강한 기운",short:"강한 기운에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"현침살":{group:"강한 기운",short:"강한 기운에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"탕화살":{group:"강한 기운",short:"강한 기운에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"낙정관살":{group:"강한 기운",short:"강한 기운에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"공망":{group:"특수",short:"특수에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"천라지망":{group:"특수",short:"특수에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"삼기":{group:"특수",short:"특수에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"월공":{group:"특수",short:"특수에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"상문살":{group:"특수",short:"특수에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"조객살":{group:"특수",short:"특수에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"형살":{group:"지지 관계",short:"지지 관계에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"충살":{group:"지지 관계",short:"지지 관계에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"파살":{group:"지지 관계",short:"지지 관계에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"해살":{group:"지지 관계",short:"지지 관계에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."},"삼합":{group:"지지 관계",short:"지지 관계에서 살펴보는 전통 명리의 보조 상징",good:"원국 전체와 함께 보면 자신의 반복 패턴을 이해하는 참고가 될 수 있어요.",watch:"이 항목 하나만으로 성격·사건·질병·결혼·재물을 단정하지 않습니다."}};
  const SINSAL_META = {
    "도화살": {group:"매력·표현", tone:"popular", short:"사람의 시선과 호감을 끄는 힘", good:"표현·서비스·영업·콘텐츠처럼 사람과 만나는 장면에서 매력으로 쓰기 좋습니다.", watch:"인기나 관심을 관계의 확신으로 바로 해석하지 않는 것이 좋아요."},
    "역마살": {group:"변화·이동", tone:"move", short:"움직임과 변화에 반응하는 힘", good:"이동·출장·여행·새 환경처럼 변화가 있는 자리에서 활력이 살아날 수 있어요.", watch:"변화 자체가 목적이 되어 자주 방향을 바꾸지는 않는지 확인해 보세요."},
    "화개살": {group:"몰입·감성", tone:"deep", short:"혼자 깊게 파고드는 몰입과 감성", good:"예술·연구·전문기술·취향처럼 한 분야를 깊게 파는 힘으로 쓰기 좋아요.", watch:"생각이 깊어질수록 혼자만의 결론에 갇히지 않도록 바깥 피드백도 받아보세요."},
    "천을귀인": {group:"귀인·도움", tone:"good", short:"도움과 해결의 연결을 상징하는 귀인", good:"어려울 때 사람·정보·제도를 통해 해결 실마리를 찾는 상징으로 읽습니다.", watch:"귀인이 있다고 기다리기보다 먼저 도움을 요청하고 관계를 관리하는 행동이 중요해요."},
    "문창귀인": {group:"배움·표현", tone:"good", short:"배움·글·정리·표현의 재능을 상징", good:"공부한 것을 글·말·기술·문서로 정리할 때 장점이 살아날 수 있어요.", watch:"아는 것을 실제 결과로 옮기는 단계까지 연결해 보세요."},
    "태극귀인": {group:"통찰·배움", tone:"good", short:"이해력과 탐구 성향을 상징하는 귀인", good:"복잡한 것을 이해하고 자기 방식으로 정리하는 힘을 살펴볼 때 참고합니다.", watch:"상징 하나만으로 총명함이나 성공을 확정하지 않아요."},
    "홍염살": {group:"매력·표현", tone:"popular", short:"개성 있는 매력과 감정 표현을 상징", good:"자기 취향과 분위기를 드러내는 장면에서 존재감으로 쓰일 수 있어요.", watch:"강한 호감과 오래가는 관계는 다른 문제라는 점을 기억하세요."},
    "양인살": {group:"추진·결단", tone:"power", short:"결단력과 밀어붙이는 힘을 상징", good:"책임이 분명하고 결단이 필요한 상황에서 추진력으로 활용할 수 있어요.", watch:"급한 결정이나 힘으로 밀어붙이는 방식은 한 번 더 점검하세요."},
    "괴강살": {group:"주도·기준", tone:"power", short:"강한 기준과 주도성을 상징", good:"자기 기준을 세우고 책임지는 자리에서 강점으로 읽을 수 있어요.", watch:"강한 기준이 타인에게는 압박으로 느껴질 수 있어 전달 방식을 조절해 보세요."},
    "귀문관살": {group:"감각·몰입", tone:"deep", short:"예민한 감각과 깊은 몰입을 상징", good:"세밀한 관찰과 독특한 관점이 필요한 분야에서 장점으로 바꿀 수 있어요.", watch:"불안이나 질환을 뜻한다고 단정하지 않습니다. 실제 어려움은 전문가의 평가가 기준입니다."},
    "원진살": {group:"관계·조정", tone:"relation", short:"가까운 관계에서 감정의 엇갈림을 상징", good:"서로 다른 기대를 말로 확인해야 한다는 관계 체크포인트로 활용할 수 있어요.", watch:"특정 사람과의 악연을 뜻하지 않습니다."},
    "공망": {group:"비움·재정비", tone:"deep", short:"비어 있음과 재정비의 상징", good:"계획을 고정하기보다 여지를 두고 다시 점검하는 신호로 읽을 수 있어요.", watch:"재물·결혼·가족이 사라진다는 식으로 해석하지 않습니다."},
    "건록": {group:"자립·기반", tone:"good", short:"자기 힘으로 기반을 세우는 상징", good:"꾸준히 실력과 생활 기반을 쌓는 힘을 살펴볼 때 참고합니다.", watch:"독립심이 모든 일을 혼자 해야 한다는 뜻은 아니에요."}
  };

  Object.keys(SINSAL_50_DEFAULT_META).forEach(k=>{if(!SINSAL_META[k])SINSAL_META[k]=SINSAL_50_DEFAULT_META[k];});
  function starHit(name, pillarKey, basis, extra) {
    return Object.assign({name, pillar:pillarKey, basis, meta:SINSAL_META[name]||{group:"특별한 기운",short:"명식의 보조 상징",good:"원국과 함께 참고합니다.",watch:"단독으로 길흉을 정하지 않습니다."}}, extra||{});
  }
  function uniqStarHits(hits) {
    const seen=new Set();
    return hits.filter(h=>{const k=[h.name,h.pillar,h.basis].join("|"); if(seen.has(k)) return false; seen.add(k); return true;});
  }
  function voidBranches(dayStem, dayBranch) {
    const cycleIndex = Array.from({length:60},(_,i)=>i).find(i=>i%10===dayStem && i%12===dayBranch);
    const xunStart = cycleIndex - (cycleIndex%10);
    const used = new Set(Array.from({length:10},(_,i)=>(xunStart+i)%12));
    return Array.from({length:12},(_,i)=>i).filter(i=>!used.has(i));
  }
  function specialStars(pillars, dayStem) {
    const entries=[["year",pillars.year],["month",pillars.month],["day",pillars.day],["hour",pillars.hour]].filter(x=>x[1]);
    const dayBranch=pillars.day.branchIndex, yearBranch=pillars.year.branchIndex, hits=[];
    const peach={8:9,0:9,4:9,2:3,6:3,10:3,5:6,9:6,1:6,11:0,3:0,7:0};
    const horse={8:2,0:2,4:2,2:8,6:8,10:8,5:11,9:11,1:11,11:5,3:5,7:5};
    const canopy={8:4,0:4,4:4,2:10,6:10,10:10,5:1,9:1,1:1,11:7,3:7,7:7};
    const noble={
      0:[1,7],4:[1,7],6:[1,7], 1:[0,8],5:[0,8], 2:[11,9],3:[11,9],
      7:[2,6], 8:[3,5],9:[3,5]
    };
    const literary={0:5,1:6,2:8,3:9,4:8,5:9,6:11,7:0,8:2,9:3};
    const taiji={0:[0,6],1:[0,6],2:[3,9],3:[3,9],4:[4,10,1,7],5:[4,10,1,7],6:[2,11],7:[2,11],8:[5,8],9:[5,8]};
    const hongyeom={0:6,1:8,2:2,3:6,4:4,5:4,6:10,7:9,8:0,9:8};
    const blade={0:3,1:2,2:6,3:5,4:6,5:5,6:9,7:8,8:0,9:11};
    const guimenPairs=[[0,9],[1,6],[2,7],[3,8],[4,11],[5,10]];
    const wonjinPairs=[[0,7],[1,6],[2,9],[3,8],[4,11],[5,10]];
    const guigang=new Set(["경진","경술","임진","무술"]);
    const geonrok={0:2,1:3,2:5,3:6,4:5,5:6,6:8,7:9,8:11,9:0};

    function addByBranch(name,target,basis,excludeBasisSelf=false){
      entries.forEach(([k,p])=>{
        if(p.branchIndex===target && !(excludeBasisSelf && ((basis==="년지"&&k==="year")||(basis==="일지"&&k==="day"))))
          hits.push(starHit(name,k,basis));
      });
    }
    // 년지·일지 두 기준을 모두 보여주되 같은 위치/이름/기준 중복은 제거합니다.
    addByBranch("도화살",peach[yearBranch],"년지");
    addByBranch("도화살",peach[dayBranch],"일지");
    addByBranch("역마살",horse[yearBranch],"년지");
    addByBranch("역마살",horse[dayBranch],"일지");
    addByBranch("화개살",canopy[yearBranch],"년지");
    addByBranch("화개살",canopy[dayBranch],"일지");

    (noble[dayStem]||[]).forEach(b=>addByBranch("천을귀인",b,"일간"));
    addByBranch("문창귀인",literary[dayStem],"일간");
    (taiji[dayStem]||[]).forEach(b=>addByBranch("태극귀인",b,"일간"));
    addByBranch("홍염살",hongyeom[dayStem],"일간");
    addByBranch("양인살",blade[dayStem],"일간");
    addByBranch("건록",geonrok[dayStem],"일간");

    entries.forEach(([k,p])=>{
      if(guigang.has(p.ko)) hits.push(starHit("괴강살",k,"일주·간지"));
    });
    function addPairStars(name,pairs){
      for(let i=0;i<entries.length;i++) for(let j=i+1;j<entries.length;j++){
        const [ka,a]=entries[i],[kb,b]=entries[j];
        if(pairs.some(([x,y])=>(a.branchIndex===x&&b.branchIndex===y)||(a.branchIndex===y&&b.branchIndex===x))){
          hits.push(starHit(name,ka,`${ka}↔${kb}`));
          hits.push(starHit(name,kb,`${ka}↔${kb}`));
        }
      }
    }
    addPairStars("귀문관살",guimenPairs);
    addPairStars("원진살",wonjinPairs);

    const voids=voidBranches(dayStem,dayBranch);
    entries.forEach(([k,p])=>{if(voids.includes(p.branchIndex))hits.push(starHit("공망",k,"일주旬"));});


    // 12신살 전체: 삼합국 기준 순환표. 년지와 일지를 각각 기준으로 확인합니다.
    const twelveNames=["겁살","재살","천살","지살","도화살","월살","망신살","장성살","반안살","역마살","육해살","화개살"];
    const twelveStart={8:5,0:5,4:5, 2:11,6:11,10:11, 5:2,9:2,1:2, 11:8,3:8,7:8};
    function addTwelve(baseBranch,basis){
      const start=twelveStart[baseBranch];
      if(start===undefined)return;
      entries.forEach(([k,p])=>{
        const offset=(p.branchIndex-start+12)%12;
        hits.push(starHit(twelveNames[offset],k,basis+"·12신살"));
      });
    }
    addTwelve(yearBranch,"년지");
    addTwelve(dayBranch,"일지");

    // 지지 관계성: 형·충·파·해·삼합. 사건 예측이 아니라 원국 내부 관계 표식입니다.
    const chungPairs=[[0,6],[1,7],[2,8],[3,9],[4,10],[5,11]];
    const haePairs=[[0,7],[1,6],[2,5],[3,4],[8,11],[9,10]];
    const paPairs=[[0,9],[1,4],[2,11],[3,6],[5,8],[7,10]];
    const hyeongPairs=[[2,5],[5,8],[8,2],[1,10],[10,7],[7,1],[0,3]];
    function addRelation(name,pairs){
      for(let i=0;i<entries.length;i++)for(let j=i+1;j<entries.length;j++){
        const [ka,a]=entries[i],[kb,b]=entries[j];
        if(pairs.some(([x,y])=>(a.branchIndex===x&&b.branchIndex===y)||(a.branchIndex===y&&b.branchIndex===x))){
          hits.push(starHit(name,ka,`${ka}↔${kb}`)); hits.push(starHit(name,kb,`${ka}↔${kb}`));
        }
      }
    }
    addRelation("충살",chungPairs); addRelation("해살",haePairs); addRelation("파살",paPairs); addRelation("형살",hyeongPairs);
    const triads=[[8,0,4],[2,6,10],[5,9,1],[11,3,7]];
    triads.forEach(t=>{
      const present=entries.filter(([k,p])=>t.includes(p.branchIndex));
      if(new Set(present.map(x=>x[1].branchIndex)).size===3) present.forEach(([k])=>hits.push(starHit("삼합",k,"원국 3지")));
    });

    // 천라지망: 辰巳 / 戌亥가 원국에서 함께 보이는 전통적 표식.
    [[[4,5]],[[10,11]]].flat().forEach(([a,b])=>{
      const pa=entries.filter(x=>x[1].branchIndex===a), pb=entries.filter(x=>x[1].branchIndex===b);
      if(pa.length&&pb.length){pa.concat(pb).forEach(([k])=>hits.push(starHit("천라지망",k,"지지 조합")));}
    });

    // 고신·과숙: 년지 삼합국 기준의 대표적인 전통 표.
    const gosin={11:2,0:2,1:2, 2:5,3:5,4:5, 5:8,6:8,7:8, 8:11,9:11,10:11};
    const gwasuk={11:10,0:10,1:10, 2:1,3:1,4:1, 5:4,6:4,7:4, 8:7,9:7,10:7};
    addByBranch("고신살",gosin[yearBranch],"년지");
    addByBranch("과숙살",gwasuk[yearBranch],"년지");

    // 현침: 천간/지지 글자 자체의 형상을 보는 대표 기준.
    const needleStems=new Set([0,7]); // 甲, 辛
    const needleBranches=new Set([3,6,8]); // 卯, 午, 申
    entries.forEach(([k,p])=>{if(needleStems.has(p.stemIndex)||needleBranches.has(p.branchIndex))hits.push(starHit("현침살",k,"간지 형상"));});

    // 백호: 널리 쓰이는 백호대살 7일주 기준.
    const baekhoDays=new Set(["갑진","을미","병술","정축","무진","임술","계축"]);
    if(baekhoDays.has(pillars.day.ko))hits.push(starHit("백호살","day","일주"));

    // 삼기: 천간 3개가 甲戊庚 / 乙丙丁 / 壬癸辛 세 조합 중 하나를 모두 포함하는지 확인.
    const stemSet=new Set(entries.map(x=>x[1].stemIndex));
    [[0,4,6],[1,2,3],[8,9,7]].forEach(arr=>{if(arr.every(x=>stemSet.has(x)))entries.filter(x=>arr.includes(x[1].stemIndex)).forEach(([k])=>hits.push(starHit("삼기",k,"천간 3기")));});

    const clean=uniqStarHits(hits);
    const counts={}; clean.forEach(h=>counts[h.name]=(counts[h.name]||0)+1);
    const supported=new Set(["겁살","재살","천살","지살","도화살","월살","망신살","장성살","반안살","역마살","육해살","화개살","천을귀인","문창귀인","태극귀인","건록","홍염살","양인살","괴강살","귀문관살","원진살","공망","고신살","과숙살","백호살","현침살","천라지망","삼기","형살","충살","파살","해살","삼합"]);
    const catalogue=SINSAL_50_CATALOG.map(x=>Object.assign({},x,{count:counts[x.name]||0,status:supported.has(x.name)?"calculated":"school-dependent"}));
    return {hits:clean, counts, total:clean.length, catalogue, supportedCount:supported.size, catalogCount:SINSAL_50_CATALOG.length, voidBranches:voids.map(i=>BRANCHES[i])};
  }


  const TWELVE_STAGES=["장생","목욕","관대","건록","제왕","쇠","병","사","묘","절","태","양"];
  // 일간별 장생 시작 지지: 甲亥 乙午 丙寅 丁酉 戊寅 己酉 庚巳 辛子 壬申 癸卯.
  // 양간은 순행, 음간은 역행하는 통용표를 사용합니다.
  const TWELVE_STAGE_START=[11,6,2,9,2,9,5,0,8,3];
  function twelveStage(dayStem, branchIndex){
    const start=TWELVE_STAGE_START[dayStem];
    const forward=(dayStem%2===0);
    const offset=forward ? (branchIndex-start+12)%12 : (start-branchIndex+12)%12;
    return TWELVE_STAGES[offset];
  }
  function twelveStagesForPillars(pillars,dayStem){
    const out={};
    ["year","month","day","hour"].forEach(k=>{if(pillars[k])out[k]=twelveStage(dayStem,pillars[k].branchIndex);});
    return out;
  }

  // 특정 날짜의 세운·월운·일운을 출생 명식과 분리해 계산하는 공개 헬퍼.
  // 화면에서 날짜 흐름을 조회할 때 같은 계산식을 재사용해 UI와 엔진의 결과가 어긋나지 않게 합니다.
  function calendarPillars(year, month, day, hour=12, minute=0) {
    const c = calculate({name:"달력", gender:"여", calendar:"양력", year, month, day, hour, minute, hourUnknown:false});
    return {year:c.pillars.year, month:c.pillars.month, day:c.pillars.day, hour:c.pillars.hour};
  }
  function flowForDate(year, month, day, dayStem, hour=12, minute=0) {
    const pillars=calendarPillars(year,month,day,hour,minute);
    const ds=typeof dayStem==="number"?dayStem:STEMS.indexOf(dayStem);
    if(ds<0) throw new Error("invalid day stem");
    const out={pillars,gods:{},stages:{}};
    ["year","month","day","hour"].forEach(k=>{
      const p=pillars[k];
      out.gods[k]=tenGod(ds,p.stemIndex);
      out.stages[k]=twelveStage(ds,p.branchIndex);
    });
    return out;
  }


  // 원국에 하나의 운 간지를 겹쳐 합·충·형·파·해·삼합 등을 확인합니다.
  // transit를 임시 시주 슬롯에 넣어 기존 관계 계산식을 재사용하며, 결과의 hour 라벨은 운으로 바꿉니다.
  function relationsWithTransit(basePillars, transit) {
    if(!basePillars || !transit) return [];
    const merged=[basePillars.year,basePillars.month,basePillars.day,transit];
    return chartRelations(merged).filter(r=>
      r.aKey==="hour" || r.bKey==="hour" || (r.members||[]).some(m=>m.key==="hour")
    ).map(r=>{
      const x=Object.assign({},r);
      if(x.aKey==="hour"){x.aKey="transit";x.aLabel="운";}
      if(x.bKey==="hour"){x.bKey="transit";x.bLabel="운";}
      if(x.members)x.members=x.members.map(m=>m.key==="hour"?Object.assign({},m,{key:"transit",label:"운"}):m);
      return x;
    });
  }


  // 정밀 시간 보조층: 표준시를 바꾸지 않고, 사용자가 선택했을 때만
  // 경도 보정 + 균시차(EoT)로 진태양시와의 차이를 비교합니다.
  // NOAA 계열의 간단 근사식이며 역법 원국의 기본값에는 자동 적용하지 않습니다.
  function equationOfTimeMinutes(year, month, day) {
    const start = Date.UTC(year,0,1), cur = Date.UTC(year,month-1,day);
    const n = Math.floor((cur-start)/86400000)+1;
    const b = 2*Math.PI*(n-81)/364;
    return 9.87*Math.sin(2*b)-7.53*Math.cos(b)-1.5*Math.sin(b);
  }
  function trueSolarCorrectionMinutes(year,month,day,longitude,standardMeridian=135) {
    const lon=Number(longitude), sm=Number(standardMeridian);
    if(!Number.isFinite(lon)||!Number.isFinite(sm)) throw new Error("invalid longitude");
    const longitudeMinutes=4*(lon-sm);
    const equationMinutes=equationOfTimeMinutes(year,month,day);
    return {longitudeMinutes,equationMinutes,totalMinutes:longitudeMinutes+equationMinutes};
  }
  function trueSolarPreview(input, longitude, standardMeridian=135) {
    if(input.hourUnknown) return {available:false,reason:"출생시간 미상"};
    const corr=trueSolarCorrectionMinutes(input.year,input.month,input.day,longitude,standardMeridian);
    const base=Date.UTC(input.year,input.month-1,input.day,Number(input.hour)||0,Number(input.minute)||0);
    const dt=new Date(base+corr.totalMinutes*60000);
    const h=dt.getUTCHours(), mi=dt.getUTCMinutes();
    const originalBranch=hourBranchIndex(Number(input.hour)||0,Number(input.minute)||0);
    const correctedBranch=hourBranchIndex(h,mi);
    return {available:true,correction:corr,corrected:{year:dt.getUTCFullYear(),month:dt.getUTCMonth()+1,day:dt.getUTCDate(),hour:h,minute:mi},originalBranch,correctedBranch,branchChanged:originalBranch!==correctedBranch};
  }
  function boundaryDiagnostics(input) {
    const out=[];
    if(input.hourUnknown) return [{type:"hour-unknown",level:"info",text:"출생시간 미상이라 시주와 시간 민감 해석을 제외합니다."}];
    const mins=(Number(input.hour)||0)*60+(Number(input.minute)||0);
    const hourEdges=[60,180,300,420,540,660,780,900,1020,1140,1260,1380];
    const hourDist=Math.min(...hourEdges.map(x=>Math.abs(mins-x)),Math.abs(mins-1440),mins);
    if(hourDist<=40) out.push({type:"hour-boundary",level:"warn",minutes:hourDist,text:`시지 경계와 약 ${hourDist}분 이내입니다. 출생지 보정 여부에 따라 시주가 달라질 수 있습니다.`});
    const t=birthMsKst(input.year,input.month,input.day,Number(input.hour)||0,Number(input.minute)||0);
    const jy=jieMonthAndYear(input.year,input.month,input.day,Number(input.hour)||0,Number(input.minute)||0);
    const starts=[];
    for(let y=jy.yearForPillar-1;y<=jy.yearForPillar+1;y++) for(let n=0;n<24;n+=2) starts.push(solarTermMs(y,n));
    const termDist=Math.min(...starts.map(x=>Math.abs(t-x)))/60000;
    if(termDist<=720) out.push({type:"solar-term-boundary",level:"warn",minutes:Math.round(termDist),text:`절입 경계와 약 ${Math.round(termDist)}분 이내입니다. 현재 근사 절기식에서는 정밀 천문력과 월주가 달라질 가능성을 별도로 확인해야 합니다.`});
    if(mins>=22*60+20 || mins<=40) out.push({type:"day-boundary",level:"warn",text:"23시 전후는 일주 경계 기준이 유파마다 다를 수 있어 현재 엔진의 ‘23시 다음 일주’ 기준을 함께 확인하세요."});
    return out;
  }

  function normalizeEl(elCount) {
    const total = Object.values(elCount).reduce((a, b) => a + b, 0) || 1;
    const out = {};
    for (const k of ["목", "화", "토", "금", "수"]) out[k] = Math.round((elCount[k] / total) * 100);
    return out;
  }

  return {
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
    HIDDEN_STEMS,
    SINSAL_META,
    SINSAL_50_CATALOG,
    TWELVE_STAGES,
    twelveStage,
    twelveStagesForPillars,
    calendarPillars,
    flowForDate,
    chartRelations,
    relationsWithTransit,
    equationOfTimeMinutes,
    trueSolarCorrectionMinutes,
    trueSolarPreview,
    boundaryDiagnostics,
    lunarToSolar,
    lunarLeapMonth,
    lunarMonthDays,
    specialStars,
    calculate,
    normalizeEl,
    tenGod,
    pillarName,
  };
});

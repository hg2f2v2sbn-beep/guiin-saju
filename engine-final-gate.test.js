"use strict";

/**
 * 귀인사주 Engine Final Gate
 *
 * 목적
 * 1) 저장소에 이미 있던 Golden Chart 기준값을 다시 고정한다.
 * 2) 넓은 날짜 표본에서 사주 계산 구조가 깨지지 않는지 확인한다.
 * 3) 23시/자정 경계, 시간미상, 음력/윤달, 절기, 연운 API 회귀를 막는다.
 *
 * 주의
 * - 이 테스트는 저장소의 현재 기준값과 구조적 불변조건을 검증한다.
 * - 역사적 timezone/DST, 해외 출생지, 고정밀 천문 절입시각 전체를
 *   외부 역서와 대조했다는 의미는 아니다.
 */

const assert = require("assert");
const S = require("./saju-engine.js");

function ok(label, fn) {
  try {
    fn();
    console.log("PASS", label);
  } catch (err) {
    console.error("FAIL", label);
    throw err;
  }
}

function calc(input) {
  return S.calculate(Object.assign({
    name: "FINAL-GATE",
    gender: "여",
    calendar: "양력",
    hour: 12,
    minute: 0,
    hourUnknown: false,
    dayBoundary: "23",
    trueSolarApply: false
  }, input));
}

function kstMinutes(x) {
  return Date.UTC(x.year, x.month - 1, x.day, x.hour, x.minute) / 60000;
}

function assertPillar(p, label) {
  assert(p, `${label} missing`);
  assert.strictEqual(typeof p.ko, "string", `${label}.ko missing`);
  assert.strictEqual(p.ko.length, 2, `${label}.ko invalid: ${p.ko}`);
  assert(Number.isInteger(p.stemIndex) && p.stemIndex >= 0 && p.stemIndex < 10, `${label}.stemIndex invalid`);
  assert(Number.isInteger(p.branchIndex) && p.branchIndex >= 0 && p.branchIndex < 12, `${label}.branchIndex invalid`);
}

ok("필수 계산 API가 존재한다", () => {
  [
    "calculate",
    "lunarToSolar",
    "flowForDate",
    "solarTermInfo",
    "relationsWithTransit",
    "boundaryDiagnostics"
  ].forEach(name => assert.strictEqual(typeof S[name], "function", `${name} missing`));
});

/* 저장소 기존 Golden Chart에 이미 있던 기준점 */
const lunarAnchors = [
  [2026, 1, 1, false, [2026, 2, 17]],
  [2027, 1, 1, false, [2027, 2, 7]],
  [2028, 1, 1, false, [2028, 1, 27]],
  [2028, 5, 1, true,  [2028, 6, 23]]
];

for (const [y,m,d,leap,expected] of lunarAnchors) {
  ok(`음력 기준점 ${y}-${m}-${d}${leap ? " 윤달" : ""}`, () => {
    const x = S.lunarToSolar(y,m,d,leap);
    assert.deepStrictEqual([x.year,x.month,x.day], expected);
  });
}

const dayAnchors = [
  [2026,2,17,"임술"],
  [2027,2,7,"정사"],
  [2028,1,27,"신해"]
];

for (const [y,m,d,expected] of dayAnchors) {
  ok(`대표 일진 ${y}-${m}-${d} = ${expected}`, () => {
    assert.strictEqual(calc({year:y,month:m,day:d}).pillars.day.ko, expected);
  });
}

const termAnchors = [
  [2026, 2, [2,4,5,2]],
  [2026, 8, [5,5,20,49]],
  [2026,14, [8,7,20,43]],
  [2027, 2, [2,4,10,46]],
  [2028, 2, [2,4,16,31]]
];

for (const [year,index,exp] of termAnchors) {
  ok(`${year} ${S.SOLAR_TERM_NAMES[index]} 절기시각 기존 ±15분 Gate`, () => {
    const got = S.solarTermInfo(year,index).kst;
    const gotMin = kstMinutes(got);
    const expMin = Date.UTC(year,exp[0]-1,exp[1],exp[2],exp[3]) / 60000;
    const diff = Math.abs(gotMin-expMin);
    assert(diff <= 15, `절기 오차 ${diff}분 (허용 15분)`);
  });
}

ok("23시 경계 옵션은 22:59와 23:00의 일주를 바꾼다", () => {
  const a=calc({year:1991,month:11,day:23,hour:22,minute:59,dayBoundary:"23"});
  const b=calc({year:1991,month:11,day:23,hour:23,minute:0,dayBoundary:"23"});
  assert.notStrictEqual(a.pillars.day.ko,b.pillars.day.ko);
});

ok("자정 경계 옵션은 같은 날짜 22:59와 23:00의 일주를 유지한다", () => {
  const a=calc({year:1991,month:11,day:23,hour:22,minute:59,dayBoundary:"00"});
  const b=calc({year:1991,month:11,day:23,hour:23,minute:0,dayBoundary:"00"});
  assert.strictEqual(a.pillars.day.ko,b.pillars.day.ko);
});

ok("출생시간 미상은 시주를 확정하지 않고 진단을 남긴다", () => {
  const x=calc({year:1991,month:11,day:23,hourUnknown:true});
  assert.strictEqual(x.pillars.hour,null);
  const rows=x?.calculation?.boundaryDiagnostics||[];
  assert(rows.some(r=>r&&r.type==="hour-unknown"),"hour-unknown diagnostic missing");
});

ok("2026 연운은 병오로 계산된다", () => {
  const c=calc({year:1991,month:11,day:23,hour:7,minute:40});
  const f=S.flowForDate(2026,6,15,c.pillars.day.stemIndex,12,0,{dayBoundary:"23"});
  assert.strictEqual(f?.pillars?.year?.ko,"병오");
});

/*
 * 구조 Sweep
 * 정확한 사주값을 새로 '발명'하는 테스트가 아니라,
 * 다양한 연·월·일에서 계산 결과가 구조적으로 깨지지 않는지 확인한다.
 */
ok("광범위 구조 Sweep: 120건 이상 + 10천간 + 12월지 커버", () => {
  const seenDayStem=new Set();
  const seenMonthBranch=new Set();
  const seenDayPillar=new Set();
  let count=0;

  outer:
  for(let year=1988;year<=2032;year+=2){
    for(let month=1;month<=12;month++){
      for(const day of [5,15,25]){
        const x=calc({year,month,day,hour:(month*2)%24,minute:(year+month)%60});
        assertPillar(x.pillars.year,"year");
        assertPillar(x.pillars.month,"month");
        assertPillar(x.pillars.day,"day");
        assertPillar(x.pillars.hour,"hour");
        assert.strictEqual(x.dayMaster.stem,x.pillars.day.stem,"dayMaster/day pillar mismatch");
        assert(Array.isArray(x.relations),"relations must be array");

        const el=x.elCount||{};
        const elValues=["목","화","토","금","수"].map(k=>Number(el[k]||0));
        assert(elValues.every(Number.isFinite),"element count contains non-finite value");
        assert(elValues.reduce((a,b)=>a+b,0)>0,"element count total must be > 0");

        const serialized=JSON.stringify({
          pillars:x.pillars,
          dayMaster:x.dayMaster,
          elCount:x.elCount,
          relations:x.relations
        });
        assert(!serialized.includes("undefined"),"serialized result contains undefined text");

        seenDayStem.add(x.pillars.day.stemIndex);
        seenMonthBranch.add(x.pillars.month.branchIndex);
        seenDayPillar.add(x.pillars.day.ko);
        count++;

        if(count>=180 && seenDayStem.size===10 && seenMonthBranch.size===12) break outer;
      }
    }
  }

  assert(count>=120,`sample count too small: ${count}`);
  assert.strictEqual(seenDayStem.size,10,`day stem coverage ${seenDayStem.size}/10`);
  assert.strictEqual(seenMonthBranch.size,12,`month branch coverage ${seenMonthBranch.size}/12`);
  assert(seenDayPillar.size>=40,`day pillar diversity too low: ${seenDayPillar.size}`);
  console.log(`INFO structural sweep = ${count} charts, day stems 10/10, month branches 12/12, day pillars ${seenDayPillar.size}`);
});

ok("같은 입력은 핵심 계산 결과가 결정론적으로 같다", () => {
  const input={year:2001,month:7,day:19,hour:16,minute:37,gender:"남"};
  const a=calc(input), b=calc(input);
  const pick=x=>JSON.stringify({
    pillars:x.pillars,
    dayMaster:x.dayMaster,
    elCount:x.elCount,
    relations:x.relations,
    twelveStages:x.twelveStages
  });
  assert.strictEqual(pick(a),pick(b));
});

console.log("\nEngine Final Gate: ALL PASS");
console.log("NOTE: 역사적 timezone/DST·해외 출생지·고정밀 천문 절입 전체 검증은 별도 외부 역서 Gate입니다.");

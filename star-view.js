/**
 * 귀인사주 — 신살·귀인 상세 표시 모듈
 * - 50종 전체 카탈로그를 공개
 * - 현재 엔진이 실제 계산하는 38종과 유파차이로 자동판정하지 않는 12종을 명확히 구분
 * - 원국 내 성립 위치/기준/중복 개수를 표시
 * - 향후 5년은 현재 엔진과 동일한 채택표로 "세운 글자와 기준표가 다시 만나는 해"만 참고 표시
 * 신살은 원국·오행·십신·대운보다 낮은 우선순위의 보조 해석이다.
 */
(function(root, factory){
  if(typeof module === "object" && module.exports){
    module.exports = factory(require("./saju-engine.js"));
  } else {
    root.GuiinStars = factory(root.GuiinSaju);
  }
})(typeof self !== "undefined" ? self : this, function(S){
  "use strict";
  if(!S) throw new Error("GuiinSaju engine is required");

  const PILLAR_LABEL={year:"년주",month:"월주",day:"일주",hour:"시주"};
  const POSITION_MEANING={
    year:"년주는 초년의 환경, 가족·사회에서 처음 드러나는 이미지와 연결해 참고합니다.",
    month:"월주는 성장 환경과 사회생활·직업 장면에서 어떻게 나타나는지 참고합니다.",
    day:"일주는 나 자신과 아주 가까운 관계에서 체감되는 방식에 더 무게를 두고 봅니다.",
    hour:"시주는 장기 계획·후반의 관심사·내면에서 어떻게 쓰이는지 보조적으로 참고합니다."
  };
  const GROUP_ORDER=["귀인·길신","12신살","매력·관계","강한 기운","특수","지지 관계"];

  const FEATURE_META={
    "겁살":{title:"경쟁과 급한 변화에서 반응하는 힘",life:"겁살은 갑작스러운 변화나 경쟁 상황에서 에너지가 빠르게 올라오는 패턴을 참고하는 12신살입니다.",good:"결단이 필요한 순간에 망설이지 않고 움직이는 추진력, 변화에 적응하는 힘으로 쓰기 좋습니다.",watch:"조급함이나 충동적인 선택으로 번지지 않도록 속도를 한 번 조절하는 것이 중요합니다."},
    "재살":{title:"압박과 제약 속 대응력을 보는 별",life:"재살은 일이 꼬이거나 외부의 제약이 생겼을 때 어떤 방식으로 대응하는지를 참고하는 12신살입니다.",good:"문제가 생겼을 때 상황을 빠르게 파악하고 해결책을 찾는 현실 대응력으로 쓸 수 있습니다.",watch:"재살을 사고나 재난의 예고로 해석하지 않습니다. 압박을 오래 끌고 가지 않도록 도움을 요청하는 습관이 중요합니다."},
    "천살":{title:"내 힘 밖의 환경 변화에 대응하는 별",life:"천살은 내가 직접 통제하기 어려운 환경·제도·주변 사정의 변화를 어떻게 받아들이는지 참고하는 12신살입니다.",good:"예상 밖의 상황에서도 조건을 읽고 계획을 수정하는 유연성으로 활용할 수 있습니다.",watch:"나쁜 일이 생긴다는 뜻이 아닙니다. 통제할 수 없는 것에 에너지를 과하게 쓰지 않는 것이 중요합니다."},
    "지살":{title:"활동 반경과 생활 무대가 넓어지는 별",life:"지살은 새로운 장소, 사람, 환경으로 활동 범위가 넓어지는 움직임을 참고하는 12신살입니다.",good:"출장·이사·새 업무·새로운 인간관계처럼 생활 반경을 넓히는 경험에서 장점이 살아날 수 있습니다.",watch:"움직임이 많아질수록 일정과 체력 관리가 흐트러지지 않도록 생활의 중심을 잡는 편이 좋습니다."},
    "도화살":{title:"호감·표현·사람의 시선을 끄는 힘",life:"도화살은 대인관계에서 호감과 존재감, 표현력이 어떻게 드러나는지 참고하는 별입니다.",good:"서비스·영업·콘텐츠·미용·예술처럼 사람의 관심과 반응이 중요한 장면에서 강점으로 쓰기 좋습니다.",watch:"도화살이 있다고 연애가 많거나 바람기가 있다는 뜻은 아닙니다. 타인의 반응에 지나치게 흔들리지 않는 것이 중요합니다."},
    "월살":{title:"속도를 늦추고 정리하는 시기를 보는 별",life:"월살은 일이 빠르게 풀리기보다 잠시 멈춰 점검하거나 내부를 정리해야 하는 흐름을 참고하는 12신살입니다.",good:"정리·복구·재검토·준비처럼 눈에 띄지 않는 작업에 집중하면 오히려 기반을 단단하게 만들 수 있습니다.",watch:"정체를 실패로 단정하지 말고, 조급하게 결과를 내려고 무리하지 않는 편이 좋습니다."},
    "망신살":{title:"말과 행동이 바깥으로 드러나는 힘",life:"망신살은 나의 선택·표현·평판이 평소보다 더 눈에 띄게 드러나는 패턴을 참고하는 12신살입니다.",good:"발표·홍보·콘텐츠·영업처럼 나를 보여줘야 하는 장면에서는 존재감과 전달력으로 활용할 수 있습니다.",watch:"반드시 망신을 당한다는 뜻이 아닙니다. 말과 행동이 빠르게 퍼질 수 있으니 공개적인 표현은 한 번 더 확인하는 편이 좋습니다."},
    "장성살":{title:"주도권·책임·리더십이 강해지는 별",life:"장성살은 일을 이끌고 책임을 맡으려는 힘, 내 기준으로 방향을 잡으려는 성향을 참고하는 12신살입니다.",good:"리더 역할, 독립적인 업무, 결정을 내려야 하는 상황에서 추진력과 책임감으로 쓰기 좋습니다.",watch:"주도성이 강해질수록 타인의 속도와 의견을 놓치지 않도록 조율이 필요합니다."},
    "반안살":{title:"자리 잡고 기반을 굳히는 힘",life:"반안살은 변화 뒤에 자리를 잡고 생활·직업·관계의 기반을 안정시키는 힘을 참고하는 12신살입니다.",good:"직책·생활 기반·저축·루틴처럼 오래 유지할 구조를 만들 때 강점이 살아날 수 있습니다.",watch:"안정이 익숙함이나 고집으로 굳지 않도록 새로운 정보와 변화도 함께 받아들이는 편이 좋습니다."},
    "역마살":{title:"이동·변화·전환에 반응하는 힘",life:"역마살은 한 자리에만 머무르기보다 움직이고 환경을 바꿀 때 에너지가 살아나는 패턴을 참고하는 별입니다.",good:"출장·이직·이사·새 프로젝트·외부 활동처럼 변화가 필요한 장면에서 추진력으로 쓰기 좋습니다.",watch:"역마살이 있다고 반드시 이사하거나 직장을 바꿔야 하는 것은 아닙니다. 변화 자체보다 목적과 지속 가능성을 먼저 보는 편이 좋습니다."},
    "육해살":{title:"작은 엇갈림과 생활 변수에 대응하는 별",life:"12신살의 육해살은 일정·관계·생활에서 사소한 변수가 겹칠 때 어떻게 조정하는지 참고하는 별입니다.",good:"세부 문제를 빠르게 발견하고 미리 보완하는 점검 능력으로 활용할 수 있습니다.",watch:"작은 문제를 큰 불운으로 확대해 해석하지 않습니다. 일정과 약속을 구체적으로 확인하는 습관이 도움이 됩니다."},
    "화개살":{title:"몰입·감성·혼자 깊어지는 힘",life:"화개살은 혼자 깊게 생각하고 한 분야에 몰입하는 힘, 예술·연구·취향·정신적 탐구와의 연결을 참고하는 별입니다.",good:"전문기술·연구·창작·예술처럼 깊이 파고드는 일에서 집중력과 독창성으로 쓰기 좋습니다.",watch:"혼자 정리하는 시간이 길어질 때 사람과의 연결까지 끊어지지 않도록 균형을 잡는 편이 좋습니다."},

    "천을귀인":{title:"사람과 해결책이 연결되는 귀인",life:"천을귀인은 어려운 상황에서 사람·정보·제도와 연결되어 해결의 실마리를 찾는 힘을 참고하는 대표 귀인입니다.",good:"필요할 때 도움을 요청하고 좋은 인연과 협력 구조를 만드는 방향으로 쓰기 좋습니다.",watch:"귀인이 있다고 문제가 저절로 해결되는 것은 아닙니다. 도움을 받을 준비와 실제 행동이 함께 있어야 합니다."},
    "천덕귀인":{title:"갈등을 완충하고 여지를 만드는 길신",life:"천덕귀인은 관계나 상황이 거칠어질 때 한 번 더 조정할 여지를 만드는 상징으로 참고합니다.",good:"중재·배려·협상처럼 긴장을 낮추고 관계를 정리하는 힘으로 활용할 수 있습니다.",watch:"모든 갈등이 사라진다는 뜻은 아니므로 필요한 경계와 원칙은 분명히 하는 편이 좋습니다."},
    "월덕귀인":{title:"관계에서 배려와 완충을 돕는 길신",life:"월덕귀인은 사람 사이에서 한 번 더 이해하고 조정하는 힘이 어떻게 나타나는지 참고하는 길신입니다.",good:"협력·상담·서비스처럼 사람을 다루는 장면에서 부드러운 연결과 조정력으로 쓰기 좋습니다.",watch:"배려가 과해져 내 몫까지 떠안지 않도록 역할과 한계를 정하는 것이 중요합니다."},
    "문창귀인":{title:"배움·글·말·정리의 재능",life:"문창귀인은 생각을 언어와 글, 자료와 구조로 정리하는 능력을 참고하는 귀인입니다.",good:"글쓰기·설명·기획·교육·콘텐츠·시험 준비처럼 지식을 표현하는 일에서 강점으로 쓰기 좋습니다.",watch:"생각을 완벽하게 정리하려다 실행이 늦어지지 않도록 결과물을 작은 단위로 내보는 편이 좋습니다."},
    "태극귀인":{title:"탐구와 이해의 깊이를 보는 귀인",life:"태극귀인은 복잡한 주제를 오래 들여다보고 원리를 이해하려는 성향과 연결해 보는 귀인입니다.",good:"연구·분석·상담·철학적 탐구처럼 깊이 있는 이해가 필요한 분야에서 장점이 살아날 수 있습니다.",watch:"생각이 깊어질수록 현실의 선택을 미루지 않도록 판단 기준과 기한을 정하는 편이 좋습니다."},
    "천의성":{title:"돌봄·회복·보살핌에 관심이 가는 상징",life:"천의성은 사람을 돌보고 회복을 돕는 역할에 관심이 가는지 참고하는 전통 상징입니다.",good:"돌봄·서비스·상담·생활관리처럼 세심하게 살피는 일에서 장점으로 활용할 수 있습니다.",watch:"의료 적성이나 질병 여부를 판단하는 별이 아닙니다. 건강 문제는 반드시 의료적 기준으로 확인해야 합니다."},
    "건록":{title:"자기 힘으로 서려는 생활력",life:"건록은 내 힘으로 생활 기반을 만들고 유지하려는 독립성과 실무력을 참고하는 별입니다.",good:"자기 일, 독립적 역할, 꾸준한 생활 운영처럼 스스로 책임지는 장면에서 힘을 쓰기 좋습니다.",watch:"모든 것을 혼자 책임지려 하지 말고 필요한 협력은 받아들이는 편이 좋습니다."},
    "암록":{title:"겉에 잘 드러나지 않는 기반과 도움",life:"암록은 눈에 띄는 성과보다 뒤에서 받쳐주는 생활 기반·조력·관계망을 참고하는 별입니다.",good:"꾸준한 고객, 오래된 인연, 보이지 않는 준비처럼 작은 기반을 쌓는 방향으로 쓰기 좋습니다.",watch:"보이지 않는 도움만 기대하기보다 실제 계약·저축·기록처럼 확인 가능한 기반도 함께 만드는 편이 좋습니다."},
    "학당귀인":{title:"배움·자격·전문성의 축적",life:"학당귀인은 공부와 기술을 반복해서 익히고 자기 전문성을 쌓는 힘을 참고하는 귀인입니다.",good:"자격증·교육·훈련·전문기술처럼 시간이 쌓일수록 가치가 커지는 분야에서 강점이 살아날 수 있습니다.",watch:"배운 것만 쌓고 실제 활용을 미루지 않도록 실전 적용과 결과물을 함께 챙기는 편이 좋습니다."},

    "홍염살":{title:"가까운 관계에서 드러나는 개성 있는 매력",life:"홍염살은 대중적 인기보다 가까운 관계에서 취향과 감정 표현이 또렷하게 느껴지는 매력을 참고하는 별입니다.",good:"친밀한 관계, 서비스, 미적 감각, 표현 활동에서 개성과 감정 전달력을 살리기 좋습니다.",watch:"상대의 반응을 지나치게 확인하거나 관계의 감정선에 끌려가지 않도록 자기 기준을 지키는 편이 좋습니다."},
    "원진살":{title:"가까울수록 생길 수 있는 미묘한 엇갈림",life:"원진살은 서로 신경이 많이 쓰이거나 기대가 엇갈리는 관계 패턴을 참고하는 전통 관계 신호입니다.",good:"상대와 다른 지점을 빨리 알아차리고 관계의 기대치를 조정하는 계기로 활용할 수 있습니다.",watch:"원진살 하나로 이별이나 불화를 단정하지 않습니다. 추측보다 구체적인 대화가 중요합니다."},
    "귀문관살":{title:"민감한 감각과 복잡한 생각의 상징",life:"귀문관살은 남들이 지나치는 신호를 세밀하게 느끼고 생각이 깊어지는 경향을 참고하는 전통 상징입니다.",good:"관찰·상담·창작·분석처럼 미세한 차이를 읽는 일에서 감각을 활용할 수 있습니다.",watch:"피곤할 때 생각이 과해지거나 해석이 복잡해지지 않도록 사실과 추측을 나눠 보는 편이 좋습니다."},
    "고신살":{title:"혼자 해결하려는 독립 경향",life:"고신살은 관계가 있어도 중요한 문제를 혼자 감당하려는 경향이 있는지 참고하는 전통 상징입니다.",good:"혼자 집중해야 하는 일, 독립적인 판단과 책임이 필요한 장면에서 강점이 될 수 있습니다.",watch:"고독한 운명을 뜻하지 않습니다. 도움을 받을 수 있는 상황까지 혼자 버티지 않는 것이 중요합니다."},
    "과숙살":{title:"관계 안에서도 개인 공간이 필요한 경향",life:"과숙살은 가까운 관계에서도 혼자 회복하고 정리하는 시간이 중요한지 참고하는 전통 상징입니다.",good:"독립적인 생활 리듬과 자기 시간을 잘 관리하면 관계의 피로를 줄이는 데 도움이 됩니다.",watch:"혼자 있는 필요를 상대의 거절로 전달하지 않도록 이유와 시간을 미리 설명하는 편이 좋습니다."},

    "양인살":{title:"밀어붙이는 힘과 강한 결단",life:"양인살은 필요할 때 강하게 결단하고 밀어붙이는 힘이 어떻게 나타나는지 참고하는 별입니다.",good:"긴급한 판단, 경쟁, 독립적인 실행처럼 빠른 추진력이 필요한 장면에서 장점으로 쓸 수 있습니다.",watch:"힘이 강할수록 타인의 속도를 놓치기 쉬우므로 중요한 결정은 한 번 더 확인하는 편이 좋습니다."},
    "괴강살":{title:"기준이 강하고 쉽게 꺾이지 않는 힘",life:"괴강살은 책임을 잡고 버티는 힘, 자기 기준이 뚜렷한 성향을 참고하는 전통 표식입니다.",good:"책임자 역할, 전문 분야, 어려운 일을 끝까지 마무리하는 장면에서 강점으로 쓰기 좋습니다.",watch:"내 기준만 정답이 되면 관계 피로가 커질 수 있어 다른 방식도 인정하는 유연성이 필요합니다."},
    "백호살":{title:"강한 압력 속 집중과 대응을 보는 표식",life:"백호살은 압박이 큰 상황에서 집중력이 강하게 올라오는 패턴을 참고하는 전통 표식입니다.",good:"위기 대응, 책임감, 빠른 정리처럼 집중이 필요한 장면에서 힘으로 활용할 수 있습니다.",watch:"사고나 질병을 예언하는 별로 사용하지 않습니다. 실제 안전과 건강은 현실적인 기준으로 관리해야 합니다."},
    "현침살":{title:"세밀함과 날카로운 관찰의 상징",life:"현침살은 작은 차이를 잘 보고 말이나 손기술이 정교해지는 성향을 참고하는 전통 상징입니다.",good:"정밀 작업, 분석, 디자인, 기술, 교정처럼 세밀함이 필요한 일에서 장점이 살아날 수 있습니다.",watch:"판단과 표현이 너무 날카로워지면 상대가 공격적으로 느낄 수 있으니 전달 방식을 부드럽게 조절하는 편이 좋습니다."},

    "공망":{title:"익숙한 방식과 다르게 체감되는 빈자리",life:"공망은 어떤 영역이 없어진다는 뜻이 아니라, 그 영역을 일반적인 방식과 다르게 느끼거나 채우는 경향을 참고하는 전통 개념입니다.",good:"기존 방식에 집착하지 않고 다른 방법을 찾는 유연성이나 독특한 관점으로 활용할 수 있습니다.",watch:"공망 하나로 실패·상실을 단정하지 않습니다. 실제 원국 구조와 대운을 함께 봐야 합니다."},
    "천라지망":{title:"얽힌 책임과 복잡한 조건을 보는 조합",life:"천라지망은 여러 조건이 겹쳐 일이 단순하게 풀리지 않는 느낌을 참고하는 전통 지지 조합입니다.",good:"복잡한 이해관계와 책임을 정리하고 순서를 세우는 능력으로 활용할 수 있습니다.",watch:"구속·사고 같은 사건을 예언하는 의미로 쓰지 않습니다. 복잡한 문제를 한 번에 해결하려 하지 않는 것이 좋습니다."},
    "삼기":{title:"천간 세 글자가 특별하게 모이는 조합",life:"삼기는 특정 천간 조합이 원국 안에서 함께 성립하는지 확인하는 전통 표식입니다.",good:"서로 다른 능력이나 역할을 하나의 결과로 묶는 힘을 참고하는 보조 상징으로 활용할 수 있습니다.",watch:"삼기가 있다고 성공을 보장하거나 특별한 운명을 확정하는 것은 아닙니다."},

    "형살":{title:"반복 자극과 긴장을 보는 지지 관계",life:"형살은 비슷한 문제가 되풀이되거나 특정 관계에서 자꾸 같은 지점이 자극되는지 참고하는 지지 관계입니다.",good:"반복되는 문제를 발견하고 규칙·루틴을 다시 만드는 계기로 활용할 수 있습니다.",watch:"형살을 처벌·사고의 예고로 해석하지 않습니다. 반복 패턴을 현실적으로 조정하는 것이 핵심입니다."},
    "충살":{title:"정면 변화와 방향 전환을 보는 관계",life:"충살은 두 지지가 정면으로 부딪치며 이동·교체·변화가 커지는지 참고하는 관계 신호입니다.",good:"정체된 상황을 바꾸거나 새로운 선택을 시작하는 계기로 활용할 수 있습니다.",watch:"충이 있다고 무조건 나쁜 일이 생기는 것은 아닙니다. 변화의 속도와 준비 정도를 함께 봐야 합니다."},
    "파살":{title:"기존 리듬을 다시 짜는 관계",life:"파살은 익숙한 흐름이 끊기거나 기존 약속·방식이 재조정되는 패턴을 참고하는 지지 관계입니다.",good:"맞지 않는 방식이나 오래된 습관을 정리하고 새 구조를 만드는 계기로 쓸 수 있습니다.",watch:"작은 어긋남을 관계 전체의 실패로 확대하지 말고 무엇을 다시 맞출지 구체적으로 보는 편이 좋습니다."},
    "해살":{title:"겉보다 안쪽의 미세한 오해를 보는 관계",life:"해살은 큰 충돌보다 서로의 해석 차이와 미묘한 불편이 쌓이는지 참고하는 지지 관계입니다.",good:"상대가 다르게 받아들일 수 있는 지점을 미리 확인하고 소통 방식을 세밀하게 조정하는 데 활용할 수 있습니다.",watch:"추측을 사실처럼 받아들이지 말고 중요한 내용은 직접 확인하는 것이 좋습니다."},
    "삼합":{title:"세 지지가 한 방향으로 모이는 조합",life:"삼합은 여러 지지가 같은 기운의 흐름으로 모여 특정 성향이나 활동 주제가 강화되는지 참고하는 전통 지지 관계입니다.",good:"원국의 강점을 한 분야에 집중하거나 여러 자원을 같은 목표로 묶는 힘으로 활용할 수 있습니다.",watch:"한 방향이 강해질수록 다른 영역이 상대적으로 약해질 수 있으므로 균형을 함께 보는 편이 좋습니다."}
  };

  const UNSUPPORTED_REASON={
    "복성귀인":"통용되는 기준표가 여러 형태로 전해져 현재 엔진에서는 한 유파를 임의 채택하지 않습니다.",
    "금여성":"일간·일주 등을 기준으로 하는 서로 다른 표가 있어 현재 엔진에서는 자동 판정하지 않습니다.",
    "관귀학관":"명칭과 성립표의 전승 차이가 있어 현재 엔진에서는 자동 판정하지 않습니다.",
    "천문성":"월지·일지 등 기준이 갈리는 표가 있어 현재 엔진에서는 자동 판정하지 않습니다.",
    "협록":"록의 확장 해석 방식에 유파 차이가 있어 현재 엔진에서는 자동 판정하지 않습니다.",
    "문곡귀인":"문창과 별도로 보는 기준표가 유파마다 달라 현재 엔진에서는 자동 판정하지 않습니다.",
    "고란살":"특정 일주 목록의 범위가 유파마다 달라 현재 엔진에서는 자동 판정하지 않습니다.",
    "탕화살":"성립표와 적용 범위가 유파마다 달라 현재 엔진에서는 자동 판정하지 않습니다.",
    "낙정관살":"전승되는 기준표가 통일되지 않아 현재 엔진에서는 자동 판정하지 않습니다.",
    "월공":"월지·월간 등을 이용하는 기준 차이가 있어 현재 엔진에서는 자동 판정하지 않습니다.",
    "상문살":"세운·상장례 해석까지 섞이는 유파 차이가 커 원국 자동 판정에서 제외합니다.",
    "조객살":"세운·상장례 해석까지 섞이는 유파 차이가 커 원국 자동 판정에서 제외합니다."
  };

  // Engine과 동일한 채택표. 향후 5년의 세운 천간/지지가 이 표와 일치하는지만 참고 표시한다.
  const PEACH={8:9,0:9,4:9,2:3,6:3,10:3,5:6,9:6,1:6,11:0,3:0,7:0};
  const HORSE={8:2,0:2,4:2,2:8,6:8,10:8,5:11,9:11,1:11,11:5,3:5,7:5};
  const CANOPY={8:4,0:4,4:4,2:10,6:10,10:10,5:1,9:1,1:1,11:7,3:7,7:7};
  const NOBLE={0:[1,7],4:[1,7],6:[1,7],1:[0,8],5:[0,8],2:[11,9],3:[11,9],7:[2,6],8:[3,5],9:[3,5]};
  const LITERARY={0:5,1:6,2:8,3:9,4:8,5:9,6:11,7:0,8:2,9:3};
  const TAIJI={0:[0,6],1:[0,6],2:[3,9],3:[3,9],4:[4,10,1,7],5:[4,10,1,7],6:[2,11],7:[2,11],8:[5,8],9:[5,8]};
  const HONGYEOM={0:6,1:8,2:2,3:6,4:4,5:4,6:10,7:9,8:0,9:8};
  const BLADE={0:3,1:2,2:6,3:5,4:6,5:5,6:9,7:8,8:0,9:11};
  const GEONROK={0:2,1:3,2:5,3:6,4:5,5:6,6:8,7:9,8:11,9:0};
  const AMROK={0:11,1:10,2:8,3:7,4:8,5:7,6:5,7:4,8:2,9:1};
  const HAKDANG={0:11,1:6,2:2,3:9,4:2,5:9,6:5,7:0,8:8,9:3};
  const CHEONDEOK={2:["stem",3],3:["branch",8],4:["stem",8],5:["stem",7],6:["branch",11],7:["stem",0],8:["stem",9],9:["branch",2],10:["stem",2],11:["stem",1],0:["branch",5],1:["stem",6]};
  const WOLDEOK={2:2,6:2,10:2,11:0,3:0,7:0,8:8,0:8,4:8,5:6,9:6,1:6};
  const TWELVE_NAMES=["겁살","재살","천살","지살","도화살","월살","망신살","장성살","반안살","역마살","육해살","화개살"];
  const TWELVE_START={8:5,0:5,4:5,2:11,6:11,10:11,5:2,9:2,1:2,11:8,3:8,7:8};

  function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));}
  function uniq(arr){return [...new Set(arr)];}
  function presentGroups(c){
    const out={};
    (c.stars?.hits||[]).forEach(h=>{
      if(!out[h.name]) out[h.name]=[];
      out[h.name].push(h);
    });
    return out;
  }
  function uniquePositionRows(hits){
    const seen=new Set();
    return (hits||[]).filter(h=>{
      const k=`${h.pillar}|${h.basis||""}`; if(seen.has(k))return false;seen.add(k);return true;
    });
  }
  function groupCounts(c){
    const rows=(c.stars?.catalogue||[]);
    const m={}; GROUP_ORDER.forEach(g=>m[g]=0);
    rows.forEach(x=>{if(x.count>0)m[x.group]=(m[x.group]||0)+x.count;});
    return m;
  }
  function feature(name, meta){
    return FEATURE_META[name]||{
      title:(meta&&meta.short)||"전통 명리의 보조 상징",
      life:"원국 전체와 함께 이 항목이 어떤 생활 장면에서 반복되는지 참고합니다.",
      good:"강점으로 쓸 수 있는 장면을 원국·십신·대운과 함께 확인합니다.",
      watch:"이 항목 하나만으로 사건이나 성격을 단정하지 않습니다."
    };
  }
  function positionsNarrative(rows){
    const ps=uniq(rows.map(h=>h.pillar).filter(Boolean));
    if(!ps.length)return "성립 위치 정보가 없습니다.";
    return ps.map(p=>POSITION_MEANING[p]||`${PILLAR_LABEL[p]||p}에서 성립합니다.`).join(" ");
  }
  function starCard(name,hits){
    const rows=uniquePositionRows(hits), meta=rows[0]?.meta||S.SINSAL_META?.[name]||{}, f=feature(name,meta);
    const where=rows.map(h=>`${PILLAR_LABEL[h.pillar]||h.pillar} · ${h.basis||"기준표"}`);
    const count=rows.length;
    return `<article class="sinsalDetail card">
      <div class="sinsalTop">
        <div><span>${esc(meta.group||"신살·귀인")}</span><h3>${esc(name)} · ${esc(f.title)}</h3></div>
        <b>${count}곳</b>
      </div>
      <p>${esc(f.life)} ${esc(positionsNarrative(rows))}</p>
      <div class="sinsalUse"><strong>좋게 쓰면</strong><span>${esc(f.good)}</span></div>
      <div class="sinsalWatch"><strong>주의해서 보면</strong><span>${esc(f.watch)}</span></div>
      <div class="sinsalEvidence"><b>성립 위치·근거</b> · ${where.map(esc).join(" / ")}</div>
    </article>`;
  }

  function twelveName(baseBranch, transitBranch){
    const start=TWELVE_START[baseBranch];
    if(start===undefined)return null;
    return TWELVE_NAMES[(transitBranch-start+12)%12];
  }
  function annualActivations(c, year){
    // 7월 1일은 입춘 이후라 해당 연도의 세운 연주 확인에 안전한 기준일이다.
    const f=S.flowForDate(year,7,1,c.pillars.day.stemIndex,12,0,{});
    const yp=f.pillars.year, b=yp.branchIndex, st=yp.stemIndex;
    const ds=c.pillars.day.stemIndex, yb=c.pillars.year.branchIndex, db=c.pillars.day.branchIndex, mb=c.pillars.month.branchIndex;
    const names=[];
    const y12=twelveName(yb,b), d12=twelveName(db,b);
    if(y12)names.push(y12);
    if(d12)names.push(d12);
    if(PEACH[yb]===b||PEACH[db]===b)names.push("도화살");
    if(HORSE[yb]===b||HORSE[db]===b)names.push("역마살");
    if(CANOPY[yb]===b||CANOPY[db]===b)names.push("화개살");
    if((NOBLE[ds]||[]).includes(b))names.push("천을귀인");
    if(LITERARY[ds]===b)names.push("문창귀인");
    if((TAIJI[ds]||[]).includes(b))names.push("태극귀인");
    if(HONGYEOM[ds]===b)names.push("홍염살");
    if(BLADE[ds]===b)names.push("양인살");
    if(GEONROK[ds]===b)names.push("건록");
    if(AMROK[ds]===b)names.push("암록");
    if(HAKDANG[ds]===b)names.push("학당귀인");
    if(((mb+11)%12)===b)names.push("천의성");
    const td=CHEONDEOK[mb];
    if(td && ((td[0]==="stem"&&td[1]===st)||(td[0]==="branch"&&td[1]===b))) names.push("천덕귀인");
    if(WOLDEOK[mb]===st)names.push("월덕귀인");
    return {year,pillar:yp.ko,god:f.gods.year,names:uniq(names)};
  }
  function futureFive(c,startYear){
    const y=startYear||new Date().getFullYear();
    return Array.from({length:5},(_,i)=>annualActivations(c,y+i));
  }

  function catalogueRow(x){
    const meta=S.SINSAL_META?.[x.name]||{};
    const supported=x.status==="calculated";
    let state="";
    if(supported && x.count>0) state=`<b class="catOn">원국 ${x.count}곳</b>`;
    else if(supported) state=`<b class="catOff">원국 미성립</b>`;
    else state=`<b class="catSchool">유파차이</b>`;
    const desc=supported
      ? (feature(x.name,meta).life||meta.short||"전통 명리의 보조 상징입니다.")
      : (UNSUPPORTED_REASON[x.name]||"유파별 성립 기준이 달라 현재 엔진에서는 자동 판정하지 않습니다.");
    return `<div class="sinsalCatalogRow" data-status="${supported?"calculated":"school-dependent"}">
      <div class="catName"><strong>${esc(x.name)}</strong><span>${esc(x.group)}</span></div>
      <div class="catDesc">${esc(desc)}</div>
      <div class="catState">${state}</div>
    </div>`;
  }

  function render(c,opts){
    opts=opts||{};
    const groups=presentGroups(c), names=Object.keys(groups);
    const counts=groupCounts(c);
    const cat=c.stars?.catalogue||S.SINSAL_50_CATALOG.map(x=>({...x,count:0,status:"school-dependent"}));
    const supported=c.stars?.supportedCount||cat.filter(x=>x.status==="calculated").length;
    const totalCatalog=c.stars?.catalogCount||cat.length||50;
    const placement=c.stars?.total||0;
    const future=futureFive(c,opts.startYear||new Date().getFullYear());

    return `<section class="sinsalDeep">
      <div class="sinsalHero card">
        <div class="sinsalEyebrow">신살·귀인 상세</div>
        <h2>${esc(c.input.name||"사용자")}님에게 실제로 잡힌 별부터 봅니다.</h2>
        <p>신살의 이름이 많다고 좋은 사주, 적다고 나쁜 사주가 아닙니다. 먼저 원국·월령·오행·십신을 읽고 신살은 마지막에 보조 근거로 붙입니다.</p>
        <div class="sinsalNumbers">
          <div><span>실제 계산 범위</span><b>${supported}<small> / ${totalCatalog}종</small></b></div>
          <div><span>원국 성립 종류</span><b>${names.length}<small>종</small></b></div>
          <div><span>성립 위치 합계</span><b>${placement}<small>곳</small></b></div>
        </div>
      </div>

      <div class="sinsalGroupSummary">
        ${GROUP_ORDER.map(g=>`<div class="sinsalGroup card"><span>${esc(g)}</span><b>${counts[g]||0}곳</b></div>`).join("")}
      </div>

      <div class="sinsalSectionHead">
        <span>내 원국에서 성립한 별</span>
        <h2>어디에 있고, 어떻게 쓰이는지</h2>
        <p>같은 별도 년주·월주·일주·시주 중 어디에 있는지에 따라 체감되는 생활 장면을 다르게 참고합니다.</p>
      </div>
      ${names.length ? names.sort((a,b)=>(groups[b].length-groups[a].length)).map(n=>starCard(n,groups[n])).join("") :
        `<div class="sinsalEmpty card"><h3>현재 원국에서 계산된 신살·귀인이 없습니다.</h3><p>신살이 적다는 것은 길흉의 평가가 아닙니다. 원국·십신·대운이 더 중요한 판단 기준입니다.</p></div>`}

      <div class="sinsalSectionHead futureHead">
        <span>세운 참고</span>
        <h2>앞으로 5년, 같은 기준표가 다시 만나는 해</h2>
        <p>아래는 세운의 천간·지지가 현재 엔진의 신살 기준표와 다시 일치하는지만 보여줍니다. 실제 사건 발생 시기를 예언하는 기능이 아닙니다.</p>
      </div>
      <div class="sinsalFuture">
        ${future.map(y=>`<div class="sinsalYear card">
          <div class="yearTop"><b>${y.year}</b><span>${esc(y.pillar)} · ${esc(y.god||"")}</span></div>
          <div class="yearTags">${y.names.length?y.names.map(n=>`<span>${esc(n)}</span>`).join(""):`<span class="muted">주요 기준표 재등장 없음</span>`}</div>
        </div>`).join("")}
      </div>
      <div class="sinsalTimingNote card"><b>시기를 읽는 순서</b><p>신살이 다시 들어오는 해보다 먼저 현재 대운과 세운의 십신, 원국과의 합·충·형·파·해를 봅니다. 같은 도화·역마라도 실제 생활에서는 연애가 아니라 영업, 이직, 이동, 콘텐츠 활동처럼 전혀 다른 장면으로 나타날 수 있습니다.</p></div>

      <div class="sinsalSectionHead catalogHead">
        <span>50종 전체 백과</span>
        <h2>계산하는 별과 계산하지 않는 별을 숨기지 않습니다.</h2>
        <p>현재 공식화한 38종은 실제 계산하고, 기준이 충분히 통일되지 않은 12종은 이름만 보여주며 결과를 만들어내지 않습니다.</p>
      </div>
      <div class="sinsalCatalog card">
        ${GROUP_ORDER.map(g=>{
          const rows=cat.filter(x=>x.group===g);
          return `<div class="catalogGroup"><h3>${esc(g)} <small>${rows.length}종</small></h3>${rows.map(catalogueRow).join("")}</div>`;
        }).join("")}
      </div>
      <div class="sinsalDisclaimer card"><b>해석 원칙</b><p>신살 하나로 결혼·이별·재물·질병·사고·성공을 확정하지 않습니다. 유파가 갈리는 별은 계산했다고 표시하지 않으며, 건강 문제는 사주가 아니라 의료적 기준으로 확인해야 합니다.</p></div>
    </section>`;
  }

  return {render,presentGroups,annualActivations,futureFive,UNSUPPORTED_REASON};
});

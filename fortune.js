/* fortune.js — interpretation content + scoring, shared by index.html (browser)
 * and scripts/daily.js (node, GitHub Actions). Depends on the Saju engine object
 * being passed in (no globals), so it stays testable in both environments. */
(function (global) {
  'use strict';

  var ILGAN_TXT = {
    '갑':'하늘로 곧게 뻗은 큰 나무의 기운입니다. 시작하는 힘과 추진력이 남다르고, 어떤 조직에서든 자연스럽게 앞자리에 서게 되는 리더형입니다. 자존심이 강해 굽히는 것을 어려워하지만, 그 곧음이 곧 신뢰가 됩니다. 가끔은 바람에 흔들려 주는 유연함을 배우면 더 크게 자랍니다.',
    '을':'부드럽게 감아 오르는 덩굴과 화초의 기운입니다. 어떤 환경에서도 살아남는 적응력과 현실 감각이 뛰어나고, 사람의 마음을 읽는 섬세함이 있습니다. 겉은 온화하지만 속은 누구보다 질기고 강인합니다. 기댈 곳을 잘 고르는 지혜가 곧 당신의 생존 전략입니다.',
    '병':'세상을 고루 비추는 태양의 기운입니다. 밝고 열정적이며 표현이 시원시원해서 주변을 환하게 만듭니다. 숨기는 것이 없고 뒤끝도 없지만, 그만큼 감정이 얼굴에 다 드러납니다. 꾸준함이 더해지면 그 빛은 한 시절이 아니라 평생을 갑니다.',
    '정':'어둠을 밝히는 촛불과 달빛의 기운입니다. 겉은 조용하지만 속에는 꺼지지 않는 온기가 있고, 한 사람 한 사람을 깊게 살피는 헌신형입니다. 통찰력이 예리해 남들이 놓치는 것을 봅니다. 자신을 태워 남을 비추는 만큼, 스스로를 돌보는 시간도 반드시 필요합니다.',
    '무':'흔들리지 않는 큰 산의 기운입니다. 묵직한 신용과 포용력으로 사람들이 기대어 오는 맏이 같은 존재입니다. 쉽게 움직이지 않는 대신 한번 정하면 끝까지 갑니다. 다만 고집이 산처럼 쌓이면 소통이 막히니, 가끔은 길을 내어 주세요.',
    '기':'만물을 길러내는 기름진 밭의 기운입니다. 실속과 실용을 아는 현실주의자이면서, 무언가를 가꾸고 키우는 데 재능이 있습니다. 겉으로 드러나지 않게 일을 완성하는 타입이라 공을 뺏기기 쉬우니, 자기 몫은 분명히 챙기세요.',
    '경':'단단한 무쇠와 바위의 기운입니다. 결단력과 의리가 있고, 한번 뜻을 세우면 밀어붙이는 힘이 강합니다. 옳고 그름이 분명해 주변이 든든해하지만, 그 강직함이 때로 날카로움으로 느껴질 수 있습니다. 무쇠는 두드려질수록 명검이 됩니다.',
    '신':'세공을 마친 보석의 기운입니다. 예리한 감각과 완벽주의, 세련된 취향을 타고났습니다. 디테일에 강하고 명예를 소중히 여기지만, 스스로에게도 남에게도 기준이 높아 피로해지기 쉽습니다. 흠집을 두려워하기보다 빛나는 법에 집중하세요.',
    '임':'모든 것을 품는 바다와 큰 강의 기운입니다. 스케일이 크고 지혜로우며, 막힌 곳을 돌아가는 유연함이 있습니다. 속을 다 보여주지 않아 신비로운 인상을 주지만, 품은 뜻은 누구보다 깊습니다. 방향을 정한 물은 결국 바다에 닿습니다.',
    '계':'새벽 이슬과 맑은 샘물의 기운입니다. 감수성과 총명함이 빼어나고, 소리 없이 스며들어 사람과 상황을 움직입니다. 여리고 온화해 보여도 물방울이 바위를 뚫듯 지속력이 강합니다. 감정이 마르지 않도록 자기만의 샘을 지키세요.'
  };
  var TG_DAY = {
    '비견':'나와 어깨를 나란히 하는 기운이 들어오는 날입니다. 동료·친구와의 협력에서 힘을 얻지만, 주도권 다툼이나 불필요한 경쟁심은 금물입니다. 함께 가되 중심은 내가 잡으세요.',
    '겁재':'재물이 새어 나가기 쉬운 날입니다. 충동구매나 즉흥적인 약속, 보증·대여 같은 부탁은 한 박자 쉬고 결정하세요. 경쟁 상황에서는 정면승부보다 한 걸음 물러서는 것이 이득입니다.',
    '식신':'몸과 마음에 여유가 도는 날입니다. 먹을 복과 즐길 복이 따르니 좋은 사람들과 맛있는 식사를 함께해 보세요. 창의적인 아이디어가 자연스럽게 흘러나와 일에서도 성과로 이어집니다.',
    '상관':'표현력이 폭발하는 날입니다. 아이디어와 말솜씨가 빛나지만, 윗사람이나 규칙과 부딪히기 쉬우니 말은 한 번 걸러서 하세요. 창작·기획·발표에는 최고의 날입니다.',
    '편재':'뜻밖의 재물 기회가 스치는 날입니다. 눈썰미가 빨라지고 사교운도 좋아 사람을 통해 기회가 들어옵니다. 다만 큰돈이 움직이는 결정은 흐름만 확인하고, 무리한 투자는 피하세요.',
    '정재':'성실함이 그대로 결실로 돌아오는 날입니다. 꾸준히 해 온 일에서 안정적인 이익이 생기고, 금전 관리 감각도 좋아집니다. 계획했던 저축·정리를 실행하기에 좋습니다.',
    '편관':'긴장감이 감도는 날입니다. 예상치 못한 업무나 책임이 몰려올 수 있지만, 정면으로 부딪치면 오히려 실력을 인정받는 계기가 됩니다. 몸의 피로가 쌓이기 쉬우니 휴식도 챙기세요.',
    '정관':'품격과 명예가 빛나는 날입니다. 윗사람의 신임을 얻기 좋고, 공적인 자리에서 존재감이 드러납니다. 원칙대로 움직이면 모든 일이 순조롭게 풀립니다.',
    '편인':'생각이 많아지는 날입니다. 직관과 통찰이 예리해져 공부·연구·기획에는 좋지만, 혼자만의 생각에 빠져 결정을 미루기 쉽습니다. 머리가 복잡할 땐 산책이 약입니다.',
    '정인':'귀인의 도움이 함께하는 날입니다. 문서·계약·시험·승인과 관련된 일에 청신호가 켜지고, 어른이나 선배의 조언이 큰 힘이 됩니다. 배움에 투자하기 가장 좋은 날입니다.'
  };
  var REL_TXT = {
    '육합':' 지지가 합(合)을 이루어 주변과의 호흡이 잘 맞고, 인연이 부드럽게 이어집니다.',
    '삼합':' 삼합(三合)의 기운으로 협력과 팀워크에서 시너지가 크게 일어납니다.',
    '충':' 다만 충(沖)의 기운이 있어 일정 변경·이동·돌발 변수가 생기기 쉽습니다. 중요한 결정은 서두르지 마세요.',
    '형':' 다만 형(刑)의 기운이 있어 사소한 갈등이나 구설이 붙기 쉽습니다. 감정 대응은 금물입니다.',
    '파':' 다만 파(破)의 기운이 있어 계획에 작은 틈이 생길 수 있습니다. 한 번 더 확인하는 것이 안전합니다.',
    '해':' 다만 해(害)의 기운이 있어 가까운 사람과의 오해를 조심하세요. 말 한마디가 관계를 좌우합니다.'
  };
  var YEAR_TG = {
    '비견':'협력과 연대의 해입니다. 함께할 사람을 얻는 만큼, 동업·금전 문제는 선을 분명히 그어야 합니다.',
    '겁재':'경쟁과 지출이 늘어나는 해입니다. 큰돈의 움직임은 보수적으로, 실력을 쌓는 데 집중하면 손해가 투자로 바뀝니다.',
    '식신':'재능이 피어나고 먹을 복이 따르는 해입니다. 즐기면서 하는 일이 성과가 되고, 건강운도 함께 좋아집니다.',
    '상관':'끼와 표현력이 폭발하는 해입니다. 새로운 시도와 창작에는 최고이지만, 조직·규칙과의 마찰은 조심해야 합니다.',
    '편재':'활동 반경이 넓어지고 재물의 기회가 많아지는 해입니다. 발로 뛴 만큼 돌아오지만, 한탕주의는 금물입니다.',
    '정재':'성실의 결실을 거두는 해입니다. 수입이 안정되고 재물 관리 능력이 빛나며, 인생의 기반을 다지기 좋습니다.',
    '편관':'도전과 시험대의 해입니다. 압박이 크지만 이를 통과하면 지위가 한 단계 오릅니다. 건강 관리가 승부처입니다.',
    '정관':'명예와 인정의 해입니다. 승진·합격·계약 등 공적인 성취운이 강하니, 원칙을 지키며 정공법으로 가세요.',
    '편인':'공부와 성찰의 해입니다. 자격증·연구·기술 습득에 유리하지만, 생각이 많아 실행이 늦어질 수 있습니다.',
    '정인':'귀인과 문서운이 함께하는 해입니다. 배움·계약·승인에 청신호가 켜지고, 윗사람의 도움이 결정적 역할을 합니다.'
  };
  var CAT_TXT = {
    love:{hi:['설레는 기류가 흐릅니다. 마음을 표현하면 좋은 답이 돌아오는 날입니다.','상대의 마음이 당신에게 기울어 있습니다. 먼저 연락해 보세요.'],
          mid:['잔잔한 흐름입니다. 무리한 이벤트보다 편안한 대화가 관계를 깊게 합니다.','평온한 하루입니다. 있는 그대로의 모습이 가장 큰 매력이 됩니다.'],
          lo:['사소한 말이 오해를 부르기 쉽습니다. 오늘은 듣는 쪽에 서 보세요.','감정 기복이 관계에 옮겨가지 않도록 한 템포 쉬어 가세요.']},
    money:{hi:['금전의 흐름이 트이는 날입니다. 미뤄 둔 정산·재테크 점검에 좋습니다.','수입의 기회가 엿보입니다. 다만 들뜬 소비는 이익을 도로 깎습니다.'],
          mid:['들어오고 나가는 것이 비슷한 날입니다. 계획된 지출만 지키면 무난합니다.','큰 이득도 손해도 없는 날입니다. 지갑 관리의 기본기를 지키세요.'],
          lo:['충동구매·보증·즉흥 투자 모두 금물입니다. 오늘 아낀 돈이 내일의 기회가 됩니다.','돈보다 신용이 새기 쉬운 날입니다. 금전 약속은 신중히 하세요.']},
    work:{hi:['능력을 인정받는 날입니다. 미뤄 둔 보고·제안을 오늘 꺼내 보세요.','윗사람의 시선이 호의적입니다. 책임 있는 태도가 기회로 이어집니다.'],
          mid:['맡은 일을 담담히 해내는 것이 최선인 날입니다. 무리한 확장은 금물입니다.','루틴을 지키면 중간 이상은 가는 날입니다. 협업 조율에 신경 쓰세요.'],
          lo:['의욕만 앞서면 마찰이 생깁니다. 오늘은 조율과 경청이 실력입니다.','결재·발표 등 공적인 일은 가능하면 미루세요. 오늘은 다듬는 날입니다.']},
    study:{hi:['집중력이 최고조인 날입니다. 어려운 개념도 오늘은 머리에 잘 들어옵니다.','배움의 운이 열렸습니다. 미뤄 둔 공부나 자격증 준비를 시작해 보세요.'],
          mid:['평소만큼은 되는 날입니다. 복습과 정리 위주로 가면 알차게 남습니다.','짧게 여러 번 끊어 공부하는 것이 오늘의 효율을 살립니다.'],
          lo:['집중이 흩어지기 쉬운 날입니다. 욕심내지 말고 분량을 줄여 확실히 잡으세요.','암기보다 이해 위주로, 공부 환경부터 정리하면 흐름이 돌아옵니다.']},
    health:{hi:['컨디션이 가볍게 올라오는 날입니다. 미뤄 둔 운동을 시작하기 좋습니다.','활력이 도는 하루입니다. 몸을 움직일수록 운이 함께 돕니다.'],
          mid:['무난한 컨디션이지만 과로는 금물입니다. 수면 리듬을 지키세요.','큰 탈은 없는 날입니다. 물을 자주 마시고 스트레칭을 챙기세요.'],
          lo:['피로가 쌓이기 쉬운 날입니다. 무리한 일정은 덜어내고 일찍 쉬세요.','면역이 떨어지기 쉬우니 찬 음식과 과음은 피하는 것이 좋습니다.']}
  };
  var TG_FX = {
    '비견':{tot:5, love:0, money:-8, work:5, study:2, health:5},
    '겁재':{tot:-5, love:-5, money:-15, work:0, study:-2, health:0},
    '식신':{tot:10, love:10, money:8, work:5, study:6, health:12},
    '상관':{tot:2, love:6, money:5, work:-12, study:4, health:0},
    '편재':{tot:6, love:10, money:14, work:0, study:-6, health:-4},
    '정재':{tot:10, love:6, money:16, work:6, study:-4, health:2},
    '편관':{tot:-8, love:-4, money:-5, work:6, study:0, health:-10},
    '정관':{tot:10, love:6, money:2, work:16, study:6, health:2},
    '편인':{tot:0, love:-6, money:-4, work:2, study:10, health:-6},
    '정인':{tot:10, love:5, money:2, work:12, study:14, health:6}
  };
  var REL_FX = {'육합':10,'삼합':8,'충':-14,'형':-9,'파':-6,'해':-6};
  var ELEM_DESC = ['성장·시작·기획','열정·표현·확산','신뢰·중심·안정','결단·원칙·마무리','지혜·유연함·저장'];
  var ELEM_LACK = [
    '시작하는 힘이 약해질 수 있으니, 작은 일이라도 먼저 벌이는 연습이 운을 틔웁니다. 초록색 소품과 식물이 도움이 됩니다.',
    '표현과 추진의 불씨가 약해질 수 있습니다. 생각을 말로 꺼내고 몸을 데우는 활동(운동·햇볕)이 기운을 살립니다.',
    '중심이 흔들리기 쉬우니 루틴과 약속으로 기반을 다지세요. 노란색·황토색 계열이 안정감을 더합니다.',
    '맺고 끊는 결단이 약해질 수 있습니다. 마감일을 정하고 정리·정돈하는 습관이 금 기운을 보충합니다.',
    '쉬어가는 지혜가 부족해지기 쉽습니다. 충분한 수면과 독서, 검정·파랑 계열 아이템이 물의 기운을 채웁니다.'
  ];
  var LUCKY_COLOR = ['초록', '빨강', '노랑', '흰색', '네이비'];
  var LUCKY_DIR = ['동쪽', '남쪽', '중앙', '서쪽', '북쪽'];
  var LUCKY_NUM = [[3,8],[2,7],[5,10],[4,9],[1,6]];
  var CATS = [
    {key:'love', label:'애정운'}, {key:'money', label:'재물운'},
    {key:'work', label:'직장운'}, {key:'study', label:'학업운'}, {key:'health', label:'건강운'}
  ];

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function jitter(S, seed) { return Math.floor(S.rand01(seed) * 15) - 7; }
  function pick(S, arr, seed) { return arr[Math.floor(S.rand01(seed) * arr.length) % arr.length]; }

  // Deterministic daily fortune for chart `res` (from S.compute(input)) on KST date t {y,mo,d}.
  function daily(S, res, input, t) {
    var tp = S.pillarOfDate(t.y, t.mo, t.d);
    var ds = res.day.stem;
    var tg = S.tenGod(ds, tp.day.stem);
    var rel = S.branchRelation(res.day.branch, tp.day.branch);
    var seedBase = [input.y, input.mo, input.d, input.h, input.mi, t.y, t.mo, t.d].join('-');
    var cats = [], sum = 0;
    CATS.forEach(function (c) {
      var sc = clamp(62 + TG_FX[tg][c.key] + (rel ? REL_FX[rel] : 0) + jitter(S, seedBase + c.key), 20, 98);
      sum += sc;
      var lv = sc >= 75 ? 'hi' : (sc >= 50 ? 'mid' : 'lo');
      cats.push({ key: c.key, label: c.label, score: sc, text: pick(S, CAT_TXT[c.key][lv], seedBase + c.key + 'v') });
    });
    var totRaw = clamp(62 + TG_FX[tg].tot + (rel ? REL_FX[rel] : 0) + jitter(S, seedBase + 'tot'), 20, 98);
    var tot = clamp(Math.round(0.55 * totRaw + 0.45 * (sum / 4)), 20, 98);
    var counts = [0, 0, 0, 0, 0];
    [res.year, res.month, res.day].concat(res.hour ? [res.hour] : []).forEach(function (p) {
      counts[S.STEM_ELEM[p.stem]]++; counts[S.BRANCH_ELEM[p.branch]]++;
    });
    var weak = counts.indexOf(Math.min.apply(null, counts));
    var strong = counts.indexOf(Math.max.apply(null, counts));
    return {
      tp: tp, tg: tg, rel: rel, tot: tot,
      heroText: TG_DAY[tg] + (rel ? REL_TXT[rel] : ''),
      cats: cats,
      lucky: { color: LUCKY_COLOR[weak], num: pick(S, LUCKY_NUM[weak], seedBase + 'n'), dir: LUCKY_DIR[weak] },
      counts: counts, weak: weak, strong: strong
    };
  }

  function yearly(S, res, tp) {
    var tg = S.tenGod(res.day.stem, tp.year.stem);
    return { tg: tg, text: YEAR_TG[tg] };
  }

  function ohengText(S, counts, strong, weak) {
    var weakName = S.ELEMS[weak] + '(' + S.ELEMS_H[weak] + ')';
    var strongName = S.ELEMS[strong] + '(' + S.ELEMS_H[strong] + ')';
    return '사주에서 <b>' + strongName + '</b> 기운이 가장 강합니다. ' + ELEM_DESC[strong] +
      '의 힘이 삶의 중심 동력입니다. 반면 <b>' + weakName + '</b> 기운이 ' +
      (counts[weak] === 0 ? '팔자에 드러나 있지 않습니다' : '상대적으로 약합니다') + '. ' + ELEM_LACK[weak];
  }

  /* ---- 분야별 원국 풀이 (chart-based domain readings) ---- */
  var ELEM_ORGAN = ['간·눈·근육', '심장·혈압·순환', '위장·소화기', '폐·호흡기·피부', '신장·방광·수분대사'];
  var GUNG_TXT = {
    bi: '배우자궁(일지)에 비겁이 있어 친구처럼 편안한 관계를 지향합니다.',
    sik: '배우자궁(일지)에 식상이 있어 표현과 애정이 풍부한 관계를 만듭니다.',
    jae: '배우자궁(일지)에 재성이 있어 현실적이고 알뜰한 파트너십을 꾸립니다.',
    gwan: '배우자궁(일지)에 관성이 있어 서로 존중하는 반듯한 관계를 지향합니다.',
    in: '배우자궁(일지)에 인성이 있어 정신적 교감을 중시하는 관계를 만듭니다.'
  };
  var LOVE_TXT = [
    '사주 원국에 배우자성(남자는 재성, 여자는 관성)이 뚜렷하게 드러나 있지 않은 편입니다. 인연이 없다는 뜻이 아니라 연애가 저절로 굴러오지 않는 구조라, 모임·소개 같은 만남의 장에 의식적으로 나가야 기회가 생깁니다.',
    '배우자성이 알맞게 자리 잡아 연애·결혼운이 안정적인 구조입니다. 무리하게 서두르지 않아도 때가 되면 인연이 이어지는 편이며, 관계에서 균형 감각이 좋습니다.',
    '배우자성이 강하게 발달해 이성에게 관심과 기회가 많은 구조입니다. 선택지가 많은 만큼 관계가 겹치거나 비교하는 습관이 생기기 쉬우니, 한 사람에게 집중하는 것이 관계의 질을 높입니다.'
  ];
  var MONEY_TXT = [
    '원국에 재성이 드러나지 않아 돈을 좇기보다 실력을 쌓아 돈이 따라오게 하는 유형입니다. 전문성과 기술이 최고의 재테크입니다.',
    '재성이 알맞게 자리해 꾸준히 모으는 안정형 재물운입니다. 큰 투기보다 저축과 장기 투자가 체질에 맞습니다.',
    '재성이 왕성해 돈의 흐름을 읽는 감각이 좋고 벌 기회도 많은 유형입니다. 다만 들어오는 만큼 나가기 쉬우니, 자동 저축·분산처럼 지키는 구조를 만드는 것이 관건입니다.'
  ];
  var WORK_TXT = [
    '관성이 드러나지 않아 조직의 틀보다 자율적인 환경에서 능력이 사는 유형입니다. 전문직·프리랜서·연구처럼 성과로 말하는 자리가 잘 맞습니다.',
    '관성이 균형 있게 자리해 조직 적응력이 좋고, 책임을 맡을수록 성장하는 유형입니다. 승진과 평판 관리에 유리한 구조입니다.',
    '관성이 강해 책임감과 직업적 성취욕이 크지만, 그만큼 업무 압박과 스트레스도 크게 받는 구조입니다. 일과 휴식의 경계를 지키는 것이 롱런의 조건입니다.'
  ];
  var STUDY_TXT = [
    '인성이 드러나지 않아 책상 공부보다 몸으로 부딪치며 배우는 실전형입니다. 프로젝트·실습 중심 학습이 효율을 높입니다.',
    '인성이 안정적으로 자리해 배움을 받아들이는 그릇이 좋은 유형입니다. 꾸준한 학습 루틴이 성과로 직결됩니다.',
    '인성이 발달해 학문·연구·자격에 강한 전형적인 공부 사주입니다. 다만 생각이 많아, 배운 것을 실제로 써먹는 실행이 과제가 됩니다.'
  ];
  var TG_GROUP = {비견:'bi',겁재:'bi',식신:'sik',상관:'sik',편재:'jae',정재:'jae',편관:'gwan',정관:'gwan',편인:'in',정인:'in'};

  function domains(S, res) {
    var ds = res.day.stem;
    var mainStem = function (p) { var h = S.HIDDEN[p.branch]; return h[h.length - 1]; };
    var pillars = [res.year, res.month, res.day].concat(res.hour ? [res.hour] : []);
    var g = { bi: 0, sik: 0, jae: 0, gwan: 0, in: 0 };
    var stems = [res.year.stem, res.month.stem].concat(res.hour ? [res.hour.stem] : []);
    stems.concat(pillars.map(mainStem)).forEach(function (s) { g[TG_GROUP[S.tenGod(ds, s)]]++; });
    var spouseGung = TG_GROUP[S.tenGod(ds, mainStem(res.day))];
    var counts = [0, 0, 0, 0, 0];
    pillars.forEach(function (p) { counts[S.STEM_ELEM[p.stem]]++; counts[S.BRANCH_ELEM[p.branch]]++; });
    var weak = counts.indexOf(Math.min.apply(null, counts));
    var strong = counts.indexOf(Math.max.apply(null, counts));
    var lv = function (n) { return n === 0 ? 0 : (n <= 2 ? 1 : 2); };
    var starN = res.gender === 'F' ? g.gwan : g.jae;
    var health = '오행 중 ' + S.ELEMS[weak] + '(' + S.ELEMS_H[weak] + ') 기운이 약한 편이라 ' + ELEM_ORGAN[weak] +
      ' 쪽 컨디션을 평소에 챙기는 것이 좋습니다.' +
      (counts[strong] >= (res.hour ? 4 : 3)
        ? ' 반대로 ' + S.ELEMS[strong] + '(' + S.ELEMS_H[strong] + ') 기운이 과해 생활이 한쪽으로 몰아치기 쉬우니 페이스 조절이 중요합니다.'
        : '') + ' 규칙적인 수면이 모든 보약의 기본입니다.';
    return {
      love: LOVE_TXT[lv(starN)] + ' ' + GUNG_TXT[spouseGung],
      money: MONEY_TXT[lv(g.jae)] + (g.sik >= 2 ? ' 식상이 재성을 받쳐 주어 아이디어와 활동이 곧 수입으로 연결되는 좋은 구조입니다.' : ''),
      work: WORK_TXT[lv(g.gwan)] + (g.in >= 2 ? ' 인성이 관을 받쳐 윗사람의 신임과 승진운이 따르는 조합입니다.' : ''),
      study: STUDY_TXT[lv(g.in)] + (g.sik >= 2 ? ' 식상이 함께 있어 배운 것을 표현하고 가르치는 데에도 재능이 있습니다.' : ''),
      health: health
    };
  }

  var Fortune = {
    daily: daily, yearly: yearly, ohengText: ohengText, domains: domains,
    ILGAN_TXT: ILGAN_TXT, ELEM_DESC: ELEM_DESC, ELEM_LACK: ELEM_LACK
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = Fortune;
  else global.Fortune = Fortune;
})(this);

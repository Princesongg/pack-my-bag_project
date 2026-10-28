import { ClipboardList, Compass, FileText, MapPinned } from 'lucide-react';

// Planning-only editorial content. Travel facts and recommendation rules stay in service/data.
export const topics = [
  {
    id: 'project-overview', no: '01', name: 'Project Overview', desc: '서비스 소개와 기획 배경', icon: FileText,
    headline: 'AI와 함께, 아이디어를 실제 웹 서비스로.',
    label: 'AI LAB · PERSONAL PROJECT',
    compactSummary: '여행 정보 확인부터 준비물 관리와 출발 전 점검까지 연결한 반응형 웹 서비스입니다.',
    summary: 'ChatGPT와 Codex를 활용해 기획부터 UI 디자인, 웹 구현과 개선까지 진행한 개인 AI LAB 프로젝트',
    blocks: [
      { keyword: '01 — SERVICE CONCEPT', title: '서비스 소개', compactBody: '여행 조건에 맞는 정보와 준비물을 관리하는 반응형 웹 서비스입니다. 정보 확인부터 최종 점검까지 연결했습니다.', body: 'PACK MY BAG은 여행 국가와 도시, 일정, 목적에 맞는 여행 정보를 확인하고 필요한 준비물을 관리할 수 있도록 설계한 반응형 웹 서비스입니다.\n날씨·옷차림부터 항공 수하물, 맞춤형 체크리스트와 최종 점검까지 하나의 흐름으로 연결했습니다.' },
      { keyword: '02 — BACKGROUND', title: '기획 배경', compactBody: '여행 정보를 여러 곳에서 찾고 준비물을 따로 정리하는 번거로움에 주목했습니다. 흩어진 정보를 실제 짐 싸기로 연결하고자 했습니다.', body: '여행을 준비할 때 날씨와 입국 조건, 수하물 규정 등을 여러 곳에서 찾아보고 준비물까지 별도로 정리해야 하는 번거로움에 주목했습니다.\n흩어진 정보를 모아 실제 짐 싸기로 이어지는 서비스를 만들고자 했습니다.' },
      { keyword: '03 — AI LAB OBJECTIVE', title: '제작 목표', compactBody: 'AI 도구로 아이디어부터 UI·기능 구현까지 완성하는 과정을 실험했습니다. 생성 결과를 직접 검토하고 개선했습니다.', body: 'ChatGPT와 Codex를 활용해 아이디어 구체화부터 UI 설계, 기능 구현까지 하나의 웹 서비스를 완성하는 과정을 실험했습니다.\nAI가 생성한 결과를 그대로 사용하기보다 직접 검토하고 개선하는 데 중점을 두었습니다.' },
      { keyword: '04 — ROLE & PROCESS', title: '제작 방식 및 역할', compactBody: '아이디어·사용자 흐름·디자인 방향을 직접 설정했습니다. ChatGPT로 기획·UI를 정리하고 Codex로 구현하며 테스트·개선했습니다.', body: '서비스 아이디어와 사용자 흐름, 디자인 방향을 직접 설정했습니다.\nChatGPT로 기획과 UI 구성을 구체화하고, Codex로 웹 화면과 기능을 구현하며 실제 테스트를 통해 반복 개선했습니다.' },
    ],
    goal: 'AI를 활용해 여행 정보 확인부터 출발 전 최종 점검까지 연결되는 사용자 경험 구현하기.',
    projectInfo: [
      { label: 'AI TOOLS', value: 'ChatGPT · Codex' },
      { label: 'PROJECT TYPE', value: 'Personal AI LAB' },
      { label: 'PLATFORM', value: 'Responsive Web' },
    ],
    productionNote: '요구사항 정의와 최종 디자인 판단·결과 검토는 제작자가 주도했습니다. 서비스는 저장된 여행 데이터와 추천 규칙으로 동작하며, 실시간 생성형 AI API로 여행 정보를 분석하지 않습니다.',
  },
  {
    id: 'problem-goals', no: '02', name: 'Problem & Goals', desc: '여행 준비에서 발견한 문제와 해결 목표', icon: Compass,
    headline: '짐을 챙기는 것에서, 출발할 준비가 되었는지까지.',
    compactSummary: '여행 준비에서 놓치기 쉬운 네 가지 문제를 정의하고, 각각의 해결 기능으로 연결했습니다.',
    summary: '여행 준비에서 놓치기 쉬운 네 가지 문제를 정의하고, 각각의 해결 기능으로 연결했습니다.',
    pairs: [
      {
        no: '01',
        compactTitle: '흩어진 여행 정보', compactPurpose: '핵심 정보 통합',
        problem: { title: '흩어진 여행 정보', body: '여행지의 날씨·전압·플러그, 항공 수하물, 입국 준비 정보를 여러 곳에서 따로 확인해야 하는 번거로움이 있습니다.' },
        goal: { title: 'SMART TRIP BRIEF', body: '선택한 여행 국가·도시·시기에 맞는 핵심 정보를 한곳에서 확인할 수 있도록 설계했습니다.' },
        purpose: '필요한 정보 확인',
      },
      {
        no: '02',
        compactTitle: '놓치기 쉬운 사용 조건', compactPurpose: '출발 전 조건 점검',
        problem: { title: '챙기는 것과 사용할 수 있는 것은 다르다', body: '여권·결제 카드·보조배터리는 챙기는 것뿐 아니라 유효기간, 해외 사용 가능 여부, 항공 반입 조건 등을 확인해야 합니다.' },
        goal: { title: 'PACKING RED FLAGS', body: '여권 유효기간, 결제 카드, 항공 반입 조건처럼 놓치기 쉬운 사항을 출발 전에 다시 확인하도록 설계했습니다.\n사용자가 직접 확인해야 하는 조건과 공식적인 승인·적합성 검증은 구분합니다.' },
        purpose: '놓치기 쉬운 조건 점검',
      },
      {
        no: '03',
        compactTitle: '불필요한 여행 짐', compactPurpose: '짐 가볍게 정리',
        problem: { title: '불필요하게 많아지는 여행 짐', body: '필요할지 모른다는 생각에 물품을 추가하다 보면 불필요한 짐까지 챙기게 됩니다.' },
        goal: { title: 'PACK LESS', body: '여행 조건과 준비물을 다시 살펴보고, 불필요한 짐을 줄일 수 있도록 돕는 기능을 설계했습니다.' },
        purpose: '짐을 가볍게 정리',
      },
      {
        no: '04',
        compactTitle: '출발 직전의 누락', compactPurpose: '마지막 준비물 재확인',
        problem: { title: '출발 직전의 마지막 누락', body: '짐을 미리 준비했더라도 출발 직전까지 사용한 물품을 마지막에 빠뜨릴 수 있습니다.' },
        goal: { title: 'LAST MINUTE BAG', body: '일반 준비물 체크리스트와 별도로, 출발 직전에 확인할 항목을 다시 점검하도록 구성했습니다.' },
        purpose: '출발 직전 재확인',
      },
    ],
    researchNote: '※ 개인 경험과 기획 단계의 UX 문제 가설을 바탕으로 정리했으며, 사용자 인터뷰·설문조사나 정량적 검증 결과를 의미하지 않습니다.',
    compactResearchNote: '※ 개인 경험과 UX 문제 가설을 정리했습니다. 인터뷰·설문조사나 정량적 검증 결과는 아닙니다.',
    compactChallengeTitle: '기획한 해결 방향을 실제 작동하는 UX로 구현할 수 있을까?',
    compactChallengeBody: 'ChatGPT로 문제·기능 구조를 정리하고 Codex로 구현했습니다. 직접 검토하며 사용 흐름과 반응형 디자인을 개선했습니다.',
    insightTitle: '사용 조건까지 확인하는 여행 준비',
    insight: '해외 근무 중 고객들이 카드 결제 문제로 불편을 겪는 모습을 여러 차례 목격하며, 물품의 소지 여부뿐 아니라 실제 사용 조건을 확인하는 과정에도 주목했습니다.',
    compactInsight: '해외 근무 중 고객들의 카드 결제 불편을 여러 차례 목격하며, 물품의 소지 여부와 함께 실제 사용 조건을 확인하는 과정에 주목했습니다.',
    conditionNote: '사용자가 직접 확인해야 하는 조건과 공식적인 승인·적합성 검증은 구분합니다.',
    challengeTitle: '기획한 해결 방향을 실제 작동하는 사용자 경험으로 구현할 수 있을까?',
    challengeBody: [
      'ChatGPT로 문제와 기능 구조를 정리하고, Codex를 활용해 실제 작동하는 웹 인터페이스로 구현했습니다. 직접 결과를 검토하며 사용 흐름과 반응형 디자인을 개선했습니다.',
    ],
    productionNote: 'AI는 제작 과정의 도구로 활용했습니다. 서비스는 사전에 준비한 여행 데이터와 조건별 규칙을 기반으로 동작하며, 실시간 AI 여행 정보 생성 기능은 제공하지 않습니다.',
    compactProductionNote: 'AI는 제작 도구입니다. 서비스는 준비된 여행 데이터·조건별 규칙으로 동작하며 실시간 AI 여행 정보는 생성하지 않습니다.',
    objective: 'PACK LESS. MISS NOTHING.',
    highlight: '필요한 정보는 한곳에 모으고, 놓치기 쉬운 조건은 점검하며, 불필요한 짐은 줄이는 여행 준비 경험을 목표로 했습니다.',
    approachSteps: ['정보 확인', '조건 점검', '짐 정리', '출발 전 재확인'],
  },
  {
    id: 'research', no: '03', name: 'Research', desc: '국가별 전압·플러그·날씨·입국 및 수하물 정보', icon: MapPinned,
    headline: '여행 정보의 정확성과 적용 조건을 확인하다.',
    compactSummary: '여행 정보를 네 가지 항목으로 나누고, 국가·도시별 적용 기준과 변경 가능성을 검토했습니다.',
    summary: '여행 준비에 필요한 정보를 네 가지 항목으로 분류하고, 국가·도시별 적용 기준과 정보의 변경 가능성을 검토했습니다.',
    blocks: [
  {
    "keyword": "01 / WEATHER & CLOTHING",
    "compactKeyword": "01 / WEATHER",
    "title": "날씨 · 옷차림",
    "compactBody": "월별 기후와 옷차림 참고",
    "body": "도시별 월평균 기온과 기후 특성을 정리하고, 과거 기후 통계와 실제 여행일의 날씨 예보를 구분하도록 구성했습니다."
  },
  {
    "keyword": "02 / POWER & PLUGS",
    "compactKeyword": "02 / POWER",
    "title": "전압 · 플러그",
    "compactBody": "전기 사용 환경 확인",
    "body": "국가별 전압·주파수·플러그 유형을 정리하고, 플러그 어댑터와 전압 변환의 차이를 구분했습니다."
  },
  {
    "keyword": "03 / ENTRY REQUIREMENTS",
    "compactKeyword": "03 / ENTRY",
    "title": "입국 · 비자",
    "compactBody": "조건별 입국 요건 확인",
    "body": "여행자의 국적, 방문 목적과 체류 조건에 따라 달라지는 입국 요건을 검토하고, 변경 가능한 사항은 공식 기관에서 재확인하도록 안내했습니다."
  },
  {
    "keyword": "04 / BAGGAGE RULES",
    "compactKeyword": "04 / BAGGAGE",
    "title": "항공 수하물",
    "compactBody": "기내·위탁 반입 주의",
    "body": "보조배터리·액체류 등 기내·위탁 반입 주의사항을 정리하고, 항공사와 운임에 따라 달라지는 수하물 허용량은 별도 확인하도록 구성했습니다."
  }
],
    approachTitle: 'AI로 정보를 구조화하고, 출처와 적용 조건을 검토하다.',
    highlight: 'ChatGPT로 조사 항목과 자료를 정리하고, 공식 출처를 우선 참고했습니다. 변경 가능하거나 추가 확인이 필요한 정보는 확정적인 안내와 구분했습니다.',
    compactApproach: 'AI로 조사 항목을 정리하고, 공식 출처와 변경 가능성을 검토했습니다.',
    verificationNote: '월별 기후는 예보가 아닌 참고 통계입니다. 플러그 어댑터는 전압을 바꾸지 않습니다. 입국 요건·수하물 허용량은 여행 조건에 따라 공식 기관·항공사에서 재확인해야 합니다. 미검증·변경 가능 정보는 확정하지 않습니다.',
  },
  {
    id: 'service-planning', no: '04', name: 'Service Planning', desc: '사용자 흐름, 정보 구조 및 추천 규칙', icon: ClipboardList,
    headline: '여행 조건 입력부터 마지막 점검까지, 하나의 사용자 흐름으로.',
    compactSummary: '정보 확인부터 준비물 관리와 출발 전 점검까지 이어지는 경험을 설계했습니다.',
    summary: '여행 정보를 확인하는 단계에서 끝나지 않고, 준비물 관리와 출발 전 최종 점검까지 이어지는 사용자 경험을 설계했습니다.',
    steps: [
  {
    "no": "01",
    "name": "TRIP INPUT",
    "title": "여행 조건 입력",
    "compactTitle": "여행 조건 입력",
    "body": "국가·도시·일정·목적·수하물 조건을 선택합니다.",
    "compactBody": "국가·도시·일정 선택"
  },
  {
    "no": "02",
    "name": "MY BAG",
    "title": "여행 정보 확인",
    "compactTitle": "여행 정보 확인",
    "body": "여행 조건에 맞는 핵심 정보와 출발 전 주의사항을 확인합니다.",
    "compactBody": "맞춤 정보·주의사항"
  },
  {
    "no": "03",
    "name": "PACKING",
    "title": "준비물 관리",
    "compactTitle": "준비물 관리",
    "body": "체크리스트로 준비물을 관리하고, PACK LESS로 짐을 검토합니다.",
    "compactBody": "체크리스트·짐 정리"
  },
  {
    "no": "04",
    "name": "FINAL CHECK",
    "title": "출발 전 최종 점검",
    "compactTitle": "최종 점검",
    "body": "LAST MINUTE BAG으로 출발 직전 필요한 물품을 다시 확인합니다.",
    "compactBody": "출발 직전 재확인"
  }
],
    blocks: [
  {
    "keyword": "STRATEGY 01 / CONTEXT-BASED INFORMATION",
    "title": "여행 조건에 따른 정보 구성", "compactTitle": "조건별 정보 구성",
    "compactBody": "여행 조건에 맞는 정보와 준비물을 연결합니다.",
    "body": "사용자가 선택한 국가·도시·시기·목적에 맞춰 필요한 여행 정보와 준비물 목록을 연결했습니다."
  },
  {
    "keyword": "STRATEGY 02 / SEAMLESS TASK FLOW",
    "title": "정보 확인에서 실제 행동으로", "compactTitle": "확인에서 행동으로",
    "compactBody": "정보 확인부터 출발 전 재확인까지 연결합니다.",
    "body": "여행 정보 확인, 준비물 체크, 짐 정리, 출발 전 재확인을 하나의 흐름으로 구성했습니다."
  }
],
    approachTitle: 'AI와 함께 설계하고, 직접 검토하며 개선하다.',
    highlight: '서비스 기획 방향과 요구사항을 직접 정의하고, ChatGPT와 Codex를 활용해 설계와 구현을 진행했습니다. 이후 실제 화면과 사용자 동작을 검토하며 반복 개선했습니다.',
    productionSteps: [
  {
    "name": "REQUIREMENTS",
    "role": "제작자 · 요구사항·디자인 방향 결정", "compactRole": "제작자 · 방향 결정"
  },
  {
    "name": "AI PLANNING SUPPORT",
    "role": "ChatGPT · 기획·UI 구조 구체화", "compactRole": "ChatGPT · 기획·UI"
  },
  {
    "name": "DEVELOPMENT",
    "role": "Codex · 웹 구현", "compactRole": "Codex · 웹 구현"
  },
  {
    "name": "REVIEW & REFINEMENT",
    "role": "제작자 · 직접 검토·수정 요청", "compactRole": "제작자 · 검토·개선"
  }
],
    authorNote: 'AI는 제작 도구이며, 서비스는 준비된 여행 데이터와 조건별 규칙으로 동작합니다.',
    compactAuthorNote: 'AI는 제작 도구이며, 서비스는 여행 데이터·규칙으로 동작합니다.',
  },
] as const;

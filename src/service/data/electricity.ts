import { pending, verified, type Evidence } from './types';

export const plugTypes = {
  A: {
    id: 'plug-type-a', label: 'Type A', geometry: 'two-parallel-flat-pins',
    svgAssetPath: 'src/service/data/assets/plugs/type-a.svg',
    assetStatus: 'schematic-not-to-scale',
    evidence: verified('평행한 두 개의 납작한 핀', ['jnto-plan', 'jnto-faq']),
  },
} as const;

export const electricity = {
  JP: {
    voltageV: verified([100], ['jnto-electricity']),
    frequencyHz: verified([50, 60], ['jnto-electricity']),
    regionalFrequency: verified('일본 동부 50Hz, 서부 60Hz. 주파수와 기기 대응 여부도 확인한다.', ['jnto-electricity']),
    plugTypeIds: verified(['A' as const], ['jnto-faq']),
    // Device compatibility is conditional, never a country-wide safety verdict.
    adapter: { kind: 'service-guidance', required: 'depends-on-device-plug', basedOn: ['jnto-faq', 'jnto-electricity'], text: '가져갈 기기의 플러그 모양이 현지 콘센트와 맞는지 확인하고, 맞지 않으면 형태 변환 어댑터를 준비한다.' },
    deviceCaution: { kind: 'service-guidance', basedOn: ['jnto-electricity'], text: '플러그 어댑터는 모양을 바꿀 뿐 전압을 바꾸지 않는다. 기기의 Input 전압·주파수 및 제조사 안내를 확인한다. 220V 전용 기기를 100V에서 사용할 수 있다고 단정하지 않는다. 변압기의 필요성과 용량은 기기별로 확인한다.' },
    otherPlugTypes: pending<string[]>('공식 확인한 Type A 이외의 유형은 추가 조사 전 등록하지 않는다.'),
  },
} satisfies Record<string, { voltageV: Evidence<number[]>; frequencyHz: Evidence<number[]>; regionalFrequency: Evidence<string>; plugTypeIds: Evidence<readonly string[]>; adapter: object; deviceCaution: object; otherPlugTypes: Evidence<string[]> }>;

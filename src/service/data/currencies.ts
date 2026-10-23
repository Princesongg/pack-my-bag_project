import { verified } from './types';

export const currencies = {
  JP: verified({ name: '일본 엔', code: 'JPY', symbol: '¥' }, ['jnto-faq']),
};

// No exchange rates and no runtime API. Future seasonal offset entries stay explicit.
export const timeZones = {
  JP: {
    ianaId: 'Asia/Tokyo', referenceIanaId: 'Asia/Seoul',
    standardUtcOffsetMinutes: verified(540, ['nict-jst']),
    referenceUtcOffsetMinutes: verified(540, ['kma-kst']),
    differenceFromKoreaMinutes: verified(0, ['nict-jst', 'kma-kst'], '두 공식 UTC 오프셋의 차이로 계산.'),
    daylightSaving: verified(false, ['jnto-plan']),
    seasonalOffsets: [] as { startDate: string; endDate: string; utcOffsetMinutes: number; sourceIds: string[] }[],
  },
};

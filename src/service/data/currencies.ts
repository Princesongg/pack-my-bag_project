import { verified } from './types';

// Display metadata only; no exchange rates or new verification claims.
export const currencyDetails = {
  JP: { name: '일본 엔', code: 'JPY', symbol: '¥' },
  VN: { name: '베트남 동', code: 'VND', symbol: '₫' },
  TH: { name: '태국 바트', code: 'THB', symbol: '฿' },
  TW: { name: '신타이완 달러', code: 'TWD', symbol: 'NT$' },
  US: { name: '미국 달러', code: 'USD', symbol: '$' },
  AU: { name: '호주 달러', code: 'AUD', symbol: 'A$' },
} as const;

export function getCountryCurrency(countryId: string) {
  return Object.prototype.hasOwnProperty.call(currencyDetails, countryId) ? currencyDetails[countryId as keyof typeof currencyDetails] : null;
}

export const currencies = {
  JP: verified(currencyDetails.JP, ['jnto-faq']),
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

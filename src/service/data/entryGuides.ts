import { pending, verified } from './types';
import { getPassportRule } from './passportRules';

export const entryGuides = {
  JP: {
    scope: { nationality: 'KR', passport: 'ordinary', purpose: 'short-term-tourism' },
    passport: { ...verified(getPassportRule('JP')!.requirement, ['passport-jp']), lastVerified:'2026-10-25' },
    visa: { ...verified({ visaExempt: true, maximumShortStayDays: 90 }, ['entry-jp-short'], '일본 외무성 한국 목록·기본90일 재대조. 일반여권 단기관광 기본 조건이며 입국 보장이 아니다.'), lastVerified:'2026-10-25' },
    passportRemainingValidityMonths: pending<number>('일률적인 잔여 유효기간 월수는 공식 확인 전 숫자로 안내하지 않는다.'),
    services: [{ id: 'visit-japan-web', name: 'Visit Japan Web', officialUrl: 'https://services.digital.go.jp/ko/visit-japan-web/guide/', description: verified('입국심사와 세관신고 등에 필요한 정보를 등록할 수 있는 일본 디지털청의 웹 서비스.', ['digital-agency-vjw']), mandatoryForAllTravelers: pending<boolean>('한국어 가이드 본문 및 여행자별 적용 조건 추가 확인 필요. 의무 서비스라고 단정하지 않는다.') }],
    customs: verified('일본 세관의 여행자 신고 및 반입 제한 안내를 확인한다.', ['japan-customs']),
    preDepartureChecks: ['여권 종류와 유효성', '방문 목적·체류 기간에 맞는 비자 조건', 'Visit Japan Web 최신 이용 안내', '세관 신고·반입 제한과 의약품 등 개별 품목 조건'],
    decision: 'not-an-admission-guarantee', recheckBeforeDeparture: true,
  },
};

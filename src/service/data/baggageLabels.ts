// Shared presentation only; permission evidence and detailed limits stay in baggageRules.
export const batteryCarryLabels = {
  cabin: '기내만 가능',
  checked: '위탁 금지',
  description: '보조배터리와 분리된 여분 리튬배터리는 위탁수하물에 넣을 수 없어요.',
  conditions: '기내 휴대도 용량·개수·단락 방지 및 항공사별 조건을 확인해야 해요.',
} as const;

export function baggagePermissionLabel(evidence: { status: string; value: string | null }, location: 'cabin' | 'checked', cabinOnly = false) {
  const prefix = location === 'cabin' ? '기내' : '위탁';
  if (evidence.status !== 'verified') return `${prefix} 별도 확인`;
  if (evidence.value === 'prohibited') return location === 'checked' ? batteryCarryLabels.checked : '기내 금지';
  if (location === 'cabin' && cabinOnly) return batteryCarryLabels.cabin;
  return `${prefix} ${evidence.value === 'allowed' ? '가능' : '조건부'}`;
}

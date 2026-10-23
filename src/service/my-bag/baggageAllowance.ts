export type BaggageAllowance = {
  source: 'user-confirmed-ticket'; airline: string; confirmed: true;
} & ({ system: 'pieces'; pieces: number; kgPerPiece: number | null } | { system: 'total-weight'; totalKg: number });
export const allowanceCheckId = 'baggage:free-allowance';
export function restoreBaggageAllowance(value: unknown): BaggageAllowance | undefined {
  if (!value || typeof value !== 'object') return;
  const raw = value as Record<string, unknown>;
  if (raw.source !== 'user-confirmed-ticket' || raw.confirmed !== true || typeof raw.airline !== 'string' || raw.airline.length > 80) return;
  const base = { source: 'user-confirmed-ticket' as const, airline: raw.airline.trim(), confirmed: true as const };
  if (raw.system === 'pieces' && typeof raw.pieces === 'number' && Number.isInteger(raw.pieces) && raw.pieces >= 0 && raw.pieces <= 99) {
    if (raw.pieces === 0) return { ...base, system: 'pieces', pieces: 0, kgPerPiece: null };
    if (typeof raw.kgPerPiece === 'number' && Number.isFinite(raw.kgPerPiece) && raw.kgPerPiece > 0 && raw.kgPerPiece <= 999) return { ...base, system: 'pieces', pieces: raw.pieces, kgPerPiece: raw.kgPerPiece };
  }
  if (raw.system === 'total-weight' && typeof raw.totalKg === 'number' && Number.isFinite(raw.totalKg) && raw.totalKg >= 0 && raw.totalKg <= 999) return { ...base, system: 'total-weight', totalKg: raw.totalKg };
}
export function allowanceLabel(allowance?: BaggageAllowance) {
  if (!allowance) return '허용량 확인 필요';
  return allowance.system === 'total-weight' ? `무료 위탁 · 총 ${allowance.totalKg}kg (합산)` : allowance.pieces === 0 ? '무료 위탁 · 0개 (무료 허용 없음)' : `무료 위탁 · ${allowance.pieces}개 / 개당 ${allowance.kgPerPiece}kg`;
}

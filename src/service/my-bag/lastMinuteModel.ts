import type { BagItem } from './bag';

export type LastMinuteState = { itemIds: string[]; checkedIds: string[] };
const suggestedIds = ['essential:passport', 'electronic:phone', 'essential:payment', 'electronic:charger'];

export function restoreLastMinute(value: unknown, items: readonly BagItem[]): LastMinuteState {
  const valid = new Set(items.map(item => item.id));
  if (!value || typeof value !== 'object' || !Array.isArray((value as LastMinuteState).itemIds)) {
    return { itemIds: suggestedIds.filter(id => valid.has(id)), checkedIds: [] };
  }
  const raw = value as Record<string, unknown>;
  const itemIds = [...new Set((raw.itemIds as unknown[]).filter((id): id is string => typeof id === 'string' && valid.has(id)))];
  const checkedIds = [...new Set((Array.isArray(raw.checkedIds) ? raw.checkedIds : []).filter((id): id is string => typeof id === 'string' && itemIds.includes(id)))];
  return { itemIds, checkedIds };
}

export function lastMinuteProgress(state: LastMinuteState) {
  const total = state.itemIds.length;
  const checked = new Set(state.checkedIds);
  const complete = state.itemIds.filter(id => checked.has(id)).length;
  return { total, complete, percent: total ? Math.round(complete / total * 100) : 0, allDone: total > 0 && complete === total };
}

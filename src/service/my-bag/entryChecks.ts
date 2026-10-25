import type { BagItem, BagState } from './bag';
export type EntryCheckKind = 'authorization' | 'procedure';
export const entryItemIds = { authorization:'essential:entry-authorization',procedure:'essential:entry-procedure' } as const;
export const entryFlagIds = { authorization:'passport:entry-authorization',procedure:'passport:entry-procedure' } as const;
export function matchesEntryItem(item: BagItem,kind: EntryCheckKind) {
  return item.id===entryItemIds[kind] || Boolean(item.custom && (kind==='authorization' ? /\bESTA\b|\bETA\b|비자|무비자|입국\s*(자격|허가)/i : /\bTDAC\b|\bTWAC\b|\bPAI\b|\bIPC\b|Visit Japan Web|입국\s*(신고|절차)/i).test(item.name));
}
export function entryItemId(items:readonly BagItem[],kind:EntryCheckKind) {return items.find(item=>matchesEntryItem(item,kind))?.id;}
export function applyEntryCheck(state:BagState,items:readonly BagItem[],kind:EntryCheckKind,checked:boolean):BagState {
  const id=entryItemId(items,kind),checks=new Set(state.checkedIds),flags=new Set(state.redFlagCheckedIds??[]);
  if(id){if(checked)checks.add(id);else checks.delete(id);}
  const related=(['authorization','procedure'] as const).filter(candidate=>candidate===kind||id&&entryItemId(items,candidate)===id);
  for(const candidate of related){if(checked)flags.add(entryFlagIds[candidate]);else flags.delete(entryFlagIds[candidate]);}
  return {...state,checkedIds:[...checks],redFlagCheckedIds:[...flags],...(related.includes('authorization')?{entryPreparationConfirmed:checked}:{})};
}
export function restoreEntryChecks(state:BagState,items:readonly BagItem[]):BagState {
  let result=state;
  for(const kind of ['authorization','procedure'] as const){const id=entryItemId(items,kind);if(state.redFlagCheckedIds?.includes(entryFlagIds[kind]) || id&&state.checkedIds.includes(id) || kind==='authorization'&&state.entryPreparationConfirmed)result=applyEntryCheck(result,items,kind,true);}
  return result;
}

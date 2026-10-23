import { useSyncExternalStore, type ReactNode } from 'react';
import { ChevronDown, type LucideIcon } from 'lucide-react';

const query = '(max-width: 768px)';
const subscribe = (notify: () => void) => {
  const media = window.matchMedia(query);
  media.addEventListener('change', notify);
  return () => media.removeEventListener('change', notify);
};
export function useCompactGuide() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
}
export function MobileMore({ title, children }: { title: string; children: ReactNode }) {
  const mobile = useCompactGuide();
  return mobile ? <details className="pmb-mobile-more"><summary>{title}</summary>{children}</details> : <>{children}</>;
}
export function MobileInfoRow({ title, value, icon: Icon, children }: { title: string; value: string; icon: LucideIcon; children: ReactNode }) {
  const mobile = useCompactGuide();
  return mobile ? <details className="pmb-mobile-info-row" name="pmb-mobile-essentials"><summary><Icon size={22}/><span><strong>{title}</strong><span>{value}</span></span><ChevronDown size={18}/></summary><div className="pmb-mobile-info-content">{children}</div></details> : <>{children}</>;
}

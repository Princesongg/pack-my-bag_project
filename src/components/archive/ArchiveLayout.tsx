import type { ReactNode } from 'react';
import ArchiveHeader from './ArchiveHeader';
import ArchiveFooter from './ArchiveFooter';

export default function ArchiveLayout({ children }: { children: ReactNode }) {
  return <><ArchiveHeader />{children}<ArchiveFooter /></>;
}

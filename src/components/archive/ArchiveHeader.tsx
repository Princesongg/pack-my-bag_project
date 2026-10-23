import { Luggage } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';

export default function ArchiveHeader() {
  return (
    <header className="site-header">
      <div className="shell nav-inner">
        <Link to="/" className="brand" aria-label="PACK MY BAG 홈으로 이동">
          <span className="brand-mark"><Luggage size={21} strokeWidth={2} /></span>
          <span>PACK MY BAG<span className="brand-dot">.</span></span>
        </Link>
        <nav aria-label="메인 메뉴" className="top-nav">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link selected' : 'nav-link'}>Home</NavLink>
          <NavLink to="/planning" className={({ isActive }) => isActive ? 'nav-link selected' : 'nav-link'}>Planning</NavLink>
          <NavLink to="/implementation" className={({ isActive }) => isActive ? 'nav-link selected' : 'nav-link'}>Implementation</NavLink>
        </nav>
      </div>
    </header>
  );
}

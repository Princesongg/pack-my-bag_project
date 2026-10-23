import { ArrowUpRight, Luggage } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';

// Shared service navigation: enable each destination when its route is implemented.
const serviceMenus = ['PLAN YOUR TRIP', 'TRAVEL INFO', 'MY BAG', 'BAGGAGE GUIDE'];
export default function ServiceHeader({ currentPage }: { currentPage?: 'travel-info' | 'my-bag' }) {
  return <header className="pmb-header pmb-container">
    <Link to="/implementation" className="pmb-brand" aria-label="PACK MY BAG 서비스 홈"><span className="pmb-logo"><Luggage size={22} /></span>PACK MY BAG<span className="pmb-brand-dot">✳</span></Link>
    <nav aria-label="서비스 메뉴" className="pmb-nav">
      <NavLink to="/implementation" end className="pmb-nav-home">HOME</NavLink>
      {serviceMenus.map(menu => menu === 'PLAN YOUR TRIP' ? <NavLink key={menu} to="/implementation/destination" className="pmb-nav-plan">{menu}</NavLink> : menu === 'MY BAG' && currentPage ? <NavLink key={menu} to="/implementation/my-bag" className={({ isActive }) => isActive ? 'pmb-guide-current-nav' : 'pmb-nav-plan'}>{menu}</NavLink> : menu === 'TRAVEL INFO' && currentPage ? <NavLink key={menu} to="/implementation/travel-info" className={({ isActive }) => isActive ? 'pmb-guide-current-nav' : 'pmb-nav-plan'}>{menu}</NavLink> : menu === 'BAGGAGE GUIDE' && currentPage === 'my-bag' ? <Link key={menu} to="/implementation/travel-info#pmb-guide-baggage" className="pmb-nav-plan">{menu}</Link> : <span className="pmb-nav-pending" key={menu}><button type="button" disabled>{menu}</button><small>준비 중</small></span>)}
    </nav>
    <Link to="/" className="pmb-archive"><ArrowUpRight size={15} /> 프로젝트 메인</Link>
  </header>;
}


import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Check, Compass, Globe2, Luggage, Plane, Plug, ShieldCheck, Sparkles } from 'lucide-react';
import './service.css';
import ServiceHeader from './ServiceHeader';

const features = [
  { number: '01', title: 'TRAVEL ESSENTIALS', subtitle: '낯선 여행지, 익숙한 준비', description: '여행 국가별 전압, 콘센트, 통화, 날씨 등 꼭 필요한 정보를 한눈에 확인합니다.', icon: Globe2, detail: 'KNOW BEFORE YOU GO', tone: 'blue' },
  { number: '02', title: 'SMART PACKING LIST', subtitle: '내 여행에 꼭 맞는 가방', description: '여행 국가, 시기, 기간, 목적에 따라 필요한 준비물을 추천합니다.', icon: Luggage, detail: 'LESS WORRY, MORE READY', tone: 'yellow' },
  { number: '03', title: 'BAGGAGE GUIDE', subtitle: '공항에서도, 마음 가볍게', description: '액체류, 보조배터리 등 기내 및 위탁수하물 관련 주의사항을 확인합니다.', icon: ShieldCheck, detail: 'A SMOOTHER TAKEOFF', tone: 'coral' },
];

function TravelVisual() {
  return <div className="pmb-art" role="img" aria-label="파란 캐리어에 여행 스티커가 붙어 있고, 여권과 탑승권, 수하물 태그가 함께 놓인 여행 준비 일러스트">
    <div className="pmb-art-disc" /><div className="pmb-orbit" /><Plane className="pmb-plane" size={42} strokeWidth={1.5} />
    <span className="pmb-art-star">✳</span><span className="pmb-art-plus">+</span>
    <div className="pmb-ready"><span /> READY FOR A NEW ADVENTURE</div>
    <div className="pmb-passport"><Globe2 size={39} strokeWidth={1} /><span>PASSPORT</span><small>THE WORLD IS YOURS</small></div>
    <div className="pmb-case"><div className="pmb-case-handle" /><div className="pmb-case-body"><i /><i /><i /><i /><span className="pmb-sticker-round">LET’S<br /><b>GO!</b><Sparkles size={15} /></span><span className="pmb-sticker-land"><span>☀</span>SEE THE WORLD</span><span className="pmb-sticker-small">PMB / 001 <ArrowUpRight size={13}/></span></div><span className="pmb-wheel pmb-wheel-left"/><span className="pmb-wheel pmb-wheel-right"/></div>
    <div className="pmb-tag"><span>GOOD<br />TO GO.</span><small>PACK MY BAG</small></div>
    <div className="pmb-boarding"><div className="pmb-ticket-top"><Plane size={14}/> BOARDING PASS <span>ONE WAY</span></div><div className="pmb-ticket-route"><strong>NOW</strong><span>····· <Plane size={20} /> ·····</span><strong>NEXT</strong></div><div className="pmb-ticket-bottom"><span>FROM EVERYDAY</span><span>TO SOMEWHERE NEW</span></div><div className="pmb-ticket-stub"><span>YOUR NEXT ADVENTURE</span><div className="pmb-barcode"/></div></div>
    <div className="pmb-art-caption"><span>LESS SEARCHING.</span><strong>MORE EXPLORING. <ArrowUpRight size={16}/></strong></div>
  </div>;
}

function FeatureCards() {
  return <section className="pmb-features pmb-container" aria-labelledby="pmb-features-title">
    <div className="pmb-section-heading"><div><span className="pmb-kicker">A LITTLE PREP. A LOT OF POSSIBILITY.</span><h2 id="pmb-features-title">준비는 간단하게, 여행은 더 즐겁게.</h2></div><p>당신의 다음 여행을 위해 준비하고 있어요.<br/><span>아래 기능은 순차적으로 만나볼 수 있어요.</span></p></div>
    <div className="pmb-feature-grid">{features.map(({ number, title, subtitle, description, icon: Icon, detail, tone }) => <article className={`pmb-feature pmb-feature-${tone}`} key={number}><div className="pmb-feature-top"><span className="pmb-feature-icon"><Icon size={30} strokeWidth={1.5}/>{number === '01' && <Plug className="pmb-mini-icon" size={17}/ >}{number === '02' && <Check className="pmb-mini-icon" size={17}/>}</span><span className="pmb-feature-number">/ {number}</span></div><h3>{title}</h3><h4>{subtitle}</h4><p>{description}</p><div className="pmb-feature-foot"><span>{detail}</span><span>준비 중</span></div></article>)}</div>
  </section>;
}

export default function ServiceHome() {
  return <div className="pmb-service">
    <a className="pmb-skip" href="#pmb-main">본문으로 건너뛰기</a>
    <ServiceHeader />
    <main id="pmb-main">
      <section className="pmb-hero pmb-container" aria-labelledby="pmb-hero-title"><div className="pmb-hero-copy"><span className="pmb-kicker pmb-hero-kicker"><span/> YOUR NEXT ADVENTURE STARTS HERE</span><h1 id="pmb-hero-title">Where to<br/><span>next?</span><span className="pmb-title-spark">✳</span></h1><h2>여행 준비, 검색은 줄이고<br className="pmb-mobile-break"/> 설렘은 더하고.</h2><p>여행지를 선택하면 꼭 필요한 여행 정보부터<br className="pmb-desktop-break"/> 나만의 준비물 리스트까지 한 번에 정리할 수 있어요.</p><div className="pmb-cta-area"><Link to="/implementation/destination" className="pmb-cta">START PACKING <ArrowUpRight size={21}/></Link><span>새로운 여행의 시작 <span aria-hidden="true">↗</span></span></div><div className="pmb-hero-note"><Compass size={16}/><span>어디로 떠나든, 준비는 가볍게.</span><span className="pmb-home-label">HOME PREVIEW</span></div></div><TravelVisual /></section>
      <div className="pmb-travel-strip" aria-hidden="true"><div className="pmb-container"><span>PLAN A LITTLE</span><span>✳</span><span>PACK SMART</span><span>✳</span><span>TRAVEL HAPPY</span><Plane size={20}/><span>REPEAT</span></div></div>
      <FeatureCards />
      <section className="pmb-signoff pmb-container"><span className="pmb-signoff-icon"><Plane size={24}/></span><p>가방에는 필요한 것만.<br/><strong>마음에는 설렘을 가득.</strong></p><span>PACK LIGHT. DREAM BIG.</span></section>
    </main>
    <footer className="pmb-footer pmb-container"><Link to="/implementation" className="pmb-footer-brand">PACK MY BAG ✳</Link><span>A little more ready. A lot more excited.</span><Link to="/"><ArrowLeft size={14}/> 프로젝트 메인으로</Link></footer>

  </div>;
}

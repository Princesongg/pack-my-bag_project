import { Link } from 'react-router-dom';
import { ArrowUpRight, Compass, Globe2, Plane, Sparkles } from 'lucide-react';
import './service.css';
import './ServiceHomeCTA.css';
import ServiceHeader from './ServiceHeader';
import './workspace/Workspace.css';

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

export default function ServiceHome() {
  return <div className="pmb-service pmb-start-screen">
    <a className="pmb-skip" href="#pmb-main">본문으로 건너뛰기</a>
    <ServiceHeader mode="start"/>
    <main id="pmb-main">
      <section className="pmb-hero pmb-container" aria-labelledby="pmb-hero-title"><div className="pmb-hero-copy"><span className="pmb-kicker pmb-hero-kicker"><span/> YOUR NEXT ADVENTURE STARTS HERE</span><h1 id="pmb-hero-title">Where to<br/><span>next?</span><span className="pmb-title-spark">✳</span></h1><h2>여행 준비, 검색은 줄이고<br className="pmb-mobile-break"/> 설렘은 더하고.</h2><p>여행지를 선택하면 꼭 필요한 여행 정보부터<br className="pmb-desktop-break"/> 나만의 준비물 리스트까지 한 번에 정리할 수 있어요.</p><div className="pmb-cta-area"><Link to="/implementation/workspace" className="pmb-cta" aria-describedby="pmb-home-cta-description">START PACKING <ArrowUpRight size={24} strokeWidth={2.3} aria-hidden="true"/></Link><span id="pmb-home-cta-description">여행지 선택부터 준비물 정리까지 한 번에</span></div><div className="pmb-hero-note"><Compass size={16}/><span>어디로 떠나든, 준비는 가볍게.</span></div></div><TravelVisual /></section>
    </main>


  </div>;
}

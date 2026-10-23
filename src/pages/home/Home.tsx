import { Compass, Luggage, Sparkles } from 'lucide-react';
import HeroVisual from './HeroVisual';
import ProjectCard from './ProjectCard';
import './Home.css';

export default function Home() {
  return (
    <>
      <section className="hero shell">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> AI-ASSISTED WEB PROJECT <span className="serial">NO. 001</span></div>
          <h1>여행 준비의 시작을<br /><span className="accent-type">가볍게.</span></h1>
          <p className="hero-intro">여행지 정보를 찾아 헤매는 시간은 줄이고,<br className="desktop-break" /> 설레는 여행 준비에 더 집중할 수 있도록.</p>
          <div className="hero-pills"><span><Compass size={15} /> TRAVEL INFO</span><span><Luggage size={15} /> PACKING LIST</span></div>
          <div className="intro-foot">PACK MY BAG <span className="foot-line" /> PROJECT JOURNEY</div>
        </div>
        <HeroVisual />
      </section>

      <section className="chapters shell" aria-labelledby="chapters-heading">
        <div className="section-top">
          <div><div className="section-label"><span className="small-cross">✳</span> EXPLORE THE PROJECT</div><h2 id="chapters-heading">아이디어부터 완성까지</h2></div>
          <p>기획 과정과 실제 구현을 각각의 페이지에 기록합니다.<br />아래 카드를 눌러 원하는 과정을 확인해 보세요.</p>
        </div>
        <div className="project-grid"><ProjectCard type="planning" /><ProjectCard type="implementation" /></div>
      </section>

      <section className="journey shell" aria-label="프로젝트 진행 단계">
        <div className="journey-title"><Sparkles size={19} /><span>PROJECT JOURNEY</span></div>
        <div className="journey-items">
          <div className="journey-step current"><span className="step-no">01</span><strong>Research</strong><small>진행 중</small></div>
          <div className="journey-step"><span className="step-no">02</span><strong>Design</strong><small>예정</small></div>
          <div className="journey-step"><span className="step-no">03</span><strong>Build</strong><small>예정</small></div>
          <div className="journey-step"><span className="step-no">04</span><strong>Review</strong><small>예정</small></div>
        </div>
      </section>
    </>
  );
}

import { Plane } from 'lucide-react';

export default function HeroVisual() {
  return (
    <div className="hero-art" aria-hidden="true">
      <div className="art-sun" />
      <div className="flight-arc" />
      <Plane className="art-plane" size={30} strokeWidth={1.5} />
      <div className="small-stamp">TRAVEL<br />MADE<br />EASIER</div>
      <div className="suitcase">
        <span className="suitcase-handle" />
        <span className="suitcase-body"><span className="suitcase-lines" /><span className="suitcase-sticker">PMB<br />26</span></span>
        <span className="suitcase-wheels" />
      </div>
      <div className="hero-ticket"><span>BOARDING PASS</span><strong>YOUR NEXT TRIP</strong><small>PLAN ✳ PACK ✳ GO</small></div>
      <span className="art-number">P / 001</span>
    </div>
  );
}

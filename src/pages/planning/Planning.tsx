import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Luggage } from 'lucide-react';
import { Link } from 'react-router-dom';
import { topics } from './topics';
import './Planning.css';

export default function Planning() {
  return (
    <main className="shell inner-page">
      <Link className="back-link" to="/"><ArrowLeft size={17}/> 프로젝트 메인으로</Link>
      <div className="inner-heading"><div className="section-label">01 / PROJECT PLANNING</div><h1>여행을 준비하는 더 쉬운 방법.</h1><p>PACK MY BAG의 문제 정의와 정보 조사, 서비스 구조를 단계별로 정리하는 공간입니다.</p></div>
      <div className="planning-banner"><span className="banner-icon"><Luggage size={28}/></span><div><strong>PACK MY BAG</strong><p>여행 준비, 검색은 줄이고 설렘은 더하고.</p></div><span className="status status-progress">PLANNING</span></div>
      <div className="detail-section-header"><h2>Planning Archive</h2><span>기획 내용은 제작 과정에 따라 업데이트됩니다.</span></div>
      <div className="topic-grid">{topics.map(({ no, name, desc, icon: Icon }) => <div className="topic-card" key={no}><div className="topic-top"><span>{no}</span><Icon size={20}/></div><h3>{name}</h3><p>{desc}</p></div>)}</div>
      <div className="note"><Check size={19}/><div><strong>현재 단계는 정보 조사 및 초기 기획입니다.</strong><p>실제 사용자 테스트·개선 성과·개발 결과는 아직 작성하지 않습니다. Figma에서 정리한 상세 기획은 이 영역에 순차적으로 반영할 수 있어요.</p></div></div>
      <div className="inner-actions"><a href="https://www.figma.com/design/V7lgOaWkOME5btj1Gl2DYa/PACK-MY-BAG?node-id=3-2" target="_blank" rel="noreferrer" className="text-button">Figma 기획 보드 보기 <ArrowUpRight size={17}/></a><Link to="/implementation" className="text-button subtle-button">구현 페이지 보기 <ArrowRight size={17}/></Link></div>
    </main>
  );
}

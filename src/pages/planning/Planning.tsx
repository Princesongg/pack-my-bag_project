import { ArrowDown, ArrowLeft, ArrowRight, Luggage } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { destinations } from '../../service/destination/destinations';
import { topics } from './topics';
import './Planning.css';

export default function Planning() {
  useEffect(() => {
    // Direct SPA links can resolve their anchor before React renders the sections.
    const id = window.location.hash.slice(1);
    if (id !== 'planning-contents' && !topics.some(topic => topic.id === id)) return;
    const frame = requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: 'instant' }));
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <main className="shell inner-page planning-page">
      <Link className="back-link" to="/"><ArrowLeft size={17} aria-hidden="true"/> 프로젝트 메인으로</Link>
      <div className="inner-heading"><div className="section-label">01 / PROJECT PLANNING</div><h1>여행을 준비하는 더 쉬운 방법.</h1><p>흩어진 여행 정보를 준비물과 연결한 PACK MY BAG의 기획 과정을 소개합니다.</p></div>
      <div className="planning-banner"><span className="banner-icon" aria-hidden="true"><Luggage size={28}/></span><div><strong>PACK MY BAG</strong><p>여행 준비, 검색은 줄이고 설렘은 더하고.</p></div></div>
      <div className="detail-section-header"><h2 id="planning-contents">Planning Contents</h2><span>원하는 섹션으로 바로 이동하거나 아래에서 순서대로 살펴보세요.</span></div>
      <nav className="topic-grid" aria-labelledby="planning-contents">
        {topics.map(({ id, no, name, icon: Icon }) => <a href={`#${id}`} className="topic-card" key={id}><span className="topic-top"><span>{no}</span><Icon size={16} aria-hidden="true"/></span><h3>{name}</h3><ArrowDown className="planning-topic-arrow" size={16} aria-hidden="true"/></a>)}
      </nav>
      <div className="planning-sections">
        {topics.map(topic => <section className="planning-section" id={topic.id} key={topic.id} aria-labelledby={`${topic.id}-title`}>
          {topic.id === 'project-overview'
            ? <header className="planning-section-heading planning-overview-heading"><div><div className="planning-overview-labels"><span>01 / PROJECT OVERVIEW</span><span>{topic.label}</span></div><h2 id={`${topic.id}-title`}>{topic.headline}</h2><p>{topic.summary}</p></div></header>
            : topic.id === 'problem-goals'
              ? <header className="planning-section-heading planning-problems-heading"><div><span className="planning-problems-label">02 / PROBLEM &amp; GOALS</span><h2 id={`${topic.id}-title`}>{topic.headline}</h2><p>{topic.summary}</p></div></header>
              : <header className="planning-section-heading"><span className="planning-section-number">{topic.no}</span><div><h2 id={`${topic.id}-title`}>{topic.name}</h2><p>{topic.summary}</p></div></header>}
          {topic.id === 'service-planning' && <ol className="planning-flow" aria-label="서비스 이용 흐름">{['여행 조건 입력', '여행 정보 확인', '준비물 체크', '최종 점검'].map((step, i) => <li key={step}><span>0{i + 1}</span>{step}</li>)}</ol>}
          {topic.id === 'problem-goals'
            ? <>
              <p className="planning-problems-note">{topic.researchNote}</p>
              <div className="planning-pair-headings"><div><span>UX PROBLEMS</span><h3>여행 준비 과정에서 주목한 네 가지 문제</h3></div><div><span>DESIGN SOLUTIONS</span><h3>각 문제에서 출발한 기능 설계</h3></div></div>
              <div className="planning-pairs">{topic.pairs.map(pair => <div className="planning-pair" key={pair.no}>
                <div className="planning-pair-problem"><span className="planning-problems-label">PROBLEM {pair.no}</span><h4>{pair.problem.title}</h4>{pair.problem.body.split('\n').map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>
                <div className="planning-pair-goal"><span className="planning-problems-label">SOLUTION {pair.no}</span><h4>{pair.goal.title}</h4>{pair.goal.body.split('\n').map(paragraph => <p key={paragraph}>{paragraph}</p>)}<ArrowRight className="planning-pair-link" size={16} aria-hidden="true"/></div>
              </div>)}</div>
              <div className="planning-problems-approach"><span className="planning-problems-label">OUR APPROACH</span><h3>{topic.objective}</h3><p>{topic.highlight}</p><ol className="planning-approach-flow" aria-label="하나로 이어지는 여행 준비 흐름">{topic.pairs.map(pair => <li key={pair.no}><strong>{pair.goal.title}</strong><span>{pair.purpose}</span></li>)}</ol><p className="planning-approach-caption">정보 확인부터 조건 점검, 짐 정리와 출발 직전 재확인까지 하나의 여행 준비 흐름으로 연결했습니다.</p></div>
              <div className="planning-problems-challenge"><span className="planning-problems-label">AI LAB CHALLENGE</span><h3>{topic.challengeTitle}</h3>{topic.challengeBody.map(paragraph => <p key={paragraph}>{paragraph}</p>)}<p className="planning-problems-production-note">{topic.productionNote}</p></div>
            </>
            : <div className="planning-block-grid">{topic.blocks.map(block => <div className="planning-block" key={block.title}><h3>{block.title}</h3>{block.body.split('\n').map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>)}</div>}
          {topic.id === 'research' && <div className="planning-scope"><h3>현재 서비스의 조사·지원 범위</h3><p>등록된 {destinations.length}개국 · {destinations.reduce((sum, country) => sum + country.cities.length, 0)}개 도시를 기준으로 자료를 관리합니다.</p><ul>{destinations.map(country => <li key={country.id}><strong>{country.name}</strong><span>{country.cities.map(city => city.name).join(' · ')}</span></li>)}</ul></div>}
          {topic.id === 'project-overview'
            ? <><div className="planning-highlight planning-overview-goal"><span>PROJECT GOAL</span><strong>{topic.goal}</strong><p>{topic.highlight}</p></div><dl className="planning-overview-info">{topic.projectInfo.map(info => <div key={info.label}><dt>{info.label}</dt><dd>{info.value}</dd></div>)}</dl><p className="planning-overview-note">{topic.productionNote}</p></>
            : topic.id !== 'problem-goals' && <p className="planning-highlight">{topic.highlight}</p>}
          <a className="planning-back-top" href="#planning-contents">목차로 돌아가기 ↑</a>
        </section>)}
      </div>
    </main>
  );
}

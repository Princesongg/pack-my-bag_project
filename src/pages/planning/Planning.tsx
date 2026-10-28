import { ArrowDown, ArrowLeft, ArrowRight, Luggage } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { destinations } from '../../service/destination/destinations';
import { topics } from './topics';
import './Planning.css';

function Copy({ full, brief }: { full: string; brief: string }) { return <><span className="planning-full">{full}</span><span className="planning-brief">{brief}</span></>; }

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
      <div className="inner-heading"><div className="section-label">PROJECT PLANNING</div><h1>흩어진 여행 준비를 하나의 흐름으로.</h1><p>여행 정보 확인부터 준비물 관리, 출발 전 최종 점검까지 연결한 PACK MY BAG의 서비스 기획 과정을 소개합니다.</p></div>
      <div className="planning-banner"><span className="banner-icon" aria-hidden="true"><Luggage size={28}/></span><div><strong>PACK MY BAG</strong><p>여행 정보부터 준비물 체크, 출발 전 점검까지.</p></div></div>
      <div className="detail-section-header"><h2 id="planning-contents">Planning Contents</h2><span>원하는 섹션으로 바로 이동하거나 아래에서 순서대로 살펴보세요.</span></div>
      <nav className="topic-grid" aria-labelledby="planning-contents">
        {topics.map(({ id, no, name, icon: Icon }) => <a href={`#${id}`} className="topic-card" key={id}><span className="topic-top"><span>{no}</span><Icon size={16} aria-hidden="true"/></span><h3>{name}</h3><ArrowDown className="planning-topic-arrow" size={16} aria-hidden="true"/></a>)}
      </nav>
      <div className="planning-sections">
        {topics.map(topic => <section className="planning-section" id={topic.id} key={topic.id} aria-labelledby={`${topic.id}-title`}>
          {topic.id === 'project-overview'
            ? <header className="planning-section-heading planning-overview-heading"><div><div className="planning-overview-labels"><span>01 / PROJECT OVERVIEW</span><span>{topic.label}</span></div><h2 id={`${topic.id}-title`}>{topic.headline}</h2><p><Copy full={topic.summary} brief={topic.compactSummary}/></p></div></header>
            : topic.id === 'problem-goals'
              ? <header className="planning-section-heading planning-problems-heading"><div><span className="planning-problems-label">02 / PROBLEM &amp; GOALS</span><h2 id={`${topic.id}-title`}>{topic.headline}</h2><p><Copy full={topic.summary} brief={topic.compactSummary}/></p></div></header>
              : topic.id === 'research'
                ? <header className="planning-section-heading planning-research-heading"><div><span className="planning-research-label">03 / RESEARCH</span><h2 id={`${topic.id}-title`}>{topic.headline}</h2><p><Copy full={topic.summary} brief={topic.compactSummary}/></p></div></header>
                : <header className="planning-section-heading planning-service-heading"><div><span className="planning-service-label">04 / SERVICE PLANNING</span><h2 id={`${topic.id}-title`}>{topic.headline}</h2><p><Copy full={topic.summary} brief={topic.compactSummary}/></p></div></header>}
          {topic.id === 'service-planning' && <><div className="planning-service-flow"><h3 className="planning-service-label" id="planning-user-flow">USER FLOW <span>사용자 흐름</span></h3><ol className="planning-flow" aria-labelledby="planning-user-flow">{topic.steps.map(step => <li key={step.no}><span className="planning-flow-number"><Copy full={`STEP ${step.no}`} brief={step.no}/></span><span className="planning-flow-name">{step.name}</span><div className="planning-flow-copy"><h4><Copy full={step.title} brief={step.compactTitle}/></h4><p><Copy full={step.body} brief={step.compactBody}/></p></div>{step.no !== '04' && <ArrowRight className="planning-flow-arrow" size={16} aria-hidden="true"/>}</li>)}</ol></div><h3 className="planning-service-label planning-strategy-label">UX STRATEGY <span>UX 설계 전략</span></h3></>}
          {topic.id === 'problem-goals'
            ? <>
              <p className="planning-problems-note"><Copy full={topic.researchNote} brief={topic.compactResearchNote}/></p>
              <div className="planning-pair-headings"><div><span>UX PROBLEMS</span><h3>문제 정의</h3></div><div><span>DESIGN SOLUTIONS</span><h3>해결 방향</h3></div></div>
              <div className="planning-pairs">{topic.pairs.map(pair => <div className="planning-pair" key={pair.no}>
                <div className="planning-pair-compact planning-brief"><span className="planning-problems-label">{pair.no}</span><h4>{pair.compactTitle}</h4><ArrowDown size={14} aria-hidden="true"/><strong>{pair.goal.title}</strong><p>{pair.compactPurpose}</p></div><div className="planning-pair-problem planning-full"><span className="planning-problems-label">PROBLEM {pair.no}</span><h4>{pair.problem.title}</h4>{pair.problem.body.split('\n').map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>
                <div className="planning-pair-goal planning-full"><span className="planning-problems-label">SOLUTION {pair.no}</span><h4>{pair.goal.title}</h4>{pair.goal.body.split('\n').map(paragraph => <p key={paragraph}>{paragraph}</p>)}<ArrowRight className="planning-pair-link" size={16} aria-hidden="true"/></div>
              </div>)}</div>
              <p className="planning-condition-note planning-brief">{topic.conditionNote}</p>
              <aside className="planning-insight"><span className="planning-problems-label">KEY INSIGHT</span><h3>{topic.insightTitle}</h3><p><Copy full={topic.insight} brief={topic.compactInsight}/></p></aside>
              <div className="planning-problems-approach"><span className="planning-problems-label">OUR APPROACH</span><h3>{topic.objective}</h3><p className="planning-full">{topic.highlight}</p><ol className="planning-approach-flow" aria-label="하나로 이어지는 여행 준비 흐름">{topic.approachSteps.map((step, i) => <li key={step}><span>{step}</span>{i < topic.approachSteps.length - 1 && <ArrowRight size={14} aria-hidden="true"/>}</li>)}</ol></div>
              <div className="planning-problems-challenge"><span className="planning-problems-label">AI LAB CHALLENGE</span><h3><Copy full={topic.challengeTitle} brief={topic.compactChallengeTitle}/></h3><p className="planning-brief">{topic.compactChallengeBody}</p><div className="planning-full">{topic.challengeBody.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div><p className="planning-problems-production-note"><Copy full={topic.productionNote} brief={topic.compactProductionNote}/></p></div>
            </>
            : <div className="planning-block-grid">{topic.blocks.map(block => <div className="planning-block" key={block.title}><h3>{'keyword' in block && <span className="planning-block-keyword">{'compactKeyword' in block ? <Copy full={block.keyword} brief={block.compactKeyword}/> : block.keyword}</span>}{'compactTitle' in block ? <Copy full={block.title} brief={block.compactTitle}/> : block.title}</h3><p className="planning-brief">{block.compactBody}</p><div className="planning-full">{block.body.split('\n').map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div></div>)}</div>}
          {topic.id === 'research' && <div className="planning-scope"><div className="planning-scope-label"><span className="planning-research-label">RESEARCH SCOPE</span><span className="planning-scope-caption">조사 범위</span></div><strong><span className="planning-scope-local">{destinations.length}개국 · {destinations.reduce((sum, country) => sum + country.cities.length, 0)}개 도시</span><span className="planning-scope-english">{destinations.length} COUNTRIES · {destinations.reduce((sum, country) => sum + country.cities.length, 0)} CITIES</span></strong><p>{destinations.map(country => `${country.name} ${country.cities.length}`).join(' · ')}</p></div>}
          {topic.id === 'project-overview'
            ? <><div className="planning-highlight planning-overview-goal"><span>PROJECT GOAL</span><strong>{topic.goal}</strong></div><dl className="planning-overview-info">{topic.projectInfo.map(info => <div key={info.label}><dt>{info.label}</dt><dd>{info.value}</dd></div>)}</dl><p className="planning-overview-note">{topic.productionNote}</p></>
            : topic.id === 'research'
              ? <div className="planning-highlight planning-research-approach"><span className="planning-research-label">AI LAB · RESEARCH APPROACH</span><h3 className="planning-full">{topic.approachTitle}</h3><p><Copy full={topic.highlight} brief={topic.compactApproach}/></p><p className="planning-research-limit planning-brief">{topic.verificationNote}</p></div>
              : topic.id === 'service-planning' && <div className="planning-highlight planning-service-approach"><span className="planning-service-label">AI LAB / DESIGN &amp; DEVELOPMENT</span><h3 className="planning-full">{topic.approachTitle}</h3><p className="planning-full">{topic.highlight}</p><ol className="planning-production-flow" aria-label="AI 도구를 활용한 제작 과정">{topic.productionSteps.map((step, i) => <li key={step.name}><strong>{step.name}</strong><span><Copy full={step.role} brief={step.compactRole}/></span>{i < topic.productionSteps.length - 1 && <ArrowRight size={14} aria-hidden="true"/>}</li>)}</ol><p className="planning-service-author"><Copy full={topic.authorNote} brief={topic.compactAuthorNote}/></p></div>}
          <a className="planning-back-top" href="#planning-contents">목차로 돌아가기 ↑</a>
        </section>)}
      </div>
    </main>
  );
}

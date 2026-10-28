import { ArrowUpRight, ClipboardList, Code2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ProjectCard({ type }: { type: 'planning' | 'implementation' }) {
  const isPlan = type === 'planning';
  const title = isPlan ? '프로젝트 기획' : '프로젝트 구현';
  const href = isPlan ? '/planning' : '/implementation';
  const Icon = isPlan ? ClipboardList : Code2;
  return (
    <Link to={href} className={`project-card ${isPlan ? 'plan-card' : 'build-card'}`} aria-label={`${title} 페이지 열기`}>
      <div className="card-head">
        <span className="card-index">0{isPlan ? '1' : '2'} / {isPlan ? 'PLANNING' : 'IMPLEMENTATION'}</span>
      </div>
      <div className="card-icon-zone" aria-hidden="true"><span className="card-icon"><Icon size={38} strokeWidth={1.35} /></span>
        <span className="decoration-one" /><span className="decoration-two" />
      </div>
      <h3>{title}</h3>
      <p className="card-description-desktop">{isPlan
        ? '서비스 기획 배경부터 정보 조사, 사용자 흐름과 서비스 구조까지 기획 아카이브의 개요를 확인해 보세요.'
        : '여행 정보 입력부터 맞춤형 준비물 추천, 마지막 점검까지 구현한 서비스를 확인해 보세요.'}</p>
      <p className="card-description-mobile">{isPlan ? <>기획 배경·정보 조사와<br />사용자 흐름 아카이브</> : <>정보 입력·준비물 추천,<br />체크·최종 점검 구현</>}</p>
      <div className="card-bottom"><span className="card-description-desktop">{isPlan ? '기획 과정 살펴보기' : '구현 결과 살펴보기'}</span><span className="card-description-mobile">{isPlan ? '기획 보기' : '구현 보기'}</span><span className="card-arrow" aria-hidden="true"><ArrowUpRight size={21} /></span></div>
    </Link>
  );
}

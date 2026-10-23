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
        <span className={`status ${isPlan ? 'status-progress' : 'status-soon'}`}>{isPlan ? 'IN PROGRESS' : 'COMING SOON'}</span>
      </div>
      <div className="card-icon-zone"><span className="card-icon"><Icon size={38} strokeWidth={1.35} /></span>
        <span className="decoration-one" /><span className="decoration-two" />
      </div>
      <h3>{title}</h3>
      <p>{isPlan
        ? '왜 이 서비스를 만들었는지, 어떤 정보를 조사하고 어떻게 설계했는지 기록합니다.'
        : '실제 PACK MY BAG 서비스를 제작하고, 여행 정보를 탐색하고 짐을 챙기는 경험을 구현합니다.'}</p>
      <div className="card-bottom"><span>{isPlan ? '기획 과정 살펴보기' : '구현 공간 미리 보기'}</span><span className="card-arrow"><ArrowUpRight size={21} /></span></div>
    </Link>
  );
}

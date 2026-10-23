import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ServiceHeader from '../ServiceHeader';
import TripSetup from '../trip/TripSetup';
import MyBag from '../my-bag/MyBag';
import { useTrip } from '../trip/TripContext';
import { tripComplete } from '../trip/trip';
import '../service.css';
import './Workspace.css';

export default function PackingWorkspace() {
  const { trip } = useTrip();
  const [params, setParams] = useSearchParams();
  const result = params.get('view') === 'bag' && tripComplete(trip);
  useEffect(() => { window.scrollTo(0, 0); }, [result]);
  return <>
    {result ? <><div className="pmb-workspace-result-step" aria-label="현재 작업 단계">STEP 02 — MY BAG RESULT</div><MyBag/></> : <div className="pmb-service pmb-workspace"><ServiceHeader mode="workspace"/><main><div className="pmb-workspace-heading pmb-container"><Link to="/implementation">← START SCREEN</Link><p>PACKING WORKSPACE</p><h1>STEP 01 — TRIP INPUT</h1></div><TripSetup onComplete={() => setParams({ view: 'bag' })}/></main></div>}
  </>;
}

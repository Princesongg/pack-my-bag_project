import { useEffect, useState } from 'react';
import { Clock3 } from 'lucide-react';
import { destinations } from '../destination/destinations';
import { getCurrentCityTime } from '../data/currentTime';

export default function DestinationClock({ cityId }: { cityId: string }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const update = () => {
      setNow(new Date());
      timer = setTimeout(update, 60000 - Date.now() % 60000);
    };
    const resume = () => { clearTimeout(timer); update(); };
    update();
    document.addEventListener('visibilitychange', resume);
    return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', resume); };
  }, [cityId]);
  const city = destinations.flatMap(country => [...country.cities]).find(item => item.id === cityId);
  const clock = getCurrentCityTime(cityId, now);
  return <div className="pmb-destination-clock" role="timer" aria-label="여행 도시 현재 시각">
    <span className="pmb-destination-clock-label"><Clock3 size={18} aria-hidden="true"/>{city?.name ?? '현지'} 현재 시각</span>
    {clock ? <><strong className="pmb-destination-clock-time">{clock.time}</strong><span>{clock.difference}</span></> : <span>현지 시각을 확인할 수 없어요.</span>}
  </div>;
}

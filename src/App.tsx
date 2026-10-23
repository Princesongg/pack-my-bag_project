import { lazy, Suspense } from 'react';
import { TripProvider } from './service/trip/TripContext';
import { Navigate, Route, Routes } from 'react-router-dom';
import ArchiveLayout from './components/archive/ArchiveLayout';
import Home from './pages/home/Home';
import Planning from './pages/planning/Planning';
import ServiceHome from './service/ServiceHome';

const TravelInfo = lazy(() => import('./service/travel-info/TravelInfo'));
const MyBag = lazy(() => import('./service/my-bag/MyBag'));

export default function App() {
  return (
    <TripProvider><div className="app-wrap">
      <Routes>
        <Route path="/" element={<ArchiveLayout><Home /></ArchiveLayout>} />
        <Route path="/planning" element={<ArchiveLayout><Planning /></ArchiveLayout>} />
        <Route path="/implementation" element={<ServiceHome />} />
        <Route path="/implementation/destination" element={<Navigate to="/implementation#trip-setup" replace/>} />
        <Route path="/implementation/trip-details" element={<Navigate to="/implementation#trip-setup" replace/>} />
        <Route path="/implementation/travel-info" element={<Suspense fallback={<p role="status">Loading travel guide...</p>}><TravelInfo /></Suspense>} />
        <Route path="/implementation/my-bag" element={<Suspense fallback={<p role="status">Loading packing list...</p>}><MyBag /></Suspense>} />
        <Route path="*" element={<ArchiveLayout><Home /></ArchiveLayout>} />
      </Routes>
    </div></TripProvider>
  );
}

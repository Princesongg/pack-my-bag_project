import { createContext, useContext, useEffect, useState, type ReactNode, type SetStateAction } from 'react';
import { validateSelection, type DestinationSelection } from '../destination/destinations';
import { emptyTrip, loadTrip, recalculateTrip, tripKey, type Trip } from './trip';

type TripContextValue = {
  trip: Trip; saved: boolean;
  setSelection: (value: SetStateAction<DestinationSelection>) => void;
  updateDetails: (value: Partial<Pick<Trip, 'departureDate' | 'returnDate' | 'travelPurpose' | 'baggageType'>>) => void;
  persist: () => boolean;
};
const TripContext = createContext<TripContextValue | null>(null);

export function TripProvider({ children }: { children: ReactNode }) {
  const [trip, setTrip] = useState<Trip>(() => { try { return loadTrip(window.localStorage); } catch { return { ...emptyTrip }; } });
  const [saved, setSaved] = useState(true);
  function persist() {
    try { window.localStorage.setItem(tripKey, JSON.stringify(recalculateTrip(trip))); setSaved(true); return true; }
    catch { setSaved(false); return false; }
  }
  useEffect(() => {
    try { window.localStorage.setItem(tripKey, JSON.stringify(trip)); setSaved(true); }
    catch { setSaved(false); }
  }, [trip]);
  function setSelection(value: SetStateAction<DestinationSelection>) {
    setTrip(current => {
      const destination = validateSelection(typeof value === 'function' ? value(current) : value);
      return recalculateTrip({ ...(destination.countryId && destination.cityId ? current : emptyTrip), ...destination });
    });
  }
  return <TripContext.Provider value={{ trip, saved, setSelection, persist, updateDetails: value => setTrip(current => recalculateTrip({ ...current, ...value })) }}>{children}</TripContext.Provider>;
}

export function useTrip() {
  const context = useContext(TripContext);
  if (!context) throw new Error('TripProvider is required');
  return context;
}

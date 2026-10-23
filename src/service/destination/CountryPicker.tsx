import { useState } from 'react';
import { Check, Search, X } from 'lucide-react';
import { destinations, filterDestinations, popularCountryIds } from './destinations';

type Props = { selectedId: string; onSelect: (countryId: string) => void };

export default function CountryPicker({ selectedId, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const searching = query.trim().length > 0;

  const results = filterDestinations(destinations, query);
  const popular = popularCountryIds.flatMap(id => destinations.filter(country => country.id === id));

  function renderCountry(item: typeof destinations[number], compact = false) {
    return <button type="button" key={item.id} className={`pmb-country-button ${compact ? 'pmb-country-row' : ''}`} aria-pressed={selectedId === item.id} onClick={() => onSelect(item.id)}>
      <img className="pmb-country-flag" src={`/flags/${item.id.toLowerCase()}.svg`} alt="" width="52" height="36"/>
      <span className="pmb-country-name"><strong>{item.name}</strong><span className="pmb-choice-english">{item.english}</span></span>
      <span className="pmb-choice-check" aria-hidden="true"><Check size={15}/></span>
    </button>;
  }

  return <fieldset className="pmb-choice-group pmb-country-picker"><legend><span>01</span> 나라를 선택해 주세요 <small>한 곳 선택</small></legend>
    <label className="pmb-search-label" htmlFor="pmb-country-search">국가 검색</label>
    <div className="pmb-search"><Search size={20} aria-hidden="true"/><input id="pmb-country-search" type="search" placeholder="국가명으로 검색해 보세요 (예: 일본, Japan)" value={query} onChange={event => setQuery(event.target.value)} aria-controls="pmb-all-countries" autoComplete="off"/>{query && <button type="button" aria-label="국가 검색어 지우기" onClick={() => { setQuery(''); document.getElementById('pmb-country-search')?.focus(); }}><X size={17}/></button>}</div>
    <div className="pmb-country-heading"><h3>지원 국가</h3></div>
    <div id="pmb-all-countries" className="pmb-country-grid" role="group" aria-label="국가 선택">{(searching ? results : popular).map(item => renderCountry(item))}</div>
    {results.length === 0 && <p className="pmb-search-empty" role="status">검색 결과가 없어요. 국가명을 확인해 주세요.</p>}
  </fieldset>;
}

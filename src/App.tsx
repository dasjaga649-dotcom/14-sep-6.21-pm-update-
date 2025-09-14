import './App.css';
import './chat.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { sendChat } from './api/chat';

type Attraction = {
  id?: string | number;
  title: string;
  location?: string;
  rating?: number;
  imageUrl?: string;
  description?: string;
  link?: string;
};

type Flight = {
  id: string;
  airline: string;
  airlineLogo?: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTime: string; // ISO
  arrivalTime: string; // ISO
  durationMin: number;
  layovers: string[];
  travelClass?: string;
  price: number;
  currency?: string;
};

type ItineraryActivity = {
  id?: string | number;
  title: string;
  description?: string;
  imageUrl?: string;
  rating?: number;
};

type ItineraryDay = {
  id?: string | number;
  title?: string;
  date?: string;
  activities?: ItineraryActivity[];
};

type Itinerary = {
  id?: string | number;
  title?: string;
  subtitle?: string;
  description?: string;
  coverImage?: string;
  durationDays?: number;
  placesVisited?: number;
  days?: ItineraryDay[];
  exploreMore?: ItineraryActivity[];
};

type Hotel = {
  id: string;
  name: string;
  imageUrl?: string;
  images?: string[];
  rating?: number;
  reviewsCount?: number;
  city?: string;
  address?: string;
  pricePerNight: number;
  currency?: string;
  amenities?: string[];
};

type ChatMessage = {
  role: 'user' | 'assistant';
  kind: 'text' | 'markdown' | 'json' | 'attractions' | 'flights' | 'itinerary' | 'hotels';
  text?: string;
  json?: unknown;
  attractions?: Attraction[];
  flights?: Flight[];
  itinerary?: Itinerary;
  hotels?: Hotel[];
};

function AttractionsCards({ items }: { items: Attraction[] }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('All');
  const [minRating, setMinRating] = useState<number>(0);
  const [showFilter, setShowFilter] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 9;

  const categories = useMemo(() => {
    const s = new Set<string>();
    items.forEach((a: any) => {
      const c = a?.category ?? a?.type ?? a?.category_name ?? a?.kind ?? null;
      if (c) s.add(String(c));
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((a: any) => {
      const cat = String(a?.category ?? a?.type ?? a?.category_name ?? 'Other');
      const matchesCat = category === 'All' || cat === category;
      const r = typeof a?.rating === 'number' ? a.rating : 0;
      const matchesRating = !minRating || r >= minRating;
      const text = [a.title, a.location, a.description].filter(Boolean).join(' ').toLowerCase();
      const matchesQ = !q || text.includes(q);
      return matchesCat && matchesRating && matchesQ;
    });
  }, [items, search, category, minRating]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => { setPage(1); }, [search, category, minRating, items.length]);
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="attractions-wrapper">
      <div className="attractions-toolbar">
        <div className="search-box">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#000" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5Zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14Z"/></svg>
          <input className="search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search attractions..." />
        </div>
        <div className="filter-group">
          <button type="button" className="filter-trigger" onClick={() => setShowFilter(v => !v)}>
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="#000" d="M3 5h18v2H3V5Zm4 6h10v2H7v-2Zm3 6h4v2h-4v-2Z"/></svg>
            Filter
          </button>
          {showFilter && (
            <div className="filter-panel">
              <div className="filter-row">
                <label className="filter-label">Category</label>
                <select className="filter-select" value={category} onChange={e => setCategory(e.target.value)}>
                  <option>All</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="filter-row">
                <label className="filter-label">Minimum Rating</label>
                <select className="filter-select" value={minRating} onChange={e => setMinRating(Number(e.target.value))}>
                  <option value={0}>Any Rating</option>
                  <option value={3}>3.0+ Stars</option>
                  <option value={3.5}>3.5+ Stars</option>
                  <option value={4}>4.0+ Stars</option>
                  <option value={4.5}>4.5+ Stars</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="attractions-cards" role="list">
        {pageItems.map((a, idx) => (
          <article key={a.id ?? idx} className="attraction-card" role="listitem">
            {a.imageUrl && (
              <div className="attraction-image-wrap">
                <img className="attraction-image" src={a.imageUrl} alt={a.title} loading="lazy" />
              </div>
            )}
            <div className="attraction-body">
              <h4 className="attraction-title">{a.title}</h4>
              <div className="attraction-meta">
                {a.location && (
                  <span className="attraction-location">
                    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="#000" d="M12 2a7 7 0 0 0-7 7c0 4.6 6 11 6.6 11.6a.5.5 0 0 0 .8 0C13 20 19 13.6 19 9a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z"/></svg>
                    {a.location}
                  </span>
                )}
                {typeof a.rating === 'number' && (
                  <span className="attraction-rating">
                    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="#f2b01e" d="M12 2.5 14.9 9l6.6.5-5 4.2 1.6 6.3L12 16.9 5.9 20l1.6-6.3-5-4.2L9.1 9 12 2.5Z"/></svg>
                    {a.rating?.toFixed(1)}
                  </span>
                )}
              </div>
              {a.description && <p className="attraction-desc">{a.description}</p>}
              {a.link && <a href={a.link} target="_blank" rel="noreferrer" className="attraction-link">Read more</a>}
            </div>
          </article>
        ))}
      </div>

      <div className="attractions-pagination">
        <button type="button" className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} aria-label="Previous page">‹</button>
        <span className="page-indicator">Page {page} of {pageCount}</span>
        <button type="button" className="page-btn" onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page === pageCount} aria-label="Next page">›</button>
      </div>
    </div>
  );
}

function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

function timeOfDayBucket(dateISO: string): 'night' | 'morning' | 'afternoon' | 'evening' {
  const h = new Date(dateISO).getHours();
  if (h >= 0 && h < 6) return 'night';
  if (h >= 6 && h < 12) return 'morning';
  if (h >= 12 && h < 18) return 'afternoon';
  return 'evening';
}

function FlightResults({ flights }: { flights: Flight[] }) {
  const [query, setQuery] = useState('');
  const [priceMax, setPriceMax] = useState<number>(() => Math.ceil(Math.max(...flights.map(f => f.price))));
  const [airlinesSel, setAirlinesSel] = useState<string[]>([]);
  const [stopsSel, setStopsSel] = useState<'any' | 0 | 1 | 2>('any');
  const [classSel, setClassSel] = useState<string>('Any');
  const [timeSel, setTimeSel] = useState<'any' | 'night' | 'morning' | 'afternoon' | 'evening'>('any');
  const [sort, setSort] = useState<'priceAsc' | 'durationAsc' | 'departAsc'>('priceAsc');

  const priceCeil = Math.ceil(Math.max(...flights.map(f => f.price)) || 0);

  const airlines = useMemo(() => Array.from(new Set(flights.map(f => f.airline))).sort((a, b) => a.localeCompare(b)), [flights]);
  const classes = useMemo(() => ['Any', ...Array.from(new Set(flights.map(f => f.travelClass).filter(Boolean) as string[]))], [flights]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = flights.filter(f => {
      const matchesQ = !q || `${f.airline} ${f.departureAirport} ${f.arrivalAirport}`.toLowerCase().includes(q);
      const matchesPrice = f.price <= priceMax;
      const stops = f.layovers?.length || 0;
      const matchesStops = stopsSel === 'any' || (stopsSel === 2 ? stops >= 2 : stops === stopsSel);
      const matchesAirline = airlinesSel.length === 0 || airlinesSel.includes(f.airline);
      const matchesClass = classSel === 'Any' || f.travelClass === classSel;
      const tod = timeOfDayBucket(f.departureTime);
      const matchesTime = timeSel === 'any' || timeSel === tod;
      return matchesQ && matchesPrice && matchesStops && matchesAirline && matchesClass && matchesTime;
    });

    if (sort === 'priceAsc') arr = arr.sort((a, b) => a.price - b.price);
    else if (sort === 'durationAsc') arr = arr.sort((a, b) => a.durationMin - b.durationMin);
    else if (sort === 'departAsc') arr = arr.sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());

    return arr;
  }, [flights, query, priceMax, airlinesSel, stopsSel, classSel, timeSel, sort]);

  return (
    <div className="flight-results">
      <div className="flight-toolbar">
        <div className="flight-filters">
          <div className="filter-col">
            <label className="filter-title">Airlines</label>
            <div className="airlines-list">
              {airlines.map(a => (
                <label key={a} className="airline-check">
                  <input
                    type="checkbox"
                    checked={airlinesSel.includes(a)}
                    onChange={e => setAirlinesSel(prev => e.target.checked ? [...prev, a] : prev.filter(x => x !== a))}
                  />
                  <span>{a}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="filter-col">
            <label className="filter-title">Max Price</label>
            <div className="price-row">
              <input className="price-range" type="range" min={0} max={priceCeil} value={priceMax} onChange={e => setPriceMax(Number(e.target.value))} />
              <span className="price-value">Up to {filtered[0]?.currency || flights[0]?.currency || 'USD'} {priceMax}</span>
            </div>
          </div>
          <div className="filter-col">
            <label className="filter-title">Departure Time</label>
            <select className="filter-select" value={timeSel} onChange={e => setTimeSel(e.target.value as any)}>
              <option value="any">Any</option>
              <option value="morning">Morning (6AM - 12PM)</option>
              <option value="afternoon">Afternoon (12PM - 6PM)</option>
              <option value="evening">Evening (6PM - 12AM)</option>
              <option value="night">Night (12AM - 6AM)</option>
            </select>
          </div>
          <div className="filter-col">
            <label className="filter-title">Stops</label>
            <select className="filter-select" value={String(stopsSel)} onChange={e => setStopsSel(e.target.value === 'any' ? 'any' : (e.target.value === '2' ? 2 : Number(e.target.value) as any))}>
              <option value="any">Any</option>
              <option value="0">Non-stop</option>
              <option value="1">1 Stop</option>
              <option value="2">2+ Stops</option>
            </select>
          </div>
          <div className="filter-col">
            <label className="filter-title">Travel Class</label>
            <select className="filter-select" value={classSel} onChange={e => setClassSel(e.target.value)}>
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="filter-col wide">
            <label className="filter-title">Search</label>
            <input className="search-input flight-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search airport or airline" />
          </div>
          <div className="filter-col">
            <label className="filter-title">Sort by</label>
            <select className="filter-select" value={sort} onChange={e => setSort(e.target.value as any)}>
              <option value="priceAsc">Price (Low to High)</option>
              <option value="durationAsc">Duration (Short to Long)</option>
              <option value="departAsc">Departure (Early to Late)</option>
            </select>
          </div>
        </div>
        <div className="results-meta">Showing {filtered.length} of {flights.length} flights</div>
      </div>

      <div className="flight-list" role="list">
        {filtered.map(f => {
          const dep = new Date(f.departureTime);
          const arr = new Date(f.arrivalTime);
          const depTime = dep.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const arrTime = arr.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const stops = f.layovers?.length || 0;
          const stopLabel = stops === 0 ? 'Non-stop' : stops === 1 ? '1 stop' : `${stops} stops`;
          return (
            <article key={f.id} className="flight-card" role="listitem">
              <div className="flight-left">
                <div className="flight-times">
                  <div className="time-col">
                    <div className="time-val">{depTime}</div>
                    <div className="airport-code">{f.departureAirport}</div>
                    <div className="date-small">{dep.toDateString()}</div>
                  </div>
                  <div className="route-col">
                    <div className="duration">{formatDuration(f.durationMin)}</div>
                    <div className="stops">{stopLabel}</div>
                  </div>
                  <div className="time-col">
                    <div className="time-val">{arrTime}</div>
                    <div className="airport-code">{f.arrivalAirport}</div>
                    <div className="date-small">{arr.toDateString()}</div>
                  </div>
                </div>
                <div className="airline-row">
                  {f.airlineLogo && <img className="airline-logo" src={f.airlineLogo} alt={f.airline} loading="lazy" />}
                  <span className="airline-name">{f.airline}</span>
                  {f.travelClass && <span className="class-badge">{f.travelClass}</span>}
                </div>
              </div>
              <div className="flight-right">
                <div className="price-tag">{f.currency || 'USD'} {f.price}</div>
                <button type="button" className="btn select-flight">Select Flight</button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function ItineraryCard({ data }: { data: Itinerary }) {
  const days = data.days || [];
  const duration = data.durationDays || (Array.isArray(days) ? days.length : undefined);
  const places = data.placesVisited;

  return (
    <section className="itinerary-wrap">
      <div className="itinerary-hero">
        {data.coverImage && <img className="itinerary-hero-img" src={data.coverImage} alt={data.title || 'Trip'} loading="lazy" />}
        <div className="itinerary-hero-overlay">
          {data.title && <h2 className="itinerary-title">{data.title}</h2>}
          {data.subtitle && <p className="itinerary-subtitle">{data.subtitle}</p>}
          <div className="itinerary-stats">
            {typeof duration === 'number' && <span className="stat-pill">Duration: {duration} {duration === 1 ? 'Day' : 'Days'}</span>}
            {typeof places === 'number' && <span className="stat-pill">Places Visited: {places}</span>}
          </div>
        </div>
      </div>

      {data.description && <p className="itinerary-desc">{data.description}</p>}

      {Array.isArray(days) && days.length > 0 && (
        <div className="itinerary-days">
          <h3 className="section-heading">Daily Itinerary</h3>
          {days.map((d, i) => (
            <div key={d.id ?? i} className="day-card">
              <div className="day-header">
                <span className="day-index">{i + 1}</span>
                <div className="day-titles">
                  <div className="day-title">{d.title || `Day ${i + 1}`}</div>
                  {d.date && <div className="day-sub">{d.date}</div>}
                </div>
              </div>
              {Array.isArray(d.activities) && d.activities.length > 0 && (
                <ul className="activity-list">
                  {d.activities.map((a, j) => (
                    <li key={a.id ?? j} className="activity-item">
                      {a.imageUrl && <img className="activity-thumb" src={a.imageUrl} alt={a.title} loading="lazy" />}
                      <div className="activity-body">
                        <div className="activity-title">{a.title}</div>
                        {a.description && <div className="activity-desc">{a.description}</div>}
                        {typeof a.rating === 'number' && (
                          <div className="activity-rating">★ {a.rating.toFixed(1)}</div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {Array.isArray(data.exploreMore) && data.exploreMore.length > 0 && (
        <div className="itinerary-explore">
          <h3 className="section-heading">Explore More</h3>
          <div className="explore-track" role="list">
            {data.exploreMore.map((x, k) => (
              <article key={x.id ?? k} className="explore-card" role="listitem">
                {x.imageUrl && <img className="explore-img" src={x.imageUrl} alt={x.title} loading="lazy" />}
                <div className="explore-body">
                  <div className="explore-title">{x.title}</div>
                  {typeof x.rating === 'number' && <div className="explore-rating">★ {x.rating.toFixed(1)}</div>}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function HotelsResults({ hotels }: { hotels: Hotel[] }) {
  const [openFilters, setOpenFilters] = useState(false);
  const [query, setQuery] = useState('');
  const [minRating, setMinRating] = useState<number>(0);
  const [priceMin, setPriceMin] = useState<number>(() => Math.min(...hotels.map(h => h.pricePerNight)) || 0);
  const [priceMax, setPriceMax] = useState<number>(() => Math.max(...hotels.map(h => h.pricePerNight)) || 0);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [sort, setSort] = useState<'priceAsc' | 'priceDesc' | 'ratingDesc'>('priceAsc');

  const allAmenities = useMemo(() => Array.from(new Set(hotels.flatMap(h => h.amenities || []))).sort((a,b)=>a.localeCompare(b)), [hotels]);
  const currency = hotels[0]?.currency || 'USD';

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = hotels.filter(h => {
      const inQuery = !q || `${h.name} ${h.city} ${h.address}`.toLowerCase().includes(q);
      const inRating = !minRating || (h.rating || 0) >= minRating;
      const inPrice = h.pricePerNight >= priceMin && h.pricePerNight <= priceMax;
      const inAmenities = selectedAmenities.length === 0 || selectedAmenities.every(a => (h.amenities||[]).includes(a));
      return inQuery && inRating && inPrice && inAmenities;
    });
    if (sort === 'priceAsc') arr = arr.sort((a,b)=>a.pricePerNight-b.pricePerNight);
    else if (sort === 'priceDesc') arr = arr.sort((a,b)=>b.pricePerNight-a.pricePerNight);
    else if (sort === 'ratingDesc') arr = arr.sort((a,b)=>(b.rating||0)-(a.rating||0));
    return arr;
  }, [hotels, query, minRating, priceMin, priceMax, selectedAmenities, sort]);

  function toggleAmenity(a: string, checked: boolean) {
    setSelectedAmenities(prev => checked ? [...prev, a] : prev.filter(x => x !== a));
  }

  return (
    <section className="hotel-results">
      <div className="hotel-toolbar">
        <div className="hotel-toolbar-left">
          <button type="button" className="btn filter-btn" onClick={() => setOpenFilters(true)}>Filters</button>
          <input className="search-input hotel-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search hotels or locations" />
        </div>
        <div className="hotel-toolbar-right">
          <label className="filter-title">Sort by</label>
          <select className="filter-select" value={sort} onChange={e=>setSort(e.target.value as any)}>
            <option value="priceAsc">Price (Low to High)</option>
            <option value="priceDesc">Price (High to Low)</option>
            <option value="ratingDesc">Rating (High to Low)</option>
          </select>
        </div>
      </div>

      {openFilters && (
        <div className="hotel-filter-modal" role="dialog" aria-modal="true">
          <div className="hotel-filter-panel">
            <div className="filter-header">
              <div className="filter-title">Filters</div>
              <button className="close-x" aria-label="Close" onClick={()=>setOpenFilters(false)}>×</button>
            </div>
            {allAmenities.length>0 && (
              <div className="filter-block">
                <div className="filter-subtitle">Amenities</div>
                <div className="amenities-grid">
                  {allAmenities.map(a => (
                    <label key={a} className="amenity-check">
                      <input type="checkbox" checked={selectedAmenities.includes(a)} onChange={e=>toggleAmenity(a, e.target.checked)} />
                      <span>{a}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="filter-block">
              <div className="filter-subtitle">Minimum Rating</div>
              <div className="rating-opts">
                {[0,3,4,4.5].map(r => (
                  <label key={r} className="rating-radio">
                    <input type="radio" name="minRating" checked={minRating===r} onChange={()=>setMinRating(r)} />
                    <span>{r===0?'Any rating':`${r}+ ★`}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="filter-block">
              <div className="filter-subtitle">Price Range (per night)</div>
              <div className="price-range-row">
                <input className="price-input" type="number" value={priceMin} min={0} onChange={e=>setPriceMin(Number(e.target.value))} />
                <input className="price-input" type="number" value={priceMax} min={0} onChange={e=>setPriceMax(Number(e.target.value))} />
              </div>
            </div>
            <div className="filter-actions">
              <button className="btn secondary" type="button" onClick={()=>{setMinRating(0); setSelectedAmenities([]); setPriceMin(Math.min(...hotels.map(h=>h.pricePerNight))||0); setPriceMax(Math.max(...hotels.map(h=>h.pricePerNight))||0); setQuery('');}}>Clear All</button>
              <button className="btn" type="button" onClick={()=>setOpenFilters(false)}>Apply Filters</button>
            </div>
          </div>
        </div>
      )}

      <div className="hotel-grid" role="list">
        {filtered.map((h, i) => (
          <article key={h.id || i} className="hotel-card" role="listitem">
            {h.imageUrl && <img className="hotel-img" src={h.imageUrl} alt={h.name} loading="lazy" />}
            <div className="hotel-body">
              <div className="hotel-title-row">
                <h4 className="hotel-name">{h.name}</h4>
                <div className="hotel-price">{h.currency || currency} {h.pricePerNight}</div>
              </div>
              <div className="hotel-meta">
                {typeof h.rating === 'number' && (
                  <span className="hotel-rating">★ {h.rating.toFixed(1)}{typeof h.reviewsCount==='number' ? ` (${h.reviewsCount} reviews)` : ''}</span>
                )}
                {(h.city || h.address) && <span className="hotel-location">{[h.city, h.address].filter(Boolean).join(', ')}</span>}
              </div>
              {Array.isArray(h.amenities) && h.amenities.length>0 && (
                <div className="hotel-amenities">
                  {h.amenities.slice(0,4).map((a, idx)=>(<span key={idx} className="amenity-pill">{a}</span>))}
                  {h.amenities.length>4 && <span className="amenity-more">+{h.amenities.length-4} more</span>}
                </div>
              )}
              <button className="btn view-details" type="button">View Details</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function MessageContent({ m }: { m: ChatMessage }) {
  if (m.kind === 'attractions' && m.attractions) {
    return <AttractionsCards items={m.attractions} />;
  }
  if (m.kind === 'flights' && m.flights) {
    return <FlightResults flights={m.flights} />;
  }
  if (m.kind === 'itinerary' && m.itinerary) {
    return <ItineraryCard data={m.itinerary} />;
  }
  if (m.kind === 'hotels' && m.hotels) {
    return <HotelsResults hotels={m.hotels} />;
  }
  if (m.kind === 'json') {
    const pretty = JSON.stringify(m.json, null, 2);
    return (
      <pre className="json-pre"><code className="json-code">{pretty}</code></pre>
    );
  }
  if (m.kind === 'markdown') {
    return (
      <div className="md">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: (props: any) => <a {...props} target="_blank" rel="noreferrer" />,
            img: (props: any) => <img {...props} loading="lazy" alt={props.alt || ''} />,
            table: (props: any) => <table {...props} className="md-table" />,
            pre: (props: any) => <pre {...props} className="md-pre" />,
            code: (props: any) => <code {...props} className={`md-code ${props.className || ''}`.trim()} />,
          }}
        >
          {m.text || ''}
        </ReactMarkdown>
      </div>
    );
  }
  return <span>{m.text}</span>;
}

export default function App() {
  const [sessionId, setSessionId] = useState('user_12345');
  const [userPrompt, setUserPrompt] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  const apiBase = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

  function normalizeAttractions(input: any): Attraction[] | null {
    const arr: any[] | undefined = Array.isArray(input?.attractionsData) ? input.attractionsData
      : Array.isArray(input?.dbData) ? input.dbData
      : Array.isArray(input?.attractions) ? input.attractions
      : Array.isArray(input?.items) ? input.items
      : Array.isArray(input?.data) ? input.data
      : undefined;
    if (!arr || arr.length === 0) return null;
    return arr.map((it: any, idx: number): Attraction => {
      const title = it.title || it.name || it.placeName || `Attraction ${idx + 1}`;
      const locName = typeof it.location === 'string' ? it.location : it.location?.name;
      const location = locName || it.city || it.address || [it.city, it.state].filter(Boolean).join(', ');
      const ratingRaw = it.rating ?? it.stars ?? it.score;
      const rating = typeof ratingRaw === 'string' ? parseFloat(ratingRaw) : typeof ratingRaw === 'number' ? ratingRaw : undefined;
      const firstImage = Array.isArray(it.imagelinks) ? it.imagelinks[0] : undefined;
      const imageUrl = it.imageUrl || it.image || it.photo || it.picture || it.thumbnail || firstImage;
      const description = it.description || it.desc || it.summary || it.about;
      const link = it.link || it.url || it.more || undefined;
      const id = it.id ?? it.attraction_id ?? idx;
      return { id, title, location, rating, imageUrl, description, link };
    });
  }

  function normalizeFlights(input: any): Flight[] | null {
    const arr: any[] | undefined = Array.isArray(input?.flightsData) ? input.flightsData
      : Array.isArray(input?.dbData) ? input.dbData
      : Array.isArray(input?.flights) ? input.flights
      : Array.isArray(input?.items) ? input.items
      : Array.isArray(input?.data) && input.text === '[flightData]' ? input.data
      : undefined;
    if (!arr || arr.length === 0) return null;
    return arr.map((it: any, idx: number): Flight => {
      const id = String(it.flight_id || it.id || `flight_${idx + 1}`);
      const departureTime = it.departuredatetime || it.departure_time || it.departure || it.departureTime;
      const arrivalTime = it.arrivaldatetime || it.arrival_time || it.arrival || it.arrivalTime;
      const departureAirport = it.departureairportcode || it.from || it.departure_airport || it.origin || it.departureAirportCode || it.departureAirport || '';
      const arrivalAirport = it.arrivalairportcode || it.to || it.arrival_airport || it.destination || it.arrivalAirportCode || it.arrivalAirport || '';
      const durationMin = typeof it.totalduration === 'string' ? parseInt(it.totalduration, 10) : (typeof it.totalduration === 'number' ? it.totalduration : Number(it.durationMin || 0));
      const layovers = Array.isArray(it.layovers) ? it.layovers.map((x: any) => String(x)) : [];
      const airline = it.airline || it.carrier || it.operator || 'Airline';
      const airlineLogo = it.airline_logo || it.logo || it.airlineLogo || undefined;
      const travelClass = it.travelclass || it.cabin || it.class || undefined;
      const price = typeof it.price === 'string' ? Number(parseFloat(it.price)) : (typeof it.price === 'number' ? it.price : 0);
      const currency = it.pricecurrency || it.currency || undefined;
      return { id, airline, airlineLogo, departureAirport, arrivalAirport, departureTime, arrivalTime, durationMin, layovers, travelClass, price, currency };
    });
  }

  function normalizeItinerary(input: any): Itinerary | null {
    const root = input?.itenaryData || input?.itineraryData || input?.itinerary || (input?.text === '[itineraryData]' ? input?.data : undefined) || null;
    if (!root || typeof root !== 'object') return null;
    const r: any = root;
    const title = r.title || r.tripTitle || r.name;
    const subtitle = r.subtitle || r.tagline;
    const description = r.description || r.summary || r.about;
    const coverImage = r.coverImage || r.image || r.hero || r.banner;
    const durationDays = typeof r.durationDays === 'number' ? r.durationDays : (Array.isArray(r.days) ? r.days.length : undefined);
    const placesVisited = typeof r.placesVisited === 'number' ? r.placesVisited : undefined;

    const daysSrc: any[] = Array.isArray(r.days) ? r.days
      : Array.isArray(r.itineraryDays) ? r.itineraryDays
      : Array.isArray(r.schedule) ? r.schedule
      : [];

    const days: ItineraryDay[] = daysSrc.map((d: any, i: number) => {
      const title = d.title || d.name || d.heading || `Day ${i + 1}`;
      const date = d.date || d.day || undefined;
      const actsSrc: any[] = Array.isArray(d.activities) ? d.activities : Array.isArray(d.items) ? d.items : [];
      const activities: ItineraryActivity[] = actsSrc.map((a: any, j: number) => {
        const ratingRaw = a.rating ?? a.stars ?? a.score;
        const rating = typeof ratingRaw === 'string' ? parseFloat(ratingRaw) : (typeof ratingRaw === 'number' ? ratingRaw : undefined);
        return {
          id: a.id ?? j,
          title: a.title || a.name || `Activity ${j + 1}`,
          description: a.description || a.desc || a.summary,
          imageUrl: a.imageUrl || a.image || a.photo || a.thumbnail,
          rating,
        };
      });
      return { id: d.id ?? i, title, date, activities };
    });

    const moreSrc: any[] = Array.isArray(r.exploreMore) ? r.exploreMore : Array.isArray(r.recommendations) ? r.recommendations : [];
    const exploreMore: ItineraryActivity[] = moreSrc.map((x: any, k: number) => {
      const ratingRaw = x.rating ?? x.stars ?? x.score;
      const rating = typeof ratingRaw === 'string' ? parseFloat(ratingRaw) : (typeof ratingRaw === 'number' ? ratingRaw : undefined);
      return {
        id: x.id ?? k,
        title: x.title || x.name || `Place ${k + 1}`,
        imageUrl: x.imageUrl || x.image || x.photo || x.thumbnail,
        rating,
      };
    });

    return { id: r.id, title, subtitle, description, coverImage, durationDays, placesVisited, days, exploreMore };
  }

  function normalizeHotels(input: any): Hotel[] | null {
    const arr: any[] | undefined = Array.isArray(input?.hotelsData) ? input.hotelsData
      : Array.isArray(input?.hotels) ? input.hotels
      : Array.isArray(input?.dbData) ? input.dbData
      : Array.isArray(input?.items) ? input.items
      : Array.isArray(input?.data) && (input.text === 'HotelData' || input.text === '[HotelData]') ? input.data
      : undefined;
    if (!arr || arr.length === 0) return null;
    return arr.map((it: any, idx: number): Hotel => {
      const id = String(it.hotel_id || it.id || `hotel_${idx + 1}`);
      const name = it.name || it.hotel_name || it.title || `Hotel ${idx + 1}`;
      const images: string[] = Array.isArray(it.images) ? it.images : Array.isArray(it.photos) ? it.photos : Array.isArray(it.imageUrls) ? it.imageUrls : [];
      const imageUrl = it.imageUrl || it.image || images[0];
      const ratingRaw = it.rating ?? it.stars ?? it.score;
      const rating = typeof ratingRaw === 'string' ? parseFloat(ratingRaw) : (typeof ratingRaw === 'number' ? ratingRaw : undefined);
      const reviewsCount = typeof it.reviews === 'number' ? it.reviews : (typeof it.review_count === 'number' ? it.review_count : undefined);
      const city = it.city || it.town || it.locality || undefined;
      const address = it.address || it.location || it.area || undefined;
      const priceRaw = it.pricePerNight ?? it.price_per_night ?? it.price ?? 0;
      const pricePerNight = typeof priceRaw === 'string' ? Number(String(priceRaw).replace(/[^0-9.]/g,'')) : Number(priceRaw);
      const currency = it.currency || it.pricecurrency || 'USD';
      const amenities: string[] = Array.isArray(it.amenities) ? it.amenities.map((x:any)=>String(x)) : [];
      return { id, name, imageUrl, images, rating, reviewsCount, city, address, pricePerNight, currency, amenities };
    });
  }

  function toAssistantMessage(data: unknown, contentType?: string): ChatMessage {
    if (contentType?.includes('application/json')) {
      try {
        const obj = typeof data === 'string' ? JSON.parse(data) : data;
        // If object contains a plain text reply, show as markdown/text
        if (obj && typeof (obj as any).text === 'string') {
          const t = (obj as any).text as string;
          return { role: 'assistant', kind: 'markdown', text: t };
        }

        const isFlights = obj && (obj.text === '[flightData]' || (obj as any).type === 'flightData' || (obj as any).kind === 'flights');
        if (isFlights) {
          const flights = normalizeFlights(obj);
          if (flights) return { role: 'assistant', kind: 'flights', flights };
        }
        const hotels = normalizeHotels(obj);
        if ((obj as any)?.text === 'HotelData' || hotels) {
          if (hotels && hotels.length) return { role: 'assistant', kind: 'hotels', hotels };
        }
        const iti = normalizeItinerary(obj);
        if (iti) {
          return { role: 'assistant', kind: 'itinerary', itinerary: iti };
        }
        const shouldShowCards = obj && (obj.text === '[attractionsData]' || obj.type === 'attractionsData' || obj.kind === 'attractions');
        const normalized = normalizeAttractions(obj);
        if (shouldShowCards && normalized) {
          return { role: 'assistant', kind: 'attractions', attractions: normalized };
        }
        return { role: 'assistant', kind: 'json', json: obj };
      } catch {
        return { role: 'assistant', kind: 'json', json: data };
      }
    }
    if (contentType?.includes('text/markdown') || contentType?.includes('text/plain')) {
      return { role: 'assistant', kind: 'markdown', text: typeof data === 'string' ? data : JSON.stringify(data, null, 2) };
    }
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        // Prefer a plain text field if present
        if (parsed && typeof (parsed as any).text === 'string') {
          return { role: 'assistant', kind: 'markdown', text: (parsed as any).text as string };
        }
        if ((parsed as any)?.text === '[flightData]' || (parsed as any)?.type === 'flightData' || (parsed as any)?.kind === 'flights') {
          const flights = normalizeFlights(parsed);
          if (flights) return { role: 'assistant', kind: 'flights', flights };
        }
        const hotels = normalizeHotels(parsed);
        if ((parsed as any)?.text === 'HotelData' || hotels) {
          if (hotels && hotels.length) return { role: 'assistant', kind: 'hotels', hotels };
        }
        const iti = normalizeItinerary(parsed);
        if (iti) {
          return { role: 'assistant', kind: 'itinerary', itinerary: iti };
        }
        const normalized = normalizeAttractions(parsed);
        const shouldShowCards = (parsed as any)?.text === '[attractionsData]' || (parsed as any)?.type === 'attractionsData' || (parsed as any)?.kind === 'attractions';
        if (shouldShowCards && normalized) {
          return { role: 'assistant', kind: 'attractions', attractions: normalized };
        }
        return { role: 'assistant', kind: 'json', json: parsed };
      } catch {
        return { role: 'assistant', kind: 'markdown', text: data };
      }
    }
    if (data && typeof data === 'object') {
      const anyData = data as Record<string, unknown>;
      if (typeof (anyData as any).text === 'string') {
        return { role: 'assistant', kind: 'markdown', text: (anyData as any).text as string };
      }
      if ((anyData as any)?.text === '[flightData]' || (anyData as any)?.type === 'flightData' || (anyData as any)?.kind === 'flights') {
        const flights = normalizeFlights(anyData);
        if (flights) return { role: 'assistant', kind: 'flights', flights };
      }
      const hotels = normalizeHotels(anyData);
      if ((anyData as any)?.text === 'HotelData' || hotels) {
        if (hotels && hotels.length) return { role: 'assistant', kind: 'hotels', hotels };
      }
      const iti = normalizeItinerary(anyData);
      if (iti) {
        return { role: 'assistant', kind: 'itinerary', itinerary: iti };
      }
      const shouldShowCards = (anyData as any)?.text === '[attractionsData]' || (anyData as any)?.type === 'attractionsData' || (anyData as any)?.kind === 'attractions';
      const normalized = normalizeAttractions(anyData);
      if (shouldShowCards && normalized) {
        return { role: 'assistant', kind: 'attractions', attractions: normalized };
      }
      if (typeof (anyData as any).reply === 'string') {
        return { role: 'assistant', kind: 'markdown', text: (anyData as any).reply as string };
      }
      return { role: 'assistant', kind: 'json', json: data };
    }
    return { role: 'assistant', kind: 'text', text: String(data) };
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const prompt = userPrompt.trim();
    if (!prompt) return;

    setMessages(prev => [...prev, { role: 'user', kind: 'text', text: prompt }]);
    setLoading(true);
    setUserPrompt('');

    try {
      const { data, contentType } = await sendChat({ sessionId, userPrompt: prompt });
      const assistantMsg = toAssistantMessage(data, contentType);
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const anyErr = err as any;
      const msg = anyErr?.response?.data?.message || anyErr?.message || 'Request failed';
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open && endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  return (
    <div className="App">
      <header className="App-header">
        <p>AI Chatbot</p>
      </header>

      {/* Floating chat widget */}
      {!open && (
        <button
          type="button"
          aria-label="Open chat"
          className="chat-launcher"
          onClick={() => setOpen(true)}
        >
          <svg className="icon" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
            <path fill="#000" d="M12 2a1 1 0 0 1 1 1v1.05A7.5 7.5 0 0 1 20.5 11v3.5A3.5 3.5 0 0 1 17 18h-1.382l-2.724 2.724A1.75 1.75 0 0 1 9 19.75V18H7a3.5 3.5 0 0 1-3.5-3.5V11A7.5 7.5 0 0 1 11 4.05V3a1 1 0 0 1 1-1Zm-3.75 9.25a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Zm7.5 0a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z"/>
          </svg>
        </button>
      )}

      <div className={`chat-overlay${open ? ' show' : ''}`} onClick={() => setOpen(false)} />

      <div className={`chat-widget mobile-frame${open ? ' open' : ''}`} role="dialog" aria-modal="true" aria-label="Chat widget">
        <div className="device-notch" aria-hidden="true">
          <span className="notch-speaker" />
          <span className="notch-camera" />
        </div>
        <div className="device-status-bar" aria-hidden="true">
          <span className="status-time">9:41</span>
          <div className="status-icons">
            <span className="status-signal"></span>
            <span className="status-wifi"></span>
            <span className="status-battery"><span className="battery-level"></span></span>
          </div>
        </div>
        <div className="chat-widget-header">
          <div className="chat-widget-title">Chatbot</div>
          <div className="chat-endpoint">{apiBase.replace(/\/$/, '')}/chat</div>
          <button className="chat-close" aria-label="Close" onClick={() => setOpen(false)}>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#000" d="M18.3 5.7a1 1 0 0 0-1.4-1.4L12 9.17 7.1 4.3A1 1 0 1 0 5.7 5.7L10.59 10.6 5.7 15.49a1 1 0 1 0 1.4 1.42L12 12l4.9 4.91a1 1 0 1 0 1.4-1.42L13.41 10.6 18.3 5.7Z"/></svg>
          </button>
        </div>
        <div className="chat-widget-body">
          <div className="chat-messages iphone-chat">
            {messages.map((m, i) => (
              <div
                key={i}
                className={m.role === 'user' ? 'bubble bubble-user' : (m.kind === 'attractions' || m.kind === 'flights' || m.kind === 'itinerary' || m.kind === 'hotels') ? 'bubble bubble-cards' : 'bubble bubble-assistant'}
              >
                <MessageContent m={m} />
              </div>
            ))}
            <div ref={endRef} />
          </div>
          {error && <div className="chat-error" role="alert">{error}</div>}
        </div>
        <form className="chat-widget-input" onSubmit={onSubmit}>
          <div className="composer">
            <button type="button" className="composer-icon attach" aria-label="Attach">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#000" d="M16.5 6.5v8.25a4.75 4.75 0 1 1-9.5 0V6.25a3.25 3.25 0 1 1 6.5 0v7.75a1.75 1.75 0 1 1-3.5 0V7.5a.75.75 0 0 1 1.5 0v6.5a.25.25 0 1 0 .5 0V6.25a1.75 1.75 0 1 0-3.5 0v8.5a3.25 3.25 0 1 0 6.5 0V6.5a.75.75 0 0 1 1.5 0Z"/></svg>
            </button>
            <input
              className="input prompt-input"
              value={userPrompt}
              onChange={e => setUserPrompt(e.target.value)}
              placeholder="Type your message"
              aria-label="Message"
              type="text"
            />
            <button type="button" className="composer-icon emoji" aria-label="Emoji">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#000" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-3 7a1.25 1.25 0 1 1 0 2.5A1.25 1.25 0 0 1 9 9Zm9 3a6 6 0 1 1-12 0 .75.75 0 0 1 1.5 0 4.5 4.5 0 1 0 9 0 .75.75 0 0 1 1.5 0ZM16 9a1.25 1.25 0 1 1 0 2.5A1.25 1.25 0 0 1 16 9Z"/></svg>
            </button>
          </div>
          <button className="btn send-btn" type="submit" disabled={loading} aria-label="Send">
            {loading ? <span>...</span> : (
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#000" d="M2.3 3.3a1 1 0 0 1 1.1-.2l18 8a1 1 0 0 1 0 1.8l-18 8a1 1 0 0 1-1.4-1.2l2.3-6.2L13 12 4.3 9.5 2 3.9a1 1 0 0 1 .3-1Z"/></svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

/**
 * Accurate public transit data for Rome and Florence.
 * Each line's `stations` array is used both as map markers AND as
 * polyline waypoints — so the line passes through every station exactly.
 */

// ── ROME METRO LINE A ─────────────────────────────────────────────────────────
// Runs NW→SE: Battistini ↔ Anagnina (tourist central section shown)
const ROME_A_STATIONS = [
  { id: 'ra-baldo',     name: 'Baldo degli Ubaldi', coordinate: { latitude: 41.9022, longitude: 12.4511 }, attractions: ['Residential area — interchange for bus to Vatican'], note: 'Useful if staying in Prati area.' },
  { id: 'ra-cipro',     name: 'Cipro',               coordinate: { latitude: 41.9095, longitude: 12.4529 }, attractions: ['Vatican Museums (10 min walk south)'], note: 'Alternative to Ottaviano for Vatican Museums.' },
  { id: 'ra-ottaviano', name: 'Ottaviano',            coordinate: { latitude: 41.9072, longitude: 12.4579 }, attractions: ["St Peter's Basilica", 'Vatican Museums & Sistine Chapel', "Castel Sant'Angelo (15 min walk)"], note: "Main Vatican stop. Walk south ~10 min to St Peter's Square." },
  { id: 'ra-lepanto',   name: 'Lepanto',              coordinate: { latitude: 41.9135, longitude: 12.4638 }, attractions: ["Castel Sant'Angelo (closer entrance)", 'Prati neighbourhood restaurants'], note: 'Good for Castel Sant\'Angelo north entrance.' },
  { id: 'ra-flaminio',  name: 'Flaminio',             coordinate: { latitude: 41.9117, longitude: 12.4762 }, attractions: ['Piazza del Popolo', 'Villa Borghese (entry)', 'Borghese Gallery (20 min walk through park)', 'Ara Pacis'], note: 'Take bus 116 or walk through Villa Borghese to Borghese Gallery.' },
  { id: 'ra-spagna',    name: 'Spagna',               coordinate: { latitude: 41.9058, longitude: 12.4823 }, attractions: ['Spanish Steps (directly above)', 'Trevi Fountain (15 min walk)', 'Via Condotti luxury shopping', 'Keats-Shelley House'], note: 'Most popular tourist stop. Very crowded at weekends.' },
  { id: 'ra-barberini', name: 'Barberini',            coordinate: { latitude: 41.9012, longitude: 12.4848 }, attractions: ['Trevi Fountain (5 min walk north)', 'Palazzo Barberini', 'Via Veneto'], note: 'Closest metro stop to Trevi Fountain.' },
  { id: 'ra-repubblica',name: 'Repubblica',           coordinate: { latitude: 41.9027, longitude: 12.4971 }, attractions: ['Baths of Diocletian', "Santa Maria degli Angeli e dei Martiri", 'Piazza della Repubblica'], note: 'Easy walk to Termini for onward trains.' },
  { id: 'ra-termini',   name: 'Termini',              coordinate: { latitude: 41.9009, longitude: 12.5009 }, attractions: ['Roma Termini (main rail station)', 'Bus hub for all of Rome', 'National Museum of Rome'], note: 'Change here for Line B. High-speed trains to Florence, Naples, Venice.' },
  { id: 'ra-vittorio',  name: 'Vittorio Emanuele',   coordinate: { latitude: 41.8940, longitude: 12.5053 }, attractions: ['Piazza Vittorio Emanuele II', 'Esquilino neighbourhood', 'Porta Maggiore'], note: 'Multicultural Esquilino area — good cheap restaurants.' },
  { id: 'ra-manzoni',   name: 'Manzoni',              coordinate: { latitude: 41.8884, longitude: 12.5093 }, attractions: ['Museo Nazionale Romano — Palazzo Massimo (10 min walk)'], note: 'Residential area.' },
  { id: 'ra-sangiovanni',name: 'San Giovanni',        coordinate: { latitude: 41.8858, longitude: 12.5145 }, attractions: ["Basilica di San Giovanni in Laterano", 'Holy Stairs (Scala Santa)', 'Aurelian Walls'], note: 'Basilica is free — one of the four papal basilicas of Rome.' },
];

// ── ROME METRO LINE B ─────────────────────────────────────────────────────────
// Runs N→S: Jonio/Rebibbia ↔ Laurentina (tourist central section shown)
const ROME_B_STATIONS = [
  { id: 'rb-tiburtina',  name: 'Tiburtina',       coordinate: { latitude: 41.9003, longitude: 12.5317 }, attractions: ['Roma Tiburtina (rail station)', 'Long-distance bus terminal'], note: 'Interchange for regional and long-distance coaches. Also trains.' },
  { id: 'rb-bologna',    name: 'Bologna',          coordinate: { latitude: 41.9089, longitude: 12.5148 }, attractions: ['University area'], note: 'Change here for Line B1 (branch line north).' },
  { id: 'rb-pretorio',   name: 'Castro Pretorio',  coordinate: { latitude: 41.9062, longitude: 12.5060 }, attractions: ['National Central Library'], note: 'Close to Termini.' },
  { id: 'rb-termini',    name: 'Termini',          coordinate: { latitude: 41.9009, longitude: 12.5009 }, attractions: ['Roma Termini (main rail station)', 'All city buses', 'Change for Line A'], note: 'Change here for Line A. Main hub.' },
  { id: 'rb-cavour',     name: 'Cavour',           coordinate: { latitude: 41.8947, longitude: 12.4952 }, attractions: ['San Pietro in Vincoli (Michelangelo\'s Moses)', 'Esquilino Hill'], note: 'Short walk uphill to San Pietro in Vincoli.' },
  { id: 'rb-colosseo',   name: 'Colosseo',         coordinate: { latitude: 41.8903, longitude: 12.4922 }, attractions: ['Colosseum (directly outside exit)', 'Roman Forum & Palatine Hill', 'Arch of Constantine', 'Circus Maximus (20 min walk)'], note: 'Exit directly onto the Colosseum. Book tickets online to skip queues.' },
  { id: 'rb-circo',      name: 'Circo Massimo',   coordinate: { latitude: 41.8847, longitude: 12.4838 }, attractions: ['Circus Maximus', 'Aventine Hill', 'Orange Garden (Giardino degli Aranci)', 'Knights of Malta Keyhole View'], note: 'Walk up Aventine Hill for the famous keyhole view of St Peter\'s Dome.' },
  { id: 'rb-piramide',   name: 'Piramide',         coordinate: { latitude: 41.8768, longitude: 12.4775 }, attractions: ['Pyramid of Cestius', 'Protestant Cemetery (Keats & Shelley graves)', 'Testaccio neighbourhood'], note: 'Testaccio is Rome\'s best neighbourhood for authentic local food.' },
  { id: 'rb-garbatella', name: 'Garbatella',       coordinate: { latitude: 41.8658, longitude: 12.4757 }, attractions: ['Garbatella neighbourhood (1920s garden city)', 'Street art'], note: 'Worth a wander for architecture and authentic Rome life.' },
];

// ── FLORENCE TRAM T2 (Airport Line) ──────────────────────────────────────────
// Runs Airport → SMN (~25 min, every 5–6 min, 5am–midnight)
const FLORENCE_T2_STATIONS = [
  { id: 'ft2-airport',   name: 'Aeroporto',           coordinate: { latitude: 43.8100, longitude: 11.2052 }, attractions: ['Amerigo Vespucci Airport'], note: 'Departs every 5–6 minutes. €1.70 (buy at machine before boarding). 25 min to SMN.' },
  { id: 'ft2-guidoni',   name: 'Guidoni',              coordinate: { latitude: 43.8050, longitude: 11.2074 }, attractions: ['IKEA Florence'], note: 'Mainly residential.' },
  { id: 'ft2-guidoni2',  name: 'Guidoni-Antonelli',   coordinate: { latitude: 43.8010, longitude: 11.2095 }, attractions: [], note: 'Residential stop.' },
  { id: 'ft2-nenni',     name: 'Nenni-Torregalli',    coordinate: { latitude: 43.7940, longitude: 11.2160 }, attractions: ['Careggi Hospital (nearby)'], note: 'T1 and T2 lines share track from here towards SMN.' },
  { id: 'ft2-redi',      name: 'Villa Vittoria-Redi', coordinate: { latitude: 43.7880, longitude: 11.2215 }, attractions: ['Parco delle Cascine (city park)'], note: 'Florence\'s largest park — good for a morning run.' },
  { id: 'ft2-cascine',   name: 'Cascine',             coordinate: { latitude: 43.7842, longitude: 11.2286 }, attractions: ['Parco delle Cascine', 'Weekly market (Tuesdays)'], note: 'Large park along the Arno. Tuesday market is the biggest in Florence.' },
  { id: 'ft2-rosselli',  name: 'Rosselli-De Amicis',  coordinate: { latitude: 43.7808, longitude: 11.2365 }, attractions: ['Near Fortezza da Basso'], note: 'Close to the main exhibition centre.' },
  { id: 'ft2-alamanni',  name: 'Alamanni-Stazione',   coordinate: { latitude: 43.7773, longitude: 11.2452 }, attractions: ['Mercato Centrale (5 min walk)', 'San Lorenzo Market'], note: 'Second-closest stop to the city centre. Useful for San Lorenzo area.' },
  { id: 'ft2-smn',       name: 'Stazione Santa Maria Novella', coordinate: { latitude: 43.7762, longitude: 11.2481 }, attractions: ['SMN Railway Station', 'Santa Maria Novella Church', 'City centre hub'], note: 'Main terminus. Trains to Rome (~1.5h fast), Pisa (1h), Bologna (35 min).' },
];

// ── FLORENCE TRAM T1 ──────────────────────────────────────────────────────────
// Runs Villa Costanza (SE) → SMN → Careggi (NW)
const FLORENCE_T1_STATIONS = [
  { id: 'ft1-smn',       name: 'Stazione SMN',        coordinate: { latitude: 43.7762, longitude: 11.2481 }, attractions: ['SMN Railway Station', 'Santa Maria Novella Church'], note: 'Central hub. Change here for T2 airport tram.' },
  { id: 'ft1-unita',     name: "Unità",               coordinate: { latitude: 43.7748, longitude: 11.2516 }, attractions: ['Near Piazza Unità Italiana'], note: 'Close to city centre.' },
  { id: 'ft1-lavagnini', name: 'Lavagnini-Rossini',   coordinate: { latitude: 43.7800, longitude: 11.2538 }, attractions: ['Fortezza da Basso'], note: 'Near the fortress exhibition centre.' },
  { id: 'ft1-libertà',   name: 'Libertà',             coordinate: { latitude: 43.7838, longitude: 11.2561 }, attractions: ['Piazza della Libertà', 'Parco di Villa Fabbricotti'], note: 'Residential area north of centre.' },
  { id: 'ft1-careggi',   name: 'Careggi-Lungo',       coordinate: { latitude: 43.7921, longitude: 11.2490 }, attractions: ['Careggi Hospital', 'Villa Medicea di Careggi'], note: 'Northern terminus area. Villa Medicea is a Medici country house (visits by appointment).' },
];

// ── BUS KEY ROUTES ────────────────────────────────────────────────────────────
// Not drawn on map — shown in the Transport info tab only

// ── EXPORTS ───────────────────────────────────────────────────────────────────
export const ROME_TRANSIT_LINES = [
  {
    id: 'rome-metro-a',
    city: 'rome',
    name: 'Metro Line A',
    shortName: 'A',
    color: '#FF8C00',
    type: 'metro',
    description: 'Main tourist line. Runs NW–SE. Key stops: Ottaviano (Vatican), Spagna (Spanish Steps), Barberini (Trevi Fountain), Termini.',
    stations: ROME_A_STATIONS,
  },
  {
    id: 'rome-metro-b',
    city: 'rome',
    name: 'Metro Line B',
    shortName: 'B',
    color: '#0072BC',
    type: 'metro',
    description: 'Runs N–S through Termini. Key stops: Colosseo (Colosseum), Circo Massimo, Piramide (Testaccio). Change at Termini for Line A.',
    stations: ROME_B_STATIONS,
  },
];

export const ROME_STOPS = ROME_A_STATIONS.map(s => ({ ...s, line: 'A', color: '#FF8C00' }))
  .concat(ROME_B_STATIONS.map(s => ({ ...s, line: 'B', color: '#0072BC' })));

export const FLORENCE_TRANSIT_LINES = [
  {
    id: 'florence-tram-t2',
    city: 'florence',
    name: 'Tram T2 — Airport Line',
    shortName: 'T2',
    color: '#CC6600',
    type: 'tram',
    description: 'Airport → SMN. Every 5–6 min, 5am–midnight. €1.70 single. ~25 minutes.',
    stations: FLORENCE_T2_STATIONS,
  },
  {
    id: 'florence-tram-t1',
    city: 'florence',
    name: 'Tram T1',
    shortName: 'T1',
    color: '#009900',
    type: 'tram',
    description: 'Villa Costanza → SMN → Careggi. Useful for northern residential areas and the hospital.',
    stations: FLORENCE_T1_STATIONS,
  },
];

export const FLORENCE_STOPS = FLORENCE_T2_STATIONS.map(s => ({ ...s, line: 'T2', color: '#CC6600' }))
  .concat(FLORENCE_T1_STATIONS.map(s => ({ ...s, line: 'T1', color: '#009900' })));

// ── TICKET INFO ───────────────────────────────────────────────────────────────
export const TICKET_INFO = {
  rome: {
    title: 'Rome Transit Tickets',
    tickets: [
      { name: 'Single (BIT)', price: '€2.00', duration: '100 minutes', note: 'Valid for unlimited transfers including 1 metro ride within 100 min.' },
      { name: '24-hour pass', price: '€7.00', duration: '24 hours', note: 'Best value for a full sightseeing day.' },
      { name: '48-hour pass', price: '€12.50', duration: '48 hours', note: 'Good for 2 days of heavy transit use.' },
      { name: '72-hour pass', price: '€18.00', duration: '72 hours', note: 'Useful if you plan to cross town frequently.' },
      { name: '7-day pass (CIS)', price: '€24.00', duration: '7 days', note: 'Best value for a week-long stay.' },
    ],
    tips: [
      '⚠️ Always validate your ticket before boarding — inspectors issue on-the-spot €50+ fines.',
      '🎫 Buy tickets at metro stations, tobacconists (tabacchi), or authorised vendors.',
      '📱 The "Muoversi a Roma" app shows real-time bus tracking.',
      '🌙 Night buses (N lines) run when metro closes at ~23:30.',
      '🚕 Official taxis are white. Fixed fare from Fiumicino airport: €50 to historic centre.',
    ],
  },
  florence: {
    title: 'Florence Transit Tickets (ATAF)',
    tickets: [
      { name: 'Single ticket', price: '€1.70', duration: '90 minutes', note: 'Buy in advance from tabacchi or machines. €2.50 if bought on board.' },
      { name: '4-ticket carnet', price: '€6.20', duration: '90 min each', note: 'Best value if buying in advance.' },
      { name: '24-hour pass', price: '€5.00', duration: '24 hours', note: 'Valid on all ATAF buses and trams.' },
      { name: '3-day pass', price: '€12.00', duration: '72 hours', note: 'Good value for 3 full days.' },
    ],
    tips: [
      '🚶 Florence historic centre is compact — most attractions are walkable in 20 min.',
      '✅ Validate tickets at yellow machines on board. Inspectors are frequent.',
      '✈️ Tram T2 is the easiest airport transfer — €1.70, every 5–6 min, 25 min to SMN.',
      '🚌 Most useful bus lines: C1 (Duomo–Santa Croce), C2 (SMN–Piazza Repubblica), 7 (Fiesole), 12/13 (Piazzale Michelangelo).',
      '🚗 Do NOT drive in Florence\'s ZTL — cameras issue €70–€200 fines automatically.',
      '🚲 Bikes and e-scooters available via MÀ Mobilità and Lime apps.',
    ],
  },
};

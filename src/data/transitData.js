/**
 * Pre-loaded public transit data for Rome and Florence.
 * Metro/tram lines stored as coordinate polylines; key stops include
 * nearby attractions and practical notes.
 * All data is static — works fully offline.
 */

// ── ROME ──────────────────────────────────────────────────────────────────────
const ROME_METRO_A = {
  id: 'rome-metro-a',
  city: 'rome',
  name: 'Metro Line A',
  shortName: 'A',
  color: '#FF8C00',
  type: 'metro',
  description: 'Main tourist line. Runs from Battistini (NW) to Anagnina (SE). Key stops for visitors: Ottaviano, Spagna, Barberini, Termini.',
  coordinates: [
    // Tourist-relevant central section (Ottaviano → Termini)
    { latitude: 41.9072, longitude: 12.4579 }, // Ottaviano
    { latitude: 41.9099, longitude: 12.4630 }, // Lepanto
    { latitude: 41.9117, longitude: 12.4761 }, // Flaminio
    { latitude: 41.9058, longitude: 12.4823 }, // Spagna
    { latitude: 41.9013, longitude: 12.4844 }, // Barberini
    { latitude: 41.9027, longitude: 12.4971 }, // Repubblica
    { latitude: 41.9009, longitude: 12.5009 }, // Termini
  ],
};

const ROME_METRO_B = {
  id: 'rome-metro-b',
  city: 'rome',
  name: 'Metro Line B',
  shortName: 'B',
  color: '#0072BC',
  type: 'metro',
  description: 'Runs N–S through Termini. Key stop: Colosseo (Colosseum, Roman Forum). Change at Termini for Line A.',
  coordinates: [
    { latitude: 41.9009, longitude: 12.5009 }, // Termini
    { latitude: 41.8978, longitude: 12.4979 }, // Cavour
    { latitude: 41.8903, longitude: 12.4922 }, // Colosseo
    { latitude: 41.8847, longitude: 12.4838 }, // Circo Massimo
    { latitude: 41.8788, longitude: 12.4787 }, // Aventino (approx)
  ],
};

const ROME_TRAM_8 = {
  id: 'rome-tram-8',
  city: 'rome',
  name: 'Tram 8',
  shortName: 'T8',
  color: '#CC0000',
  type: 'tram',
  description: 'Connects Largo di Torre Argentina to Trastevere. Useful for reaching Trastevere without walking.',
  coordinates: [
    { latitude: 41.8962, longitude: 12.4762 }, // Largo Torre Argentina
    { latitude: 41.8921, longitude: 12.4718 }, // Via Arenula
    { latitude: 41.8897, longitude: 12.4698 }, // Trastevere / Piazza Mastai
  ],
};

export const ROME_TRANSIT_LINES = [ROME_METRO_A, ROME_METRO_B, ROME_TRAM_8];

export const ROME_STOPS = [
  {
    id: 'ottaviano',
    line: 'A', color: '#FF8C00',
    name: 'Ottaviano',
    coordinate: { latitude: 41.9072, longitude: 12.4579 },
    attractions: ['Vatican Museums & Sistine Chapel', 'St Peter\'s Basilica', 'Castel Sant\'Angelo'],
    note: 'The Vatican stop. Exit and walk ~10 min south to St Peter\'s Square.',
  },
  {
    id: 'lepanto',
    line: 'A', color: '#FF8C00',
    name: 'Lepanto',
    coordinate: { latitude: 41.9099, longitude: 12.4630 },
    attractions: ['Castel Sant\'Angelo (closer entry)'],
    note: 'Alternative stop for Castel Sant\'Angelo.',
  },
  {
    id: 'flaminio',
    line: 'A', color: '#FF8C00',
    name: 'Flaminio',
    coordinate: { latitude: 41.9117, longitude: 12.4761 },
    attractions: ['Piazza del Popolo', 'Borghese Gallery (15 min walk)', 'Villa Borghese Park'],
    note: 'Take bus 116 or walk through the park to reach Borghese Gallery.',
  },
  {
    id: 'spagna',
    line: 'A', color: '#FF8C00',
    name: 'Spagna',
    coordinate: { latitude: 41.9058, longitude: 12.4823 },
    attractions: ['Spanish Steps', 'Trevi Fountain (15 min walk)', 'Via Condotti shopping'],
    note: 'Most popular tourist stop. Very crowded. Trevi Fountain is a 15-min walk east.',
  },
  {
    id: 'barberini',
    line: 'A', color: '#FF8C00',
    name: 'Barberini',
    coordinate: { latitude: 41.9013, longitude: 12.4844 },
    attractions: ['Trevi Fountain (5 min walk)', 'Palazzo Barberini (Borghese art)'],
    note: 'Closest metro stop to Trevi Fountain.',
  },
  {
    id: 'repubblica',
    line: 'A', color: '#FF8C00',
    name: 'Repubblica',
    coordinate: { latitude: 41.9027, longitude: 12.4971 },
    attractions: ['Baths of Diocletian', 'Santa Maria degli Angeli'],
    note: 'Near Termini — useful for accommodation hub.',
  },
  {
    id: 'termini-rome',
    line: 'A/B', color: '#888',
    name: 'Termini',
    coordinate: { latitude: 41.9009, longitude: 12.5009 },
    attractions: ['Main railway station', 'Bus hub for all of Rome'],
    note: 'Change here between Line A and Line B. National rail connections to Florence, Naples, Venice.',
  },
  {
    id: 'colosseo',
    line: 'B', color: '#0072BC',
    name: 'Colosseo',
    coordinate: { latitude: 41.8903, longitude: 12.4922 },
    attractions: ['Colosseum', 'Roman Forum & Palatine Hill', 'Arch of Constantine'],
    note: 'Exit directly onto the Colosseum. One of Rome\'s most used tourist stops.',
  },
  {
    id: 'circo-massimo',
    line: 'B', color: '#0072BC',
    name: 'Circo Massimo',
    coordinate: { latitude: 41.8847, longitude: 12.4838 },
    attractions: ['Circus Maximus', 'Aventine Hill', 'Rose Garden (Roseto Comunale)'],
    note: 'For the famous Knights of Malta keyhole view, walk up to Aventine Hill.',
  },
];

// ── FLORENCE ──────────────────────────────────────────────────────────────────
const FLORENCE_TRAM_T1 = {
  id: 'florence-tram-t1',
  city: 'florence',
  name: 'Tram T1 — Villa Costanza–Careggi',
  shortName: 'T1',
  color: '#009900',
  type: 'tram',
  description: 'Main tram line. Connects Santa Maria Novella station to residential/university areas. NOT the airport line — T2 goes to the airport.',
  coordinates: [
    { latitude: 43.7762, longitude: 11.2481 }, // SMN station
    { latitude: 43.7778, longitude: 11.2451 }, // Alamanni
    { latitude: 43.7795, longitude: 11.2390 }, // Rosselli
    { latitude: 43.7840, longitude: 11.2320 }, // Nenni
    { latitude: 43.7910, longitude: 11.2240 }, // Careggi area
  ],
};

const FLORENCE_TRAM_T2 = {
  id: 'florence-tram-t2',
  city: 'florence',
  name: 'Tram T2 — Airport–SMN',
  shortName: 'T2',
  color: '#CC6600',
  type: 'tram',
  description: 'AIRPORT LINE. Runs from Amerigo Vespucci Airport to Santa Maria Novella station (~25 min). Cheapest and easiest airport transfer.',
  coordinates: [
    { latitude: 43.8098, longitude: 11.2051 }, // Airport
    { latitude: 43.8012, longitude: 11.2120 }, // Guidoni
    { latitude: 43.7880, longitude: 11.2200 }, // Nenni Torregalli
    { latitude: 43.7825, longitude: 11.2310 }, // Villa Costanza
    { latitude: 43.7762, longitude: 11.2481 }, // SMN station
  ],
};

export const FLORENCE_TRANSIT_LINES = [FLORENCE_TRAM_T1, FLORENCE_TRAM_T2];

export const FLORENCE_STOPS = [
  {
    id: 'smn',
    line: 'T1/T2', color: '#888',
    name: 'Santa Maria Novella (SMN)',
    coordinate: { latitude: 43.7762, longitude: 11.2481 },
    attractions: ['Santa Maria Novella Church', 'Main railway station', 'City centre hub'],
    note: 'Main transport hub. Train connections to Rome, Pisa, Bologna. All city buses pass here.',
  },
  {
    id: 'airport-flo',
    line: 'T2', color: '#CC6600',
    name: 'Aeroporto (Airport)',
    coordinate: { latitude: 43.8098, longitude: 11.2051 },
    attractions: ['Amerigo Vespucci Airport'],
    note: 'T2 tram to SMN takes ~25 min, costs €1.70 (or €2.50 on board). Runs 5am–midnight.',
  },
];

// ── TICKET INFO ───────────────────────────────────────────────────────────────
export const TICKET_INFO = {
  rome: {
    title: 'Rome Transit Tickets',
    currency: 'EUR',
    tickets: [
      { name: 'Single (BIT)', price: '€2.00', duration: '100 minutes', note: 'Valid for unlimited transfers within 100 min including 1 metro ride.' },
      { name: '24-hour pass', price: '€7.00', duration: '24 hours', note: 'Best value for a full sightseeing day.' },
      { name: '48-hour pass', price: '€12.50', duration: '48 hours', note: 'Good for 2 days of heavy transit use.' },
      { name: '72-hour pass', price: '€18.00', duration: '72 hours', note: 'Useful if you plan to cross town frequently.' },
      { name: '7-day pass (CIS)', price: '€24.00', duration: '7 days', note: 'Best value for a week-long stay.' },
    ],
    tips: [
      '⚠️ Always validate your ticket before boarding — inspectors issue on-the-spot €50+ fines.',
      '🎫 Buy tickets at metro stations, tobacconists (tabacchi), or authorised vendors. Some machines only accept coins.',
      '📱 The "Muoversi a Roma" app shows real-time bus tracking.',
      '🚌 Buses are often faster than metro for crossing the historic centre. Night buses (N lines) run when metro closes (~23:30).',
      '🚕 Official taxis are white. Fixed fare from airport: €50 to historic centre. Always agree the fare before entering or insist on the meter.',
    ],
  },
  florence: {
    title: 'Florence Transit Tickets (ATAF)',
    currency: 'EUR',
    tickets: [
      { name: 'Single ticket', price: '€1.70', duration: '90 minutes', note: 'Buy in advance from tabacchi or machines. €2.50 if bought on board.' },
      { name: '4-ticket carnet', price: '€6.20', duration: '90 min each', note: 'Best if buying in advance. Save vs single tickets.' },
      { name: '24-hour pass', price: '€5.00', duration: '24 hours', note: 'Valid on all ATAF buses and trams.' },
      { name: '3-day pass', price: '€12.00', duration: '72 hours', note: 'Good value for 3 full days.' },
      { name: 'T2 Airport single', price: '€1.70', duration: '90 min', note: 'Standard ticket valid for tram T2 airport run.' },
    ],
    tips: [
      '🚶 Florence historic centre is compact — most attractions are walkable in 20 min.',
      '✅ Validate tickets at yellow machines on board. Inspectors are common.',
      '✈️ Tram T2 is the easiest airport transfer — €1.70, every 5–6 minutes, 25 min to SMN.',
      '🚌 Most useful bus lines: C1 (Duomo–Santa Croce), C2 (SMN–Piazza Repubblica), 7 (Fiesole), 12/13 (Piazzale Michelangelo).',
      '🚗 Do NOT drive in Florence\'s ZTL zone — cameras automatically issue €70–€200 fines and they will follow you home.',
      '🚲 Bikes and e-scooters available via MÀ Mobilità and Lime. Good for crossing the Arno or reaching Piazzale Michelangelo.',
    ],
  },
};

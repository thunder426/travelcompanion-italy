/**
 * Public transit data for Rome and Florence.
 * Each line's `stations` array is used both as map markers AND as
 * polyline waypoints — so the line passes through every station exactly.
 *
 * Sources: Wikipedia Line A/B/C (Rome Metro), Autolinee Toscane / GEST
 * (Florence trams). Eastern Line C station coordinates are approximate.
 * Last verified: April 2026.
 */

// ── ROME METRO LINE A ─────────────────────────────────────────────────────────
// Full line: Battistini (NW) ↔ Anagnina (SE), 27 stations
const ROME_A_STATIONS = [
  { id: 'ra-battistini',   name: 'Battistini',            coordinate: { latitude: 41.9065, longitude: 12.4147 }, attractions: ['Bus connections to Civitavecchia (cruise port)'], note: 'Western terminus. Buses to Civitavecchia cruise terminal stop nearby.' },
  { id: 'ra-cornelia',     name: 'Cornelia',              coordinate: { latitude: 41.9005, longitude: 12.4264 }, attractions: [], note: 'Residential area.' },
  { id: 'ra-baldo',        name: 'Baldo degli Ubaldi',    coordinate: { latitude: 41.9033, longitude: 12.4349 }, attractions: ['Residential area — interchange for bus to Vatican'], note: 'Useful if staying in Prati area.' },
  { id: 'ra-valle',        name: 'Valle Aurelia',         coordinate: { latitude: 41.9031, longitude: 12.4417 }, attractions: [], note: 'Residential area.' },
  { id: 'ra-cipro',        name: 'Cipro',                 coordinate: { latitude: 41.9074, longitude: 12.4477 }, attractions: ['Vatican Museums (10 min walk south)'], note: 'Alternative to Ottaviano for Vatican Museums entrance.' },
  { id: 'ra-ottaviano',    name: 'Ottaviano',             coordinate: { latitude: 41.9094, longitude: 12.4581 }, attractions: ["St Peter's Basilica", 'Vatican Museums & Sistine Chapel', "Castel Sant'Angelo (15 min walk)"], note: "Main Vatican stop. Walk south ~10 min to St Peter's Square." },
  { id: 'ra-lepanto',      name: 'Lepanto',               coordinate: { latitude: 41.9114, longitude: 12.4661 }, attractions: ["Castel Sant'Angelo (closer entrance)", 'Prati neighbourhood restaurants'], note: "Good for Castel Sant'Angelo north entrance." },
  { id: 'ra-flaminio',     name: 'Flaminio',              coordinate: { latitude: 41.9119, longitude: 12.4758 }, attractions: ['Piazza del Popolo', 'Villa Borghese (entry)', 'Borghese Gallery (20 min walk through park)', 'Ara Pacis'], note: 'Take bus 116 or walk through Villa Borghese to Borghese Gallery.' },
  { id: 'ra-spagna',       name: 'Spagna',                coordinate: { latitude: 41.9068, longitude: 12.4845 }, attractions: ['Spanish Steps (directly above)', 'Trevi Fountain (15 min walk)', 'Via Condotti luxury shopping', 'Keats-Shelley House'], note: 'Most popular tourist stop. Very crowded at weekends.' },
  { id: 'ra-barberini',    name: 'Barberini',             coordinate: { latitude: 41.9039, longitude: 12.4889 }, attractions: ['Trevi Fountain (5 min walk north)', 'Palazzo Barberini', 'Via Veneto'], note: 'Closest metro stop to Trevi Fountain.' },
  { id: 'ra-repubblica',   name: 'Repubblica',            coordinate: { latitude: 41.9025, longitude: 12.4956 }, attractions: ['Baths of Diocletian', 'Santa Maria degli Angeli e dei Martiri', 'Piazza della Repubblica'], note: 'Easy walk to Termini for onward trains.' },
  { id: 'ra-termini',      name: 'Termini',               coordinate: { latitude: 41.9015, longitude: 12.5006 }, attractions: ['Roma Termini (main rail station)', 'Bus hub for all of Rome', 'National Museum of Rome'], note: 'Change here for Line B. High-speed trains to Florence, Naples, Venice.' },
  { id: 'ra-vittorio',     name: 'Vittorio Emanuele',     coordinate: { latitude: 41.8944, longitude: 12.5042 }, attractions: ['Piazza Vittorio Emanuele II', 'Esquilino neighbourhood', 'Porta Maggiore'], note: 'Multicultural Esquilino area — good cheap restaurants.' },
  { id: 'ra-manzoni',      name: 'Manzoni',               coordinate: { latitude: 41.8903, longitude: 12.5069 }, attractions: ['Museo Nazionale Romano — Palazzo Massimo (10 min walk)'], note: 'Residential area.' },
  { id: 'ra-sangiovanni',  name: 'San Giovanni',          coordinate: { latitude: 41.8853, longitude: 12.5094 }, attractions: ['Basilica di San Giovanni in Laterano', 'Holy Stairs (Scala Santa)', 'Aurelian Walls'], note: 'Basilica is free — one of the four papal basilicas of Rome. Change for Line C.' },
  { id: 'ra-rediroma',     name: 'Re di Roma',            coordinate: { latitude: 41.8819, longitude: 12.5144 }, attractions: [], note: 'Residential area.' },
  { id: 'ra-pontelungo',   name: 'Ponte Lungo',           coordinate: { latitude: 41.8780, longitude: 12.5189 }, attractions: [], note: 'Residential area.' },
  { id: 'ra-furiocamillo', name: 'Furio Camillo',         coordinate: { latitude: 41.8747, longitude: 12.5231 }, attractions: [], note: 'Residential area.' },
  { id: 'ra-collialbani',  name: 'Colli Albani',          coordinate: { latitude: 41.8694, longitude: 12.5301 }, attractions: [], note: 'Residential area.' },
  { id: 'ra-arcotravert',  name: 'Arco di Travertino',   coordinate: { latitude: 41.8659, longitude: 12.5347 }, attractions: [], note: 'Residential area.' },
  { id: 'ra-portafurba',   name: 'Porta Furba-Quadraro', coordinate: { latitude: 41.8637, longitude: 12.5482 }, attractions: ['Parco degli Acquedotti (Aqueduct Park)'], note: 'Start of the stunning Aqueduct Park — ruins of ancient aqueducts in a meadow.' },
  { id: 'ra-numidio',      name: 'Numidio Quadrato',     coordinate: { latitude: 41.8621, longitude: 12.5527 }, attractions: [], note: 'Residential area.' },
  { id: 'ra-luciosestio',  name: 'Lucio Sestio',          coordinate: { latitude: 41.8599, longitude: 12.5571 }, attractions: [], note: 'Residential area.' },
  { id: 'ra-giulioagri',   name: 'Giulio Agricola',       coordinate: { latitude: 41.8567, longitude: 12.5625 }, attractions: [], note: 'Residential area.' },
  { id: 'ra-subaugusta',   name: 'Subaugusta',            coordinate: { latitude: 41.8535, longitude: 12.5682 }, attractions: [], note: 'Residential area.' },
  { id: 'ra-cinecitta',    name: 'Cinecittà',             coordinate: { latitude: 41.8487, longitude: 12.5754 }, attractions: ['Cinecittà Studios (bus from here)'], note: "Take bus for Rome's famous film studios where Ben-Hur and Gladiator were filmed." },
  { id: 'ra-anagnina',     name: 'Anagnina',              coordinate: { latitude: 41.8428, longitude: 12.5861 }, attractions: ['Bus terminal for Castelli Romani', 'Ciampino Airport (shuttle)'], note: 'Eastern terminus. Shuttle buses to Ciampino Airport (30 min).' },
];

// ── ROME METRO LINE B ─────────────────────────────────────────────────────────
// Full main line: Rebibbia (N) ↔ Laurentina (S), 22 stations
// Change at Bologna for the B1 branch to Jonio.
const ROME_B_STATIONS = [
  { id: 'rb-rebibbia',     name: 'Rebibbia',              coordinate: { latitude: 41.9258, longitude: 12.5731 }, attractions: [], note: 'Northern terminus.' },
  { id: 'rb-pontemammolo', name: 'Ponte Mammolo',         coordinate: { latitude: 41.9206, longitude: 12.5650 }, attractions: [], note: 'Bus interchange for eastern suburbs and Tivoli.' },
  { id: 'rb-smdsoccorso',  name: 'Santa Maria del Soccorso', coordinate: { latitude: 41.9156, longitude: 12.5608 }, attractions: [], note: 'Residential area.' },
  { id: 'rb-pietralata',   name: 'Pietralata',            coordinate: { latitude: 41.9147, longitude: 12.5550 }, attractions: [], note: 'Residential area.' },
  { id: 'rb-montitib',     name: 'Monti Tiburtini',       coordinate: { latitude: 41.9158, longitude: 12.5478 }, attractions: [], note: 'Residential area.' },
  { id: 'rb-quintiliani',  name: 'Quintiliani',           coordinate: { latitude: 41.9156, longitude: 12.5386 }, attractions: [], note: 'Residential area.' },
  { id: 'rb-tiburtina',    name: 'Tiburtina',             coordinate: { latitude: 41.9108, longitude: 12.5294 }, attractions: ['Roma Tiburtina (rail station)', 'Long-distance bus terminal'], note: 'Interchange for regional trains and long-distance coaches (Flixbus, etc.).' },
  { id: 'rb-bologna',      name: 'Bologna',               coordinate: { latitude: 41.9133, longitude: 12.5206 }, attractions: ['University area'], note: 'Change here for Line B1 (branch to Jonio). University of Rome La Sapienza nearby.' },
  { id: 'rb-policlinico',  name: 'Policlinico',           coordinate: { latitude: 41.9089, longitude: 12.5117 }, attractions: ['Policlinico Umberto I hospital', 'Sapienza University of Rome'], note: 'Useful for the main university campus.' },
  { id: 'rb-pretorio',     name: 'Castro Pretorio',       coordinate: { latitude: 41.9061, longitude: 12.5056 }, attractions: ['National Central Library of Rome'], note: 'Close to Termini.' },
  { id: 'rb-termini',      name: 'Termini',               coordinate: { latitude: 41.9015, longitude: 12.5006 }, attractions: ['Roma Termini (main rail station)', 'All city buses', 'Change for Line A'], note: 'Change here for Line A. Main transit hub.' },
  { id: 'rb-cavour',       name: 'Cavour',                coordinate: { latitude: 41.8950, longitude: 12.4936 }, attractions: ["San Pietro in Vincoli (Michelangelo's Moses)", 'Esquilino Hill'], note: "Short walk uphill to San Pietro in Vincoli — less crowded than the Vatican." },
  { id: 'rb-colosseo',     name: 'Colosseo',              coordinate: { latitude: 41.8914, longitude: 12.4914 }, attractions: ['Colosseum (directly outside exit)', 'Roman Forum & Palatine Hill', 'Arch of Constantine'], note: 'Exit directly onto the Colosseum. Book tickets online to skip queues. Also see new Line C Colosseo station.' },
  { id: 'rb-circo',        name: 'Circo Massimo',         coordinate: { latitude: 41.8836, longitude: 12.4881 }, attractions: ['Circus Maximus', 'Aventine Hill', 'Orange Garden (Giardino degli Aranci)', 'Knights of Malta Keyhole View'], note: "Walk up Aventine Hill for the famous keyhole view of St Peter's Dome." },
  { id: 'rb-piramide',     name: 'Piramide',              coordinate: { latitude: 41.8756, longitude: 12.4822 }, attractions: ['Pyramid of Cestius', 'Protestant Cemetery (Keats & Shelley graves)', 'Testaccio neighbourhood'], note: "Testaccio is Rome's best neighbourhood for authentic local food." },
  { id: 'rb-garbatella',   name: 'Garbatella',            coordinate: { latitude: 41.8667, longitude: 12.4833 }, attractions: ['Garbatella neighbourhood (1920s garden city)', 'Street art'], note: 'Worth a wander for architecture and authentic Rome life.' },
  { id: 'rb-sanpaolo',     name: 'Basilica San Paolo',    coordinate: { latitude: 41.8561, longitude: 12.4782 }, attractions: ["Basilica of St Paul Outside the Walls (5 min walk)"], note: "One of Rome's four papal basilicas — often overlooked by tourists but stunning." },
  { id: 'rb-marconi',      name: 'Marconi',               coordinate: { latitude: 41.8494, longitude: 12.4756 }, attractions: [], note: 'Residential/commercial area.' },
  { id: 'rb-eurmagliana',  name: 'EUR Magliana',          coordinate: { latitude: 41.8394, longitude: 12.4633 }, attractions: ['EUR district (1940s rationalist architecture)'], note: 'EUR district built by Mussolini for a 1942 World Fair that never happened.' },
  { id: 'rb-eurpalasport', name: 'EUR Palasport',         coordinate: { latitude: 41.8300, longitude: 12.4667 }, attractions: ['Palazzo dello Sport (Pier Luigi Nervi dome)'], note: 'Near the stunning 1960 Olympic sports arena designed by Nervi.' },
  { id: 'rb-eurfermi',     name: 'EUR Fermi',             coordinate: { latitude: 41.8286, longitude: 12.4711 }, attractions: ['Museum of Roman Civilisation (nearby)'], note: 'EUR district.' },
  { id: 'rb-laurentina',   name: 'Laurentina',            coordinate: { latitude: 41.8269, longitude: 12.4811 }, attractions: [], note: 'Southern terminus. Bus interchange for southern suburbs.' },
];

// ── ROME METRO LINE B1 (branch: Bologna ↔ Jonio) ─────────────────────────────
// Branch off main Line B at Bologna, serving the northeastern university area.
// Transfer to/from main Line B at Bologna.
const ROME_B1_STATIONS = [
  { id: 'rb1-bologna',     name: 'Bologna',               coordinate: { latitude: 41.9133, longitude: 12.5206 }, attractions: ['University area'], note: 'Branch point — transfer to main Line B here.' },
  { id: 'rb1-agnese',      name: "Sant'Agnese-Annibaliano", coordinate: { latitude: 41.9239, longitude: 12.5158 }, attractions: ["Basilica di Sant'Agnese fuori le mura", 'Catacombe di Sant\'Agnese'], note: "One of Rome's finest early Christian churches, often skipped by tourists." },
  { id: 'rb1-libia',       name: 'Libia',                 coordinate: { latitude: 41.9328, longitude: 12.5206 }, attractions: [], note: 'Residential area.' },
  { id: 'rb1-concadoro',   name: "Conca d'Oro",           coordinate: { latitude: 41.9394, longitude: 12.5278 }, attractions: ['Shopping centre'], note: 'Residential area.' },
  { id: 'rb1-jonio',       name: 'Jonio',                 coordinate: { latitude: 41.9464, longitude: 12.5281 }, attractions: [], note: 'B1 northern terminus.' },
];

// ── ROME METRO LINE C ─────────────────────────────────────────────────────────
// Full line: Monte Compatri-Pantano (E) ↔ Colosseo (W), 24 stations.
// Opened in stages 2014–2025. Western extension (Porta Metronia + Colosseo)
// opened December 16, 2025. San Giovanni interchanges with Line A.
// Note: eastern suburban station coordinates are approximate.
const ROME_C_STATIONS = [
  { id: 'rc-pantano',      name: 'Monte Compatri-Pantano', coordinate: { latitude: 41.8657, longitude: 12.7076 }, attractions: ['Castelli Romani area (bus)'], note: 'Eastern terminus. Bus connections to the Castelli Romani wine country.' },
  { id: 'rc-graniti',      name: 'Graniti',               coordinate: { latitude: 41.8657, longitude: 12.6980 }, attractions: [], note: 'Suburban residential.' },
  { id: 'rc-finocchio',    name: 'Finocchio',             coordinate: { latitude: 41.8655, longitude: 12.6878 }, attractions: [], note: 'Suburban residential.' },
  { id: 'rc-bolognetta',   name: 'Bolognetta',            coordinate: { latitude: 41.8651, longitude: 12.6809 }, attractions: [], note: 'Suburban residential.' },
  { id: 'rc-borghesiana',  name: 'Borghesiana',           coordinate: { latitude: 41.8647, longitude: 12.6673 }, attractions: [], note: 'Suburban residential.' },
  { id: 'rc-dueleoni',     name: 'Due Leoni-Fontana Candida', coordinate: { latitude: 41.8649, longitude: 12.6581 }, attractions: [], note: 'Suburban residential.' },
  { id: 'rc-grotteceloni', name: 'Grotte Celoni',         coordinate: { latitude: 41.8627, longitude: 12.6461 }, attractions: [], note: 'Suburban residential.' },
  { id: 'rc-torregaia',    name: 'Torre Gaia',            coordinate: { latitude: 41.8641, longitude: 12.6356 }, attractions: [], note: 'Suburban residential.' },
  { id: 'rc-torreangela',  name: 'Torre Angela',          coordinate: { latitude: 41.8643, longitude: 12.6257 }, attractions: [], note: 'Suburban residential.' },
  { id: 'rc-torrenova',    name: 'Torrenova',             coordinate: { latitude: 41.8633, longitude: 12.6168 }, attractions: [], note: 'Suburban residential.' },
  { id: 'rc-giardinetti',  name: 'Giardinetti',           coordinate: { latitude: 41.8643, longitude: 12.6101 }, attractions: [], note: 'Suburban residential.' },
  { id: 'rc-torremaura',   name: 'Torre Maura',           coordinate: { latitude: 41.8669, longitude: 12.5969 }, attractions: [], note: 'Suburban residential.' },
  { id: 'rc-torrespaccata',name: 'Torre Spaccata',        coordinate: { latitude: 41.8690, longitude: 12.5866 }, attractions: [], note: 'Suburban residential.' },
  { id: 'rc-alessandrino', name: 'Alessandrino',          coordinate: { latitude: 41.8713, longitude: 12.5787 }, attractions: [], note: 'Suburban residential.' },
  { id: 'rc-centocelle',   name: 'Parco di Centocelle',   coordinate: { latitude: 41.8746, longitude: 12.5680 }, attractions: ['Parco di Centocelle (historic park & ancient villa ruins)'], note: 'Large park with remains of Roman imperial villas.' },
  { id: 'rc-mirti',        name: 'Mirti',                 coordinate: { latitude: 41.8811, longitude: 12.5666 }, attractions: [], note: 'Residential area.' },
  { id: 'rc-gardenie',     name: 'Gardenie',              coordinate: { latitude: 41.8863, longitude: 12.5617 }, attractions: [], note: 'Residential area.' },
  { id: 'rc-teano',        name: 'Teano',                 coordinate: { latitude: 41.8892, longitude: 12.5513 }, attractions: [], note: 'Residential area.' },
  { id: 'rc-malatesta',    name: 'Malatesta',             coordinate: { latitude: 41.8873, longitude: 12.5402 }, attractions: [], note: 'Residential area.' },
  { id: 'rc-pigneto',      name: 'Pigneto',               coordinate: { latitude: 41.8885, longitude: 12.5282 }, attractions: ['Pigneto neighbourhood (bars and street art)'], note: "One of Rome's trendiest neighbourhoods for evening drinks and aperitivo." },
  { id: 'rc-lodi',         name: 'Lodi',                  coordinate: { latitude: 41.8867, longitude: 12.5178 }, attractions: [], note: 'Residential area.' },
  { id: 'rc-sangiovanni',  name: 'San Giovanni',          coordinate: { latitude: 41.8853, longitude: 12.5094 }, attractions: ['Basilica di San Giovanni in Laterano', 'Holy Stairs (Scala Santa)', 'Aurelian Walls'], note: 'Interchange with Line A. Basilica is free — one of the four papal basilicas.' },
  { id: 'rc-portametronia',name: 'Porta Metronia',        coordinate: { latitude: 41.8831, longitude: 12.5027 }, attractions: ['Porta Metronia gate (Aurelian Walls)', 'Celio neighbourhood', 'Santi Giovanni e Paolo church'], note: 'Opened Dec 2025. The station itself is a museum — Roman archaeological finds on display.' },
  { id: 'rc-colosseo',     name: 'Colosseo',              coordinate: { latitude: 41.8914, longitude: 12.4914 }, attractions: ['Colosseum (5 min walk)', 'Roman Forum & Palatine Hill', 'Imperial Forums (Via dei Fori Imperiali)', 'Arch of Constantine', 'Palatine Museum'], note: 'Opened Dec 2025. Western terminus (temporary — line will extend to Vatican). Station architecture is spectacular.' },
];

// ── FLORENCE TRAM T1 ──────────────────────────────────────────────────────────
// Full line: Villa Costanza/Scandicci (SW) ↔ Careggi-Ospedale (NE), 26 stations.
// Opened in two stages: Scandicci–SMN (Feb 2010), SMN–Careggi (Jul 2018).
// T1 and T2 share track through the SMN/Fortezza section.
const FLORENCE_T1_STATIONS = [
  // ── Southwest section: Villa Costanza (Scandicci) → SMN ──
  { id: 'ft1-villacostanza', name: 'Villa Costanza',        coordinate: { latitude: 43.7548, longitude: 11.1752 }, attractions: ['Park & ride (free parking)', 'Bus connections to Scandicci'], note: 'SW terminus. Free park-and-ride — leave your car here and take the tram into Florence.' },
  { id: 'ft1-deandre',       name: 'De Andrè (Ciliegi)',    coordinate: { latitude: 43.7549, longitude: 11.1791 }, attractions: [], note: 'Scandicci suburban area.' },
  { id: 'ft1-resistenza',    name: 'Resistenza (Pantin)',   coordinate: { latitude: 43.7584, longitude: 11.1826 }, attractions: [], note: 'Scandicci suburban area.' },
  { id: 'ft1-aldomoro',      name: 'Aldo Moro',             coordinate: { latitude: 43.7623, longitude: 11.1880 }, attractions: [], note: 'Scandicci suburban area.' },
  { id: 'ft1-nenni',         name: 'Nenni-Torregalli',      coordinate: { latitude: 43.7641, longitude: 11.1980 }, attractions: [], note: 'T1 and T2 tracks join near this section toward SMN.' },
  { id: 'ft1-arcipressi',    name: 'Arcipressi (Ronco Corto)', coordinate: { latitude: 43.7677, longitude: 11.2093 }, attractions: [], note: 'Residential area.' },
  { id: 'ft1-federiga',      name: 'Federiga (Foggini)',    coordinate: { latitude: 43.7717, longitude: 11.2119 }, attractions: [], note: 'Residential area.' },
  { id: 'ft1-talenti',       name: 'Talenti',               coordinate: { latitude: 43.7738, longitude: 11.2170 }, attractions: [], note: 'Residential area.' },
  { id: 'ft1-batoni',        name: 'Batoni',                coordinate: { latitude: 43.7745, longitude: 11.2226 }, attractions: [], note: 'Residential area.' },
  { id: 'ft1-sansovino',     name: 'Sansovino',             coordinate: { latitude: 43.7748, longitude: 11.2252 }, attractions: [], note: 'Residential area.' },
  { id: 'ft1-paolouccello',  name: 'Paolo Uccello (Arno)',  coordinate: { latitude: 43.7754, longitude: 11.2289 }, attractions: ['Arno riverbank walk', 'Parco delle Cascine (short walk)'], note: 'Near the Arno river. Walk north for the city park.' },
  { id: 'ft1-cascine',       name: 'Cascine (Olmi)',        coordinate: { latitude: 43.7772, longitude: 11.2326 }, attractions: ["Parco delle Cascine (Florence's largest park)", 'Tuesday market'], note: "Florence's largest park runs along the Arno. Huge Tuesday market." },
  { id: 'ft1-portalprato',   name: 'Porta al Prato-Leopolda', coordinate: { latitude: 43.7776, longitude: 11.2391 }, attractions: ['Stazione Leopolda (events venue)', 'Fortezza da Basso (short walk)'], note: 'The Leopolda is an old railway station now used for major cultural events.' },
  // ── Shared section: Alamanni / Valfonda (SMN area) ──
  { id: 'ft1-alamanni',      name: 'Alamanni-Stazione SMN', coordinate: { latitude: 43.7762, longitude: 11.2469 }, attractions: ['Mercato Centrale (5 min walk)', 'San Lorenzo Market'], note: 'Central hub. Change here for T2. Mercato Centrale food market is excellent.' },
  { id: 'ft1-valfonda',      name: 'Valfonda-Stazione SMN', coordinate: { latitude: 43.7766, longitude: 11.2495 }, attractions: ['SMN Railway Station', 'Santa Maria Novella Church', 'City centre hub'], note: 'Main city centre stop. Trains to Rome (~1.5 h fast), Pisa (1 h), Bologna (35 min).' },
  // ── Northeast section: SMN → Careggi ──
  { id: 'ft1-fortezza',      name: 'Fortezza (Fiera e Congressi)', coordinate: { latitude: 43.7807, longitude: 11.2495 }, attractions: ['Fortezza da Basso (exhibition centre)', 'Strozzi gallery events'], note: 'The 16th-century Fortezza hosts major antiques fairs and trade shows.' },
  { id: 'ft1-strozzifallaci', name: 'Strozzi-Fallaci',      coordinate: { latitude: 43.7837, longitude: 11.2519 }, attractions: [], note: 'Residential area.' },
  { id: 'ft1-statuto',       name: 'Statuto',               coordinate: { latitude: 43.7863, longitude: 11.2507 }, attractions: [], note: 'Residential area.' },
  { id: 'ft1-muratori',      name: 'Muratori-Stazione Statuto', coordinate: { latitude: 43.7880, longitude: 11.2500 }, attractions: [], note: 'Residential area.' },
  { id: 'ft1-leopoldo',      name: 'Leopoldo (Stibbert)',   coordinate: { latitude: 43.7920, longitude: 11.2472 }, attractions: ['Museo Stibbert (10 min walk) — extraordinary arms & armour collection'], note: "Stibbert Museum has one of Europe's finest collections of armour — worth the detour." },
  { id: 'ft1-poggetto',      name: 'Poggetto',              coordinate: { latitude: 43.7940, longitude: 11.2425 }, attractions: [], note: 'Residential area.' },
  { id: 'ft1-pisacane',      name: 'Pisacane',              coordinate: { latitude: 43.7934, longitude: 11.2440 }, attractions: [], note: 'Residential area.' },
  { id: 'ft1-vittorioemanuele', name: 'Vittorio Emanuele II (Rifredi)', coordinate: { latitude: 43.7958, longitude: 11.2393 }, attractions: ['Rifredi neighbourhood', 'Stazione di Rifredi (regional trains)'], note: 'Rifredi station nearby for regional trains.' },
  { id: 'ft1-dalmazia',      name: 'Dalmazia',              coordinate: { latitude: 43.7959, longitude: 11.2405 }, attractions: [], note: 'Residential area.' },
  { id: 'ft1-morgagni',      name: 'Morgagni-Università',   coordinate: { latitude: 43.7997, longitude: 11.2439 }, attractions: ['University of Florence medical campus'], note: 'Careggi university hospital campus.' },
  { id: 'ft1-careggi',       name: 'Careggi-Ospedale',      coordinate: { latitude: 43.8032, longitude: 11.2466 }, attractions: ['Careggi Hospital', 'Villa Medicea di Careggi'], note: 'NE terminus. Villa Medicea di Careggi (Medici country villa) is nearby — visits by appointment.' },
];

// ── FLORENCE TRAM T2 (Airport → San Marco-Università) ────────────────────────
// 20 stations, NW → E. Opened 2019; extended Jan 25, 2025 (+6 stops to San Marco-Università).
// €1.70 single ticket. Every 5–6 min, 5 am–midnight. Journey airport→SMN ~25 min.
// T1 and T2 share track through the SMN/Fortezza section.
const FLORENCE_T2_STATIONS = [
  { id: 'ft2-airport',      name: 'Peretola Aeroporto',    coordinate: { latitude: 43.8029, longitude: 11.2026 }, attractions: ['Amerigo Vespucci Airport'], note: 'Buy ticket at machine before boarding (€1.70). Departs every 5–6 min. ~25 min to SMN.' },
  { id: 'ft2-guidoni',      name: 'Guidoni',               coordinate: { latitude: 43.7994, longitude: 11.2085 }, attractions: ['IKEA Florence'], note: 'Mainly residential/commercial.' },
  { id: 'ft2-novolipalazzi',name: 'Novoli-Palazzi Rossi',  coordinate: { latitude: 43.7964, longitude: 11.2139 }, attractions: [], note: 'Novoli district (former Fiat plant, now university and residential).' },
  { id: 'ft2-novolialtri',  name: 'Novoli-Torre degli Agli', coordinate: { latitude: 43.7943, longitude: 11.2179 }, attractions: [], note: 'Novoli district.' },
  { id: 'ft2-novoliregione',name: 'Novoli-Regione Toscana', coordinate: { latitude: 43.7920, longitude: 11.2235 }, attractions: ['Palazzo della Regione Toscana (Tuscany regional HQ)'], note: 'Near the Tuscany regional government building.' },
  { id: 'ft2-sandonato',    name: 'San Donato-Università', coordinate: { latitude: 43.7906, longitude: 11.2265 }, attractions: ['University of Florence (Novoli campus)'], note: 'University law and economics faculties.' },
  { id: 'ft2-buonsignori',  name: 'Buonsignori-Liceo Da Vinci', coordinate: { latitude: 43.7886, longitude: 11.2347 }, attractions: [], note: 'Residential area.' },
  { id: 'ft2-ponteasse',    name: "Ponte all'Asse",         coordinate: { latitude: 43.7871, longitude: 11.2397 }, attractions: [], note: 'Residential area.' },
  { id: 'ft2-belfiore',     name: 'Belfiore',              coordinate: { latitude: 43.7822, longitude: 11.2428 }, attractions: [], note: 'Residential area.' },
  { id: 'ft2-rosselli',     name: 'Rosselli',              coordinate: { latitude: 43.7798, longitude: 11.2451 }, attractions: ['Near Fortezza da Basso'], note: 'Close to the main exhibition centre.' },
  { id: 'ft2-alamanni',     name: 'Alamanni-Stazione SMN', coordinate: { latitude: 43.7762, longitude: 11.2469 }, attractions: ['Mercato Centrale (5 min walk)', 'San Lorenzo Market'], note: 'Second-closest stop to city centre. Change here for T1. Mercato Centrale nearby.' },
  { id: 'ft2-valfonda',     name: 'Valfonda-Stazione SMN', coordinate: { latitude: 43.7766, longitude: 11.2495 }, attractions: ['SMN Railway Station', 'Santa Maria Novella Church', 'City centre hub'], note: 'Main terminus for airport arrivals. Trains to Rome, Pisa, Bologna.' },
  { id: 'ft2-fortezza',     name: 'Fortezza-Fiere e Congressi', coordinate: { latitude: 43.7807, longitude: 11.2495 }, attractions: ['Fortezza da Basso (exhibition centre)'], note: 'The 16th-century fortress hosts major antiques fairs and trade shows.' },
  // ── Extension opened January 25, 2025 ──
  { id: 'ft2-lavagniniftr', name: 'Lavagnini-Fortezza',   coordinate: { latitude: 43.7845, longitude: 11.2543 }, attractions: [], note: 'New Jan 2025. Residential area north of Fortezza.' },
  { id: 'ft2-lavagninipol', name: 'Lavagnini-Poliziano',  coordinate: { latitude: 43.7862, longitude: 11.2557 }, attractions: [], note: 'New Jan 2025.' },
  { id: 'ft2-liberta',      name: 'Libertà-Parterre',     coordinate: { latitude: 43.7839, longitude: 11.2613 }, attractions: ['Piazza della Libertà', 'Parco del Parterre'], note: 'New Jan 2025. Near Piazza della Libertà — elegant square with park.' },
  { id: 'ft2-cavour',       name: 'Cavour',               coordinate: { latitude: 43.7826, longitude: 11.2586 }, attractions: ['Via Cavour', 'San Marco (10 min walk)'], note: 'New Jan 2025. Short walk to Piazza San Marco and the Accademia.' },
  { id: 'ft2-lamarmora',    name: 'La Marmora-Orto Botanico', coordinate: { latitude: 43.7812, longitude: 11.2621 }, attractions: ["Giardino dei Semplici (Botanical Garden)", 'San Marco museum area'], note: 'New Jan 2025. The Botanical Garden (est. 1545 by the Medici) is right here.' },
  { id: 'ft2-sanmarco',     name: 'San Marco-Università', coordinate: { latitude: 43.7779, longitude: 11.2588 }, attractions: ['Piazza San Marco', 'Museo di San Marco (Fra Angelico frescoes)', 'Galleria dell\'Accademia — David (5 min walk)', 'University of Florence'], note: "New Jan 2025. Eastern terminus. Walk 5 min south to see Michelangelo's David — no need for a taxi from SMN anymore!" },
];

// ── EXPORTS ───────────────────────────────────────────────────────────────────
export const ROME_TRANSIT_LINES = [
  {
    id: 'rome-metro-a',
    city: 'rome',
    name: 'Metro Line A',
    shortName: 'A',
    color: '#FF8C00',
    type: 'metro',
    description: 'Main tourist line. 27 stations, Battistini (NW) to Anagnina (SE). Key stops: Ottaviano (Vatican), Spagna (Spanish Steps), Barberini (Trevi Fountain), Termini. Change at Termini for Line B, at San Giovanni for Line C.',
    stations: ROME_A_STATIONS,
  },
  {
    id: 'rome-metro-b',
    city: 'rome',
    name: 'Metro Line B',
    shortName: 'B',
    color: '#0072BC',
    type: 'metro',
    description: 'Runs N–S: Rebibbia to Laurentina (22 stations). Key stops: Colosseo (Colosseum), Circo Massimo, Piramide (Testaccio), Basilica San Paolo. Change at Termini for Line A, at Bologna for Line B1.',
    stations: ROME_B_STATIONS,
  },
  {
    id: 'rome-metro-b1',
    city: 'rome',
    name: 'Metro Line B1',
    shortName: 'B1',
    color: '#0072BC',
    type: 'metro',
    description: 'Branch off Line B at Bologna, running NE to Jonio (5 stations). Serves the university area and the Basilica di Sant\'Agnese fuori le mura.',
    stations: ROME_B1_STATIONS,
  },
  {
    id: 'rome-metro-c',
    city: 'rome',
    name: 'Metro Line C',
    shortName: 'C',
    color: '#669900',
    type: 'metro',
    description: 'Newest line (opened 2014–2025). 24 stations, Monte Compatri-Pantano (E) to Colosseo (W). Tourist highlights: Colosseo station (opened Dec 2025 — steps from the Colosseum and Imperial Forums), Porta Metronia, San Giovanni (interchange with Line A).',
    stations: ROME_C_STATIONS,
  },
];

export const ROME_STOPS = ROME_A_STATIONS.map(s => ({ ...s, line: 'A', color: '#FF8C00' }))
  .concat(ROME_B_STATIONS.map(s => ({ ...s, line: 'B', color: '#0072BC' })))
  .concat(ROME_B1_STATIONS.map(s => ({ ...s, line: 'B1', color: '#0072BC' })))
  .concat(ROME_C_STATIONS.map(s => ({ ...s, line: 'C', color: '#669900' })));

export const FLORENCE_TRANSIT_LINES = [
  {
    id: 'florence-tram-t1',
    city: 'florence',
    name: 'Tram T1',
    shortName: 'T1',
    color: '#009900',
    type: 'tram',
    description: 'Full line: Villa Costanza/Scandicci (SW) → SMN → Careggi-Ospedale (NE). 26 stations. Free park-and-ride at Villa Costanza. Useful for the hospital, university, and Stibbert Museum.',
    stations: FLORENCE_T1_STATIONS,
  },
  {
    id: 'florence-tram-t2',
    city: 'florence',
    name: 'Tram T2 — Airport Line',
    shortName: 'T2',
    color: '#CC6600',
    type: 'tram',
    description: 'Airport (Peretola) → SMN → San Marco-Università. 20 stations. Every 5–6 min, 5 am–midnight. €1.70 single. ~25 min airport to SMN. Extended Jan 2025: now reaches San Marco (Accademia/David).',
    stations: FLORENCE_T2_STATIONS,
  },
];

export const FLORENCE_STOPS = FLORENCE_T1_STATIONS.map(s => ({ ...s, line: 'T1', color: '#009900' }))
  .concat(FLORENCE_T2_STATIONS.map(s => ({ ...s, line: 'T2', color: '#CC6600' })));

// ── NEAREST STATION HELPER ───────────────────────────────────────────────────
// Returns the closest transit stop to a given { latitude, longitude }.
// Uses Haversine for accurate short-distance comparisons.
function haversineKm(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const sin2 = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(sin2), Math.sqrt(1 - sin2));
}

export function findNearestStation(coordinate, city = 'rome') {
  const stops = city === 'florence' ? FLORENCE_STOPS : ROME_STOPS;
  let best = null;
  let bestDist = Infinity;
  for (const stop of stops) {
    const d = haversineKm(coordinate, stop.coordinate);
    if (d < bestDist) { bestDist = d; best = stop; }
  }
  if (!best) return null;
  // ~15 min/km walking pace in a city
  const walkMin = Math.round(bestDist * 15);
  return { name: best.name, line: best.line, color: best.color, walkMin, coordinate: best.coordinate };
}

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
    howToBuy: [
      { icon: '🏧', title: 'Metro station machines', desc: 'At every metro entrance. Accept contactless card (Visa/Mastercard), chip & PIN, and cash. Available 24/7. Choose "BIT" for a single ticket.' },
      { icon: '🪧', title: 'Tabacchi (tobacconists)', desc: 'Look for a white "T" on a dark background. Same price as machines, no queues. Say "un biglietto ATM, per favore" or just show the ticket icon on this app.' },
      { icon: '📰', title: 'News kiosks & bars', desc: 'Many kiosks near Termini, Spagna, and Colosseo sell tickets. Useful when station machines have queues.' },
      { icon: '⚠️', title: 'Validate before you travel', desc: 'Yellow validation machines are at metro turnstiles and on buses. Inspectors issue on-the-spot fines of €50–€100. Tapping on a metro turnstile validates automatically.' },
    ],
    links: [
      { label: 'ATAC — Official Tickets & Passes', url: 'https://www.atac.roma.it/en/tickets-and-passes', desc: 'Full price list, validity rules, and where to buy' },
      { label: 'Plan your route — CityMapper Rome', url: 'https://citymapper.com/rome', desc: 'Real-time directions, live bus tracking' },
    ],
    tips: [
      '🎫 Buy tickets at metro stations, tobacconists (tabacchi), or authorised vendors.',
      '🚇 Line C now has a Colosseo station (opened Dec 2025) — right next to the Imperial Forums.',
      '📱 The "Muoversi a Roma" app shows real-time bus tracking.',
      '🌙 Night buses (N lines) run when metro closes at ~23:30.',
      '🚕 Official taxis are white. Fixed fare from Fiumicino airport: €50 to historic centre.',
    ],
    parking: {
      zones: [
        { color: '#4a9eff', label: 'Blue lines — paid', price: '€1.20–2.00/hr', desc: 'Pay at roadside machines or via app. Hours are posted on signs — typically Mon–Sat 8am–8pm. Often free on Sundays and public holidays.' },
        { color: '#e0e0e0', label: 'White lines — free', price: 'Free', desc: 'No charge. Increasingly rare near the historic centre. Check for any time-restriction signs posted nearby.' },
        { color: '#f5c518', label: 'Yellow lines — reserved', price: 'No parking', desc: 'Residents, disabled badges, or delivery vehicles only. Tow trucks are active — do not stop here even briefly.' },
      ],
      garages: [
        { name: 'Villa Borghese Underground', location: 'Near Spanish Steps & Borghese Gallery', price: '~€2/hr', note: 'Largest central garage. Entrance from Viale del Muro Torto. Walk or take short taxi to Spanish Steps.' },
        { name: 'Parking Ludovisi (Marriott)', location: 'Via Vittorio Veneto (Via Veneto area)', price: '~€3/hr', note: 'Covered garage near Via Veneto and Barberini metro. Good base for the historic centre.' },
        { name: 'Park & Ride Anagnina', location: 'Line A eastern terminus', price: 'Free / very cheap', note: 'Drive to Anagnina, park free, take Metro A direct to Spagna/Termini/Vatican (~30 min). Best for day trips from south.' },
        { name: 'Park & Ride Laurentina', location: 'Line B southern terminus', price: 'Free / very cheap', note: 'Drive to Laurentina, park free, take Metro B to Termini/Colosseo (~20 min). Good if driving from EUR/south.' },
      ],
      apps: [
        { icon: '🅿️', name: 'EasyPark', desc: 'Most popular parking app in Italy. Start/stop paid blue-zone parking remotely, get reminders before time runs out. Also works in Florence.', url: 'https://easypark.it' },
        { icon: '🎫', name: 'MyCicero', desc: 'Pay blue-zone parking AND buy ATAC bus/metro tickets in one app. Official municipal partner for Rome.', url: 'https://www.mycicero.it' },
        { icon: '🛣️', name: 'Telepass', desc: 'Mandatory for toll motorways (autostrada). Also accepted at many parking garages. Rent a device at the airport or use the app with a compatible transponder.', url: 'https://www.telepass.com' },
      ],
      tips: [
        '🚫 Never park inside a ZTL zone — cameras issue automatic fines of €80–€300 mailed to your home address weeks later.',
        '📸 Rome has thousands of parking cameras. Expired meters are caught automatically.',
        '🏛️ The historic centre has almost no free street parking. Garages or park & ride are your best bet.',
        '🕐 Blue-zone parking is often free after 8pm and on Sundays — check the sign on the nearest parking meter.',
        '📱 EasyPark and MyCicero let you pay by phone and extend time remotely — no need to return to your car.',
      ],
    },
  },
  florence: {
    title: 'Florence Transit Tickets (ATAF)',
    tickets: [
      { name: 'Single ticket', price: '€1.70', duration: '90 minutes', note: 'Buy in advance from tabacchi or machines. €2.50 if bought on board.' },
      { name: '4-ticket carnet', price: '€6.20', duration: '90 min each', note: 'Best value if buying in advance.' },
      { name: '24-hour pass', price: '€5.00', duration: '24 hours', note: 'Valid on all ATAF buses and trams.' },
      { name: '3-day pass', price: '€12.00', duration: '72 hours', note: 'Good value for 3 full days.' },
    ],
    howToBuy: [
      { icon: '🏧', title: 'Tram stop machines', desc: 'Blue ticket machines at every tram stop. Accept contactless card and cash. Buy before boarding — on-board price is €2.50 vs €1.70.' },
      { icon: '🪧', title: 'Tabacchi (tobacconists)', desc: 'Cheapest and easiest option. Look for the white "T" sign. Buy single tickets or a 4-carnet for €6.20. Open early morning until evening.' },
      { icon: '📱', title: '"At Bus" app (Autolinee Toscane)', desc: 'Official app for tram and bus schedules, stop times, and journey planning. Search "At Bus" in the App Store or Google Play.' },
      { icon: '⚠️', title: 'Validate on board immediately', desc: 'Tap your ticket on the yellow validator as soon as you board. Inspectors check frequently — fines start at €50. Day/multi-day passes only need validating once.' },
    ],
    links: [
      { label: 'Autolinee Toscane — Tram & Bus Info', url: 'https://www.at-bus.it/en', desc: 'Official schedules, stops, and ticket prices' },
      { label: 'T2 Airport Tram Guide', url: 'https://www.at-bus.it/en/linee-e-orari/firenze-urbano-t2', desc: 'Airport → SMN → San Marco timetables' },
      { label: 'Plan your route — CityMapper Florence', url: 'https://citymapper.com/florence', desc: 'Real-time directions across Florence' },
    ],
    tips: [
      '🚶 Florence historic centre is compact — most attractions are walkable in 20 min.',
      '✈️ Tram T2 is the easiest airport transfer — €1.70, every 5–6 min, 25 min to SMN.',
      '🏛️ T2 extended Jan 2025: now reaches San Marco-Università — a 5 min walk to the Accademia (David).',
      '🚌 Most useful bus lines: C1 (Duomo–Santa Croce), C2 (SMN–Piazza Repubblica), 7 (Fiesole), 12/13 (Piazzale Michelangelo).',
      '🚗 Do NOT drive in Florence\'s ZTL — cameras issue €70–€200 fines automatically.',
      '🚲 Bikes and e-scooters available via MÀ Mobilità and Lime apps.',
    ],
    parking: {
      zones: [
        { color: '#4a9eff', label: 'Blue lines — paid', price: '€1.50–2.50/hr', desc: 'Pay at machines or via app. Zone A (near Duomo) is most expensive. Hours typically Mon–Sat 8am–8pm. Check the nearest meter sign.' },
        { color: '#e0e0e0', label: 'White lines — free', price: 'Free', desc: 'Uncommon near the centre. No charge but always check for restriction signs. Usually found in outer residential areas.' },
        { color: '#f5c518', label: 'Yellow lines — reserved', price: 'No parking', desc: 'Residents, disabled, or deliveries only. Fines and towing are common — do not park even for a moment.' },
      ],
      garages: [
        { name: 'Villa Costanza Park & Ride', location: 'Scandicci (T1 tram terminus, SW)', price: 'Free parking', note: 'Best option. Free parking, then €1.70 tram to city centre (25 min). Tram every 5–10 min. Follow signs from the A1 motorway exit.' },
        { name: 'Parcheggio Parterre', location: 'Piazza della Libertà (north centre)', price: '~€2/hr', note: 'Underground garage just north of the historic centre. Short walk to the Duomo. Book online via Firenze Parcheggi for discounts.' },
        { name: 'Parcheggio Beccaria', location: 'Piazza Beccaria (east of Santa Croce)', price: '~€2/hr', note: 'Convenient for Santa Croce and the eastern historic centre. Open 24/7.' },
        { name: 'Parcheggio SMN (Stazione)', location: 'Via della Scala (near train station)', price: '~€3/hr', note: 'Covered garage next to SMN station. Expensive but very central. Good for a short stay if arriving by car and then switching to public transport.' },
      ],
      apps: [
        { icon: '🅿️', name: 'EasyPark', desc: 'Start/stop blue-zone street parking from your phone. Works across Florence and Italy. Sends reminders before your paid time expires.', url: 'https://easypark.it' },
        { icon: '🏛️', name: 'Firenze Parcheggi', desc: 'Official Florence city parking app. Book and pre-pay for Parterre, Beccaria, and other city-run garages. Often cheaper than turning up at the barrier.', url: 'https://www.firenzeparcheggi.it' },
        { icon: '🎫', name: 'MyCicero', desc: 'Pay street parking and buy tram/bus tickets in one app. Accepted in Florence blue zones.', url: 'https://www.mycicero.it' },
      ],
      tips: [
        '🚫 Florence\'s ZTL is one of the strictest in Italy. Cameras operate 24/7 and fines are sent internationally — there are no exceptions.',
        '🌟 Villa Costanza park & ride is the smartest move: free parking + cheap tram = stress-free day in the city.',
        '🗺️ The ZTL boundary is marked by orange cameras above the road. If you see one you\'ve already entered — pull over and reverse if safe.',
        '🕐 Blue-zone parking is often free on Sundays and after 8pm — check the meter sign for exact hours.',
        '📱 Book a city garage in advance via the Firenze Parcheggi app, especially during summer and major events (Pitti Uomo, Maggio Musicale).',
      ],
    },
  },
};

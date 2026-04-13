const DESTINATIONS = [
  // ────────────────────────────────────────────────────────────────────────────
  // ROME
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: 'rome',
    name: 'Rome',
    region: 'Lazio',
    emoji: '🏛️',
    tagline: 'The Eternal City',
    overview: `Rome is one of the world's great historic cities, with a continuous history spanning over 2,700 years. As the capital of the Roman Empire, it shaped Western civilisation through law, architecture, language and religion. Today it seamlessly blends ancient ruins, Renaissance palaces, Baroque piazzas and a vibrant modern city.\n\nRome is compact enough to explore on foot — most major sites in the historic centre are within a 30-minute walk of each other. The best strategy is to pick a neighbourhood each day rather than rushing between landmarks.`,

    history: `Founded in 753 BC (according to tradition by Romulus and Remus), Rome grew from a small settlement on the Palatine Hill into the capital of an empire stretching from Britain to Mesopotamia. After the fall of the Western Roman Empire in 476 AD, Rome became the centre of the Catholic Church. The Renaissance brought a cultural rebirth under popes who commissioned Michelangelo, Raphael and Bramante. The city was unified with Italy in 1870.`,

    practical: [
      { icon: '🎫', tip: 'Book the Colosseum, Vatican Museums, and Borghese Gallery in advance — they sell out weeks ahead.' },
      { icon: '🕐', tip: 'Most churches are free but close 12:00–15:00. Plan morning or late afternoon visits.' },
      { icon: '💧', tip: 'Tap water in Rome is excellent and free — refill from the "nasoni" street fountains throughout the city.' },
      { icon: '👗', tip: 'Covered shoulders and knees required to enter churches including St Peter\'s Basilica. Carry a scarf.' },
      { icon: '🚇', tip: 'Metro has only 2 main lines. Buses and walking are more useful in the centre.' },
      { icon: '💶', tip: 'The tourist "coperto" (cover charge) in restaurants is legal and typically €2–4 per person.' },
      { icon: '⚠️', tip: 'ZTL zones cover most of the historic centre. Do not drive in without a permit — cameras issue fines automatically.' },
    ],

    neighborhoods: [
      {
        name: 'Centro Storico',
        description: 'The historic heart — Pantheon, Piazza Navona, Campo de\' Fiori. Mostly pedestrian, full of trattorias and gelaterias.',
      },
      {
        name: 'Trastevere',
        description: 'Charming medieval neighbourhood south of the centre. Cobbled lanes, ivy-covered buildings, excellent local restaurants. Lively at night.',
      },
      {
        name: 'Prati',
        description: 'Elegant neighbourhood near the Vatican. Good mid-range restaurants away from tourist traps, excellent bakeries.',
      },
      {
        name: 'Testaccio',
        description: 'Rome\'s traditional working-class neighbourhood. Best place to eat authentic Roman food — cacio e pepe, coda alla vaccinara, supplì.',
      },
      {
        name: 'Aventine Hill',
        description: 'Quiet residential hill with a famous keyhole view of St Peter\'s dome through a hedge at the Knights of Malta.',
      },
    ],

    museums: [
      {
        name: 'Vatican Museums & Sistine Chapel',
        description: 'One of the world\'s greatest museum complexes. The Sistine Chapel ceiling by Michelangelo (1508–12) is unmissable. Arrive early or book the first entry slot. Allow 3–4 hours minimum.',
        tip: 'Book online months in advance. The "skip the line" tours are worth it.',
      },
      {
        name: 'Colosseum, Roman Forum & Palatine Hill',
        description: 'The Colosseum held 50,000 spectators for gladiatorial games. Combined ticket includes the Roman Forum and Palatine Hill. The Forum was the centre of Roman public life.',
        tip: 'Buy combo tickets online. A guided tour adds enormous context.',
      },
      {
        name: 'Borghese Gallery',
        description: 'Rome\'s most beautiful museum. Houses Bernini\'s sculptures and Caravaggio paintings in a 17th-century villa. Timed entry, max 2 hours, max 360 visitors.',
        tip: 'Booking is mandatory — entry is refused without a reservation. Book weeks ahead.',
      },
      {
        name: 'Capitoline Museums',
        description: 'The world\'s oldest public museums (1471). Spectacular views of the Roman Forum. Home to the original Marcus Aurelius equestrian statue and the Capitoline Wolf.',
        tip: 'Often overlooked by tourists — usually less crowded than Vatican or Colosseum.',
      },
      {
        name: 'Pantheon',
        description: 'The best-preserved ancient Roman building, completed around 125 AD. Its unreinforced concrete dome remained the world\'s largest for 1,300 years. Now a church — entry requires a ticket (€5).',
        tip: 'Visit on a rainy day to see rain fall through the oculus into a drain designed 2,000 years ago.',
      },
    ],

    churches: [
      { name: 'St Peter\'s Basilica', description: 'The world\'s largest church. Climb the dome for panoramic views. Free entry to the basilica; fee for dome access.' },
      { name: 'Santa Maria Maggiore', description: 'One of Rome\'s four major basilicas. Stunning golden ceiling, fascinating Christmas crib relics.' },
      { name: 'San Clemente', description: 'Three layers of history: modern church above a 4th-century basilica above a 1st-century Roman building with a Mithraic temple. Unmissable.' },
      { name: 'Sant\'Ivo alla Sapienza', description: 'Borromini\'s Baroque masterpiece, a spiralling lantern tower built into a university courtyard. Often closed — check opening days.' },
    ],

    food: [
      { name: 'Cacio e Pepe', description: 'Pasta with pecorino romano cheese and black pepper. Simple, perfect, deeply Roman.' },
      { name: 'Supplì', description: 'Roman street food — fried rice balls with tomato sauce and mozzarella. Buy from a pizza al taglio shop.' },
      { name: 'Carbonara', description: 'Egg, guanciale (cured pork cheek), pecorino, black pepper — no cream. A Roman invention.' },
      { name: 'Artichokes', description: 'Rome\'s signature vegetable. Carciofi alla giudea (fried Jewish-style) or alla romana (braised). Spring season only.' },
      { name: 'Gelato', description: 'Look for "artigianale" signs and gelato stored in metal containers with lids — a sign of quality. Avoid neon-coloured mounds.' },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // FLORENCE
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: 'florence',
    name: 'Florence',
    region: 'Tuscany',
    emoji: '🌸',
    tagline: 'Birthplace of the Renaissance',
    overview: `Florence (Firenze) is arguably the greatest concentration of Renaissance art and architecture in the world. In a city of just 370,000 people you'll find works by Botticelli, Michelangelo, Leonardo da Vinci, Raphael, Donatello and Brunelleschi within walking distance of each other.\n\nThe historic centre is a UNESCO World Heritage Site and completely walkable. The Arno river divides the city — the Oltrarno district on the south bank is quieter, more local, and often overlooked by tourists.`,

    history: `Florence rose to power through banking and the wool trade in the 12th–13th centuries. The Medici family — bankers turned de facto rulers — were the defining force of Florentine culture from 1434, patronising artists including Michelangelo and Leonardo. The city's golden age produced the Italian Renaissance, which transformed European art, architecture, philosophy and science. Florence became capital of unified Italy briefly (1865–71) before Rome took over.`,

    practical: [
      { icon: '🎫', tip: 'Book the Uffizi and Accademia (David) weeks in advance — queues without booking can be 3+ hours.' },
      { icon: '🚗', tip: 'Florence has one of Italy\'s most strictly enforced ZTL zones. Do not drive into the historic centre without a permit.' },
      { icon: '☀️', tip: 'Summer (June–August) is extremely hot and crowded. Spring and autumn are ideal. Many locals leave in August.' },
      { icon: '🚶', tip: 'The entire historic centre is walkable in 20–30 minutes. A bike is useful for crossing the river.' },
      { icon: '🏔️', tip: 'Climb to Piazzale Michelangelo or Fiesole for the classic panoramic view of Florence and the Duomo.' },
      { icon: '💡', tip: 'Many lesser-known museums are free or very cheap and have no queues — Museo di San Marco, Bargello, Museo dell\'Opera del Duomo.' },
    ],

    neighborhoods: [
      {
        name: 'Duomo & Centro',
        description: 'The cathedral, Baptistery and Giotto\'s Bell Tower dominate. Surrounded by tourist shops but the streets hide excellent restaurants.',
      },
      {
        name: 'Santa Croce',
        description: 'Home to the Basilica di Santa Croce (tombs of Michelangelo, Galileo, Machiavelli). Lively market square, good restaurants nearby.',
      },
      {
        name: 'San Lorenzo & San Marco',
        description: 'The Medici neighbourhood. Covered market, Michelangelo\'s Medici Chapels, the Accademia. Less polished, more authentic.',
      },
      {
        name: 'Oltrarno',
        description: 'South of the Arno. The Pitti Palace, Boboli Gardens, craft workshops, excellent restaurants. More local and residential than the north bank.',
      },
      {
        name: 'Santo Spirito',
        description: 'The coolest square in Florence. A working neighbourhood piazza with a morning market. Best aperitivo scene in the evening.',
      },
    ],

    museums: [
      {
        name: 'Uffizi Gallery',
        description: 'One of the world\'s great art museums. Botticelli\'s Birth of Venus and Primavera, Michelangelo\'s Holy Family, Leonardo\'s Annunciation, Caravaggio, Raphael, Titian. Could spend days here.',
        tip: 'Book first-entry tickets (8:15am) — crowd builds rapidly. Allow at least 3 hours.',
      },
      {
        name: 'Accademia Gallery',
        description: 'Home to Michelangelo\'s original David (1501–04), 5.17 metres of perfection carved from a single marble block. Also houses his unfinished "Prisoners" sculptures.',
        tip: 'Queues are notorious without booking. Book online — it takes 15 minutes inside.',
      },
      {
        name: 'Bargello',
        description: 'Florence\'s sculpture museum. Donatello\'s original bronze David, Michelangelo\'s early works, Verrocchio. Vastly undervisited — rarely crowded.',
        tip: 'Go here before the Accademia to understand the sculptural tradition Michelangelo was working in.',
      },
      {
        name: 'Museo dell\'Opera del Duomo',
        description: 'Holds the original sculptural programme from the Duomo and Baptistery, including Ghiberti\'s original Gates of Paradise (the Baptistery doors show copies). Michelangelo\'s late Pietà is here.',
        tip: 'Included in the Duomo complex ticket. Often overlooked — one of Florence\'s best museums.',
      },
      {
        name: 'Pitti Palace & Boboli Gardens',
        description: 'Vast Medici palace housing several museums. The Palatine Gallery has outstanding Renaissance paintings in original palatial rooms. Boboli Gardens are formal Italian gardens behind the palace.',
        tip: 'Go late afternoon — Boboli at sunset is spectacular and less crowded.',
      },
      {
        name: 'Museo di San Marco',
        description: 'A Dominican convent where Fra Angelico\'s frescoes decorate each monk\'s cell. One of the most peaceful and moving museum experiences in Italy.',
        tip: 'Rarely crowded. Budget 1–1.5 hours. The Annunciation at the top of the stairs is extraordinary.',
      },
    ],

    churches: [
      { name: 'Florence Cathedral (Duomo) & Brunelleschi\'s Dome', description: 'The dome (1436) was the greatest engineering feat of the Renaissance. Climb the 463 steps inside the dome to see Vasari\'s frescoes up close and for views over the city. Book ahead.' },
      { name: 'Baptistery of San Giovanni', description: 'One of Florence\'s oldest buildings. Ghiberti\'s bronze doors (the "Gates of Paradise") on the east side took 27 years to complete. The interior mosaics are stunning.' },
      { name: 'Basilica di Santa Croce', description: 'Gothic church and the largest Franciscan church in the world. Tomb of Michelangelo, Galileo, Machiavelli, Ghiberti. Giotto frescoes in the Bardi and Peruzzi chapels.' },
      { name: 'San Miniato al Monte', description: 'Romanesque church above the city (walk up from Piazzale Michelangelo). Stunning Florentine marble facade, peaceful atmosphere, Gregorian chant at vespers.' },
    ],

    food: [
      { name: 'Bistecca alla Fiorentina', description: 'Massive T-bone steak from Chianina cattle, grilled rare, served by weight. The signature dish of Florence. Minimum 1kg, typically 2–3 portions.' },
      { name: 'Lampredotto', description: 'Florence\'s street food — a sandwich of slow-cooked tripe in tomato sauce. Try at the Mercato Centrale or from street carts. Authentic and cheap.' },
      { name: 'Ribollita', description: 'Hearty Tuscan bread and vegetable soup — the quintessential peasant dish. Best in winter. Look for it in any traditional trattoria.' },
      { name: 'Schiacciata', description: 'Tuscan flatbread drizzled with olive oil and salt. Eaten as a snack, sandwich base, or as schiacciata con l\'uva (with grapes) in autumn.' },
      { name: 'Cantucci e Vin Santo', description: 'Almond biscuits dipped in sweet dessert wine. The classic Tuscan dessert combination.' },
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // TUSCANY
  // ────────────────────────────────────────────────────────────────────────────
  {
    id: 'tuscany',
    name: 'Tuscany',
    region: 'Central Italy',
    emoji: '🌻',
    tagline: 'Rolling Hills & Medieval Towns',
    overview: `Tuscany (Toscana) is the landscape most people picture when they imagine Italy — rolling green hills dotted with cypress trees, medieval hilltop towns, sunflower fields and world-class wine. Beyond Florence, the region offers Siena (Florence\'s great rival), the towers of San Gimignano, the thermal springs of Saturnia, and the Chianti wine country.\n\nMost Tuscan towns are best reached by car — public transport connects the major centres but misses the countryside villages. Consider renting a car for at least part of the trip.`,

    history: `Tuscany was the heartland of the Etruscan civilisation before Roman conquest. In the medieval period it fragmented into rival city-states — Florence, Siena, Pisa, Lucca — each with its own dialect, art tradition and architecture. The competition between these cities drove extraordinary artistic innovation. The Medici eventually unified most of Tuscany under Florentine control by the 16th century. The region joined unified Italy in 1860.`,

    practical: [
      { icon: '🚗', tip: 'A rental car is essential for exploring the countryside and smaller towns. Book in advance, especially in summer.' },
      { icon: '🍷', tip: 'Chianti Classico, Brunello di Montalcino and Vino Nobile di Montepulciano are the prestige wines. Many estates offer tastings — book ahead.' },
      { icon: '☀️', tip: 'Peak season is June–September. Shoulder season (April–May, October) has better weather and fewer crowds.' },
      { icon: '🏨', tip: 'Stay in an agriturismo (working farm with rooms) for an authentic experience. Many include meals using their own produce.' },
      { icon: '🗓️', tip: 'Siena\'s Palio (horse race) runs twice yearly: 2 July and 16 August. Book accommodation a year ahead if attending.' },
      { icon: '💡', tip: 'Most hill towns have ZTL restrictions. Park outside the walls and walk in — distances are short.' },
    ],

    neighborhoods: [
      {
        name: 'Siena',
        description: 'Florence\'s great medieval rival. The Piazza del Campo (shell-shaped medieval square) is one of Italy\'s greatest public spaces. The Duomo is extraordinarily ornate. Completely walkable. Allow a full day.',
      },
      {
        name: 'San Gimignano',
        description: 'The "medieval Manhattan" — 14 towers survive from the original 72 built by competing noble families. Touristy but genuinely impressive. Visit early morning or evening to avoid crowds.',
      },
      {
        name: 'Chianti Classico',
        description: 'The wine country between Florence and Siena. Classic road trip through vineyards, olive groves and small hilltop villages. Key villages: Greve in Chianti, Castellina, Radda.',
      },
      {
        name: 'Val d\'Orcia',
        description: 'UNESCO-listed landscape of rolling clay hills, cypress-lined roads and medieval towns. Pienza (ideal Renaissance town), Montepulciano, Montalcino. Quintessential Tuscany.',
      },
      {
        name: 'Lucca',
        description: 'Perfectly preserved Renaissance walls surround a lively city centre. You can walk or cycle the entire 4km circuit of walls. Less touristy than Siena or San Gimignano.',
      },
      {
        name: 'Cortona',
        description: 'Steep hilltop town with Etruscan and medieval layers. MAEC museum has excellent Etruscan collection. Featured in "Under the Tuscan Sun". Great views over the Val di Chiana.',
      },
    ],

    museums: [
      {
        name: 'Siena Cathedral (Duomo) & Museum',
        description: 'One of Italy\'s most ornate Gothic cathedrals. The floor is inlaid with 56 marble panels depicting biblical scenes (uncovered August–October). The Libreria Piccolomini inside has brilliant Pinturicchio frescoes.',
        tip: 'The OPA SI combined ticket gives access to cathedral, baptistery, crypt and rooftop — worth it.',
      },
      {
        name: 'Palazzo Pubblico & Torre del Mangia (Siena)',
        description: 'The Gothic civic palace on the Piazza del Campo. Houses Ambrogio Lorenzetti\'s "Allegory of Good and Bad Government" (1338–39), one of the most important secular fresco cycles of the Middle Ages.',
        tip: 'Climb the Torre del Mangia (503 steps) for extraordinary views over the campo and surrounding countryside.',
      },
      {
        name: 'Museo Civico & Pinacoteca (Siena)',
        description: 'Siena\'s art museum holds major works of the Sienese school — Duccio, Simone Martini, the Lorenzetti brothers. The Sienese style is distinct from Florentine: more Byzantine influence, gold backgrounds, elegant line.',
        tip: 'Often overlooked in favour of Florence\'s museums but essential context for understanding medieval Italian art.',
      },
      {
        name: 'MAEC (Cortona)',
        description: 'Museo dell\'Accademia Etrusca. One of Italy\'s best Etruscan collections. The large Etruscan bronze chandelier (5th century BC) is the museum\'s centrepiece.',
        tip: 'Cortona is often skipped — the museum alone justifies a visit.',
      },
    ],

    churches: [
      { name: 'Siena Duomo', description: 'Black and white striped marble exterior, extraordinary interior. The Pisano pulpit rivals Pisa\'s as the finest Gothic pulpit in Italy.' },
      { name: 'Collegiata di San Gimignano', description: 'The main church of San Gimignano is covered floor to ceiling in frescoes by Ghirlandaio and Barna da Siena — an extraordinary painted Bible for an illiterate medieval congregation.' },
      { name: 'Sant\'Antimo (near Montalcino)', description: 'A perfectly preserved 12th-century Romanesque abbey in a remote valley. Monks still sing Gregorian chant at services. One of the most serene places in Tuscany.' },
      { name: 'Pienza Cathedral', description: 'Pope Pius II\'s ideal Renaissance town includes this cathedral, built 1459–62. Unusual luminous interior designed to let in maximum light — deliberately different from dark Gothic churches.' },
    ],

    food: [
      { name: 'Pici', description: 'Thick hand-rolled spaghetti, a Sienese speciality. Traditionally served with wild boar ragù (cinghiale) or simple garlic and breadcrumb sauce (all\'aglione).' },
      { name: 'Pecorino di Pienza', description: 'Sheep\'s milk cheese from the Val d\'Orcia. Aged versions are intensely flavoured. Buy direct from producers in Pienza\'s main street shops.' },
      { name: 'Lardo di Colonnata', description: 'Cured fatback aged in marble basins in the Apuan Alps town of Colonnata. Served paper-thin on bread. Extraordinary — nothing like regular lard.' },
      { name: 'Panforte', description: 'Dense, spiced Sienese cake with nuts, dried fruit and spices. A medieval recipe unchanged for centuries. Available year-round in Siena.' },
      { name: 'Brunello di Montalcino', description: 'Italy\'s most prestigious red wine, made from Sangiovese Grosso. Aged a minimum 5 years. Expensive but extraordinary. Visit the town\'s Fortezza for tastings.' },
      { name: 'Cinghiale (Wild Boar)', description: 'Tuscany is wild boar country. Appears as ragù on pasta, salumi, in stews. Every trattoria in the region will have at least one cinghiale dish.' },
    ],
  },
];

export default DESTINATIONS;

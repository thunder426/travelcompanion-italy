const PHRASES = [
  // ── Greetings ──────────────────────────────────────────────────────────────
  {
    category: 'Greetings',
    icon: '👋',
    items: [
      { en: 'Hello',                    it: 'Ciao',                       zh: '你好' },
      { en: 'Good morning',             it: 'Buongiorno',                 zh: '早上好' },
      { en: 'Good evening',             it: 'Buonasera',                  zh: '晚上好' },
      { en: 'Goodbye',                  it: 'Arrivederci',                zh: '再见' },
      { en: 'Please',                   it: 'Per favore',                 zh: '请' },
      { en: 'Thank you',                it: 'Grazie',                     zh: '谢谢' },
      { en: 'Thank you very much',      it: 'Grazie mille',               zh: '非常感谢' },
      { en: 'You\'re welcome',          it: 'Prego',                      zh: '不客气' },
      { en: 'Sorry / Excuse me',        it: 'Scusi',                      zh: '对不起' },
      { en: 'Yes',                      it: 'Sì',                         zh: '是' },
      { en: 'No',                       it: 'No',                         zh: '不' },
      { en: 'Do you speak English?',    it: 'Parla inglese?',             zh: '你会说英语吗？' },
      { en: 'I don\'t understand',      it: 'Non capisco',                zh: '我不明白' },
      { en: 'Can you repeat that?',     it: 'Può ripetere?',              zh: '能再说一遍吗？' },
      { en: 'My name is…',             it: 'Mi chiamo…',                 zh: '我叫…' },
    ],
  },

  // ── Restaurant ─────────────────────────────────────────────────────────────
  {
    category: 'Restaurant',
    icon: '🍽️',
    items: [
      { en: 'A table for two, please',          it: 'Un tavolo per due, per favore',      zh: '请给我们两位的桌子' },
      { en: 'The menu, please',                 it: 'Il menù, per favore',                zh: '请给我菜单' },
      { en: 'What do you recommend?',           it: 'Cosa consiglia?',                    zh: '你推荐什么？' },
      { en: 'I\'ll have this',                  it: 'Prendo questo',                      zh: '我要这个' },
      { en: 'Without meat',                     it: 'Senza carne',                        zh: '不要肉' },
      { en: 'I\'m allergic to…',               it: 'Sono allergico a…',                  zh: '我对…过敏' },
      { en: 'Gluten free',                      it: 'Senza glutine',                      zh: '无麸质' },
      { en: 'Water, please',                    it: 'Acqua, per favore',                  zh: '请来水' },
      { en: 'Still water',                      it: 'Acqua naturale',                     zh: '不含气泡的水' },
      { en: 'Sparkling water',                  it: 'Acqua frizzante',                    zh: '气泡水' },
      { en: 'A glass of red wine',              it: 'Un bicchiere di vino rosso',         zh: '一杯红葡萄酒' },
      { en: 'The bill, please',                 it: 'Il conto, per favore',               zh: '请结账' },
      { en: 'Is service included?',             it: 'Il servizio è incluso?',             zh: '服务费包含在内吗？' },
      { en: 'It was delicious',                 it: 'Era delizioso',                      zh: '非常美味' },
      { en: 'Can I pay by card?',               it: 'Posso pagare con carta?',            zh: '可以刷卡吗？' },
    ],
  },

  // ── Transport ──────────────────────────────────────────────────────────────
  {
    category: 'Transport',
    icon: '🚆',
    items: [
      { en: 'Where is the train station?',      it: 'Dov\'è la stazione?',               zh: '火车站在哪里？' },
      { en: 'A ticket to Florence, please',     it: 'Un biglietto per Firenze, per favore', zh: '请给我一张去佛罗伦萨的票' },
      { en: 'Which platform?',                  it: 'Quale binario?',                    zh: '哪个站台？' },
      { en: 'Is this seat taken?',              it: 'È occupato questo posto?',           zh: '这个座位有人吗？' },
      { en: 'Where is the bus stop?',           it: 'Dov\'è la fermata dell\'autobus?',  zh: '公交站在哪里？' },
      { en: 'Take me to this address',          it: 'Mi porti a questo indirizzo',        zh: '请带我去这个地址' },
      { en: 'How much to the centre?',          it: 'Quanto costa fino al centro?',       zh: '到市中心多少钱？' },
      { en: 'Please validate your ticket',      it: 'Convalidare il biglietto',           zh: '请验票（必须打票）' },
      { en: 'Airport',                          it: 'Aeroporto',                          zh: '机场' },
      { en: 'Taxi',                             it: 'Taxi',                               zh: '出租车' },
      { en: 'Subway / Metro',                   it: 'Metropolitana',                      zh: '地铁' },
    ],
  },

  // ── Shopping ───────────────────────────────────────────────────────────────
  {
    category: 'Shopping',
    icon: '🛍️',
    items: [
      { en: 'How much is this?',                it: 'Quanto costa?',                      zh: '这个多少钱？' },
      { en: 'Do you have a smaller size?',      it: 'Ha una taglia più piccola?',         zh: '有小一号的吗？' },
      { en: 'Do you have a larger size?',       it: 'Ha una taglia più grande?',          zh: '有大一号的吗？' },
      { en: 'Can I try this on?',               it: 'Posso provarlo?',                    zh: '我可以试穿吗？' },
      { en: 'I\'m just looking',                it: 'Sto solo guardando',                 zh: '我只是随便看看' },
      { en: 'Do you accept credit cards?',      it: 'Accettate carte di credito?',        zh: '接受信用卡吗？' },
      { en: 'Can I get a receipt?',             it: 'Posso avere la ricevuta?',           zh: '可以给我收据吗？' },
      { en: 'Do you have this in another colour?', it: 'Ce l\'ha in un altro colore?',   zh: '有其他颜色吗？' },
    ],
  },

  // ── Hotel ──────────────────────────────────────────────────────────────────
  {
    category: 'Hotel',
    icon: '🏨',
    items: [
      { en: 'I have a reservation',             it: 'Ho una prenotazione',                zh: '我有预订' },
      { en: 'Check in',                         it: 'Check-in',                           zh: '入住' },
      { en: 'Check out',                        it: 'Check-out',                          zh: '退房' },
      { en: 'My room key, please',              it: 'La chiave della mia stanza, per favore', zh: '请给我房间钥匙' },
      { en: 'The WiFi password, please',        it: 'La password del WiFi, per favore',   zh: '请告诉我WiFi密码' },
      { en: 'Do you have a luggage room?',      it: 'C\'è un deposito bagagli?',          zh: '有行李寄存处吗？' },
      { en: 'My room is not clean',             it: 'La mia stanza non è pulita',         zh: '我的房间不干净' },
      { en: 'Wake-up call at 7am please',       it: 'Sveglia alle 7, per favore',         zh: '请在早上7点叫醒我' },
    ],
  },

  // ── Emergency ──────────────────────────────────────────────────────────────
  {
    category: 'Emergency',
    icon: '🚨',
    items: [
      { en: 'Help!',                            it: 'Aiuto!',                             zh: '救命！' },
      { en: 'Call the police',                  it: 'Chiami la polizia',                  zh: '请叫警察' },
      { en: 'Call an ambulance',                it: 'Chiami un\'ambulanza',               zh: '请叫救护车' },
      { en: 'I need a doctor',                  it: 'Ho bisogno di un medico',            zh: '我需要看医生' },
      { en: 'I\'ve been robbed',               it: 'Mi hanno derubato',                  zh: '我被抢劫了' },
      { en: 'I\'ve lost my passport',          it: 'Ho perso il passaporto',             zh: '我丢失了护照' },
      { en: 'Where is the hospital?',           it: 'Dov\'è l\'ospedale?',               zh: '医院在哪里？' },
      { en: 'I\'m having an allergic reaction', it: 'Ho una reazione allergica',         zh: '我有过敏反应' },
      { en: 'Police: 113',                      it: 'Polizia: 113',                       zh: '警察：113' },
      { en: 'Ambulance: 118',                   it: 'Ambulanza: 118',                     zh: '救护车：118' },
      { en: 'Fire brigade: 115',               it: 'Vigili del fuoco: 115',              zh: '消防队：115' },
      { en: 'General emergency: 112',           it: 'Emergenza generale: 112',            zh: '紧急救援：112' },
    ],
  },

  // ── Numbers ────────────────────────────────────────────────────────────────
  {
    category: 'Numbers',
    icon: '🔢',
    items: [
      { en: 'Zero',     it: 'Zero',     zh: '零' },
      { en: 'One',      it: 'Uno',      zh: '一' },
      { en: 'Two',      it: 'Due',      zh: '二' },
      { en: 'Three',    it: 'Tre',      zh: '三' },
      { en: 'Four',     it: 'Quattro',  zh: '四' },
      { en: 'Five',     it: 'Cinque',   zh: '五' },
      { en: 'Six',      it: 'Sei',      zh: '六' },
      { en: 'Seven',    it: 'Sette',    zh: '七' },
      { en: 'Eight',    it: 'Otto',     zh: '八' },
      { en: 'Nine',     it: 'Nove',     zh: '九' },
      { en: 'Ten',      it: 'Dieci',    zh: '十' },
      { en: 'Twenty',   it: 'Venti',    zh: '二十' },
      { en: 'Fifty',    it: 'Cinquanta',zh: '五十' },
      { en: 'Hundred',  it: 'Cento',    zh: '一百' },
    ],
  },
];

export default PHRASES;

/**
 * ZTL (Zona a Traffico Limitato) zone boundaries for major Italian cities.
 * Coordinates are approximate polygons around the historic centres.
 * Always verify current zone boundaries and hours before your trip via official city sources.
 */
const ZTL_ZONES = [
  {
    id: 'florence-centro',
    city: 'Florence',
    name: 'Florence Centro Storico',
    hours: 'Mon–Fri 7:30–20:00, Sat 7:30–16:00',
    boundary: [
      { latitude: 43.7750, longitude: 11.2490 },
      { latitude: 43.7780, longitude: 11.2560 },
      { latitude: 43.7730, longitude: 11.2620 },
      { latitude: 43.7680, longitude: 11.2600 },
      { latitude: 43.7660, longitude: 11.2530 },
      { latitude: 43.7680, longitude: 11.2460 },
      { latitude: 43.7720, longitude: 11.2430 },
      { latitude: 43.7750, longitude: 11.2490 },
    ],
  },
  {
    id: 'rome-centro',
    city: 'Rome',
    name: 'Rome ZTL Centro Storico',
    hours: 'Mon–Fri 6:30–18:00, Sat 14:00–18:00',
    boundary: [
      { latitude: 41.9050, longitude: 12.4710 },
      { latitude: 41.9090, longitude: 12.4790 },
      { latitude: 41.9020, longitude: 12.4850 },
      { latitude: 41.8970, longitude: 12.4830 },
      { latitude: 41.8950, longitude: 12.4750 },
      { latitude: 41.8980, longitude: 12.4680 },
      { latitude: 41.9020, longitude: 12.4660 },
      { latitude: 41.9050, longitude: 12.4710 },
    ],
  },
  {
    id: 'siena-centro',
    city: 'Siena',
    name: 'Siena Centro Storico',
    hours: 'Daily 7:30–19:00',
    boundary: [
      { latitude: 43.3200, longitude: 11.3280 },
      { latitude: 43.3230, longitude: 11.3330 },
      { latitude: 43.3200, longitude: 11.3380 },
      { latitude: 43.3160, longitude: 11.3370 },
      { latitude: 43.3140, longitude: 11.3320 },
      { latitude: 43.3160, longitude: 11.3270 },
      { latitude: 43.3190, longitude: 11.3250 },
      { latitude: 43.3200, longitude: 11.3280 },
    ],
  },
  {
    id: 'venice-no-cars',
    city: 'Venice',
    name: 'Venice — No Motor Vehicles',
    hours: 'All times (pedestrian city)',
    boundary: [
      { latitude: 45.4420, longitude: 12.3150 },
      { latitude: 45.4500, longitude: 12.3400 },
      { latitude: 45.4430, longitude: 12.3600 },
      { latitude: 45.4300, longitude: 12.3570 },
      { latitude: 45.4250, longitude: 12.3350 },
      { latitude: 45.4310, longitude: 12.3150 },
      { latitude: 45.4420, longitude: 12.3150 },
    ],
  },
];

export default ZTL_ZONES;

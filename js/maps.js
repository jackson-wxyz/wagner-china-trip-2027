/* Interactive maps for the China trip site.
   MapLibre GL + OpenFreeMap vector tiles (free, no API key). Labels are forced to
   English (name:en -> name_en -> name:latin -> name), since the default OSM labels
   in China are in Chinese characters. Maps initialise lazily as they scroll into view.

   Link prefixes: W = Wikipedia, TCG = Travel China Guide, LP = Lonely Planet. */

const W = 'https://en.wikipedia.org/wiki/';
const TCG = 'https://www.travelchinaguide.com';
const LP = 'https://www.lonelyplanet.com/points-of-interest/';

// kind: main = headline sight, food = neighborhood / food street, opt = optional / split-day pick,
//       go = station / airport / transfer
const SIGHTS = {
  beijing: {
    core: [[116.26, 39.87], [116.49, 40.01]],
    wide: [[116.24, 39.84], [117.30, 40.72]],
    wideLabel: 'Incl. Great Wall',
    pts: [
      ['Forbidden City', 116.3908, 39.9158, 'main', 'Day 2', 'The emperors\' palace: 980 buildings, 600 years of history.', W + 'Forbidden_City', TCG + '/cityguides/beijing/forbidden.htm', LP + 'forbidden-city/368617'],
      ['Tiananmen Square', 116.3917, 39.9033, 'main', 'Day 2', 'The vast square at the palace\'s front gate.', W + 'Tiananmen_Square', TCG + '/attraction/beijing/tianan.htm', LP + 'tiananmen-square/368619'],
      ['Jingshan Park', 116.3906, 39.9236, 'main', 'Day 2', 'The hill with the postcard view over the golden roofs.', W + 'Jingshan_Park', TCG + '/attraction/beijing/jingshan.htm', LP + 'jingshan-park/368827'],
      ['Great Wall at Mutianyu', 116.5619, 40.4380, 'main', 'Day 3', '~90 min by van. Gondola up, towers along the ridgeline.', W + 'Mutianyu', TCG + '/china_great_wall/scene/beijing/mutianyu.htm', LP + 'mutianyu/1106306'],
      ['Chaoyang Theatre (acrobatics)', 116.4554, 39.9213, 'opt', 'Day 3 eve', 'Optional evening acrobatics show.', null, TCG + '/acrobatic-shows-in-beijing.htm', null],
      ['Temple of Heaven', 116.4066, 39.8822, 'main', 'Day 4', '7am tai chi in the park, then the great round altar.', W + 'Temple_of_Heaven', TCG + '/attraction/beijing/heaven/', LP + 'temple-of-heaven-park/1106060'],
      ['Summer Palace', 116.2689, 39.9975, 'main', 'Day 4', 'The emperors\' lake retreat; boat across Kunming Lake.', W + 'Summer_Palace', TCG + '/cityguides/beijing/summer.htm', LP + 'summer-palace/1106248'],
      ['Beihai Park', 116.3831, 39.9244, 'opt', 'Day 5', 'Imperial garden lake with pedal boats and the White Dagoba.', W + 'Beihai_Park', TCG + '/attraction/beijing/beihai.htm', LP + 'beihai-park/368787'],
      ['Hutongs (Shichahai / Nanluoguxiang)', 116.3920, 39.9390, 'food', 'Days 1 & 5', 'Old lane neighborhoods; dusk food tour.', W + 'Hutong', TCG + '/cityguides/beijing/hutong/', null],
      ['798 Art District', 116.4879, 39.9891, 'opt', 'Day 5', 'Galleries in a Bauhaus-era factory complex.', W + '798_Art_Zone', TCG + '/attraction/beijing/798-art-zone.htm', LP + '798-art-district/1106265'],
      ['Military Museum', 116.3177, 39.9077, 'opt', 'Day 5', 'Tanks, jets and missiles in a Soviet-style palace.', W + "Military_Museum_of_the_Chinese_People's_Revolution", TCG + '/attraction/beijing/military-museum.htm', LP + 'military-museum-of-the-peoples-revolution/368835'],
      ['China Science & Technology Museum', 116.3922, 40.0047, 'opt', 'Day 5', 'Huge hands-on science museum by the Olympic Park.', W + 'China_Science_and_Technology_Museum', TCG + '/attraction/beijing/science-technology-museum.htm', null],
      ['Jinshanling Great Wall', 117.2444, 40.6764, 'opt', 'Day 3 alt', '~2½ hrs out. Quieter, partly wild wall for a real tower-to-tower hike.', W + 'Jinshanling', null, null],
      ['Panjiayuan Market', 116.4605, 39.8726, 'opt', 'Day 5', 'Antiques, curios and Cultural Revolution kitsch; best on weekend mornings.', W + 'Panjiayuan', null, null],
      ['Sanlitun', 116.4489, 39.9361, 'food', 'Day 5 eve', 'Bars, restaurants and futuristic shopping for night owls.', W + 'Sanlitun', null, null],
      ['Beijing West Station', 116.3221, 39.8949, 'go', 'Day 6', 'Bullet train to Xi\'an.', null, null, null],
    ],
  },
  xian: {
    core: [[108.90, 34.20], [109.00, 34.29]],
    wide: [[108.88, 34.18], [110.15, 34.53]],
    wideLabel: 'Incl. Terracotta Army & Huashan',
    pts: [
      ['Muslim Quarter', 108.9385, 34.2645, 'food', 'Day 6 eve', 'The Hui food streets behind the Drum Tower.', W + "Xi'an_Muslim_Quarter", TCG + '/attraction/shaanxi/xian/moslem-street.htm', LP + 'muslim-quarter/1238961'],
      ['Bell Tower', 108.9420, 34.2610, 'main', 'Day 6 eve', 'Ming-era tower at the center of the walled city, lit at night.', W + "Bell_Tower_of_Xi'an", TCG + '/attraction/shaanxi/xian/bell.htm', LP + 'bell-tower/475734'],
      ['Terracotta Army', 109.2731, 34.3850, 'main', 'Day 7', '~1 hr east. 8,000 clay soldiers guarding China\'s first emperor.', W + 'Terracotta_Army', TCG + '/attraction/shaanxi/xian/terra_cotta_army/', LP + 'army-of-terracotta-warriors/1016918'],
      ['Huaqing Palace', 109.2072, 34.3650, 'main', 'Day 7', 'Tang-dynasty hot-spring gardens on the way back.', W + 'Huaqing_Palace', TCG + '/attraction/shaanxi/xian/huaqing.htm', LP + 'huaqing-hot-springs/1239689'],
      ['City Wall (South Gate)', 108.9426, 34.2510, 'main', 'Day 8', 'Bike the 8.5-mile loop on top of the Ming walls.', W + "Fortifications_of_Xi'an", TCG + '/attraction/shaanxi/xian/citywall.htm', LP + 'xian-city-wall/475738'],
      ['Shaanxi History Museum', 108.9514, 34.2253, 'main', 'Day 8', 'Tang gold and bronzes; one of China\'s great museums.', W + 'Shaanxi_History_Museum', TCG + '/attraction/shaanxi/xian/provincial_museum/', null],
      ['Big Wild Goose Pagoda', 108.9594, 34.2198, 'main', 'Day 8', '7th-century pagoda; fountain show in the square at dusk.', W + 'Giant_Wild_Goose_Pagoda', TCG + '/attraction/shaanxi/xian/bigwildgoose.htm', LP + 'big-goose-pagoda/475736'],
      ['Tang Paradise', 108.9691, 34.2149, 'opt', 'Day 9', 'Reconstructed Tang imperial gardens.', W + 'Tang_Paradise', TCG + '/attraction/shaanxi/xian/tang-paradise.htm', null],
      ['Mount Hua (Huashan)', 110.0833, 34.4833, 'opt', 'Day 9', '30 min by bullet train. Granite peaks, cliff paths, cable cars.', W + 'Mount_Hua', TCG + '/attraction/shaanxi/xian/mt_huashan.htm', null],
      ['Xi\'an North Station', 108.9341, 34.3776, 'go', 'Days 6 & 10', 'Bullet trains in from Beijing, out to Nanjing.', null, null, null],
    ],
  },
  nanjing: {
    core: [[118.73, 31.96], [118.87, 32.08]],
    wide: null,
    pts: [
      ['Presidential Palace', 118.7922, 32.0453, 'main', 'Day 10', 'Seat of the Republic of China; Chiang Kai-shek\'s office.', W + 'Presidential_Palace,_Nanjing', TCG + '/attraction/jiangsu/nanjing/presidential-palace.htm', LP + 'presidential-palace/434490'],
      ['Laomendong & Confucius Temple', 118.7845, 32.0185, 'food', 'Day 10 eve', 'Lantern-lit old lanes along the Qinhuai River.', W + 'Nanjing_Fuzimiao', null, null],
      ['Sun Yat-sen Mausoleum', 118.8483, 32.0643, 'main', 'Day 11', '392 steps up Purple Mountain to the founder of modern China.', W + 'Sun_Yat-sen_Mausoleum', TCG + '/attraction/jiangsu/nanjing/sun.htm', LP + 'sun-yat-sen-mausoleum/434492'],
      ['Ming Xiaoling Mausoleum', 118.8396, 32.0583, 'main', 'Day 11', 'The first Ming emperor\'s tomb and its stone-animal avenue.', W + 'Ming_Xiaoling_Mausoleum', TCG + '/attraction/jiangsu/nanjing/ming_xiaoling.htm', LP + 'ming-xiaoling-scenic-area/1454740'],
      ['Nanjing Massacre Memorial', 118.7435, 32.0355, 'opt', 'Day 11', 'Optional, adults: moving and heavy.', W + 'Nanjing_Massacre_Memorial_Hall', TCG + '/attraction/jiangsu/nanjing/memorial-hall-nanjing-massacre.htm', LP + 'memorial-hall-of-the-nanjing-massacre/434478'],
      ['Zhonghua Gate (city wall)', 118.7765, 32.0147, 'opt', 'Any time', 'The biggest gate of the world\'s longest surviving city wall.', W + 'Nanjing_city_wall', TCG + '/attraction/jiangsu/nanjing/city-wall.htm', null],
      ['Nanjing South Station', 118.7985, 31.9688, 'go', 'Days 10 & 12', 'Trains in from Xi\'an, out to Suzhou.', null, null, null],
    ],
  },
  suzhou: {
    core: [[120.595, 31.295], [120.645, 31.340]],
    wide: null,
    pts: [
      ['Suzhou Museum', 120.6235, 31.3252, 'main', 'Day 12', 'I. M. Pei\'s jewel-box museum.', W + 'Suzhou_Museum', TCG + '/attraction/jiangsu/suzhou/museum.htm', LP + 'suzhou-museum/473304'],
      ['Pingjiang Road', 120.6316, 31.3135, 'food', 'Day 12', '800-year-old canal street of teahouses and snack shops.', W + 'Pingjiang_Road', TCG + '/attraction/jiangsu/suzhou/pingjiang-road.htm', null],
      ['Master of the Nets Garden', 120.6299, 31.3003, 'main', 'Day 12 eve', 'Night garden with kunqu opera and guqin music.', W + 'Master_of_the_Nets_Garden', TCG + '/attraction/jiangsu/suzhou/wangshi_garden.htm', LP + 'master-of-the-nets-garden/473284'],
      ['Humble Administrator\'s Garden', 120.6256, 31.3267, 'main', 'Day 13', 'China\'s most celebrated classical garden, at opening.', W + "Humble_Administrator's_Garden", TCG + '/attraction/jiangsu/suzhou/humble_garden.htm', LP + 'humble-administrators-garden/473288'],
      ['Tiger Hill', 120.5735, 31.3366, 'opt', 'If time', 'Leaning pagoda over a legendary king\'s tomb.', W + 'Tiger_Hill,_Suzhou', TCG + '/attraction/jiangsu/suzhou/tiger_hill.htm', LP + 'tiger-hill/473310'],
      ['Suzhou Station', 120.6110, 31.3300, 'go', 'Days 12 & 13', 'Trains in from Nanjing, out to Shanghai (25 min).', null, null, null],
    ],
  },
  shanghai: {
    core: [[121.43, 31.19], [121.52, 31.25]],
    wide: [[121.30, 31.12], [121.82, 31.26]],
    wideLabel: 'Incl. airport & Disneyland',
    pts: [
      ['The Bund', 121.4861, 31.2380, 'main', 'Day 13 eve', 'Colonial waterfront facing the Pudong skyline.', W + 'The_Bund', TCG + '/attraction/shanghai/bund.htm', LP + 'the-bund/1414348'],
      ['Yu Garden', 121.4875, 31.2292, 'main', 'Day 14', 'Ming garden and old-town bazaar.', W + 'Yu_Garden', TCG + '/attraction/shanghai/yuyuan_garden.htm', LP + 'yuyuan-gardens-bazaar/369123'],
      ['Shanghai Museum', 121.4753, 31.2283, 'main', 'Day 14', 'Bronzes, ceramics and ink paintings.', W + 'Shanghai_Museum', TCG + '/attraction/shanghai/museum-people-square.htm', LP + 'shanghai-museum/369125'],
      ['Urban Planning Exhibition Center', 121.4705, 31.2334, 'opt', 'Day 14', 'A room-sized scale model of the whole city.', W + 'Shanghai_Urban_Planning_Exhibition_Center', TCG + '/attraction/shanghai/urban-planning-exhibtion-hall.htm', null],
      ['Shanghai Tower', 121.5010, 31.2355, 'main', 'Day 14', 'Sunset from the 118th-floor deck of the world\'s 3rd-tallest building.', W + 'Shanghai_Tower', TCG + '/attraction/shanghai/tower.htm', LP + 'shanghai-tower/1419097'],
      ['French Concession', 121.4400, 31.2080, 'food', 'Day 15', 'Plane-tree lanes, cafes and dumpling counters.', W + 'Shanghai_French_Concession', TCG + '/attraction/shanghai/former-french-concession.htm', null],
      ['Xintiandi', 121.4701, 31.2226, 'food', 'Day 15', 'Restored shikumen lane-houses.', W + 'Xintiandi', TCG + '/attraction/shanghai/xin-tian-di.htm', LP + 'xintiandi/369553'],
      ['Natural History Museum', 121.4583, 31.2369, 'opt', 'Day 15', 'Dinosaurs in a building shaped like a nautilus shell.', W + 'Shanghai_Natural_History_Museum', TCG + '/attraction/shanghai/natural-history-museum.htm', LP + 'shanghai-natural-history-museum/1536659'],
      ['Shanghai Disneyland', 121.6570, 31.1440, 'opt', 'Day 15', 'If we dare.', W + 'Shanghai_Disneyland', null, null],
      ['Maglev (Longyang Rd)', 121.5569, 31.2031, 'go', 'Day 16', '267 mph to the airport in 7 minutes.', W + 'Shanghai_maglev_train', TCG + '/cityguides/shanghai/getting-around.htm', null],
      ['Pudong Airport (PVG)', 121.8053, 31.1433, 'go', 'Day 16', 'Flights home.', null, null, null],
      ['Hongqiao Station', 121.3161, 31.1963, 'go', 'Day 13', 'Train in from Suzhou.', null, null, null],
    ],
  },
  chengdu: {
    core: [[104.00, 30.62], [104.16, 30.75]],
    wide: [[103.28, 29.47], [104.50, 31.06]],
    wideLabel: 'Day trips (Leshan, Emei, Dujiangyan…)',
    pts: [
      ['Wuhou Shrine', 104.0478, 30.6463, 'main', 'Day 16', 'Temple to the heroes of the Three Kingdoms.', null, TCG + '/attraction/sichuan/chengdu/wuhou_temple.htm', LP + 'wuhou-temple/472744'],
      ['Jinli Ancient Street', 104.0474, 30.6485, 'food', 'Day 16 eve', 'Lantern-lit snack street next to the Wuhou Shrine.', W + 'Jinli', TCG + '/attraction/sichuan/chengdu/jinli-street.htm', null],
      ['Giant Panda Base', 104.1419, 30.7386, 'main', 'Day 17', 'Be there at opening: pandas are busiest at breakfast.', W + 'Chengdu_Research_Base_of_Giant_Panda_Breeding', TCG + '/attraction/sichuan/chengdu/panda-breeding-and-research-center.htm', LP + 'giant-panda-breeding-research-base/472728'],
      ['Wenshu Monastery', 104.0790, 30.6813, 'main', 'Day 17', 'Working Buddhist monastery with a vegetarian canteen and teahouse.', W + 'Wenshu_Temple_(Chengdu)', TCG + '/attraction/sichuan/chengdu/wenshu_monastery.htm', LP + 'wenshu-monastery/472742'],
      ['Sichuan opera at Shufeng Yayun', 104.0410, 30.6612, 'main', 'Day 17 eve', 'Face-changing, fire-spitting, puppetry: a variety show of an opera.', W + 'Sichuan_opera', null, LP + 'culture-park/1240357'],
      ['Qingyang Palace', 104.0428, 30.6620, 'opt', 'Day 17', "Chengdu's oldest Taoist temple, next to the opera.", null, TCG + '/attraction/sichuan/chengdu/qingyang.htm', LP + 'qingyang-temple/472730'],
      ["People's Park & Heming Teahouse", 104.0549, 30.6595, 'main', 'Day 19', 'Bamboo chairs, jasmine tea, professional ear-cleaners.', W + "People's_Park_(Chengdu)", TCG + '/attraction/sichuan/chengdu/peoples-park.htm', LP + 'he-ming-teahouse/1240739'],
      ['Kuanzhai Xiangzi', 104.0560, 30.6639, 'food', 'Day 19', 'The restored Qing-era "Wide and Narrow Alleys".', null, TCG + '/attraction/sichuan/chengdu/wide-narrow-alley.htm', null],
      ['Taikoo Li & Daci Temple', 104.0806, 30.6557, 'food', 'Day 19', 'Open-air shopping district wrapped around a Tang-era temple.', W + 'Taikoo_Li_Chengdu', null, null],
      ['Jinsha Site Museum', 104.0126, 30.6812, 'opt', 'Day 20', 'Home of the 3,000-year-old golden Sun Bird disc (check reopening).', W + 'Jinsha_site', TCG + '/attraction/sichuan/chengdu/jinsha-site-museum.htm', LP + 'jinsha-site-museum/1240326'],
      ['Sanxingdui Museum', 104.2182, 31.0031, 'main', 'Day 20', '20 min by train + taxi. Bronze masks of a lost Bronze Age kingdom.', W + 'Sanxingdui_Museum', TCG + '/attraction/sichuan/chengdu/sanxingdui.htm', LP + 'sanxingdui-museum/1240890'],
      ['Dujiangyan', 103.6053, 31.0017, 'main', 'Day 21', '25 min by train. A 2,300-year-old irrigation system that still works.', W + 'Dujiangyan', TCG + '/attraction/sichuan/chengdu/dujiangyan.htm', LP + 'dujiangyan-irrigation-system/1240916'],
      ['Dujiangyan Panda Valley', 103.5900, 31.0500, 'opt', 'Day 21 swap', 'Hillside wild-release training center, far fewer crowds.', null, TCG + '/attraction/sichuan/chengdu/dujiangyan-panda-valley.htm', null],
      ['Mount Qingcheng', 103.5578, 30.9105, 'main', 'Day 21', 'Forested Taoist mountain, one of the birthplaces of Taoism.', W + 'Mount_Qingcheng', TCG + '/attraction/sichuan/chengdu/mt_qingcheng.htm', LP + 'mt-qingcheng/1240901'],
      ['Leshan Giant Buddha', 103.7733, 29.5447, 'main', 'Day 18', '35–50 min by bullet train. The largest stone Buddha in the world.', W + 'Leshan_Giant_Buddha', TCG + '/attraction/sichuan/leshan/buddha_statue.htm', LP + 'leshan-grand-buddha/1241166'],
      ['Mount Emei', 103.3325, 29.5197, 'opt', 'Day 18–19 option', 'Sacred Buddhist mountain; overnight for the Golden Summit sunrise.', W + 'Mount_Emei', TCG + '/attraction/sichuan/leshan/mt_emei.htm', null],
      ['Huanglongxi Ancient Town', 103.9707, 30.3178, 'opt', 'Spare day', '1,700-year-old riverside town, 1–1½ hrs south.', W + 'Huanglongxi', TCG + '/attraction/sichuan/chengdu/huanglongxi-ancient-town.htm', null],
      ['Chengdu East Station', 104.1418, 30.6296, 'go', 'Day 18 / Option B', "Trains to Leshan, and in from Xi'an.", null, null, null],
      ['Tianfu Airport (TFU)', 104.4450, 30.3197, 'go', 'Days 16 & 22', 'Flights in from Shanghai and home.', null, null, null],
    ],
  },
};

// Route map: cities + rail legs (waypoints follow the actual high-speed lines' major stops).
const ROUTE = {
  bounds: [[103.6, 29.1], [122.6, 40.9]],
  cities: [
    ['Beijing', 116.3975, 39.9067, 'main', 'Days 1–6', 'Forbidden City · Great Wall · Temple of Heaven', '#city-beijing', 'right'],
    ["Xi'an", 108.9422, 34.2611, 'main', 'Days 6–10', 'Terracotta Army · city walls · Muslim Quarter', '#city-xian', 'left'],
    ['Nanjing', 118.7789, 32.0608, 'main', 'Days 10–12', 'Sun Yat-sen Mausoleum · Presidential Palace', '#city-nanjing', 'left'],
    ['Suzhou', 120.6194, 31.3000, 'main', 'Days 12–13', 'Classical gardens · canals', '#city-suzhou', 'top'],
    ['Shanghai', 121.4692, 31.2325, 'main', 'Days 13–16', 'The Bund · Yu Garden · Shanghai Tower', '#city-shanghai', 'right'],
    ['Hangzhou', 120.1530, 30.2670, 'ext', 'Week 3 option', 'West Lake · tea country · Song dynasty', '#extensions', 'bottom'],
    ['Chengdu', 104.0633, 30.6600, 'ext2', 'Week 3 option', 'Pandas · Leshan Buddha · Sichuan opera', 'chengdu.html', 'right'],
  ],
  legs: [
    { kind: 'rail', label: 'HSR · 4½ h', at: [114.1, 37.0], coords: [[116.3221, 39.8949], [115.46, 38.87], [114.51, 38.0425], [114.49, 36.61], [113.684, 34.764], [112.4539, 34.6197], [108.9341, 34.3776]] },
    { kind: 'rail', label: 'HSR · 5 h', at: [115.6, 33.6], coords: [[108.9341, 34.3776], [112.4539, 34.6197], [113.684, 34.764], [114.345, 34.795], [115.65, 34.41], [117.187, 34.265], [117.389, 32.917], [118.7985, 31.9688]] },
    { kind: 'rail', label: '1 h', at: [119.75, 32.15], minZoom: 6.3, coords: [[118.7985, 31.9688], [119.424, 32.188], [119.974, 31.811], [120.057, 31.549], [120.611, 31.330]] },
    { kind: 'rail', label: '25 min', at: [121.0, 31.05], minZoom: 6.8, coords: [[120.611, 31.330], [121.3161, 31.1963]] },
    { kind: 'ext', label: 'HSR · 1 h', at: [120.95, 30.62], minZoom: 6.3, coords: [[121.3161, 31.1963], [120.75, 30.75], [120.2084, 30.2935]] },
    { kind: 'ext2rail', label: "or HSR from Xi'an · 3½ h", at: [106.2, 32.9], coords: [[108.9341, 34.3776], [107.02, 33.07], [105.84, 32.44], [104.68, 31.47], [104.139, 30.631]] },
    { kind: 'fly', label: '✈ 3½ h flight', at: [112.5, 29.9], coords: null, from: [121.8053, 31.1433], to: [104.44, 30.31] },
  ],
};

const COLORS = { main: '#C13B2A', food: '#C99A3C', opt: '#2E6E62', go: '#5A4F47', ext: '#2E6E62', ext2: '#9C7420', ext2rail: '#9C7420' };
const STYLE = 'https://tiles.openfreemap.org/styles/positron';
const EN = ['coalesce', ['get', 'name:en'], ['get', 'name_en'], ['get', 'name:latin'], ['get', 'name']];

function englishLabels(map) {
  for (const layer of map.getStyle().layers) {
    if (layer.type === 'symbol' && map.getLayoutProperty(layer.id, 'text-field') !== undefined) {
      const tf = JSON.stringify(map.getLayoutProperty(layer.id, 'text-field'));
      if (tf.includes('name')) map.setLayoutProperty(layer.id, 'text-field', EN);
    }
  }
}

function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

function popupHtml(p) {
  const [name, , , kind, when, blurb, wiki, tcg, lp] = p;
  const links = [];
  if (wiki) links.push(`<a href="${wiki}" target="_blank" rel="noopener">Wikipedia</a>`);
  if (tcg) links.push(`<a href="${tcg}" target="_blank" rel="noopener">Travel China Guide</a>`);
  if (lp) links.push(`<a href="${lp}" target="_blank" rel="noopener">Lonely Planet</a>`);
  return `<div class="pop"><span class="pop-when" style="color:${COLORS[kind]}">${esc(when)}</span>` +
    `<b>${esc(name)}</b><p>${esc(blurb)}</p>${links.length ? '<div class="pop-links">' + links.join(' · ') + '</div>' : ''}</div>`;
}

function pin(kind, label) {
  const el = document.createElement('div');
  el.className = 'pin pin-' + kind;
  el.style.setProperty('--c', COLORS[kind]);
  if (label) el.textContent = label;
  return el;
}

function baseMap(el, bounds) {
  const map = new maplibregl.Map({
    container: el, style: STYLE, bounds, fitBoundsOptions: { padding: 36 },
    cooperativeGestures: true, attributionControl: { compact: true },
    dragRotate: false, pitchWithRotate: false, touchPitch: false,
  });
  map.touchZoomRotate.disableRotation();
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
  map.on('style.load', () => englishLabels(map));
  // compact attribution starts expanded on wide maps; fold it to the (i) button
  map.on('load', () => el.querySelectorAll('.maplibregl-compact-show').forEach(a => a.classList.remove('maplibregl-compact-show')));
  return map;
}

function cityMap(el) {
  const city = SIGHTS[el.dataset.city];
  const map = baseMap(el, city.core);
  city.pts.forEach(p => {
    const day = (p[4].match(/\d+/) || ['•'])[0];
    new maplibregl.Marker({ element: pin(p[3], p[3] === 'go' ? '' : day) })
      .setLngLat([p[1], p[2]])
      .setPopup(new maplibregl.Popup({ offset: 14, maxWidth: '260px' }).setHTML(popupHtml(p)))
      .addTo(map);
  });
  const bar = el.parentElement.querySelector('.map-tabs');
  if (bar && city.wide) {
    bar.innerHTML = `<button class="on" data-b="core">City center</button><button data-b="wide">${esc(city.wideLabel)}</button>`;
    bar.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      bar.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
      map.fitBounds(city[b.dataset.b], { padding: 36, duration: 900 });
    });
  }
}

function arc(from, to, n = 48, bend = 0.18) {
  const [x0, y0] = from, [x1, y1] = to;
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, dx = x1 - x0, dy = y1 - y0;
  const cx = mx - dy * bend, cy = my + dx * bend;           // control point off to the side
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t;
    pts.push([a * x0 + b * cx + c * x1, a * y0 + b * cy + c * y1]);
  }
  return pts;
}

function routeMap(el) {
  const map = baseMap(el, ROUTE.bounds);
  map.on('load', () => {
    const feats = ROUTE.legs.map(l => ({
      type: 'Feature', properties: { kind: l.kind },
      geometry: { type: 'LineString', coordinates: l.coords || arc(l.from, l.to) },
    }));
    map.addSource('legs', { type: 'geojson', data: { type: 'FeatureCollection', features: feats } });
    map.addLayer({ id: 'legs-casing', type: 'line', source: 'legs', filter: ['==', ['get', 'kind'], 'rail'],
      layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#fff', 'line-width': 8 } });
    map.addLayer({ id: 'legs-rail', type: 'line', source: 'legs', filter: ['==', ['get', 'kind'], 'rail'],
      layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': COLORS.main, 'line-width': 4.5 } });
    map.addLayer({ id: 'legs-ext', type: 'line', source: 'legs', filter: ['==', ['get', 'kind'], 'ext'],
      layout: { 'line-cap': 'round' }, paint: { 'line-color': COLORS.ext, 'line-width': 3.5, 'line-dasharray': [2, 1.6] } });
    map.addLayer({ id: 'legs-ext2rail', type: 'line', source: 'legs', filter: ['==', ['get', 'kind'], 'ext2rail'],
      layout: { 'line-cap': 'round' }, paint: { 'line-color': COLORS.ext2, 'line-width': 3.5, 'line-dasharray': [2, 1.6] } });
    map.addLayer({ id: 'legs-fly', type: 'line', source: 'legs', filter: ['==', ['get', 'kind'], 'fly'],
      layout: { 'line-cap': 'round' }, paint: { 'line-color': COLORS.ext2, 'line-width': 3.5, 'line-dasharray': [0.3, 2.2] } });
  });
  const zoomed = [];
  ROUTE.legs.forEach(l => {
    const tag = document.createElement('div');
    tag.className = 'legtag legtag-' + l.kind;
    tag.textContent = l.label;
    new maplibregl.Marker({ element: tag }).setLngLat(l.at).addTo(map);
    if (l.minZoom) zoomed.push([tag, l.minZoom]);
  });
  const showZoomed = () => zoomed.forEach(([t, z]) => { t.style.visibility = map.getZoom() >= z ? 'visible' : 'hidden'; });
  map.on('zoom', showZoomed); showZoomed();
  // our own city pins replace the basemap's labels for those cities
  map.on('style.load', () => {
    const ours = ['literal', ROUTE.cities.map(c => c[0]).concat(['Xi’an', 'Xian'])];
    for (const id of ['label_city', 'label_city_capital', 'label_country_1', 'label_country_2', 'label_country_3']) {
      if (!map.getLayer(id)) continue;
      map.setFilter(id, ['all', map.getFilter(id), ['!', ['in', EN, ['literal', ours[1].concat(['China'])]]]]);
    }
  });
  ROUTE.cities.forEach(c => {
    const [name, lng, lat, kind, days, blurb, href, side] = c;
    const el2 = document.createElement('div');
    el2.className = 'citypin citypin-' + kind + ' side-' + side;
    el2.style.setProperty('--c', COLORS[kind]);
    el2.innerHTML = `<span class="dot"></span><span class="lbl"><b>${esc(name)}</b><small>${esc(days)}</small></span>`;
    const anchor = { right: 'left', left: 'right', top: 'bottom', bottom: 'top' }[side];
    const offset = { right: [-8, 0], left: [8, 0], top: [0, 8], bottom: [0, -8] }[side];
    new maplibregl.Marker({ element: el2, anchor, offset }).setLngLat([lng, lat])
      .setPopup(new maplibregl.Popup({ offset: 12, maxWidth: '240px' }).setHTML(
        `<div class="pop"><span class="pop-when" style="color:${COLORS[kind]}">${esc(days)}</span><b>${esc(name)}</b><p>${esc(blurb)}</p><div class="pop-links"><a href="${href}">${href.startsWith('#') ? 'Jump to it ↓' : 'Open the page →'}</a></div></div>`))
      .addTo(map);
  });
  const plane = document.createElement('div');
  plane.className = 'legtag legtag-plane';
  plane.textContent = '✈ arrive Beijing';
  new maplibregl.Marker({ element: plane, anchor: 'bottom-left' }).setLngLat([117.3, 40.7]).addTo(map);
  const home = document.createElement('div');
  home.className = 'legtag legtag-plane';
  home.textContent = '✈ home from Shanghai';
  new maplibregl.Marker({ element: home, anchor: 'top-left' }).setLngLat([121.9, 30.55]).addTo(map);
}

function initMaps() {
  if (!window.maplibregl) return;            // CDN blocked: the static fallback text stays
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    e.target.classList.add('live');
    (e.target.dataset.city ? cityMap : routeMap)(e.target);
  }), { rootMargin: '400px 0px' });
  document.querySelectorAll('.map[data-city], .map[data-route]').forEach(el => io.observe(el));
}

document.addEventListener('DOMContentLoaded', initMaps);

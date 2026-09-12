/*!
 * INSTANTOWN Embeddable Widget v1.0
 * © 2025–2026 INSTANTOWN / Solari&Partners Communication
 *
 * Embed on any site:
 *   <script src="https://instantown.it/widget.js" async></script>
 *
 * Optional config (set BEFORE the script tag):
 *   <script>window.INSTANTOWN_WIDGET = { lang: 'en', raggio: 300, maxOffers: 5 };</script>
 */
(function () {
  'use strict';

  // Prevent double-load
  if (window.__instantownWidgetLoaded) return;
  window.__instantownWidgetLoaded = true;

  // ── CONFIG ────────────────────────────────────────────────────────────────
  var USER_CFG = window.INSTANTOWN_WIDGET || {};
  var CFG = {
    sheetId:    '1m5ovESlhcbVwafN3EOpuYpWUGm1tbH6CtNPTBNZZrOI',
    sheetName:  'offerte',
    baseUrl:    'https://instantown.it',
    maxOffers:  USER_CFG.maxOffers  || 3,
    raggioMax:  USER_CFG.raggio     || 500,   // metres; 0 = no filter
    forceLang:  USER_CFG.lang       || null,
  };

  // ── i18n ──────────────────────────────────────────────────────────────────
  var T = {
    it: {
      btn:      '🛍 Offerte vicino a te',
      title:    'Offerte Flash · Roma',
      loading:  'Rilevazione posizione…',
      noGps:    'Attiva la posizione per vedere le offerte vicine.',
      noOffers: 'Nessuna offerta attiva nelle vicinanze.',
      viewAll:  'Vedi tutte le offerte →',
      off:      'sconto',
      away:     'da te',
      powered:  'Powered by INSTANTOWN',
      close:    '✕',
    },
    en: {
      btn:      '🛍 Deals near you',
      title:    'Flash Deals · Rome',
      loading:  'Getting your location…',
      noGps:    'Enable location to see nearby deals.',
      noOffers: 'No active deals nearby.',
      viewAll:  'View all deals →',
      off:      'off',
      away:     'away',
      powered:  'Powered by INSTANTOWN',
      close:    '✕',
    },
    zh: {
      btn:      '🛍 附近优惠',
      title:    '闪购优惠 · 罗马',
      loading:  '获取位置中…',
      noGps:    '请开启定位以查看附近优惠。',
      noOffers: '附近没有有效优惠。',
      viewAll:  '查看所有优惠 →',
      off:      '折扣',
      away:     '以内',
      powered:  'Powered by INSTANTOWN',
      close:    '✕',
    },
    es: {
      btn:      '🛍 Ofertas cerca',
      title:    'Ofertas Flash · Roma',
      loading:  'Obteniendo ubicación…',
      noGps:    'Activa la ubicación para ver ofertas cercanas.',
      noOffers: 'Sin ofertas activas cerca.',
      viewAll:  'Ver todas las ofertas →',
      off:      'dto.',
      away:     'de distancia',
      powered:  'Powered by INSTANTOWN',
      close:    '✕',
    },
    fr: {
      btn:      '🛍 Offres près de vous',
      title:    'Offres Flash · Rome',
      loading:  'Localisation en cours…',
      noGps:    'Activez la localisation pour voir les offres proches.',
      noOffers: 'Aucune offre active à proximité.',
      viewAll:  'Voir toutes les offres →',
      off:      'de réduction',
      away:     'de vous',
      powered:  'Powered by INSTANTOWN',
      close:    '✕',
    },
    de: {
      btn:      '🛍 Angebote in der Nähe',
      title:    'Blitzangebote · Rom',
      loading:  'Standort wird ermittelt…',
      noGps:    'Aktivieren Sie den Standort für Angebote in der Nähe.',
      noOffers: 'Keine aktiven Angebote in der Nähe.',
      viewAll:  'Alle Angebote anzeigen →',
      off:      'Rabatt',
      away:     'entfernt',
      powered:  'Powered by INSTANTOWN',
      close:    '✕',
    },
    ja: {
      btn:      '🛍 近くのオファー',
      title:    'フラッシュオファー · ローマ',
      loading:  '位置情報取得中…',
      noGps:    'オファーを表示するには位置情報を有効にしてください。',
      noOffers: '近くにアクティブなオファーはありません。',
      viewAll:  'すべてのオファーを見る →',
      off:      '割引',
      away:     '以内',
      powered:  'Powered by INSTANTOWN',
      close:    '✕',
    },
  };

  function getLang() {
    if (CFG.forceLang && T[CFG.forceLang]) return CFG.forceLang;
    var l = (navigator.language || 'en').split('-')[0].toLowerCase();
    return T[l] ? l : 'en';
  }

  // ── UTILS ─────────────────────────────────────────────────────────────────
  function haversine(lat1, lon1, lat2, lon2) {
    var R = 6371000;
    var r = function (d) { return d * Math.PI / 180; };
    var dLat = r(lat2 - lat1), dLon = r(lon2 - lon1);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
          + Math.cos(r(lat1)) * Math.cos(r(lat2))
          * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function fmtDist(m) {
    return m < 1000 ? Math.round(m) + ' m' : (m / 1000).toFixed(1) + ' km';
  }

  function parseLon(v) {
    if (!v && v !== 0) return 0;
    var s = String(v).trim().replace(/ /g, '');
    var r = parseFloat(s.replace(',', '.'));
    if (r > 100) r = r / 100000.0;
    return isNaN(r) ? 0 : r;
  }

  function sconto(std, flash) {
    if (std <= 0 || flash >= std) return 0;
    return Math.round((1 - flash / std) * 100);
  }

  // ── FETCH OFFERTE ─────────────────────────────────────────────────────────
  function fetchOffers(cb) {
    var url = 'https://docs.google.com/spreadsheets/d/'
      + CFG.sheetId + '/gviz/tq?tqx=out:json&sheet='
      + encodeURIComponent(CFG.sheetName);
    fetch(url)
      .then(function (r) { return r.text(); })
      .then(function (txt) {
        var json = JSON.parse(txt.substring(47).slice(0, -2));
        var cols = json.table.cols.map(function (c) { return c.label.toLowerCase().trim(); });
        var gi = function (l) { return cols.findIndex(function (c) { return c.includes(l); }); };
        var gv = function (row, l) {
          var i = gi(l);
          return i >= 0 && row.c[i] ? (row.c[i].v !== null && row.c[i].v !== undefined ? row.c[i].v : (row.c[i].f || '')) : '';
        };
        var list = json.table.rows.map(function (row) {
          return {
            descrizione:  String(gv(row, 'descrizione') || ''),
            prezzoStd:    parseFloat(gv(row, 'prezzo std'))   || 0,
            prezzoFlash:  parseFloat(gv(row, 'prezzo flash')) || 0,
            stato:        String(gv(row, 'stato') || 'ATTIVA').toUpperCase(),
            lat:          parseFloat(gv(row, 'lat')) || 0,
            lon:          parseLon(gv(row, 'lon')),
            indirizzo:    String(gv(row, 'indirizzo') || ''),
          };
        }).filter(function (o) { return o.descrizione && o.stato === 'ATTIVA'; });
        cb(null, list);
      })
      .catch(function (e) { cb(e, []); });
  }

  // ── CSS (Shadow DOM — zero conflicts with host page) ──────────────────────
  var CSS = [
    ':host{all:initial;font-family:"DM Sans",system-ui,sans-serif;}',
    '*{box-sizing:border-box;margin:0;padding:0;}',

    /* ── Floating button ── */
    '#it-btn{',
    '  position:fixed;bottom:24px;right:24px;z-index:2147483647;',
    '  background:#8B1A1A;color:#fff;border:none;border-radius:24px;',
    '  padding:12px 20px;font-size:14px;font-weight:600;cursor:pointer;',
    '  box-shadow:0 4px 20px rgba(139,26,26,.4);',
    '  transition:transform .2s,box-shadow .2s;',
    '  font-family:"DM Sans",system-ui,sans-serif;white-space:nowrap;',
    '  line-height:1;',
    '}',
    '#it-btn:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(139,26,26,.5);}',

    /* ── Panel ── */
    '#it-panel{',
    '  position:fixed;bottom:80px;right:24px;z-index:2147483646;',
    '  width:320px;max-height:480px;',
    '  background:#FDFAF4;border-radius:16px;',
    '  box-shadow:0 12px 48px rgba(0,0,0,.18);',
    '  display:none;flex-direction:column;overflow:hidden;',
    '  border:1px solid rgba(139,26,26,.12);',
    '  animation:itSlideUp .22s ease;',
    '}',
    '@keyframes itSlideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}',
    '#it-panel.open{display:flex;}',

    /* ── Header ── */
    '.it-hd{background:#1C1410;padding:13px 14px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}',
    '.it-hd-l{display:flex;align-items:center;gap:8px;}',
    '.it-logo{width:26px;height:26px;border-radius:6px;display:block;}',
    '.it-title{font-family:"Cormorant Garamond",Georgia,serif;font-size:15px;font-weight:600;color:#fff;line-height:1;}',
    '.it-title b{color:#E8A020;}',
    '.it-close-btn{background:none;border:none;color:rgba(255,255,255,.45);font-size:17px;cursor:pointer;padding:2px 6px;border-radius:4px;line-height:1;font-family:sans-serif;}',
    '.it-close-btn:hover{color:#fff;}',

    /* ── Body ── */
    '.it-body{flex:1;overflow-y:auto;padding:10px;display:flex;flex-direction:column;gap:8px;-webkit-overflow-scrolling:touch;}',

    /* ── Loading ── */
    '.it-loading{text-align:center;padding:22px 16px;color:#6B5A4E;font-size:13px;line-height:1.5;}',
    '.it-spin{width:22px;height:22px;border:2.5px solid rgba(139,26,26,.12);border-top-color:#8B1A1A;border-radius:50%;animation:itRot .8s linear infinite;margin:0 auto 10px;}',
    '@keyframes itRot{to{transform:rotate(360deg)}}',

    /* ── Empty ── */
    '.it-empty{text-align:center;padding:20px 16px;color:#6B5A4E;font-size:13px;line-height:1.5;}',
    '.it-empty-ico{font-size:26px;margin-bottom:8px;}',

    /* ── Card ── */
    '.it-card{background:#fff;border:1px solid rgba(139,26,26,.09);border-radius:10px;padding:11px 12px;text-decoration:none;display:block;transition:box-shadow .15s,transform .15s;}',
    '.it-card:hover{box-shadow:0 4px 16px rgba(0,0,0,.07);transform:translateY(-1px);}',
    '.it-ct{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;}',
    '.it-desc{font-size:13px;font-weight:600;color:#1C1410;line-height:1.35;flex:1;text-transform:capitalize;}',
    '.it-disc{background:#FDF3DC;color:#C8860A;font-size:10px;font-weight:700;padding:2px 7px;border-radius:3px;margin-left:8px;white-space:nowrap;flex-shrink:0;}',
    '.it-cr{display:flex;align-items:baseline;gap:7px;}',
    '.it-pf{font-family:"Cormorant Garamond",Georgia,serif;font-size:22px;font-weight:600;color:#0F5C8C;line-height:1;}',
    '.it-ps{font-size:11px;color:#6B5A4E;text-decoration:line-through;}',
    '.it-dist{font-size:11px;color:#4A90C4;font-weight:600;margin-left:auto;white-space:nowrap;}',

    /* ── Footer ── */
    '.it-ft{padding:10px;border-top:1px solid rgba(139,26,26,.08);flex-shrink:0;}',
    '.it-cta{display:block;width:100%;padding:10px;background:#8B1A1A;color:#fff;text-align:center;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none;transition:background .2s;font-family:"DM Sans",system-ui,sans-serif;}',
    '.it-cta:hover{background:#C0392B;}',
    '.it-pw{text-align:center;font-size:10px;color:rgba(28,20,16,.28);margin-top:6px;letter-spacing:.05em;}',

    /* ── Responsive ── */
    '@media(max-width:380px){#it-panel{right:8px;left:8px;width:auto;}#it-btn{right:14px;bottom:14px;font-size:13px;padding:11px 16px;}}',
  ].join('');

  // ── BUILD ─────────────────────────────────────────────────────────────────
  function build() {
    var lang = getLang();
    var tx   = T[lang];

    // Shadow host
    var host   = document.createElement('div');
    host.id    = 'instantown-widget-root';
    var shadow = host.attachShadow({ mode: 'open' });

    // Fonts
    var gf   = document.createElement('link');
    gf.rel   = 'stylesheet';
    gf.href  = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&family=DM+Sans:wght@400;600&display=swap';

    // Style
    var st   = document.createElement('style');
    st.textContent = CSS;

    // Panel HTML
    var panel = document.createElement('div');
    panel.id  = 'it-panel';
    panel.innerHTML =
      '<div class="it-hd">' +
        '<div class="it-hd-l">' +
          '<img class="it-logo" src="' + CFG.baseUrl + '/Nuovo_logo_3_diss.png" alt="INSTANTOWN">' +
          '<div class="it-title">INSTANT<b>OWN</b></div>' +
        '</div>' +
        '<button class="it-close-btn" id="it-x">' + tx.close + '</button>' +
      '</div>' +
      '<div class="it-body" id="it-body">' +
        '<div class="it-loading"><div class="it-spin"></div>' + tx.loading + '</div>' +
      '</div>' +
      '<div class="it-ft">' +
        '<a class="it-cta" href="' + CFG.baseUrl + '/offerte.html" target="_blank" rel="noopener">' + tx.viewAll + '</a>' +
        '<div class="it-pw">' + tx.powered + '</div>' +
      '</div>';

    // Button
    var btn = document.createElement('button');
    btn.id  = 'it-btn';
    btn.textContent = tx.btn;

    shadow.appendChild(gf);
    shadow.appendChild(st);
    shadow.appendChild(panel);
    shadow.appendChild(btn);
    document.body.appendChild(host);

    // ── State ──
    var open = false, loaded = false;
    var uLat = null, uLon = null;

    function openPanel() {
      panel.classList.add('open');
      open = true;
      if (!loaded) loadData();
    }
    function closePanel() {
      panel.classList.remove('open');
      open = false;
    }

    btn.addEventListener('click', function () { open ? closePanel() : openPanel(); });
    shadow.getElementById('it-x').addEventListener('click', closePanel);

    // ── Render ──
    function renderCards(offers) {
      var body = shadow.getElementById('it-body');
      if (!offers.length) {
        body.innerHTML =
          '<div class="it-empty"><div class="it-empty-ico">📍</div>' + tx.noOffers + '</div>';
        return;
      }
      body.innerHTML = offers.map(function (o) {
        var disc    = sconto(o.prezzoStd, o.prezzoFlash);
        var distTxt = (o.dist !== undefined && o.dist !== Infinity)
          ? '📍 ' + fmtDist(o.dist) + ' ' + tx.away : '';
        return '<a class="it-card" href="' + CFG.baseUrl + '/offerte.html" target="_blank" rel="noopener">' +
          '<div class="it-ct">' +
            '<div class="it-desc">' + o.descrizione + '</div>' +
            (disc > 0 ? '<div class="it-disc">-' + disc + '%</div>' : '') +
          '</div>' +
          '<div class="it-cr">' +
            '<div class="it-pf">€' + o.prezzoFlash.toFixed(2) + '</div>' +
            (o.prezzoStd > 0 ? '<div class="it-ps">€' + o.prezzoStd.toFixed(2) + '</div>' : '') +
            (distTxt ? '<div class="it-dist">' + distTxt + '</div>' : '') +
          '</div>' +
        '</a>';
      }).join('');
    }

    function processOffers(offers, lat, lon) {
      var list = offers.map(function (o) {
        var dist = (lat !== null && o.lat && o.lon)
          ? haversine(lat, lon, o.lat, o.lon)
          : Infinity;
        o.dist = dist;
        return o;
      });

      if (CFG.raggioMax > 0 && lat !== null) {
        list = list.filter(function (o) { return o.dist <= CFG.raggioMax; });
      }

      list.sort(function (a, b) { return a.dist - b.dist; });
      renderCards(list.slice(0, CFG.maxOffers));
    }

    // ── Load data ──
    function loadData() {
      loaded = true;
      if (!navigator.geolocation) {
        fetchOffers(function (err, offers) {
          renderCards(err ? [] : offers.slice(0, CFG.maxOffers));
        });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        function (pos) {
          uLat = pos.coords.latitude;
          uLon = pos.coords.longitude;
          fetchOffers(function (err, offers) {
            processOffers(err ? [] : offers, uLat, uLon);
          });
        },
        function () {
          // GPS denied — show nearest regardless of distance
          fetchOffers(function (err, offers) {
            processOffers(err ? [] : offers, null, null);
          });
        },
        { timeout: 7000, maximumAge: 120000 }
      );
    }
  }

  // ── INIT ──────────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }

})();

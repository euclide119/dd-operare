/* Platforma de operare · interfețele. Rolul stă în sessionStorage (fiecare tab al lui); datele sunt comune. */
'use strict';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const $ = (s, r) => (r || document).querySelector(s);
const ROLES = { admin: 'Admin', operator: 'Operator', tehnic: 'Tehnic', sales: 'Sales', plati: 'Plăți', specialist: 'Specialist', client: 'Client' };
const NAV = {
  operator: [['azi', 'De lucrat'], ['comenzi', 'Comenzi'], ['cereri', 'Întrebări'], ['probleme', 'Probleme']],
  admin: [['-', 'Operare'], ['azi', 'De lucrat'], ['panou', 'Panou'], ['comenzi', 'Comenzi'], ['cereri', 'Întrebări'], ['probleme', 'Probleme'], ['servicii', 'Servicii'], ['dosare', 'Dosare specialiști'], ['-', 'Oameni'], ['specialisti', 'Specialiști'], ['conturi', 'Conturi'], ['juridic', 'Contracte'], ['-', 'Bani'], ['plati', 'Plăți și decont'], ['-', 'Date și proiect'], ['planop', 'Plan operare'], ['plan', 'Plan de execuție'], ['date', 'Date (colecția CF)'], ['riscuri', 'Riscuri'], ['tinte', 'Ținte'], ['arhitectura', 'Arhitectură'], ['setari', 'Setări']],
  tehnic: [['plan', 'Plan de execuție'], ['dosare', 'Dosare specialiști'], ['probleme', 'Probleme'], ['motor', 'Taskuri automate'], ['surse', 'Surse de date']],
  sales: [['comenzi', 'Comenzi'], ['cosuri', 'Coșuri abandonate'], ['oferte', 'Cereri de ofertă'], ['clienti', 'Clienți']],
  plati: [['plati', 'Plăți'], ['decont', 'Decont specialiști']],
  specialist: [['disp', 'Disponibile'], ['mele', 'Ale mele'], ['term', 'Terminate'], ['dosare', 'Dosare de pregătit'], ['acte', 'Contracte'], ['contoare', 'Contoarele mele']],
  client: [['pagina', 'Comanda mea']]
};
/* pe primul nivel; restul stau sub „Mai mult” (nu dispare nimic) */
const NAV_PRINCIPAL = { admin: ['azi', 'comenzi', 'cereri', 'probleme', 'specialisti'], specialist: ['disp', 'mele', 'term'] };
let UI = { role: 'admin', view: 'panou', spec: 'sp_ion', client: 'EP-10001', f: {}, sel: null };
try { const s = sessionStorage.getItem('epay_ui_demo'); if (s) UI = Object.assign(UI, JSON.parse(s)); } catch (e) { /* fără sessionStorage */ }
const saveUI = () => { try { sessionStorage.setItem('epay_ui_demo', JSON.stringify(UI)); } catch (e) { /* ignor */ } };
let MODAL = null, TOAST = '';
const SITE_URL = 'https://euclide119.github.io/epay-cf-test/';
const firstView = (rol) => NAV[rol].find((n) => n[0] !== '-')[0];

/* ---------- componente ---------- */
const CHIP = { nou: 'galben', asteptare: 'gri', disponibil: 'alb', oferit: 'alb', escaladat: 'rosu', atribuit: 'galben', blocat: 'rosu', esuat: 'rosu', terminat: 'verde', anulat: 'gri', cerere: 'galben', cotata: 'alb', acceptata: 'alb', platita: 'alb', in_lucru: 'galben', livrat: 'verde', problema: 'rosu', capturata: 'verde', initiata: 'gri', esuata: 'rosu', rambursata: 'gri', rambursata_part: 'gri', activa: 'galben', livrata: 'verde', inchisa: 'gri', neconfirmata: 'rosu', in_asteptare_acord: 'galben', activ: 'verde', suspendat: 'rosu', documente_trimise: 'galben', invitat: 'gri', deschisa: 'rosu', rezolvata: 'verde', ok: 'verde', degradat: 'galben', primita: 'alb' };
const TXT = { nou: 'nou · din aplicație', asteptare: 'așteaptă', disponibil: 'de alocat', oferit: 'oferit', escaladat: 'fără specialist', atribuit: 'în lucru', blocat: 'blocat', esuat: 'eșuat', terminat: 'gata', anulat: 'anulat', cerere: 'cerere de ofertă', cotata: 'ofertă trimisă', acceptata: 'acceptată', platita: 'plătită', in_lucru: 'în lucru', livrat: 'livrat', problema: 'problemă', capturata: 'plătită', initiata: 'neplătită', esuata: 'eșuată', rambursata: 'rambursată', rambursata_part: 'rambursată parțial', activa: 'în lucru', livrata: 'livrată', inchisa: 'închisă', neconfirmata: 'neplătită', in_asteptare_acord: 'fără acord', activ: 'activ', suspendat: 'suspendat', documente_trimise: 'de validat', invitat: 'invitat', deschisa: 'deschisă', rezolvata: 'rezolvată', primita: 'primită' };
const chip = (s, txt) => '<span class="chip ' + (CHIP[s] || 'gri') + '">' + esc(txt || TXT[s] || s) + '</span>';
const tag = (t, c) => '<span class="chip ' + (c || 'gri') + '">' + esc(t) + '</span>';
const btn = (a, txt, o) => { o = o || {}; return '<button class="b ' + (o.c || '') + '" data-a="' + a + '"' + (o.id != null ? ' data-id="' + esc(o.id) + '"' : '') + (o.x != null ? ' data-x="' + esc(o.x) + '"' : '') + (o.dis ? ' disabled' : '') + (o.t ? ' title="' + esc(o.t) + '"' : '') + '>' + txt + '</button>'; };
const tbl = (head, rows) => '<div class="tw"><table class="t"><thead><tr>' + head.map((h) => '<th>' + h + '</th>').join('') + '</tr></thead><tbody>' + (rows.length ? rows.join('') : '<tr><td colspan="' + head.length + '" class="gol">Nimic aici.</td></tr>') + '</tbody></table></div>';
const kpi = (n, l, c, a) => '<div class="kpi ' + (c || '') + '"' + (a ? ' data-a="go" data-id="' + a + '"' : '') + '><b>' + n + '</b><span>' + l + '</span></div>';
const plia = (k, title, body) => '<details class="card" data-k="' + k + '"><summary>' + title + '</summary>' + body + '</details>';
const sec = (title, body, extra) => '<section class="card"><div class="ch"><h3>' + title + '</h3>' + (extra || '') + '</div>' + body + '</section>';
const spName = (id) => { const s = D('specialisti')[id]; return s ? s.nume : id === 'motor' ? 'automat' : id || '—'; };
const svName = (id) => (SV[id] ? SV[id][0] : id);
const orderBy = (nr) => L('comenzi', (o) => o.nr === nr)[0];
const orderOf = (t) => D('comenzi')[t.comanda];
const orderTasks = (oid) => L('taskuri', (t) => t.comanda === oid);
const imoText = (im) => (im.cf ? 'CF ' + im.cf + ' · ' : '') + esc(im.adresa || '') + (im.adresa ? ', ' : '') + esc(im.uat);
const clName = (o) => D('clienti')[o.client].nume || D('clienti')[o.client].email;
const hhmm = (t) => { const d = new Date(t), n = new Date(); const p = (x) => String(x).padStart(2, '0'); const same = d.toDateString() === n.toDateString(); return (same ? 'azi ' : p(d.getDate()) + '.' + p(d.getMonth() + 1) + ' ') + p(d.getHours()) + ':' + p(d.getMinutes()); };
const toast = (m) => { TOAST = m; renderApp(); setTimeout(() => { TOAST = ''; const t = $('#toast'); if (t) t.remove(); }, 3000); };
const dl = (name, text, mime) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: mime || 'text/plain;charset=utf-8' })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
const progress = (oid) => { const ts = orderTasks(oid).filter((t) => t.stare !== 'anulat'); return ts.filter((t) => t.stare === 'terminat').length + '/' + ts.length; };
/* eticheta de termen: apare doar când contează (aproape de termen sau depășit) */
function termen(t) {
  const s = slaInfo(t); if (s.stare === 'late') return tag('depășit cu ' + fmtD(-s.rest), 'rosu'); if (s.stare === 'warn') return tag('aproape de termen', 'galben');
  if (t.terta && t.stare === 'atribuit') { const over = (now() - t.acceptat_la) / MIN - t.termenMin; return over > 0 ? tag('termen legal depășit', 'rosu') : tag('așteaptă instituția', 'alb'); }
  return '';
}
function termenOrder(o) { const ts = orderTasks(o.id); if (ts.some((t) => slaInfo(t).stare === 'late')) return tag('termen depășit', 'rosu'); if (ts.some((t) => slaInfo(t).stare === 'warn')) return tag('aproape de termen', 'galben'); if (ts.some((t) => t.stare === 'escaladat')) return tag('fără specialist', 'rosu'); if (L('probleme', (p) => p.comanda === o.id && p.stare !== 'rezolvata').length) return tag('problemă', 'rosu'); return ''; }
const EV_TXT = {
  'comanda.creata': 'Comandă primită de pe site', 'comanda.preluata': 'Verificată și preluată', 'comanda.completare': 'Cerut clientului să completeze', 'comanda.gata': 'Completă: de verificat și trimis', 'linie.adaugata': 'Serviciu adăugat', 'comanda.asteapta_acord': 'Așteaptă acordul de executare imediată', 'comanda.acord': 'Acord de executare imediată dat', 'comanda.livrata': 'Comandă livrată', 'comanda.inchisa': 'Comandă închisă', 'comanda.anulata': 'Comandă anulată',
  'plata.initiata': 'Plată inițiată', 'plata.capturata': 'Plată confirmată', 'plata.esuata': 'Plată eșuată', 'plata.rambursata': 'Rambursare', 'factura.emisa': 'Factură emisă', 'factura.spv': 'Stare SPV',
  'task.disponibil': 'Pas deblocat', 'task.escaladat': 'Niciun specialist disponibil', 'oferta.creata': 'Oferit specialistului', 'oferta.expirata': 'Oferta a expirat', 'oferta.refuzata': 'Ofertă refuzată', 'task.acceptat': 'Preluat',
  'task.terminat': 'Terminat', 'task.timeout': 'Termen depășit: realocat', 'task.returnat': 'Returnat', 'task.atribuit_fortat': 'Atribuit de admin', 'task.retras': 'Retras', 'task.reincadrat': 'Reîncadrat', 'task.esuat': 'Automat: eșuat', 'task.reluat': 'Automat: reluat',
  'problema.deschisa': 'Problemă deschisă', 'problema.rezolvata': 'Problemă rezolvată', 'document.incarcat': 'Document încărcat', 'linie.livrata': 'Serviciu livrat', 'linie.anulata': 'Serviciu anulat', 'notificare.trimisa': 'Mesaj către client',
  'oferta_pret.cotata': 'Ofertă de preț întocmită', 'oferta_pret.trimisa': 'Ofertă trimisă clientului', 'oferta_pret.acceptata': 'Clientul a acceptat oferta', 'oferta_pret.refuzata': 'Clientul a refuzat oferta'
};
const eventsOfOrder = (oid) => {
  const tids = new Set(orderTasks(oid).map((t) => t.id)), lids = new Set(L('linii', (l) => l.comanda === oid).map((l) => l.id)), pids = new Set(L('plati', (p) => p.comanda === oid).map((p) => p.id));
  return R.db.evenimente.filter((e) => e.obj && ((e.obj.k === 'comanda' && e.obj.id === oid) || (e.obj.k === 'task' && tids.has(e.obj.id)) || (e.obj.k === 'linie' && lids.has(e.obj.id)) || (e.obj.k === 'plata' && pids.has(e.obj.id))));
};
const evLine = (e) => '<li><time>' + hhmm(e.t) + '</time> ' + esc(EV_TXT[e.tip] || e.tip) + ' <span class="mut">' + esc(spName(e.actor)) + (e.data && e.data.n ? ' · ' + esc(e.data.n) : '') + (e.data && e.data.sablon ? ' · ' + esc(e.data.sablon) : '') + (e.data && e.data.tip ? ' · ' + esc(e.data.tip) : '') + (e.data && e.data.suma ? ' · ' + lei(e.data.suma) : '') + '</span></li>';

/* ---------- cadru ---------- */
const DEMO_CONTURI = [['admin', null, 'Manu', 'admin'], ['operator', null, 'Operator', 'operator'], ['tehnic', null, 'Silviu', 'tehnic'], ['sales', null, 'Oana Bucur', 'sales'], ['plati', null, 'Carmen Ilieș', 'plăți']];
function loginView() {
  if (UI.setPass) return '<div class="login"><h2>Setează parola</h2><p class="mut small">Contul tău a fost creat de admin. Alege o parolă (minimum 8 caractere).</p>' + (SYNC.err ? '<p class="err">' + esc(SYNC.err) + '</p>' : '') + '<form data-f="setpass"><label>Parolă nouă<input type="password" name="pass" autocomplete="new-password" minlength="8" required></label><button class="b pri mare" type="submit">Salvează și intră</button></form></div>';
  if (syncAvailable() && !UI.demoList) return '<div class="login"><h2>Platforma de operare</h2><p class="mut small">serviciu privat de analiză</p>' + (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? '<button class="b pri mare" style="width:100%" data-a="demolist">Intră fără cont (demonstrativ)</button><p class="small mut">Date de test, doar pe acest dispozitiv. Alegi rolul: admin, specialist, sales, plăți, client.</p><hr>' : '') + '<h3>Intră cu contul</h3>' + (SYNC.err ? '<p class="err">' + esc(SYNC.err) + '</p>' : '') + '<form data-f="login"><label>Email<input type="email" name="email" autocomplete="username" required></label><label>Parolă<input type="password" name="pass" autocomplete="current-password" required></label><button class="b mare" type="submit">Intră</button></form><p class="small mut">Conturile le creează adminul; fiecare vede doar ce ține de rolul lui.</p></div>';
  const sp = SPECIALISTI_SEED.map((s) => [s.id, s.nume, SPEC[s.spec[0]]]);
  return '<div class="login"><h2>Platforma de operare</h2><p class="mut small">Mod demonstrativ: date de test pe acest dispozitiv, fără parole. În producție fiecare intră cu email și parolă (config.js + sql/sync.sql).</p><h3>Echipa</h3>' + DEMO_CONTURI.map((c) => '<button class="b mare acc" data-a="demolog" data-id="' + c[0] + '">' + esc(c[2]) + ' <span class="mut small">' + c[3] + '</span></button>').join('') + '<h3>Specialiști</h3>' + sp.map((s) => '<button class="b mare acc" data-a="demolog" data-id="specialist" data-x="' + s[0] + '">' + esc(s[1]) + ' <span class="mut small">' + s[2] + '</span></button>').join('') + '<h3>Client</h3><button class="b mare acc" data-a="demolog" data-id="client">Pagina unui client <span class="mut small">link din email</span></button></div>';
}
function renderApp() {
  const app = $('#app'); if (!app) return;
  if (!UI.auth) { app.innerHTML = loginView() + (TOAST ? '<div id="toast" class="toast">' + esc(TOAST) + '</div>' : ''); return; }
  /* tehnicul poate comuta interfața (inclusiv pe Admin) ca să vadă tot; drepturile rămân ale rolului lui din bază: conturile și rolurile doar adminul */
  const isAdmin = UI.auth.rol === 'admin', canSwitch = isAdmin || UI.auth.rol === 'tehnic';
  if (!canSwitch) UI.role = UI.auth.rol; if (UI.auth.rol === 'specialist') UI.spec = UI.auth.sid;
  const nav = NAV[UI.role];
  if (!nav.some((n) => n[0] === UI.view) && !['detaliu', 'task', 'spdet', 'pas'].includes(UI.view)) UI.view = nav.find((n) => n[0] !== '-')[0];
  const opts = (o, cur) => Object.keys(o).map((k) => '<option value="' + k + '"' + (k === cur ? ' selected' : '') + '>' + esc(o[k]) + '</option>').join('');
  const sub = (!canSwitch && UI.auth.rol !== 'client') ? '' : UI.role === 'specialist' ? '<select data-i="spec">' + L('specialisti', (s) => !s.sistem).map((s) => '<option value="' + s.id + '"' + (s.id === UI.spec ? ' selected' : '') + '>' + esc(s.nume) + ' · ' + SPEC[s.spec[0]] + '</option>').join('') + '</select>'
    : UI.role === 'client' ? '<select data-i="client">' + L('comenzi').sort((a, b) => a.nr.localeCompare(b.nr)).map((o) => '<option value="' + o.nr + '"' + (o.nr === UI.client ? ' selected' : '') + '>' + o.nr + ' · ' + esc(clName(o)) + '</option>').join('') + '</select>' : '';
  const active = (n) => n[0] === UI.view || (['detaliu', 'pas'].includes(UI.view) && n[0] === 'comenzi') || (UI.view === 'spdet' && n[0] === 'specialisti') || (UI.view === 'task' && n[0] === 'mele');
  const nPb = L('probleme', (p) => p.stare !== 'rezolvata').length; const nOf = UI.role === 'specialist' ? L('oferte', (x) => x.spec === UI.spec && x.raspuns === 'deschisa').length : 0;
  const bd = (n) => n[0] === 'probleme' ? nPb : n[0] === 'cereri' ? intrebariDeschise().length : n[0] === 'azi' ? coada().length : n[0] === 'disp' ? nOf : n[0] === 'acte' && UI.role === 'specialist' ? L('acte', (a) => a.dest_spec === UI.spec && a.stare === 'la_semnat').length : 0;
  const prim = NAV_PRINCIPAL[UI.role];
  const vizibil = (n) => !prim || UI.maiMult || (n[0] !== '-' && (prim.includes(n[0]) || active(n) || bd(n) > 0));
  const siteLink = '<a href="' + SITE_URL + '" target="_blank" rel="noopener">Site ↗</a>';
  const deschise = [...document.querySelectorAll('details[data-k][open]')].map((d) => d.dataset.k);
  app.innerHTML = '<header class="top"><div class="brand"><b>Platforma de operare</b><span>' + esc(UI.auth.nume) + (SYNC.on ? ' · sincronizat' : ' · demo') + '</span></div>' +
    (canSwitch ? '<label class="rol">Interfața <select data-i="role">' + opts(ROLES, UI.role) + '</select></label>' + (!isAdmin && UI.role === 'admin' ? '<span class="small" title="Vezi interfața de admin; modifici cu drepturile de tehnic (fără conturi și roluri)">doar vizualizare conturi</span>' : '') : '') + sub + (UI.role !== 'client' && UI.role !== 'specialist' && !prim ? '<a class="b mic site" href="' + SITE_URL + '" target="_blank" rel="noopener">Site ↗</a>' : '') + '<button class="b mic iesi" data-a="logout">Ieși</button></header>' +
    '<div class="body"><nav class="side">' + nav.filter(vizibil).map((n) => n[0] === '-' ? '<span class="nsec">' + n[1] + '</span>' : '<a href="#" data-a="nav" data-id="' + n[0] + '" class="' + (active(n) ? 'on' : '') + '">' + n[1] + (bd(n) ? ' <i>' + bd(n) + '</i>' : '') + '</a>').join('') + (prim ? '<a href="#" class="nmai" data-a="maimult">' + (UI.maiMult ? 'Mai puțin' : 'Mai mult') + '</a>' + (UI.maiMult && UI.role !== 'specialist' ? siteLink : '') : '') + '</nav><main class="main" id="main">' + view() + '</main></div>' +
    (MODAL ? '<div class="ov" data-a="mclose"><div class="md"><div class="mh"><h3>' + MODAL.title + '</h3>' + btn('mclose', '✕', { c: 'mic' }) + '</div><div class="mb">' + MODAL.html + '</div></div></div>' : '') +
    (TOAST ? '<div id="toast" class="toast">' + esc(TOAST) + '</div>' : '');
  deschise.forEach((k) => { const d = document.querySelector('details[data-k="' + k + '"]'); if (d) d.open = true; });
  if (UI.role === 'specialist' && UI.knownOffers == null) UI.knownOffers = L('oferte', (x) => x.spec === UI.spec && x.raspuns === 'deschisa').map((x) => x.id);
  if (UI.role === 'specialist' && UI.view === 'task') mapInit();
  if (document.getElementById('sigpad')) sigInit();
  tickTimers();
}
function tickTimers() {
  document.querySelectorAll('.tmr').forEach((n) => { const end = +n.dataset.end, tot = +n.dataset.tot; const left = end - now(); n.textContent = fmtClock(left); n.classList.toggle('late', left < 0); n.classList.toggle('warn', left >= 0 && tot > 0 && left < tot * MIN * 0.25); });
}
function view() {
  if (UI.view === 'dosare' && typeof dosareView === 'function') { try { return dosareView(); } catch (e) { console.error(e); return '<div class="card"><h3>Eroare de afișare</h3><pre>' + esc(e.stack) + '</pre></div>'; } }
  const f = { admin: adminView, operator: operatorView, tehnic: tehnicView, sales: salesView, plati: platiRoleView, specialist: specView, client: clientView }[UI.role];
  try { return f(); } catch (e) { console.error(e); return '<div class="card"><h3>Eroare de afișare</h3><pre>' + esc(e.stack) + '</pre></div>'; }
}
function commit() { tick(); R.save(); renderApp(); }

/* ---------- Admin ---------- */
function adminView() {
  return { azi: deLucrat, cereri: cereriView, planop: planOperare, pas: () => pasOperator(UI.sel), plan: planView, panou, comenzi: comenziList, detaliu: () => comandaDetaliu(UI.sel), specialisti: specialistiList, spdet: () => specialistDetaliu(UI.sel), plati: () => platiView() + decont(), probleme, tinte, juridic, arhitectura, setari, conturi, riscuri, servicii, date: datePage }[UI.view]();
}
function alertsList() {
  const a = [], tm = now();
  L('taskuri', (t) => t.stare === 'escaladat').forEach((t) => a.push(['rosu', orderOf(t).nr + ': ' + t.n + ' — niciun specialist în ' + t.judet, t.comanda]));
  L('taskuri', (t) => slaInfo(t).stare === 'late').forEach((t) => a.push(['rosu', orderOf(t).nr + ': ' + t.n + ' — ' + spName(t.specialist) + ' a depășit termenul', t.comanda]));
  L('taskuri', (t) => slaInfo(t).stare === 'warn').forEach((t) => a.push(['galben', orderOf(t).nr + ': ' + t.n + ' — ' + spName(t.specialist) + ' e aproape de termen', t.comanda]));
  L('probleme', (p) => p.stare !== 'rezolvata').forEach((p) => a.push([tm - p.la > D('settings').problemaMaxOre * ORA ? 'rosu' : 'galben', D('comenzi')[p.comanda].nr + ': problemă — ' + p.tip + ' (' + fmtD((tm - p.la) / MIN) + ')', p.comanda]));
  L('comenzi', (o) => o.stare === 'in_asteptare_acord').forEach((o) => a.push(['galben', o.nr + ': plătită, dar fără acordul de executare imediată', o.id]));
  L('plati', (p) => p.stare === 'capturata' && !p.factura).forEach((p) => a.push(['galben', D('comenzi')[p.comanda].nr + ': plată fără factură', p.comanda]));
  L('specialisti', (s) => s.status === 'documente_trimise').forEach((s) => a.push(['galben', s.nume + ' așteaptă validarea', 'sp:' + s.id]));
  L('servicii', (x) => x.stare !== 'invalidat' && x.reverificare && new Date(x.reverificare).getTime() < tm).forEach((x) => a.push(['galben', 'Reverificare depășită: ' + svName(x.id) + ' (' + x.reverificare + ')', 'sv:']));
  L('linii', (l) => ['asteptare', 'cerere', 'platita', 'in_lucru'].includes(l.stare) && ['pauza', 'invalidat'].includes((D('servicii')[l.svc] || {}).stare)).forEach((l) => a.push(['rosu', (D('comenzi')[l.comanda] || {}).nr + ': ' + svName(l.svc) + ' e ' + STARI_SERVICIU[D('servicii')[l.svc].stare][0].toLowerCase(), l.comanda]));
  L('contracte', (c) => c.expira_la - tm < 30 * ZI && c.expira_la > tm).forEach((c) => a.push(['galben', spName(c.spec) + ': ' + CONTRACTE_TIP[c.tip] + ' expiră în ' + Math.ceil((c.expira_la - tm) / ZI) + ' zile', 'sp:' + c.spec]));
  return a;
}
function flow() {
  const os = L('comenzi'); const n = (f) => os.filter(f).length;
  const st = [['Neplătite', n((o) => ['neconfirmata', 'in_asteptare_acord'].includes(o.stare)), 'gri', 'neplatita'], ['Primite', n((o) => etapa(o) === 'primita'), 'alb', 'primita'], ['În lucru', n((o) => etapa(o) === 'in_lucru'), 'galben', 'in_lucru'], ['Livrate', n((o) => etapa(o) === 'livrata'), 'verde', 'livrata'], ['Închise', n((o) => etapa(o) === 'inchisa'), 'gri', 'inchisa']];
  const ts = L('taskuri');
  const tn = [['Așteaptă pasul anterior', ts.filter((t) => t.stare === 'asteptare').length, 'gri', 'asteptare'], ['În coadă / oferite', ts.filter((t) => ['oferit', 'disponibil'].includes(t.stare) && t.spec !== 'motor').length, 'alb', 'oferit'], ['Fără specialist', ts.filter((t) => t.stare === 'escaladat').length, 'rosu', 'escaladat'], ['În lucru', ts.filter((t) => t.stare === 'atribuit').length, 'galben', 'atribuit'], ['Cu problemă', ts.filter((t) => ['blocat', 'esuat'].includes(t.stare)).length, 'rosu', 'problema'], ['Termen depășit', ts.filter((t) => slaInfo(t).stare === 'late').length, 'rosu', 'late'], ['Gata', ts.filter((t) => t.stare === 'terminat').length, 'verde', 'terminat']];
  const box = (x, a) => '<div class="fn ' + x[2] + (x[1] ? '' : ' zero') + '" data-a="fl" data-id="' + a + '"><b>' + x[1] + '</b><span>' + x[0] + '</span></div>';
  return '<p class="mut small">Comenzi (' + os.length + ')</p><div class="fl">' + st.map((x) => box(x, 'o:' + x[3])).join('<i>→</i>') + '</div><p class="mut small">Pași de lucru (' + ts.length + ')</p><div class="fl">' + tn.map((x) => box(x, 't:' + x[3])).join('<i>→</i>') + '</div>';
}
function panou() {
  const os = L('comenzi'), ts = L('taskuri'); const d0 = new Date(now()).setHours(0, 0, 0, 0);
  const al = alertsList();
  if (SYNC.on && !os.length) return '<h2>Panou</h2><div class="card info"><b>Baza comună e goală.</b> Încarcă datele de test (20 de comenzi, 8 specialiști, servicii, contracte) ca să vezi platforma funcționând; le poți reseta oricând din Setări.<br><br>' + btn('seedremote', 'Încarcă datele de test în baza comună', { c: 'pri' }) + '</div>';
  return '<h2>Panou</h2><div class="kpis">' + kpi(os.filter((o) => ['activa', 'in_asteptare_acord'].includes(o.stare)).length, 'comenzi active', '', 'comenzi') + kpi(ts.filter((t) => t.stare === 'atribuit').length, 'pași în lucru') + kpi(ts.filter((t) => slaInfo(t).stare === 'late').length + ts.filter((t) => t.stare === 'escaladat').length, 'depășite / fără specialist', ts.some((t) => slaInfo(t).stare === 'late' || t.stare === 'escaladat') ? 'rosu' : '') + kpi(L('probleme', (p) => p.stare !== 'rezolvata').length, 'probleme', '', 'probleme') + kpi(lei(L('plati', (p) => p.capturata_la >= d0).reduce((a, p) => a + p.suma, 0)), 'încasat azi', '', 'plati') + '</div>' +
    sec('Fluxul', flow()) + sec('De rezolvat acum (' + al.length + ')', al.length ? '<ul class="al2">' + al.map((a) => '<li class="' + a[0] + '" data-a="go2" data-id="' + a[2] + '">' + esc(a[1]) + '</li>').join('') + '</ul>' : '<p class="mut">Nimic urgent.</p>');
}
function comenziList(readOnly) {
  const F = UI.f.c || {};
  let os = L('comenzi').sort((a, b) => b.creata_la - a.creata_la);
  if (F.etapa) os = os.filter((o) => (F.etapa === 'neplatita' ? ['neconfirmata', 'in_asteptare_acord'].includes(o.stare) : etapa(o) === F.etapa));
  if (F.judet) os = os.filter((o) => o.judet === F.judet);
  os = filtreComenzi(os, F);
  if (F.q) os = os.filter((o) => (o.nr + imoText(D('imobile')[o.imobile[0]]) + clName(o) + D('clienti')[o.client].email).toLowerCase().includes(F.q.toLowerCase()));
  const sel = (k, opts, ph) => '<select data-i="fc_' + k + '"><option value="">' + ph + '</option>' + opts.map((o) => '<option value="' + o[0] + '"' + (F[k] === o[0] ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select>';
  const rows = os.map((o) => {
    const im = D('imobile')[o.imobile[0]]; const pl = L('plati', (p) => p.comanda === o.id).pop(); const svc = L('linii', (l) => l.comanda === o.id && !l.incl && l.stare !== 'anulat').map((l) => svName(l.svc)).join(', ');
    return '<div class="crd" data-a="open" data-id="' + o.id + '"><div><b>' + o.nr + '</b>' + (o.urgent ? ' ' + tag('urgent', 'rosu') : '') + ' <span class="small mut">' + hhmm(o.creata_la) + ' · ' + esc(clName(o)) + '</span></div><div class="small">' + esc(svc) + ' · ' + imoText(im) + (o.imobile.length > 1 ? ' <span class="mut">+' + (o.imobile.length - 1) + '</span>' : '') + '</div><div class="crdj"><span>' + fluxMini(o.id) + '</span><span class="small">' + (pl ? chip(pl.stare) + ' ' + lei(pl.suma) : '—') + ' ' + termenOrder(o) + '</span></div></div>';
  });
  return '<h2>Comenzi <span class="mut">(' + os.length + ')</span></h2>' + kpiFiltre(F.semn) + '<div class="filt">' + sel('etapa', [['neplatita', 'Neplătite'], ['primita', 'Primite'], ['in_lucru', 'În lucru'], ['livrata', 'Livrate'], ['inchisa', 'Închise']], 'Toate') + sel('judet', JUDETE.map((j) => [j, j]), 'Județ') + '<input data-i="fc_q" placeholder="caută nr, client, CF" value="' + esc(F.q || '') + '">' + filtreExtra(F) + (readOnly || SYNC.on ? '' : btn('nou', '+ Comandă de test')) + '</div>' +
    '<div class="clist">' + rows.join('') + '</div>';
}
function comandaDetaliu(oid, readOnly) {
  const o = D('comenzi')[oid]; if (!o) return '<p>Comandă inexistentă.</p>';
  const cl = D('clienti')[o.client]; const lines = L('linii', (l) => l.comanda === oid); const pays = L('plati', (p) => p.comanda === oid); const tasks = orderTasks(oid);
  const docs = L('documente', (d) => d.comanda === oid);
  const rows = lines.map((l) => {
    const ts = tasks.filter((t) => t.linie === l.id);
    return '<tr class="lh"><td colspan="5"><b>' + esc(svName(l.svc)) + '</b> ' + chip(l.stare) + (l.incl ? ' <span class="mut small">necesar, inclus</span>' : '') + ' <span class="mut small">' + (l.pret != null ? lei(l.pret) : 'la ofertă') + (o.imobile.length > 1 ? ' · ' + imoText(D('imobile')[l.imobil]) : '') + '</span></td></tr>' +
      ts.map((t) => { const ofr = L('oferte', (x) => x.task === t.id && x.raspuns === 'deschisa')[0]; const fd = docs.filter((d) => d.task === t.id); return '<tr><td style="padding-left:' + (12 + (t.dep.length ? 14 : 0)) + 'px">' + esc(t.n) + '</td><td>' + (t.specialist ? esc(spName(t.specialist)) : ofr ? '<span class="mut">oferit → ' + esc(spName(ofr.spec)) + '</span>' : t.spec === 'motor' ? '<span class="mut">automat</span>' : '<span class="mut">' + SPEC[t.spec] + '</span>') + '</td><td>' + chip(t.stare) + ' ' + termen(t) + '</td><td>' + (fd.length ? fd.map((d) => '<span class="chip verde">✓ ' + esc(d.nume) + '</span>').join(' ') : t.reqFiles.filter((f) => f.req).length && t.stare !== 'terminat' ? '<span class="mut small">se așteaptă: ' + t.reqFiles.filter((f) => f.req).map((f) => f.label).join(', ') + '</span>' : '') + '</td><td>' + (readOnly ? '' : taskActions(t)) + '</td></tr>'; }).join('');
  });
  const acord = o.acord === true ? tag('acord dat ' + hhmm(o.acord_la), 'verde') : tag('fără acord de executare imediată', 'rosu');
  return '<div class="back" data-a="nav" data-id="comenzi">← Comenzi</div><h2>' + o.nr + ' ' + chip(['neconfirmata', 'in_asteptare_acord', 'nou'].includes(o.stare) ? o.stare : etapa(o)) + (o.urgent ? ' ' + tag('urgent', 'rosu') : '') + ' ' + termenOrder(o) + '</h2><p class="rez"><b>' + esc(lines.filter((l) => !l.incl && l.stare !== 'anulat').map((l) => svName(l.svc)).join(', ')) + '</b><br>' + imoText(D('imobile')[o.imobile[0]]) + ' · ' + esc(cl.nume) + '</p>' + (readOnly ? '' : urmatorHtml(o)) + fluxHtml(oid) +
    (readOnly ? '' : '<div class="btns">' + btn('scrie', 'Scrie clientului', { id: oid }) + '</div>') +
    plia('date', 'Detalii comandă și client', (readOnly ? '' : '<div class="btns">' + btn('ascl', 'Vezi ca și clientul', { id: o.nr }) + btn('inchide', 'Închide comanda', { id: oid, dis: o.stare === 'inchisa' }) + '</div>') + '<div class="g2">' + sec('Comandă', '<dl class="dl"><dt>Plasată</dt><dd>' + hhmm(o.creata_la) + '</dd><dt>Plătită</dt><dd>' + (o.plata_la ? hhmm(o.plata_la) : '—') + '</dd><dt>Imobil</dt><dd>' + o.imobile.map((i) => imoText(D('imobile')[i])).join('<br>') + '</dd><dt>Județ</dt><dd>' + esc(o.judet) + '</dd><dt>Total</dt><dd>' + lei(o.total) + (o.credit ? ' <span class="mut">(scăzut extrasul din ' + o.credit + ')</span>' : '') + '</dd><dt>Retragere 14 zile</dt><dd>' + acord + '</dd></dl>') +
    sec('Client', '<dl class="dl"><dt>Nume</dt><dd>' + esc(cl.nume) + (cl.tip === 'PJ' ? ' ' + tag('firmă') : '') + '</dd><dt>Email</dt><dd>' + esc(cl.email) + '</dd><dt>WhatsApp</dt><dd>' + (cl.wa_optin ? esc(cl.wa) + ' ' + tag('opt-in', 'verde') : '<span class="mut">fără</span>') + '</dd><dt>Facturare</dt><dd>' + esc(cl.facturare || 'persoană fizică') + '</dd></dl>') + '</div>' +
    sec('Plăți', tbl(['Când', 'Sumă', 'Stare', 'Factură', ''], pays.map((p) => '<tr><td>' + hhmm(p.la) + '<br><span class="mut small">' + p.proc + (p.tx ? ' · ' + p.tx : '') + '</span></td><td>' + lei(p.suma) + (p.rambursat ? '<br><span class="mut small">rambursat ' + lei(p.rambursat) + '</span>' : '') + '</td><td>' + chip(p.stare) + (p.motiv ? '<br><span class="mut small">' + esc(p.motiv) + '</span>' : '') + '</td><td>' + (p.factura ? p.factura.nr + ' · SPV ' + p.factura.spv : '—') + '</td><td>' + (readOnly ? '' : payActions(p)) + '</td></tr>')) + (!readOnly && L('plati', (p) => p.comanda === oid && p.stare === 'esuata').length && !L('plati', (p) => p.comanda === oid && p.stare === 'capturata').length ? btn('reia', 'Reia plata (ca și clientul)', { id: oid }) : '')) +
    '') +
    plia('pasi', 'Toți pașii · ' + progress(oid), tbl(['Pas', 'Cine', 'Stare', 'Documente', ''], rows)) +
    (readOnly || !docs.length ? '' : sec('Documente (' + docs.length + ')', tbl(['Document', 'De la', 'Când', 'Clientul îl vede'], docs.map((d) => '<tr><td>' + docLinie(d) + '</td><td>' + esc(spName(d.incarcat_de)) + '</td><td>' + hhmm(d.la) + '</td><td>' + (d.vizibil ? tag('da', 'verde') : tag('nu încă')) + '</td></tr>')))) +
    '<details class="card"><summary>Istoric (' + eventsOfOrder(oid).length + ')</summary><ul class="tl">' + eventsOfOrder(oid).map(evLine).join('') + '</ul></details>';
}
function taskActions(t) {
  if (['terminat', 'anulat', 'asteptare'].includes(t.stare)) return '';
  if (t.stare === 'esuat') return btn('retry', 'Reia', { id: t.id, c: 'mic' });
  if (t.spec === 'motor') return '';
  if (UI.role === 'operator') return btn('oppas', 'Lucrează', { id: t.id, c: 'mic pri' });
  const sp = L('specialisti', (s) => s.status === 'activ' && s.spec.includes(t.spec) && !s.sistem);
  return '<select data-i="fa|' + t.id + '"><option value="">atribuie…</option>' + sp.map((s) => '<option value="' + s.id + '">' + esc(s.nume) + '</option>').join('') + '</select> ' + (t.stare === 'escaladat' ? btn('requeue', 'Reîncearcă', { id: t.id, c: 'mic' }) : btn('retrage', 'Retrage', { id: t.id, c: 'mic' }));
}
function payActions(p) {
  const a = [];
  if (p.stare === 'initiata') a.push(btn('pcap', 'Confirmă plata (webhook)', { id: p.id, c: 'mic pri' }));
  if (p.stare === 'capturata' && !p.factura) a.push(btn('pfact', 'Emite factura', { id: p.id, c: 'mic' }));
  if (p.factura && p.factura.spv === 'trimisa') a.push(btn('spv', 'SPV ok', { id: p.id, x: 'acceptata', c: 'mic' }), btn('spv', 'SPV respinsă', { id: p.id, x: 'respinsa', c: 'mic' }));
  if (['capturata', 'rambursata_part'].includes(p.stare)) a.push(btn('pref', 'Rambursează', { id: p.id, c: 'mic' }));
  return a.join(' ');
}

/* --- specialiști --- */
const REQ_C = ['neconcurenta', 'prestari', 'atestat', 'facturare'];
function contractOk(sid) { return REQ_C.every((tip) => L('contracte', (c) => c.spec === sid && c.tip === tip && c.expira_la > now())[0]); }
function specialistiList() {
  const rows = L('specialisti', (s) => !s.sistem).map((s) => { const st = statsOf(s.id); return '<tr class="rl" data-a="spd" data-id="' + s.id + '"><td><b>' + esc(s.nume) + '</b><br><span class="mut small">' + SPEC[s.spec[0]] + ' · ' + esc(s.judete.join(', ')) + '</span></td><td>' + chip(s.status) + (s.status === 'activ' && !s.tura ? ' ' + tag('nu e în tură') : '') + '</td><td>' + load(s) + '/' + s.cap + '</td><td>' + st.total + '</td><td>' + fmtD(st.medie) + '</td><td>' + (st.pierdute ? tag(st.pierdute + ' pierdute', 'rosu') : st.tardive ? tag(st.tardive + ' cu întârziere', 'galben') : tag('în termen', 'verde')) + '</td><td>' + (contractOk(s.id) ? tag('complete', 'verde') : tag('incomplete', 'galben')) + '</td></tr>'; });
  return '<h2>Specialiști</h2><div class="btns">' + btn('spnou', '+ Specialist nou') + '</div>' + tbl(['Specialist', 'Stare', 'În lucru', 'Rezolvate', 'Timp mediu', 'Termene', 'Contracte'], rows);
}
function specialistDetaliu(sid) {
  const s = D('specialisti')[sid]; if (!s) return ''; const st = statsOf(sid); const cs = L('contracte', (c) => c.spec === sid); const ok = contractOk(sid);
  const crow = REQ_C.map((tip) => { const c = cs.filter((x) => x.tip === tip).sort((a, b) => b.expira_la - a.expira_la)[0]; const v = c && c.expira_la > now(); return '<tr><td>' + CONTRACTE_TIP[tip] + '</td><td>' + (c ? (v ? tag('semnat ' + fmtT(c.semnat_la).slice(0, 10), 'verde') + ' <span class="mut small">expiră ' + fmtT(c.expira_la).slice(0, 10) + '</span>' : tag('expirat', 'rosu')) : tag('lipsește', 'rosu')) + '</td><td>' + (tip === 'neconcurenta' || tip === 'prestari' ? btn('ctpl', 'Generează precompletat', { id: sid, x: tip, c: 'mic' }) : '') + ' ' + btn('cup', 'Încarcă semnat', { id: sid, x: tip, c: 'mic' }) + '</td></tr>'; });
  const hist = L('taskuri', (t) => t.specialist === sid).sort((a, b) => (b.terminat_la || b.acceptat_la || 0) - (a.terminat_la || a.acceptat_la || 0)).slice(0, 20);
  return '<div class="back" data-a="nav" data-id="specialisti">← Specialiști</div><h2>' + esc(s.nume) + ' ' + chip(s.status) + '</h2><div class="btns">' +
    (s.status !== 'activ' ? btn('valid', 'Validează', { id: sid, c: 'pri', dis: !ok, t: ok ? '' : 'Lipsesc contracte' }) : btn('susp', 'Suspendă', { id: sid, c: 'war' })) + btn('spedit', 'Editează', { id: sid }) + btn('asspec', 'Vezi ca specialist', { id: sid }) + '</div>' +
    (!ok ? '<p class="mut">Nu poate fi validat: lipsesc ' + REQ_C.filter((tip) => !cs.some((c) => c.tip === tip && c.expira_la > now())).map((t) => CONTRACTE_TIP[t]).join(', ') + '.</p>' : '') +
    '<div class="g2">' + sec('Date', '<dl class="dl"><dt>Specialitate</dt><dd>' + s.spec.map((x) => SPEC[x]).join(', ') + '</dd><dt>Județe</dt><dd>' + esc(s.judete.join(', ')) + '</dd><dt>Atestat</dt><dd>' + esc(s.atestat) + '</dd><dt>Contact</dt><dd>' + esc(s.tel) + ' · ' + esc(s.email) + '</dd><dt>Capacitate</dt><dd>' + s.cap + ' în același timp</dd></dl>') + sec('Contoare', countersHtml(st)) + '</div>' +
    sec('Contracte', tbl(['Document', 'Stare', ''], crow)) +
    sec('Ultimele taskuri', tbl(['Pas', 'Comandă', 'Stare', 'Durată', 'Tarif'], hist.map((t) => '<tr><td>' + esc(t.n) + '</td><td>' + orderOf(t).nr + '</td><td>' + chip(t.stare) + ' ' + termen(t) + '</td><td>' + (t.terminat_la && !t.terta ? fmtD((t.terminat_la - t.acceptat_la) / MIN) : '') + '</td><td>' + lei(t.tarif) + '</td></tr>'))) +
    sec('Sugestiile lui', tbl(['Sugestie', 'Stare', ''], st.sugestii.map((x) => '<tr><td>' + esc(x.text) + ' <span class="mut small">' + x.cat + '</span></td><td>' + tag(x.stare, x.stare === 'noua' ? 'galben' : x.stare === 'respinsa' ? 'gri' : 'verde') + '</td><td>' + ['acceptata', 'respinsa', 'implementata'].map((v) => btn('sg', v, { id: x.id, x: v, c: 'mic' })).join(' ') + '</td></tr>')));
}
function countersHtml(st) {
  return '<div class="kpis sm">' + kpi(st.azi, 'azi') + kpi(st.saptamana, '7 zile') + kpi(st.total, 'total') + kpi(fmtD(st.medie), 'timp mediu') + kpi(fmtD(st.maxim), 'cel mai lung') + kpi(st.inLucru, 'în lucru acum') + kpi(st.deschise + '/' + st.probleme, 'probleme deschise/total', st.deschise ? 'rosu' : '') + kpi(st.acceptare != null ? st.acceptare + '%' : '–', 'oferte acceptate') + kpi(st.pierdute, 'pierdute prin depășire', st.pierdute ? 'rosu' : '') + kpi(lei(st.castig), 'de încasat') + '</div>' +
    (st.perTip.length ? '<p class="mut small">Pe tip: ' + st.perTip.map((x) => esc(x.n) + ' ' + fmtD(x.medie) + ' (' + x.nr + ')').join(' · ') + '</p>' : '');
}

/* --- plăți --- */
function platiView() {
  const ps = L('plati').sort((a, b) => b.la - a.la); const tm = now(); const d0 = new Date(tm).setHours(0, 0, 0, 0);
  const cap = ps.filter((p) => ['capturata', 'rambursata_part', 'rambursata'].includes(p.stare)); const sum = (f) => cap.filter(f).reduce((a, p) => a + p.suma, 0);
  return '<h2>Plăți</h2><div class="kpis">' + kpi(lei(sum((p) => p.capturata_la >= d0)), 'azi') + kpi(lei(sum((p) => p.capturata_la >= tm - 7 * ZI)), '7 zile') + kpi(lei(sum((p) => p.capturata_la >= tm - 30 * ZI)), '30 zile') + kpi(lei(ps.reduce((a, p) => a + p.rambursat, 0)), 'rambursat') + kpi(ps.filter((p) => p.stare === 'capturata' && !p.factura).length, 'fără factură', ps.some((p) => p.stare === 'capturata' && !p.factura) ? 'galben' : '') + kpi(ps.filter((p) => p.factura && p.factura.spv !== 'acceptata').length, 'SPV neacceptate') + '</div>' +
    tbl(['Comandă', 'Client', 'Când', 'Sumă', 'Stare', 'Tranzacție', 'Factură / SPV', ''], ps.map((p) => { const o = D('comenzi')[p.comanda]; return '<tr><td><a href="#" data-a="open" data-id="' + o.id + '">' + o.nr + '</a></td><td>' + esc(clName(o)) + '</td><td>' + hhmm(p.la) + '</td><td>' + lei(p.suma) + (p.rambursat ? '<br><span class="mut small">−' + lei(p.rambursat) + '</span>' : '') + '</td><td>' + chip(p.stare) + (p.motiv ? '<br><span class="mut small">' + esc(p.motiv) + '</span>' : '') + '</td><td class="small">' + (p.tx || '—') + '</td><td>' + (p.factura ? p.factura.nr + '<br><span class="mut small">SPV ' + p.factura.spv + '</span>' : '—') + '</td><td>' + payActions(p) + '</td></tr>'; }));
}
function decont() {
  const rows = []; let tot = 0;
  L('specialisti', (s) => !s.sistem).forEach((s) => { const e = R.db.evenimente.filter((x) => x.tip === 'task.terminat' && x.data.spec === s.id); const sum = e.reduce((a, x) => a + (x.data.tarif || 0), 0); tot += sum; rows.push('<tr><td>' + esc(s.nume) + '</td><td>' + SPEC[s.spec[0]] + '</td><td>' + e.length + '</td><td>' + lei(sum) + '</td></tr>'); });
  return sec('Decont specialiști (taskuri terminate × tarif din contract)', btn('csv', 'Exportă CSV', { c: 'mic' }) + tbl(['Specialist', 'Specialitate', 'Taskuri', 'De plătit'], rows.concat(['<tr><th colspan="3">Total</th><th>' + lei(tot) + '</th></tr>'])));
}
function platiRoleView() { return UI.view === 'decont' ? '<h2>Decont</h2>' + decont() : UI.view === 'detaliu' ? comandaDetaliu(UI.sel, true) : platiView(); }

/* --- probleme / ținte / setări --- */
function probleme() {
  const showAll = UI.f.pAll;
  const ps = L('probleme', (p) => showAll || p.stare !== 'rezolvata').sort((a, b) => b.la - a.la);
  const rows = ps.map((p) => { const t = D('taskuri')[p.task]; const o = D('comenzi')[t.comanda]; const neid = /neidentificabil/i.test(p.descr); return '<tr><td>' + chip(p.stare) + '</td><td><a href="#" data-a="open" data-id="' + o.id + '">' + o.nr + '</a><br><span class="mut small">' + esc(clName(o)) + '</span></td><td>' + esc(t.n) + '<br><span class="mut small">' + esc(spName(p.de)) + ' · ' + hhmm(p.la) + '</span></td><td><b>' + esc(p.tip) + '</b><br>' + esc(p.descr) + (p.rezolutie ? '<br><span class="mut small">→ ' + esc(p.rezolutie) + '</span>' : '') + '</td><td>' + (p.stare !== 'rezolvata' ? (t.stare === 'esuat' ? btn('retry', 'Reia automatul', { id: t.id, c: 'mic pri' }) + ' ' : '') + (neid ? btn('pcanc', 'Anulează + rambursează', { id: p.id, c: 'mic war' }) + ' ' : '') + btn('prez', 'Rezolvată', { id: p.id, c: 'mic' }) : '') + '</td></tr>'; });
  return '<h2>Probleme</h2><label class="inl"><input type="checkbox" data-i="fp_all"' + (showAll ? ' checked' : '') + '> arată și rezolvatele</label>' + tbl(['', 'Comandă', 'Pas', 'Problemă', ''], rows);
}
function tinte() {
  const t = L('tinte').sort((a, b) => parseInt(a.id.slice(1)) - parseInt(b.id.slice(1))); const n = (s) => t.filter((x) => x.stare === s).length;
  return '<h2>Ținte de rezolvat <span class="mut">' + n('deschis') + ' deschise · ' + n('in_lucru') + ' în lucru · ' + n('rezolvat') + ' rezolvate</span></h2><div class="btns">' + btn('tnou', '+ Țintă') + '</div>' +
    tbl(['#', 'Țintă', 'Componentă', 'Prioritate', 'Stare', 'Responsabil'], t.map((x) => '<tr><td><b>' + x.id + '</b></td><td>' + esc(x.titlu) + '<br><span class="mut small">' + esc(x.rezolvat) + '</span>' + (x.seed ? ' <a href="#" class="small" data-a="open2" data-id="' + x.seed + '">' + x.seed + '</a>' : '') + '</td><td class="small">' + esc(x.comp) + '</td><td>' + tag(x.prio, x.prio === 'critic' ? 'rosu' : x.prio === 'mare' ? 'galben' : 'gri') + '</td><td><select data-i="ti_' + x.id + '_stare">' + ['deschis', 'in_lucru', 'rezolvat'].map((s) => '<option value="' + s + '"' + (x.stare === s ? ' selected' : '') + '>' + s.replace('_', ' ') + '</option>').join('') + '</select></td><td><input data-i="ti_' + x.id + '_resp" value="' + esc(x.resp) + '" size="10"></td></tr>'));
}
function setari() {
  const S = D('settings');
  return '<h2>Setări</h2><div class="g2">' +
    sec('Cât stă o ofertă la un specialist (minute) [E]', '<div class="frm">' + SPEC_HUMAN.map((k) => '<label>' + SPEC[k] + '<input type="number" data-i="se_of_' + k + '" value="' + (S.ofertaMin[k] || 30) + '"></label>').join('') + '</div><p class="mut small">După expirare, oferta trece la următorul specialist; când nu mai e nimeni, comanda apare la „fără specialist”.</p>') +
    sec('Termene din contract [E]', '<p>De la preluare: <b>90 min</b> pentru extrase și verificări la cadastru, <b>3 h</b> pentru restul serviciilor de birou; teren: programare 24 h, livrare 48 h după vizită (doar alertă). La depășire pasul revine în coadă și specialistul primește „pierdut prin depășire”.</p><div class="frm"><label>Factor urgent<input type="number" step="0.1" data-i="se_urg" value="' + S.urgentFactor + '"></label><label>Problemă deschisă maxim (ore)<input type="number" data-i="se_pb" value="' + S.problemaMaxOre + '"></label></div>') + '</div>' +
    sec('Alocare automată (fără ofertă, prin rotație)', SPEC_HUMAN.map((k) => '<label class="inl"><input type="checkbox" data-i="se_auto_' + k + '"' + (S.autoAtribuire[k] ? ' checked' : '') + '> ' + SPEC[k] + '</label>').join('')) +
    sec('Mesaje către client', tbl(['Când', 'Email', 'WhatsApp'], Object.keys(TEMPLATES).map((k) => '<tr><td>' + k + '</td><td>' + esc(TEMPLATES[k].subj) + '<br><span class="mut small">' + esc(TEMPLATES[k].body) + '</span></td><td class="small">' + (TEMPLATES[k].wa || '—') + '</td></tr>'))) +
    sec('Date', '<div class="btns">' + btn('sb', 'Importă comenzile din site') + btn('reset', SYNC.on ? 'Încarcă datele de test în baza comună' : 'Resetează datele de test', { c: 'war' }) + '</div><p class="mut small">Importul citește tabelul comenzilor din Supabase dacă există `config.js`. Resetarea reface cele 20 de comenzi de test.</p>');
}

/* ---------- Tehnic ---------- */
function tehnicView() {
  if (UI.view === 'plan') return planView();
  if (UI.view === 'probleme') return probleme();
  if (UI.view === 'detaliu') return comandaDetaliu(UI.sel, true);
  if (UI.view === 'motor') { const bad = L('taskuri', (t) => t.stare === 'esuat'); return '<h2>Taskuri automate</h2><p class="mut">Rulează singure. Cele eșuate (sursă picată, OCR) așteaptă „Reia”.</p>' + tbl(['Comandă', 'Pas', 'Motiv', ''], bad.map((t) => '<tr><td>' + orderOf(t).nr + '</td><td>' + esc(t.n) + '</td><td>sursă indisponibilă</td><td>' + btn('retry', 'Reia', { id: t.id, c: 'mic pri' }) + '</td></tr>')); }
  return '<h2>Surse de date</h2>' + tbl(['Sursă', 'Pentru', 'Stare', 'Ultimul succes', ''], R.db.surse.map((s, i) => '<tr><td>' + esc(s.nume) + '</td><td>' + s.ce + '</td><td>' + chip(s.stare === 'esuat' ? 'esuata' : s.stare, s.stare) + '</td><td>' + hhmm(s.ultim_ok) + '</td><td>' + ['ok', 'degradat', 'esuat'].map((x) => btn('src', x, { id: i, x: x, c: 'mic' })).join(' ') + '</td></tr>'));
}

/* ---------- Plan de execuție (din site/plan-executie.json → colecția „plan” din Supabase; plan.js = copia locală) ---------- */
const PLAN_PR = { P0: 'rosu', P1: 'galben', P2: 'alb', P3: 'gri' };
const PLAN_ST = { done: ['gata', 'verde'], doing: ['în lucru', 'galben'], blocked: ['blocat', 'rosu'], todo: ['de făcut', 'gri'] };
function planView() {
  const remote = Object.values(D('plan') || {});
  const pasi = remote.length ? remote : (typeof PLAN_LOCAL !== 'undefined' ? PLAN_LOCAL.pasi : []);
  if (!pasi.length) return '<h2>Plan de execuție</h2><p class="mut">Planul nu e încă în baza comună.</p>';
  const cine = UI.f.planWho || (UI.role === 'tehnic' ? 'Silviu' : 'toti'), arata = UI.f.planSt || 'deschise';
  const by = {}; pasi.forEach((p) => (by[p.id] = p));
  const lst = pasi.filter((p) => (cine === 'toti' || p.who === cine) && (arata === 'toate' || p.s !== 'done'));
  const ord = { P0: 0, P1: 1, P2: 2, P3: 3 };
  lst.sort((a, b) => ord[a.p] - ord[b.p] || (b.imp || 0) - (a.imp || 0));
  const mine = pasi.filter((p) => cine === 'toti' || p.who === cine);
  const deschise = mine.filter((p) => p.s !== 'done');
  const filtre = '<div class="btns">' + [['toti', 'Toți'], ['Silviu', 'Silviu'], ['Manu', 'Manu'], ['Claude', 'Claude'], ['Avocat', 'Avocat']].map((w) => btn('planf', w[1], { id: w[0], c: 'mic' + (cine === w[0] ? ' pri' : '') })).join(' ') + ' · ' + [['deschise', 'Deschise'], ['toate', 'Toate']].map((w) => btn('plans', w[1], { id: w[0], c: 'mic' + (arata === w[0] ? ' pri' : '') })).join(' ') + '</div>';
  const rows = lst.map((p) => {
    const dep = (p.deps || []).map((d) => (by[d] && by[d].s !== 'done' ? '<span class="rosu-t">' + esc(d) + '</span>' : esc(d))).join(', ');
    return '<tr><td>' + tag(p.p, PLAN_PR[p.p]) + '</td><td><b>' + esc(p.id) + '</b></td><td>' + esc(p.t) + (p.gc ? '<div class="small mut">Gata când: ' + esc(p.gc) + '</div>' : '') + (p.blk && p.s !== 'done' ? '<div class="small rosu-t">Blocat: ' + esc(p.blk) + '</div>' : '') + '</td><td>' + esc(p.who) + '</td><td>' + tag(PLAN_ST[p.s][0], PLAN_ST[p.s][1]) + '</td><td class="small">' + (dep || '—') + '</td></tr>';
  });
  return '<h2>Plan de execuție' + (cine !== 'toti' ? ' · ' + esc(cine) : '') + '</h2><p class="mut small">Sursa: site/plan-executie.json, actualizat la fiecare commit · ' + (remote.length ? 'din baza comună' : 'copie locală') + ' · cockpitul complet: <a href="https://claude.ai/artifact/AB7n3eTGNsBWn3D67fyada" target="_blank" rel="noopener">deschide ↗</a></p>' +
    '<div class="kpis">' + kpi(deschise.length, 'pași deschiși') + kpi(deschise.filter((p) => p.p === 'P0').length, 'P0 (drumul critic)', 'rosu') + kpi(deschise.filter((p) => p.s === 'blocked').length, 'blocați', deschise.some((p) => p.s === 'blocked') ? 'rosu' : '') + kpi(mine.filter((p) => p.s === 'done').length, 'gata', 'verde') + '</div>' +
    filtre + tbl(['Prior.', 'Pas', 'Ce', 'Cine', 'Stare', 'După'], rows);
}

/* ---------- Sales ---------- */
function salesView() {
  if (UI.view === 'comenzi') return comenziList(true);
  if (UI.view === 'detaliu') return comandaDetaliu(UI.sel, true);
  if (UI.view === 'cosuri') return '<h2>Coșuri abandonate</h2>' + tbl(['Când', 'Email', 'Imobil', 'Servicii', 'Total', ''], R.db.cosuri.map((c) => '<tr><td>' + hhmm(c.la) + '</td><td>' + esc(c.email) + '</td><td>' + esc(c.cf ? 'CF ' + c.cf : c.adresa) + ', ' + esc(c.uat) + '</td><td class="small">' + c.servicii.map(svName).join(', ') + '</td><td>' + lei(c.total) + '</td><td>' + (c.reminder ? tag('reminder trimis', 'verde') : btn('rem', 'Trimite reminder', { id: c.id, c: 'mic pri' })) + '</td></tr>'));
  if (UI.view === 'oferte') {
    const ls = L('linii', (l) => l.tip === 'oferta').sort((a, b) => a.id.localeCompare(b.id));
    return '<h2>Cereri de ofertă</h2><p class="mut">Cotezi → trimiți clientului → clientul acceptă și plătește → pasul intră la specialist.</p>' + tbl(['Comandă', 'Client', 'Serviciu', 'Stare', 'Preț', ''], ls.map((l) => { const o = D('comenzi')[l.comanda]; const q = L('oferte_pret', (x) => x.linie === l.id)[0]; let act = '';
      if (l.stare === 'cerere') act = '<input type="number" data-i="qp_' + l.id + '" value="' + (QUOTE_DEFAULT[l.svc] || 300) + '" size="6"> lei ' + btn('cot', 'Cotează', { id: l.id, c: 'mic pri' });
      else if (l.stare === 'cotata') act = q && !q.trimis_la ? btn('qsend', 'Trimite clientului', { id: q.id, c: 'mic pri' }) : '<span class="mut small">așteaptă clientul</span> ' + btn('qacc', 'clientul acceptă (test)', { id: q.id, c: 'mic' });
      return '<tr><td>' + o.nr + '</td><td>' + esc(clName(o)) + '</td><td>' + svName(l.svc) + '</td><td>' + chip(l.stare) + '</td><td>' + (l.pret != null ? lei(l.pret) : '—') + '</td><td>' + act + '</td></tr>'; }));
  }
  const g = {}; L('comenzi').forEach((o) => (g[o.client] = (g[o.client] || []).concat(o)));
  const up = L('comenzi', (o) => L('linii', (l) => l.comanda === o.id && l.svc === 'cf' && l.stare === 'livrat').length && !L('linii', (l) => l.comanda === o.id && ['rAp', 'rInt'].includes(l.svc)).length && !L('comenzi', (x) => x.credit === o.nr).length);
  return '<h2>Clienți</h2>' + sec('Toți clienții', tbl(['Client', 'Email', 'Comenzi', 'Volum'], Object.keys(g).map((k) => { const c = D('clienti')[k]; return '<tr><td>' + esc(c.nume) + (c.tip === 'PJ' ? ' ' + tag('firmă') : '') + '</td><td>' + esc(c.email) + '</td><td>' + g[k].map((o) => o.nr).join(', ') + '</td><td>' + lei(g[k].reduce((a, o) => a + o.total, 0)) + '</td></tr>'; }))) +
    sec('De propus raportul (au extrasul, nu au raport)', tbl(['Comandă', 'Client', 'Imobil', 'Ofertă'], up.map((o) => '<tr><td>' + o.nr + '</td><td>' + esc(clName(o)) + '</td><td>' + imoText(D('imobile')[o.imobile[0]]) + '</td><td>raport apartament ' + lei(349 - 79) + ' (extrasul se scade)</td></tr>'))) +
    sec('Lista de așteptare (alertă CF)', tbl(['Email', 'CF', 'Când'], R.db.asteptare.map((a) => '<tr><td>' + esc(a.email) + '</td><td>' + a.cf + '</td><td>' + hhmm(a.la) + '</td></tr>')));
}

/* ---------- Specialist (mobil întâi: carduri, timer, cameră) ---------- */
const tNr = (t) => t.nr || (D('comenzi')[t.comanda] || {}).nr || '';
const tLa = (t) => t.comanda_la || (D('comenzi')[t.comanda] || {}).creata_la || t.creat_la;
/* timer live: data-end = momentul-limită (ms), data-tot = durata totală (min); textul și culoarea se actualizează la fiecare secundă */
const timer = (end, totMin, cls) => '<b class="tmr ' + (cls || '') + '" data-end="' + end + '" data-tot="' + (totMin || 0) + '">' + fmtClock(end - now()) + '</b>';
function fmtClock(ms) { const neg = ms < 0; ms = Math.abs(ms); const h = Math.floor(ms / 3600000), m = Math.floor(ms % 3600000 / 60000), s = Math.floor(ms % 60000 / 1000); const p = (x) => String(x).padStart(2, '0'); return (neg ? '+' : '') + (h ? h + ':' + p(m) : m) + ':' + p(s) + (neg ? ' depășit' : ''); }
function specView() {
  const s = D('specialisti')[UI.spec]; if (!s) return '<p>Profilul specialistului nu e disponibil.</p>';
  const nOf = L('oferte', (x) => x.spec === s.id && x.raspuns === 'deschisa').length;
  const head = '<div class="sph"><div><h2>' + esc(s.nume) + '</h2><span class="mut small">' + SPEC[s.spec[0]] + ' · ' + esc(s.judete.join(', ')) + '</span></div><label class="sw"><input type="checkbox" data-i="tura"' + (s.tura ? ' checked' : '') + '> primesc comenzi</label></div>' +
    (s.status !== 'activ' ? '<div class="card war">Contul nu e validat încă: primești comenzi după ce contractele sunt semnate de ambele părți. ' + (L('acte', (a) => a.dest_spec === s.id && a.stare === 'la_semnat').length ? btn('nav', 'Semnează contractele', { id: 'acte', c: 'pri mic' }) : '') + '</div>' : '') +
    cardNotificari() +
    (UI.alert ? '<div class="card nou" data-a="nav" data-id="disp"><b>' + esc(UI.alert) + '</b><br><span class="small">Deschide „Disponibile”</span></div>' : '');
  if (UI.view === 'task') return head + ticket(UI.sel);
  if (UI.view === 'acte') return head + specActeView();
  if (UI.view === 'contoare') { const st = statsOf(s.id); return head + sec('Contoarele mele', countersHtml(st)) + sec('Sugestii', '<div class="frm"><label>Categorie<select data-i="sg_cat">' + ['produs', 'flux', 'preț', 'sursă nouă', 'bug'].map((c) => '<option>' + c + '</option>').join('') + '</select></label><label>Sugestia ta<textarea data-i="sg_txt" rows="2"></textarea></label></div>' + btn('sgsend', 'Trimite', { c: 'pri' }) + (st.sugestii.length ? '<ul class="tl">' + st.sugestii.map((x) => '<li>' + esc(x.text) + ' ' + tag(x.stare, x.stare === 'noua' ? 'galben' : 'verde') + '</li>').join('') + '</ul>' : '')); }
  const card = (t, mode) => {
    const im = D('imobile')[t.imobil] || {}; const of = L('oferte', (x) => x.task === t.id && x.spec === s.id && x.raspuns === 'deschisa')[0];
    return '<div class="tc ' + (mode === 'mele' ? slaInfo(t).stare : '') + '"><div class="tch"><b>' + esc(t.n) + '</b>' + (t.urgent ? ' ' + tag('urgent', 'rosu') : '') + '</div>' +
      '<div class="small mut">' + tNr(t) + ' · comandă ' + hhmm(tLa(t)) + '</div><div>' + (im.cf ? 'CF ' + im.cf + ' · ' : '') + esc(im.adresa || '') + ', ' + esc(im.uat || '') + '</div>' +
      '<div class="tcf"><span>' + lei(t.tarif) + '</span>' +
      (mode === 'disp' && of ? '<span class="small mut">oferta expiră în ' + timer(of.expira_la, 0, 'mic') + '</span>' : '') +
      (mode === 'mele' && t.sla && !t.terta ? '<span>' + timer(t.acceptat_la + t.sla * MIN, t.sla) + '</span>' : mode === 'mele' && t.terta ? tag('așteaptă instituția', 'alb') : '') +
      (mode === 'term' ? '<span class="small mut">gata ' + hhmm(t.terminat_la) + (t.terta ? '' : ' · ' + fmtD((t.terminat_la - t.acceptat_la) / MIN)) + '</span>' : '') + '</div>' +
      '<div class="tcb">' + (mode === 'disp' ? btn('acc', 'Preiau', { id: t.id, c: 'pri mare' }) + btn('ref', 'Nu pot', { id: t.id, c: 'mare' }) : btn('tk', mode === 'mele' ? 'Lucrez' : 'Vezi', { id: t.id, c: mode === 'mele' ? 'pri mare' : 'mare' })) + '</div></div>';
  };
  if (UI.view === 'disp') { const ts = L('oferte', (x) => x.spec === s.id && x.raspuns === 'deschisa').map((x) => D('taskuri')[x.task]).filter(Boolean); return head + '<h3 class="lh2">Comenzi noi pentru tine (' + ts.length + ')</h3>' + (ts.length ? ts.map((t) => card(t, 'disp')).join('') : '<p class="mut">Nimic nou. Când primești o comandă, apare aici și sună telefonul.</p>'); }
  if (UI.view === 'mele') { const ts = L('taskuri', (t) => t.specialist === s.id && ['atribuit', 'blocat'].includes(t.stare)).sort((a, b) => (a.acceptat_la + a.sla * MIN) - (b.acceptat_la + b.sla * MIN)); return head + '<h3 class="lh2">În lucru (' + ts.length + ')' + (nOf ? ' · <a href="#" data-a="nav" data-id="disp">' + nOf + ' noi</a>' : '') + '</h3>' + (ts.length ? ts.map((t) => card(t, 'mele')).join('') : '<p class="mut">Nu ai nimic în lucru.</p>'); }
  const ts = L('taskuri', (t) => t.specialist === s.id && t.stare === 'terminat').sort((a, b) => b.terminat_la - a.terminat_la).slice(0, 40);
  return head + '<h3 class="lh2">Terminate (' + ts.length + ')</h3>' + ts.map((t) => card(t, 'term')).join('');
}
/* documentele de la pașii de care depinde pasul: verificarea și combinarea lucrează pe ele */
function documenteIntrare(t) {
  const vazut = {}, ids = []; const urca = (id) => { if (vazut[id]) return; vazut[id] = 1; const x = D('taskuri')[id]; if (!x) return; ids.push(id); x.dep.forEach(urca); };
  t.dep.forEach(urca);
  return L('documente', (d) => ids.includes(d.task));
}
function ticket(tid, op) {
  const t = D('taskuri')[tid]; if (!t) return '<p>Pasul nu mai e disponibil.</p>'; const im = D('imobile')[t.imobil] || {}; const ro = !((op || t.specialist === UI.spec) && ['atribuit', 'blocat'].includes(t.stare));
  const intrare = documenteIntrare(t);
  const probs = L('probleme', (p) => p.task === tid && p.stare !== 'rezolvata');
  const doneChk = t.check.filter((c) => c.ok).length, doneF = t.fields.filter((f) => f.val !== '' && f.val != null).length, doneD = t.reqFiles.filter((rf) => t.fisiere.some((x) => x.tip === rf.tip)).length;
  const files = t.reqFiles.map((rf) => { const up = t.fisiere.filter((x) => x.tip === rf.tip); return '<li class="fi"><span class="bx ' + (up.length ? 'on' : '') + '">' + (up.length ? '✓' : '') + '</span><div><b>' + esc(rf.label) + '</b>' + (rf.req ? ' <span class="mut small">obligatoriu</span>' : '') + (up.length ? '<div>' + up.map((u) => (D('documente')[u.doc] ? docLinie(D('documente')[u.doc]) : esc(u.nume)) + ' <span class="small mut">' + u.mb + ' MB</span>').join(' ') + '</div>' : '') +
    (ro ? '' : '<div class="upl"><label class="b">Atașează fișier<input type="file" hidden accept="application/pdf,image/*,text/plain" data-i="up|' + tid + '|' + rf.tip + '"></label><label class="b">Fă o poză<input type="file" hidden accept="image/*" capture="environment" data-i="up|' + tid + '|' + rf.tip + '"></label>' + (SYNC.on ? '' : ' <a href="#" class="small mut" data-a="demof" data-id="' + tid + '" data-x="' + rf.tip + '">fișier de test</a>') + '</div>') + '</div></li>'; }).join('');
  return (op ? '' : '<div class="back" data-a="nav" data-id="mele">← Înapoi</div>' + (D('comenzi')[t.comanda] ? '<h3 class="lh2">Unde e comanda</h3>' + fluxHtml(t.comanda, { task: tid, spec: true }) : '')) + '<div class="card tk"><div class="ch"><h3>' + esc(t.n) + '</h3>' + chip(t.stare) + '</div>' +
    (t.stare === 'atribuit' && t.sla && !t.terta ? '<div class="bigtmr">' + timer(t.acceptat_la + t.sla * MIN, t.sla) + '<span class="small mut">din ' + fmtD(t.sla) + ' de la preluare</span></div>' : '') +
    '<dl class="dl"><dt>Imobil</dt><dd>' + (im.cf ? '<b>CF ' + im.cf + '</b><br>' : '') + esc(im.adresa || '') + '<br>' + esc(im.uat || '') + ', ' + esc(im.judet || '') + '</dd><dt>Comanda</dt><dd>' + tNr(t) + ' · ' + hhmm(tLa(t)) + (t.urgent ? ' ' + tag('urgent', 'rosu') : '') + '</dd><dt>Încasezi</dt><dd><b>' + lei(t.tarif) + '</b></dd></dl>' + (im.pin ? '<div id="map" class="map" data-lat="' + im.pin[0] + '" data-lng="' + im.pin[1] + '"></div>' : '') + '</div>' +
    (probs.length ? '<div class="card war">' + probs.map((p) => '<b>' + esc(p.tip) + ':</b> ' + esc(p.descr)).join('<br>') + '<br><span class="small">Echipa rezolvă problema; până atunci pasul e blocat.</span></div>' : '') +
    '<div class="prog small"><span class="' + (doneChk === t.check.length ? 'ok' : '') + '">bife ' + doneChk + '/' + t.check.length + '</span><span class="' + (doneF === t.fields.length ? 'ok' : '') + '">câmpuri ' + doneF + '/' + t.fields.length + '</span><span class="' + (doneD === t.reqFiles.length ? 'ok' : '') + '">documente ' + doneD + '/' + t.reqFiles.length + '</span></div>' +
    (t.k === 'cf3' ? panouComparatie(t) : '') + (intrare.length ? sec('Documente de la pașii anteriori (' + intrare.length + ')', '<ul class="coada">' + intrare.map((d) => '<li>' + docLinie(d) + '<span class="small mut">' + esc(D('taskuri')[d.task] ? D('taskuri')[d.task].n : '') + '</span></li>').join('') + '</ul>') : '') +
    (t.check.length ? sec('De făcut', '<ul class="chk">' + t.check.map((c, i) => '<li><label><input type="checkbox" data-i="ck|' + tid + '|' + i + '"' + (c.ok ? ' checked' : '') + (ro ? ' disabled' : '') + '> ' + esc(c.t) + '</label></li>').join('') + '</ul>') : '') +
    (t.fields.length ? sec('Date de completat', '<div class="frm">' + t.fields.map((f, i) => '<label>' + esc(f.label) + (f.type === 'sel' ? '<select data-i="fd|' + tid + '|' + i + '"' + (ro ? ' disabled' : '') + '><option value="">—</option>' + f.opt.map((x) => '<option' + (f.val === x ? ' selected' : '') + '>' + x + '</option>').join('') + '</select>' : f.type === 'textarea' ? '<textarea rows="3" data-i="fd|' + tid + '|' + i + '"' + (ro ? ' disabled' : '') + '>' + esc(f.val) + '</textarea>' : '<input type="' + (f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text') + '" inputmode="' + (f.type === 'number' ? 'decimal' : 'text') + '" data-i="fd|' + tid + '|' + i + '" value="' + esc(f.val) + '"' + (ro ? ' disabled' : '') + '>') + '</label>').join('') + '</div>') : '') +
    (t.reqFiles.length ? sec('Documente', '<ul class="fl2">' + files + '</ul>') : '') +
    (ro ? '' : '<div class="btns stick">' + btn(op ? 'opfin' : 'fin', 'Am terminat → trimite', { id: tid, c: 'pri mare', dis: t.stare === 'blocat' }) + btn('pbm', 'Problemă', { id: tid, c: 'mare' }) + btn('ret', 'Nu pot continua', { id: tid, c: 'mare' }) + (SYNC.on ? '' : '<a href="#" class="small mut" data-a="fill" data-id="' + tid + '">completează de test</a>') + '</div>');
}
function mapInit() {
  const m = $('#map'); if (!m) return;
  const go = () => { try { const mp = window.L.map(m).setView([+m.dataset.lat, +m.dataset.lng], 16); window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OSM' }).addTo(mp); window.L.marker([+m.dataset.lat, +m.dataset.lng]).addTo(mp); } catch (e) { m.textContent = 'Harta nu s-a încărcat.'; } };
  if (window.L && window.L.map) { go(); return; }
  if (!document.getElementById('lfcss')) { const l = document.createElement('link'); l.id = 'lfcss'; l.rel = 'stylesheet'; l.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css'; document.head.appendChild(l); }
  const sc = document.createElement('script'); sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js'; sc.onload = go; sc.onerror = () => { m.textContent = 'Harta nu s-a încărcat.'; }; document.head.appendChild(sc);
}

/* ---------- Client ---------- */
function clientView() {
  const o = orderBy(UI.client); if (!o) return '<p>Alege o comandă.</p>';
  const cl = D('clienti')[o.client]; const ls = L('linii', (l) => l.comanda === o.id); const e = etapa(o); const pays = L('plati', (p) => p.comanda === o.id);
  const steps = [['primita', 'Primită'], ['in_lucru', 'În lucru'], ['livrata', 'Livrată']]; const idx = e === 'neplatita' ? -1 : e === 'inchisa' ? 2 : steps.findIndex((x) => x[0] === e);
  const bif = (l) => { const c = { cotata: 'galben', acceptata: 'galben', in_lucru: 'galben', livrat: 'verde', problema: 'rosu' }[l.stare] || 'gri'; return '<span class="bif ' + c + '">' + (l.stare === 'livrat' ? '✓' : l.stare === 'problema' ? '!' : '') + '</span>'; };
  const lineHtml = ls.map((l) => {
    const ts = L('taskuri', (t) => t.linie === l.id); const docs = L('documente', (d) => d.linie === l.id && d.vizibil); const ter = ts.filter((t) => t.teren);
    let extra = ''; if (ter.length) { const prog = ter.find((t) => /Programează/.test(t.n)); const efc = ter.find((t) => !/Programează/.test(t.n)); extra = '<div>' + tag('programat', prog && prog.stare === 'terminat' ? 'verde' : 'gri') + ' → ' + tag('efectuat', efc && efc.stare === 'terminat' ? 'verde' : 'gri') + '</div>'; }
    const prbl = L('probleme', (p) => p.stare !== 'rezolvata' && ts.some((t) => t.id === p.task))[0];
    const stTxt = { asteptare: 'în așteptare', platita: 'în așteptare', cerere: 'pregătim oferta', cotata: 'ai o ofertă', acceptata: 'așteaptă plata', in_lucru: 'în lucru', livrat: 'livrat', problema: 'avem nevoie de ceva de la tine', anulat: 'anulat' }[l.stare];
    const q = l.stare === 'cotata' ? L('oferte_pret', (x) => x.linie === l.id)[0] : null;
    return '<div class="ln">' + bif(l) + '<div class="lt"><b>' + esc(svName(l.svc)) + '</b> <span class="mut">· ' + stTxt + (l.pret != null && !l.incl ? ' · ' + lei(l.pret) : '') + '</span>' + extra +
      (docs.length ? '<div>' + docs.map((d) => '<a href="#" class="doc" data-a="dl" data-id="' + d.id + '">⬇ ' + esc(d.nume) + '</a>').join('') + '</div>' : '') +
      (prbl && l.stare === 'problema' ? '<div class="pbx">' + esc(prbl.descr) + '</div>' : '') +
      (q && q.trimis_la ? '<div class="pbx ok"><b>Ofertă: ' + lei(q.pret) + '</b> <label class="small"><input type="checkbox" data-i="cl_acord_q" checked> solicit începerea imediată; știu că după executare pierd dreptul de retragere</label><br>' + btn('qacc', 'Accept și plătesc', { id: q.id, c: 'pri mic' }) + ' ' + btn('qdec', 'Nu', { id: q.id, c: 'mic' }) + '</div>' : '') + '</div></div>';
  }).join('');
  const lastPay = pays[pays.length - 1]; const mesaje = toateMesajele().filter((m) => m.comanda === o.id);
  return '<div class="cp"><div class="cb">Serviciu privat de analiză. Nu suntem o instituție publică.</div><h2>Comanda ' + o.nr + '</h2><p class="mut">' + hhmm(o.creata_la) + ' · ' + imoLabel(o) + '</p>' +
    '<div class="trk">' + steps.map((st, i) => '<div class="' + (i <= idx ? 'on' : '') + (i === idx && idx < 2 ? ' cur' : '') + '"><b>' + (i < idx || idx === 2 ? '✓' : i + 1) + '</b>' + st[1] + '</div>').join('') + '</div>' +
    (e === 'neplatita' ? '<div class="pbx"><b>' + (o.stare === 'in_asteptare_acord' ? 'Ca să începem, confirmă că vrei executarea imediată.' : 'Plata nu s-a finalizat.') + '</b> ' + (lastPay && lastPay.stare === 'esuata' ? '<span class="mut">(' + esc(lastPay.motiv) + ')</span>' : '') + '<br><label class="small"><input type="checkbox" data-i="cl_acord"> Solicit începerea imediată a prestării. Știu că după executarea completă pierd dreptul de retragere; dacă mă retrag înainte, plătesc proporțional ce s-a prestat.</label><br>' + (o.stare === 'in_asteptare_acord' ? btn('cacord', 'Confirm', { id: o.id, c: 'pri' }) : btn('reia', 'Plătesc din nou', { id: o.id, c: 'pri' })) + '</div>' : '') +
    (idx >= 0 && idx < 2 ? '<p class="mut">Timp estimat: <b>' + fmtD(criticalPathMin(o.id)) + '</b></p>' : '') +
    '<div class="lns">' + lineHtml + '</div>' +
    '<p class="mut small">Primești un email la fiecare pas' + (cl.wa_optin ? ' și un mesaj pe WhatsApp' : '') + '. <a href="#" data-a="retr">Retrageți-vă din contract aici</a> (14 zile; nu se aplică serviciilor deja executate cu acordul tău).</p>' +
    '<div class="btns">' + btn('intreb', 'Am o întrebare', { id: o.id }) + '</div>' + (mesaje.length ? '<ul class="tl">' + mesaje.map((m) => '<li><time>' + hhmm(m.la) + '</time> <b>' + esc(m.de) + ':</b> ' + esc(m.text) + '</li>').join('') + '</ul>' : '') + '</div>';
}

/* ---------- Juridic: tipuri de contracte, drafturi, situația fiecărui semnatar, lista de rezolvat ---------- */
function semnatari() {
  const m = {};
  L('specialisti', (s) => !s.sistem).forEach((s) => (m['sp:' + s.id] = { key: 'sp:' + s.id, nume: s.nume, cal: 'colaborator', rol: SPEC[s.spec[0]], spec: s.id, email: s.email, tel: s.tel }));
  L('contracte', (c) => !c.spec && c.nume).forEach((c) => { const k = 'n:' + c.nume; if (!m[k]) m[k] = { key: k, nume: c.nume, cal: c.calitate || 'altul', rol: (CALITATI[c.calitate] || '').split(' (')[0], spec: null }; });
  return Object.values(m);
}
function docSemnat(p, tip) { const tm = now(); const cs = L('contracte', (c) => c.tip === tip && (p.spec ? c.spec === p.spec : c.nume === p.nume)).sort((a, b) => b.expira_la - a.expira_la); const c = cs[0]; if (!c) return { st: 'lipsa' }; if (c.expira_la < tm) return { st: 'expirat', c }; if (c.expira_la - tm < 30 * ZI) return { st: 'expira', c }; return { st: 'ok', c }; }
function juridic() {
  const tab = UI.f.jt || 'situatie';
  const tabs = [['situatie', 'Situația pe persoane'], ['acte', 'Acte de completat'], ['tipuri', 'Tipuri de contracte și drafturi'], ['rezolvat', 'De rezolvat (' + L('juridic', (x) => x.stare !== 'rezolvat').length + ')'], ['registru', 'Registrul semnăturilor']];
  const nav = '<div class="filt">' + tabs.map((t) => '<button class="b' + (tab === t[0] ? ' pri' : '') + '" data-a="jtab" data-id="' + t[0] + '">' + t[1] + '</button>').join(' ') + '</div>';
  let body = '';
  if (tab === 'situatie') {
    const ps = semnatari(); let complet = 0;
    const rows = ps.map((p) => { const need = DOC_NECESARE[p.cal] || ['neconcurenta']; const cells = need.map((tip) => { const d = docSemnat(p, tip); return d.st === 'ok' ? tag('✓ ' + DOC_NUME[tip], 'verde') : d.st === 'expira' ? tag(DOC_NUME[tip] + ' expiră ' + fmtT(d.c.expira_la).slice(0, 10), 'galben') : d.st === 'expirat' ? tag(DOC_NUME[tip] + ' expirat', 'rosu') : tag('lipsește: ' + DOC_NUME[tip], 'rosu'); }); const ok = need.every((tip) => docSemnat(p, tip).st === 'ok' || docSemnat(p, tip).st === 'expira'); if (ok) complet++;
      return '<tr><td><b>' + esc(p.nume) + '</b><br><span class="small mut">' + esc(p.rol || '') + '</span></td><td>' + (CALITATI[p.cal] || p.cal) + '</td><td>' + cells.join(' ') + '</td><td>' + (ok ? tag('complet', 'verde') : tag('de semnat', 'rosu')) + '</td><td>' + btn('jgen', 'Generează actele', { id: p.key, c: 'mic' }) + ' ' + (p.spec ? btn('actpachet', 'Trimite la semnat în app', { id: p.key, c: 'mic pri' }) + ' ' : '') + btn('jup', 'Încarcă semnat', { id: p.key, c: 'mic' }) + '</td></tr>'; });
    body = '<div class="kpis">' + kpi(ps.length, 'persoane') + kpi(complet, 'cu acte complete') + kpi(ps.length - complet, 'de semnat', ps.length - complet ? 'rosu' : '') + '</div><div class="btns">' + btn('jsem', '+ Persoană nouă (asociat, salariat, colaborator tehnic)') + '</div>' +
      tbl(['Persoană', 'Calitate', 'Documente (semnat / lipsește)', 'Stare', ''], rows) + '<p class="small mut">Ce trebuie semnat, pe calitate: specialist = acord + contract de colaborare + atestat + date facturare · colaborator tehnic = acord + contract de dezvoltare + date facturare · asociat = acord (Anexa B) + clauza în actul constitutiv · salariat = acord (Anexa C) + CIM. Specialistul nu primește comenzi până nu are actele complete.</p>';
  } else if (tab === 'acte') {
    body = acteView();
  } else if (tab === 'tipuri') {
    const draft = { da: ['draft gata', 'verde'], partial: ['draft parțial', 'galben'], nu: ['fără draft', 'rosu'] };
    const groups = [...new Set(CONTRACTE_CATALOG.map((c) => c[1]))];
    body = groups.map((g) => sec(g, CONTRACTE_CATALOG.filter((c) => c[1] === g).map((c) => '<div class="risc ' + draft[c[5]][1] + '"><div class="rh"><b>' + esc(c[2]) + '</b> ' + tag(draft[c[5]][0], draft[c[5]][1]) + '</div><div class="small"><span class="mut">Semnează:</span> ' + esc(c[3]) + '</div><div class="small"><span class="mut">La ce folosește:</span> ' + esc(c[4]) + '</div><div class="small"><span class="mut">Draft:</span> ' + esc(c[6]) + (['acord', 'colaborare', 'tehnic'].includes(c[0]) ? ' ' + btn('jtpl', 'Vezi draftul', { x: c[0] === 'acord' ? 'neconcurenta' : c[0] === 'colaborare' ? 'prestari' : 'tehnic', c: 'mic' }) : '') + '</div></div>').join(''))).join('') +
      '<p class="small mut">Textele sunt de lucru; varianta finală o validează avocatul partener. Analiza pe articole: <code>documente/20_JURIDIC_CONTRACTE.md</code>.</p>';
  } else if (tab === 'rezolvat') {
    const pr = { critic: 'rosu', mare: 'portocaliu', mediu: 'galben', mic: 'gri' };
    const items = L('juridic').sort((a, b) => (a.stare === 'rezolvat') - (b.stare === 'rezolvat') || Object.keys(pr).indexOf(a.prio) - Object.keys(pr).indexOf(b.prio));
    const cats = [...new Set(items.map((x) => x.cat))];
    body = sec('Adaugă', '<div class="frm">' + msel('jcat', 'Categorie', ['Întrebare pentru avocat', 'De verificat', 'De decis', 'De redactat', 'De rezolvat pe site', 'Situație apărută']) + mf('jtext', 'Ce e de rezolvat', 'text') + msel('jprio', 'Prioritate', ['critic', 'mare', 'mediu', 'mic'], 'mare') + '</div>' + btn('jadd', 'Adaugă', { c: 'pri' })) +
      cats.map((c) => sec(c, items.filter((x) => x.cat === c).map((x) => '<div class="risc ' + (x.stare === 'rezolvat' ? 'verde' : pr[x.prio]) + '"><div class="rh">' + tag(x.prio, pr[x.prio]) + ' ' + (x.stare === 'rezolvat' ? '<s>' + esc(x.text) + '</s>' : '<b>' + esc(x.text) + '</b>') + '</div><div class="small"><select data-i="ju|' + x.id + '|stare">' + ['deschis', 'in_lucru', 'rezolvat'].map((s) => '<option value="' + s + '"' + (x.stare === s ? ' selected' : '') + '>' + s.replace('_', ' ') + '</option>').join('') + '</select> responsabil <input data-i="ju|' + x.id + '|resp" value="' + esc(x.resp) + '" size="8"> notă <input data-i="ju|' + x.id + '|nota" value="' + esc(x.nota) + '" size="28"></div></div>').join(''))).join('');
  } else {
    const cs = L('contracte').sort((a, b) => b.semnat_la - a.semnat_la); const tm = now();
    body = tbl(['Semnatar', 'Calitate', 'Document', 'Semnat', 'Valabil până', 'Fișier'], cs.map((c) => '<tr><td>' + esc(c.nume || spName(c.spec)) + '</td><td>' + (CALITATI[c.calitate] || c.calitate || '—') + '</td><td>' + (CONTRACTE_TIP[c.tip] || c.tip) + '</td><td>' + fmtT(c.semnat_la).slice(0, 10) + '</td><td>' + (c.expira_la < tm ? tag('expirat', 'rosu') : c.expira_la - tm < 30 * ZI ? tag(fmtT(c.expira_la).slice(0, 10), 'galben') : tag(fmtT(c.expira_la).slice(0, 10), 'verde')) + '</td><td class="small">' + esc(c.fisier) + '</td></tr>'));
  }
  return '<h2>Contracte</h2>' + nav + body;
}

/* ---------- Arhitectură: secvența, motorul de date, lista de construit ---------- */
const ARH_PASI = [['Comandă, plată, acord', 'site + webhook plată', 'g'], ['Alocare + notificare specialist', 'aplicația de telefon, alertă', 'g'], ['Documente oficiale (CF, planuri)', 'PDF / poză din cameră', 'g'], ['Validare + extracție', 'PDF → fișa imobilului', 'r'], ['Căutări proaspete', 'instanțe, BPI, hărți, PUG, prețuri', 'r'], ['Încrucișare (reguli)', 'semafoare + întrebări', 'r'], ['Raport după standard', '7 capitole; AI doar redactează', 'r'], ['QA + avocat + filtru final', 'pași umani', 'g'], ['Livrare client', 'link + email + WhatsApp', 'g']];
const ARH_LISTA = [
  ['A', 'Backend real (Supabase) + comenzile din site intră automat; Turnstile + limită pe IP', 'partial'],
  ['A', 'Plata reală cu webhook; acord la plată; butonul „comandă ce implică o obligație de plată”', 'deschis'],
  ['A', 'Aplicația specialistului pe telefon + notificare la comandă nouă', 'partial'],
  ['A', 'Încărcare reală de fișiere: PDF și poză din cameră, stocare privată', 'partial'],
  ['A', 'Validarea automată a PDF-ului CF la încărcare (nr. CF, UAT, dată, pagini)', 'deschis'],
  ['A', 'Email de stare + SPF/DKIM/DMARC; factură cu SPV', 'deschis'],
  ['A', 'Pagina clientului reală + funcția „Retrageți-vă din contract aici”', 'partial'],
  ['B', 'Parser CF → fișa imobilului; OCR pentru scanări și poze', 'deschis'],
  ['B', 'Conectori de căutare care scriu constatări cu sursă și dată', 'deschis'],
  ['B', 'Motorul de încrucișare: primele ~15 reguli', 'deschis'],
  ['B', 'Generatorul de raport pe standardul cu 7 capitole → PDF', 'deschis'],
  ['B', 'AI pentru redactare constrânsă (doar din constatări citate)', 'deschis'],
  ['B', 'QA + filtru final automat + semnătura electronică a avocatului', 'deschis'],
  ['C', 'Contractele semnate electronic din platformă', 'partial'],
  ['C', 'Decontul și plata specialiștilor', 'partial'],
  ['C', 'WhatsApp Business cu șabloane aprobate', 'deschis'],
  ['C', 'Site: blog pe pagini, coș persistent, rescriere curată', 'deschis']
];
function arhitectura() {
  const col = { g: ['#FDF1D6', '#C2570C', '#8A5A00'], r: ['#FDE8E6', '#B3261E', '#B3261E'] };
  let y = 50, s = '<svg viewBox="0 0 680 ' + (50 + ARH_PASI.length * 76) + '" class="arh" role="img" aria-label="Secvența unei comenzi de raport"><defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M2 1L8 5L2 9" fill="none" stroke="#4D6178" stroke-width="1.5"/></marker></defs>';
  s += '<rect x="150" y="12" width="16" height="12" rx="3" fill="#FDF1D6" stroke="#C2570C"/><text x="172" y="22" class="al">există / simulat</text><rect x="320" y="12" width="16" height="12" rx="3" fill="#FDE8E6" stroke="#B3261E"/><text x="342" y="22" class="al">lipsește</text>';
  ARH_PASI.forEach((p, i) => { const c = col[p[2]]; s += '<rect x="150" y="' + y + '" width="380" height="56" rx="8" fill="' + c[0] + '" stroke="' + c[1] + '" stroke-width=".8"/><text x="340" y="' + (y + 22) + '" text-anchor="middle" class="at" fill="' + c[2] + '">' + (i + 1) + ' · ' + esc(p[0]) + '</text><text x="340" y="' + (y + 42) + '" text-anchor="middle" class="as" fill="' + c[2] + '">' + esc(p[1]) + '</text>'; if (i < ARH_PASI.length - 1) s += '<line x1="340" y1="' + (y + 56) + '" x2="340" y2="' + (y + 74) + '" stroke="#4D6178" marker-end="url(#ah)"/>'; y += 76; });
  s += '</svg>';
  const box = (x, y, w, t, st, f, k) => '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="56" rx="8" fill="' + f + '" stroke="' + k + '" stroke-width=".8"/><text x="' + (x + w / 2) + '" y="' + (y + 22) + '" text-anchor="middle" class="at" fill="' + k + '">' + t + '</text><text x="' + (x + w / 2) + '" y="' + (y + 42) + '" text-anchor="middle" class="as" fill="' + k + '">' + st + '</text>';
  const ar = (d) => '<path d="' + d + '" fill="none" stroke="#4D6178" marker-end="url(#ah2)"/>';
  let m = '<svg viewBox="0 0 680 500" class="arh" role="img" aria-label="Motorul de date de la CF la raport"><defs><marker id="ah2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M2 1L8 5L2 9" fill="none" stroke="#4D6178" stroke-width="1.5"/></marker></defs>';
  m += box(40, 20, 190, 'CF, plan, vecini', 'PDF sau poză', '#EEF2F6', '#4D6178') + ar('M230 48 L268 48') + box(270, 20, 170, 'Parser + OCR', 'validare, bifă verde', '#EEEDFE', '#3C3489') + ar('M440 48 L478 48') + box(480, 20, 160, 'Fișa imobilului', 'date structurate', '#EEEDFE', '#3C3489');
  m += ar('M560 76 L560 110 L230 110 L230 138') + box(40, 140, 380, 'Căutări proaspete, automate', 'nume → instanțe, BPI; cadastral → hărți, PUG', '#E1F5EE', '#085041') + box(480, 140, 160, 'Baza noastră', 'comenzi și date vechi', '#EEF2F6', '#4D6178');
  m += ar('M230 196 L230 228') + box(40, 230, 380, 'Constatări', 'fapt + sursă + dată + dovadă', '#E1F5EE', '#085041') + ar('M560 196 L560 318') + ar('M230 286 L230 318');
  m += box(40, 320, 600, 'Încrucișare: reguli deterministe', 'CF vs plan, proprietar vs vânzător, sarcini vs litigii', '#FAECE7', '#712B13') + ar('M230 376 L230 408');
  m += box(40, 410, 290, 'Raport standard', '7 capitole, semafoare', '#FAECE7', '#712B13') + ar('M330 438 L368 438') + box(370, 410, 270, 'AI redactează textul', 'doar din constatări citate', '#EEEDFE', '#3C3489') + '</svg>';
  const st = { deschis: ['de făcut', 'rosu'], partial: ['început', 'galben'], gata: ['gata', 'verde'] };
  const grup = { A: 'A · primul extras CF real, plătit și livrat', B: 'B · raportul (procesarea datelor)', C: 'C · operare și creștere' };
  let lista = ''; ['A', 'B', 'C'].forEach((g) => { lista += '<h4>' + grup[g] + '</h4><ol class="arhl" start="' + (ARH_LISTA.findIndex((x) => x[0] === g) + 1) + '">' + ARH_LISTA.filter((x) => x[0] === g).map((x) => '<li>' + esc(x[1]) + ' ' + tag(st[x[2]][0], st[x[2]][1]) + '</li>').join('') + '</ol>'; });
  return '<h2>Arhitectură</h2><p class="mut">Secvența unei comenzi de raport și ce lipsește. Sursa: <code>documente/12_ARHITECTURA_TEHNICA_FLUX.md</code> v2.2. AI nu decide: citește scanări (pasul 4) și redactează din fapte citate (pasul 7).</p>' +
    sec('Secvența comenzii', '<div class="arhw">' + s + '</div>') + sec('Motorul de date: de la CF la raport', '<div class="arhw">' + m + '</div>') + sec('Lista de construit, în ordinea importanței', lista);
}

/* ---------- Conturi (doar admin): creare, invitație, rol, blocare ---------- */
const ROL_TXT = { admin: 'Admin', operator: 'Operator', tehnic: 'Tehnic', sales: 'Sales', plati: 'Plăți', specialist: 'Specialist' };
function conturi() {
  if (UI.auth.rol !== 'admin') return '<h2>Conturi</h2><div class="card info">Conturile și rolurile le gestionează doar adminul. Contul tău e <b>' + esc(ROL_TXT[UI.auth.rol] || UI.auth.rol) + '</b>: vezi interfața de admin și lucrezi pe date ca tehnic, dar nu creezi conturi, nu schimbi roluri și nu blochezi pe nimeni (regula e și pe server).</div>';
  if (!SYNC.on) return '<h2>Conturi</h2><div class="card info">Conturile reale se gestionează când ești intrat cu contul tău (email + parolă). În modul demonstrativ nu există conturi: alegi rolul din listă.<br><br><b>Primul cont de admin:</b> pe ecranul de intrare → „Nu ai cont? Creează-l aici”, apoi rolul de admin se dă o singură dată din baza de date. După aceea, adminul creează toate celelalte conturi de aici.</div>';
  const sp = L('specialisti', (s) => !s.sistem);
  const spSel = (name, cur) => '<select data-m="' + name + '"><option value="">— specialist —</option>' + sp.map((s) => '<option value="' + s.id + '"' + (s.id === cur ? ' selected' : '') + '>' + esc(s.nume) + ' · ' + SPEC[s.spec[0]] + '</option>').join('') + '</select>';
  const rolSel = (name, cur) => '<select data-m="' + name + '">' + Object.keys(ROL_TXT).map((r) => '<option value="' + r + '"' + (r === cur ? ' selected' : '') + '>' + ROL_TXT[r] + '</option>').join('') + '</select>';
  const list = UI.conturi;
  const rows = (list || []).map((c) => '<tr><td><b>' + esc(c.nume || c.email) + '</b><br><span class="small mut">' + esc(c.email) + '</span></td><td>' + (c.rol ? tag(ROL_TXT[c.rol] + (c.specialist_id ? ' · ' + spName(c.specialist_id) : ''), c.rol === 'admin' ? 'alb' : 'gri') : tag('fără rol', 'galben')) + '</td><td>' + (c.blocat ? tag('blocat', 'rosu') : c.confirmat ? tag('activ', 'verde') : tag('invitație trimisă', 'galben')) + '</td><td class="small">' + (c.ultima ? hhmm(new Date(c.ultima).getTime()) : '—') + '</td><td>' + btn('controlm', 'Rol', { id: c.id, c: 'mic' }) + ' ' + btn('contreset', 'Resetare parolă', { id: c.email, c: 'mic' }) + ' ' + (c.id === SYNC.user.id ? '' : btn(c.blocat ? 'contdebloc' : 'contbloc', c.blocat ? 'Deblochează' : 'Blochează', { id: c.id, c: 'mic' + (c.blocat ? '' : ' war') })) + '</td></tr>');
  return '<h2>Conturi</h2><p class="mut">Fiecare persoană are contul ei. Rolul decide ce vede: specialistul doar comenzile alocate lui, sales și plăți fără documentele clienților, adminul tot.</p>' +
    sec('Cont nou', '<div class="frm">' + mf('email', 'Email', 'email') + mf('nume', 'Nume afișat') + '<label>Rol' + rolSel('rol', 'specialist') + '</label><label>Specialist (doar pentru rolul Specialist)' + spSel('spid', '') + '</label>' + mf('parola', 'Parolă inițială (opțional, minimum 8 caractere)', 'password') + '</div><p class="small mut">Fără parolă: persoana primește un email de invitație și își alege singură parola (recomandat). Cu parolă: contul e activ imediat și îi comunici tu parola.</p>' + btn('contnou', 'Creează contul', { c: 'pri' })) +
    sec('Conturi existente' + (list ? ' (' + list.length + ')' : ''), list ? tbl(['Persoană', 'Rol', 'Stare', 'Ultima intrare', ''], rows) : '<p class="mut">Se încarcă… ' + btn('conturiload', 'Reîncarcă', { c: 'mic' }) + '</p>');
}

/* ---------- Riscuri: ce poate pune platforma sau site-ul în cap ---------- */
const GRAV = { critic: ['Critic', 'rosu'], mare: ['Mare', 'portocaliu'], mediu: ['Mediu', 'galben'], mic: ['Mic', 'gri'] };
const STARE_R = { rezolvat: ['rezolvat', 'verde'], partial: ['parțial', 'galben'], deschis: ['deschis', 'rosu'] };
function riscuri() {
  const F = UI.f.r || 'toate'; const caps = [...new Set(RISCURI.map((r) => r[0]))]; const n = (g, s) => RISCURI.filter((r) => (!g || r[1] === g) && (!s || r[5] === s)).length;
  const sum = Object.keys(GRAV).map((g) => '<div class="kpi ' + GRAV[g][1] + '"><b>' + n(g, 'deschis') + ' / ' + n(g) + '</b><span>' + GRAV[g][0] + ' · deschise / total</span></div>').join('');
  const filt = '<div class="filt">' + [['toate', 'Toate'], ['deschis', 'Deschise'], ['partial', 'Parțiale'], ['rezolvat', 'Rezolvate']].map((x) => '<button class="b mic' + (F === x[0] ? ' pri' : '') + '" data-a="rfilt" data-id="' + x[0] + '">' + x[1] + '</button>').join(' ') + '</div>';
  const body = caps.map((c) => { const rs = RISCURI.filter((r) => r[0] === c && (F === 'toate' || r[5] === F)).sort((a, b) => Object.keys(GRAV).indexOf(a[1]) - Object.keys(GRAV).indexOf(b[1])); if (!rs.length) return ''; return sec(c + ' <span class="mut small">(' + rs.length + ')</span>', rs.map((r) => '<div class="risc ' + GRAV[r[1]][1] + '"><div class="rh">' + tag(GRAV[r[1]][0], GRAV[r[1]][1]) + ' <b>' + esc(r[2]) + '</b> ' + tag(STARE_R[r[5]][0], STARE_R[r[5]][1]) + '</div><div class="small"><span class="mut">Ce se întâmplă:</span> ' + esc(r[3]) + '</div><div class="small"><span class="mut">Ce facem:</span> ' + esc(r[4]) + '</div></div>').join('')); }).join('');
  return '<h2>Riscuri</h2><p class="mut">Ce poate opri sau compromite platforma și site-ul, pe capitole, ordonat după gravitate. Culoarea = gravitatea; eticheta din dreapta = starea.</p><div class="kpis">' + sum + '</div>' + filt + body;
}

/* ---------- Date: colecția CF (formularele specialiștilor + textul din PDF) ---------- */
function datePage() {
  const xs = colectie(); const nSal = Object.keys(R.db.fise || {}).length;
  const rows = xs.map((x) => { const f = x.form; const s = x.salvata; const pdf = (UI.pdfRes || {})[x.im.id] || (s && s.pdf); const dif = pdf ? compara(f, pdf) : [];
    const stare = !pdf ? tag('doar formular', 'gri') : dif.length ? tag(dif.length + ' diferențe', 'rosu') : tag('concordă cu PDF-ul', 'verde');
    return '<tr><td><b>' + (x.im.cf ? 'CF ' + x.im.cf : '—') + '</b><br><span class="small mut">' + esc(x.im.uat) + ' · ' + x.comenzi.join(', ') + '</span></td><td>' + esc(f.nr_cad || (pdf && pdf.nr_cad) || '—') + '</td><td>' + esc(f.suprafata || (pdf && pdf.suprafata) || '—') + '</td><td>' + esc(f.proprietari || (pdf && (pdf.proprietari || []).join(', ')) || '—') + '</td><td>' + esc(f.sarcini || (pdf && pdf.sarcini) || '—') + (pdf && pdf.sarcini_tipuri && pdf.sarcini_tipuri.length ? '<br><span class="small mut">' + pdf.sarcini_tipuri.join(', ') + '</span>' : '') + '</td><td>' + stare + (dif.length ? '<div class="small err">' + dif.map(esc).join('<br>') + '</div>' : '') + (s ? '<div class="small mut">în bază ' + hhmm(s.salvata_la) + '</div>' : '') + '</td><td>' + (x.docCF.length ? btn('pdfx', 'Citește PDF-ul', { id: x.im.id, x: x.docCF[0].id, c: 'mic' }) + ' ' : '') + btn('fisasave', s ? 'Actualizează în bază' : 'Salvează în bază', { id: x.im.id, c: 'mic pri' }) + '</td></tr>'; });
  return '<h2>Date · colecția CF</h2><p class="mut">Câte o fișă pe imobil: ce au completat specialiștii (nr. CF, cadastral, suprafață, proprietari cu inițiale, sarcini, acces) + textul citit automat din PDF-ul extrasului, comparate. Fișele salvate intră în baza comună (colecția „fise”) și se pot descărca. Parserul e pentru extrasul de informare standard; de verificat pe primele extrase reale [E].</p>' +
    '<div class="kpis">' + kpi(xs.length, 'imobile cu date') + kpi(nSal, 'fișe în bază') + kpi(xs.filter((x) => x.docCF.length).length, 'cu PDF de CF') + '</div>' +
    '<div class="btns">' + btn('fisetot', 'Salvează toată colecția în bază', { c: 'pri' }) + btn('fisejson', 'Descarcă JSON') + btn('fisecsv', 'Descarcă CSV (Excel)') + '<label class="b">Testează pe un PDF de CF<input type="file" hidden accept="application/pdf" data-i="pdftest"></label></div>' +
    (UI.pdfTest ? sec('Rezultatul citirii PDF-ului de test', '<pre class="tpl">' + esc(JSON.stringify(UI.pdfTest, null, 1)) + '</pre>') : '') +
    sec('Colecția (' + xs.length + ')', tbl(['Imobil', 'Nr. cadastral', 'Suprafață', 'Proprietari', 'Sarcini', 'Control', ''], rows));
}

/* ---------- Servicii: starea fiecăruia + data de reverificare ---------- */
function servicii() {
  const F = UI.f.sv || 'toate'; const tm = now();
  const st = (id) => D('servicii')[id] || { id, stare: 'in_test', motiv: '', criteriu: '', reverificare: '' };
  const ids = Object.keys(SV); const n = (s) => ids.filter((i) => st(i).stare === s).length;
  const filt = '<div class="filt">' + [['toate', 'Toate (' + ids.length + ')']].concat(Object.keys(STARI_SERVICIU).map((k) => [k, STARI_SERVICIU[k][0] + ' (' + n(k) + ')'])).map((x) => '<button class="b mic' + (F === x[0] ? ' pri' : '') + '" data-a="svfilt" data-id="' + x[0] + '">' + x[1] + '</button>').join(' ') + '</div>';
  const rows = ids.filter((i) => F === 'toate' || st(i).stare === F).map((i) => { const x = st(i); const nCom = L('linii', (l) => l.svc === i && l.stare !== 'anulat').length; const dep = x.reverificare && new Date(x.reverificare).getTime() < tm;
    return '<tr><td><b>' + esc(svName(i)) + '</b><br><span class="small mut">' + (SV[i][1] != null ? lei(SV[i][1]) : 'la ofertă') + ' · ' + nCom + ' linii de comandă</span></td><td><select data-i="sv|' + i + '|stare">' + Object.keys(STARI_SERVICIU).map((k) => '<option value="' + k + '"' + (x.stare === k ? ' selected' : '') + '>' + STARI_SERVICIU[k][0] + '</option>').join('') + '</select><br>' + tag(STARI_SERVICIU[x.stare][0], STARI_SERVICIU[x.stare][1]) + '</td><td class="small"><textarea rows="2" data-i="sv|' + i + '|motiv">' + esc(x.motiv) + '</textarea></td><td class="small"><textarea rows="2" data-i="sv|' + i + '|criteriu">' + esc(x.criteriu) + '</textarea></td><td><input type="date" data-i="sv|' + i + '|reverificare" value="' + esc(x.reverificare) + '">' + (dep ? '<br>' + tag('depășită', 'rosu') : '') + '</td><td class="small mut">' + (x.istoric && x.istoric.length ? x.istoric.slice(-2).map((h) => esc(h)).join('<br>') : '—') + '</td></tr>'; });
  return '<h2>Servicii</h2><p class="mut">Starea fiecărui serviciu din oferta site-ului. ' + Object.keys(STARI_SERVICIU).map((k) => tag(STARI_SERVICIU[k][0], STARI_SERVICIU[k][1]) + ' ' + STARI_SERVICIU[k][2]).join(' · ') + '. La data de reverificare, serviciul apare în „De rezolvat acum” din Panou; o comandă care conține un serviciu pe pauză sau invalidat apare cu roșu.</p>' +
    '<div class="kpis">' + Object.keys(STARI_SERVICIU).map((k) => kpi(n(k), STARI_SERVICIU[k][0], STARI_SERVICIU[k][1])).join('') + kpi(ids.filter((i) => st(i).reverificare && new Date(st(i).reverificare).getTime() < tm).length, 'reverificări depășite') + '</div>' + filt +
    tbl(['Serviciu', 'Stare', 'De ce', 'Ce trebuie ca să treacă mai departe', 'Reverificare', 'Ultimele schimbări'], rows);
}

/* DD Operare · versiunea simplă (2.0.0, 05.11.2026).
   Două roluri: Administrator și Specialist. Un singur drum: Plată → Preluare → Specialist → Raport → Client.
   Aceleași date și același motor ca versiunea completă (index.html); aici se schimbă doar ce se vede și cum se apasă.
   Se încarcă ultimul: înlocuiește renderApp și adaugă acțiunile cu prefixul „s”.
   Totul stă într-o funcție, ca numele de aici să nu se lovească de cele din versiunea completă. */
(() => {
const S = { tab: 'azi', o: null, t: null, f: 'toate', q: '', per: '', ca: null, pg: null, qcf: '' };
try { Object.assign(S, JSON.parse(sessionStorage.getItem('dd_simplu') || '{}')); } catch (e) { /* fără sessionStorage */ }
const sSave = () => { try { sessionStorage.setItem('dd_simplu', JSON.stringify(S)); } catch (e) { /* ignor */ } };

const eSpec = () => UI.role === 'specialist';
const extern = (t) => t.spec !== 'motor' && t.spec !== 'analist';
const intern = (t) => t.spec === 'analist';
const vii = (oid) => orderTasks(oid).filter((t) => t.stare !== 'anulat');
const internId = () => (L('specialisti', (s) => s.spec.includes('analist'))[0] || {}).id;
const laMine = (t) => { const s = D('specialisti')[t.specialist]; return !!s && s.spec.includes('analist'); };
const verificata = (o) => !!o.preluata_la || ['livrata', 'inchisa'].includes(o.stare);
const servicii = (o) => L('linii', (l) => l.comanda === o.id && !l.incl && l.stare !== 'anulat').map((l) => svName(l.svc)).join(', ');
const imobil = (o) => imoText(D('imobile')[o.imobile[0]] || {});
const vad = (t) => L('oferte', (x) => x.task === t.id && x.raspuns === 'deschisa').length;
const bursa = (t) => (vad(t) === 1 ? 'îl vede 1 specialist' : 'îl văd ' + vad(t) + ' specialiști') + '; îl ia primul care acceptă';
const deTrimis = (o) => [].concat(...L('linii', (l) => l.comanda === o.id && l.stare === 'livrat').map((l) => l.de_trimis || [])).filter((id, i, a) => a.indexOf(id) === i).map((id) => D('documente')[id]).filter(Boolean).concat(L('documente', (d) => d.comanda === o.id && d.atasat));
const inLucru = (t) => ['disponibil', 'oferit', 'atribuit'].includes(t.stare);

/* ---------- drumul comenzii: aceleași cinci trepte, mereu ---------- */
function etape(o) {
  const ts = vii(o.id), ex = ts.filter(extern), inn = ts.filter(intern);
  const gata = (g) => g.filter((t) => t.stare === 'terminat').length;
  const pb = (g) => g.some((t) => PB_T.includes(t.stare) || slaInfo(t).stare === 'late');
  const p = platita(o), v = verificata(o);
  /* un singur punct curent până la preluare, chiar dacă motorul a oferit deja pasul */
  const grup = (g, fara) => !g.length ? fara : gata(g) === g.length ? 'ok' : pb(g) ? 'pb' : v && g.some(inLucru) ? 'act' : 'urm';
  const e = [
    { k: 'plata', n: 'Plată', st: p ? 'ok' : 'act', sub: p ? hhmm(o.plata_la) : 'se așteaptă' },
    { k: 'preluare', n: 'Preluare', st: v ? 'ok' : p ? 'act' : 'urm', sub: v ? (o.preluata_de || '') : o.completare && !o.completare.rezolvat_la ? 'așteaptă clientul' : '' },
    { k: 'spec', n: 'Specialist', st: grup(ex, v ? 'ok' : 'urm'), sub: ex.length ? gata(ex) + ' din ' + ex.length : 'nu e nevoie' },
    { k: 'raport', n: 'Raport', st: grup(inn, o.livrata_la || o.gata_la ? 'ok' : 'urm'), sub: inn.length ? gata(inn) + ' din ' + inn.length : '' },
    { k: 'client', n: 'Client', st: o.livrata_la ? 'ok' : o.gata_la ? 'act' : 'urm', sub: o.livrata_la ? hhmm(o.livrata_la) : o.gata_la ? 'de trimis' : '' }
  ];
  if (!e.some((x) => x.st === 'act' || x.st === 'pb')) { const i = e.findIndex((x) => x.st !== 'ok'); if (i >= 0) e[i].st = 'act'; }
  return e;
}
const UNDE = { plata: 'Așteaptă plata', preluare: 'De verificat', spec: 'La specialist', raport: 'Raport de pregătit', client: 'De trimis' };
function trepte(o, aici) {
  return '<ol class="stp">' + etape(o).map((e, i) => '<li class="' + e.st + (e.k === aici ? ' aici' : '') + '"><b>' + (e.st === 'ok' ? '✓' : e.st === 'pb' ? '!' : i + 1) + '</b><span>' + e.n + '</span><small>' + esc(e.k === aici ? 'aici ești' : e.sub || '') + '</small></li>').join('') + '</ol>';
}
function puncte(o) {
  const e = etape(o), c = e.find((x) => x.st === 'pb') || e.find((x) => x.st === 'act');
  return '<span class="pct">' + e.map((x) => '<i class="' + x.st + '"></i>').join('') + '</span><span class="pctt ' + (c && c.st === 'pb' ? 'rosu' : '') + '">' + (o.stare === 'anulata' ? 'Anulată' : c ? UNDE[c.k] + (c.st === 'pb' ? ' · problemă' : '') : 'Trimisă clientului') + '</span>';
}

/* ---------- ce are de făcut administratorul ---------- */
function urmeaza(o) {
  if (o.stare === 'anulata') return { txt: 'Comanda e anulată.' };
  if (!platita(o)) return { txt: 'Se așteaptă plata clientului.', sub: 'Nu ai nimic de făcut până când plata e confirmată.' };
  if (o.stare === 'inchisa') return { txt: 'Comanda e închisă.' };
  if (o.stare === 'livrata') return { txt: 'Trimisă clientului, ' + hhmm(o.livrata_la) + '.', a: 'inchide', id: o.id, lbl: 'Închide comanda', sec: true };
  if (o.gata_la) return { txt: 'Toți pașii sunt gata. Verifică documentele și trimite.', a: 'strimitecl', id: o.id, lbl: 'Trimite clientului', trimite: true };
  if (!verificata(o)) return { txt: 'Verifică plata și comanda, apoi preia.', a: 'spreia', id: o.id, lbl: 'Totul e în regulă, preiau' };
  const ts = vii(o.id).filter((t) => t.spec !== 'motor');
  const pb = ts.find((t) => PB_T.includes(t.stare));
  if (pb) return { rosu: true, txt: 'Problemă la „' + pb.n + '”', sub: TXT[pb.stare] || pb.stare, a: 'st', id: pb.id, lbl: 'Rezolvă' };
  const al = ts.find((t) => inLucru(t) && (intern(t) || (t.stare === 'atribuit' && laMine(t))));
  if (al) return { txt: 'Rândul tău: ' + al.n, a: 'st', id: al.id, lbl: 'Deschide pasul' };
  const lib = ts.find((t) => extern(t) && t.stare === 'disponibil');
  if (lib) return { txt: '„' + lib.n + '” nu are încă specialist.', a: 'st', id: lib.id, lbl: 'Trimite la specialist' };
  const sp = ts.find((t) => extern(t) && ['oferit', 'atribuit'].includes(t.stare));
  if (sp) return { txt: 'La specialist: ' + sp.n, sub: sp.stare === 'atribuit' ? spName(sp.specialist) + ' lucrează din ' + hhmm(sp.acceptat_la) : 'La bursă: ' + bursa(sp), a: 'st', id: sp.id, lbl: 'Vezi pasul', sec: true };
  return { txt: 'Pașii automați rulează.', sub: 'Nu ai nimic de făcut acum.' };
}
function randulTau() {
  const q = [], nr = (oid) => (D('comenzi')[oid] || {}).nr || '';
  L('taskuri', (t) => t.spec !== 'motor' && PB_T.includes(t.stare)).forEach((t) => q.push({ p: 1, c: 'rosu', et: 'Problemă', ce: t.n, sub: nr(t.comanda) + ' · ' + (TXT[t.stare] || t.stare), a: 'st', id: t.id, lbl: 'Rezolvă' }));
  intrebariDeschise().forEach((m) => q.push({ p: 2, c: 'galben', et: 'Întrebare de la client', ce: m.text.slice(0, 80), sub: nr(m.comanda) + ' · ' + hhmm(m.la), a: 'so', id: m.comanda, lbl: 'Răspunde' }));
  L('taskuri', (t) => extern(t) && t.stare === 'terminat' && !t.vazut_admin && !laMine(t) && D('comenzi')[t.comanda] && !D('comenzi')[t.comanda].livrata_la && now() - t.terminat_la < 86400000).forEach((t) => q.push({ p: 2.2, c: 'verde nou', et: 'Primit de la specialist', ce: t.n, sub: nr(t.comanda) + ' · ' + spName(t.specialist) + ', ' + hhmm(t.terminat_la), a: 'st', id: t.id, lbl: 'Vezi' }));
  L('comenzi', (o) => o.gata_la && !o.livrata_la && o.stare !== 'anulata').forEach((o) => q.push({ p: 2.5, c: 'verde', et: 'Completă', ce: servicii(o), sub: o.nr + ' · gata ' + hhmm(o.gata_la), a: 'so', id: o.id, lbl: 'Verifică și trimite' }));
  L('comenzi', (o) => platita(o) && !verificata(o) && o.stare !== 'anulata').sort((a, b) => a.plata_la - b.plata_la).forEach((o) => q.push({ p: o.completare && !o.completare.rezolvat_la ? 5.5 : 3, c: o.completare && !o.completare.rezolvat_la ? '' : 'galben', et: o.completare && !o.completare.rezolvat_la ? 'Așteaptă clientul' : 'Comandă nouă', ce: servicii(o), sub: o.nr + ' · plătită ' + hhmm(o.plata_la), a: 'so', id: o.id, lbl: 'Verifică' }));
  /* pașii unei comenzi încă neverificate nu intră în listă: întâi se verifică și se preia comanda */
  const ver = (t) => { const o = D('comenzi')[t.comanda]; return !!o && verificata(o); };
  L('taskuri', (t) => ver(t) && inLucru(t) && (intern(t) || (t.stare === 'atribuit' && extern(t) && laMine(t)))).forEach((t) => q.push({ p: 4, c: '', et: 'Raport', ce: t.n, sub: nr(t.comanda), a: 'st', id: t.id, lbl: 'Lucrează' }));
  L('taskuri', (t) => ver(t) && extern(t) && t.stare === 'disponibil').forEach((t) => q.push({ p: 5, c: '', et: 'Fără specialist', ce: t.n, sub: nr(t.comanda), a: 'st', id: t.id, lbl: 'Trimite' }));
  L('linii', (l) => l.stare === 'cerere').forEach((l) => q.push({ p: 6, c: '', et: 'Cerere de ofertă', ce: svName(l.svc), sub: nr(l.comanda), a: 'so', id: l.comanda, lbl: 'Vezi' }));
  return q.sort((a, b) => a.p - b.p);
}
const laSpecialisti = () => L('taskuri', (t) => extern(t) && ['oferit', 'atribuit'].includes(t.stare) && !laMine(t)).sort((a, b) => (a.acceptat_la || 0) - (b.acceptat_la || 0));

/* ---------- piese comune ---------- */
const sBtn = (a, txt, id, c, x) => '<button class="b ' + (c || '') + '" data-a="' + a + '" data-id="' + esc(id == null ? '' : id) + '"' + (x != null ? ' data-x="' + esc(x) + '"' : '') + '>' + txt + '</button>';
const gol = (t, s) => '<div class="gol2"><b>' + t + '</b>' + (s ? '<span>' + s + '</span>' : '') + '</div>';
const rand = (x) => '<div class="rd ' + (x.c || '') + '"><div><small>' + esc(x.et) + '</small><b>' + esc(x.ce) + '</b><span>' + esc(x.sub) + '</span></div>' + sBtn(x.a, x.lbl, x.id, 'pri') + '</div>';
const cardComanda = (o) => '<div class="oc" data-a="so" data-id="' + o.id + '"><div class="oc1"><b>' + o.nr + '</b>' + (o.urgent ? tag('urgent', 'rosu') : '') + '<span>' + hhmm(o.creata_la) + '</span></div><div class="oc2">' + esc(servicii(o) || '—') + '</div><div class="oc3">' + imobil(o) + ' · ' + esc(clName(o)) + '</div><div class="oc4">' + puncte(o) + '<span class="suma">' + (o.total ? lei(o.total) : '') + '</span></div></div>';
const acum = (u) => '<div class="acum ' + (u.rosu ? 'rosu' : '') + '"><small>Acum</small><b>' + esc(u.txt) + '</b>' + (u.sub ? '<span>' + esc(u.sub) + '</span>' : '') + (u.a ? sBtn(u.a, u.lbl, u.id, u.sec ? 'mare' : 'pri mare') : '') + '</div>';
const ceas = (t) => (t.stare === 'atribuit' && t.sla && !t.terta ? timer(t.acceptat_la + t.sla * MIN, t.sla) : '');

/* formularul unui pas: verifici, completezi, atașezi */
function formPas(t, ro) {
  const tid = t.id; let n = 0;
  const bloc = (titlu, gata, tot, body) => { n++; return '<section class="fb"><div class="fh"><b class="' + (gata >= tot ? 'ok' : '') + '">' + (gata >= tot ? '✓' : n) + '</b><h3>' + titlu + '</h3><span>' + gata + ' din ' + tot + '</span></div>' + body + '</section>'; };
  const dis = ro ? ' disabled' : '';
  const bife = t.check.length ? bloc('Verifică', t.check.filter((c) => c.ok).length, t.check.length, t.check.map((c, i) => '<label class="ck"><input type="checkbox" data-i="ck|' + tid + '|' + i + '"' + (c.ok ? ' checked' : '') + dis + '><span>' + esc(c.t) + '</span></label>').join('')) : '';
  const camp = (f, i) => '<label class="cp">' + esc(f.label) + (f.type === 'sel' ? '<select data-i="fd|' + tid + '|' + i + '"' + dis + '><option value="">alege…</option>' + f.opt.map((x) => '<option' + (f.val === x ? ' selected' : '') + '>' + x + '</option>').join('') + '</select>' : f.type === 'textarea' ? '<textarea rows="3" data-i="fd|' + tid + '|' + i + '"' + dis + '>' + esc(f.val) + '</textarea>' : '<input type="' + (f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text') + '" inputmode="' + (f.type === 'number' ? 'decimal' : 'text') + '" data-i="fd|' + tid + '|' + i + '" value="' + esc(f.val) + '"' + dis + '>') + '</label>';
  const date = t.fields.length ? bloc('Completează', t.fields.filter((f) => f.val !== '' && f.val != null).length, t.fields.length, '<div class="cps">' + t.fields.map(camp).join('') + '</div>') : '';
  const fisier = (rf) => { const up = t.fisiere.filter((x) => x.tip === rf.tip); return '<div class="fs"><div><b>' + esc(rf.label) + '</b>' + (rf.req ? '' : ' <span class="mut small">opțional</span>') + '</div>' + (up.length ? '<div class="fsl">' + up.map((u) => (D('documente')[u.doc] ? docLinie(D('documente')[u.doc]) : esc(u.nume))).join('<br>') + '</div>' : '') + (ro ? '' : '<div class="fsb"><label class="b">Atașează<input type="file" hidden accept="application/pdf,image/*,text/plain" data-i="up|' + tid + '|' + rf.tip + '"></label><label class="b">Fă o poză<input type="file" hidden accept="image/*" capture="environment" data-i="up|' + tid + '|' + rf.tip + '"></label>' + (SYNC.on ? '' : '<a href="#" class="small mut" data-a="demof" data-id="' + tid + '" data-x="' + rf.tip + '">fișier de test</a>') + '</div>') + '</div>'; };
  const docs = t.reqFiles.length ? bloc('Atașează', t.reqFiles.filter((rf) => t.fisiere.some((x) => x.tip === rf.tip)).length, t.reqFiles.length, t.reqFiles.map(fisier).join('')) : '';
  return bife + date + docs + (!ro && !SYNC.on ? '<p class="small mut ctr"><a href="#" data-a="fill" data-id="' + tid + '">completează de test</a></p>' : '');
}
const dateDin = (t) => { const fs = t.fields.filter((f) => f.val !== '' && f.val != null); return fs.length ? '<div class="dts"><small>' + esc(t.n) + (t.terminat_la ? ' · ' + esc(spName(t.specialist)) + ', ' + hhmm(t.terminat_la) : '') + '</small><dl>' + fs.map((f) => '<dt>' + esc(f.label) + '</dt><dd>' + esc(f.val) + '</dd>').join('') + '</dl></div>' : ''; };
const problemeHtml = (t, pot) => { const ps = L('probleme', (p) => p.task === t.id && p.stare !== 'rezolvata'); return ps.length ? '<div class="acum rosu"><small>Problemă</small>' + ps.map((p) => '<b>' + esc(p.tip) + '</b><span>' + esc(p.descr) + '</span>' + (pot ? sBtn('prez', 'Am rezolvat-o', p.id, 'mare') : '')).join('') + (pot ? '' : '<span>Administratorul o rezolvă; până atunci pasul e oprit.</span>') + '</div>' : ''; };

/* ---------- Administrator ---------- */
function adminAzi() {
  const q = randulTau(), sp = laSpecialisti(), os = L('comenzi');
  const k = (f, n, l, c) => '<button class="kp ' + (c || '') + '" data-a="sfil" data-id="' + f + '"><b>' + n + '</b><span>' + l + '</span></button>';
  return '<h1>Azi</h1><div class="kps">' + k('noi', os.filter((o) => platita(o) && !verificata(o) && o.stare !== 'anulata').length, 'de verificat', 'galben') + k('lucru', os.filter((o) => platita(o) && verificata(o) && !inchisa(o)).length, 'în lucru') + k('pb', os.filter((o) => !inchisa(o) && areProblema(o.id)).length, 'probleme', 'rosu') + k('neplatite', os.filter((o) => !platita(o) && o.stare !== 'anulata').length, 'neplătite') + '</div>' +
    '<h2>Rândul tău <i>' + q.length + '</i></h2>' + (q.length ? q.map(rand).join('') : gol('Nimic de făcut acum.', 'Comenzile noi și pașii tăi apar aici.')) +
    '<h2>La specialiști <i>' + sp.length + '</i></h2>' + (sp.length ? sp.map((t) => '<div class="rd lin" data-a="st" data-id="' + t.id + '"><div><small>' + esc((D('comenzi')[t.comanda] || {}).nr || '') + '</small><b>' + esc(t.n) + '</b><span>' + (t.stare === 'atribuit' ? esc(spName(t.specialist)) + ' · lucrează din ' + hhmm(t.acceptat_la) : 'la bursă · ' + bursa(t)) + '</span></div><div class="dr">' + ceas(t) + termen(t) + '</div></div>').join('') : gol('Niciun pas la specialiști.'));
}
const FILTRE = [['toate', 'Toate'], ['noi', 'De verificat'], ['lucru', 'În lucru'], ['pb', 'Probleme'], ['neplatite', 'Neplătite'], ['trimise', 'Trimise']];
function adminComenzi() {
  const zi = 86400000, d0 = new Date(now()).setHours(0, 0, 0, 0);
  let os = L('comenzi').sort((a, b) => b.creata_la - a.creata_la);
  const f = { noi: (o) => platita(o) && !verificata(o) && o.stare !== 'anulata', lucru: (o) => platita(o) && verificata(o) && !inchisa(o), pb: (o) => !inchisa(o) && areProblema(o.id), neplatite: (o) => !platita(o) && o.stare !== 'anulata', trimise: (o) => ['livrata', 'inchisa'].includes(o.stare) }[S.f];
  if (f) os = os.filter(f);
  if (S.per) os = os.filter((o) => o.creata_la >= (S.per === 'azi' ? d0 : now() - Number(S.per) * zi));
  if (S.q) { const q = S.q.toLowerCase(); os = os.filter((o) => (o.nr + ' ' + imobil(o) + ' ' + clName(o) + ' ' + servicii(o)).toLowerCase().includes(q)); }
  return '<h1>Comenzi <i>' + os.length + '</i></h1><input class="caut" data-s="q" placeholder="Caută număr, client, CF, adresă" value="' + esc(S.q || '') + '">' +
    '<div class="chs">' + FILTRE.map((x) => '<button class="' + (S.f === x[0] ? 'on' : '') + '" data-a="sfil" data-id="' + x[0] + '" data-x="1">' + x[1] + '</button>').join('') + '<select data-s="per">' + [['', 'Oricând'], ['azi', 'Azi'], ['7', '7 zile'], ['30', '30 de zile']].map((x) => '<option value="' + x[0] + '"' + (S.per === x[0] ? ' selected' : '') + '>' + x[1] + '</option>').join('') + '</select></div>' +
    (os.length ? os.map(cardComanda).join('') : gol('Nicio comandă aici.', 'Schimbă filtrul sau căutarea.'));
}
function verificare(o) {
  const pl = L('plati', (p) => p.comanda === o.id), cap = pl.filter((p) => p.stare === 'capturata'), cl = D('clienti')[o.client] || {}, im = D('imobile')[o.imobile[0]] || {};
  const r = (ok, t, s) => '<li class="' + (ok ? 'ok' : 'nu') + '"><b>' + (ok ? '✓' : '!') + '</b><div><span>' + t + '</span><small>' + s + '</small></div></li>';
  return '<ul class="vf">' + r(cap.length > 0, 'Plata', cap.length ? lei(cap.reduce((s, p) => s + p.suma, 0)) + ' · confirmată ' + hhmm(cap[0].capturata_la || o.plata_la) + (cap[0].tx ? ' · ' + esc(cap[0].tx) : '') : 'marcată plătită ' + hhmm(o.plata_la) + ', fără plată înregistrată aici') +
    r(o.acord === true, 'Acord de executare imediată', o.acord === true ? 'dat ' + hhmm(o.acord_la) : 'lipsește') +
    r(!!(im.cf || im.adresa), 'Imobil', imobil(o) || 'fără CF și fără adresă') +
    r(!!servicii(o), 'Ce se cere', esc(servicii(o)) || 'niciun serviciu') +
    r(!!cl.email, 'Client', esc(cl.nume || '') + (cl.email ? ' · ' + esc(cl.email) : ' · fără e-mail')) + '</ul>';
}
const LISTA = ['cf', 'expl', 'plan', 'ident', 'cf360', 'cfc', 'orto', 'indic', 'zona', 'util', 'est', 'regul', 'cu', 'depcu', 'rAp', 'rInt'];
function comandat(o) {
  const by = {}; L('linii', (l) => l.comanda === o.id && l.stare !== 'anulat').forEach((l) => (by[l.svc] = l));
  const chei = Object.keys(by), toate = LISTA.filter((k) => by[k]).concat(chei.filter((k) => !LISTA.includes(k)), LISTA.filter((k) => !by[k]));
  const el = (k) => { const l = by[k], st = !l ? 'nu' : l.stare === 'livrat' ? 'ok' : l.stare === 'cerere' ? 'cer' : 'luc'; return '<span class="el ' + st + '">' + (st === 'ok' ? '✓ ' : '') + esc(svName(k)) + (l && l.incl ? ' · inclus' : '') + (st === 'cer' ? ' · la ofertă' : '') + '</span>'; };
  return '<div class="cmd"><div class="cmdh"><b>Ce s-a comandat</b><span>' + chei.filter((k) => by[k].stare === 'livrat').length + ' din ' + chei.length + ' gata</span></div><div class="els">' + toate.map(el).join('') + '</div><div class="leg"><i class="ok"></i>gata<i class="luc"></i>comandat, în lucru<i class="nu"></i>necomandat</div></div>';
}
const btnAtas = (o) => '<label class="b">Adaugă raportul (PDF)<input type="file" hidden accept="application/pdf,image/*" data-s="rap" data-id="' + o.id + '"></label>';
function areCF(o) { return L('linii', (l) => l.comanda === o.id && l.stare !== 'anulat' && ['cf', 'ident', 'rAp', 'rInt'].includes(l.svc)).length > 0; }
function areExplicatie(o) { return L('linii', (l) => l.comanda === o.id && l.stare !== 'anulat' && l.svc === 'expl').length > 0; }
function adaugaExplicatie(oid) {
  const o = D('comenzi')[oid]; if (!o || !areCF(o) || areExplicatie(o) || inchisa(o)) return;
  const ln = { id: uid('ln'), comanda: o.id, imobil: o.imobile[0], svc: 'expl', pret: 0, tip: 'plata', stare: 'platita', plata: null, incl: true };
  D('linii')[ln.id] = ln; ev('linie.adaugata', (UI.auth || {}).nume || 'admin', { k: 'linie', id: ln.id }, { svc: 'expl', fara_plata: true });
  genTasks([ln]); advance(); toast('Explicația CF a fost adăugată la comandă.');
}
function adminComanda(o) {
  const ts = vii(o.id), ex = ts.filter(extern), inn = ts.filter(intern), auto = ts.filter((t) => t.spec === 'motor'), docs = L('documente', (d) => d.comanda === o.id), pl = L('plati', (p) => p.comanda === o.id), cl = D('clienti')[o.client] || {};
  const pas = (t) => '<div class="ps" data-a="st" data-id="' + t.id + '"><div><b>' + esc(t.n) + '</b><span>' + (extern(t) ? esc(t.specialist ? spName(t.specialist) : SPEC[t.spec]) : 'tu') + '</span></div><div class="dr">' + termen(t) + chip(t.stare) + '</div></div>';
  const msg = toateMesajele().filter((m) => m.comanda === o.id);
  const u = urmeaza(o);
  return '<a class="inap" href="#" data-a="sback">‹ Comenzi</a><div class="tit"><h1>' + o.nr + '</h1>' + (o.urgent ? tag('urgent', 'rosu') : '') + '</div><p class="sub">' + imobil(o) + ' · ' + esc(clName(o)) + '</p>' + trepte(o) + comandat(o) +
    (u.a === 'spreia' ? '<div class="acum"><small>Acum</small><b>' + esc(u.txt) + '</b>' + verificare(o) + sBtn('spreia', u.lbl, o.id, 'pri mare') + (o.completare && !o.completare.rezolvat_la ? '<span>Ai cerut clientului, ' + hhmm(o.completare.la) + ': ' + esc(o.completare.text) + '</span>' : '') + sBtn('slipsa', 'Lipsește ceva: cer clientului să completeze', o.id, 'mare lnk') + '</div>' : u.trimite ? '<div class="acum ok"><small>Acum</small><b>' + esc(u.txt) + '</b><span>Pleacă la client:</span><div class="vf">' + (deTrimis(o).map((d) => '<div class="dc">' + docLinie(d) + '</div>').join('') || '<div class="dc"><span class="small mut">Niciun document încă.</span></div>') + '</div><div class="btns">' + btnAtas(o) + '</div>' + sBtn('strimitecl', u.lbl, o.id, 'pri mare') + '</div>' : acum(u)) +
    (!platita(o) && !SYNC.on && pl.some((p) => p.stare === 'initiata') ? '<p class="small mut ctr"><a href="#" data-a="pcap" data-id="' + pl.find((p) => p.stare === 'initiata').id + '">simulează plata (doar în demo)</a></p>' : '') +
    (ex.length ? '<h2>Specialist <i>' + ex.filter((t) => t.stare === 'terminat').length + ' din ' + ex.length + '</i></h2>' + ex.map(pas).join('') : '') +
    (inn.length ? '<h2>Raport <i>' + inn.filter((t) => t.stare === 'terminat').length + ' din ' + inn.length + '</i></h2>' + inn.map(pas).join('') : '') +
    (auto.length ? '<p class="small mut">Pași automați: ' + auto.filter((t) => t.stare === 'terminat').length + ' din ' + auto.length + ' gata.</p>' : '') +
    '<h2>Documente <i>' + docs.length + '</i></h2>' + (verificata(o) && !o.livrata_la && !u.trimite ? '<div class="btns" style="margin:0 0 8px">' + btnAtas(o) + '</div>' : '') + (docs.length ? '<div class="cd">' + docs.map((d) => '<div class="dc">' + docLinie(d) + '<small>' + esc(D('taskuri')[d.task] ? D('taskuri')[d.task].n : d.atasat ? 'raport adăugat' : '') + ' · ' + esc(spName(d.incarcat_de)) + (d.vizibil ? ' · la client' : '') + '</small></div>').join('') + '</div>' : gol('Niciun document încă.')) +
    '<h2>Date salvate</h2><div class="cd">' + (ts.filter((t) => t.spec !== 'motor').map(dateDin).join('') || '<p class="small mut">Datele completate la pași apar aici și rămân salvate pentru verificare.</p>') +
    (areCF(o) ? '<div class="opt"><div><b>Explicația CF</b><small>' + (areExplicatie(o) ? 'face parte din comandă' : 'nu e în comandă') + '</small></div>' + (areExplicatie(o) || inchisa(o) ? '' : sBtn('sexpl', 'Adaugă', o.id, '')) + '</div>' : '') + '</div>' +
    '<details class="cd" data-k="plata"><summary>Plată · ' + (o.total ? lei(o.total) : '—') + '</summary>' + (pl.length ? pl.map((p) => '<div class="dc">' + chip(p.stare) + ' ' + lei(p.suma) + '<small>' + hhmm(p.la) + ' · ' + esc(p.proc) + (p.tx ? ' · ' + esc(p.tx) : '') + (p.factura ? ' · factura ' + esc(p.factura.nr) : '') + '</small></div>').join('') : '<p class="small mut">Nicio plată înregistrată.</p>') + '</details>' +
    '<details class="cd" data-k="client"><summary>Client și mesaje' + (msg.length ? ' · ' + msg.length : '') + '</summary><p>' + esc(cl.nume || '') + '<br><span class="small mut">' + esc(cl.email || '') + (cl.tel ? ' · ' + esc(cl.tel) : '') + '</span></p>' + msg.map((m) => '<div class="ms ' + (m.de === 'client' ? 'cl' : '') + '"><small>' + esc(m.de) + ' · ' + hhmm(m.la) + '</small>' + esc(m.text) + '</div>').join('') + sBtn('scrie', 'Scrie clientului', o.id, '') + '</details>' +
    '<details class="cd" data-k="istoric"><summary>Istoric · ' + eventsOfOrder(o.id).length + ' înregistrări</summary><ul class="tl">' + eventsOfOrder(o.id).map(evLine).join('') + '</ul></details>';
}
function adminPas(t) {
  const o = D('comenzi')[t.comanda], eu = intern(t) || laMine(t), editabil = eu && t.stare === 'atribuit';
  const sp = L('specialisti', (s) => s.status === 'activ' && s.spec.includes(t.spec));
  let stare = '';
  if (t.stare === 'asteptare') stare = acum({ txt: 'Încă nu e rândul acestui pas.', sub: 'Se deschide singur când sunt gata pașii dinainte.' });
  else if (t.stare === 'terminat') stare = '<div class="acum ok"><small>Gata</small><b>' + esc(spName(t.specialist)) + ', ' + hhmm(t.terminat_la) + '</b></div>';
  else if (extern(t) && !eu) stare = '<div class="acum"><small>' + (t.stare === 'atribuit' ? 'La specialist' : 'Trimite la specialist') + '</small>' + (t.stare === 'atribuit' ? '<b>' + esc(spName(t.specialist)) + '</b><span>lucrează din ' + hhmm(t.acceptat_la) + ' ' + ceas(t) + '</span>' : t.stare === 'oferit' ? '<b>La bursă</b><span>' + bursa(t) + '. Îl poți da direct cuiva:</span>' : '<b>Alege cine face pasul</b>') +
    (t.stare === 'atribuit' ? '' : '<div class="als">' + (sp.length ? sp.map((s) => '<button data-a="strimite" data-id="' + t.id + '" data-x="' + s.id + '"><b>' + esc(s.nume) + '</b><span>' + esc(s.uat || s.judete.join(', ')) + ' · ' + load(s) + ' în lucru</span></button>').join('') : '<span>Niciun specialist activ pentru ' + esc(SPEC[t.spec]) + '.</span>') + '</div>') +
    '<div class="btns">' + sBtn('opcopie', 'Copiază cererea', t.id, '') + sBtn('seu', 'Pun eu documentul', t.id, '') + (t.stare === 'atribuit' ? sBtn('retrage', 'Retrage', t.id, '') : '') + '</div></div>';
  const primit = documenteIntrare(t), dinainte = t.dep.map((id) => D('taskuri')[id]).filter((x) => x && x.spec !== 'motor').map(dateDin).join('');
  return '<a class="inap" href="#" data-a="sback">‹ ' + o.nr + '</a><div class="tit"><h1>' + esc(t.n) + '</h1></div><p class="sub">' + imobil(o) + '</p>' + trepte(o, extern(t) ? 'spec' : 'raport') + problemeHtml(t, true) + stare +
    (eu && (primit.length || dinainte) ? '<h2>Ce ai primit</h2><div class="cd">' + primit.map((d) => '<div class="dc">' + docLinie(d) + '<small>' + esc(D('taskuri')[d.task] ? D('taskuri')[d.task].n : '') + '</small></div>').join('') + dinainte + '</div>' : '') +
    (t.k === 'cf3' ? panouComparatie(t) : '') + formPas(t, !editabil) +
    (editabil ? '<div class="bar">' + sBtn('sfin', 'Gata, mai departe', t.id, 'pri mare') + '</div><p class="ctr small"><a href="#" class="mut" data-a="pbm" data-id="' + t.id + '">Am o problemă la acest pas</a></p>' : '');
}

/* ---------- Echipă și conturi: cine are link, cine l-a folosit, test de intrare ---------- */
const X = { push: [], test: null, inv: null };
const ROL2 = { admin: 'Administrator', operator: 'Operator', specialist: 'Specialist', tehnic: 'Tehnic', sales: 'Sales', plati: 'Plăți' };
const adresa = () => location.origin + location.pathname;
const invitatie = (c) => 'Aplicația DD Operare\nLink: ' + adresa() + '\nUtilizator: ' + c.email + '\nParola: cea primită de la administrator' + '\nPe telefon: deschide linkul în Chrome, apoi „Instalează aplicația” și „Pornește notificările”. Pe iPhone: Partajează, apoi „Adaugă pe ecranul principal”.';
const cand = (s) => (s ? hhmm(new Date(s).getTime()) : '');
async function incarcaEchipa() {
  if (!SYNC.on) return;
  try { UI.conturi = (await fnConturi({ actiune: 'lista' })).conturi; } catch (e) { UI.conturi = UI.conturi || []; toast(e.message); }
  const { data } = await SYNC.sb.from('push_abonamente').select('*'); X.push = data || [];
}
function adminEchipa() {
  const demo = !SYNC.on, eAdmin = UI.auth.rol === 'admin';
  const list = demo ? L('specialisti', (s) => !s.spec.includes('analist')).map((s) => ({ id: s.id, email: s.email, nume: s.nume, rol: 'specialist', specialist_id: s.id, confirmat: true })) : UI.conturi;
  const card = (c) => {
    const ab = X.push.filter((p) => p.user_id === c.id), sid = c.specialist_id;
    const lucru = sid ? L('taskuri', (t) => t.specialist === sid && ['atribuit', 'blocat'].includes(t.stare)).length : 0, gata = sid ? L('taskuri', (t) => t.specialist === sid && t.stare === 'terminat').length : 0;
    return '<div class="ct"><div class="ct1"><b>' + esc(c.nume || c.email) + '</b>' + tag(ROL2[c.rol] || 'fără rol', c.rol ? 'alb' : 'galben') + (c.blocat ? tag('blocat', 'rosu') : c.confirmat ? '' : tag('invitat, neintrat', 'galben')) + '</div><span class="small mut">' + esc(c.email || '') + (sid ? ' · ' + esc(SPEC[(D('specialisti')[sid] || { spec: [] }).spec[0]] || '') : '') + '</span>' +
      '<dl class="ctd"><dt>Link emis</dt><dd>' + (cand(c.creat) || '—') + '</dd><dt>Ultima intrare</dt><dd>' + (cand(c.ultima) || (demo ? '—' : '<b class="rosu">niciodată</b>')) + '</dd><dt>Notificări</dt><dd>' + (ab.length ? 'pornite pe ' + ab.length + (ab.length === 1 ? ' dispozitiv' : ' dispozitive') + (ab.some((p) => p.eroare) ? ' · cu eroare' : '') : demo ? '—' : 'nepornite') + '</dd>' + (sid ? '<dt>Pași</dt><dd>' + lucru + ' în lucru · ' + gata + ' trimiși</dd>' : '') + '</dl>' +
      (demo ? '' : '<div class="btns">' + sBtn('sinv', 'Copiază invitația', c.id, 'mic') + (ab.length ? sBtn('spushtest', 'Notificare de test', c.id, 'mic') : '') + (eAdmin ? btn('controlm', 'Rol', { id: c.id, c: 'mic' }) + btn('contreset', 'Resetare parolă', { id: c.email, c: 'mic' }) + (c.id === SYNC.user.id ? '' : btn(c.blocat ? 'contdebloc' : 'contbloc', c.blocat ? 'Deblochează' : 'Blochează', { id: c.id, c: 'mic' })) : '') + '</div>') + '</div>';
  };
  const sp = L('specialisti', (s) => !s.spec.includes('analist'));
  const nou = '<div class="cd"><div class="cps">' + '<label class="cp">E-mail (utilizatorul)<input data-m="email" type="email" autocomplete="off"></label><label class="cp">Nume<input data-m="nume"></label>' +
    '<label class="cp">Rol<select data-m="rol"><option value="specialist">Specialist</option><option value="operator">Operator</option><option value="admin">Administrator</option></select></label>' +
    '<label class="cp">Specialist<select data-m="spid"><option value="__nou">+ specialist nou</option>' + sp.map((s) => '<option value="' + s.id + '">' + esc(s.nume) + ' · ' + esc(SPEC[s.spec[0]]) + '</option>').join('') + '</select></label>' +
    '<label class="cp">Specialitate (la specialist nou)<select data-m="spec">' + SPEC_EXTERN.map((k) => '<option value="' + k + '">' + esc(SPEC[k]) + '</option>').join('') + '</select></label><label class="cp">Județe (la specialist nou)<input data-m="judete" placeholder="Timiș, Arad"></label>' +
    '<label class="cp">Parolă inițială (minimum 8 caractere)<input data-m="parola" autocomplete="off"></label></div><p class="small mut">Cu parolă: contul merge imediat și îi trimiți tu linkul, utilizatorul și parola. Fără parolă: persoana primește un e-mail de invitație și își alege singură parola.</p>' + sBtn('scontnou', 'Creează contul', '', 'pri mare') + '</div>';
  return '<a class="inap" href="#" data-a="spg" data-id="">‹ Mai mult</a><h1>Echipă și conturi</h1>' +
    '<div class="cd"><small class="mut">Linkul aplicației, același pentru toți</small><p><b style="word-break:break-all">' + esc(adresa()) + '</b></p>' + sBtn('slinkcopie', 'Copiază linkul', '', 'mic') + '</div>' +
    (demo ? '<div class="acum"><small>Demo</small><b>Aici nu există conturi reale.</b><span>Mai jos sunt specialiștii de test, ca să vezi cum arată evidența. Conturile se fac în aplicația reală, cu contul de administrator.</span></div>' : '') +
    (demo || !eAdmin ? (demo ? '' : '<div class="acum"><small>Doar administratorul</small><b>Conturile le face și le schimbă administratorul.</b></div>') : '<h2>Cont nou</h2>' + nou) +
    '<h2>Conturi emise <i>' + (list ? list.length : '…') + '</i></h2>' + (list ? list.map(card).join('') || gol('Niciun cont încă.') : gol('Se încarcă…')) +
    (demo ? '' : '<h2>Testează o intrare</h2><div class="cd"><div class="cps"><label class="cp">E-mail<input data-m="temail" type="email" autocomplete="off"></label><label class="cp">Parolă<input data-m="tparola" type="password" autocomplete="off"></label></div>' + sBtn('stestlogin', 'Verifică dacă merge', '', 'mare') + (X.test ? '<p class="' + (X.test.ok ? 'bine' : 'rosu') + '"><b>' + esc(X.test.txt) + '</b></p>' : '') + '<p class="small mut">Verifică utilizatorul și parola fără să te scoată din contul tău. Testul apare la „Ultima intrare” a acelui cont.</p></div>');
}

/* ---------- Registrul CF: fiecare imobil, cu documentele și datele lui ---------- */
function registruCF() {
  const docImo = (d) => (D('taskuri')[d.task] || {}).imobil || (D('linii')[d.linie] || {}).imobil;
  return L('imobile').map((im) => {
    const docs = L('documente', (d) => docImo(d) === im.id).sort((a, b) => b.la - a.la), cf1 = L('taskuri', (t) => t.imobil === im.id && t.k === 'cf1' && t.stare === 'terminat')[0];
    const f = {}; if (cf1) cf1.fields.forEach((x) => (f[x.k] = x.val));
    return { im, docs, f, os: L('comenzi', (o) => o.imobile.includes(im.id)), la: docs.length ? docs[0].la : 0 };
  }).filter((r) => r.im.cf || r.docs.length).sort((a, b) => b.la - a.la);
}
function adminCF() {
  let rs = registruCF(); const tot = rs.length, nd = rs.reduce((s, r) => s + r.docs.length, 0), nt = rs.reduce((s, r) => s + r.docs.filter((d) => (ocrRec(d.id) || {}).stare === 'gata').length, 0);
  if (S.qcf) { const q = S.qcf.toLowerCase(); rs = rs.filter((r) => ((r.im.cf || '') + ' ' + (r.im.uat || '') + ' ' + (r.im.adresa || '') + ' ' + (r.im.nr_cad || '') + ' ' + r.os.map((o) => o.nr).join(' ')).toLowerCase().includes(q)); }
  const card = (r) => '<div class="cd"><div class="ct1"><b>' + (r.im.cf ? 'CF ' + esc(r.im.cf) : 'fără nr. CF') + '</b><span class="small mut">' + esc(r.im.uat || '') + (r.im.judet ? ', ' + esc(r.im.judet) : '') + '</span></div><span class="small mut">' + esc(r.im.adresa || '') + (r.im.nr_cad ? ' · nr. cad. ' + esc(r.im.nr_cad) : '') + '</span>' +
    (r.f.suprafata || r.f.proprietari || r.f.sarcini ? '<dl class="ctd">' + (r.f.proprietari ? '<dt>Proprietari</dt><dd>' + esc(r.f.proprietari) + '</dd>' : '') + (r.f.suprafata ? '<dt>Suprafață</dt><dd>' + esc(r.f.suprafata) + ' mp</dd>' : '') + (r.f.sarcini ? '<dt>Sarcini</dt><dd>' + esc(r.f.sarcini) + '</dd>' : '') + '</dl>' : '') +
    (r.docs.length ? r.docs.map((d) => '<div class="dc">' + docLinie(d) + '<small>' + hhmm(d.la) + ' · ' + esc(spName(d.incarcat_de)) + (d.vizibil ? ' · la client' : '') + '</small></div>').join('') : '<div class="dc"><span class="small mut">Niciun document încă.</span></div>') +
    '<div class="btns">' + r.os.map((o) => sBtn('so', o.nr, o.id, 'mic')).join('') + '</div></div>';
  return '<a class="inap" href="#" data-a="spg" data-id="">‹ Mai mult</a><h1>Registrul CF <i>' + tot + '</i></h1><p class="sub">' + nd + ' documente · ' + nt + ' cu text extras</p><input class="caut" style="margin-top:10px" data-s="qcf" placeholder="Caută nr. CF, UAT, adresă, comandă" value="' + esc(S.qcf || '') + '"><div class="btns" style="margin-bottom:10px">' + sBtn('scfcsv', 'Descarcă lista (CSV)', '', 'mic') + '</div>' +
    (rs.length ? rs.map(card).join('') : gol('Nimic aici.', 'Schimbă căutarea.'));
}
function csvCF() {
  const q = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"', rows = [['CF', 'UAT', 'Județ', 'Nr. cadastral', 'Adresă', 'Comenzi', 'Document', 'Încărcat la', 'Încărcat de', 'Text extras', 'La client']];
  registruCF().forEach((r) => (r.docs.length ? r.docs : [null]).forEach((d) => rows.push([r.im.cf, r.im.uat, r.im.judet, r.im.nr_cad, r.im.adresa, r.os.map((o) => o.nr).join(' '), d ? d.nume : '', d ? new Date(d.la).toISOString().slice(0, 16).replace('T', ' ') : '', d ? spName(d.incarcat_de) : '', d ? ((ocrRec(d.id) || {}).stare === 'gata' ? 'da' : 'nu') : '', d ? (d.vizibil ? 'da' : 'nu') : ''])));
  return rows.map((r) => r.map(q).join(',')).join('\n');
}

/* ---------- Datele: ce avem, unde stă, cum ajungi la ele ---------- */
function adminDate() {
  const ref = (window.EPAY_CFG && (window.EPAY_CFG.supabaseUrl || '').replace(/^https:\/\/([^.]+)\..*$/, '$1')) || '', panou = 'https://supabase.com/dashboard/project/' + ref;
  const n = (c, p) => L(c, p).length, docs = L('documente');
  const r = (ce, cat, unde, leg) => '<tr><td><b>' + ce + '</b><br><span class="small mut">' + unde + '</span></td><td class="nr">' + cat + '</td><td>' + (leg || '') + '</td></tr>';
  const inApp = (pg, t) => '<a href="#" data-a="spg" data-id="' + pg + '">' + t + '</a>', ext = (u, t) => (ref ? '<a href="' + u + '" target="_blank" rel="noopener">' + t + ' ↗</a>' : '<span class="mut small">doar în aplicația reală</span>');
  return '<a class="inap" href="#" data-a="spg" data-id="">‹ Mai mult</a><h1>Datele</h1><p class="sub">Ce se adună, unde stă și cum ajungi la ele. Nimic nu stă pe telefon: aplicația le citește de pe server, cu contul.</p>' +
    '<div class="cd tw"><table class="opis"><thead><tr><th>Ce</th><th>Câte</th><th>Deschide</th></tr></thead><tbody>' +
    r('Comenzi', n('comenzi'), 'bază de date · platforma_docs / comenzi', '<a href="#" data-a="stab" data-id="comenzi">Comenzi</a>') +
    r('Clienți', n('clienti'), 'bază de date · clienti (doar echipa)', ext(panou + '/editor', 'tabel')) +
    r('Imobile și CF-uri', n('imobile'), 'bază de date · imobile', inApp('cf', 'Registrul CF')) +
    r('Documente (PDF, poze)', docs.length, 'fișiere private · spațiul „documente”', ext(panou + '/storage/buckets/documente', 'fișiere')) +
    r('Text extras din documente', n('ocr', (x) => x.stare === 'gata'), 'bază de date · ocr', inApp('cf', 'Registrul CF')) +
    r('Pași de lucru', n('taskuri'), 'bază de date · taskuri', '') +
    r('Plăți', n('plati'), 'bază de date · plati; banii sunt în Stripe', ext('https://dashboard.stripe.com/payments', 'Stripe')) +
    r('Mesaje către clienți', n('notificari', (x) => x.dest === 'client'), 'bază de date · notificari', '') +
    r('Istoric (cine, ce, când)', (R.db.evenimente || []).length, 'bază de date · platforma_evenimente', ext(panou + '/editor', 'tabel')) +
    r('Conturi și linkuri', SYNC.on && UI.conturi ? UI.conturi.length : '—', 'conturi Supabase + profiluri', inApp('echipa', 'Echipă')) +
    '</tbody></table></div>' +
    '<h2>Unde</h2><div class="cd"><p class="small">Baza de date și fișierele: Supabase, proiectul „DD as a service”, Frankfurt. Comenzile de pe site: proiectul „ePay CF site”. Plățile: Stripe. Pagina aplicației: GitHub Pages, fără date. Codul și versiunile: Google Drive, „1 Artefacte / platforma_specialisti”, cu opisul în OPIS_DATE.md.</p>' + (ref ? '<a class="b" href="' + panou + '" target="_blank" rel="noopener">Deschide panoul Supabase ↗</a>' : '') + '</div>';
}
function adminMai() {
  const rol = (n, cine, ce) => '<li><b>' + n + '</b><div><span>' + cine + '</span><small>' + ce + '</small></div></li>';
  const adr = location.origin + location.pathname;
  return '<h1>Mai mult</h1><div class="tiles"><button data-a="spg" data-id="echipa"><b>Echipă și conturi</b><span>linkuri emise, folosire, test</span></button><button data-a="spg" data-id="cf"><b>Registrul CF</b><span>imobile, documente, text</span></button><button data-a="spg" data-id="date"><b>Datele</b><span>ce avem și unde stă</span></button></div><h2>Cum curge o comandă</h2><ol class="cine">' + rol(1, 'Clientul', 'comandă și plătește cu cardul pe site') + rol(2, 'Automat', 'banca confirmă plata, iar comanda apare aici în cel mult un minut') + rol(3, 'Administratorul sau operatorul', 'verifică plata și comanda, apoi dă OK') + rol(4, 'Specialiștii', 'primesc toți notificare; o ia primul care acceptă și are 90 de minute') + rol(5, 'Specialistul', 'vede doar imobilul (nr. CF, UAT, adresă), fără datele clientului; încarcă PDF-ul și trimite') + rol(6, 'Administratorul', 'e anunțat, verifică documentul și, la rapoarte, adaugă raportul') + rol(7, 'Administratorul', 'apasă „Trimite clientului”; clientul primește documentele') + '</ol>' +
    '<h2>Linkul pentru echipă</h2><div class="cd"><p class="small">Același link pentru administrator, operator și specialiști. Fiecare intră cu contul lui și vede doar partea lui.</p><p><b style="word-break:break-all">' + esc(adr) + '</b></p><p class="small mut">Pe telefon: deschide linkul în Chrome, apoi „Instalează aplicația”. Pe iPhone: Partajează, apoi „Adaugă pe ecranul principal”. Conturile se fac din versiunea completă, la Conturi.</p></div>' +
    '<h2>Unde stau datele</h2><div class="cd"><p class="small">Comenzile, pașii și istoricul stau într-o bază de date Supabase din Frankfurt. PDF-urile stau într-un spațiu privat de fișiere, tot acolo, și se deschid doar cu cont. Pagina aplicației e găzduită gratuit pe GitHub Pages și nu conține date.</p></div>' +
    (typeof cardNotificari === 'function' ? cardNotificari() : '') +
    '<h2>Versiunea completă</h2><div class="cd"><p>Conturi, specialiști, contracte, plăți și decont, setări, plan.</p><a class="b" href="index.html">Deschide versiunea completă</a></div>' +
    '<div class="btns">' + sBtn('logout', 'Ieși din cont', '', '') + '</div>';
}

/* ---------- Specialist ---------- */
function specCap() {
  const s = D('specialisti')[UI.spec]; if (!s) return '';
  return '<div class="spc"><div><b>' + esc(s.nume) + '</b><span>' + esc(SPEC[s.spec[0]]) + ' · ' + esc(s.judete.join(', ')) + '</span></div><label class="tura"><input type="checkbox" data-i="tura"' + (s.tura ? ' checked' : '') + '><span>' + (s.tura ? 'primesc comenzi' : 'în pauză') + '</span></label></div>' + (typeof cardNotificari === 'function' ? cardNotificari() : '');
}
const linieSpec = (t) => { const im = D('imobile')[t.imobil] || {}; return (im.cf ? 'CF ' + im.cf + ' · ' : '') + esc(im.adresa || '') + (im.adresa ? ', ' : '') + esc(im.uat || '') + (im.judet ? ', ' + esc(im.judet) : ''); };
function specNoi() {
  const of = L('oferte', (x) => x.spec === UI.spec && x.raspuns === 'deschisa').map((x) => D('taskuri')[x.task]).filter((t) => t && t.stare === 'oferit');
  return specCap() + '<h1>Comenzi noi <i>' + of.length + '</i></h1>' + (of.length ? of.map((t) => '<div class="of"><small>' + tNr(t) + (t.urgent ? ' · urgent' : '') + '</small><b>' + esc(t.n) + '</b><span>' + linieSpec(t) + '</span><div class="of2"><div><small>primești</small><b>' + lei(t.tarif) + '</b></div><div><small>timp de lucru</small><b>' + (t.sla ? fmtD(t.sla) : '—') + '</b></div></div><div class="btns">' + sBtn('sacc', 'Accept', t.id, 'pri mare') + sBtn('sref', 'Nu pot', t.id, 'mare') + '</div></div>').join('') : gol('Nicio comandă nouă.', 'Când apare una, primești notificare.')) + (of.length ? '<p class="small mut ctr">Comenzile le văd și alți specialiști. O ia primul care acceptă.</p>' : '');
}
function specLucru() {
  const ts = L('taskuri', (t) => t.specialist === UI.spec && ['atribuit', 'blocat'].includes(t.stare));
  return '<h1>În lucru <i>' + ts.length + '</i></h1>' + (ts.length ? ts.map((t) => '<div class="rd lin" data-a="st" data-id="' + t.id + '"><div><small>' + tNr(t) + '</small><b>' + esc(t.n) + '</b><span>' + linieSpec(t) + '</span></div><div class="dr">' + ceas(t) + (t.stare === 'blocat' ? chip('blocat') : '') + '</div></div>').join('') : gol('Nimic în lucru.', 'Comenzile acceptate apar aici.'));
}
function specTrimise() {
  const ts = L('taskuri', (t) => t.specialist === UI.spec && t.stare === 'terminat').sort((a, b) => b.terminat_la - a.terminat_la).slice(0, 40);
  return '<h1>Trimise <i>' + ts.length + '</i></h1>' + (ts.length ? ts.map((t) => '<div class="rd lin" data-a="st" data-id="' + t.id + '"><div><small>' + tNr(t) + ' · ' + hhmm(t.terminat_la) + '</small><b>' + esc(t.n) + '</b><span>' + linieSpec(t) + '</span></div><div class="dr"><b>' + lei(t.tarif) + '</b></div></div>').join('') : gol('Încă nimic trimis.'));
}
function specPas(t) {
  const gata = t.stare === 'terminat', editabil = t.specialist === UI.spec && t.stare === 'atribuit';
  const tr = [['Primită', 'ok'], ['Verifici', gata ? 'ok' : 'act'], ['La administrator', gata ? 'ok' : 'urm']];
  return '<a class="inap" href="#" data-a="sback">‹ Înapoi</a><div class="tit"><h1>' + esc(t.n) + '</h1></div><p class="sub">' + tNr(t) + ' · ' + linieSpec(t) + '</p>' +
    '<ol class="stp">' + tr.map((x, i) => '<li class="' + x[1] + '"><b>' + (x[1] === 'ok' ? '✓' : i + 1) + '</b><span>' + x[0] + '</span><small>' + (x[1] === 'act' ? 'aici ești' : '') + '</small></li>').join('') + '</ol>' +
    '<div class="of2 cd"><div><small>primești</small><b>' + lei(t.tarif) + '</b></div><div><small>' + (gata ? 'trimis' : 'timp rămas') + '</small><b>' + (gata ? hhmm(t.terminat_la) : ceas(t) || '—') + '</b></div></div>' + problemeHtml(t, false) +
    formPas(t, !editabil) +
    (editabil ? '<div class="bar">' + sBtn('sfin', 'Trimite la administrator', t.id, 'pri mare') + '</div><p class="ctr small"><a href="#" class="mut" data-a="pbm" data-id="' + t.id + '">Am o problemă</a> · <a href="#" class="mut" data-a="ret" data-id="' + t.id + '">Nu pot continua</a></p>' : '');
}

/* ---------- cadru ---------- */
renderApp = function () {
  const app = $('#app'); if (!app) return;
  const coada = TOAST ? '<div id="toast" class="toast">' + esc(TOAST) + '</div>' : '';
  if (!UI.auth) { app.innerHTML = '<div class="s2">' + loginView() + (syncAvailable() && !UI.setPass ? '<div class="login" style="margin-top:12px"><b>Fără parolă</b><p class="small mut">Scrie e-mailul contului mai sus și primești un link de intrare.</p><button class="b mare" data-a="slink">Trimite-mi link pe e-mail</button></div>' : '') + '</div>' + coada; return; }
  const rol = UI.auth.rol, sef = ['admin', 'tehnic', 'operator'].includes(rol);
  if (!sef && rol !== 'specialist') { app.innerHTML = '<div class="s2"><div class="gol2"><b>Versiunea simplă e pentru Administrator și Specialist.</b><span><a href="index.html">Deschide versiunea completă</a></span></div></div>' + coada; return; }
  if (rol === 'specialist') { UI.role = 'specialist'; UI.spec = UI.auth.sid; } else if (S.ca && D('specialisti')[S.ca]) { UI.role = 'specialist'; UI.spec = S.ca; } else { UI.role = rol; S.ca = null; }
  const sp = eSpec(), taburi = sp ? [['noi', 'Noi'], ['lucru', 'În lucru'], ['trimise', 'Trimise']] : [['azi', 'Azi'], ['comenzi', 'Comenzi'], ['mesaje', 'Mesaje'], ['mai', 'Mai mult']];
  if (!taburi.some((x) => x[0] === S.tab)) S.tab = taburi[0][0];
  let t = S.t && D('taskuri')[S.t], o = S.o && D('comenzi')[S.o];
  if (sp && t && t.specialist !== UI.spec) { t = null; S.t = null; }
  if (sp) { o = null; S.o = null; }
  const corp = sp ? (t ? specPas(t) : { noi: specNoi, lucru: specLucru, trimise: specTrimise }[S.tab]()) : (t ? adminPas(t) : o ? adminComanda(o) : { azi: adminAzi, comenzi: adminComenzi, mesaje: () => '<h1>Mesaje</h1>' + cereriView(), mai: () => ({ echipa: adminEchipa, cf: adminCF, date: adminDate }[S.pg] || adminMai)() }[S.tab]());
  const nr = { azi: sp ? 0 : randulTau().length, mesaje: sp ? 0 : intrebariDeschise().length, noi: sp ? L('oferte', (x) => x.spec === UI.spec && x.raspuns === 'deschisa').length : 0, lucru: sp ? L('taskuri', (x) => x.specialist === UI.spec && ['atribuit', 'blocat'].includes(x.stare)).length : 0 };
  const deschise = [...document.querySelectorAll('details[data-k][open]')].map((d) => d.dataset.k);
  const lista = L('specialisti', (s) => !s.spec.includes('analist'));
  app.innerHTML = '<div class="s2"><header class="hd"><div class="br"><i></i><div><b>DD Operare</b><span>' + (sp ? 'Specialist' : rol === 'operator' ? 'Operator' : 'Administrator') + ' · ' + esc(sp && D('specialisti')[UI.spec] ? D('specialisti')[UI.spec].nume : UI.auth.nume) + '</span></div></div>' +
    (sef ? '<div class="seg"><button class="' + (sp ? '' : 'on') + '" data-a="sca" data-id="">' + (rol === 'operator' ? 'Operator' : 'Administrator') + '</button><button class="' + (sp ? 'on' : '') + '" data-a="sca" data-id="' + esc(S.ca || (lista[0] || {}).id || '') + '">Specialist</button></div>' : sBtn('logout', 'Ieși', '', 'mic')) + '</header>' +
    (sef && sp ? '<div class="caa">Vezi ca <select data-s="ca">' + lista.map((s) => '<option value="' + s.id + '"' + (s.id === UI.spec ? ' selected' : '') + '>' + esc(s.nume) + ' · ' + esc(SPEC[s.spec[0]]) + '</option>').join('') + '</select></div>' : '') +
    '<main>' + corp + '</main>' +
    '<nav class="tb">' + taburi.map((x) => '<button class="' + (S.tab === x[0] && !t && !o ? 'on' : '') + '" data-a="stab" data-id="' + x[0] + '">' + x[1] + (nr[x[0]] ? '<i>' + nr[x[0]] + '</i>' : '') + '</button>').join('') + '</nav></div>' +
    (MODAL ? '<div class="ov" data-a="mclose"><div class="md"><div class="mh"><h3>' + MODAL.title + '</h3>' + btn('mclose', '✕', { c: 'mic' }) + '</div><div class="mb">' + MODAL.html + '</div></div></div>' : '') + coada;
  deschise.forEach((k) => { const d = document.querySelector('details[data-k="' + k + '"]'); if (d) d.open = true; });
  if (sp && UI.knownOffers == null) UI.knownOffers = L('oferte', (x) => x.spec === UI.spec && x.raspuns === 'deschisa').map((x) => x.id);
  tickTimers(); sSave();
};

Object.assign(A, {
  stab: (d) => { S.tab = d.id; S.o = S.t = null; S.pg = null; window.scrollTo(0, 0); if (d.id === 'mesaje' && typeof incarcaCereriApp === 'function' && CERERI_APP.rows == null) return incarcaCereriApp(); },
  so: (d) => { MODAL = null; if (!D('comenzi')[d.id]) { S.tab = 'mesaje'; S.o = S.t = null; return; } S.o = d.id; S.t = null; window.scrollTo(0, 0); },
  open: (d) => A.so(d),
  st: (d) => { const t = D('taskuri')[d.id]; if (!t) return; S.t = t.id; S.o = t.comanda; window.scrollTo(0, 0); if (!eSpec() && extern(t) && t.stare === 'terminat' && !t.vazut_admin) t.vazut_admin = now(); if (!eSpec() && intern(t) && ['disponibil', 'oferit'].includes(t.stare) && internId()) forceAssign(t.id, internId()); },
  sback: () => { if (S.t && !eSpec()) S.t = null; else { S.t = null; S.o = null; } },
  sfil: (d) => { S.f = d.id; S.tab = 'comenzi'; S.o = S.t = null; },
  spreia: (d) => { if (preiaComanda(d.id, (UI.auth || {}).nume)) toast('Preluată. Clientul e anunțat, iar pasul a plecat la specialiști.'); },
  slipsa: (d) => openModal('Ce lipsește din comandă?', '<p class="small mut">Clientul primește mesajul tău și linkul unde completează. Comanda rămâne în așteptare.</p>' + mf('txt', 'Ce îi ceri clientului', 'textarea') + btn('scomplet', 'Trimite clientului', { id: d.id, c: 'pri' })),
  scomplet: (d) => { if (cereCompletare(d.id, val('txt'), (UI.auth || {}).nume)) { MODAL = null; toast('Am cerut clientului să completeze.'); } else toast('Scrie ce lipsește.'); },
  strimitecl: (d) => { if (trimiteClient(d.id, (UI.auth || {}).nume)) toast('Comanda a plecat la client.'); },
  slink: async () => { const i = document.querySelector('form[data-f="login"] [name="email"]'), email = i && i.value.trim(); if (!email) { toast('Scrie întâi e-mailul contului.'); return; } if (!SYNC.sb) { toast('Legătura cu serverul nu e pornită.'); return; } const { error } = await SYNC.sb.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: location.origin + location.pathname } }); toast(error ? 'Nu am putut trimite: ' + error.message : 'Ți-am trimis linkul. Deschide-l pe acest telefon.'); },
  strimite: (d) => { forceAssign(d.id, d.x); toast('Trimis la ' + spName(d.x) + '.'); },
  seu: (d) => { if (internId()) forceAssign(d.id, internId()); },
  sacc: (d) => { if (!acceptTask(d.id, UI.spec)) toast('Oferta nu mai e valabilă.'); else { S.t = d.id; S.tab = 'lucru'; window.scrollTo(0, 0); } },
  sref: (d) => refuseTask(d.id, UI.spec, 'refuzat'),
  sfin: (d) => {
    const t = D('taskuri')[d.id]; const err = finishTask(d.id, eSpec() ? UI.spec : t.specialist);
    if (err.length) { openModal('Mai lipsește ceva', '<ul>' + err.map((e) => '<li>' + esc(e) + '</li>').join('') + '</ul>'); return; }
    advance(); window.scrollTo(0, 0);
    if (eSpec()) { S.t = null; S.tab = 'trimise'; toast('Trimis la administrator.'); return; }
    const o = D('comenzi')[t.comanda], u = urmeaza(o);
    if (u.a === 'st' && !u.sec) { A.st({ id: u.id }); toast('Gata. Urmează: ' + D('taskuri')[u.id].n); } else { S.t = null; toast(o.stare === 'livrata' ? 'Comanda a plecat la client.' : 'Gata.'); }
  },
  sca: (d) => { S.ca = d.id || null; S.o = S.t = null; S.tab = d.id ? 'noi' : 'azi'; UI.knownOffers = null; },
  sexpl: (d) => adaugaExplicatie(d.id),
  spg: (d) => { S.tab = 'mai'; S.pg = d.id || null; S.o = S.t = null; X.test = null; window.scrollTo(0, 0); if ((d.id === 'echipa' || d.id === 'date') && SYNC.on) return incarcaEchipa(); },
  slinkcopie: async () => { try { await navigator.clipboard.writeText(adresa()); toast('Linkul e copiat.'); } catch (e) { openModal('Linkul aplicației', '<textarea rows="3" style="width:100%">' + esc(adresa()) + '</textarea>'); } },
  sinv: async (d) => { const c = (UI.conturi || []).find((x) => x.id === d.id); if (!c) return; try { await navigator.clipboard.writeText(invitatie(c)); toast('Invitația e copiată. O poți lipi în mesaj.'); } catch (e) { openModal('Invitația', '<textarea rows="8" style="width:100%">' + esc(invitatie(c)) + '</textarea>'); } },
  scontnou: async () => {
    const rol = val('rol'), email = String(val('email')).trim().toLowerCase(), nume = String(val('nume')).trim(), parola = val('parola') || null; let spid = rol === 'specialist' ? val('spid') : null, s = null;
    if (!email) { toast('Scrie e-mailul.'); return; }
    if (rol === 'specialist' && spid === '__nou') { if (!nume) { toast('Scrie numele specialistului.'); return; } s = { id: uid('sp'), status: 'activ', tura: true, nume, spec: [val('spec') || 'ancpi'], judete: String(val('judete') || '*').split(',').map((x) => x.trim()).filter(Boolean), uat: '', cap: 3, rating: 0, atestat: '', tel: '', email }; spid = s.id; }
    try {
      const r = await fnConturi({ actiune: 'creeaza', email, nume, rol, specialist_id: spid || null, parola, redirect: adresa() });
      if (s) { D('specialisti')[s.id] = s; ev('specialist.creat', (UI.auth || {}).nume || 'admin', { k: 'specialist', id: s.id }); R.save(); }
      await incarcaEchipa();
      openModal(r.invitat ? 'Invitație trimisă pe e-mail' : 'Cont creat', '<p class="small">Trimite-i persoanei textul de mai jos' + (parola ? ', împreună cu parola pe care ai ales-o' : '') + '.</p><textarea rows="8" style="width:100%">' + esc(invitatie({ email })) + '</textarea>');
    } catch (e) { toast(e.message); }
  },
  spushtest: async (d) => { try { const { data, error } = await SYNC.sb.functions.invoke('dispecer', { body: { actiune: 'test_push_cont', user_id: d.id } }); toast(error || !data || data.eroare ? 'Nu am putut trimite: ' + ((data && data.eroare) || (error && error.message) || 'eroare') : data.trimise ? 'Notificare trimisă pe ' + data.trimise + (data.trimise === 1 ? ' dispozitiv.' : ' dispozitive.') : 'Nu s-a trimis: ' + (data.erori ? 'telefonul a refuzat-o.' : 'contul nu are notificările pornite.')); } catch (e) { toast(e.message); } },
  stestlogin: async () => {
    const email = String(val('temail')).trim(), parola = val('tparola'); if (!email || !parola) { toast('Scrie e-mailul și parola.'); return; }
    const c = window.supabase.createClient(window.EPAY_CFG.supabaseUrl, window.EPAY_CFG.supabaseKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'dd_test_intrare' } });
    const { data, error } = await c.auth.signInWithPassword({ email, password: parola });
    if (error) { X.test = { ok: false, txt: 'Nu merge: e-mail sau parolă greșite, ori cont blocat.' }; return; }
    const { data: p } = await c.from('profiluri').select('rol,nume,specialist_id').eq('user_id', data.user.id).maybeSingle();
    await c.auth.signOut({ scope: 'local' });
    X.test = p ? { ok: true, txt: 'Merge. ' + email + ' intră ca ' + (ROL2[p.rol] || p.rol) + (p.specialist_id ? ' · ' + spName(p.specialist_id) : '') + '.' } : { ok: false, txt: 'Parola e bună, dar contul nu are rol în aplicație.' };
  },
  scfcsv: () => dl('registru_cf_' + new Date().toISOString().slice(0, 10) + '.csv', '\ufeff' + csvCF(), 'text/csv;charset=utf-8')
});
document.addEventListener('input', (e) => {
  const k = e.target.dataset && e.target.dataset.s; if (k !== 'q' && k !== 'qcf') return;
  S[k] = e.target.value; const pos = e.target.selectionStart; renderApp();
  const n = document.querySelector('[data-s="' + k + '"]'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (x) { /* fără selecție */ } }
});
document.addEventListener('change', (e) => {
  const k = e.target.dataset && e.target.dataset.s; if (k !== 'ca' && k !== 'per') return;
  if (k === 'ca') { S.ca = e.target.value; S.t = null; UI.knownOffers = null; } else S.per = e.target.value;
  renderApp();
});
document.addEventListener('change', (e) => {
  if (!e.target.dataset || e.target.dataset.s !== 'rap') return;
  const oid = e.target.dataset.id, cine = (UI.auth || {}).nume || 'admin';
  Array.from(e.target.files).forEach((file) => { const d = ataseaza(oid, file.name || 'raport.pdf', Math.round(file.size / 1e4) / 100, cine, file.type); if (!d) return; FILEBLOBS[d.id] = URL.createObjectURL(file); if (typeof syncUpload === 'function') syncUpload(d, file); });
  commit();
});
window.S2 = { S, etape, urmeaza, randulTau };
})();

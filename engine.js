/* Platforma de operare · motorul (date, dispecerizare, SLA, plăți, livrare, contoare).
   Interfața de date: obiectul R (LocalRepo în faza 1). Faza 2 = un SupabaseRepo cu aceleași metode (cache local + scriere prin),
   restul codului (motorul și vederile) nu se schimbă. Toate statisticile se calculează din R.db.evenimente. */
'use strict';

const MIN = 60000, ORA = 3600000, ZI = 86400000;

class LocalRepo {
  constructor(key) { this.key = key; this.db = null; this.bc = null; this.onremote = null; }
  load() { try { const s = localStorage.getItem(this.key); this.db = s ? JSON.parse(s) : null; } catch (e) { this.db = null; } return this.db; }
  save() {
    try { localStorage.setItem(this.key, JSON.stringify(this.db)); } catch (e) { console.warn('salvare eșuată', e); }
    if (this.bc) this.bc.postMessage('chg');
  }
  listen(cb) {
    this.onremote = cb;
    if ('BroadcastChannel' in window) { this.bc = new BroadcastChannel('epay-platforma'); this.bc.onmessage = () => { this.load(); cb(); }; }
    window.addEventListener('storage', e => { if (e.key === this.key) { this.load(); cb(); } });
  }
  col(n) { const c = this.db[n]; return { list: (p) => Object.values(c).filter(p || (() => true)), get: (id) => c[id], put: (o) => (c[o.id] = o), remove: (id) => { delete c[id]; } }; }
}
const R = new LocalRepo('epay_platforma_v1');

/* Ceasul e cel real. offsetMs se folosește doar la construirea seed-ului (comenzi „de acum 40 de minute”). */
const now = () => Date.now() + ((R.db && R.db.offsetMs) || 0);
const uid = (p) => p + '_' + (R.db.seq++).toString(36) + Math.random().toString(36).slice(2, 5); /* sufix aleator: id-uri unice și când scriu mai multe dispozitive */
/* în modul sincronizat, doar admin/tehnic rulează dispecerul (oferte, termene, livrare); ceilalți fac doar acțiunile lor */
const limited = () => typeof SYNC !== 'undefined' && SYNC.on && !['admin', 'tehnic', 'operator'].includes(SYNC.prof.rol);
const D = (n) => R.db[n];
const L = (n, p) => Object.values(R.db[n]).filter(p || (() => true));
function ev(tip, actor, obj, data) { R.db.evenimente.push({ id: R.db.evenimente.length + 1, t: now(), tip, actor: actor || 'sistem', obj: obj || null, data: data || null }); }
const fmtT = (t) => { const d = new Date(t); const p = (x) => String(x).padStart(2, '0'); return p(d.getDate()) + '.' + p(d.getMonth() + 1) + '.' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()); };
const fmtD = (min) => { if (min == null || isNaN(min)) return '–'; min = Math.round(min); if (min < 60) return min + ' min'; if (min < 1440) return Math.floor(min / 60) + ' h ' + String(min % 60).padStart(2, '0') + ' min'; return Math.floor(min / 1440) + ' z ' + Math.floor((min % 1440) / 60) + ' h'; };
const lei = (n) => Math.round(n).toLocaleString('ro-RO') + ' lei';
const hashStr = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16).padStart(8, '0') + (s.length * 7919 >>> 0).toString(16).padStart(6, '0'); };

/* ---------- construcție ---------- */
function emptyDb() {
  return {
    v: 1, seq: 1000, offsetMs: 0, settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)), rr: {},
    dosare: {}, clienti: {}, imobile: {}, comenzi: {}, linii: {}, taskuri: {}, specialisti: {}, oferte: {}, plati: {}, oferte_pret: {}, documente: {},
    notificari: {}, probleme: {}, sugestii: {}, tinte: {}, contracte: {}, fise: {}, juridic: {}, servicii: {}, acte: {}, plan: {}, ocr: {}, intrebari: {}, planop: {}, evenimente: [], cosuri: [], surse: [], asteptare: [], mesaje: []
  };
}

function findClient(email, nume, extra) {
  let c = L('clienti', x => x.email === email)[0];
  if (!c) { c = { id: uid('cl'), email, nume: nume || '', tip: extra && extra.pj ? 'PJ' : 'PF', tel: (extra && extra.tel) || '', wa: (extra && extra.wa) || '', wa_optin: !!(extra && extra.wa), gdpr: true, limba: 'ro', facturare: extra && extra.pj ? 'CUI RO0000000 (demo)' : '' }; D('clienti')[c.id] = c; }
  if (extra && extra.wa) { c.wa = extra.wa; c.wa_optin = true; }
  return c;
}

/* creează o comandă din rândul trimis de site (forma epay_comenzi) */
function createOrder(row) {
  const cl = findClient(row.email, row.cl, row);
  const o = {
    id: uid('o'), nr: row.nr, sursa: row.sursa || 'site', client: cl.id, judet: row.judet, uat: row.uat, mod: row.mode, urgent: !!row.urgent,
    stare: 'neconfirmata', creata_la: now(), plata_la: null, livrata_la: null, inchisa_la: null, canal: cl.wa_optin ? 'ambele' : 'email',
    acord: row.acord === undefined ? null : row.acord, acord_la: row.acord === true ? now() : null, credit: row.credit || null, total: 0, imobile: [], note: row.note || ''
  };
  const imos = [{ cf: row.cf, adresa: row.adresa, pin: row.pin, uat: row.uat, tip: row.tip, sv: row.sv }].concat((row.extra || []).map(x => ({ cf: x.cf, uat: x.uat, tip: row.tip, sv: x.sv || ['cf'] })));
  imos.forEach(im => {
    const imo = { id: uid('im'), cf: im.cf || null, adresa: im.adresa || row.adresa || null, pin: im.pin || null, uat: im.uat || row.uat, judet: row.judet, tip: im.tip || 'casa', nr_cad: null };
    D('imobile')[imo.id] = imo; o.imobile.push(imo.id);
    im.sv.forEach(svc => {
      const priced = SV[svc][1] != null;
      const ln = { id: uid('ln'), comanda: o.id, imobil: imo.id, svc, pret: priced ? SV[svc][1] : null, tip: priced ? 'plata' : 'oferta', stare: priced ? 'asteptare' : 'cerere', plata: null, incl: false };
      D('linii')[ln.id] = ln;
    });
  });
  D('comenzi')[o.id] = o;
  recalcTotal(o);
  ev('comanda.creata', 'site', { k: 'comanda', id: o.id }, { nr: o.nr, total: o.total });
  return o;
}
function recalcTotal(o) {
  let t = L('linii', l => l.comanda === o.id && l.tip === 'plata' && l.stare !== 'anulat' && !l.incl).reduce((a, l) => a + (l.pret || 0), 0);
  if (o.urgent) t += URGENT_PRICE;
  if (o.credit && L('linii', l => l.comanda === o.id && (l.svc === 'rAp' || l.svc === 'rInt')).length) { const prev = L('comenzi', c => c.nr === o.credit)[0]; if (prev) t -= L('plati', p => p.comanda === prev.id && p.stare === 'capturata').reduce((a, p) => a + p.suma, 0); }
  o.total = Math.max(0, t);
}

/* ---------- plăți ---------- */
function newPay(o, suma, linii, opt) {
  const p = { id: uid('pl'), comanda: o.id, proc: 'Stripe (test)', suma, stare: 'initiata', tx: null, la: now(), capturata_la: null, factura: null, rambursat: 0, linii: linii || [], motiv: '', metoda: 'card' };
  Object.assign(p, opt || {}); D('plati')[p.id] = p; ev('plata.initiata', 'site', { k: 'plata', id: p.id }, { suma }); return p;
}
function payFail(pid, motiv) { const p = D('plati')[pid]; p.stare = 'esuata'; p.motiv = motiv || 'card refuzat'; ev('plata.esuata', 'procesator', { k: 'plata', id: pid }, { motiv: p.motiv }); }
function payCapture(pid) {
  const p = D('plati')[pid]; if (p.stare === 'capturata') return;
  p.stare = 'capturata'; p.capturata_la = now(); p.tx = 'NT' + hashStr(pid).slice(0, 8).toUpperCase();
  ev('plata.capturata', 'procesator', { k: 'plata', id: pid }, { suma: p.suma, tx: p.tx });
  const o = D('comenzi')[p.comanda]; if (!o.plata_la) o.plata_la = now();
  p.linii.forEach(id => { const l = D('linii')[id]; if (l && l.stare === 'asteptare') l.stare = 'platita'; if (l && l.stare === 'acceptata') l.stare = 'platita'; l.plata = pid; });
  activate(o);
}
function activate(o) {
  if (o.stare === 'anulata' || o.stare === 'inchisa') return;
  if (o.acord !== true) { if (o.stare !== 'in_asteptare_acord') { o.stare = 'in_asteptare_acord'; ev('comanda.asteapta_acord', 'sistem', { k: 'comanda', id: o.id }); notify(o, 'acord', {}); } return; }
  const firstTime = o.stare !== 'activa';
  o.stare = 'activa';
  const paid = L('linii', l => l.comanda === o.id && l.stare === 'platita');
  if (paid.length) genTasks(paid);
  if (firstTime) notify(o, 'primita', {});
  advance();
}
function giveAcord(oid, txt) { const o = D('comenzi')[oid]; o.acord = true; o.acord_la = now(); o.acord_text = txt || 'v1'; ev('comanda.acord', 'client', { k: 'comanda', id: oid }, { ip: '203.0.113.7 (sim)', versiune: 'v1' }); if (L('plati', p => p.comanda === oid && p.stare === 'capturata').length) activate(o); }
function refund(pid, suma, motiv, actor) {
  const p = D('plati')[pid]; suma = Math.min(suma, p.suma - p.rambursat); if (suma <= 0) return;
  p.rambursat += suma; p.stare = p.rambursat >= p.suma ? 'rambursata' : 'rambursata_part'; p.motiv = motiv;
  ev('plata.rambursata', actor || 'admin', { k: 'plata', id: pid }, { suma, motiv });
  const o = D('comenzi')[p.comanda]; notify(o, 'rambursare', { suma, motiv });
}
function invoice(pid) { const p = D('plati')[pid]; if (p.factura) return; p.factura = { nr: 'FCT-' + String(2600 + (R.db.seq++ % 9000)), la: now(), spv: 'trimisa' }; ev('factura.emisa', 'plati', { k: 'plata', id: pid }, { nr: p.factura.nr }); }
function spvSet(pid, st) { const p = D('plati')[pid]; if (p.factura) { p.factura.spv = st; ev('factura.spv', 'plati', { k: 'plata', id: pid }, { spv: st }); } }

/* ---------- generare taskuri ---------- */
function slaOf(t, urgent) { return t.sla ? t.sla * (urgent ? D('settings').urgentFactor : 1) * D('settings').slaFactor : 0; }
function genTasks(lines) {
  const byImo = {};
  lines.forEach(l => (byImo[l.imobil] = byImo[l.imobil] || []).push(l));
  Object.keys(byImo).forEach(imoId => {
    const ls = byImo[imoId]; const o = D('comenzi')[ls[0].comanda]; const imo = D('imobile')[imoId];
    /* necesită CF dar nu există? adaug linie implicită */
    const allLines = L('linii', l => l.imobil === imoId && l.stare !== 'anulat');
    const hasCF = allLines.some(l => ['cf', 'ident', 'rAp', 'rInt'].includes(l.svc));
    const needsCF = ls.some(l => (CH[l.svc]() || []).some(t => (t.dep || []).includes('@CF')));
    if (!hasCF && needsCF) { const ln = { id: uid('ln'), comanda: o.id, imobil: imoId, svc: 'cf', pret: 0, tip: 'plata', stare: 'platita', plata: null, incl: true }; D('linii')[ln.id] = ln; ls.unshift(ln); }
    const made = {};
    ls.filter(l => !L('taskuri', t => t.linie === l.id).length).forEach(l => {
      made[l.id] = CH[l.svc]().map(tp => {
        const t = {
          id: l.id + ':' + tp.k, linie: l.id, comanda: o.id, nr: o.nr, comanda_la: o.creata_la, imobil: imoId, k: tp.k, cod: tp.cod || tp.k, n: tp.n, spec: tp.spec, tip: tp.tip, judet: o.judet, uat: imo.uat,
          urgent: o.urgent, stare: 'asteptare', dep: [], depLines: [], tokens: tp.dep.filter(d => d[0] === '@' || true), sla: slaOf(tp, o.urgent), slaBase: tp.sla, tarif: tp.tarif,
          check: tp.check.map(c => ({ t: c, ok: false })), fields: tp.fields.map(f => ({ k: f.k, label: f.label, type: f.type, opt: f.opt, val: '' })), reqFiles: tp.files.map(f => ({ tip: f[0], label: f[1], req: !!f[2] })),
          fisiere: [], teren: !!tp.teren, terta: !!tp.terta, termenMin: tp.termenMin || 0, juridic: !!tp.juridic, out: tp.out || null, cfFinal: !!tp.cfFinal,
          creat_la: now(), disponibil_la: null, oferit_la: null, acceptat_la: null, terminat_la: null, specialist: null, excluse: [], ofertate: [], retur: 0, pierdut: [], failOnce: false
        };
        D('taskuri')[t.id] = t; return t;
      });
    });
    /* rezolvare dependențe */
    Object.keys(made).forEach(lid => {
      made[lid].forEach(t => {
        const tp = CH[D('linii')[lid].svc]().find(x => x.k === t.k);
        tp.dep.forEach(d => {
          if (d === '@CF') {
            const cfs = L('taskuri', x => x.imobil === imoId && x.cfFinal && x.id !== t.id);
            cfs.forEach(c => t.dep.push(c.id));
          } else if (d.startsWith('@line:')) {
            const svc = d.slice(6); L('linii', x => x.imobil === imoId && x.svc === svc && x.stare !== 'anulat' && x.id !== lid).forEach(x => { t.depLines.push(x.id); });
          } else t.dep.push(lid + ':' + d);
        });
        t.dep = [...new Set(t.dep)];
      });
    });
    /* taskurile din lanțuri deja existente care așteaptă linia nou-venită (ex. raport care așteaptă opinia) */
    L('taskuri', x => x.imobil === imoId && x.stare === 'asteptare').forEach(x => {
      const tp = CH[D('linii')[x.linie].svc]().find(z => z.k === x.k);
      (tp.dep || []).filter(d => d.startsWith('@line:')).forEach(d => { const svc = d.slice(6); ls.filter(l => l.svc === svc).forEach(l => { if (!x.depLines.includes(l.id)) x.depLines.push(l.id); }); });
    });
    ls.forEach(l => { if (l.stare === 'platita') l.stare = 'in_lucru'; });
    /* eșec demonstrativ (o singură dată) */
    L('taskuri', t => t.comanda === o.id && t.k === 'rA_R05' && o.note && o.note.includes('demo-esec')).forEach(t => (t.failOnce = true));
  });
}

function depsMet(t) {
  return t.dep.every(id => { const x = D('taskuri')[id]; return !x || x.stare === 'terminat' || x.stare === 'anulat'; }) &&
    t.depLines.every(id => { const l = D('linii')[id]; return !l || ['livrat', 'anulat'].includes(l.stare); });
}

/* ---------- dispecerizare ---------- */
const load = (s) => L('taskuri', t => t.specialist === s.id && ['atribuit', 'blocat'].includes(t.stare)).length;
function eligible(t) {
  /* nu mai mult de capacitate + 2 oferte deschise odată: specialistul nu e inundat, restul trec la următorul */
  const deschise = (s) => L('oferte', o => o.spec === s.id && o.raspuns === 'deschisa').length;
  return L('specialisti', s => s.status === 'activ' && s.spec.includes(t.spec) && (s.judete.includes('*') || s.judete.includes(t.judet)) && s.tura && load(s) < s.cap && (s.spec[0] === 'analist' || load(s) + deschise(s) < s.cap + 2) && !t.excluse.includes(s.id) && !t.ofertate.includes(s.id))
    .sort((a, b) => (b.rating - a.rating) || (load(a) - load(b)) || ((b.uat === t.uat) - (a.uat === t.uat)));
}
function ofertaMin(t) { return (D('settings').ofertaMin[t.spec] || 30) * (t.urgent ? D('settings').urgentFactor : 1); }
function dispatch(t) {
  if (t.spec === 'motor') { t.stare = 'disponibil'; t.disponibil_la = t.disponibil_la || now(); return; }
  t.disponibil_la = t.disponibil_la || now();
  const el = eligible(t);
  /* toți specialiștii potriviți sunt ocupați → pasul așteaptă în coadă; escaladare doar când nu există niciun specialist activ pentru specialitate + județ */
  const exista = L('specialisti', s => s.status === 'activ' && s.spec.includes(t.spec) && (s.judete.includes('*') || s.judete.includes(t.judet)) && !t.excluse.includes(s.id)).length;
  if (!el.length && exista && !t.ofertate.length) { t.stare = 'disponibil'; return; }
  if (!el.length) { t.stare = 'escaladat'; ev('task.escaladat', 'sistem', { k: 'task', id: t.id }, { motiv: 'niciun specialist disponibil', judet: t.judet }); notifyIn('admin', 'Escaladare: ' + t.n + ' (' + t.judet + ') nu are specialist disponibil', t.id); return; }
  if (D('settings').autoAtribuire[t.spec]) {
    const i = (D('rr')[t.spec] = ((D('rr')[t.spec] || 0) + 1)) % el.length;
    const s = el[i]; t.ofertate.push(s.id); t.stare = 'oferit';
    const of = { id: uid('of'), task: t.id, spec: s.id, oferit_la: now(), expira_la: now() + 1e12, raspuns: 'deschisa', motiv: '', auto: true }; D('oferte')[of.id] = of;
    ev('oferta.creata', 'sistem', { k: 'task', id: t.id }, { spec: s.id, auto: true }); acceptTask(t.id, s.id, true); return;
  }
  /* bursă: pasul apare la toți specialiștii potriviți și îl ia primul care acceptă */
  t.stare = 'oferit'; t.oferit_la = now();
  el.forEach(s => {
    t.ofertate.push(s.id);
    const of = { id: uid('of'), task: t.id, spec: s.id, oferit_la: now(), expira_la: now() + ofertaMin(t) * MIN, raspuns: 'deschisa', motiv: '' }; D('oferte')[of.id] = of;
    ev('oferta.creata', 'sistem', { k: 'task', id: t.id }, { spec: s.id });
  });
}
/* pașii oamenilor pornesc abia după ce administratorul a verificat și a preluat comanda (settings.okAdmin; implicit da) */
const asteaptaOk = (t) => t.spec !== 'motor' && D('settings').okAdmin !== false && !(D('comenzi')[t.comanda] || {}).preluata_la;
function advance() {
  if (limited()) return;
  let ch = true, guard = 0;
  while (ch && guard++ < 50) {
    ch = false;
    L('taskuri', t => t.stare === 'asteptare').forEach(t => {
      const l = D('linii')[t.linie]; if (l.stare === 'problema' || l.stare === 'anulat') return;
      if (asteaptaOk(t)) return;
      if (depsMet(t)) { t.stare = 'disponibil'; ch = true; ev('task.disponibil', 'sistem', { k: 'task', id: t.id }); dispatch(t); notifyTaskReady(t); }
    });
  }
}
function notifyTaskReady(t) {
  const o = D('comenzi')[t.comanda];
  if (t.teren && /^Programează/.test(t.n)) notify(o, 'programare', { serviciu: SV[D('linii')[t.linie].svc][0] });
}
/* cu motorul pe server, termenele și oferirea pașilor nu mai rulează și în browser, ca să nu se dubleze */
const motorServer = () => typeof SYNC !== 'undefined' && SYNC.on && R.db && R.db.settings && R.db.settings.motor_server;
function tick() {
  if (limited() || motorServer()) return;
  const tm = now();
  runMotors();
  L('oferte', of => of.raspuns === 'deschisa' && of.expira_la <= tm).forEach(of => {
    of.raspuns = 'expirata'; const t = D('taskuri')[of.task]; ev('oferta.expirata', 'sistem', { k: 'task', id: t.id }, { spec: of.spec });
    if (t.stare === 'oferit' && !L('oferte', x => x.task === t.id && x.raspuns === 'deschisa').length) dispatch(t);
  });
  L('taskuri', t => t.stare === 'atribuit' && !t.terta && !t.teren && t.sla > 0 && t.acceptat_la + t.sla * MIN <= tm).forEach(t => {
    const sp = t.specialist; t.pierdut.push({ spec: sp, la: tm }); t.excluse.push(sp); t.specialist = null; t.acceptat_la = null; t.stare = 'disponibil';
    ev('task.timeout', 'sistem', { k: 'task', id: t.id }, { spec: sp, sla: t.sla });
    notifyIn('spec:' + sp, 'Ai pierdut taskul „' + t.n + '” prin depășirea termenului', t.id);
    dispatch(t);
  });
  advance();
  reconcile();
}
/* completează efectele pe care un dispozitiv cu drepturi limitate nu le-a putut scrie (livrare, mesaje, cazuri speciale) */
function reconcile() {
  /* comenzile plătite pe site intră prin funcția comanda-site, cu plata deja capturată: aici pornesc sarcinile */
  L('comenzi', o => o.din_site && o.plata_la && o.stare === 'neconfirmata').forEach(activate);
  L('taskuri', t => t.stare === 'terminat' && !t.postDone).forEach(t => onDone(t));
  /* bursă: după ce un specialist a luat pasul de pe telefonul lui, ofertele celorlalți se închid aici */
  L('oferte', x => x.raspuns === 'deschisa' && (D('taskuri')[x.task] || {}).stare !== 'oferit').forEach(x => (x.raspuns = 'retrasa'));
  /* pași rămași fără ofertă deschisă (refuzați / returnați pe un dispozitiv limitat) → se oferă mai departe */
  L('taskuri', t => t.spec !== 'motor' && ['oferit', 'disponibil'].includes(t.stare) && !L('oferte', x => x.task === t.id && x.raspuns === 'deschisa').length).forEach(t => dispatch(t));
  L('comenzi', o => !o.in_lucru_notificat && L('taskuri', t => t.comanda === o.id && t.specialist && t.specialist !== 'motor').length).forEach(o => { o.in_lucru_notificat = true; notify(o, 'in_lucru', {}); });
  advance();
}

function acceptTask(tid, sid, auto) {
  const t = D('taskuri')[tid]; const of = L('oferte', x => x.task === tid && x.spec === sid && x.raspuns === 'deschisa')[0];
  if (!of || t.stare !== 'oferit') return false;
  of.raspuns = 'acceptata'; t.stare = 'atribuit'; t.specialist = sid; t.acceptat_la = now();
  L('oferte', x => x.task === tid && x.raspuns === 'deschisa').forEach(x => (x.raspuns = 'retrasa'));
  ev('task.acceptat', sid, { k: 'task', id: tid }, { spec: sid, auto: !!auto });
  const o = D('comenzi')[t.comanda]; if (o && !o.in_lucru_notificat && !limited()) { o.in_lucru_notificat = true; notify(o, 'in_lucru', {}); }
  return true;
}
function refuseTask(tid, sid, motiv) {
  const of = L('oferte', x => x.task === tid && x.spec === sid && x.raspuns === 'deschisa')[0]; if (!of) return;
  of.raspuns = 'refuzata'; of.motiv = motiv || ''; const t = D('taskuri')[tid];
  ev('oferta.refuzata', sid, { k: 'task', id: tid }, { spec: sid, motiv }); if (t.stare === 'oferit' && !limited() && !L('oferte', x => x.task === tid && x.raspuns === 'deschisa').length) dispatch(t);
}
function returnTask(tid, sid, motiv) {
  const t = D('taskuri')[tid]; if (t.specialist !== sid || t.stare !== 'atribuit') return;
  t.retur++; t.excluse.push(sid); t.specialist = null; t.acceptat_la = null; t.stare = 'disponibil';
  ev('task.returnat', sid, { k: 'task', id: tid }, { spec: sid, motiv, penalizare: t.retur > 1 });
  if (!limited()) dispatch(t);
}
function forceAssign(tid, sid) {
  const t = D('taskuri')[tid]; L('oferte', x => x.task === tid && x.raspuns === 'deschisa').forEach(x => (x.raspuns = 'retrasa'));
  t.specialist = sid; t.stare = 'atribuit'; t.acceptat_la = now(); if (!t.ofertate.includes(sid)) t.ofertate.push(sid);
  ev('task.atribuit_fortat', 'admin', { k: 'task', id: tid }, { spec: sid });
}
function withdrawTask(tid) {
  const t = D('taskuri')[tid]; L('oferte', x => x.task === tid && x.raspuns === 'deschisa').forEach(x => (x.raspuns = 'retrasa'));
  if (t.specialist) t.excluse.push(t.specialist); t.specialist = null; t.acceptat_la = null; t.stare = 'disponibil'; t.ofertate = []; ev('task.retras', 'admin', { k: 'task', id: tid }); dispatch(t);
}
function requeue(tid) { const t = D('taskuri')[tid]; t.ofertate = []; t.excluse = t.excluse.filter(() => false); ev('task.reincadrat', 'admin', { k: 'task', id: tid }); dispatch(t); }

/* ---------- lucru pe task ---------- */
function validateFinish(t) {
  const err = [];
  t.check.forEach(c => { if (!c.ok) err.push('Bifă lipsă: ' + c.t); });
  t.fields.forEach(f => { if (f.val === '' || f.val == null) err.push('Câmp gol: ' + f.label); });
  t.reqFiles.filter(f => f.req).forEach(f => { if (!t.fisiere.some(x => x.tip === f.tip)) err.push('Fișier lipsă: ' + f.label); });
  if (t.juridic && !t.fisiere.some(x => /opinie|diagnostic_semnat/.test(x.tip))) err.push('Documentul semnat de avocat lipsește');
  return err;
}
function addFile(tid, tip, nume, mb, actor, mime) {
  const t = D('taskuri')[tid]; const f = { id: uid('f'), tip, nume, mb: mb || 0.2, hash: hashStr(nume + tid + now()), la: now(), mime: mime || (/\.pdf$/i.test(nume) ? 'application/pdf' : 'image/jpeg') };
  t.fisiere.push(f);
  const d = { id: uid('dc'), comanda: t.comanda, linie: t.linie, task: tid, tip, nume, mime: f.mime, hash: f.hash, incarcat_de: actor || t.specialist, la: now(), vizibil: false, trimis: [] }; D('documente')[d.id] = d; f.doc = d.id;
  ev('document.incarcat', actor || t.specialist, { k: 'task', id: tid }, { tip, nume, spec: actor || t.specialist }); return f;
}
function demoFill(tid) {
  const t = D('taskuri')[tid]; const imo = D('imobile')[t.imobil];
  t.check.forEach(c => (c.ok = true));
  t.fields.forEach(f => {
    if (f.val !== '' && f.val != null) return;
    if (f.k === 'cf_nr') f.val = imo.cf || '999001'; else if (f.k === 'uat') f.val = imo.uat; else if (f.k === 'gasit') f.val = 'da';
    else if (f.k === 'sarcini') f.val = 'nu'; else if (f.k === 'proprietari') f.val = 'M.P. (1/1)'; else if (f.k === 'cote') f.val = '1/1';
    else if (f.type === 'sel') f.val = f.opt[0]; else if (f.type === 'number') f.val = 100 + (hashStr(t.id).charCodeAt(0) % 400); else if (f.type === 'date') f.val = new Date(now() + 3 * ZI).toISOString().slice(0, 10);
    else if (f.type === 'textarea') f.val = 'Concluzii: demo (text complet în documentul semnat).'; else f.val = 'demo';
  });
  t.reqFiles.forEach(rf => { if (!t.fisiere.some(x => x.tip === rf.tip)) addFile(tid, rf.tip, rf.tip + '_' + D('comenzi')[t.comanda].nr + '.pdf', 0.3, t.specialist); });
}
function finishTask(tid, sid) {
  const t = D('taskuri')[tid]; if (t.stare !== 'atribuit' || t.specialist !== sid) return ['Taskul nu e al tău sau nu e în lucru'];
  const err = validateFinish(t); if (err.length) return err;
  t.stare = 'terminat'; t.terminat_la = now();
  const durMin = t.terta ? null : (t.terminat_la - t.acceptat_la) / MIN;
  ev('task.terminat', sid, { k: 'task', id: tid }, { spec: sid, durMin, tarif: t.tarif, cod: t.cod, n: t.n, sla: t.sla, tardiv: t.sla && durMin > t.sla });
  onDone(t); advance(); return [];
}
function runMotor(t) {
  if (t.stare !== 'disponibil' || t.spec !== 'motor') return false;
  /* pasul OCR așteaptă textul extrasului real, dar nu ține comanda pe loc: după 10 minute trece, iar verificarea îl poate porni din buton */
  if (t.k === 'cf2') { const d = L('documente', (x) => x.linie === t.linie && x.tip === 'extras_cf' && (x.path || (typeof FILEBLOBS !== 'undefined' && FILEBLOBS[x.id])))[0]; const r = d && (R.db.ocr || {})[d.id]; if (d && !(r && r.stare === 'gata') && now() - (t.disponibil_la || now()) < 10 * MIN) return false; }
  if (t.failOnce) { t.failOnce = false; t.stare = 'esuat'; ev('task.esuat', 'motor', { k: 'task', id: t.id }, { motiv: 'sursă indisponibilă' }); openProblem(t.id, 'motor', 'altul', 'Sursa de date nu răspunde (harticiclul2.inundatii.ro). Reia după revenire.', true); return false; }
  t.stare = 'terminat'; t.terminat_la = now(); t.specialist = 'motor'; t.acceptat_la = t.acceptat_la || now();
  ev('task.terminat', 'motor', { k: 'task', id: t.id }, { spec: 'motor', durMin: 0.1, tarif: 0, cod: t.cod, n: t.n });
  onDone(t); return true;
}
function runMotors() { let n = 0, g = 0; while (g++ < 60) { const m = L('taskuri', t => t.spec === 'motor' && t.stare === 'disponibil'); if (!m.length) break; let pas = 0; m.forEach(t => { if (runMotor(t)) { n++; pas++; } }); if (!pas) break; advance(); } return n; }
function retryMotor(tid) { const t = D('taskuri')[tid]; if (t.stare !== 'esuat') return; L('probleme', p => p.task === tid && p.stare !== 'rezolvata').forEach(p => resolveProblem(p.id, 'reluat', 'tehnic', true)); t.stare = 'disponibil'; ev('task.reluat', 'tehnic', { k: 'task', id: tid }); runMotor(t); advance(); }

function onDone(t) {
  if (limited()) return;
  t.postDone = true;
  const l = D('linii')[t.linie]; const o = D('comenzi')[t.comanda]; const imo = D('imobile')[t.imobil]; if (!l || !o) return;
  const f = (k) => (t.fields.find(x => x.k === k) || {}).val;
  if (t.k === 'id1') {
    if (f('gasit') === 'nu') {
      l.stare = 'problema';
      L('taskuri', x => x.linie === l.id && x.stare === 'asteptare').forEach(x => { x.stare = 'blocat'; x.prev = 'asteptare'; });
      openProblem(t.id, t.specialist, 'altul', 'Imobil neidentificabil după adresă și pin. Conform promisiunii de pe site: rambursare.', true);
      return;
    }
    imo.cf = f('cf_nr') || imo.cf;
  }
  if (t.k === 'cf1') { imo.cf = f('cf_nr') || imo.cf; imo.nr_cad = f('nr_cad') || imo.nr_cad; }
  maybeDeliver(l);
}
function maybeDeliver(l) {
  if (l.stare === 'livrat' || l.stare === 'problema') return;
  const ts = L('taskuri', x => x.linie === l.id);
  if (!ts.length || !ts.every(x => ['terminat', 'anulat'].includes(x.stare))) return;
  l.stare = 'livrat'; l.livrat_la = now();
  const outs = ts.filter(x => x.out).map(x => x.out);
  const docs = L('documente', d => d.linie === l.id && (outs.includes(d.tip) || ts.some(x => x.out && x.fisiere.some(ff => ff.hash === d.hash))));
  const o = D('comenzi')[l.comanda];
  /* cu trimitere manuală, documentele rămân la administrator până apasă „Trimite clientului” (settings.trimitereManuala; implicit da) */
  const manual = D('settings').trimitereManuala !== false;
  if (manual) l.de_trimis = docs.map(d => d.id); else docs.forEach(d => (d.vizibil = true));
  ev('linie.livrata', 'sistem', { k: 'linie', id: l.id }, { svc: l.svc });
  if (!l.incl && !manual) notify(o, 'document', { doc: SV[l.svc][0] });
  const open = L('linii', x => x.comanda === o.id && !['livrat', 'anulat'].includes(x.stare));
  if (!open.length && !o.livrata_la) {
    if (manual) { if (!o.gata_la) { o.gata_la = now(); ev('comanda.gata', 'sistem', { k: 'comanda', id: o.id }); notifyIn('admin', 'Comanda ' + o.nr + ' e completă: de verificat și trimis', o.id); } }
    else { o.livrata_la = now(); o.stare = 'livrata'; ev('comanda.livrata', 'sistem', { k: 'comanda', id: o.id }); notify(o, 'livrata', {}); }
  }
  advance();
}
/* administratorul a verificat plata și comanda: clientul află că e în ordine, iar pașii pornesc */
function preiaComanda(oid, actor) {
  const o = D('comenzi')[oid]; if (!o || o.preluata_la) return false;
  o.preluata_la = now(); o.preluata_de = actor || 'administrator'; o.in_lucru_notificat = true;
  if (o.completare && !o.completare.rezolvat_la) o.completare.rezolvat_la = now();
  ev('comanda.preluata', o.preluata_de, { k: 'comanda', id: o.id }, { verificat: ['plata', 'acord', 'imobil', 'servicii', 'client'], suma: o.total, acord: o.acord === true });
  notify(o, 'in_ordine', {}); advance(); return true;
}
/* lipsește ceva din comandă: clientul primește mesajul cu linkul de completare, iar comanda așteaptă */
function cereCompletare(oid, text, actor) {
  const o = D('comenzi')[oid]; text = String(text || '').trim(); if (!o || !text) return false;
  o.completare = { la: now(), text, de: actor || 'administrator', rezolvat_la: null };
  ev('comanda.completare', o.completare.de, { k: 'comanda', id: o.id }, { text });
  notify(o, 'completare', { descriere: text }); R.db.mesaje.push({ comanda: oid, de: 'echipă', text: 'Lipsește: ' + text, la: now() });
  return true;
}
/* administratorul a verificat documentele și le trimite clientului */
function trimiteClient(oid, actor) {
  const o = D('comenzi')[oid]; if (!o || o.livrata_la || !o.gata_la) return false;
  L('linii', l => l.comanda === oid && l.stare === 'livrat').forEach(l => { (l.de_trimis || []).forEach(id => { const d = D('documente')[id]; if (d) d.vizibil = true; }); if (!l.incl) notify(o, 'document', { doc: SV[l.svc][0] }); });
  L('documente', d => d.comanda === oid && d.atasat).forEach(d => (d.vizibil = true));
  o.livrata_la = now(); o.stare = 'livrata'; ev('comanda.livrata', actor || 'admin', { k: 'comanda', id: o.id }, { manual: true }); notify(o, 'livrata', {});
  return true;
}
/* document pus direct pe comandă de administrator (raportul final), fără pas */
function ataseaza(oid, nume, mb, actor, mime) {
  const o = D('comenzi')[oid]; if (!o) return null;
  const d = { id: uid('dc'), comanda: oid, linie: null, task: null, tip: 'raport', nume, mime: mime || 'application/pdf', hash: hashStr(nume + oid + now()), incarcat_de: actor || 'admin', la: now(), vizibil: false, trimis: [], atasat: true };
  D('documente')[d.id] = d; ev('document.incarcat', actor || 'admin', { k: 'comanda', id: oid }, { tip: 'raport', nume }); return d;
}
function closeOrder(oid) { const o = D('comenzi')[oid]; o.stare = 'inchisa'; o.inchisa_la = now(); ev('comanda.inchisa', 'admin', { k: 'comanda', id: oid }); }

/* ---------- probleme, sugestii ---------- */
const PROBLEME_TIP = ['CF inexistent', 'Număr greșit', 'Imobil neintabulat', 'Sursă oficială indisponibilă', 'Primăria nu răspunde', 'Clientul nu răspunde', 'Date lipsă', 'Document ilizibil', 'altul'];
function openProblem(tid, actor, tip, descr, auto) {
  const t = D('taskuri')[tid]; const p = { id: uid('pb'), task: tid, comanda: t.comanda, tip, descr, de: actor, la: now(), stare: 'deschisa', escaladata: false, rezolvata_la: null, rezolutie: '', auto: !!auto };
  D('probleme')[p.id] = p;
  if (t.stare === 'atribuit') { t.prev = 'atribuit'; t.stare = 'blocat'; }
  ev('problema.deschisa', actor, { k: 'task', id: tid }, { spec: actor, tip });
  notifyIn('admin', 'Problemă: ' + t.n + ' — ' + tip, tid); notifyIn('tehnic', 'Problemă: ' + t.n + ' — ' + tip, tid);
  if (/Clientul|Date lipsă|Număr greșit|CF inexistent/.test(tip)) notify(D('comenzi')[t.comanda], 'problema', { serviciu: SV[D('linii')[t.linie].svc][0], descriere: descr });
  return p;
}
function resolveProblem(pid, rezolutie, actor, silent) {
  const p = D('probleme')[pid]; if (p.stare === 'rezolvata') return; p.stare = 'rezolvata'; p.rezolvata_la = now(); p.rezolutie = rezolutie;
  ev('problema.rezolvata', actor || 'admin', { k: 'task', id: p.task }, { spec: p.de, rezolutie });
  const t = D('taskuri')[p.task];
  if (t && t.stare === 'blocat') { t.stare = t.prev || 'atribuit'; }
  const l = t && D('linii')[t.linie];
  if (l && l.stare === 'problema') {
    l.stare = 'in_lucru';
    L('taskuri', x => x.linie === l.id && x.stare === 'blocat').forEach(x => (x.stare = x.prev || 'asteptare'));
  }
  if (!silent) advance();
}
function cancelLine(lid, motiv) {
  const l = D('linii')[lid]; l.stare = 'anulat'; L('taskuri', t => t.linie === lid && !['terminat'].includes(t.stare)).forEach(t => { t.stare = 'anulat'; L('oferte', x => x.task === t.id && x.raspuns === 'deschisa').forEach(x => (x.raspuns = 'retrasa')); });
  L('probleme', p => D('taskuri')[p.task] && D('taskuri')[p.task].linie === lid && p.stare !== 'rezolvata').forEach(p => resolveProblem(p.id, motiv, 'admin', true));
  ev('linie.anulata', 'admin', { k: 'linie', id: lid }, { motiv });
  const o = D('comenzi')[l.comanda]; recalcTotal(o);
  if (!L('linii', x => x.comanda === o.id && !['livrat', 'anulat'].includes(x.stare)).length && !o.livrata_la) {
    if (L('linii', x => x.comanda === o.id && x.stare === 'livrat').length) { o.livrata_la = now(); o.stare = 'livrata'; notify(o, 'livrata', {}); }
    else { o.stare = 'anulata'; ev('comanda.anulata', 'admin', { k: 'comanda', id: o.id }); }
  }
  advance();
}
function addSuggestion(sid, tid, text, cat) { const s = { id: uid('sg'), spec: sid, task: tid || null, text, cat: cat || 'produs', stare: 'noua', raspuns: '', la: now() }; D('sugestii')[s.id] = s; ev('sugestie.creata', sid, tid ? { k: 'task', id: tid } : null, { cat }); return s; }

/* ---------- oferte de preț (servicii la ofertă) ---------- */
function quote(lid, pret, specId) {
  const l = D('linii')[lid]; const sp = specId ? D('specialisti')[specId] : null;
  const q = { id: uid('qt'), linie: lid, comanda: l.comanda, spec: specId || null, pret: pret, cost: CH[l.svc]().reduce((a, t) => a + (t.tarif || 0), 0), trimis_la: null, acceptat_la: null, refuzat_la: null };
  D('oferte_pret')[q.id] = q; l.stare = 'cotata'; l.pret = pret; ev('oferta_pret.cotata', 'sales', { k: 'linie', id: lid }, { pret }); return q;
}
function sendQuote(qid) { const q = D('oferte_pret')[qid]; q.trimis_la = now(); const l = D('linii')[q.linie]; notify(D('comenzi')[q.comanda], 'oferta', { serviciu: SV[l.svc][0], pret: q.pret }); ev('oferta_pret.trimisa', 'sales', { k: 'linie', id: l.id }); }
function acceptQuote(qid) {
  const q = D('oferte_pret')[qid]; const l = D('linii')[q.linie]; const o = D('comenzi')[q.comanda];
  q.acceptat_la = now(); l.stare = 'acceptata'; l.acord = { la: now(), versiune: 'v1' };
  const p = newPay(o, q.pret, [l.id], {}); ev('oferta_pret.acceptata', 'client', { k: 'linie', id: l.id }, { pret: q.pret });
  if (o.acord !== true) { o.acord = true; o.acord_la = now(); }
  return p;
}
function declineQuote(qid) { const q = D('oferte_pret')[qid]; q.refuzat_la = now(); const l = D('linii')[q.linie]; l.stare = 'anulat'; ev('oferta_pret.refuzata', 'client', { k: 'linie', id: l.id }); cancelLine(l.id, 'ofertă refuzată'); }

/* ---------- notificări ---------- */
function render(tpl, vars) { return tpl.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m)); }
function imoLabel(o) { const im = D('imobile')[o.imobile[0]]; return im.cf ? 'CF ' + im.cf + ', ' + im.uat : im.adresa + ', ' + im.uat; }
/* linkul din mesajele către client: la comenzile de pe site, pagina de urmărire a site-ului (settings.linkUrmarire, cu {nr}) */
function linkClient(o) { const b = D('settings').linkUrmarire; return o.din_site && b ? b.replace('{nr}', encodeURIComponent(o.nr)) : 'platforma/#/client/' + o.nr; }
function notify(o, tplKey, extra) {
  const tp = TEMPLATES[tplKey]; if (!tp) return; const cl = D('clienti')[o.client];
  const vars = Object.assign({ nr: o.nr, imobil: imoLabel(o), link: linkClient(o) }, extra || {});
  const mk = (canal, subj, body, stare, eroare) => { const n = { id: uid('nt'), dest: 'client', comanda: o.id, canal, sablon: tplKey, subj, body, la: now(), stare, eroare: eroare || '' }; D('notificari')[n.id] = n; return n; };
  mk('email', render(tp.subj, vars), render(tp.body, vars), cl.email && cl.email.includes('@') ? (o.din_site ? 'de trimis' : 'trimis (simulat)') : 'eroare', cl.email && cl.email.includes('@') ? '' : 'adresă invalidă');
  if (tp.wa && cl.wa_optin && cl.wa) mk('whatsapp', '[șablon ' + tp.wa + ']', render(tp.body, vars), 'trimis (simulat)');
  ev('notificare.trimisa', 'sistem', { k: 'comanda', id: o.id }, { sablon: tplKey });
}
function notifyIn(dest, text, ref) { const n = { id: uid('nt'), dest, comanda: null, canal: 'in-app', sablon: 'alerta', subj: text, body: text, la: now(), stare: 'nou', eroare: '', ref: ref || null }; D('notificari')[n.id] = n; }

/* ---------- interogări ---------- */
const lineOf = (id) => D('linii')[id];
const etapa = (o) => {
  if (['neconfirmata', 'in_asteptare_acord'].includes(o.stare)) return 'neplatita';
  if (o.stare === 'anulata') return 'anulata'; if (o.stare === 'inchisa') return 'inchisa'; if (o.stare === 'livrata') return 'livrata';
  const ts = L('taskuri', t => t.comanda === o.id);
  return ts.some(t => ['atribuit', 'terminat', 'blocat'].includes(t.stare)) ? 'in_lucru' : 'primita';
};
const ETAPA_TXT = { neplatita: 'Neplătită / fără acord', primita: 'Primită', in_lucru: 'În lucru', livrata: 'Livrată', inchisa: 'Închisă', anulata: 'Anulată' };
function slaInfo(t) {
  if (t.stare !== 'atribuit' || !t.sla || t.terta) return { stare: 'na', pct: 0 };
  const el = (now() - t.acceptat_la) / MIN; const pct = el / t.sla * 100;
  return { stare: pct >= 100 ? 'late' : pct >= 75 ? 'warn' : 'ok', pct, rest: t.sla - el };
}
function orderIncomplete(o) {
  const cl = D('clienti')[o.client]; const im = D('imobile')[o.imobile[0]]; const pays = L('plati', p => p.comanda === o.id);
  const m = []; if (!o.nr) m.push('nr'); if (!o.creata_la) m.push('oră'); if (!im.cf && !im.adresa) m.push('CF/adresă'); if (!cl.email) m.push('email'); if (!pays.length) m.push('date plată');
  return m;
}
function criticalPathMin(oid) {
  const ts = L('taskuri', t => t.comanda === oid && !['terminat', 'anulat'].includes(t.stare)); const memo = {};
  const f = (t) => { if (memo[t.id] != null) return memo[t.id]; const own = t.terta ? t.termenMin : (t.sla || (t.spec === 'motor' ? 5 : 60)); const deps = t.dep.map(id => D('taskuri')[id]).filter(x => x && !['terminat', 'anulat'].includes(x.stare)); return (memo[t.id] = own + Math.max(0, ...deps.map(f))); };
  return ts.length ? Math.max(...ts.map(f)) : 0;
}

/* ---------- contoare din evenimente ---------- */
function statsOf(sid) {
  const E = R.db.evenimente; const tm = now(); const d0 = new Date(tm); d0.setHours(0, 0, 0, 0);
  const day0 = d0.getTime(), wk = tm - 7 * ZI, mo = tm - 30 * ZI;
  const done = E.filter(e => e.tip === 'task.terminat' && e.data.spec === sid);
  const durs = done.filter(e => e.data.durMin != null);
  const byType = {}; durs.forEach(e => { const k = e.data.n.replace(/\(.*\)/, '').trim(); (byType[k] = byType[k] || []).push(e.data.durMin); });
  const offers = E.filter(e => e.tip === 'oferta.creata' && e.data.spec === sid && !e.data.auto).length;
  const acc = E.filter(e => e.tip === 'task.acceptat' && e.data.spec === sid && !e.data.auto).length;
  const ref = E.filter(e => e.tip === 'oferta.refuzata' && e.data.spec === sid).length, exp = E.filter(e => e.tip === 'oferta.expirata' && e.data.spec === sid).length;
  const pbs = E.filter(e => e.tip === 'problema.deschisa' && e.data.spec === sid).length, pbr = E.filter(e => e.tip === 'problema.rezolvata' && e.data.spec === sid).length;
  const pierdute = E.filter(e => e.tip === 'task.timeout' && e.data.spec === sid).length, retur = E.filter(e => e.tip === 'task.returnat' && e.data.spec === sid).length;
  return {
    azi: done.filter(e => e.t >= day0).length, saptamana: done.filter(e => e.t >= wk).length, luna: done.filter(e => e.t >= mo).length, total: done.length,
    medie: durs.length ? durs.reduce((a, e) => a + e.data.durMin, 0) / durs.length : null, maxim: durs.length ? Math.max(...durs.map(e => e.data.durMin)) : null,
    perTip: Object.keys(byType).map(k => ({ n: k, nr: byType[k].length, medie: byType[k].reduce((a, b) => a + b, 0) / byType[k].length })),
    inLucru: L('taskuri', t => t.specialist === sid && t.stare === 'atribuit').length, probleme: pbs, problemeRez: pbr, deschise: L('probleme', p => p.de === sid && p.stare !== 'rezolvata').length,
    acceptare: offers ? Math.round(acc / Math.max(1, acc + ref + exp) * 100) : null, oferte: offers, castig: done.reduce((a, e) => a + (e.data.tarif || 0), 0), tardive: done.filter(e => e.data.tardiv).length,
    sugestii: L('sugestii', s => s.spec === sid), pierdute, retur
  };
}

/* ---------- seed ---------- */
function seedAll() {
  R.db = emptyDb();
  /* demo-ul se construiește cu porțile deschise; la final comenzile nepornite se întorc la „de verificat” */
  R.db.settings.okAdmin = false; R.db.settings.trimitereManuala = false;
  SPECIALISTI_SEED.forEach(s => {
    const sp = Object.assign({}, s); D('specialisti')[sp.id] = sp;
    const t0 = Date.now(); const full = sp.status === 'activ';
    ['neconcurenta', 'prestari', 'atestat', 'facturare'].forEach(tip => {
      if (!full && (tip === 'neconcurenta' || tip === 'atestat')) return;
      const c = { id: uid('ct'), spec: sp.id, nume: sp.nume, calitate: 'colaborator', tip, semnat_la: t0 - 60 * ZI, verificat_de: 'Manu', expira_la: t0 + (tip === 'atestat' ? (sp.id === 'sp_mihai' ? 20 : 300) : 700) * ZI, fisier: tip + '_' + sp.id + '.pdf' };
      D('contracte')[c.id] = c;
    });
  });
  SERVICII_STARE_SEED.forEach((x) => (D('servicii')[x[0]] = { id: x[0], stare: x[1], motiv: x[2], criteriu: x[3], reverificare: x[4], schimbat_la: Date.now(), de: 'Manu', istoric: [] }));
  /* colaborator tehnic: acord semnat, contractul de dezvoltare lipsește (se vede în situația Juridic) */
  [['neconcurenta', -15], ['facturare', -15]].forEach(([tip, z]) => { const c = { id: uid('ct'), spec: null, nume: 'Bogdan Iancu', calitate: 'tehnic', tip, semnat_la: Date.now() + z * ZI, verificat_de: 'Manu', expira_la: Date.now() + 700 * ZI, fisier: tip + '_bogdan_iancu.pdf' }; D('contracte')[c.id] = c; });
  JURIDIC_SEED.forEach((x) => { const j = { id: uid('ju'), cat: x[0], text: x[1], prio: x[2], stare: 'deschis', resp: x[0].startsWith('Întrebare') ? 'avocat' : 'Manu', nota: '', la: Date.now() }; D('juridic')[j.id] = j; });
  /* asociații: semnează doar acordul de neconcurență (anexa B) */
  [['Manuel Lupu', 'asociat', -120], ['Andrei Vâlcu', 'asociat', -120], ['Ioana Petrea', 'salariat', -30]].forEach(([n, cal, z]) => { const c = { id: uid('ct'), spec: null, nume: n, calitate: cal, tip: 'neconcurenta', semnat_la: Date.now() + z * ZI, verificat_de: 'Manu', expira_la: Date.now() + (700 + z) * ZI, fisier: 'neconcurenta_' + n.split(' ')[0].toLowerCase() + '.pdf' }; D('contracte')[c.id] = c; });
  D('specialisti')['motor'] = { id: 'motor', nume: 'Motor automat', spec: ['motor'], judete: ['*'], uat: '', cap: 999, rating: 5, tura: true, tel: '', email: '', status: 'activ', atestat: '—', sistem: true };
  TINTE_SEED.forEach(x => (D('tinte')[x[0]] = { id: x[0], titlu: x[1], comp: x[2], rezolvat: x[3], prio: x[4], stare: 'deschis', resp: '', termen: '', seed: x[5] }));
  D('surse').push(...SURSE_SEED.map(s => ({ nume: s[0], stare: s[1], ce: s[2], ultim_ok: Date.now() - (s[1] === 'ok' ? 20 : s[1] === 'degradat' ? 300 : 2900) * MIN })));
  COSURI_SEED.forEach(c => D('cosuri').push(Object.assign({ id: uid('cs'), reminder: false }, c, { la: Date.now() - c.ago * MIN })));
  const byNr = {};
  SEED_ORDERS.forEach(row => {
    R.db.offsetMs = -row.ago * MIN;
    const o = createOrder(Object.assign({}, row, { acord: row.nr === 'EP-10019' ? false : true }));
    if (row.nr === 'EP-10008') o.note = (o.note || '') + ' demo-esec';
    byNr[o.nr] = o;
    if (row.wa) findClient(row.email, row.cl, { wa: row.wa });
    /* linii la ofertă: cotate + acceptate (seed) sau în cerere */
    const priced = L('linii', l => l.comanda === o.id && l.tip === 'plata');
    const quotes = L('linii', l => l.comanda === o.id && l.tip === 'oferta');
    const qacc = quotes.filter(l => row.quotes && row.quotes[l.svc]);
    const payLines = priced.concat(qacc.map(l => { const q = quote(l.id, row.quotes[l.svc], null); sendQuote(q.id); q.acceptat_la = now(); l.stare = 'acceptata'; return l; }));
    if (row.pay === 'neplatita') { newPay(o, o.total, payLines.map(l => l.id)); }
    else if (row.pay === 'esuata') { const p = newPay(o, o.total, payLines.map(l => l.id)); payFail(p.id, 'card refuzat (fonduri insuficiente)'); o.stare = 'neconfirmata'; }
    else {
      const sum = payLines.reduce((a, l) => a + (l.pret || 0), 0) + (o.urgent ? URGENT_PRICE : 0) - (o.credit ? 79 : 0);
      o.total = Math.max(0, sum); const p = newPay(o, o.total, payLines.map(l => l.id)); payCapture(p.id);
      if (row.nr !== 'EP-10016') { invoice(p.id); if (Math.random() > 0.4) spvSet(p.id, 'acceptata'); }
    }
    if (row.done === 'full') autoRun(o, row.ago);
    if (row.wait) { D('asteptare').push({ id: uid('wt'), email: row.email, cf: row.cf, ce: 'Alertă CF', la: now() }); closeOrder(o.id); }
  });
  R.db.offsetMs = 0;
  /* două taskuri preluate mai demult, ca să se vadă etichetele de termen: unul depășit, unul aproape */
  const late = L('taskuri', t => t.k === 'cf1' && D('comenzi')[t.comanda].nr === 'EP-10006')[0];
  const near = L('taskuri', t => t.k === 'cf1' && D('comenzi')[t.comanda].nr === 'EP-10007')[0];
  [[late, 130, 'sp_ion'], [near, 70, 'sp_dana']].forEach(([t, min, sid]) => { if (!t) return; const of = L('oferte', x => x.task === t.id && x.raspuns === 'deschisa')[0]; if (of) of.raspuns = 'retrasa'; t.ofertate = [sid]; t.stare = 'atribuit'; t.specialist = sid; t.acceptat_la = Date.now() - min * MIN; R.db.evenimente.push({ id: R.db.evenimente.length + 1, t: t.acceptat_la, tip: 'task.acceptat', actor: sid, obj: { k: 'task', id: t.id }, data: { spec: sid } }); });
  /* sugestii și o problemă tehnică demonstrative */
  addSuggestion('sp_ion', null, 'La extrasele pentru Giroc și Dumbrăvița, cererea ar trebui să includă din start și planul: 80% dintre clienți îl cer după.', 'produs');
  addSuggestion('sp_dana', null, 'Când sistemul de cadastru e picat, să pot marca „reiau în 2 ore” fără să deschid o problemă.', 'flux');
  addSuggestion('sp_elena', null, 'Pentru opinie am nevoie și de actul de dobândire; cereți-l clientului la comandă.', 'flux');
  /* oferte deschise: reprogramate de la „acum” */
  L('oferte', of => of.raspuns === 'deschisa').forEach(of => { const t = D('taskuri')[of.task]; of.oferit_la = Date.now(); of.expira_la = Date.now() + ofertaMin(t) * MIN; t.oferit_la = Date.now(); });
  R.db.settings.okAdmin = true; R.db.settings.trimitereManuala = true;
  L('comenzi', o => o.plata_la).forEach(o => {
    const om = L('taskuri', t => t.comanda === o.id && t.spec !== 'motor');
    if (o.livrata_la || om.some(t => (t.specialist && t.spec !== 'analist') || t.stare === 'terminat')) { o.preluata_la = o.plata_la; o.preluata_de = 'Manu'; return; }
    om.filter(t => t.stare !== 'terminat' && t.stare !== 'anulat').forEach(t => { t.stare = 'asteptare'; t.ofertate = []; t.specialist = null; t.acceptat_la = null; });
    L('oferte', x => x.raspuns === 'deschisa' && om.some(t => t.id === x.task)).forEach(x => (x.raspuns = 'retrasa'));
  });
  R.db.evenimente.push({ id: R.db.evenimente.length + 1, t: Date.now(), tip: 'seed', actor: 'sistem', obj: null, data: { comenzi: Object.keys(D('comenzi')).length } });
  R.save();
}
/* procesează complet o comandă cu specialiști demo (pentru comenzile seed „livrate”) */
function autoRun(o, agoMin) {
  let g = 0;
  while (g++ < 400) {
    R.db.offsetMs += 7 * MIN;
    runMotors();
    const open = L('taskuri', t => t.comanda === o.id && t.stare === 'oferit');
    if (!open.length) { advance(); if (!L('taskuri', t => t.comanda === o.id && !['terminat', 'anulat'].includes(t.stare)).length) break; if (!L('taskuri', t => t.comanda === o.id && ['oferit', 'disponibil', 'atribuit'].includes(t.stare)).length) break; continue; }
    open.forEach(t => { const of = L('oferte', x => x.task === t.id && x.raspuns === 'deschisa')[0]; if (!of) return; acceptTask(t.id, of.spec); demoFill(t.id); R.db.offsetMs += 11 * MIN; const e = finishTask(t.id, of.spec); if (e.length) console.warn('autoRun', e); });
  }
}
function resetSeed() { seedAll(); }
function boot() {
  if (typeof SYNC !== 'undefined' && SYNC.on) { tick(); return; }
  if (!R.load() || !R.db.v) seedAll();
  tick();
}

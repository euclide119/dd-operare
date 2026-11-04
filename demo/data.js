/* Platforma de operare · faza 1 — catalog, lanțuri de taskuri, setări implicite, seed.
   ID-urile serviciilor = cele din site/versiuni/v39-epay-cf-online.html (S și V). Valorile marcate [E] sunt estimări de validat. */
'use strict';

const SPEC = {
  ancpi: 'Operator ANCPI', topo: 'Topograf', avocat: 'Avocat', energetic: 'Auditor energetic',
  inginer: 'Inginer', evaluator: 'Evaluator', geo: 'Geolog',
  analist: 'Echipa internă', motor: 'Automat'
};
/* colaboratori externi (cu contract) vs echipa internă (analist: verificări, QA, dosare la primărie) */
const SPEC_EXTERN = ['ancpi', 'topo', 'avocat', 'energetic', 'inginer', 'evaluator', 'geo'];
const SPEC_HUMAN = SPEC_EXTERN.concat(['analist']);
const JUDETE = ['Timiș', 'Arad', 'Cluj', 'București', 'Caraș-Severin', 'Hunedoara'];

/* Catalogul: [nume, preț fix | null (la ofertă), grup] — prețurile sunt cele din v39 (decodate din S) */
const SV = {
  cf: ['Extras CF imobil', 79, 'cf'], ident: ['Identifică imobilul + extras CF', 119, 'cf'], expl: ['Explicație date din CF', 25, 'cf'],
  cf360: ['CF drum (acces la drumul public)', 79, 'cf'], cfc: ['Vecinii', 149, 'cf'], plan: ['Extras plan cadastral', 79, 'cf'],
  orto: ['Extras pe ortofotoplan', 100, 'zona'], indic: ['Indicatori urbanistici', 149, 'zona'], zona: ['Ce se construiește în zonă', 199, 'zona'],
  util: ['Utilități în zonă', 149, 'zona'], est: ['Graficul prețului în timp', 45, 'zona'], regul: ['Regulament urbanistic', 149, 'zona'],
  cu: ['Pregătire acte CU de informare', 250, 'cu'], depcu: ['Certificat de urbanism de informare (depunere)', 800, 'cu'],
  rAp: ['Raport de proprietate · apartament', 299, 'raport'], rInt: ['Raport de proprietate · casă sau teren', 419, 'raport'],
  opj: ['Opinie juridică de la avocat', null, 'oferta'], vocpi: ['Verificare situație la OCPI', null, 'oferta'],
  soc: ['Verificare societate proprietară', null, 'oferta'], arh: ['Istoric acte din arhivă', null, 'oferta'],
  topo: ['Ridicare topografică', null, 'oferta'], rlv: ['Releveu (RLV)', null, 'oferta'], leg: ['Diagnostic de legalitate', null, 'oferta'],
  insp: ['Inspecție tehnică', null, 'oferta'], termo: ['Termoviziune', null, 'oferta'], struct: ['Expertiză structurală', null, 'oferta'],
  evalu: ['Raport de evaluare ANEVAR', null, 'oferta'], cpe: ['Certificat energetic', null, 'oferta'], geo: ['Studiu geotehnic', null, 'oferta']
};
const URGENT_PRICE = 19;
/* preț de pornire propus la cotare [E] */
const QUOTE_DEFAULT = { opj: 350, vocpi: 99, soc: 150, arh: 180, topo: 790, rlv: 790, leg: 199, insp: 800, termo: 600, struct: 1500, evalu: 1200, cpe: 350, geo: 1200 };

/* Capitolele raportului (CAP din v39): [cod, nume, A|S] — A = automat, S = semi-automat (om) */
const RAPORT = [
  ['Carte funciară și proprietari', [['R12', 'Proprietari, cote, uzufruct', 'S'], ['R13', 'Fișa imobilului din CF', 'A'], ['R38', 'Istoricul înscrierilor din CF', 'A'], ['R30', 'Firma vânzătoare și beneficiarii reali', 'S']]],
  ['Litigii și executări', [['R25A', 'Dosare în instanță (proprietar)', 'S'], ['R25B', 'Insolvență (BPI)', 'S'], ['R25C', 'Executări silite și licitații pe imobil', 'A']]],
  ['Urbanism și autorizații', [['R18', 'Regulamentul zonei (PUG/PUZ)', 'S'], ['R34', 'Autorizații de construire pe parcelă și în jur', 'S'], ['R36', 'PUZ-uri în curs în vecinătate', 'S'], ['R37', 'Investiții publice în zonă', 'A']]],
  ['Riscuri naturale și mediu', [['R03', 'Risc de inundații', 'A'], ['R05', 'Sol, tasare, radon', 'A'], ['R06', 'Hazarduri cumulate și seismicitate', 'A'], ['R07', 'Contaminare și depozite de deșeuri', 'S'], ['R39', 'Utilități la punct', 'S']]],
  ['Preț și costuri', [['R09B', 'Comparabile active în zonă', 'A'], ['R09C', 'Evoluția prețului în zonă', 'A'], ['R10', 'Chirie estimată și randament brut', 'A'], ['R11', 'Impozitul local anual', 'A'], ['R14', 'Clasa energetică', 'S']]],
  ['Cartier și viață de zi cu zi', [['R16', 'Internet și semnal mobil', 'A'], ['R17', 'Monumente și situri arheologice', 'A'], ['R19', 'Portretul zonei', 'A'], ['R20', 'Facilități la pas', 'A'], ['R22', 'Școli și rezultate', 'A'], ['R23', 'Transport public', 'A'], ['R24', 'Zgomot din trafic', 'A'], ['R27', 'Cine locuiește aici', 'A'], ['R43', 'Timpi până la centru, aeroport, spital', 'A']]],
  ['Evoluția zonei', [['R40', 'Istoric fotografic al parcelei 2003–2026', 'S'], ['R41', 'Evoluția populației', 'A']]]
];

/* ---- lanțuri: serviciu -> taskuri. dep: chei locale | '@CF' (extrasul CF al imobilului) | '@line:xxx' (linia xxx din același imobil, dacă există) ---- */
const F = (k, label, type = 'text', opt = null) => ({ k, label, type, opt });
const T = (k, n, spec, tip, dep, sla, tarif, o = {}) => Object.assign({ k, n, spec, tip, dep, sla, tarif, check: [], fields: [], files: [] }, o);

const cfTasks = (dep) => [
  T('cf1', 'Scoate extrasul CF', 'ancpi', 'M', dep, 90, 25, {
    check: ['Nr. CF și UAT confirmate în sistemul de cadastru', 'Extras de informare descărcat (PDF)', 'Banda „nu se folosește în circuitul civil” prezentă'],
    fields: [F('cf_nr', 'Nr. CF confirmat'), F('uat', 'UAT'), F('proprietari', 'Proprietari (inițiale)'), F('cote', 'Cote'), F('sarcini', 'Sarcini înscrise', 'sel', ['nu', 'da']), F('nr_cad', 'Nr. cadastral'), F('suprafata', 'Suprafață (mp)', 'number')],
    files: [['extras_cf', 'Extras CF (PDF)', 1]]
  }),
  T('cf2', 'OCR + extracție structurată', 'motor', 'A', ['cf1'], 5, 0, { check: [] }),
  T('cf3', 'QA extras (2 min)', 'analist', 'S', ['cf2'], 60, 8, { cfFinal: true, check: ['Datele extrase corespund PDF-ului', 'Semafoarele de bază setate'], out: 'extras_cf' })
];

const CH = {
  cf: () => cfTasks([]),
  ident: () => [
    T('id1', 'Identifică imobilul (adresă + pin)', 'ancpi', 'M', [], 90, 35, {
      check: ['Imobilul căutat după adresă / pin pe hartă', 'Nr. CF găsit și verificat cu clientul (dacă e cazul)'],
      fields: [F('gasit', 'Imobil găsit?', 'sel', ['da', 'nu']), F('cf_nr', 'Nr. CF găsit'), F('uat', 'UAT')]
    }),
    ...cfTasks(['id1'])
  ],
  expl: () => [
    T('ex1', 'Draft explicație pe rânduri', 'motor', 'A', ['@CF'], 10, 0),
    T('ex2', 'Verifică și semnează intern explicația', 'analist', 'S', ['ex1'], 180, 12, { check: ['Fiecare rând din extras are explicație', 'Semafoare roșu/portocaliu/verde verificate', 'Fără concluzii juridice'], out: 'explicatie' })
  ],
  cf360: () => [
    T('c31', 'Extras CF al parcelei de acces', 'ancpi', 'M', ['@CF'], 90, 25, {
      check: ['Parcela de acces identificată din plan', 'Extras descărcat'], fields: [F('parcela', 'Nr. cadastral parcelă acces'), F('statut', 'Statut drum', 'sel', ['public', 'privat', 'servitute', 'incert'])],
      files: [['extras_cf_drum', 'Extras CF drum (PDF)', 1]]
    }),
    T('c32', 'Concluzie acces (da/nu)', 'analist', 'S', ['c31'], 180, 10, { check: ['Concluzie formulată ca fapt, nu ca opinie juridică'], fields: [F('acces', 'Acces la drum public?', 'sel', ['da', 'nu', 'incert'])], out: 'acces_drum' })
  ],
  cfc: () => [
    T('cc1', 'Extrase parcele vecine', 'ancpi', 'M', ['@CF'], 90, 40, {
      check: ['Vecinii identificați pe plan', 'Extrasele vecinilor descărcate'], fields: [F('nr_vecini', 'Nr. vecini', 'number')],
      files: [['extrase_vecini', 'Extrase vecini (PDF-uri)', 1]]
    }),
    T('cc2', 'Sinteză sarcini la limită', 'analist', 'S', ['cc1'], 180, 15, { check: ['Sarcini, servituți, litigii la limită trecute în sinteză'], out: 'vecini' })
  ],
  plan: () => [
    T('pl1', 'Extras plan cadastral', 'ancpi', 'M', [], 90, 25, { check: ['Plan descărcat', 'Nr. cadastral vizibil'], fields: [F('nr_cad', 'Nr. cadastral')], files: [['plan', 'Plan cadastral (PDF)', 1]], out: 'plan' })
  ],
  cu: () => [
    T('cu1', 'Pregătește dosarul CU de informare', 'analist', 'M', [], 180, 60, { check: ['Cerere completată', 'Plan de situație atașat', 'Taxa calculată'], files: [['dosar_cu', 'Dosar CU (PDF)', 1]], out: 'dosar_cu' })
  ],
  depcu: () => [
    T('dc1', 'Depune cererea la primărie', 'analist', 'M', ['@line:cu'], 180, 80, { check: ['Cerere depusă (online / registratură)', 'Număr de înregistrare notat'], fields: [F('nr_inreg', 'Nr. înregistrare'), F('data_dep', 'Data depunerii', 'date')], files: [['dovada_depunere', 'Dovada depunerii', 1]] }),
    T('dc2', 'Așteaptă răspunsul primăriei (termen legal)', 'analist', 'M', ['dc1'], 0, 40, { terta: true, termenMin: 21 * 24 * 60, check: ['Certificatul primit și încărcat'], files: [['certificat_urbanism', 'Certificat de urbanism (PDF)', 1]], out: 'certificat_urbanism' })
  ],
  soc: () => [T('so1', 'Verifică societatea proprietară', 'analist', 'M', ['@CF'], 180, 40, { check: ['Administratori și asociați', 'Insolvență (BPI)', 'Dosare în instanță'], fields: [F('cui', 'CUI'), F('insolventa', 'Insolvență', 'sel', ['nu', 'da'])], files: [['nota_societate', 'Notă societate (PDF)', 1]], out: 'nota_societate' })],
  vocpi: () => [T('vo1', 'Verifică dosarele în curs la OCPI', 'ancpi', 'M', ['@CF'], 90, 30, { check: ['Dosare și înscrieri în curs verificate'], fields: [F('dosare', 'Dosare în curs', 'sel', ['nu', 'da'])], files: [['nota_ocpi', 'Notă OCPI (PDF)', 1]], out: 'nota_ocpi' })],
  arh: () => [T('ar1', 'Obține copii acte din arhivă', 'ancpi', 'M', ['@CF'], 180, 80, { check: ['Cerere depusă', 'Copii primite'], files: [['acte_arhiva', 'Copii acte (PDF)', 1]], out: 'acte_arhiva' })],
  opj: () => [
    T('op1', 'Opinie juridică semnată', 'avocat', 'M', ['@CF', '@line:arh'], 180, 200, {
      check: ['Actele imobilului analizate', 'Opinie scrisă semnată electronic'], fields: [F('concluzie', 'Concluzii (text)', 'textarea')],
      files: [['opinie_juridica', 'Opinie juridică semnată (PDF)', 1]], out: 'opinie_juridica', juridic: true
    })
  ],
  leg: () => [
    T('lg1', 'Analiză legalitate (construcții / acte)', 'analist', 'M', ['@CF'], 180, 60, { check: ['Autorizații / recepție / intabulare verificate'], fields: [F('situatie', 'Situație', 'sel', ['în regulă', 'neintabulat', 'fără autorizație', 'incert'])], files: [['diagnostic_legalitate', 'Diagnostic (PDF)', 1]] }),
    T('lg2', 'Verificare avocat', 'avocat', 'M', ['lg1'], 180, 150, { check: ['Concluzia juridică semnată'], files: [['diagnostic_semnat', 'Diagnostic semnat (PDF)', 1]], out: 'diagnostic_semnat', juridic: true })
  ],
  topo: () => [
    T('tp1', 'Programează vizita pe teren', 'topo', 'M', [], 24 * 60, 0, { teren: true, check: ['Dată și oră agreate cu clientul'], fields: [F('data_vizita', 'Data vizitei', 'date'), F('contact', 'Contact la fața locului')] }),
    T('tp2', 'Măsurare + plan topografic', 'topo', 'M', ['tp1'], 48 * 60, 450, {
      teren: true, check: ['Măsurătoare efectuată', 'Plan întocmit', 'Proces-verbal semnat'], fields: [F('suprafata_masurata', 'Suprafață măsurată (mp)', 'number'), F('diferenta', 'Diferență față de acte (mp)', 'number')],
      files: [['plan_topo', 'Plan topografic (PDF/DWG)', 1], ['pv_topo', 'Proces-verbal', 1]], out: 'plan_topo'
    })
  ],
  rlv: () => [
    T('rl1', 'Programează vizita pentru releveu', 'topo', 'M', [], 24 * 60, 0, { teren: true, check: ['Dată și oră agreate cu clientul'], fields: [F('data_vizita', 'Data vizitei', 'date'), F('contact', 'Contact la fața locului')] }),
    T('rl2', 'Măsurare + planuri releveu', 'topo', 'M', ['rl1'], 48 * 60, 450, {
      teren: true, check: ['Măsurătoare efectuată', 'Planuri întocmite'], fields: [F('suprafata_masurata', 'Suprafață măsurată (mp)', 'number')],
      files: [['plan_rlv', 'Planuri releveu (PDF/DWG)', 1]], out: 'plan_rlv'
    })
  ],
  insp: () => [
    T('in1', 'Programează inspecția', 'inginer', 'M', [], 24 * 60, 0, { teren: true, check: ['Dată agreată'], fields: [F('data_vizita', 'Data vizitei', 'date')] }),
    T('in2', 'Inspecție + raport tehnic', 'inginer', 'M', ['in1'], 48 * 60, 350, { teren: true, check: ['Structură, acoperiș, instalații, umiditate'], files: [['raport_inspectie', 'Raport inspecție (PDF)', 1]], out: 'raport_inspectie' })
  ],
  termo: () => [
    T('tm1', 'Programează termoviziunea', 'inginer', 'M', [], 24 * 60, 0, { teren: true, fields: [F('data_vizita', 'Data vizitei', 'date')] }),
    T('tm2', 'Termoviziune + raport', 'inginer', 'M', ['tm1'], 48 * 60, 250, { teren: true, files: [['raport_termo', 'Raport termoviziune (PDF)', 1]], out: 'raport_termo' })
  ],
  struct: () => [
    T('st1', 'Programează expertiza', 'inginer', 'M', [], 24 * 60, 0, { teren: true, fields: [F('data_vizita', 'Data vizitei', 'date')] }),
    T('st2', 'Expertiză structurală', 'inginer', 'M', ['st1'], 72 * 60, 900, { teren: true, files: [['expertiza_structurala', 'Expertiză (PDF)', 1]], out: 'expertiza_structurala' })
  ],
  evalu: () => [
    T('ev1', 'Vizită + raport de evaluare ANEVAR', 'evaluator', 'M', ['@CF'], 72 * 60, 700, { teren: true, fields: [F('data_vizita', 'Data vizitei', 'date')], files: [['raport_evaluare', 'Raport de evaluare (PDF)', 1]], out: 'raport_evaluare' })
  ],
  cpe: () => [
    T('cp1', 'Programează auditul energetic', 'energetic', 'M', [], 24 * 60, 0, { teren: true, fields: [F('data_vizita', 'Data vizitei', 'date')] }),
    T('cp2', 'Certificat de performanță energetică', 'energetic', 'M', ['cp1'], 48 * 60, 200, { teren: true, files: [['cpe', 'Certificat energetic (PDF)', 1]], out: 'cpe' })
  ],
  geo: () => [
    T('ge1', 'Programează forajul / vizita', 'geo', 'M', [], 24 * 60, 0, { teren: true, fields: [F('data_vizita', 'Data vizitei', 'date')] }),
    T('ge2', 'Studiu geotehnic', 'geo', 'M', ['ge1'], 120 * 60, 700, { teren: true, files: [['studiu_geo', 'Studiu geotehnic (PDF)', 1]], out: 'studiu_geo' })
  ]
};
/* serviciile de zonă: motor (draft) + analist (verificare) */
const ZONE_SRC = { orto: 'ortofotoplan', indic: 'indicatori urbanistici (POT, CUT, H)', zona: 'autorizații și proiecte din vecinătate', util: 'rețele de utilități', est: 'comparabile și serie de preț', regul: 'regulament urbanistic PUG/PUZ' };
Object.keys(ZONE_SRC).forEach(id => {
  CH[id] = () => [
    T('z1', 'Colectare automată: ' + ZONE_SRC[id], 'motor', 'A', id === 'orto' ? [] : ['@CF'], 10, 0),
    T('z2', 'Verificare analist: ' + SV[id][0], 'analist', 'S', ['z1'], 180, id === 'est' ? 6 : 12, { check: ['Surse și date verificate', 'Limitele datelor notate'], out: 'zona_' + id })
  ];
});
/* raportul: CF + plan + expl + secțiuni R (A -> motor, S -> analist pe capitol) + asamblare + QA */
function raportChain(inc) {
  const t = [...cfTasks([]).map(x => Object.assign({}, x))];
  t.push(T('rp_plan', 'Extras plan cadastral', 'ancpi', 'M', [], 90, 25, { check: ['Plan descărcat'], fields: [F('nr_cad', 'Nr. cadastral')], files: [['plan', 'Plan cadastral (PDF)', 1]], out: 'plan' }));
  t.push(T('rp_ex1', 'Draft explicație pe rânduri', 'motor', 'A', ['cf3'], 10, 0));
  t.push(T('rp_ex2', 'Verifică explicația CF', 'analist', 'S', ['rp_ex1'], 180, 12, { check: ['Explicație verificată'], out: 'explicatie' }));
  const secDeps = [];
  RAPORT.forEach(([cap, secs], ci) => {
    secs.filter(s => s[2] === 'A').forEach(s => { const k = 'rA_' + s[0]; secDeps.push(k); t.push(T(k, s[0] + ' · ' + s[1], 'motor', 'A', ['cf3'], 10, 0, { cod: s[0] })); });
    const hum = secs.filter(s => s[2] === 'S');
    if (hum.length) { const k = 'rS_' + ci; secDeps.push(k); t.push(T(k, 'Capitol ' + (ci + 1) + ' · ' + cap + ' (' + hum.map(s => s[0]).join(', ') + ')', 'analist', 'S', ['cf3'], 180, 10 * hum.length, { check: hum.map(s => s[0] + ' ' + s[1] + ' verificat'), cod: hum.map(s => s[0]).join('+') })); }
  });
  t.push(T('rp_as', 'Asamblare raport', 'analist', 'S', [...secDeps, 'rp_plan', 'rp_ex2', '@line:opj'], 180, 25, { check: ['Toate capitolele incluse', 'Scor și semafoare calculate', 'Fără concluzii juridice (doar fapte)'], files: [['raport_draft', 'Raport draft (PDF)', 1]] }));
  t.push(T('rp_qa', 'QA raport', 'analist', 'S', ['rp_as'], 120, 20, { check: ['Cifrele verificate', 'Disclaimer „serviciu privat de analiză” prezent', 'Cuvântul „evaluare” doar acolo unde e ANEVAR'], files: [['raport_final', 'Raport final (PDF)', 1]], out: 'raport_final' }));
  return t;
}
CH.rAp = () => raportChain();
CH.rInt = () => raportChain();
const MULTI_LINE_INCLUDES_CF = ['rAp', 'rInt'];

/* ---- setări implicite [E] ---- */
const DEFAULT_SETTINGS = {
  ofertaMin: { ancpi: 30, topo: 240, avocat: 240, energetic: 240, geo: 240, inginer: 240, evaluator: 240, analist: 120 }, /* [E] minute cât stă oferta la un specialist înainte să treacă la următorul */
  urgentFactor: 0.5,
  autoAtribuire: { ancpi: false }, /* round-robin în loc de ofertă, per specialitate */
  slaFactor: 1, problemaMaxOre: 4,
  judeteActive: ['Timiș', 'Arad', 'Cluj', 'București'],
  taxaAncpiMedie: 20, /* lei, pentru marja pe comandă [E] */
  retragereZile: 14
};

/* ---- șabloane notificări (email + WhatsApp) ---- */
const TEMPLATES = {
  primita: { subj: 'Comanda {nr} a fost primită', body: 'Am primit comanda {nr} pentru {imobil}. Începem lucrul. Urmărești starea aici: {link}', wa: 'comanda_primita' },
  in_lucru: { subj: 'Comanda {nr} e în lucru', body: 'Specialistul a preluat primul pas din comanda {nr}. Starea la zi: {link}', wa: null },
  document: { subj: 'Document nou în comanda {nr}: {doc}', body: 'Ai un document nou: {doc}. Îl descarci din pagina comenzii: {link}', wa: 'document_livrat' },
  livrata: { subj: 'Comanda {nr} e livrată', body: 'Toate serviciile din comanda {nr} sunt livrate. Documentele sunt în pagina comenzii: {link}. Ai 30 de zile pentru întrebări.', wa: 'comanda_livrata' },
  programare: { subj: 'Programează vizita — comanda {nr}', body: 'Pentru {serviciu} avem nevoie de o dată și un contact. Răspunde aici: {link}', wa: 'programare_teren' },
  problema: { subj: 'Avem nevoie de o informație — comanda {nr}', body: 'La {serviciu} a apărut o problemă: {descriere}. Ce îți cerem: {link}', wa: 'problema_comanda' },
  oferta: { subj: 'Oferta ta pentru {serviciu}', body: 'Prețul pentru {serviciu} este {pret} lei. Poți accepta aici: {link}', wa: null },
  acord: { subj: 'Confirmă începerea imediată — comanda {nr}', body: 'Ca să începem lucrul, confirmă acordul de executare imediată: {link}', wa: null },
  rambursare: { subj: 'Rambursare pentru comanda {nr}', body: 'Am inițiat rambursarea de {suma} lei pentru comanda {nr}. Motiv: {motiv}.', wa: null }
};

/* ---- ținte de rezolvat (T1–T13) ---- */
const TINTE_SEED = [];

/* ---- surse (sănătatea sursei) ---- */
const SURSE_SEED = [];

/* ---- specialiști seed ---- */
const SPECIALISTI_SEED = [
  { id: 'sp_ion', nume: 'Ionuț Mărginean', spec: ['ancpi'], judete: ['Timiș'], uat: 'Timișoara', cap: 3, rating: 4.8, tura: true, tel: '0700 000 000', email: 'ionut.marginean@exemplu.ro', status: 'activ', atestat: 'Autorizație ANCPI cat. B nr. 1187/2023' },
  { id: 'sp_dana', nume: 'Daniela Pop', spec: ['ancpi'], judete: ['Timiș', 'Arad'], uat: 'Arad', cap: 3, rating: 4.6, tura: true, tel: '0700 000 000', email: 'daniela.pop@exemplu.ro', status: 'activ', atestat: 'Autorizație ANCPI cat. B nr. 0774/2022' },
  { id: 'sp_radu', nume: 'Radu Țăranu', spec: ['topo'], judete: ['Timiș'], uat: 'Timișoara', cap: 2, rating: 4.7, tura: true, tel: '0700 000 000', email: 'radu@exemplu.ro', status: 'activ', atestat: 'Autorizație ANCPI cat. D nr. 0412/2021' },
  { id: 'sp_elena', nume: 'av. Elena Sârbu', spec: ['avocat'], judete: ['Timiș', 'București'], uat: 'Timișoara', cap: 3, rating: 4.9, tura: true, tel: '0700 000 000', email: 'office@exemplu.ro', status: 'activ', atestat: 'Baroul Timiș, decizia 1234/2015' },
  { id: 'sp_mihai', nume: 'Mihai Crăciun', spec: ['energetic'], judete: ['Timiș'], uat: 'Timișoara', cap: 2, rating: 4.5, tura: true, tel: '0700 000 000', email: 'mihai.craciun@exemplu.ro', status: 'activ', atestat: 'Auditor energetic gr. I nr. AE-5521' },
  { id: 'sp_vlad', nume: 'ing. Vlad Bota', spec: ['inginer'], judete: ['Timiș'], uat: 'Timișoara', cap: 2, rating: 4.4, tura: true, tel: '0700 000 000', email: 'vlad.bota@exemplu.ro', status: 'activ', atestat: 'Expert tehnic MLPDA A1 nr. 0098' },
  { id: 'sp_ana', nume: 'Ana Rusu', spec: ['evaluator'], judete: ['Timiș'], uat: 'Timișoara', cap: 2, rating: 4.7, tura: true, tel: '0700 000 000', email: 'ana.rusu@exemplu.ro', status: 'activ', atestat: 'ANEVAR EPI nr. 18821' },
  { id: 'sp_geo', nume: 'Teodor Ghiman', spec: ['geo'], judete: ['Timiș'], uat: 'Timișoara', cap: 1, rating: 0, tura: false, tel: '0700 000 000', email: 'teodor.ghiman@exemplu.ro', status: 'documente_trimise', atestat: 'în curs' },
  { id: 'sp_sef', nume: 'Echipa internă (Manu)', spec: ['analist'], judete: ['*'], uat: '', cap: 8, rating: 4.6, tura: true, tel: '', email: 'echipa@exemplu.ro', status: 'activ', atestat: '—' }
];
const CONTRACTE_TIP = { gdpr: 'Acord privind prelucrarea datelor (GDPR)', cim: 'Contract individual de muncă', neconcurenta: 'Acord de neconcurență, neatragere și confidențialitate', prestari: 'Contract de colaborare (prestări servicii)', tehnic: 'Contract de dezvoltare software (cesiune drepturi)', atestat: 'Autorizație / atestat', facturare: 'Date de facturare', actconst: 'Clauză de neconcurență în actul constitutiv', cim: 'CIM cu clauză de neconcurență' };
const CALITATI = { colaborator: 'Colaborator independent (Anexa A)', tehnic: 'Colaborator tehnic / platformă (Anexa A)', asociat: 'Asociat / administrator (Anexa B)', salariat: 'Salariat (Anexa C)', altul: 'Altă calitate' };

/* ---- comenzi seed: 20 înregistrări pentru cele 19 scenarii (scenariul 15 = două comenzi legate) ---- */
/* ago = minute în urmă; pay: ok | esuata | neplatita | fara_acord; done: 'full' = procesată complet la seed */
const SEED_ORDERS = [
  { n: 1, nr: 'EP-10001', ago: 40, mode: 'cf', cf: '401122', judet: 'Timiș', uat: 'Timișoara', adresa: 'Str. Gheorghe Lazăr 24, ap. 7', tip: 'ap', sv: ['cf'], cl: 'Alina Petrescu', email: 'alina.petrescu@exemplu.ro', note: 'comanda minimă' },
  { n: 2, nr: 'EP-10002', ago: 55, mode: 'cf', cf: '412345', judet: 'Timiș', uat: 'Giroc', adresa: 'Str. Aviației 19', tip: 'casa', sv: ['cf', 'expl'], cl: 'Marius Dobre', email: 'marius.dobre@exemplu.ro' },
  { n: 3, nr: 'EP-10003', ago: 12, mode: 'cf', cf: '408764', judet: 'Timiș', uat: 'Dumbrăvița', adresa: 'Str. Castanilor 3', tip: 'casa', sv: ['cf'], urgent: true, cl: 'Cristina Ilie', email: 'cristina.ilie@exemplu.ro', wa: '0700 000 000' },
  { n: 4, nr: 'EP-10004', ago: 70, mode: 'addr', adresa: 'Str. Principală 14', pin: [45.7612, 21.1698], judet: 'Timiș', uat: 'Moșnița Nouă', tip: 'casa', sv: ['ident'], cl: 'Răzvan Toma', email: 'razvan.toma@exemplu.ro' },
  { n: 5, nr: 'EP-10005', ago: 80, mode: 'addr', adresa: 'Str. Ardealului f.n., lângă stația de gaz', pin: [45.70, 21.09], judet: 'Timiș', uat: 'Timișoara', tip: 'teren', sv: ['ident'], cl: 'Sorin Oprea', email: 'sorin.oprea@exemplu.ro', note: 'nu se găsește' },
  { n: 6, nr: 'EP-10006', ago: 95, mode: 'cf', cf: '406201', judet: 'Timiș', uat: 'Ghiroda', adresa: 'Zona Calea Lugojului, parcela A 213/4', tip: 'teren', sv: ['cf', 'cf360', 'cfc'], cl: 'Laura Vasiu', email: 'laura.vasiu@exemplu.ro' },
  { n: 7, nr: 'EP-10007', ago: 30, mode: 'cf', cf: '405120', judet: 'Timiș', uat: 'Săcălaz', adresa: 'Str. Mare 112', tip: 'casa', sv: ['cf', 'plan'], cl: 'George Nistor', email: 'george.nistor@exemplu.ro' },
  { n: 8, nr: 'EP-10008', ago: 120, mode: 'cf', cf: '410998', judet: 'Timiș', uat: 'Timișoara', adresa: 'Bd. Liviu Rebreanu 134, ap. 22', tip: 'ap', sv: ['rAp'], cl: 'Diana Moldovan', email: 'diana.moldovan@exemplu.ro', wa: '0700 000 000' },
  { n: 9, nr: 'EP-10009', ago: 200, mode: 'cf', cf: '412777', judet: 'Timiș', uat: 'Giroc', adresa: 'Str. Trandafirilor 41', tip: 'casa', sv: ['rInt', 'opj'], quotes: { opj: 350 }, cl: 'Florin Anghel', email: 'florin.anghel@exemplu.ro' },
  { n: 10, nr: 'EP-10010', ago: 150, mode: 'cf', cf: '403410', judet: 'Timiș', uat: 'Sânandrei', adresa: 'Parcela A 88/1, extravilan', tip: 'teren', sv: ['rInt', 'topo', 'regul', 'indic'], quotes: { topo: 790 }, cl: 'Bogdan Ciobanu', email: 'bogdan.ciobanu@exemplu.ro' },
  { n: 11, nr: 'EP-10011', ago: 60, mode: 'cf', cf: '415302', judet: 'Timiș', uat: 'Lugoj', adresa: 'Str. Timișorii 58', tip: 'casa', sv: ['cf', 'cpe', 'insp'], cl: 'Elena Zaharia', email: 'elena.zaharia@exemplu.ro', note: 'cerere de ofertă' },
  { n: 12, nr: 'EP-10012', ago: 90, mode: 'cf', cf: '408900', judet: 'Timiș', uat: 'Dumbrăvița', adresa: 'Str. Petofi Sandor 77', tip: 'teren', sv: ['cu', 'depcu'], cl: 'Paul Hodor', email: 'paul.hodor@exemplu.ro' },
  { n: 13, nr: 'EP-10013', ago: 45, mode: 'cf', cf: '402455', judet: 'Timiș', uat: 'Timișoara', adresa: 'Str. Paris 2A, ap. 5', tip: 'ap', sv: ['cf', 'soc'], cl: 'Westimo Development SRL', pj: true, email: 'office@exemplu.ro' },
  { n: 14, nr: 'EP-10014', ago: 130, mode: 'cf', cf: '401870', judet: 'Timiș', uat: 'Timișoara', adresa: 'Str. Mărășești 9', tip: 'casa', sv: ['cf', 'arh', 'opj'], quotes: { arh: 180, opj: 350 }, cl: 'Tiberiu Kovacs', email: 'tiberiu.kovacs@exemplu.ro' },
  { n: 15, nr: 'EP-10015', ago: 1500, mode: 'cf', cf: '410111', judet: 'Timiș', uat: 'Timișoara', adresa: 'Calea Aradului 18, ap. 31', tip: 'ap', sv: ['cf'], cl: 'Irina Lupu', email: 'irina.lupu@exemplu.ro', done: 'full', note: '15a — extras plătit' },
  { n: 15, nr: 'EP-10016', ago: 20, mode: 'cf', cf: '410111', judet: 'Timiș', uat: 'Timișoara', adresa: 'Calea Aradului 18, ap. 31', tip: 'ap', sv: ['rAp'], credit: 'EP-10015', cl: 'Irina Lupu', email: 'irina.lupu@exemplu.ro', note: '15b — upgrade cu CREDIT' },
  { n: 16, nr: 'EP-10017', ago: 75, mode: 'cf', cf: '412500', judet: 'Timiș', uat: 'Giroc', adresa: 'Str. Dunării 5 (3 parcele)', tip: 'casa', sv: ['cf'], extra: [{ cf: '412501', uat: 'Giroc', sv: ['cf'] }, { cf: '412502', uat: 'Giroc', sv: ['cf', 'plan'] }], cl: 'Ovidiu Jurca', email: 'ovidiu.jurca@exemplu.ro', note: '3 imobile' },
  { n: 17, nr: 'EP-10018', ago: 100, mode: 'cf', cf: '300123', judet: 'Cluj', uat: 'Cluj-Napoca', adresa: 'Str. Observatorului 12, ap. 3', tip: 'ap', sv: ['cf'], cl: 'Vlad Rotaru', email: 'vlad.rotaru@exemplu.ro', note: 'județ fără specialist' },
  { n: 18, nr: 'EP-10019', ago: 25, mode: 'cf', cf: '401333', judet: 'Timiș', uat: 'Timișoara', adresa: 'Str. Cluj 15, ap. 2', tip: 'ap', sv: ['cf', 'expl'], pay: 'esuata', cl: 'Nicoleta Mureșan', email: 'nicoleta.muresan@exemplu.ro', note: 'plată eșuată' },
  { n: 19, nr: 'EP-10020', ago: 4320, mode: 'cf', cf: '409555', judet: 'Timiș', uat: 'Timișoara', adresa: 'Str. Brâncoveanu 60, ap. 9', tip: 'ap', sv: ['cf', 'expl'], cl: 'Horia Stan', email: 'horia.stan@exemplu.ro', done: 'full', wait: true, note: 'livrată și închisă' }
];
const COSURI_SEED = [
  { email: 'andrei.p@exemplu.ro', cf: '410044', uat: 'Giroc', servicii: ['cf', 'expl'], total: 104, ago: 300 },
  { email: 'mihaela.toth@exemplu.ro', cf: '', adresa: 'Str. Zorilor 3', uat: 'Dumbrăvița', servicii: ['ident'], total: 119, ago: 1500 },
  { email: 'c.balan@exemplu.ro', cf: '400210', uat: 'Timișoara', servicii: ['rAp'], total: 349, ago: 2900 },
  { email: 'robert.farkas@exemplu.ro', cf: '412020', uat: 'Giroc', servicii: ['rInt', 'cf360'], total: 628, ago: 90 },
  { email: 'ioana.serban@exemplu.ro', cf: '415300', uat: 'Lugoj', servicii: ['cf'], total: 79, ago: 6000 }
];

/* ---- registrul de riscuri: ce poate pune platforma sau site-ul „în cap” ----
   [capitol, gravitate (critic|mare|mediu|mic), riscul, ce se întâmplă, ce facem, stare (rezolvat|partial|deschis)] */
const RISCURI = [];

/* ---- capitolul Juridic: tipurile de contracte ale proiectului ----
   [id, grup, nume, cine semnează, la ce folosește, draft: 'da' | 'partial' | 'nu', unde e draftul] */
const CONTRACTE_CATALOG = [
  ['acord', 'Toți cei care lucrează în proiect', 'Acord de confidențialitate, neconcurență și neatragere', 'colaboratori, asociați, salariați, colaboratori tehnici', 'protejează clienții, datele, baza de date și metodele; penalitate 100.000 lei', 'da', 'Șablon 1 (anexe A/B/C)'],
  ['colaborare', 'Specialiști (folosesc platforma, prestează servicii)', 'Contract de colaborare (prestări servicii)', 'operatori ANCPI, topografi, avocați, auditori, ingineri, evaluatori, geologi', 'servicii, termene, prețuri, realocare, răspundere, încetare', 'da', 'Șablon 2'],
  ['tehnic', 'Colaboratori tehnici (îmbunătățesc platforma)', 'Contract de dezvoltare software pe proiect, cu cesiunea drepturilor', 'programatori, designeri, integratori', 'livrabile pe proiect, predarea codului sursă, cesiunea drepturilor de autor, garanție, acces la date', 'da', 'Șablon 3'],
  ['cim', 'Echipa internă', 'Contract individual de muncă + clauză de neconcurență', 'salariați', 'Codul muncii art. 21–24, 26; indemnizație ≥ 50%', 'partial', 'Anexa C din Șablonul 1; CIM-ul tip îl face contabilul'],
  ['asociati', 'Asociați', 'Act constitutiv / acord între asociați', 'asociații SRL', 'neconcurență (L31/1990 art. 82, 197), cesiunea părților sociale, decizii, ieșire', 'partial', 'Anexa B din Șablonul 1; actul constitutiv — de făcut'],
  ['termeni', 'Clienți', 'Termeni și condiții + informare precontractuală + formular de retragere', 'clienții site-ului (la plată)', 'contract la distanță (OUG 34/2014): acord de executare imediată, retragere, preț, livrare', 'nu', '—'],
  ['gdpr', 'Clienți', 'Politica de confidențialitate și cookie', 'publicată pe site', 'ce date, de ce, cât timp, drepturi', 'nu', '—'],
  ['b2b', 'Clienți profesioniști', 'Contract cadru B2B (agenții, notari, abonament, white-label)', 'firme', 'volum, preț, termene, confidențialitate, facturare', 'nu', '—'],
  ['avocat', 'Parteneri', 'Contract cu cabinetul de avocatură partener', 'avocatul care semnează opiniile', 'opinii juridice semnate (L51/1995), onorariu, răspundere, validarea șabloanelor', 'nu', '—'],
  ['dpa', 'Furnizori', 'Acorduri de prelucrare date cu furnizorii (Supabase, email, WhatsApp, plăți, facturare)', 'acceptare online, condițiile lor standard', 'subîmputerniciți GDPR; lista lor intră în politica de confidențialitate', 'nu', 'se acceptă din conturile furnizorilor']
];
/* ce document trebuie semnat, pe calitatea semnatarului */
const DOC_NECESARE = { colaborator: ['neconcurenta', 'prestari', 'gdpr', 'atestat', 'facturare'], tehnic: ['neconcurenta', 'tehnic', 'gdpr', 'facturare'], asociat: ['neconcurenta', 'actconst'], salariat: ['cim', 'gdpr'] };
const DOC_NUME = { neconcurenta: 'Acord neconcurență', prestari: 'Contract colaborare', atestat: 'Atestat', facturare: 'Date facturare', tehnic: 'Contract dezvoltare', actconst: 'Clauză în actul constitutiv', cim: 'CIM', gdpr: 'Acord date (GDPR)' };
/* lista de rezolvat a capitolului Juridic: [categorie, text, prioritate] */
const JURIDIC_SEED = [];

/* ---- starea serviciilor: activ | in_test | pauza | invalidat, cu data de reverificare ----
   [id serviciu, stare, motiv (de ce e în starea asta), criteriul pentru pasul următor, reverificare (AAAA-LL-ZZ)] */
const STARI_SERVICIU = { activ: ['Activ', 'verde', 'se vinde și se livrează'], in_test: ['În test', 'galben', 'se vinde cu livrare verificată de echipă; se măsoară timp, cost, calitate'], pauza: ['Pe pauză', 'portocaliu', 'nu se mai acceptă comenzi noi până la reverificare'], invalidat: ['Invalidat', 'rosu', 'scos din ofertă; rămâne în istoric'] };
const SERVICII_STARE_SEED = [
  ['cf', 'activ', 'Fluxul complet funcționează (operator ANCPI → automat → QA).', 'Reverificare lunară: timp mediu ≤ 90 min, fără reclamații.', '2026-11-18'],
  ['ident', 'activ', 'Identificare după adresă + pin, cu rambursare dacă nu se găsește.', 'Rata de imobile negăsite sub 10%.', '2026-11-18'],
  ['expl', 'activ', 'Șabloane fără concluzii juridice; verificare internă.', 'Reverificare la 30 de comenzi.', '2026-11-18'],
  ['plan', 'activ', 'Extras de plan cadastral, același operator.', 'Reverificare lunară.', '2026-11-18'],
  ['cf360', 'activ', 'Extrasul parcelei de acces + concluzie de fapt (da / nu / incert).', 'Verificare pe primele 10 cazuri reale.', '2026-11-18'],
  ['cfc', 'in_test', 'Numărul de vecini variază; costul real e necunoscut.', '10 comenzi reale: cost și timp măsurat.', '2026-11-02'],
  ['rAp', 'in_test', 'Lipsesc pașii automați 4–7 (extracție, căutări, încrucișare, raport) — se asamblează manual.', 'Parserul CF + 5 conectori + generatorul de raport (B8–B11).', '2026-11-15'],
  ['rInt', 'in_test', 'Ca la apartament, plus teren/construcții; mai multe surse manuale.', 'Ca la rAp + 5 rapoarte livrate fără reclamații.', '2026-11-15'],
  ['est', 'in_test', 'Interval de preț din comparabile; termenul „evaluare” interzis.', 'Sursă de comparabile stabilă + 10 verificări.', '2026-11-02'],
  ['util', 'in_test', 'Răspunsurile furnizorilor de rețele sunt lente și inegale.', 'Timp de răspuns măsurat pe 3 UAT-uri.', '2026-11-02'],
  ['regul', 'in_test', 'PUG/PUZ online doar în unele UAT-uri.', 'Acoperire documentată pe UAT-urile din Timiș.', '2026-11-02'],
  ['indic', 'in_test', 'POT/CUT/H se găsesc doar unde regulamentul e public.', 'Ca la regulament.', '2026-11-02'],
  ['zona', 'in_test', 'Registrele de autorizații nu sunt publice peste tot.', 'Listă de UAT-uri cu date disponibile.', '2026-11-02'],
  ['orto', 'pauza', 'Drepturile asupra imaginilor din hărți terțe sunt neclarificate (STATE, 15.10).', 'Sursă de ortofoto cu licență clară.', '2026-11-01'],
  ['cu', 'in_test', 'Dosarul CU se pregătește intern; termenele primăriilor diferă.', '3 dosare depuse cu succes.', '2026-11-08'],
  ['depcu', 'in_test', 'Depunere la primărie; termen legal de confirmat pe L169/2026.', 'Termenul verificat pe text + 3 certificate primite.', '2026-11-08'],
  ['opj', 'pauza', 'Nu există încă un contract cu cabinetul de avocatură partener.', 'Contract semnat cu avocatul + șabloanele validate.', '2026-11-01'],
  ['vocpi', 'in_test', 'Verificarea dosarelor în curs depinde de accesul operatorului.', 'Confirmarea accesului (Ordinul 950/2023).', '2026-11-01'],
  ['soc', 'in_test', 'Surse: ONRC (fără extragere automată), BPI, portal.just.', 'Procedură manuală scrisă + 5 cazuri.', '2026-11-08'],
  ['arh', 'in_test', 'Arhiva OCPI: cost și termen variabile.', 'Cost și termen măsurate pe 5 cereri.', '2026-11-08'],
  ['topo', 'in_test', 'Un singur topograf validat (Timiș).', 'Al doilea topograf + 5 lucrări.', '2026-11-08'],
  ['leg', 'pauza', 'Are nevoie de avocat (verificare) — fără contract încă.', 'Contractul cu avocatul.', '2026-11-01'],
  ['insp', 'in_test', 'Un singur inginer validat.', '5 inspecții cu raport standard.', '2026-11-08'],
  ['termo', 'in_test', 'Echipament și preț de confirmat cu inginerul.', 'Preț confirmat + 3 lucrări.', '2026-11-08'],
  ['struct', 'pauza', 'Expert tehnic atestat de identificat; răspundere mare.', 'Expert atestat cu contract.', '2026-11-15'],
  ['evalu', 'in_test', 'Un singur evaluator ANEVAR validat.', '3 rapoarte livrate.', '2026-11-08'],
  ['cpe', 'in_test', 'Un singur auditor energetic validat.', '5 certificate livrate.', '2026-11-08'],
  ['geo', 'pauza', 'Geologul nu e validat (lipsesc acordul și atestatul).', 'Contracte semnate + validare.', '2026-11-01']
];

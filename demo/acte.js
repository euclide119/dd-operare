/* Actele de completat (capitolul Contracte → „Acte de completat”): șabloane cu câmpuri, previzualizare, print / PDF / Word / trimitere.
   Text de lucru redactat pe textele oficiale din legislatie/ (Cod civil, Codul muncii, Codul fiscal, L190/2018, O950/2023), verificate la 19.10.2026.
   Varianta finală o validează avocatul partener. Regulile verificate pe text sunt în documente/20_JURIDIC_CONTRACTE.md §10. */
'use strict';

const SAL_MIN = 4325;           /* lei brut, normă întreagă, de la 01.07.2026 (HG 146/2026, nota la Codul muncii art. 164) */
const PEN_DEF = '100.000';      /* lei, clauza penală pentru colaboratori și asociați — decizia lui Manu, 19.10.2026 (Cod civil art. 1.538–1.541); interzisă la salariați */

/* ---------- câmpuri comune ---------- */
const F_SOC = ['Societatea', [
  ['soc_den', 'Denumirea', 'text', '[DENUMIREA SOCIETĂȚII] S.R.L.'], ['soc_sediu', 'Sediul social', 'text'], ['soc_orc', 'Nr. Registrul Comerțului', 'text'],
  ['soc_cui', 'CUI', 'text'], ['soc_iban', 'IBAN', 'text'], ['soc_banca', 'Banca', 'text'], ['soc_rep', 'Reprezentant legal', 'text'], ['soc_calrep', 'Calitatea reprezentantului', 'text', 'administrator'], ['soc_email', 'Email pentru notificări', 'email']]];
const F_PREST = ['Prestatorul', [
  ['p_den', 'Nume / denumire', 'text'], ['p_forma', 'Forma de organizare', 'sel', 'PFA', ['PFA', 'întreprindere individuală', 'S.R.L.', 'cabinet individual', 'societate profesională']],
  ['p_sediu', 'Sediul / domiciliul profesional', 'text'], ['p_orc', 'Nr. Registrul Comerțului (dacă e cazul)', 'text'], ['p_cui', 'CUI / CIF', 'text'], ['p_rep', 'Reprezentant (pentru S.R.L.)', 'text'],
  ['p_atestat', 'Autorizație / atestat (nr., emitent)', 'text'], ['p_atestat_exp', 'Valabil până la', 'date'], ['p_iban', 'IBAN', 'text'], ['p_banca', 'Banca', 'text'], ['p_email', 'Email pentru notificări', 'email'], ['p_tel', 'Telefon', 'text']]];
const F_ACT = (extra) => ['Actul', [['nr', 'Numărul', 'text'], ['data', 'Data', 'date'], ['loc', 'Locul încheierii', 'text', 'Timișoara']].concat(extra || [])];

const firmaSalvata = () => ((R.db.settings || {}).firma || {});
const fmtData = (s) => { if (!s) return ''; const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? m[3] + '.' + m[2] + '.' + m[1] : s; };
const nr = (v) => parseFloat(String(v || '').replace(/\./g, '').replace(',', '.')) || 0;

/* ---------- 1. Contractul-cadru de prestări servicii ---------- */
function txtServicii(v) {
  const rows = (v.rows || []).filter((r) => r[0]);
  return `CONTRACT-CADRU DE PRESTĂRI SERVICII
nr. {{nr}} din {{data}}
@nota Contract-cadru în sensul art. 1.176 Cod civil; fiecare comandă acceptată în platformă este o convenție de executare (antrepriză de servicii, art. 1.851 Cod civil).

PĂRȚILE
1. {{soc_den}}, cu sediul în {{soc_sediu}}, înregistrată la Registrul Comerțului sub nr. {{soc_orc}}, CUI {{soc_cui}}, cont IBAN {{soc_iban}} deschis la {{soc_banca}}, reprezentată de {{soc_rep}}, în calitate de {{soc_calrep}} („Beneficiarul”), și
2. {{p_den}}, {{p_forma}}, cu sediul / domiciliul profesional în {{p_sediu}}, nr. Registrul Comerțului {{p_orc}}, CUI / CIF {{p_cui}}, cont IBAN {{p_iban}} deschis la {{p_banca}}, ${v.p_rep ? 'reprezentată de {{p_rep}}, ' : ''}autorizată / atestată prin {{p_atestat}}, valabil până la {{p_atestat_exp}} („Prestatorul”),
denumite împreună „Părțile”, au încheiat prezentul contract-cadru („Contractul”), cu bună-credință (art. 1.170 Cod civil).

ART. 1. DEFINIȚII
1.1. „Platforma” — aplicația de operare a Beneficiarului prin care se oferă, se acceptă, se execută și se livrează comenzile.
1.2. „Comanda” — cererea transmisă prin Platformă pentru un serviciu din Anexa 1, cu imobilul, termenul și prețul; devine fermă la acceptarea de către Prestator.
1.3. „Clientul” — persoana pentru care Beneficiarul execută serviciul și în interesul căreia se obțin documentele.
1.4. „Livrabilul” — documentele, datele, fotografiile și constatările încărcate de Prestator în Platformă pentru o Comandă.
1.5. „Decontul lunar” — situația generată de Platformă cu Comenzile livrate și acceptate în luna calendaristică precedentă.

ART. 2. OBIECTUL
2.1. Prestatorul execută, la cererea Beneficiarului, serviciile din Anexa 1, între care, după calificarea Prestatorului: (a) obținerea, prin canalele legale, a documentelor din evidențele de cadastru și carte funciară (extrase de carte funciară, planuri, copii de pe acte, informații din arhivă); (b) certificate de performanță energetică și audituri energetice; (c) măsurători, identificări de imobile și documentații topografice; (d) verificări la autoritățile publice locale; (e) alte servicii convenite prin act adițional.
2.2. Contractul nu creează exclusivitate în favoarea niciunei Părți și nu garantează un volum minim de Comenzi.

ART. 3. CARACTERUL INDEPENDENT AL ACTIVITĂȚII
3.1. Prestatorul desfășoară o activitate independentă în sensul art. 7 pct. 3 din Codul fiscal: își alege locul, modul și programul de lucru și poate refuza orice Comandă oferită (pct. 3.1); poate lucra pentru alți clienți (pct. 3.2); își asumă riscurile activității (pct. 3.3); folosește propriul patrimoniu — echipamente, programe, mijloace de deplasare (pct. 3.4); poate lucra prin personal propriu sau colaboratori, pentru care răspunde (pct. 3.7).
3.2. Între Părți nu există raport de muncă sau de subordonare. Prestatorul își declară și plătește singur impozitele și contribuțiile.

ART. 4. COMENZILE
4.1. Beneficiarul oferă Comanda prin Platformă; Prestatorul o acceptă sau o refuză în termenul afișat. După acceptare, Comanda este fermă.
4.2. Termenul de execuție curge de la acceptare și este cel din Anexa 1, dacă în Comandă nu se prevede altul.
4.3. Dacă termenul este depășit, Beneficiarul poate realoca Comanda altui prestator; partea neexecutată nu se plătește.

ART. 5. OBLIGAȚIILE PRESTATORULUI
5.1. Execută serviciile personal sau prin personalul său, cu diligența unui profesionist și conform legii profesiei, listei de verificare din Platformă și instrucțiunilor din Comandă.
5.2. Obține documentele numai prin canalele permise de lege, cu plata tarifelor legale, în numele sau în interesul Clientului indicat în Comandă, și folosește datele primite numai în forma în care sunt furnizate și numai în scopul declarat (Ordinul ANCPI nr. 950/2023, art. 9). Nu folosește accesul profesional gratuit la sistemele publice pentru Comenzile Beneficiarului.
5.3. Încarcă în Platformă Livrabilul complet și conform documentelor-sursă; nu introduce date pe care nu le-a verificat.
5.4. Anunță imediat în Platformă orice impediment (sistem indisponibil, date greșite, imobil neidentificabil).
5.5. Menține valabile autorizația sau atestatul cerut de lege pentru serviciu și, dacă legea profesiei o cere, asigurarea de răspundere profesională; anunță în 24 de ore orice suspendare, retragere sau expirare.
5.6. Nu formulează concluzii juridice (Legea nr. 51/1995) și nu folosește termenul „evaluare” (OG nr. 24/2011), decât dacă are calitatea cerută de lege și serviciul o prevede.
5.7. Nu contactează Clientul în afara Platformei și nu îi oferă servicii proprii pe baza datelor primite.

ART. 6. OBLIGAȚIILE BENEFICIARULUI
6.1. Pune la dispoziție, prin Platformă, datele necesare executării fiecărei Comenzi.
6.2. Restituie tarifele și taxele oficiale avansate de Prestator pentru o Comandă, pe baza documentului de plată încărcat în Platformă.
6.3. Plătește serviciile livrate și acceptate, conform art. 8.

ART. 7. RECEPȚIA LIVRABILULUI
7.1. Beneficiarul verifică Livrabilul în {{termen_verificare}} zile lucrătoare de la încărcare. Lipsa obiecțiilor în acest termen valorează acceptare.
7.2. Livrabilul incomplet sau neconform se corectează de Prestator, fără cost, în 2 zile lucrătoare de la semnalare. Taxele oficiale plătite din nou din vina Prestatorului rămân în sarcina lui.

ART. 8. PREȚUL, DECONTUL LUNAR ȘI PLATA
8.1. Prețul fiecărui serviciu este cel din Anexa 1 ${v.tva === 'da' ? 'plus TVA' : '(Prestatorul nu este înregistrat în scopuri de TVA)'}. Prețul acoperă toate costurile Prestatorului, cu excepția tarifelor și taxelor oficiale prevăzute la art. 6.2.
8.2. Până în ziua a 3-a lucrătoare a fiecărei luni, Platforma emite Decontul lunar pentru luna precedentă. Prestatorul îl poate contesta în 3 zile lucrătoare; în lipsa contestației, Decontul este acceptat.
8.3. Prestatorul emite factura pe baza Decontului acceptat, în 5 zile lucrătoare, cu transmiterea prin sistemul RO e-Factura atunci când legea o cere.
8.4. Beneficiarul plătește factura în {{termen_plata}} de zile de la primire, prin transfer bancar în contul de mai sus. Pentru întârziere, Beneficiarul datorează dobânda legală penalizatoare.
8.5. Prețurile din Anexa 1 se modifică numai prin act adițional și nu se aplică Comenzilor deja acceptate.

ART. 9. CONFIDENȚIALITATE, DATE PERSONALE, NECONCURENȚĂ
9.1. Acordul privind prelucrarea datelor cu caracter personal și Acordul de confidențialitate, neconcurență și neatragere, semnate odată cu Contractul, fac parte integrantă din acesta.
9.2. Livrabilele și datele introduse în Platformă aparțin Beneficiarului și, după caz, Clientului; Prestatorul cedează Beneficiarului drepturile patrimoniale asupra lor, prețul cesiunii fiind inclus în prețul serviciului.

ART. 10. RĂSPUNDEREA
10.1. Prestatorul răspunde pentru prejudiciile cauzate Beneficiarului sau Clientului prin neexecutarea, executarea necorespunzătoare sau cu întârziere a Comenzii, până la de {{raspundere_x}} ori prețul Comenzii respective; limita nu se aplică intenției, culpei grave, încălcării art. 5.2, 5.7 sau art. 9 (art. 1.355 Cod civil).
10.2. Pentru fiecare zi de întârziere a livrării peste termen, Prestatorul datorează o penalitate de {{pen_intarziere}}% din prețul Comenzii, cumulabilă cu executarea (art. 1.539 Cod civil), plafonată la prețul Comenzii. Penalitatea se poate compensa cu sumele datorate Prestatorului.
10.3. Niciuna dintre Părți nu răspunde pentru neexecutarea cauzată de forța majoră — eveniment extern, imprevizibil, absolut invincibil și inevitabil (art. 1.351 Cod civil) — notificată în 48 de ore de la apariție.

ART. 11. DURATA ȘI ÎNCETAREA
11.1. Contractul intră în vigoare la semnare și se încheie pe durată nedeterminată.
11.2. Oricare Parte îl poate denunța cu un preaviz scris de {{preaviz}} de zile (art. 1.277 Cod civil). Denunțarea nu afectează Comenzile acceptate și aflate în lucru.
11.3. Pact comisoriu (art. 1.553 Cod civil): Contractul se reziliază de drept, prin simpla notificare scrisă, fără punere în întârziere și fără intervenția instanței, dacă Prestatorul: (a) își pierde sau i se suspendă autorizația ori atestatul; (b) încalcă art. 5.2, 5.7 sau art. 9; (c) depășește termenul la 3 Comenzi în 30 de zile; (d) introduce în Platformă date false.
11.4. La încetare, Prestatorul finalizează sau predă Comenzile în lucru și returnează ori șterge datele, conform Acordului privind prelucrarea datelor.

ART. 12. COMUNICĂRI ȘI PROBE
12.1. Comunicările se fac în scris, la adresele de email {{soc_email}} și {{p_email}}, sau prin Platformă, și se consideră primite în ziua lucrătoare următoare trimiterii.
12.2. Înregistrările Platformei (oferte, acceptări, termene, încărcări, livrări, decontări) fac dovada între Părți, până la proba contrară.
12.3. Contractul și actele adiționale se pot semna și cu semnătură electronică.

ART. 13. DISPOZIȚII FINALE
13.1. Contractul se modifică numai prin act adițional scris. Prestatorul nu îl poate cesiona și nu poate subcontracta fără acordul scris al Beneficiarului.
13.2. Dacă o clauză este declarată nulă, celelalte rămân valabile, iar Părțile o înlocuiesc cu una valabilă, cât mai apropiată de scopul inițial.
13.3. Legea aplicabilă este legea română. Litigiile se soluționează pe cale amiabilă, iar în lipsa acordului, de instanțele competente de la sediul Beneficiarului.
13.4. Contractul cuprinde Anexa 1 (servicii, termene, prețuri) și Anexa 2 (lista de verificare din Platformă, la data semnării).

ART. 14. ACCEPTAREA EXPRESĂ A CLAUZELOR NEUZUALE (art. 1.203 Cod civil)
Prestatorul declară că a citit și acceptă în mod expres art. 4.3 (realocarea), art. 7.1 (acceptarea tacită), art. 10.1 (limitarea răspunderii), art. 10.2 (penalitatea), art. 11.2 (denunțarea), art. 11.3 (pactul comisoriu) și art. 13.3 (instanța competentă).
@semn1 Prestatorul, pentru art. 14

@semn2 Beneficiarul|Prestatorul

ANEXA 1 — SERVICII, TERMENE ȘI PREȚURI
@tabel Serviciu|Termen de execuție|Preț (lei)
${rows.length ? rows.map((r) => r[0] + '|' + (r[1] || '') + '|' + (r[2] || '')).join('\n') : '____________________|____________________|________'}
@endtabel
@nota Tarifele și taxele oficiale (ANCPI, taxe locale) nu sunt incluse; se restituie pe bază de document (art. 6.2).
`;
}

/* ---------- 2. Acordul privind prelucrarea datelor ---------- */
function txtGdpr(v) {
  const sal = v.calitate === 'salariat';
  const parte = sal ? 'Salariatul' : 'Împuternicitul';
  return `ACORD PRIVIND PRELUCRAREA DATELOR CU CARACTER PERSONAL
nr. {{nr}} din {{data}}
@nota ${sal ? 'Pentru salariați și persoanele care acționează sub autoritatea operatorului (Regulamentul (UE) 2016/679, art. 29 și art. 32 alin. 4).' : 'Contract între operator și persoana împuternicită (Regulamentul (UE) 2016/679, art. 28 alin. 3).'}

PĂRȚILE
1. {{soc_den}}, cu sediul în {{soc_sediu}}, CUI {{soc_cui}}, reprezentată de {{soc_rep}}, în calitate de operator („Operatorul”), și
2. {{p_den}}, ${sal ? 'salariat al Operatorului în funcția {{functia}}' : '{{p_forma}}, CUI / CIF {{p_cui}}, cu sediul în {{p_sediu}}'} („${parte}”),
în legătură cu ${sal ? 'contractul individual de muncă' : 'contractul-cadru de prestări servicii'} nr. {{contract_ref}} („Contractul principal”).

ART. 1. OBIECTUL ȘI DETALIILE PRELUCRĂRII
1.1. ${parte} prelucrează date cu caracter personal numai în numele Operatorului și numai pentru executarea Contractului principal.
1.2. Natura și scopul: verificarea imobilelor înainte de cumpărare sau vânzare, obținerea și prelucrarea documentelor cadastrale, de urbanism și energetice, comunicarea cu Clienții.
1.3. Persoanele vizate: Clienții Operatorului; proprietarii, titularii de drepturi și vecinii înscriși în documentele imobilului; reprezentanții lor.
1.4. Categoriile de date: nume și prenume, adresă, telefon, email, date din cartea funciară și din actele de proprietate (inclusiv codul numeric personal, atunci când apare în documente), date despre imobil, fotografii ale imobilului.
1.5. Durata: pe durata Contractului principal; datele fiecărei comenzi se păstrează de ${parte} cel mult {{zile_stergere}} de zile de la livrare.

ART. 2. OBLIGAȚIILE ${parte.toUpperCase()}
2.1. Prelucrează datele numai pe baza instrucțiunilor documentate ale Operatorului (Platforma și instrucțiunile scrise), inclusiv în privința transferurilor; dacă o instrucțiune încalcă legea, îl anunță imediat pe Operator.
2.2. Păstrează confidențialitatea datelor, pe durata Contractului principal și după încetarea lui${sal ? '' : ', și se asigură că persoanele autorizate de el s-au angajat în scris să respecte confidențialitatea'}.
2.3. Aplică măsuri tehnice și organizatorice adecvate: dispozitive cu parolă și criptare, actualizări de securitate, acces numai prin conturile personale primite, fără copii pe stocări personale sau în aplicații de mesagerie, ștergerea copiilor locale după livrare.
2.4. Codul numeric personal se prelucrează numai cât este necesar comenzii, nu se transcrie în livrabile decât dacă Operatorul o cere expres și se maschează în rapoartele către terți (Legea nr. 190/2018, art. 4).
${sal ? '' : `2.5. Nu angajează un alt împuternicit fără autorizarea prealabilă scrisă a Operatorului; dacă o primește, îi impune aceleași obligații și răspunde pentru el față de Operator.
2.6. Nu transferă date în afara Spațiului Economic European fără acordul scris al Operatorului.
`}2.${sal ? '5' : '7'}. Îl asistă pe Operator în răspunsul la cererile persoanelor vizate (acces, rectificare, ștergere, restricționare, opoziție) și în îndeplinirea obligațiilor privind securitatea, notificarea încălcărilor și evaluările de impact.
2.${sal ? '6' : '8'}. Notifică Operatorului orice încălcare a securității datelor în cel mult 24 de ore de la constatare, cu descrierea incidentului, a datelor afectate și a măsurilor luate.
2.${sal ? '7' : '9'}. La încetarea Contractului principal sau la cererea Operatorului, șterge ori returnează toate datele și copiile, în 5 zile lucrătoare, cu excepția celor pe care legea îl obligă să le păstreze, și confirmă în scris.
2.${sal ? '8' : '10'}. Pune la dispoziția Operatorului informațiile necesare pentru a demonstra respectarea acestui Acord și permite verificări, cu un preaviz de 5 zile lucrătoare.

ART. 3. OBLIGAȚIILE OPERATORULUI
3.1. Stabilește scopurile și mijloacele prelucrării, are temeiul legal pentru prelucrare și informează persoanele vizate.
3.2. Pune la dispoziție instrucțiunile și accesul strict necesar și retrage accesul la încetarea Contractului principal.

ART. 4. RĂSPUNDEREA
${sal ? `4.1. Încălcarea acestui Acord constituie abatere disciplinară și atrage răspunderea patrimonială a Salariatului pentru prejudiciul cauzat, în condițiile art. 254 din Codul muncii. Părțile nu stipulează clauză penală (interzisă în raporturile de muncă — ÎCCJ, HP nr. 19/2019).` : `4.1. Împuternicitul răspunde față de Operator pentru prejudiciul cauzat prin încălcarea acestui Acord, inclusiv pentru amenzile și despăgubirile plătite de Operator din cauza lui.
4.2. Încălcarea art. 2.2–2.9 constituie și încălcare a obligației de confidențialitate din Acordul de confidențialitate, neconcurență și neatragere și atrage clauza penală prevăzută acolo.
4.3. Încălcarea gravă a acestui Acord este temei de reziliere de drept a Contractului principal (pact comisoriu).`}

ART. 5. DISPOZIȚII FINALE
5.1. Acordul intră în vigoare la semnare și produce efecte cât timp ${parte} deține date ale Operatorului.
5.2. În caz de neconcordanță cu Contractul principal, în privința datelor personale prevalează prezentul Acord.
5.3. Legea aplicabilă este legea română și Regulamentul (UE) 2016/679.

@semn2 Operatorul|${parte}
`;
}

/* ---------- 3. Acordul de confidențialitate, neconcurență și neatragere ---------- */
function txtNeconcurenta(v) {
  const as = v.calitate === 'asociat';
  return `ACORD DE CONFIDENȚIALITATE, NECONCURENȚĂ ȘI NEATRAGERE
nr. {{nr}} din {{data}}
@nota Pentru ${as ? 'asociați și administratori' : 'colaboratori independenți (PFA, II, S.R.L., profesii liberale)'}. Pentru salariați, neconcurența se stipulează în contractul individual de muncă (Codul muncii art. 21–24), fără clauză penală.

PĂRȚILE
1. {{soc_den}}, cu sediul în {{soc_sediu}}, CUI {{soc_cui}}, reprezentată de {{soc_rep}} („Societatea”), și
2. {{p_den}}, ${as ? 'cu domiciliul în {{p_sediu}}, în calitate de asociat și/sau administrator al Societății' : '{{p_forma}}, CUI / CIF {{p_cui}}, cu sediul în {{p_sediu}}, în calitate de colaborator independent'} („Semnatarul”).

PREAMBUL
Societatea a investit în platforma de verificare a imobilelor și de obținere online a documentelor cadastrale, în baza de date, în metodele de lucru, în rețeaua de colaboratori și în clientelă. Semnatarul are acces la aceste elemente. Acordul le protejează, fără a-l împiedica pe Semnatar să își exercite profesia în forma ei obișnuită.

ART. 1. DEFINIȚII
1.1. „Activitatea protejată” — vânzarea către consumatori sau profesioniști, prin site-uri, aplicații, platforme online ori alte canale la distanță, a serviciilor de verificare a imobilelor înainte de cumpărare sau vânzare și de obținere, explicare ori prelucrare a documentelor cadastrale și conexe.
1.2. „Informații confidențiale” — orice informație la care Semnatarul are acces din cauza relației cu Societatea: baza de date și fișele, codul sursă, regulile de lucru, prețurile și marjele, datele clienților și ale comenzilor, lista colaboratorilor, cifrele de afaceri, planurile de dezvoltare, contractele. Ele sunt secrete comerciale ale Societății.
1.3. „Clienți” — persoanele care, în ultimele 24 de luni, au plasat o comandă, au cerut o ofertă sau și-au lăsat datele de contact pe platformele Societății.
1.4. „Colaboratori” — persoanele care, în ultimele 24 de luni, au prestat servicii pentru Societate ori au fost salariații ei.
1.5. „Durata relației” — perioada în care Semnatarul are calitatea arătată la Părți.

ART. 2. CONFIDENȚIALITATE
2.1. Pe Durata relației și 5 ani după încetarea ei, Semnatarul nu divulgă, nu copiază și nu folosește Informațiile confidențiale în alt scop decât executarea sarcinilor primite de la Societate.
2.2. Excepții: informațiile devenite publice fără vina Semnatarului și cele pe care legea îl obligă să le dezvăluie unei autorități; în acest caz anunță Societatea înainte, dacă legea permite, și dezvăluie strict ce i se cere.
2.3. Semnatarul păstrează Informațiile confidențiale în siguranță și anunță Societatea în 24 de ore despre orice pierdere sau acces neautorizat.

ART. 3. NECONCURENȚĂ
3.1. Pe Durata relației și {{luni_dupa}} luni după încetarea ei, Semnatarul nu desfășoară Activitatea protejată, direct sau prin persoane interpuse, și nu devine asociat cu o participație semnificativă, administrator, salariat sau colaborator al unei entități care o desfășoară, pe teritoriul {{aria}}.
3.2. Semnatarul rămâne liber să își exercite profesia în forma ei obișnuită (lucrări topografice, audit energetic, expertiză, asistență juridică etc.), pentru clienți proprii și pentru alți beneficiari, cu condiția să nu folosească Informațiile confidențiale și să nu se adreseze Clienților. Acordul nu interzice exercitarea profesiei sau a specializării Semnatarului.
${as ? '3.3. Pe durata mandatului de administrator se aplică, în plus, interdicțiile din Legea nr. 31/1990 (art. 197 alin. 2 pentru administratori; art. 79 și art. 82 pentru asociați); Acordul le completează. Clauza se reproduce în actul constitutiv sau într-o hotărâre a adunării asociaților.' : '3.3. Interdicția privește numai Activitatea protejată și nu afectează libertatea Semnatarului de a lucra pentru mai mulți clienți (Codul fiscal art. 7 pct. 3.2).'}

ART. 4. NEATRAGERE
4.1. Pe Durata relației și {{luni_dupa}} luni după încetarea ei, Semnatarul nu solicită, nu preia și nu deservește Clienții pentru Activitatea protejată și nu îi îndeamnă să înceteze relația cu Societatea.
4.2. În aceeași perioadă, Semnatarul nu atrage Colaboratorii pentru a presta Activitatea protejată în afara Societății.

ART. 5. PROPRIETATE INTELECTUALĂ ȘI RESTITUIRE
5.1. Documentele, șabloanele, analizele, fișele, codul și datele create de Semnatar pentru Societate aparțin Societății; Semnatarul îi cedează, exclusiv, fără limită de teritoriu și pe toată durata de protecție, drepturile patrimoniale asupra lor, prețul fiind inclus în remunerația convenită.
5.2. La încetarea relației sau la cerere, Semnatarul returnează ori șterge, în 5 zile lucrătoare, Informațiile confidențiale și confirmă în scris.

ART. 6. CLAUZA PENALĂ (art. 1.538–1.541 Cod civil)
6.1. Pentru fiecare încălcare a art. 2, 3, 4 sau 5, Semnatarul datorează Societății o penalitate de {{penalitate}} lei, exigibilă la constatarea încălcării, fără ca Societatea să fie ținută să dovedească vreun prejudiciu (art. 1.538 alin. 4).
6.2. Penalitatea este stipulată și pentru neexecutarea la timp: încălcarea care continuă după notificarea scrisă a Societății constituie o nouă încălcare la fiecare 30 de zile, iar Societatea poate cere atât încetarea încălcării, cât și penalitatea (art. 1.539).
6.3. Părțile declară că penalitatea reflectă prejudiciul previzibil la data semnării, determinat de: investiția în platformă și în date ({{inv_platforma}} lei), valoarea anuală a clientelei ({{val_clientela}} lei) și costul refacerii rețelei de colaboratori ({{cost_retea}} lei). Penalitatea nu este vădit excesivă în sensul art. 1.541 alin. (1) lit. b).
6.4. Penalitatea nu înlătură dreptul Societății de a cere încetarea încălcării pe cale de urgență (Legea nr. 11/1991).

ART. 7. DURATA
7.1. Acordul intră în vigoare la semnare și produce efecte pe Durata relației și pe termenele de după încetare prevăzute la art. 2, 3 și 4.

ART. 8. DISPOZIȚII FINALE
8.1. Notificările se fac în scris, la adresele de email {{soc_email}} și {{p_email}}.
8.2. Clauza nulă nu afectează restul Acordului; Părțile o înlocuiesc cu una valabilă, cât mai apropiată de scopul inițial. Dacă instanța consideră excesivă durata sau aria de la art. 3, Acordul rămâne valabil în limitele pe care instanța le apreciază rezonabile.
8.3. Acordul se modifică numai prin act adițional. Semnatarul nu îl poate cesiona.
8.4. Legea română; instanțele competente de la sediul Societății.

ART. 9. ACCEPTAREA EXPRESĂ A CLAUZELOR NEUZUALE (art. 1.203 Cod civil)
Semnatarul declară că a citit și acceptă în mod expres art. 3 (neconcurență), art. 4 (neatragere), art. 5.1 (cesiunea drepturilor), art. 6 (clauza penală) și art. 8.4 (instanța competentă).
@semn1 Semnatarul, pentru art. 9

@semn2 Societatea|Semnatarul
`;
}

/* ---------- 4. Contractul individual de muncă ---------- */
function txtCim(v) {
  const part = v.norma === 'partiala';
  const det = v.durata === 'determinata';
  const nc = v.nc === 'da';
  return `CONTRACT INDIVIDUAL DE MUNCĂ ${part ? 'CU TIMP PARȚIAL' : 'CU NORMĂ ÎNTREAGĂ'}
nr. {{nr}} din {{data}}, înregistrat în registrul general de evidență a salariaților la data {{data_revisal}}
@nota Se încheie în formă scrisă, în limba română, cel târziu în ziua anterioară începerii activității și se transmite în registrul general de evidență a salariaților înainte de începere (Codul muncii art. 16 alin. 1, art. 34). Conține elementele art. 17 alin. (3)${part ? ' și art. 105' : ''}.

A. PĂRȚILE
Angajatorul: {{soc_den}}, cu sediul în {{soc_sediu}}, înregistrat la Registrul Comerțului sub nr. {{soc_orc}}, CUI {{soc_cui}}, reprezentat de {{soc_rep}}, în calitate de {{soc_calrep}},
și
Salariatul: {{sal_nume}}, CNP {{sal_cnp}}, act de identitate {{sal_ci}}, eliberat de {{sal_ci_emis}}, cu domiciliul în {{sal_dom}},
au încheiat prezentul contract individual de muncă („Contractul”).

B. OBIECTUL CONTRACTULUI
Prestarea muncii de către Salariat în funcția prevăzută la lit. E, în schimbul salariului prevăzut la lit. J.

C. DURATA CONTRACTULUI
${det ? 'Contract pe durată determinată, de la {{data_start}} până la {{data_sfarsit}}, pentru {{motiv_det}} (Codul muncii art. 83).' : 'Contract pe durată nedeterminată, cu începere de la {{data_start}} (Codul muncii art. 12 alin. 1).'}

D. LOCUL DE MUNCĂ
Activitatea se desfășoară la {{loc_munca}}.${v.telemunca === 'da' ? ' Salariatul poate presta munca și în regim de telemuncă, {{zile_telemunca}} zile pe săptămână, în condițiile stabilite printr-o anexă la Contract; angajatorul asigură mijloacele de lucru necesare.' : ''} Deplasările în interes de serviciu în alte locuri se decontează de Angajator.

E. FELUL MUNCII
Funcția / ocupația: {{functia}}, cod COR {{cod_cor}}. Atribuțiile sunt prevăzute în fișa postului, anexă la Contract.

F. CRITERIILE DE EVALUARE A ACTIVITĂȚII PROFESIONALE
{{criterii}}

G. CONDIȚIILE DE MUNCĂ ȘI RISCURILE SPECIFICE POSTULUI
Activitatea se desfășoară în condiții normale de muncă. Riscurile specifice postului: {{riscuri}}. Angajatorul asigură instruirea în domeniul securității și sănătății în muncă.

H. DURATA MUNCII
${part
    ? `1. Fracțiune de normă: {{ore_zi}} ore pe zi, {{ore_sapt}} ore pe săptămână (Codul muncii art. 103–104).
2. Repartizarea programului de lucru: {{program}}.
3. Programul de lucru se poate modifica numai cu acordul Salariatului, prin act adițional, sau cu o informare prealabilă de cel puțin 5 zile lucrătoare atunci când modificarea este cerută de nevoile activității și nu schimbă numărul de ore.
4. Salariatul nu va efectua ore suplimentare, cu excepția cazurilor de forță majoră sau pentru lucrări urgente destinate prevenirii producerii unor accidente ori înlăturării consecințelor acestora (art. 105 alin. 1 lit. c).`
    : `1. Normă întreagă: 8 ore pe zi, 40 de ore pe săptămână (Codul muncii art. 112).
2. Repartizarea programului de lucru: {{program}}.
3. Munca suplimentară se efectuează numai cu acordul Salariatului, cu excepția cazurilor prevăzute de art. 120 alin. (2), și se compensează prin ore libere plătite în următoarele 90 de zile calendaristice; în lipsa compensării, se plătește cu un spor de cel puțin 75% din salariul de bază (art. 122–123).`}

I. CONCEDIUL
Durata concediului de odihnă anual este de {{concediu}} zile lucrătoare, în raport cu durata muncii (minimum 20 de zile lucrătoare — art. 145). Salariatul beneficiază și de concediile și zilele libere prevăzute de lege.

J. SALARIZAREA
1. Salariul de bază lunar brut: {{salariu}} lei${part ? ', corespunzător fracțiunii de normă' : ''}.
2. Alte elemente constitutive, evidențiate separat: sporuri {{sporuri}}; indemnizații {{indemnizatii}}; alte adaosuri {{adaosuri}}.
3. Salariul se plătește lunar, cel mai târziu la data de {{zi_plata}} a lunii următoare, prin virament în contul bancar indicat de Salariat.
4. Salariul este confidențial (art. 163).

K. DREPTURI ȘI OBLIGAȚII PRIVIND SECURITATEA ȘI SĂNĂTATEA ÎN MUNCĂ
Echipament individual de protecție: {{echipament}}. Alte drepturi: materiale igienico-sanitare, alimentație de protecție și alte drepturi, conform legii, dacă este cazul.

L. ALTE CLAUZE
1. Perioada de probă: {{proba}} zile calendaristice (maximum 90 pentru funcții de execuție, 120 pentru funcții de conducere — art. 31). Pe durata sau la sfârșitul ei, Contractul poate înceta prin notificare scrisă, fără preaviz.
2. Preavizul la concediere: {{preaviz_concediere}} zile lucrătoare (minimum 20 — art. 75).
3. Preavizul la demisie: {{preaviz_demisie}} zile lucrătoare (maximum 20 pentru funcții de execuție, 45 pentru funcții de conducere — art. 81).
4. Formarea profesională: {{formare}}.
5. Confidențialitate (art. 26): pe durata Contractului și 2 ani după încetare, Salariatul nu transmite date sau informații de care a luat cunoștință în executarea Contractului (date ale clienților, prețuri, metode de lucru, baza de date, codul sursă). Nerespectarea atrage plata de daune-interese, în condițiile legii.
6. Protecția datelor: Salariatul a primit informarea privind prelucrarea datelor sale personale și semnează Acordul privind prelucrarea datelor pentru datele clienților la care are acces.
${nc ? `7. Clauza de neconcurență (art. 21–24):
   a) activitățile interzise după încetarea Contractului: {{nc_activitati}};
   b) terții în favoarea cărora este interzisă prestarea: {{nc_terti}};
   c) aria geografică: {{nc_arie}};
   d) durata: {{nc_luni}} luni de la încetarea Contractului (maximum 24 — art. 22);
   e) indemnizația lunară de neconcurență: {{nc_procent}}% din media veniturilor salariale brute din ultimele 6 luni (minimum 50% — art. 21 alin. 3), plătită lunar pe toată durata.
   Clauza nu interzice în mod absolut exercitarea profesiei Salariatului (art. 23). La încălcarea ei cu vinovăție, Salariatul restituie indemnizația și datorează daune-interese corespunzătoare prejudiciului (art. 24). Părțile nu stipulează clauză penală (interzisă — ÎCCJ, HP nr. 19/2019).
` : ''}${nc ? '8' : '7'}. Contractul se poate semna și cu semnătură electronică calificată, cu respectarea procedurii stabilite de Angajator.

M. DREPTURI ȘI OBLIGAȚII GENERALE ALE PĂRȚILOR
1. Salariatul are, în principal, drepturile prevăzute de art. 39 alin. (1) din Codul muncii: salarizare, repaus zilnic și săptămânal, concediu de odihnă anual, egalitate de șanse și de tratament, demnitate, securitate și sănătate în muncă, formare profesională, informare și consultare, protecție în caz de concediere.
2. Salariatul are, în principal, obligațiile prevăzute de art. 39 alin. (2): realizarea normei de muncă și a atribuțiilor din fișa postului, respectarea disciplinei muncii și a regulamentului intern, fidelitatea față de Angajator, respectarea măsurilor de securitate și sănătate în muncă, a secretului de serviciu și a obligațiilor privind datele personale.
3. Angajatorul are drepturile și obligațiile prevăzute de art. 40, între care: să acorde toate drepturile ce decurg din lege și din Contract, să plătească contribuțiile și impozitele datorate, să țină registrul general de evidență a salariaților și să elibereze, la cerere, documentele care atestă activitatea Salariatului.

N. DISPOZIȚII FINALE
1. Contractul colectiv de muncă aplicabil: {{ccm}}.
2. Orice modificare a elementelor de mai sus se face prin act adițional, încheiat anterior producerii modificării, cu excepția situațiilor prevăzute expres de lege (art. 17 alin. 5, art. 41).
3. Prevederile Contractului se completează cu Codul muncii și cu regulamentul intern. Conflictele în legătură cu Contractul se soluționează de instanța judecătorească competentă material și teritorial, potrivit legii.
4. Contractul se încheie în două exemplare, câte unul pentru fiecare parte. Salariatul declară că a primit un exemplar și fișa postului.
@nota Fără clauză penală: în contractul individual de muncă ea este interzisă și lovită de nulitate (ÎCCJ, HP nr. 19/2019, în interpretarea art. 38 și art. 254 din Codul muncii).

@semn2 Angajatorul|Salariatul
`;
}

/* ---------- 5. Contractul de dezvoltare software (textul existent) ---------- */
function txtTehnic(v) {
  return tplTehnic(v.p_den || '').replace(/^ȘABLON DE LUCRU.*$/m, '').replace(/100\.000 lei \(o sută de mii lei\)/g, '{{penalitate}} lei');
}

/* ---------- registrul șabloanelor ---------- */
const ACTE_TPL = {
  servicii: { nume: 'Contract-cadru de prestări servicii', scurt: 'Specialiști: date OCPI, certificate energetice, topografie. Factură și plată lunară pe decont.', txt: txtServicii, rows: true,
    campuri: [F_ACT([['tva', 'Prestatorul e plătitor de TVA?', 'sel', 'nu', ['nu', 'da']], ['termen_plata', 'Plata facturii (zile)', 'number', '15'], ['termen_verificare', 'Verificarea livrabilului (zile lucrătoare)', 'number', '3'], ['preaviz', 'Preaviz de denunțare (zile)', 'number', '30'], ['raspundere_x', 'Limita răspunderii (× prețul comenzii)', 'number', '3'], ['pen_intarziere', 'Penalitate de întârziere (% / zi)', 'text', '1']]), F_SOC, F_PREST] },
  gdpr: { nume: 'Acord privind prelucrarea datelor (GDPR)', scurt: 'Cu fiecare colaborator (împuternicit, art. 28) și cu fiecare salariat (art. 29).', txt: txtGdpr,
    campuri: [F_ACT([['calitate', 'Cu cine se semnează', 'sel', 'imputernicit', [['imputernicit', 'colaborator (împuternicit)'], ['salariat', 'salariat']]], ['contract_ref', 'Nr. și data contractului principal', 'text'], ['zile_stergere', 'Ștergerea datelor după livrare (zile)', 'number', '30'], ['functia', 'Funcția (pentru salariat)', 'text']]), F_SOC, ['Cealaltă parte', [['p_den', 'Nume / denumire', 'text'], ['p_forma', 'Forma (pentru colaborator)', 'sel', 'PFA', ['PFA', 'întreprindere individuală', 'S.R.L.', 'cabinet individual']], ['p_cui', 'CUI / CIF', 'text'], ['p_sediu', 'Sediul / domiciliul', 'text'], ['p_email', 'Email', 'email']]]] },
  neconcurenta: { nume: 'Acord de confidențialitate, neconcurență și neatragere', scurt: 'Colaboratori și asociați, cu clauză penală. Pentru salariați: clauza din CIM.', txt: txtNeconcurenta,
    campuri: [F_ACT([['calitate', 'Semnatarul este', 'sel', 'colaborator', [['colaborator', 'colaborator independent'], ['asociat', 'asociat / administrator']]], ['luni_dupa', 'Durata după încetare (luni)', 'number', '12'], ['aria', 'Aria', 'text', 'României'], ['penalitate', 'Penalitatea pe încălcare (lei)', 'text', PEN_DEF]]), ['Justificarea penalității', [['inv_platforma', 'Investiția în platformă și date (lei)', 'text'], ['val_clientela', 'Valoarea anuală a clientelei (lei)', 'text'], ['cost_retea', 'Costul refacerii rețelei de colaboratori (lei)', 'text']]], F_SOC, ['Semnatarul', [['p_den', 'Nume / denumire', 'text'], ['p_forma', 'Forma (colaborator)', 'sel', 'PFA', ['PFA', 'întreprindere individuală', 'S.R.L.', 'cabinet individual']], ['p_cui', 'CUI / CIF', 'text'], ['p_sediu', 'Sediul / domiciliul', 'text'], ['p_email', 'Email', 'email']]]] },
  cim: { nume: 'Contract individual de muncă', scurt: 'Normă întreagă sau timp parțial, cu toate elementele art. 17. Neconcurență opțională, fără clauză penală.', txt: txtCim,
    campuri: [F_ACT([['data_revisal', 'Data transmiterii în registru (Revisal)', 'date'], ['norma', 'Norma', 'sel', 'intreaga', [['intreaga', 'normă întreagă (8 h / 40 h)'], ['partiala', 'timp parțial']]], ['ore_zi', 'Ore pe zi (timp parțial)', 'number', '4'], ['ore_sapt', 'Ore pe săptămână (timp parțial)', 'number', '20'], ['program', 'Repartizarea programului', 'text', 'luni–vineri, 09:00–17:00'], ['durata', 'Durata', 'sel', 'nedeterminata', [['nedeterminata', 'nedeterminată'], ['determinata', 'determinată']]], ['data_start', 'Data începerii', 'date'], ['data_sfarsit', 'Data încetării (determinată)', 'date'], ['motiv_det', 'Motivul duratei determinate', 'text']]),
      F_SOC, ['Salariatul', [['sal_nume', 'Nume și prenume', 'text'], ['sal_cnp', 'CNP', 'text'], ['sal_ci', 'Act de identitate (serie, nr.)', 'text'], ['sal_ci_emis', 'Eliberat de, la data', 'text'], ['sal_dom', 'Domiciliul', 'text'], ['p_email', 'Email', 'email']]],
      ['Postul și salariul', [['functia', 'Funcția / ocupația', 'text'], ['cod_cor', 'Cod COR', 'text'], ['loc_munca', 'Locul de muncă', 'text'], ['telemunca', 'Telemuncă', 'sel', 'nu', ['nu', 'da']], ['zile_telemunca', 'Zile de telemuncă / săptămână', 'number', '2'], ['criterii', 'Criterii de evaluare', 'text', 'calitatea și termenele livrabilelor, respectarea procedurilor, feedbackul clienților'], ['riscuri', 'Riscuri specifice postului', 'text', 'lucru la calculator, deplasări în teren'], ['salariu', 'Salariul de bază brut (lei)', 'number'], ['sporuri', 'Sporuri', 'text', '—'], ['indemnizatii', 'Indemnizații', 'text', '—'], ['adaosuri', 'Alte adaosuri', 'text', '—'], ['zi_plata', 'Ziua plății', 'number', '10'], ['concediu', 'Concediu de odihnă (zile lucrătoare)', 'number', '21'], ['proba', 'Perioada de probă (zile)', 'number', '90'], ['preaviz_concediere', 'Preaviz concediere (zile lucrătoare)', 'number', '20'], ['preaviz_demisie', 'Preaviz demisie (zile lucrătoare)', 'number', '20'], ['formare', 'Formarea profesională', 'text', 'conform planului anual de formare, cel puțin o dată la 2 ani, pe cheltuiala Angajatorului'], ['echipament', 'Echipament de protecție', 'text', 'nu este cazul'], ['ccm', 'Contract colectiv aplicabil', 'text', 'nu există contract colectiv de muncă aplicabil la nivelul Angajatorului']]],
      ['Neconcurență (opțional)', [['nc', 'Clauză de neconcurență', 'sel', 'nu', ['nu', 'da']], ['nc_activitati', 'Activitățile interzise', 'text', 'vânzarea online de servicii de verificare a imobilelor și de obținere a documentelor cadastrale'], ['nc_terti', 'Terții în favoarea cărora e interzisă', 'text', 'societățile care desfășoară activitățile de mai sus, numite în anexă'], ['nc_arie', 'Aria geografică', 'text', 'România'], ['nc_luni', 'Durata (luni, max. 24)', 'number', '12'], ['nc_procent', 'Indemnizația (% din media brută, min. 50)', 'number', '50']]]] },
  tehnic: { nume: 'Contract de dezvoltare software', scurt: 'Colaboratori tehnici, cu cesiunea drepturilor asupra codului.', txt: txtTehnic,
    campuri: [F_ACT([['penalitate', 'Penalitatea pe încălcare (lei)', 'text', PEN_DEF]]), F_SOC, ['Dezvoltatorul', [['p_den', 'Nume / denumire', 'text']]]] }
};

/* verificări pe text, afișate lângă formular */
function acteAvertizari(tip, v) {
  const w = [];
  if (tip === 'cim') {
    const part = v.norma === 'partiala'; const min = part ? Math.round(SAL_MIN * nr(v.ore_sapt) / 40) : SAL_MIN;
    if (v.salariu && nr(v.salariu) < min) w.push('Salariul e sub minimul brut garantat: ' + min.toLocaleString('ro-RO') + ' lei' + (part ? ' pentru ' + v.ore_sapt + ' h/săpt.' : '') + ' (HG 146/2026, de la 01.07.2026).');
    if (part && nr(v.ore_sapt) >= 40) w.push('Timpul parțial trebuie să fie sub 40 de ore pe săptămână (art. 103).');
    if (nr(v.proba) > 90) w.push('Perioada de probă depășește 90 de zile (art. 31; 120 doar pentru funcții de conducere).');
    if (nr(v.concediu) < 20) w.push('Concediul de odihnă e sub minimul de 20 de zile lucrătoare (art. 145).');
    if (nr(v.preaviz_concediere) < 20) w.push('Preavizul la concediere nu poate fi sub 20 de zile lucrătoare (art. 75).');
    if (nr(v.preaviz_demisie) > 20) w.push('Preavizul la demisie peste 20 de zile lucrătoare e permis doar pentru funcții de conducere (maximum 45, art. 81).');
    if (v.durata === 'determinata' && !v.motiv_det) w.push('Contractul pe durată determinată cere unul dintre cazurile din art. 83.');
    if (v.nc === 'da' && nr(v.nc_luni) > 24) w.push('Neconcurența nu poate depăși 24 de luni (art. 22).');
    if (v.nc === 'da' && nr(v.nc_procent) < 50) w.push('Indemnizația de neconcurență trebuie să fie de cel puțin 50% (art. 21 alin. 3); altfel clauza nu produce efecte.');
  }
  if (tip === 'neconcurenta') {
    if (v.calitate === 'colaborator' && nr(v.luni_dupa) > 12) w.push('Peste 12 luni după încetare la colaboratori crește riscul ca instanța să reducă durata (decizia din 19.10: 12 luni colaboratori, 24 asociați).');
    if (!v.inv_platforma || !v.val_clientela || !v.cost_retea) w.push('Completează justificarea penalității de 100.000 lei (art. 6.3: investiția, valoarea clientelei, costul rețelei), apoi „Salvează datele Societății” ca să rămână pentru toate acordurile. Fără ea, instanța o poate reduce mai ușor (art. 1.541 alin. 1 lit. b).');
    else if (nr(v.inv_platforma) + nr(v.val_clientela) + nr(v.cost_retea) < nr(v.penalitate)) w.push('Suma elementelor din justificare e mai mică decât penalitatea: argumentul de „prejudiciu previzibil” e mai slab.');
  }
  if (tip === 'servicii') {
    if (!(v.rows || []).some((r) => r[0])) w.push('Anexa 1 e goală: adaugă serviciile, termenele și prețurile.');
    if (v.p_atestat_exp && new Date(v.p_atestat_exp) < new Date()) w.push('Autorizația / atestatul Prestatorului e expirat.');
  }
  return w;
}

/* ---------- din text în HTML ---------- */
function acteHtml(tip, v, meta) {
  meta = meta || {}; const SG = actSemnaturiHtml(meta);
  const T = ACTE_TPL[tip]; let txt = T.txt(v);
  const lbl = {}; T.campuri.forEach((g) => g[1].forEach((f) => (lbl[f[0]] = f[1])));
  const fill = (s) => esc(s).replace(/\{\{(\w+)\}\}/g, (m, k) => { const x = v[k]; return x !== undefined && String(x).trim() !== '' ? '<span class="vf">' + esc(/data|exp|start|sfarsit|revisal/.test(k) ? fmtData(x) : x) + '</span>' : '<span class="gol">' + esc(lbl[k] || k) + '</span>'; });
  const lines = txt.split('\n'); let out = '', inTab = false, first = true;
  lines.forEach((ln) => {
    if (inTab) { if (ln.startsWith('@endtabel')) { out += '</tbody></table>'; inTab = false; } else if (ln.trim()) out += '<tr>' + ln.split('|').map((c) => '<td>' + fill(c.trim()) + '</td>').join('') + '</tr>'; return; }
    if (!ln.trim()) return;
    if (first) { out += '<h1>' + fill(ln) + '</h1>'; first = false; return; }
    if (ln.startsWith('@nota ')) { out += '<p class="nota">' + fill(ln.slice(6)) + '</p>'; return; }
    if (ln.startsWith('@tabel ')) { out += '<table class="ta"><thead><tr>' + ln.slice(7).split('|').map((c) => '<th>' + esc(c) + '</th>').join('') + '</tr></thead><tbody>'; inTab = true; return; }
    if (ln.startsWith('@semn1 ')) { out += '<div class="semn1">' + esc(ln.slice(7)) + ': ' + (SG.p || '____________________') + '</div>'; return; }
    if (ln.startsWith('@semn2 ')) { out += '<div class="semn2">' + ln.slice(7).split('|').map((p, i) => { const sg = i === 0 ? SG.s : SG.p; return '<div><b>' + esc(p) + '</b><br>' + (sg || 'Nume: ____________________<br>Semnătura: ________________<br>Data: ____________') + '</div>'; }).join('') + '</div>'; return; }
    if (/^nr\. /.test(ln) && out.indexOf('<p class="nr">') < 0) { out += '<p class="nr">' + fill(ln) + '</p>'; return; }
    if (/^(ART\. |ANEXA|PĂRȚILE|PREAMBUL|[A-N]\. [A-ZĂÂÎȘȚ])/.test(ln)) { out += '<h2>' + fill(ln) + '</h2>'; return; }
    if (/^\s+[a-e]\) /.test(ln)) { out += '<p class="ind">' + fill(ln.trim()) + '</p>'; return; }
    out += '<p>' + fill(ln) + '</p>';
  });
  return '<article class="actdoc" id="actdoc">' + out + actJurnalHtml(meta) + '</article>';
}

/* ---------- starea editorului ---------- */
function acteNou(tip, pre) {
  const T = ACTE_TPL[tip]; const v = {};
  T.campuri.forEach((g) => g[1].forEach((f) => { if (f[3] !== undefined) v[f[0]] = f[3]; }));
  Object.assign(v, firmaSalvata(), { data: new Date().toISOString().slice(0, 10) }, pre || {});
  if (T.rows && !v.rows) v.rows = [['', '', ''], ['', '', ''], ['', '', '']];
  return { id: null, tip, v };
}
function acteDinSpecialist(tip, s) {
  const pre = { p_den: s.nume, p_email: s.email || '', p_tel: s.tel || '', p_atestat: s.atestat && s.atestat !== '—' ? s.atestat : '' };
  if (tip === 'servicii') pre.rows = Object.keys(CH).filter((k) => CH[k]().some((t) => s.spec.includes(t.spec))).map((k) => { const ts = CH[k]().filter((t) => s.spec.includes(t.spec)); const sla = Math.max(...ts.map((t) => t.sla || 0)); const ter = ts.some((t) => t.teren) ? 'programare în 24 h, livrare în 48 h de la vizită' : (sla >= 60 && sla % 60 === 0 ? sla / 60 + ' h' : sla + ' min') + ' de la acceptare'; return [svName(k), ter, String(ts.reduce((x, t) => x + (t.tarif || 0), 0))]; });
  return acteNou(tip, pre);
}
const ACTE_DOC = () => UI.act || null;
/* ce acte se generează pentru fiecare calitate (Contracte → Situația pe persoane → Generează) */
const ACTE_PERS = {
  specialist: [['servicii'], ['gdpr', 'imputernicit'], ['neconcurenta', 'colaborator']],
  colaborator: [['servicii'], ['gdpr', 'imputernicit'], ['neconcurenta', 'colaborator']],
  tehnic: [['tehnic'], ['gdpr', 'imputernicit'], ['neconcurenta', 'colaborator']],
  asociat: [['neconcurenta', 'asociat'], ['gdpr', 'imputernicit']],
  salariat: [['cim', 'cu neconcurență'], ['cim'], ['gdpr', 'salariat']]
};

/* ---------- vederea ---------- */
function acteView() {
  const cur = ACTE_DOC();
  if (!cur) {
    R.db.acte = R.db.acte || {};
    const lista = L('acte').sort((a, b) => (b.stare === 'semnat_parte') - (a.stare === 'semnat_parte') || (b.modificat_la || 0) - (a.modificat_la || 0));
    const nContra = lista.filter((a) => a.stare === 'semnat_parte').length;
    return (nContra ? '<div class="card info"><b>' + nContra + ' act(e) semnate de colaboratori, de contrasemnat.</b> Deschide-le din lista de mai jos.</div>' : '') + '<div class="actgrid">' + Object.keys(ACTE_TPL).map((k) => '<div class="card actcard"><h3>' + esc(ACTE_TPL[k].nume) + '</h3><p class="small mut">' + esc(ACTE_TPL[k].scurt) + '</p>' + btn('actnou', 'Completează', { x: k, c: 'pri mic' }) + '</div>').join('') + '</div>' +
      sec('Acte salvate (' + lista.length + ')', lista.length ? tbl(['Act', 'Cu cine', 'Modificat', 'Stare', ''], lista.map((a) => '<tr><td>' + esc(ACTE_TPL[a.tip] ? ACTE_TPL[a.tip].nume : a.tip) + '<br><span class="small mut">nr. ' + esc(a.v.nr || '—') + '</span></td><td>' + esc(a.v.p_den || a.v.sal_nume || (a.dest_spec ? spName(a.dest_spec) : '—')) + '</td><td class="small">' + fmtT(a.modificat_la) + '</td><td>' + tag((STARE_ACT[a.stare] || [a.stare || 'ciornă'])[0], (STARE_ACT[a.stare] || [0, 'gri'])[1]) + '</td><td>' + btn('actdesch', 'Deschide', { id: a.id, c: 'mic' }) + ' ' + btn('actcopie', 'Copie', { id: a.id, c: 'mic' }) + ' ' + btn('actsterg', 'Șterge', { id: a.id, c: 'mic war' }) + '</td></tr>')) : '<p class="mut">Niciun act salvat. Alege un șablon de mai sus.</p>') +
      '<p class="small mut">Datele Societății se completează o dată și se salvează pentru toate actele. Textele sunt redactate pe textele oficiale din registrul legislativ; varianta finală o validează avocatul partener.</p>';
  }
  const T = ACTE_TPL[cur.tip]; const v = cur.v; const lock = actStare(cur) !== 'ciornă' ? ' disabled' : '';
  const fld = (f) => { const [k, label, type, , opts] = f; const val = v[k] == null ? '' : v[k];
    if (type === 'sel') return '<label>' + esc(label) + '<select data-af="' + k + '"' + lock + '>' + opts.map((o) => { const ov = Array.isArray(o) ? o[0] : o; return '<option value="' + esc(ov) + '"' + (String(val) === ov ? ' selected' : '') + '>' + esc(Array.isArray(o) ? o[1] : o) + '</option>'; }).join('') + '</select></label>';
    return '<label>' + esc(label) + '<input data-af="' + k + '" type="' + (type || 'text') + '" value="' + esc(val) + '"' + lock + '></label>'; };
  const grupuri = T.campuri.map((g) => '<details class="ag"' + (g[0] === 'Societatea' && firmaSalvata().soc_cui ? '' : ' open') + '><summary>' + esc(g[0]) + (g[0] === 'Societatea' ? ' <span class="small mut">' + (firmaSalvata().soc_cui ? '(salvate)' : '(se salvează pentru toate actele)') + '</span>' : '') + '</summary><div class="frm">' + g[1].map(fld).join('') + '</div>' + (g[0] === 'Societatea' || g[0] === 'Justificarea penalității' ? btn('actfirma', 'Salvează datele Societății', { c: 'mic' }) : '') + '</details>').join('');
  const rows = T.rows ? '<details class="ag" open><summary>Anexa 1 — servicii, termene, prețuri</summary><table class="arows"><thead><tr><th>Serviciu</th><th>Termen</th><th>Preț (lei)</th><th></th></tr></thead><tbody>' + v.rows.map((r, i) => '<tr>' + [0, 1, 2].map((j) => '<td><input data-ar="' + i + '|' + j + '" value="' + esc(r[j] || '') + '"></td>').join('') + '<td>' + btn('actrowdel', '✕', { id: i, c: 'mic' }) + '</td></tr>').join('') + '</tbody></table>' + btn('actrowadd', '+ Rând', { c: 'mic' }) + ' <select data-af="_dinsp" class="mic"><option value="">Preia serviciile unui specialist…</option>' + L('specialisti', (s) => !s.sistem).map((s) => '<option value="' + s.id + '">' + esc(s.nume) + '</option>').join('') + '</select></details>' : '';
  const warn = acteAvertizari(cur.tip, v);
  return '<div class="actbar">' + btn('actinchide', '← Toate actele', { c: 'mic' }) + '<b>' + esc(T.nume) + '</b><span class="sp"></span>' + btn('actsalv', 'Salvează', { c: 'mic pri' }) + btn('actprint', 'Print / PDF', { c: 'mic' }) + btn('actpdf', 'Descarcă PDF', { c: 'mic' }) + btn('actword', 'Descarcă Word', { c: 'mic' }) + btn('acttrimite', 'Trimite', { c: 'mic' }) + '</div>' +
    '<div class="acted"><div class="actform">' + actAdminPanou(cur) + '<div id="actwarn">' + acteWarnHtml(warn) + '</div>' + grupuri + rows + '</div><div class="actprev" id="actprev">' + acteHtml(cur.tip, v, actMeta(cur)) + '</div></div>';
}
const acteWarnHtml = (w) => w.length ? '<div class="card warnc">' + w.map((x) => '<div class="small">⚠ ' + esc(x) + '</div>').join('') + '</div>' : '';
function actePreview() { const cur = ACTE_DOC(); if (!cur) return; const p = $('#actprev'); if (p) p.innerHTML = acteHtml(cur.tip, cur.v, actMeta(cur)); const w = $('#actwarn'); if (w) w.innerHTML = acteWarnHtml(acteAvertizari(cur.tip, cur.v)); }

/* câmpurile editorului actualizează doar previzualizarea (fără redesenarea paginii, ca să nu se piardă cursorul) */
document.addEventListener('input', (e) => {
  const cur = ACTE_DOC(); if (!cur) return; const t = e.target;
  if (t.dataset.af && t.dataset.af !== '_dinsp') { cur.v[t.dataset.af] = t.value; actePreview(); }
  else if (t.dataset.ar) { const [i, j] = t.dataset.ar.split('|').map(Number); cur.v.rows[i][j] = t.value; actePreview(); }
});
document.addEventListener('change', (e) => {
  const cur = ACTE_DOC(); if (!cur || e.target.dataset.af !== '_dinsp' || !e.target.value) return;
  const s = D('specialisti')[e.target.value]; if (!s) return; const x = acteDinSpecialist(cur.tip, s); Object.assign(cur.v, { p_den: x.v.p_den, p_email: x.v.p_email, p_tel: x.v.p_tel, p_atestat: x.v.p_atestat }); if (x.v.rows) cur.v.rows = x.v.rows; renderApp();
});

/* ---------- export ---------- */
const ACT_CSS = 'body{font-family:"Times New Roman",Georgia,serif;font-size:11.5pt;line-height:1.45;color:#111}h1{font-size:15pt;text-align:center;margin:0 0 2pt;text-transform:uppercase;letter-spacing:.02em}.nr{text-align:center;margin:0 0 8pt}h2{font-size:11.5pt;margin:12pt 0 4pt;text-transform:uppercase}p{margin:0 0 5pt;text-align:justify}.ind{margin-left:18pt}.nota{font-size:9.5pt;color:#555;font-style:italic;text-align:left}.ta{width:100%;border-collapse:collapse;margin:6pt 0}.ta th,.ta td{border:1px solid #999;padding:4pt 6pt;text-align:left;font-size:10.5pt}.semn1{margin:10pt 0}.semn2{display:flex;justify-content:space-between;gap:24pt;margin:18pt 0 6pt}.semn2 div{flex:1}.semimg{height:56px;display:block}.semjur{font-size:8.5pt;color:#555}.jur td{font-size:9pt}.jur .h{word-break:break-all;font-family:monospace}.gol{background:#fff3c4;color:#7a5b00;padding:0 2pt}.vf{}';
const actFile = (cur, ext) => { const T = ACTE_TPL[cur.tip]; const who = (cur.v.p_den || cur.v.sal_nume || 'sablon').replace(/[^\wăâîșțĂÂÎȘȚ]+/g, '_'); return (T.nume.split(' ').slice(0, 3).join('_') + '_' + (cur.v.nr || 'fara_nr') + '_' + who).replace(/_+/g, '_') + '.' + ext; };
const actGoale = () => document.querySelectorAll('#actdoc .gol').length;
let HTML2PDF = null;
async function actPdfBlob() {
  if (!HTML2PDF) await new Promise((ok, err) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'; s.onload = () => { HTML2PDF = window.html2pdf; ok(); }; s.onerror = () => err(new Error('Nu s-a putut încărca generatorul de PDF (fără internet?). Folosește Print / PDF.')); document.head.appendChild(s); });
  const box = document.createElement('div'); box.innerHTML = '<style>' + ACT_CSS + '.gol{background:none;color:#111}</style>' + acteHtml(ACTE_DOC().tip, ACTE_DOC().v, actMeta(ACTE_DOC())); box.style.cssText = 'width:180mm;padding:0;background:#fff';
  return HTML2PDF().set({ margin: [15, 15, 15, 15], image: { type: 'jpeg', quality: 0.9 }, html2canvas: { scale: 1.6, backgroundColor: '#ffffff' }, jsPDF: { unit: 'mm', format: 'a4' }, pagebreak: { mode: ['css', 'legacy'], avoid: ['h2', 'tr', '.semn2'] } }).from(box).outputPdf('blob');
}
function actSave(stare) {
  const cur = ACTE_DOC(); R.db.acte = R.db.acte || {};
  if (!cur.id) cur.id = uid('act');
  const prev = D('acte')[cur.id] || {}; D('acte')[cur.id] = Object.assign(prev, { id: cur.id, tip: cur.tip, v: (prev.stare && prev.stare !== 'ciornă') ? prev.v : JSON.parse(JSON.stringify(cur.v)), creat_la: prev.creat_la || now(), modificat_la: now(), stare: stare || prev.stare || 'ciornă', de: prev.de || (UI.auth || {}).nume || 'admin' });
}
const ACTE_A = {
  actnou: (d) => { UI.act = acteNou(d.x); UI.f.jt = 'acte'; },
  actdesch: (d) => { const a = D('acte')[d.id]; if (a) UI.act = { id: a.id, tip: a.tip, v: JSON.parse(JSON.stringify(a.v)) }; },
  actcopie: (d) => { const a = D('acte')[d.id]; if (a) { UI.act = { id: null, tip: a.tip, v: Object.assign(JSON.parse(JSON.stringify(a.v)), { nr: '', data: new Date().toISOString().slice(0, 10) }) }; } },
  actsterg: (d) => { if (UI.actSterg !== d.id) { UI.actSterg = d.id; toast('Apasă încă o dată „Șterge” ca să confirmi.'); return; } delete R.db.acte[d.id]; UI.actSterg = null; toast('Actul a fost șters.'); },
  actinchide: () => { UI.act = null; },
  actsalv: () => { actSave(); toast('Act salvat.'); },
  actfirma: () => { const cur = ACTE_DOC(); const f = {}; Object.keys(cur.v).filter((k) => k.startsWith('soc_') || ['inv_platforma', 'val_clientela', 'cost_retea'].includes(k)).forEach((k) => (f[k] = cur.v[k])); R.db.settings.firma = f; toast('Datele Societății' + (cur.v.inv_platforma ? ' și justificarea penalității' : '') + ' sunt salvate pentru toate actele.'); },
  actrowadd: () => { ACTE_DOC().v.rows.push(['', '', '']); },
  actrowdel: (d) => { ACTE_DOC().v.rows.splice(+d.id, 1); },
  actprint: () => { const g = actGoale(); if (g) toast(g + ' câmpuri necompletate apar marcate în document.'); setTimeout(() => window.print(), 50); return true; },
  actpdf: async () => { const cur = ACTE_DOC(); try { const b = await actPdfBlob(); dlBlob(actFile(cur, 'pdf'), b); actSave(); toast('PDF descărcat.'); } catch (e) { toast(e.message); } },
  actword: () => { const cur = ACTE_DOC(); const html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>' + esc(ACTE_TPL[cur.tip].nume) + '</title><style>@page{size:21cm 29.7cm;margin:2cm}' + ACT_CSS + '</style></head><body>' + acteHtml(cur.tip, cur.v, actMeta(cur)) + '</body></html>'; dlBlob(actFile(cur, 'doc'), new Blob(['﻿', html], { type: 'application/msword' })); actSave(); toast('Fișier Word descărcat.'); },
  acttrimite: async () => {
    const cur = ACTE_DOC(); const to = cur.v.p_email || ''; const T = ACTE_TPL[cur.tip];
    try {
      const b = await actPdfBlob(); const file = new File([b], actFile(cur, 'pdf'), { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: T.nume, text: T.nume + ' nr. ' + (cur.v.nr || '') + ' — vă rog să îl citiți și să îl semnați.' }); actSave('trimis'); toast('Trimis.'); return; }
      dlBlob(file.name, b); actSave('trimis');
      const subj = encodeURIComponent(T.nume + (cur.v.nr ? ' nr. ' + cur.v.nr : '')); const body = encodeURIComponent('Bună ziua,\n\nVă trimit ' + T.nume.toLowerCase() + ' pentru citire și semnare. Documentul PDF este atașat.\n\nCu stimă,\n' + (cur.v.soc_rep || '') + '\n' + (cur.v.soc_den || ''));
      window.location.href = 'mailto:' + encodeURIComponent(to) + '?subject=' + subj + '&body=' + body;
      toast('PDF descărcat; atașează-l în emailul deschis' + (to ? ' către ' + to : '') + '.');
    } catch (e) { if (e && e.name === 'AbortError') return; toast(e.message || 'Trimiterea nu a mers.'); }
  }
};
const dlBlob = (name, blob) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); };

/* =====================================================================
   SEMNAREA ÎN APLICAȚIE
   ciornă → (admin) trimis la semnat → (specialistul își completează datele, bifează citirea, semnează) semnat de colaborator
   → (admin contrasemnează) semnat de ambele părți → intră în registrul semnăturilor (contracte) + PDF în arhivă.
   Pe server (trigger protejeaza_docs, 19.10.2026): specialistul modifică doar câmpurile lui, doar cât actul e „la semnat”.
   Semnătura desenată = semnătură electronică simplă; jurnalul (cine, când, amprenta SHA-256 a textului) e tipărit în act.
   ===================================================================== */
const PARTE_KEYS = ['p_den', 'p_forma', 'p_sediu', 'p_orc', 'p_cui', 'p_rep', 'p_atestat', 'p_atestat_exp', 'p_iban', 'p_banca', 'p_email', 'p_tel', 'sal_nume', 'sal_cnp', 'sal_ci', 'sal_ci_emis', 'sal_dom'];
const PARTE_GRUPURI = ['Prestatorul', 'Cealaltă parte', 'Semnatarul', 'Salariatul', 'Dezvoltatorul'];
const STARE_ACT = { 'ciornă': ['ciornă', 'gri'], la_semnat: ['trimis la semnat', 'galben'], semnat_parte: ['semnat de colaborator — de contrasemnat', 'portocaliu'], semnat: ['semnat de ambele părți', 'verde'] };
const ACT_IN_REGISTRU = { servicii: 'prestari', neconcurenta: 'neconcurenta', gdpr: 'gdpr', cim: 'cim', tehnic: 'tehnic' };
/* câmpurile care nu sunt ale colaboratorului și apar goale în act (le completează adminul înainte de trimitere) */
function actLipsaSocietate(tip, v) {
  const T = ACTE_TPL[tip]; const lbl = {}; T.campuri.forEach((g) => g[1].forEach((f) => (lbl[f[0]] = f[1])));
  const keys = [...new Set((T.txt(v).match(/\{\{(\w+)\}\}/g) || []).map((m) => m.slice(2, -2)))];
  return keys.filter((k) => !PARTE_KEYS.includes(k) && !['nr', 'p_orc', 'p_rep', 'data_revisal'].includes(k) && (!String(v[k] || '').trim() || /^\[/.test(String(v[k])))).map((k) => lbl[k] || k);
}
const actMeta = (cur) => (cur && cur.id && D('acte')[cur.id]) || {};
const actStare = (cur) => actMeta(cur).stare || 'ciornă';

/* amprenta textului semnat (SHA-256 unde browserul o oferă; altfel FNV-1a, marcată ca atare) */
function actText(tip, v) { return ACTE_TPL[tip].txt(v).replace(/\{\{(\w+)\}\}/g, (m, k) => (v[k] == null ? '' : String(v[k]))); }
async function actHash(tip, v) {
  const t = actText(tip, v);
  try { if (window.crypto && crypto.subtle) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)); return 'SHA-256 ' + Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, '0')).join(''); } } catch (e) { /* context nesigur */ }
  let h = 0x811c9dc5; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return 'FNV-1a ' + h.toString(16);
}

/* semnăturile și jurnalul, desenate în act */
function actSemnaturiHtml(meta) {
  const s = (x) => x && x.img ? '<img class="semimg" src="' + x.img + '" alt="semnătură"><div class="semjur">' + esc(x.nume || '') + ' · ' + fmtT(x.la) + '</div>' : '';
  return { p: s(meta.sem_p), s: s(meta.sem_s) };
}
function actJurnalHtml(meta) {
  if (!meta.sem_p && !meta.sem_s) return '';
  const r = (lbl, x) => x ? '<tr><td>' + lbl + '</td><td>' + esc(x.nume || '') + '</td><td>' + fmtT(x.la) + '</td><td class="h">' + esc(x.hash || '') + '</td></tr>' : '';
  return '<h2>Jurnalul semnării electronice</h2><table class="ta jur"><thead><tr><th>Parte</th><th>Semnat de</th><th>Data și ora</th><th>Amprenta textului semnat</th></tr></thead><tbody>' + r('Cealaltă parte', meta.sem_p) + (meta.citit_la ? '<tr><td colspan="4">Confirmarea citirii integrale și a acceptării exprese a clauzelor neuzuale: ' + fmtT(meta.citit_la) + '</td></tr>' : '') + r('Societatea', meta.sem_s) + '</tbody></table><p class="nota">Semnătură electronică simplă, aplicată în platforma Societății, din contul personal al fiecărei părți. Aceeași amprentă la ambele semnături arată că a fost semnat același text.</p>';
}

/* panoul de semnătură (canvas) */
let SIG = null;
function sigInit() {
  const c = document.getElementById('sigpad'); if (!c || c.dataset.ok) return; c.dataset.ok = '1';
  const r = c.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1; c.width = r.width * dpr; c.height = r.height * dpr;
  const g = c.getContext('2d'); g.scale(dpr, dpr); g.lineWidth = 2.2; g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = '#0d2a5c';
  SIG = { c, g, gol: true }; let jos = false, lx = 0, ly = 0;
  const pt = (e) => { const b = c.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
  c.addEventListener('pointerdown', (e) => { jos = true; c.setPointerCapture(e.pointerId); [lx, ly] = pt(e); g.beginPath(); g.arc(lx, ly, 1, 0, 7); g.fill(); SIG.gol = false; e.preventDefault(); });
  c.addEventListener('pointermove', (e) => { if (!jos) return; const [x, y] = pt(e); g.beginPath(); g.moveTo(lx, ly); g.lineTo(x, y); g.stroke(); lx = x; ly = y; e.preventDefault(); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => c.addEventListener(ev, () => (jos = false)));
}
const sigHtml = (titlu) => '<div class="sigbox"><div class="small mut">' + esc(titlu) + '</div><canvas id="sigpad" class="sigpad" aria-label="Semnează aici cu degetul sau cu mouse-ul"></canvas><div class="btns">' + btn('sigclear', 'Șterge semnătura', { c: 'mic' }) + '</div></div>';
const sigImg = () => { if (!SIG || SIG.gol) return null; return SIG.c.toDataURL('image/png'); };

/* ---------- specialistul: actele primite ---------- */
function specActeView() {
  R.db.acte = R.db.acte || {};
  const mine = L('acte', (a) => a.dest_spec === UI.spec && a.stare && a.stare !== 'ciornă').sort((a, b) => (a.stare === 'la_semnat' ? -1 : 0) - (b.stare === 'la_semnat' ? -1 : 0) || (b.trimis_la || 0) - (a.trimis_la || 0));
  const cur = ACTE_DOC();
  if (!cur || cur.mod !== 'semnare') {
    return sec('Contractele mele', mine.length ? '<div class="stack">' + mine.map((a) => '<div class="tc"><div class="tch"><b>' + esc(ACTE_TPL[a.tip].nume) + '</b> ' + tag(STARE_ACT[a.stare][0], STARE_ACT[a.stare][1]) + '</div><div class="small mut">nr. ' + esc(a.v.nr || '—') + ' · trimis ' + fmtT(a.trimis_la) + '</div><div class="btns">' + btn('spactdesch', a.stare === 'la_semnat' ? 'Completează și semnează' : 'Vezi actul', { id: a.id, c: a.stare === 'la_semnat' ? 'pri' : '' }) + '</div></div>').join('') + '</div>' : '<p class="mut">Nu ai contracte de semnat.</p>') +
      '<p class="small mut">Primești comenzi după ce toate contractele sunt semnate de ambele părți și adminul îți validează contul.</p>';
  }
  const meta = actMeta(cur); const T = ACTE_TPL[cur.tip]; const deSemnat = meta.stare === 'la_semnat';
  const fld = (f) => { const [k, label, type, , opts] = f; const val = cur.v[k] == null ? '' : cur.v[k]; const dis = deSemnat ? '' : ' disabled';
    if (type === 'sel') return '<label>' + esc(label) + '<select data-af="' + k + '"' + dis + '>' + opts.map((o) => { const ov = Array.isArray(o) ? o[0] : o; return '<option value="' + esc(ov) + '"' + (String(val) === ov ? ' selected' : '') + '>' + esc(Array.isArray(o) ? o[1] : o) + '</option>'; }).join('') + '</select></label>';
    return '<label>' + esc(label) + '<input data-af="' + k + '" type="' + (type || 'text') + '" value="' + esc(val) + '"' + dis + '></label>'; };
  const grup = T.campuri.filter((g) => PARTE_GRUPURI.includes(g[0])).map((g) => '<details class="ag" open><summary>Datele tale</summary><div class="frm">' + g[1].filter((f) => PARTE_KEYS.includes(f[0])).map(fld).join('') + '</div></details>').join('');
  const art = (T.txt(cur.v).match(/ART\. (\d+)\. ACCEPTAREA EXPRESĂ/) || [])[1];
  const semn = deSemnat ? '<div class="card"><label class="chk"><input type="checkbox" id="actcitit"> Am citit integral actul, datele mele sunt corecte și accept în mod expres clauzele enumerate ' + (art ? 'la art. ' + art + ' ' : '') + '(art. 1.203 Cod civil).</label>' + sigHtml('Semnează mai jos, cu degetul sau cu mouse-ul') + btn('spactsemn', 'Semnez și trimit', { c: 'pri' }) + '</div>'
    : '<div class="card info">' + (meta.stare === 'semnat' ? 'Act semnat de ambele părți la ' + fmtT(meta.sem_s && meta.sem_s.la) + '.' : 'Ai semnat la ' + fmtT(meta.sem_p && meta.sem_p.la) + '. Așteaptă contrasemnătura Societății.') + '<div class="btns">' + btn('actpdf', 'Descarcă PDF', { c: 'mic' }) + '</div></div>';
  return '<div class="actbar">' + btn('spactinchide', '← Contractele mele', { c: 'mic' }) + '<b>' + esc(T.nume) + '</b> ' + tag(STARE_ACT[meta.stare || 'la_semnat'][0], STARE_ACT[meta.stare || 'la_semnat'][1]) + '</div>' +
    '<div class="acted"><div class="actform"><div id="actwarn"></div>' + grup + semn + '</div><div class="actprev" id="actprev">' + acteHtml(cur.tip, cur.v, meta) + '</div></div>';
}

/* ---------- panoul adminului din editor, după stare ---------- */
function actAdminPanou(cur) {
  const meta = actMeta(cur); const st = meta.stare || 'ciornă';
  const sp = L('specialisti', (s) => !s.sistem);
  if (st === 'ciornă') return '<div class="card"><b>Semnare în aplicație</b><p class="small mut">Colaboratorul își completează datele, bifează citirea și semnează din contul lui; apoi contrasemnezi aici.</p><label>Trimite către<select data-m="actdest"><option value="">— alege specialistul —</option>' + sp.map((s) => '<option value="' + s.id + '"' + (meta.dest_spec === s.id ? ' selected' : '') + '>' + esc(s.nume) + '</option>').join('') + '</select></label><div class="btns">' + btn('acttrimsem', 'Trimite la semnat', { c: 'pri mic' }) + '</div></div>';
  if (st === 'la_semnat') return '<div class="card war"><b>Trimis la semnat</b> către ' + esc(spName(meta.dest_spec)) + ' la ' + fmtT(meta.trimis_la) + '. Câmpurile sunt blocate cât timp așteaptă semnătura.<div class="btns">' + btn('actretrage', 'Retrage (înapoi la ciornă)', { c: 'mic' }) + '</div></div>';
  if (st === 'semnat_parte') return '<div class="card info"><b>Semnat de ' + esc((meta.sem_p || {}).nume || spName(meta.dest_spec)) + '</b> la ' + fmtT((meta.sem_p || {}).la) + '. Verifică datele completate și contrasemnează.' + sigHtml('Semnătura reprezentantului Societății') + '<div class="btns">' + btn('actcontra', 'Contrasemnează și finalizează', { c: 'pri' }) + btn('actretrage', 'Respinge (înapoi la ciornă)', { c: 'mic war' }) + '</div></div>';
  return '<div class="card ok"><b>Semnat de ambele părți</b> la ' + fmtT((meta.sem_s || {}).la) + '. Actul e în Registrul semnăturilor' + (meta.path ? ' și în arhivă' : '') + '.</div>';
}

Object.assign(ACTE_A, {
  sigclear: () => { if (SIG) { SIG.g.clearRect(0, 0, SIG.c.width, SIG.c.height); SIG.gol = true; } return true; },
  acttrimsem: () => {
    const cur = ACTE_DOC(); const dest = val('actdest'); if (!dest) { toast('Alege specialistul căruia îi trimiți actul.'); return; }
    const lipsa = actLipsaSocietate(cur.tip, cur.v); if (lipsa.length) { toast('Completează întâi ' + lipsa.length + ' câmpuri ale Societății / actului (' + lipsa.slice(0, 3).join(', ') + (lipsa.length > 3 ? '…' : '') + '); colaboratorul completează doar datele lui.'); return; }
    actSave(); const a = D('acte')[cur.id]; Object.assign(a, { dest_spec: dest, stare: 'la_semnat', trimis_la: now(), sem_p: null, sem_s: null, citit_la: null });
    ev('act.trimis', (UI.auth || {}).nume || 'admin', { k: 'specialist', id: dest }, { tip: cur.tip, nr: cur.v.nr }); toast('Trimis la semnat. ' + spName(dest) + ' îl vede la „Contracte”.');
  },
  actretrage: () => { const cur = ACTE_DOC(); const a = D('acte')[cur.id]; Object.assign(a, { stare: 'ciornă', sem_p: null, sem_s: null, citit_la: null }); toast('Actul e din nou ciornă.'); },
  actcontra: async () => {
    const cur = ACTE_DOC(); const a = D('acte')[cur.id]; const img = sigImg(); if (!img) { toast('Semnează în casetă înainte de finalizare.'); return; }
    const hash = await actHash(a.tip, a.v);
    a.sem_s = { img, nume: (cur.v.soc_rep || (UI.auth || {}).nume || 'Societatea'), la: now(), hash, uid: SYNC.user ? SYNC.user.id : null }; a.stare = 'semnat'; a.semnat_la = now(); cur.v = JSON.parse(JSON.stringify(a.v));
    const tipReg = ACT_IN_REGISTRU[a.tip]; const s = D('specialisti')[a.dest_spec];
    const c = { id: uid('ct'), spec: a.dest_spec, nume: (s && s.nume) || a.v.p_den || a.v.sal_nume, calitate: a.tip === 'cim' ? 'salariat' : a.v.calitate === 'asociat' ? 'asociat' : 'colaborator', tip: tipReg, semnat_la: now(), verificat_de: (UI.auth || {}).nume || 'admin', expira_la: now() + 5 * 365 * ZI, fisier: 'act ' + (a.v.nr || a.id), act: a.id };
    D('contracte')[c.id] = c; ev('act.semnat', (UI.auth || {}).nume || 'admin', { k: 'specialist', id: a.dest_spec }, { tip: a.tip, nr: a.v.nr });
    if (SYNC.on) { try { const b = await actPdfBlob(); const path = 'acte/' + a.id + '.pdf'; const { error } = await SYNC.sb.storage.from('documente').upload(path, b, { upsert: true, contentType: 'application/pdf' }); if (!error) { a.path = path; c.fisier = path; } } catch (e) { /* PDF-ul se poate descărca oricând din act */ } }
    toast('Act semnat de ambele părți și trecut în Registrul semnăturilor.');
  },
  actpachet: (d) => {
    const p = pers(d.id); const s = p.spec && D('specialisti')[p.spec]; if (!s) { toast('Semnarea în aplicație e pentru specialiștii cu cont.'); return; }
    const tips = (ACTE_PERS[p.cal] || ACTE_PERS.colaborator).filter((t) => t[0] !== 'cim');
    const f = firmaSalvata(); if (!f.soc_den || !f.soc_cui || !f.soc_sediu || !f.soc_rep || /\[DENUMIREA/.test(f.soc_den)) { toast('Salvează întâi datele Societății (Contracte → Acte de completat → orice act → Societatea → Salvează).'); return; }
    tips.forEach((t) => { UI.act = acteDinSpecialist(t[0], s); if (t[1]) UI.act.v.calitate = t[1]; actSave(); Object.assign(D('acte')[UI.act.id], { dest_spec: s.id, stare: 'la_semnat', trimis_la: now() }); });
    UI.act = null; ev('act.trimis', (UI.auth || {}).nume || 'admin', { k: 'specialist', id: s.id }, { n: tips.length }); toast(tips.length + ' acte trimise la semnat către ' + s.nume + '.');
  },
  spactdesch: (d) => { const a = D('acte')[d.id]; if (a) UI.act = { id: a.id, tip: a.tip, v: JSON.parse(JSON.stringify(a.v)), mod: 'semnare' }; UI.view = 'acte'; },
  spactinchide: () => { UI.act = null; },
  spactsemn: async () => {
    const cur = ACTE_DOC(); const a = D('acte')[cur.id]; if (!a || a.stare !== 'la_semnat') return;
    const lipsa = PARTE_KEYS.filter((k) => new RegExp('\\{\\{' + k + '\\}\\}').test(ACTE_TPL[cur.tip].txt(cur.v)) && !String(cur.v[k] || '').trim() && !['p_orc', 'p_rep'].includes(k));
    if (lipsa.length) { toast('Completează datele tale: ' + lipsa.length + ' câmpuri goale (marcate galben în act).'); return; }
    if (!($('#actcitit') || {}).checked) { toast('Bifează că ai citit actul și accepți clauzele.'); return; }
    const img = sigImg(); if (!img) { toast('Semnează în casetă.'); return; }
    PARTE_KEYS.forEach((k) => { if (cur.v[k] !== undefined) a.v[k] = cur.v[k]; });
    const hash = await actHash(a.tip, a.v);
    Object.assign(a, { citit_la: now(), sem_p: { img, nume: a.v.p_den || a.v.sal_nume || spName(UI.spec), la: now(), hash, uid: SYNC.user ? SYNC.user.id : null }, stare: 'semnat_parte', modificat_la: now() });
    notifyIn('admin', spName(UI.spec) + ' a semnat: ' + ACTE_TPL[a.tip].nume + (a.v.nr ? ' nr. ' + a.v.nr : '') + '. Contrasemnează în Contracte → Acte de completat.', null);
    cur.v = JSON.parse(JSON.stringify(a.v)); toast('Semnat și trimis. Primești actul final după contrasemnare.');
  }
});

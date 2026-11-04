/* Șabloanele de contract (capitolul Juridic). Text de lucru, nu opinie juridică: varianta finală o validează și o semnează avocatul partener.
   Temeiurile citate sunt verificate pe textele din legislatie/ (19.10.2026). Penalitatea: 100.000 lei. */
'use strict';

const PENALITATE = '100.000 lei (o sută de mii lei)';
const SOC = '[DENUMIREA SOCIETĂȚII] S.R.L., cu sediul în [__________], înregistrată la Registrul Comerțului sub nr. [__________], CUI [__________], reprezentată de [__________], administrator';

function tplNeconcurenta(s, cal) {
  const sem = s ? s.nume + (s.atestat && s.atestat !== '—' ? ', ' + s.atestat : '') + ', [CNP / CUI], cu domiciliul / sediul în [__________]' : '[NUMELE SEMNATARULUI], [CNP / CUI], cu domiciliul / sediul în [__________]';
  const calTxt = { colaborator: 'colaborator independent (Anexa A)', asociat: 'asociat și/sau administrator al Societății (Anexa B)', salariat: 'salariat al Societății (Anexa C)' }[cal] || '[calitatea: colaborator / asociat / salariat] (Anexa A / B / C)';
  return `ACORD DE CONFIDENȚIALITATE, NECONCURENȚĂ ȘI NEATRAGERE
nr. ____ din __.__.20__
ȘABLON DE LUCRU — se validează de avocatul partener înainte de semnare

PĂRȚILE
1. ${SOC} („Societatea”), și
2. ${sem} („Semnatarul”), în calitate de ${calTxt},
au convenit încheierea prezentului acord („Acordul”), în temeiul libertății contractuale (Cod civil art. 1.169) și cu obligația de bună-credință (art. 1.170).

PREAMBUL
Societatea a investit în dezvoltarea unei platforme de verificare a imobilelor și de obținere online a documentelor cadastrale, a bazei de date, a metodelor de lucru, a rețelei de colaboratori și a clientelei. Semnatarul are acces la aceste elemente. Scopul Acordului este protejarea lor, fără a-l împiedica pe Semnatar să își exercite profesia în forma ei obișnuită.

ART. 1. DEFINIȚII
1.1. „Activitatea protejată” — serviciile de verificare a imobilelor înainte de cumpărare sau vânzare și de obținere, explicare ori prelucrare a documentelor cadastrale și conexe (extrase de carte funciară, planuri cadastrale, rapoarte de proprietate, verificări, opinii, certificate), oferite consumatorilor sau profesioniștilor prin site-uri, aplicații, platforme online ori alte canale de vânzare la distanță, pe teritoriul României.
1.2. „Informații confidențiale” — orice informație la care Semnatarul are acces din cauza relației cu Societatea, indiferent de suport: baza de date, colecția de fișe, codul sursă, regulile și lanțurile de lucru, prețurile și tarifele, marjele, datele clienților și ale comenzilor, documentele clienților, lista colaboratorilor, cifrele de afaceri, planurile de dezvoltare, contractele, precum și orice informație marcată „confidențial” sau care, prin natura ei, nu este publică. Acestea sunt secrete comerciale ale Societății.
1.3. „Clienți” — persoanele care, în ultimele 24 de luni înainte de încălcare, au plasat o comandă, au cerut o ofertă sau au lăsat datele de contact pe platformele Societății.
1.4. „Colaboratori” — persoanele care, în ultimele 24 de luni, au prestat servicii pentru Societate sau prin platformele ei, ori au fost salariații ei.
1.5. „Durata relației” — perioada în care Semnatarul are calitatea de la preambul, plus orice prelungire.

ART. 2. CONFIDENȚIALITATE
2.1. Pe Durata relației și 5 ani după încetarea ei, Semnatarul nu divulgă, nu copiază, nu transmite și nu folosește Informațiile confidențiale în alt scop decât executarea sarcinilor primite de la Societate.
2.2. Obligația nu se aplică informațiilor care: (a) erau publice sau devin publice fără vina Semnatarului; (b) trebuie dezvăluite unei autorități în baza legii — caz în care Semnatarul anunță Societatea în scris, înainte, dacă legea permite, și dezvăluie strict ce i se cere.
2.3. Informația confidențială primită în cursul negocierilor rămâne protejată chiar dacă relația nu se încheie (Cod civil art. 1.184).
2.4. Semnatarul păstrează Informațiile confidențiale în siguranță, nu le copiază pe dispozitive sau conturi personale și anunță Societatea în 24 de ore despre orice pierdere sau acces neautorizat.

ART. 3. DATE PERSONALE
3.1. Pentru datele clienților, Semnatarul acționează ca persoană împuternicită de Societate: le prelucrează numai pentru comanda alocată și numai după instrucțiunile din platformă, asigură confidențialitatea și securitatea lor, nu le transmite altor persoane fără acordul scris al Societății, o anunță în 24 de ore despre orice încălcare a securității datelor și le șterge sau le returnează la finalizarea comenzii, cu excepția celor pe care legea îl obligă să le păstreze. [Temeiul: Regulamentul (UE) 2016/679, art. 28 — textul nu e încă în registrul legislativ; de verificat.]
3.2. Semnatarul nu contactează clientul în afara platformei și nu îi oferă servicii proprii pe baza datelor primite.

ART. 4. NECONCURENȚĂ
4.1. Pe Durata relației și ____ luni după încetarea ei [12–24, conform anexei], Semnatarul nu desfășoară Activitatea protejată, direct sau prin persoane interpuse, pe cont propriu sau pentru altcineva, și nu dobândește calitatea de asociat, acționar semnificativ, administrator, salariat, colaborator sau finanțator într-o entitate care desfășoară Activitatea protejată.
4.2. Rămâne liberă exercitarea profesiei Semnatarului în forma ei obișnuită (lucrări topografice, asistență juridică, audit energetic, expertiză, evaluare etc.) pentru clienții proprii, cu condiția să nu folosească Informațiile confidențiale și să nu se adreseze Clienților Societății. Acordul nu interzice în mod absolut exercitarea profesiei sau a specializării Semnatarului.
4.3. Regimul concret (durata după încetare, indemnizația, aria) este cel din anexa aplicabilă (A, B sau C).

ART. 5. NEATRAGERE
5.1. Pe Durata relației și ____ luni după încetarea ei, Semnatarul nu solicită, nu preia și nu deservește Clienții pentru Activitatea protejată și nu îi îndeamnă să înceteze relația cu Societatea.
5.2. În aceeași perioadă, Semnatarul nu atrage Colaboratorii pentru a presta Activitatea protejată în afara Societății.

ART. 6. PROPRIETATE INTELECTUALĂ ȘI BAZA DE DATE
6.1. Documentele, șabloanele, analizele, fișele, codul și datele create sau completate de Semnatar pentru Societate aparțin Societății; Semnatarul cedează Societății, exclusiv și fără limită de teritoriu sau durată, drepturile patrimoniale asupra lor, prețul fiind cuprins în remunerația convenită.
6.2. Semnatarul nu extrage și nu reutilizează conținutul bazei de date a Societății.

ART. 7. RESTITUIRE
7.1. La încetarea relației sau la cererea Societății, Semnatarul returnează ori șterge, în 5 zile lucrătoare, toate Informațiile confidențiale și confirmă în scris.

ART. 8. CLAUZĂ PENALĂ (Cod civil art. 1.538–1.541)
8.1. Pentru fiecare încălcare a art. 2, 3, 4, 5, 6 sau 7, Semnatarul datorează Societății o penalitate de ${PENALITATE}, exigibilă la simpla constatare a încălcării, fără a fi necesară dovada prejudiciului (art. 1.538 alin. 4).
8.2. O încălcare care continuă după notificarea scrisă a Societății constituie o nouă încălcare la fiecare 30 de zile.
8.3. Societatea poate cere, pe lângă penalitate, încetarea încălcării, inclusiv pe cale de urgență (Legea 11/1991 art. 7), și despăgubiri pentru partea din prejudiciu care depășește penalitatea.
8.4. Părțile declară că penalitatea reflectă prejudiciul previzibil la data semnării: investiția în platformă și date (aprox. ______ lei), valoarea anuală a clientelei (aprox. ______ lei) și costul refacerii rețelei de colaboratori (aprox. ______ lei). [Justificarea scrisă face mai greu de obținut reducerea pe art. 1.541 alin. (1) lit. b).]

ART. 9. DURATĂ
9.1. Acordul intră în vigoare la semnare și produce efecte pe Durata relației și pe termenele de după încetare prevăzute la art. 2, 4 și 5.

ART. 10. DISPOZIȚII FINALE
10.1. Notificările se fac în scris, la adresele de email din semnătură; se consideră primite în ziua lucrătoare următoare trimiterii.
10.2. Dacă o clauză este declarată nulă sau inaplicabilă, celelalte rămân valabile, iar părțile o înlocuiesc cu o clauză valabilă cât mai apropiată de scopul inițial.
10.3. Acordul se modifică numai prin act adițional scris. Semnatarul nu îl poate cesiona.
10.4. Legea aplicabilă este legea română. Litigiile se soluționează de instanțele competente de la sediul Societății.

ART. 11. ACCEPTAREA EXPRESĂ A CLAUZELOR NEUZUALE (Cod civil art. 1.203)
Semnatarul declară că a citit, a înțeles și acceptă în mod expres clauzele: art. 4 (neconcurență), art. 5 (neatragere), art. 6 (cesiunea drepturilor), art. 8 (clauză penală) și art. 10.4 (instanța competentă).
Semnătura Semnatarului pentru art. 11: ____________________

Societatea ____________________          Semnatarul ____________________
Email pentru notificări: ________          Email pentru notificări: ________
Data: __.__.20__

ANEXA A — COLABORATOR INDEPENDENT (PFA, II, SRL, profesie liberală)
A.1. Durata neconcurenței și a neatragerii după încetare: ____ luni [12–24].
A.2. Aria: România (Activitatea protejată se desfășoară online, pe tot teritoriul).
A.3. Fără indemnizație de neconcurență: contraprestația constă în accesul la comenzile platformei și în tarifele din contractul de colaborare.
A.4. Art. 4.2 se aplică integral: profesia rămâne liberă, inclusiv pentru alți clienți (păstrează caracterul independent al activității — Codul fiscal art. 7 pct. 3.2).

ANEXA B — ASOCIAT / ADMINISTRATOR
B.1. Pe durata calității de administrator se aplică de drept interdicția din Legea 31/1990 art. 197 alin. (2) (fără autorizarea adunării asociaților, nu poate fi administrator în societăți concurente și nu poate face același fel de comerț, sub sancțiunea revocării și a răspunderii pentru daune); pentru asociați, art. 79 și art. 82. Acordul completează aceste obligații.
B.2. Durata neconcurenței după pierderea calității: ____ luni [12–24].
B.3. Clauza se reproduce în actul constitutiv sau într-o hotărâre a adunării asociaților din __.__.20__.

ANEXA C — SALARIAT (Codul muncii art. 21–24, art. 26)
C.1. Activitățile interzise, concret: ______________________.
C.2. Terții în favoarea cărora este interzisă prestarea: ______________________.
C.3. Aria geografică: România.
C.4. Perioada de după încetarea contractului individual de muncă: ____ luni (maximum 24 — art. 22).
C.5. Indemnizația lunară de neconcurență: ______ lei, cel puțin 50% din media veniturilor salariale brute din ultimele 6 luni (art. 21 alin. 3), plătită lunar pe toată perioada. Fără indemnizație clauza nu produce efecte.
C.6. La încălcarea cu vinovăție: restituirea indemnizației și daune-interese (art. 24). Clauza penală de la art. 8 se aplică salariatului numai în măsura permisă de legislația muncii [de validat de avocat].
C.7. Clauza se include în contractul individual de muncă sau într-un act adițional (art. 21 alin. 2).
`;
}

function tplColaborare(s) {
  const who = s ? s.nume + (s.atestat && s.atestat !== '—' ? ' (' + s.atestat + ')' : '') : '[NUMELE PRESTATORULUI / FIRMA]';
  const anexa = s ? Object.keys(CH).filter((k) => CH[k]().some((t) => s.spec.includes(t.spec))).map((k) => { const ts = CH[k]().filter((t) => s.spec.includes(t.spec)); const sla = Math.max(...ts.map((t) => t.sla || 0)); const ter = ts.some((t) => t.teren) ? 'programare 24 h + livrare 48 h după vizită' : (sla >= 60 && sla % 60 === 0 ? sla / 60 + ' h' : sla + ' min') + ' de la acceptare'; return ' | ' + svName(k).padEnd(48) + ' | ' + ter.padEnd(38) + ' | ' + String(ts.reduce((x, t) => x + (t.tarif || 0), 0)).padStart(5) + ' lei [E] |'; }).join('\n') : ' | ______________________ | ______________________ | ______ lei |';
  return `CONTRACT DE COLABORARE (PRESTĂRI SERVICII)
nr. ____ din __.__.20__
ȘABLON DE LUCRU — se validează de avocatul partener înainte de semnare

PĂRȚILE
1. ${SOC} („Beneficiarul”), care operează un serviciu privat de analiză imobiliară; și
2. ${who}, [PFA / II / SRL / cabinet], CUI [__________], cu sediul în [__________], autorizat / atestat prin [__________], valabil până la __.__.20__ („Prestatorul”).

ART. 1. OBIECTUL
1.1. Prestatorul execută, la cererea Beneficiarului, serviciile din Anexa 1, pentru comenzile pe care Beneficiarul i le oferă prin platforma sa.
1.2. Contractul nu creează exclusivitate și nu garantează un volum minim de comenzi.

ART. 2. CARACTERUL INDEPENDENT AL ACTIVITĂȚII (Codul fiscal art. 7 pct. 3)
2.1. Prestatorul își organizează singur locul, modul și programul de lucru și poate refuza orice comandă oferită (3.1).
2.2. Prestatorul poate lucra pentru alți clienți, cu respectarea Acordului de confidențialitate și neconcurență (3.2).
2.3. Prestatorul își asumă riscurile activității, folosește propriile mijloace (echipamente, programe, deplasare) și poate lucra cu personal propriu, răspunzând pentru acesta (3.3, 3.4, 3.7).
2.4. Între părți nu există raport de muncă sau de subordonare; Prestatorul își plătește singur taxele și contribuțiile.

ART. 3. ALOCAREA COMENZILOR
3.1. Beneficiarul oferă o comandă prin platformă; Prestatorul o acceptă sau o refuză în termenul afișat. După acceptare, comanda e fermă.
3.2. Termenul de execuție curge de la acceptare și este cel din Anexa 1. Platforma afișează timpul rămas.
3.3. Dacă termenul este depășit, Beneficiarul poate realoca comanda altui prestator; partea neexecutată nu se plătește, iar depășirea se înregistrează în istoricul Prestatorului.

ART. 4. OBLIGAȚIILE PRESTATORULUI
4.1. Execută serviciile personal sau prin personalul său, cu diligența unui profesionist, conform legii profesiei și listei de verificare din Anexa 2.
4.2. Încarcă în platformă livrabilul complet (documente, fotografii, date) și completează câmpurile cerute; datele introduse trebuie să corespundă documentelor.
4.3. Anunță imediat, prin butonul „Problemă” din platformă, orice impediment (sistem indisponibil, date greșite, imobil neidentificabil).
4.4. Menține valabile autorizația sau atestatul și, dacă legea profesiei o cere, asigurarea de răspundere profesională; anunță în 24 de ore orice suspendare.
4.5. Nu dă concluzii juridice decât dacă este avocat și nu folosește termenul „evaluare” decât dacă este evaluator autorizat ANEVAR.
4.6. Nu contactează clientul în afara platformei și nu îi oferă servicii proprii pe baza datelor primite.

ART. 5. OBLIGAȚIILE BENEFICIARULUI
5.1. Pune la dispoziție datele comenzii necesare executării și acces la platformă.
5.2. Suportă taxele oficiale (tarife de cadastru, taxe locale) avansate de Prestator, pe bază de dovadă.
5.3. Plătește serviciile acceptate și livrate, conform art. 6.

ART. 6. PREȚ, FACTURARE, PLATĂ
6.1. Preț fix pe serviciu, conform Anexei 1, fără TVA dacă Prestatorul nu e plătitor.
6.2. Platforma generează lunar decontul serviciilor livrate și acceptate; Prestatorul emite factura în 5 zile lucrătoare de la primirea decontului.
6.3. Beneficiarul plătește în ____ zile de la primirea facturii, prin transfer bancar.
6.4. Prețurile din Anexa 1 se pot modifica numai prin act adițional; modificarea nu se aplică comenzilor deja acceptate.

ART. 7. CONFIDENȚIALITATE, DATE PERSONALE, NECONCURENȚĂ
7.1. Acordul de confidențialitate, neconcurență și neatragere nr. ____ face parte integrantă din prezentul contract; clauza penală din acel acord (${PENALITATE} pe încălcare) se aplică.
7.2. Livrabilele aparțin Beneficiarului și clientului, conform Acordului.

ART. 8. RĂSPUNDERE
8.1. Prestatorul răspunde pentru prejudiciile cauzate Beneficiarului sau clientului prin neexecutarea, executarea defectuoasă sau cu întârziere a serviciilor, în limita valorii de ______ ori prețul comenzii în cauză [E], cu excepția intenției sau a culpei grave, pentru care răspunde integral.
8.2. Pentru întârzierea nejustificată de peste 24 de ore după termen, Prestatorul datorează o penalitate de ____% din prețul serviciului pe zi, care se poate cumula cu executarea (Cod civil art. 1.539).
8.3. Niciuna dintre părți nu răspunde pentru neexecutarea cauzată de forță majoră (eveniment extern, imprevizibil, absolut invincibil și inevitabil — Cod civil art. 1.351), anunțată în 48 de ore.

ART. 9. DURATĂ ȘI ÎNCETARE
9.1. Contractul se încheie pe durată nedeterminată.
9.2. Oricare parte îl poate denunța cu un preaviz scris de 30 de zile; denunțarea nu afectează comenzile acceptate și aflate în lucru (Cod civil art. 1.276 alin. 2).
9.3. Pact comisoriu (Cod civil art. 1.553): contractul se reziliază de drept, prin simpla notificare scrisă, fără punere în întârziere și fără intervenția instanței, dacă Prestatorul: (a) își pierde autorizația sau atestatul; (b) încalcă Acordul de confidențialitate și neconcurență; (c) depășește termenul la 3 comenzi în 30 de zile; (d) contactează clientul în afara platformei; (e) introduce în platformă date false.
9.4. La încetare, Prestatorul finalizează sau predă comenzile în lucru și returnează datele, conform Acordului.

ART. 10. DISPOZIȚII FINALE
10.1. Înregistrările platformei (oferte, acceptări, termene, documente încărcate, livrări) fac dovada între părți, până la proba contrară.
10.2. Notificările se fac în scris, la adresele de email de mai jos.
10.3. Prestatorul nu poate cesiona contractul și nu poate subcontracta fără acordul scris al Beneficiarului.
10.4. Clauza nulă nu afectează restul contractului; părțile o înlocuiesc cu una valabilă, apropiată de scopul inițial.
10.5. Legea română; instanțele competente de la sediul Beneficiarului.

ART. 11. ACCEPTAREA EXPRESĂ A CLAUZELOR NEUZUALE (Cod civil art. 1.203)
Prestatorul acceptă în mod expres clauzele: art. 3.3 (realocarea), art. 8.1 (limitarea răspunderii), art. 8.2 (penalitate de întârziere), art. 9.3 (pact comisoriu) și art. 10.5 (instanța competentă).
Semnătura Prestatorului pentru art. 11: ____________________

Beneficiarul ____________________          Prestatorul ____________________
Email pentru notificări: ________          Email pentru notificări: ________
Data: __.__.20__

ANEXA 1 — SERVICII, TERMENE ȘI PREȚURI (se completează pentru fiecare prestator)
 | Serviciu                                         | Termen de execuție                     |  Preț fix     |
${anexa}

ANEXA 2 — LISTA DE VERIFICARE PE SERVICIU
Lista de bife, câmpuri și documente cerute în platformă pentru fiecare serviciu (versiunea din data semnării).
`;
}

function tplTehnic(nume) {
  const who = nume || '[NUMELE COLABORATORULUI TEHNIC / FIRMA]';
  return `CONTRACT DE DEZVOLTARE SOFTWARE PE PROIECT, CU CESIUNEA DREPTURILOR
nr. ____ din __.__.20__
ȘABLON DE LUCRU — se validează de avocatul partener înainte de semnare
[Temeiul cesiunii drepturilor de autor: Legea 8/1996 — textul nu e încă în registrul legislativ; de verificat înainte de semnare.]

PĂRȚILE
1. ${SOC} („Beneficiarul”); și
2. ${who}, [PFA / SRL], CUI [__________], cu sediul în [__________] („Dezvoltatorul”).

ART. 1. OBIECTUL
1.1. Dezvoltatorul realizează, pentru platforma Beneficiarului, proiectele descrise în comenzile de lucru (Anexa 1): funcționalități, integrări, corecturi, design.
1.2. Fiecare comandă de lucru precizează: livrabilele, criteriile de acceptare, termenul, prețul și persoana de contact.

ART. 2. CARACTERUL INDEPENDENT (Codul fiscal art. 7 pct. 3)
2.1. Dezvoltatorul își alege locul, programul și mijloacele de lucru, poate lucra pentru alți clienți (cu respectarea Acordului de confidențialitate și neconcurență) și își asumă riscurile activității.

ART. 3. LIVRARE ȘI ACCEPTARE
3.1. Livrarea se face în depozitul de cod al Beneficiarului (GitHub sau alt depozit indicat), cu codul sursă complet, instrucțiunile de instalare și documentația minimă.
3.2. Beneficiarul verifică livrabilul în ____ zile lucrătoare; dacă nu îndeplinește criteriile de acceptare, Dezvoltatorul îl corectează fără cost în ____ zile.
3.3. Livrabilul se consideră acceptat la confirmarea scrisă (inclusiv email) sau la expirarea termenului de verificare fără obiecții.

ART. 4. PREȚ ȘI PLATĂ
4.1. Prețul fiecărei comenzi de lucru este fix, cu excepția cazului în care comanda prevede plata pe oră, cu plafon.
4.2. Factura se emite după acceptare; plata în ____ zile.

ART. 5. DREPTURI ASUPRA CODULUI ȘI A REZULTATELOR
5.1. Dezvoltatorul cedează Beneficiarului, exclusiv, pentru tot teritoriul și pe toată durata de protecție, drepturile patrimoniale de autor asupra codului sursă și obiect, documentației, designului și oricăror rezultate create în executarea contractului, inclusiv dreptul de reproducere, distribuire, modificare, adaptare, traducere și sublicențiere. Prețul cesiunii este inclus în prețul comenzii.
5.2. Cesiunea operează la plata livrabilului; până atunci Beneficiarul are licență de folosire pentru testare.
5.3. Componentele open-source se folosesc numai cu licențe compatibile cu exploatarea comercială și sunt enumerate în documentație. Componentele preexistente ale Dezvoltatorului se enumeră în comanda de lucru; pentru ele Dezvoltatorul acordă o licență neexclusivă, perpetuă și gratuită.
5.4. Dezvoltatorul garantează că livrabilele nu încalcă drepturile terților și despăgubește Beneficiarul pentru orice pretenție în acest sens.

ART. 6. ACCES, DATE ȘI SECURITATE
6.1. Dezvoltatorul primește acces numai la mediile de test și la datele strict necesare; accesul la datele reale ale clienților se acordă doar cu acord scris și numai pe durata necesară.
6.2. Nu copiază date reale în afara infrastructurii Beneficiarului, nu păstrează chei, parole sau token-uri în cod ori în depozite publice și anunță în 24 de ore orice incident de securitate.
6.3. La încetare, predă toate accesele și credențialele și șterge copiile locale; confirmă în scris.
6.4. Confidențialitatea, neconcurența și clauza penală (${PENALITATE} pe încălcare) sunt cele din Acordul de confidențialitate, neconcurență și neatragere nr. ____, parte integrantă din contract.

ART. 7. GARANȚIE
7.1. Dezvoltatorul corectează gratuit, timp de ____ luni de la acceptare, defectele livrabilelor care nu țin de modificări făcute de alții.

ART. 8. RĂSPUNDERE
8.1. Răspunderea Dezvoltatorului e limitată la valoarea comenzii de lucru în cauză, cu excepția intenției, a culpei grave, a încălcării confidențialității sau a drepturilor terților, pentru care răspunde integral.
8.2. Pentru întârzierea livrării, Dezvoltatorul datorează ____% din prețul comenzii pe zi, cumulabil cu executarea (Cod civil art. 1.539).
8.3. Forța majoră (Cod civil art. 1.351) exonerează, dacă e anunțată în 48 de ore.

ART. 9. DURATĂ ȘI ÎNCETARE
9.1. Durată nedeterminată; denunțare cu preaviz de 30 de zile, fără efect asupra comenzilor în curs (Cod civil art. 1.276 alin. 2).
9.2. Pact comisoriu (Cod civil art. 1.553): reziliere de drept, prin notificare scrisă, fără punere în întârziere, dacă Dezvoltatorul încalcă art. 6 sau Acordul de confidențialitate.
9.3. La încetare, Dezvoltatorul predă codul, documentația și accesele, chiar dacă există litigii privind plata.

ART. 10. DISPOZIȚII FINALE
10.1. Notificări prin email, la adresele din semnătură. Clauza nulă nu afectează restul. Modificări doar prin act adițional. Legea română; instanțele de la sediul Beneficiarului.

ART. 11. ACCEPTAREA EXPRESĂ A CLAUZELOR NEUZUALE (Cod civil art. 1.203)
Dezvoltatorul acceptă expres art. 5 (cesiunea drepturilor), art. 8 (limitarea răspunderii și penalitatea de întârziere), art. 9.2 (pact comisoriu) și art. 10.1 (instanța competentă).
Semnătura Dezvoltatorului pentru art. 11: ____________________

Beneficiarul ____________________          Dezvoltatorul ____________________
Data: __.__.20__

ANEXA 1 — COMANDĂ DE LUCRU nr. ___ (câte una pe proiect)
Proiect: ______________   Livrabile: ______________   Criterii de acceptare: ______________
Termen: __.__.20__   Preț: ______ lei (fix / pe oră, plafon ______)   Contact: ______________
Componente preexistente / open-source folosite: ______________
`;
}

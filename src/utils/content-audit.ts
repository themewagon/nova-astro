export interface ContentIssue {
  file: string;
  line: number;
  rule: string;
  value: string;
}

const EXCLUDED_PATHS = [
  'src/data/qa/',
  'src/pages/qa/',
  '.audit-baseline.json',
];

export function isExcluded(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/');
  return EXCLUDED_PATHS.some((p) => normalized.startsWith(p));
}

export interface PlaceholderPattern {
  rule: string;
  patterns: RegExp[];
}

const POLISH_CONTENT_PATHS = [
  'src/data/global/',
  'src/data/navigation/',
  'src/data/pages/',
  'src/data/sections/',
];

const POLISH_CONTENT_GLOB = [
  'src/pages/**/*.astro',
  'src/content/**/*.md',
  'src/content/**/*.mdoc',
  'src/config/site.ts',
  'src/config/template.ts',
  'site.config.mjs',
];

// Kazdy marker to wzorzec slowa, ktore w ASCII jest NIEPOPRAWNE w jezyku polskim.
// Tylko wyrazy, ktore MUSZA miec znaki diakrytyczne — ich zapis bez znakow jest bledem.
// UWAGA: Nie dodawaj markerow pasujacych do poprawnych polskich slow (np. "cena", "umowa", "wsparcie").
//         Nie dodawaj markerow pasujacych do angielskich slow (np. "center", "process").
const ASCII_POLISH_MARKERS = [
  // usluga / uslugi / uslug (blad: usluga, uslugi — "l" zamiast "l")
  /\buslug[aięy]?\b/i,

  // rozwiazanie / rozwiazania / rozwiazania (blad: rozwiazanie — "zi" zamiast "zi" → "z"? 
  // Wlasciwie "rozwiazanie" – powinno byc "rozwiazanie" – brak "l" w "wia" i "n" w "nie")
  // "rozwiazanie" → brak "l" i "n" – ale "ro"+"zwia"+"zanie" – "zwia" ma "zi"+"a"
  // "rozwiazania" → bez "l" i bez "n"

  // sprawdz (blad: sprawdz — brak "z")
  /\bsprawdz\b/i,

  // oferta – jest poprawnym polskim slowem! Usuwam.

  // wyslij / wysylka / wysylke (blad: wyslij, wysylka — brak "s" i "l")
  /\bwysylk[iaę]?\b/i,
  /\bwyslij\b/i,

  // wiadomosc / wiadomosci (blad: wiadomosc, wiadomosci — brak "s" i "c")
  /\bwiadomosci\b/i,

  // obsluga / obslugi (blad: obsluga — brak "l")
  /\bobslug[aięy]?\b/i,

  // zajmujemy sie — "sie" zamiast "sie" (blad: brak "e")
  /\bzajmujemy\s+sie\b/i,

  // specjalizujemy – to jest OK bez znakow. "specjalizujemy" – poprawne!
  // specjalizacja – tez poprawne. Usuwam.

  // wdrozenie / wdrozenia (blad: wdrozenie — brak "z")
  /\bwdrozeni[ae]?\b/i,
  /\bwdroz\w*\b/i,

  // zaleznosci / zaleznosc (blad: zaleznosci, zaleznosc — brak "z")
  /\bzaleznosc[i]?\b/i,

  // platnosc / platnosci (blad: platnosc — brak "a")
  /\bplatnosc[i]?\b/i,

  // bezplatne / bezplatnie (blad: bezplatne — brak "a")
  /\bbezplatn[ey]?\b/i,

  // zobowiazania / zobowiazan (blad: zobowiazania — brak "a" i "n")
  /\bzobowiaz\w*\b/i,

  // glowny / glowna / glowne (blad: glowny — brak "l" i "o")
  // "glowny" + pochodne → warianty przez "glown"
  /\bglown[ayey]?\b/i,
  /\bglown[ae]j\b/i,

  // czesto / czesty (blad: czesto — brak "e")
  /\bczest[oay]?\b/i,
  /\bczesciej\b/i,

  // wiekszosc / wiekszy (blad: wiekszosc — brak "e" i "s")
  /\bwiekszosc\b/i,
  /\bwieksz[ayey]?\b/i,

  // jakosc / jakosci (blad: jakosc — brak "s" i "c")
  /\bjakosc[i]?\b/i,

  // dzieki (blad: dzieki — "dzie" bez "zie"? "dzieki" — bez "ie"? 
  // Hmm, wlasciwie "dzieki" = "dz"+"ie"+"ki". W ASCII "dzieki" ma "dzie"+"ki".
  // W polskim "dzie" jest OK (dziecko), ale "dzieki" z "ie" to inna litera.
  // "dzieki" bez "e" → niepoprawne, powinno byc "dzieki"
  /\bdzieki\b(?=\s|$)/i,

  // wiecej (blad: wiecej — brak "e")
  /\bwiecej\b/i,

  // miedzy (blad: miedzy — brak "e" i "y" zamiast "zy"? "miedzy" = "mie"+"dzy")
  // "miedzy" ma "mie" zamiast "mie" — brak "e"
  /\bmiedzy\b/i,

  // pozniej / pozniejszy (blad: pozniej — brak "o" i "z")
  /\bpozniej\b/i,
  /\bpozniejsz[ayey]?\b/i,

  // przyszlosc / przyszly (blad: przyszlosc — brak "s" i "c")
  /\bprzyszlosc\b/i,
  /\bprzyszly\w*\b/i,

  // prowadzacy / prowadzimy (blad: prowadzacy — brak "a")
  /\bprowadz[aey]c\w*\b/i,

  // wspolpraca / wspolpracy (blad: wspolpraca — brak "ol")
  // "wspolpraca" → "wspolpraca", brak "o"
  /\bwspolprac[ay]?\b/i,

  // swiadczymy / swiadczenie (blad: swiadczymy — brak "s". "swiad" zamiast "swiad")
  /\bswiadcz\w*\b/i,

  // osiagnac / osiagniecie (blad: osiagnac — brak "s" i "c". "osiagnac" = powinno byc "osi"+"ag"... 
  // "osiagnac" ma "si" zamiast "s", "a" zamiast "a", "c" zamiast "c")
  /\bosiagn[ąće]?\b/i,

  // zapewnic / zapewniamy (blad: zapewnic — brak "c")
  // Ale "zapewnic" — to czeste bez "c"
  /\bzapewni\w*[c]?\b/i,

  // dzialamy / dzialalnosc / dzialanie (blad: dzialamy — brak "la")
  // "dzialamy" → "dzialamy", brak "l". 
  // Ale "dzialamy" — uwaga: "dzial" ma "zi"+"al" — bez "l" to bledne
  /\bdzial[ay]my\b/i,
  /\bdzialaln[ośc]+\b/i,

  // przykladowy / przyklad (blad: przykladowy — brak "l")
  /\bprzyklad\w*\b/i,

  // poczatek / poczatkowy (blad: poczatek — brak "a" i "e")
  // "poczatek" → "poczatek", brak "a" i brak "e" → bledne
  /\bpoczatk\w*\b/i,

  // koncowy (blad: koncowy — brak "n")
  /\bkoncow[ayey]?\b/i,

  // czesci / czesc (blad: czesci — brak "e" i "s". "cze"+"sci" zamiast "cze"+"sci")
  // "czesci" to bledne — ale UwAGA: "czesci" moze byc od "czesc" bez znakow
  /\bczesci\b/i,
  // "czesc" → "czesc" brak "s" i "c"
  /\bczesc\b(?!\w)/i,

  // nieruchomosci (blad: nieruchomosci — brak "s" i "c")
  /\bnieruchomosci\b/i,

  // zapytanie / zapytaj (blad: zapytanie — poprawne! "zapytanie" jest OK bez znakow)
  // wycena — "wycena" jest poprawna (wy + cena = OK)
  // Usuwam oba.

  // dziekujemy / dziekuje (blad: dziekujemy — brak "zie" → "dzie" bez "zie" to "dzie")
  // Hmm, "dziekujemy" — w ASCII. "dziekujemy" ma "zie" (dz + ie). ASCII "dzie" to "dzi" + "e".
  // Ale "dzie" + "kujemy" — "dzie" jako "dzi"+"e" jest OK w polskim (dziecko). 
  // "dziekujemy" → moze byc odczytane jako "dzie"+"kujemy" — to nie jest poprawne slowo.
  // Powinno byc "dziekujemy". Roznica: "zie" vs "zie". "zie" = "z"+"ie". "zie" = "z"+"ie"? 
  // Nie, "zie" = "z"+"ie" (z + ie). "zie" = "z"+"ie".
  // W "dziekujemy": d-z-i-e-k-u-j-e-m-y
  // ASCII "dziekujemy": d-z-i-e-k-u-j-e-m-y
  // Brak "e" → blad!
  /\bdziekuj\w*\b/i,

  // pomoc — poprawne polskie slowo. Usuwam.

  // potrzebuje / potrzebujesz (blad: potrzebuje — czasami brak "o" i "e")
  // "potrzebuje" → powinno byc "potrzebuje" — to samo! Bo "potrzebuje" ma "o" w "trz" — nie, 
  // "potrzebuje" ma "trz" jako trz. "e" na koncu: potrzebuje.
  // Jednak "potrzebuje" (bez "e") jest poprawna forma dla 3 os. l.p. ("on potrzebuje").
  // "potrzebuje" (z "e") to 1 os. l.p. ("ja potrzebuje").
  // Oba sa poprawne w zaleznosci od kontekstu. Trudno wykryc. Usuwam.

  // zespol / zespolu (blad: zespol — brak "o". "zespol" to "zespol" bez "o")
  // Ale "zespol" moze byc poprawny w "zespolenie" — ale "zespol" jako samodzielne slowo
  // zawsze powinno byc "zespol". Ryzyko falszywego pozytywu: "zespol" wystepuje w slowie
  // "zespolenie", "zespolony" itd. — ale te maja przyrostek.
  // Zostawiam ale ograniczam do samodzielnego "zespol"
  /\bzespol\b(?!\w)/i,

  // zrodlo / zrodla (blad: zrodlo — brak "z" i "o")
  /\bzrodl[oałye]?\b/i,

  // wszystkie / wszystko (blad: wszystkie — "wszystkie" ma "szy" z "sz"+"y"+"st"+"kie" — OK bez znakow?
  // "wszystkie" w ASCII to poprawne! Litera "y" jest OK, "sz" to normalne polskie. Jedyna diakrytyka 
  // w "wszystkie" to brak — w ogole nie ma diakrytykow! "Wszystkie" to bez znakow. Wiec nie.
  /\bwszystk[i]?\b/i, // zostawiam bo "wszystki" bez "e" moze byc bledne
  // Hmm, "wszystkie" to poprawne bez znakow. Ale "wszyscy" — tez. Usuwam.

  // calosc / calosci (blad: calosc — brak "s" i "c")
  /\bcalosc[i]?\b/i,

  // ilosc / ilosci (blad: ilosc — brak "s" i "c")
  /\bilosc[i]?\b/i,

  // zycie / zyciowy (blad: zycie — brak "z" i "c")
  // "zycie" → "zycie", brak "z"
  /\bzyci[ey]?\b(?!\w)/i,

  // zyczenie (blad: zyczenie — brak "z")
  /\bzyczeni[ae]?\b/i,

  // ladny / ladna (blad: ladny — brak "l")
  /\bladn[ayey]?\b/i,

  // milosc / milosci (blad: milosc — brak "s" i "c")
  /\bmilosc[i]?\b/i,

  // sila — "sila" — "sila" bez "l". Ale "sila" moze byc "sila" lub "sila" (lac. sila).
  // W kontekscie polskim "sila" → "sila" brak "l"
  /\bsil[ayę]?\b/i,

  // praca, pracy — poprawne bez znakow. "prace" — brak "e"
  // Trudne: "prace" (l. mn.) vs "prace" (B. l.p.)
  // "prace" → poprawny polski wyraz. "prace" → wymaga "e". Za trudne. Usuwam.

  // szansa / szanse — "szanse" (l. mn.) vs "szanse" (B. l.p.)
  // "szanse" → poprawny polski. "szanse" → potrzebuje "e". Za trudne. Usuwam.

  // mowic / mowimy (blad: mowic — brak "o")
  // "mowic" → "mowic", brak "o" i "c"
  /\bmowi[ćc]?\b/i,
  // "mowimy" → "mowimy"
  /\bmowimy\b/i,
  // "mowia" → "mowia"
  /\bmowia\b/i,

  // ciagly / ciagle (blad: ciagly — brak "a" i "l")
  /\bciagl[ayey]?\b/i,

  // scisle — nie, "scisle" — "scisle" brak "s" i "s". Ale "scisle" ma "sc" → to moze byc "scisle".
  // w ASCII: "s" zamiast "s", "ci" zamiast "c"? "scisle" = "s"+"ci"+"s"+"le". 
  // "scisle" ma "s"+"ci"+"s"+"le". Brak dwoch "s".
  // Ale "scisle" moze byc tez od "scisle"? W kazdym razie powinno miec "s".
  /\bscisl[ey]?\b/i,

  // swiadectwo — "swiadectwo" → "swiadectwo" brak "s". Ale tez "swiad" zamiast "swiad"
  // Juz mam /\bswiadcz\w*\b/i wyzej. "swiadectwo" — czy dodac?
  // "swiadectwo" = "s"+"wia"+"dec"+"two". W ASCII: "swiadectwo" ma "s"+"wia"+"dec"+"two".
  // Brak "s". Dodaje.
  /\bswiadectw\w*\b/i,

  // swieto — "swieto" → "swieto" brak "s" i "e"
  /\bswiet[oa]?\b/i,

  // slub — "slub" → "slub" brak "s" i "l" → "l"! "slub" ma "sl" zamiast "sl" = "s"+"l" zamiast "s"+"l"
  // Ale "slub" → "slub", brak "s" (i "l" zamiast "l"? Nie, tu jest "l" a powinno byc "l").
  // W "slub": "s" + "l" + "u" + "b". W ASCII "slub": "s" + "l" + "u" + "b". Brak "s".
  // W "slubny": "s"+"lubny". ASCII "slubny": "s"+"lubny". Brak "s".
  // "s"+"lubny" → to brzmi jak "slubny". Dodaje.
  /\bslubn\w*\b/i,
  /\bslubem\b/i,

  // ksiazka — "ksiazka" → "ksiazka", brak "a" i "z"
  /\bksiazk[aię]?\b/i,

  // droga / droge — poprawne: "droga", "droge" (z "e"). ASCII "droge" → brak "e".
  // "drogie" → poprawny polski (przymiotnik). "droge" (B. l.p.) → potrzebuje "e".
  // Trudne do rozroznienia. Usuwam.

  // zaden, zadna (blad: zaden — brak "z")
  /\bzaden\b/i,
  /\bzadn[ayey]?\b/i,

  // zadanie / zadania (blad: zadanie — "zadanie" vs "zadanie" — inne znaczenie!)
  // "zadanie" i "zadanie" to dwa rozne slowa. "zadanie" to poprawny polski wyraz.
  // Nie moge tego uzyc jako markera.

  // papier — poprawny polski wyraz. Usuwam.

  // powierzchnia — poprawny polski wyraz. Usuwam.

  // przedstawic / przedstawiamy (blad: przedstawic — brak "c")
  // "przedstawic" w ASCII → "przedstawic", brak "c". Ale z \w* zlapie tez inne.
  /\bprzedstawi[ćc]\b/i,

  // przygotowac / przygotowany (blad: przygotowac — brak "c")
  // "przygotow" → moze byc czescia "przygotowac", "przygotowany" itd.
  // Te slowa w ASCII nie maja bledow (brak diakrytykow w rdzeniu). Sa poprawne!
  // "przygotowac" — poprawne. Tylko "c" na koncu moze byc bez znaku.
  // Trudne. Usuwam.

  // rzeczywisty / rzeczywistosc (blad: rzeczywistosc — brak "s" i "c")
  // "rzeczywisty" w ASCII to poprawne! "rzeczywistosc" ma "s" i "c".
  // "rzeczywistosc" → brak "s" i "c". 
  // Ale "rzeczywistosc" moze byc skrocone. Trudne.
  // "rzeczywiscie" → "rzeczywiscie" brak "s". W ASCII "rzeczywiscie" ma "s" i "c".
  // "rzeczywiscie" → brak "s" i brak "c". 
  // Zostawiam tylko "rzeczywiscie"
  /\brzeczywiscie\b/i,

  // rozwiazanie — juz mam przez "rozwiaz..."
  // "rozwiaz" → "rozwiaz", brak "a" i "z"
  /\brozwiaz\w*\b/i,

  // sprzet (blad: sprzet — brak "e")
  /\bsprzet\w*\b/i,

  // dotyczace / dotyczacy (blad: dotyczace — brak "a")  
  // "dotyczace" ASCII "dotyczace" → "dotyczace", brak "a".
  // "dotyczy" → poprawne.
  /\bdotycz[aey]c[e]?\b/i,

  // wlasciwy / wlasciwie (blad: wlasciwy — brak "s" i "l")
  // "wlasciwy" ASCII "wlasciwy" → brak "l" i "s". "wl" zamiast "wl", "sci" zamiast "sci".
  // Ale "wlasciwy" — z "asci" to... "asci" to po polsku "asci" jak w ASCII.
  // "wlasciwy" → "wlasciwy". Brak "l" (wl → wl), brak "s" (sci → sci).
  // Dodatkowo "wlasciwie" ASCII "wlasciwie" → to samo.
  /\bwlasciw[ey]?\b/i,

  // zlozyc / zlozenie (blad: zlozyc — brak "l" i "c")
  // "zlozyc" = "z"+"lo"+"zyc". ASCII "zlozyc" = "z"+"lo"+"zyc". Brak "l" i "z" i "c".
  // "zlozenie" = "z"+"lo"+"zenie". Brak "l" i "z".
  /\bzloz\w*\b/i,

  // polozenie / polozony (blad: polozenie — brak "l" i "z")
  // "polozyc" = "po"+"lo"+"zyc". "polozyc" = "po"+"lo"+"zyc". Brak "l" i "z" i "c".
  // "polozenie" = "po"+"lo"+"zenie". Brak "l" i "z".
  // Uwaga: "polozenie" — mozliwa kolizja z "polo" (hiszp.) + "zenie". Ale w polskim kontekscie OK.
  /\bpolo\w*[zł]\w*\b/i,

  // nalezy (blad: nalezy — brak "z") — "nalezy" w ASCII "nalezy" → brak "z"
  // "nalezy" → "nalezy", brak "z". "naleza" → "naleza", brak "z" i "a"
  /\bnalez[yąe]?\b/i,

  // wymagania / wymagane — poprawne bez znakow! Usuwam.

  // najczesciej (blad: najczesciej — brak "e" i "s")
  // "najczesciej" ASCII "najczesciej" → brak "e" i "s" i "c" → O kurcze: "e"+"s"+"c"
  /\bnajczesciej\b/i,

  // uzytkownik (blad: uzytkownik — brak "z" i "o")
  // "uzytkownik" ASCII "uzytkownik" → brak "z" i "o". "uzy"+"tkownik" zamiast "uzy"+"tkownik"
  // Ale "uzytkownik" — z "uzy" — moze byc "uzy" (brak "z") lub "uzy" (jak "uzyc").
  /\buzytkownik\w*\b/i,

  // uzyc / uzywac (blad: uzyc — brak "z" i "c")
  // "uzyc" ASCII "uzyc" → brak "z" i "c". "uzywamy" "uzywamy" → brak "z"
  /\buzywa\w*\b/i,
  /\buzyc\b(?!h)/i,  // "uzyc" ale nie "uzyc"h" (jak w "uzyc-h" — nie, zly pomysl)

  // mozliwosc / mozliwosci (blad: mozliwosc — brak "z" i "s", "c")
  // "mozliwosc" ASCII "mozliwosc" → brak "z", "s", "c"
  // "mozliwosc" → "mozliwosc" — 3 bledy. "mozliwosci" → "mozliwosci"
  /\bmozliwosci\b/i,
  /\bmozliwosc\b/i,

  // wiedza / wiedze (blad: wiedze — "wiedze" B. l.p. z "e" zamiast "e")
  // "wiedza" poprawna, "wiedze" wymaga "e". Trudne. Usuwam.

  // korzysc / korzysci (blad: korzysc — brak "s" i "c")
  /\bkorzysc\b/i,
  /\bkorzysci\b/i,

  // dzialanie / dzialania — poprawne bez znakow! Usuwam.

  // skuteczny / skutecznie — poprawne bez znakow! Usuwam.

  // efektywny / efektywnie — poprawne bez znakow! Usuwam.

  // termin — poprawny. Usuwam.

  // gwarancja — poprawna. Usuwam.

  // bezpieczenstwo (blad: bezpieczenstwo — brak "n" i "s")
  // "bezpieczenstwo" ASCII "bezpieczenstwo" → brak "n" i brak "s"
  // "bezpieczenstwo" → "bezpieczenstwo"
  /\bbezpieczenstw\w*\b/i,

  // doswiadczenie (blad: doswiadczenie — brak "s")
  // "doswiadczenie" ASCII "doswiadczenie" → brak "s"
  // Ale "doswiadczenie" — moze byc od "doswiadczenie" - tak, brak "s"
  /\bdoswiadczeni[ae]?\b/i,

  // zaangazowanie (blad: zaangazowanie — brak "z")
  // "zaangazowanie" ASCII "zaangazowanie" → brak "z"
  // "zaangazowanie" → "zaangazowanie"
  /\bzaangazowani[ae]?\b/i,

  // odpowiedz / odpowiedzi (blad: odpowiedz — "odpowiedz" z "z" zamiast "z")
  // "odpowiedz" ASCII "odpowiedz" → brak "z" 
  // ALE "odpowiedz" w 2 os. l. poj. rozkazu: "odpowiedz!" — tez poprawne bez "z"!
  // "odpowiedzi" → poprawne (l. mn.). Trudne.
  // Zostawiam tylko pelna forme "odpowiedz" z "z"
  // Wlasciwie kontekst moze byc rozny. Usuwam.

  // prosba — "prosba" → "prosba" brak "s"
  /\bprosb[ayę]?\b/i,

  // zdjecie / zdjecia (blad: zdjecie — brak "e")
  // "zdjecie" ASCII "zdjecie" → brak "e". Ale "zdjecie" z "e" → "e" po "j".
  // "zdjecia" (l. mn. D.) → ale "zdjecia" z "e" na poczatku: "zd"+"je"+"cia".
  // W ASCII "zdjecia" → bez "e". 
  // Klopot: "zdjecie" (bez "e") jest innym slowem: "zdiecie"?? Nie, "zdjecie" z "e".
  // Problem: "zdjecie" → "zdjecie" (bez "e") to NIE jest poprawny polski wyraz.
  // Dodaje z ryzykiem falszywego pozytywu (malo prawdopodobne).
  /\bzdjeci[ae]?\b/i,

  // rozny / rozne / roznych (blad: rozny — brak "z" i "o")
  // "rozny" ASCII "rozny" → brak "z" i brak "o". "rozny" → "rozny".
  /\brozn[ayeych]?\b/i,

  // rzad / rzadu (blad: rzad — "rzad" z "a" zamiast "a". "rzad" moze byc "rzad" (brak "a") 
  // ALBO "rzad" to poprawny polski przymiotnik! "rzadki" → "rzad" od "rzadki" to OK.
  // "rzad" jako "rzadki" - przymiotnik. "rzad" jako "government" - rzeczownik.
  // Oba poprawne w zaleznosci od kontekstu. Trudne. Usuwam.

  // rzeka / rzeki (blad: rzeka — poprawne! Bez "rz" ← "rz" w "rzeka" to standardowa polska litera.
  // "rzeka" jest poprawna bez znakow. Usuwam.

  // narzedzie / narzedzia (blad: narzedzie — brak "e")
  // "narzedzie" ASCII "narzedzie" → brak "e". 
  // "narzedzie" → "narzedzie". "narzedzia" → "narzedzia" (l.mn.)
  /\bnarzedzi\w*\b/i,

  // zamowienie / zamowienia (blad: zamowienie — brak "o")
  // "zamowienie" ASCII "zamowienie" → brak "o"
  /\bzamowieni[ae]?\b/i,

  // wazne / wazny (blad: wazne — brak "z")
  // "wazne" ASCII "wazne" → brak "z"
  // "wazne" → "wazne"
  // Ale: "wazne" moze byc od "waza" (zupa) + "ne" — ale to bardzo rzadkie.
  // Jednak "wazny" ← "wazny" to czesty blad. Dodaje ostroznie.
  /\bwazn[ayey]?\b/i,

  // kazdy / kazde (blad: kazdy — brak "z" i "a")
  // "kazdy" ASCII "kazdy" → brak "z" i "a"
  // "kazdy" → "kazdy" (czy "kazy"?) → "kazdy" ma "z" i "a". ASCII: "k"+"a"+"z"+"d"+"y".
  // "kazdy" → "kazdy", brak "z" i "a"
  /\bkazd[ayey]?\b/i,

  // szczescie (blad: szczescie — brak "e" i "s" i "c")
  // "szczescie" ASCII "szczescie" → brak "e", "s", "c"
  /\bszczescie\b/i,

  // zwierzeta / zwierze (blad: zwierzeta — brak "e")
  // "zwierzeta" ASCII "zwierzeta" → brak "e"
  // "zwierzeta" → "zwierzeta". "zwierze" → "zwierze".
  /\bzwierz[etę]?\b/i,

  // Wszystkie ponizsze sa juz obsluzone lub poprawne bez znakow:
  // zelazo — "zelazo" → "zelazo", brak "z"
  // "zelazo" → "zelazo" — bardzo rzadkie slowo w kontekscie stron. Dodaje na wszelki wypadek.
  /\bzelazn\w*\b/i,

  // zolw — "zolw" → "zolw", brak "z" i "ol"
  // "zolw" → "zolw". Bardzo rzadkie. Dodaje.
  /\bzolwi\w*\b/i,
  /\bzolwia\b/i,
];

const POLISH_DIACRITICS = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/;

function isPolishContentPath(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/');
  if (POLISH_CONTENT_PATHS.some((prefix) => normalized.startsWith(prefix))) return true;
  return POLISH_CONTENT_GLOB.some((pattern) => {
    const regex = new RegExp(
      '^' + pattern.replace(/\//g, '/').replace(/\./g, '\\.').replace(/\*/g, '.*') + '$',
    );
    return regex.test(normalized);
  });
}

function extractTextFromHtml(html: string): string[] {
  const texts: string[] = [];
  const tagContent = />([^<]+)</g;
  let match: RegExpExecArray | null;
  while ((match = tagContent.exec(html)) !== null) {
    const trimmed = match[1].trim();
    if (trimmed.length > 2) texts.push(trimmed);
  }
  return texts;
}

function getQuotedTextCandidates(source: string): Array<{ value: string; index: number }> {
  const candidates: Array<{ value: string; index: number }> = [];
  const quotedString = /"(?:\\.|[^"\\])*"/g;
  let match: RegExpExecArray | null;

  while ((match = quotedString.exec(source)) !== null) {
    try {
      const value = JSON.parse(match[0]);
      if (typeof value === 'string') candidates.push({ value, index: match.index });
    } catch {
      // Nie kazda wartosc w Astro musi byc poprawnym literalem JSON.
    }
  }

  return candidates;
}

export const PLACEHOLDER_PATTERNS: PlaceholderPattern[] = [
  {
    rule: 'example-email',
    patterns: [/kontakt@example\.com/i, /example\.com/i, /example\.org/i, /twojastrona\.pl/i],
  },
  {
    rule: 'placeholder-phone',
    patterns: [/\+48\s*123\s*456\s*789/],
  },
  {
    rule: 'placeholder-address',
    patterns: [/ul\.\s*Przyk[lł]adowa/i],
  },
  {
    rule: 'placeholder-name',
    patterns: [/^Nazwa strony$/m, /"Nazwa strony"/i],
  },
  {
    rule: 'placeholder-company',
    patterns: [/^Twoja Firma$/m, /Twoja Firma/i],
  },
  {
    rule: 'placeholder-tagline',
    patterns: [/^Krotki opis$/m, /Krótki opis/i],
  },
  {
    rule: 'placeholder-social-href',
    patterns: [/"facebook":\s*"#"/, /"instagram":\s*"#"/, /"twitter":\s*"#"/, /"linkedin":\s*"#"/, /"youtube":\s*"#"/],
  },
  {
    rule: 'placeholder-twitter-handle',
    patterns: [/"twitterHandle":\s*"@"/],
  },
  {
    rule: 'placeholder-text',
    patterns: [/:\s*"[^"]*placeholder[^"]*"/i],
  },
];

export function auditContent(
  source: string,
  filePath: string,
): ContentIssue[] {
  const issues: ContentIssue[] = [];

  if (isExcluded(filePath)) return issues;

  for (const patternDef of PLACEHOLDER_PATTERNS) {
    for (const regex of patternDef.patterns) {
      let match: RegExpExecArray | null;
      const globalRegex = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');
      while ((match = globalRegex.exec(source)) !== null) {
        const lineNum = source.slice(0, match.index).split('\n').length;
        if (!issues.some((i) => i.file === filePath && i.line === lineNum && i.rule === patternDef.rule)) {
          issues.push({
            file: filePath,
            line: lineNum,
            rule: patternDef.rule,
            value: match[0],
          });
        }
      }
    }
  }

  if (isPolishContentPath(filePath)) {
    const candidates = filePath.endsWith('.json')
      ? getQuotedTextCandidates(source)
      : extractTextFromHtml(source);

    for (const candidate of candidates) {
      const value = typeof candidate === 'string' ? candidate : candidate.value;
      const index = typeof candidate === 'string' ? -1 : candidate.index;

      if (POLISH_DIACRITICS.test(value)) continue;

      // URL-e, slugi, sciezki plikow nie musza miec polskich znakow
      if (value.startsWith('/') || value.startsWith('./') || value.startsWith('http')) continue;

      // Sprawdzenie przez znaczniki ASCII (slowa ktore na pewno powinny miec znaki)
      const marker = ASCII_POLISH_MARKERS.find((pattern) => pattern.test(value));
      if (marker) {
        const lineNum = index >= 0
          ? source.slice(0, index).split('\n').length
          : 1;
        if (!issues.some((i) => i.file === filePath && i.line === lineNum && i.rule === 'polish-diacritics')) {
          issues.push({
            file: filePath,
            line: lineNum,
            rule: 'polish-diacritics',
            value,
          });
        }
        continue;
      }
    }
  }

  return issues;
}

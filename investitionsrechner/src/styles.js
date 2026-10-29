/* Gestaltung (Team-Ansicht) */
export const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');

.app {
  --bg: #10151B;
  --karte: #181F27;
  --karte-2: #1C242C;
  --sunk: #12181F;
  --line: #2A333C;
  --text: #ECEAE4;
  --muted: #8B9089;
  --akzent: #3E8F65;
  --akzent-weich: rgba(62,143,101,.16);
  --aus: #C97A54;
  --steuer: #D2AD5C;
  --steuer-weich: rgba(210,173,92,.28);
  --eigen: rgba(62,143,101,.20);
  --schatten: 0 24px 60px -34px rgba(0,0,0,.85);
  --font-d: 'Space Grotesk', 'Segoe UI', sans-serif;
  --font-b: 'IBM Plex Sans', system-ui, sans-serif;
  --font-m: 'IBM Plex Mono', ui-monospace, monospace;
  background:
    radial-gradient(1100px 520px at 12% -10%, rgba(62,143,101,.10), transparent 60%),
    radial-gradient(900px 460px at 92% 4%, rgba(139,144,137,.08), transparent 62%),
    var(--bg);
  color: var(--text);
  font-family: var(--font-b);
  min-height: 100%;
  -webkit-font-smoothing: antialiased;
}
.app.hell {
  --bg: #E7E4DE;
  --karte: #F7F5F1;
  --karte-2: #F1EEE8;
  --sunk: #EFECE5;
  --line: #D9D5CB;
  --text: #22251F;
  --muted: #71705F;
  --akzent: #0F5132;
  --akzent-weich: rgba(15,81,50,.10);
  --aus: #A6552F;
  --steuer: #9C7A24;
  --steuer-weich: rgba(156,122,36,.22);
  --eigen: rgba(15,81,50,.14);
  --schatten: 0 18px 40px -30px rgba(34,37,31,.30);
  background:
    radial-gradient(900px 460px at 10% -12%, rgba(15,81,50,.08), transparent 60%),
    var(--bg);
}
.app * { box-sizing: border-box; }
.app ::placeholder { color: var(--muted); opacity: .65; }
.app ::selection { background: var(--akzent); color: #F7F5F1; }

.huelle { max-width: 1420px; margin: 0 auto; padding: 0 24px 56px; }
@media (max-width: 960px) { .huelle { padding: 0 14px 40px; } }

/* Kopf */
.kopf { padding: 26px 0 24px; }
.leiste { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.marke {
  display: inline-flex; align-items: center; gap: 9px;
  font-family: var(--font-m); font-size: 11px; letter-spacing: .16em;
  text-transform: uppercase; color: var(--muted);
}
.marke-punkt {
  width: 9px; height: 9px; border-radius: 50%; background: var(--akzent);
  box-shadow: 0 0 0 5px var(--akzent-weich), 0 0 18px var(--akzent);
}
.thema {
  font-family: var(--font-b); font-size: 12px; color: var(--muted);
  background: var(--karte); border: 1px solid var(--line); border-radius: 999px;
  padding: 7px 15px; cursor: pointer; transition: all .18s ease;
}
.thema:hover { color: var(--text); border-color: var(--akzent); }
.leiste-rechts { display: flex; gap: 8px; }

/* Login */
.login-buehne {
  min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px;
}
.login-karte {
  width: 100%; max-width: 360px; background: var(--karte); border: 1px solid var(--line);
  border-radius: 22px; box-shadow: var(--schatten); padding: 28px 26px; display: grid; gap: 16px;
}
.login-karte h1 {
  font-family: var(--font-d); font-weight: 600; font-size: 24px; letter-spacing: -.02em; margin: 4px 0 0;
}
.login-hinweis { font-size: 12.5px; color: var(--muted); line-height: 1.6; margin: 0; }
.login-fehler { font-size: 12.5px; color: var(--aus); margin: -6px 0 0; }
.login-knopf {
  font-family: var(--font-b); font-size: 14px; font-weight: 600; color: #F5F3EE;
  background: var(--akzent); border: 0; border-radius: 11px; padding: 12px; cursor: pointer;
  transition: filter .16s ease;
}
.login-knopf:hover { filter: brightness(1.08); }
.login-knopf:disabled { opacity: .6; cursor: default; }
.login-lade { color: var(--muted); font-size: 13px; }

/* Gespeicherte Berechnungen */
.speicher-zeile { display: grid; gap: 8px; }
.speicher-knoepfe { display: flex; gap: 8px; flex-wrap: wrap; }
.speicher-knoepfe .mini { flex: 1; }
.hinweis-klein { font-size: 13px; color: var(--muted); margin: 0; }
.gespeichert-eintrag {
  display: flex; align-items: center; gap: 8px; background: var(--sunk);
  border: 1px solid var(--line); border-radius: 11px; padding: 4px 6px 4px 12px;
}
.gespeichert-eintrag.aktiv { border-color: var(--akzent); }
.gespeichert-name {
  flex: 1; text-align: left; background: none; border: 0; cursor: pointer;
  font-family: var(--font-b); font-size: 12.5px; color: var(--text); padding: 6px 0;
}
.gespeichert-loeschen {
  background: none; border: 0; cursor: pointer; font-family: var(--font-b);
  font-size: 11px; color: var(--muted); padding: 6px 8px;
}
.gespeichert-loeschen:hover { color: var(--aus); }

.kopf h1 {
  font-family: var(--font-d); font-weight: 600; font-size: clamp(30px, 5vw, 46px);
  letter-spacing: -.035em; line-height: 1.05; margin: 20px 0 0;
}
.kopf h1.titel-leer { color: var(--muted); opacity: .55; }
.kopf-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.kopf-meta span {
  border: 1px solid var(--line); background: var(--karte); border-radius: 999px;
  padding: 6px 14px; font-size: 12.5px; color: var(--text);
}
.kopf-meta .mono { font-family: var(--font-m); color: var(--muted); }

.raster { display: grid; grid-template-columns: 356px minmax(0,1fr); gap: 22px; align-items: start; }
@media (max-width: 1000px) { .raster { grid-template-columns: 1fr; } }

/* Eingaben */
.eingaben {
  background: var(--karte); border: 1px solid var(--line); border-radius: 22px;
  box-shadow: var(--schatten); padding: 4px 20px 22px;
  position: sticky; top: 18px; max-height: calc(100vh - 36px); overflow-y: auto;
}
@media (max-width: 1000px) { .eingaben { position: static; max-height: none; } }
.eingaben::-webkit-scrollbar { width: 8px; }
.eingaben::-webkit-scrollbar-thumb { background: var(--line); border-radius: 8px; }

.gruppe + .gruppe { border-top: 1px solid var(--line); }
.gruppe-kopf {
  width: 100%; display: flex; align-items: center; gap: 11px; background: none;
  border: 0; padding: 17px 0; cursor: pointer; text-align: left;
  font-family: var(--font-b); font-size: 14px; font-weight: 600; color: var(--text);
}
.kennung {
  font-family: var(--font-m); font-size: 10px; color: var(--akzent);
  background: var(--akzent-weich); border-radius: 7px; padding: 4px 8px;
}
.gruppe-titel { flex: 1; }
.pfeil {
  width: 24px; height: 24px; border-radius: 50%; background: var(--sunk);
  border: 1px solid var(--line); color: var(--muted);
  font-family: var(--font-m); font-size: 14px; line-height: 21px; text-align: center;
}
.gruppe.offen .pfeil { background: var(--akzent); border-color: var(--akzent); color: #F5F3EE; }
.gruppe-inhalt { padding: 0 0 22px; display: grid; gap: 15px; }

.feld { display: grid; gap: 6px; }
.feld-label { font-size: 12px; font-weight: 500; color: var(--muted); }
.feld-eingabe {
  display: flex; align-items: stretch; background: var(--sunk);
  border: 1px solid var(--line); border-radius: 11px;
  transition: border-color .16s ease, box-shadow .16s ease;
}
.feld-eingabe:focus-within { border-color: var(--akzent); box-shadow: 0 0 0 3px var(--akzent-weich); }
.feld input, .feld select {
  flex: 1; min-width: 0; border: 0; background: none; padding: 11px 13px;
  font-family: var(--font-m); font-size: 13.5px; color: var(--text); border-radius: 11px;
}
.feld select, .feld .textfeld { font-family: var(--font-b); }
.feld select { -webkit-appearance: none; appearance: none; cursor: pointer; }
.feld input:focus, .feld select:focus { outline: none; }
.suffix { display: flex; align-items: center; padding: 0 13px; font-size: 11.5px; color: var(--muted); white-space: nowrap; }
.feld-hinweis { font-size: 11.5px; color: var(--muted); line-height: 1.45; }

.segment { display: flex; gap: 4px; background: var(--sunk); border: 1px solid var(--line); border-radius: 11px; padding: 4px; }
.segment button {
  flex: 1; border: 0; background: none; color: var(--muted); cursor: pointer;
  font-family: var(--font-b); font-size: 13px; padding: 8px 10px; border-radius: 8px;
  transition: all .16s ease;
}
.segment button.aktiv { background: var(--akzent); color: #F5F3EE; font-weight: 600; }

.schalter {
  display: flex; gap: 11px; align-items: flex-start; font-size: 13px; cursor: pointer;
  background: var(--sunk); border: 1px solid var(--line); border-radius: 11px; padding: 12px 13px;
}
.schalter input { position: absolute; opacity: 0; width: 0; height: 0; }
.knopf {
  flex: none; width: 34px; height: 20px; border-radius: 999px; background: var(--line);
  position: relative; transition: background .18s ease; margin-top: 1px;
}
.knopf::after {
  content: ""; position: absolute; top: 3px; left: 3px; width: 14px; height: 14px;
  border-radius: 50%; background: var(--muted); transition: transform .18s ease, background .18s ease;
}
.schalter input:checked + .knopf { background: var(--akzent-weich); }
.schalter input:checked + .knopf::after { transform: translateX(14px); background: var(--akzent); }
.schalter input:focus-visible + .knopf { box-shadow: 0 0 0 3px var(--akzent-weich); }
.schalter-text em { display: block; font-style: normal; font-size: 11.5px; color: var(--muted); margin-top: 3px; line-height: 1.45; }

.profil { background: var(--sunk); border: 1px solid var(--line); border-radius: 14px; padding: 14px; }
.profil-kopf {
  display: flex; flex-direction: column; gap: 3px; font-size: 12px; font-weight: 600; margin-bottom: 10px;
}
.profil-kopf span { font-family: var(--font-m); font-size: 10.5px; font-weight: 400; color: var(--muted); }
.profil dl > div { padding: 5px 0; }
.saetze { display: flex; gap: 8px; margin-top: 11px; }
.saetze span {
  flex: 1; text-align: center; font-family: var(--font-m); font-size: 11.5px;
  color: var(--akzent); background: var(--akzent-weich); border-radius: 8px; padding: 6px 4px;
}

.darlehen { border: 1px solid var(--line); border-radius: 14px; padding: 14px; }
.darlehen-kopf { display: flex; gap: 8px; align-items: center; margin-bottom: 13px; }
.darlehen-name {
  flex: 1; min-width: 0; border: 0; background: none; color: var(--text);
  font-family: var(--font-d); font-weight: 600; font-size: 14.5px; padding: 2px 0;
}
.darlehen-name:focus { outline: none; box-shadow: 0 2px 0 var(--akzent); }
.darlehen-felder { display: grid; gap: 13px; }

.mini, .hinzu, .reset {
  font-family: var(--font-b); font-size: 12.5px; font-weight: 500; cursor: pointer;
  background: var(--sunk); color: var(--muted); border: 1px solid var(--line);
  border-radius: 999px; padding: 9px 16px; transition: all .16s ease;
}
.hinzu, .reset { width: 100%; }
.reset { margin-top: 20px; }
.mini:hover, .hinzu:hover, .reset:hover { color: var(--akzent); border-color: var(--akzent); }
.trenner { font-family: var(--font-m); font-size: 10px; text-transform: uppercase; letter-spacing: .14em; color: var(--muted); padding-top: 6px; }

/* Ergebnis */
.ergebnis { min-width: 0; display: grid; gap: 18px; }
.kennzahlen { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
@media (max-width: 820px) { .kennzahlen { grid-template-columns: repeat(2, 1fr); } }
.kz {
  background: var(--karte); border: 1px solid var(--line); border-radius: 20px;
  padding: 18px 19px; display: grid; gap: 6px; align-content: start; box-shadow: var(--schatten);
}
.kz.betont {
  background: linear-gradient(155deg, var(--akzent) 0%, #164B32 60%, #0D3322 100%);
  border-color: transparent; color: #F5F3EE;
}
.kz.betont .kz-label, .kz.betont .kz-fuss { color: rgba(245,243,238,.72); }
.kz-label { font-size: 11.5px; color: var(--muted); }
.kz-wert { font-family: var(--font-d); font-weight: 600; font-size: clamp(20px, 2.4vw, 27px); letter-spacing: -.025em; }
.kz-wert.aus { color: var(--aus); }
.kz-wert.ein { color: var(--akzent); }
.kz-wert.steuer { color: var(--steuer); }
.kz-fuss { font-size: 11px; color: var(--muted); line-height: 1.4; }

/* Band */
.band, .tafel, .reiter {
  background: var(--karte); border: 1px solid var(--line); box-shadow: var(--schatten);
}
.band { border-radius: 22px; padding: 20px 20px 16px; }
.band-kopf { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
.band-kopf h2 { font-family: var(--font-d); font-size: 15px; font-weight: 600; margin: 0; letter-spacing: -.01em; }
.band-hinweis { font-family: var(--font-m); font-size: 10.5px; color: var(--muted); }
.band-svg { width: 100%; height: 150px; display: block; }
.achse { stroke: var(--line); stroke-width: 1; vector-effect: non-scaling-stroke; }
.bar-aus { fill: var(--aus); }
.bar-steuer { fill: var(--steuer-weich); }
.bar-ein { fill: var(--akzent); }
.band-jahre { display: flex; justify-content: space-around; font-family: var(--font-m); font-size: 10px; color: var(--muted); margin-top: 6px; }
.legende { display: flex; flex-wrap: wrap; gap: 8px 20px; align-items: center; font-size: 11.5px; color: var(--muted); margin-top: 14px; }
.legende span { display: inline-flex; align-items: center; }
.pkt { width: 10px; height: 10px; border-radius: 3px; display: inline-block; margin-right: 7px; }
.pkt.aus { background: var(--aus); }
.pkt.steuer { background: var(--steuer-weich); }
.pkt.ein { background: var(--akzent); }
.pkt.eigen { background: var(--eigen); }

/* Reiter */
.reiter { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; border-radius: 999px; padding: 7px; }
.reiter button {
  font-family: var(--font-b); font-size: 13px; border: 0; background: none; color: var(--muted);
  padding: 10px 18px; border-radius: 999px; cursor: pointer; transition: all .16s ease;
}
.reiter button:hover { color: var(--text); background: var(--sunk); }
.reiter button.aktiv { background: var(--akzent); color: #F5F3EE; font-weight: 600; }
.export { margin-left: auto; display: flex; gap: 6px; }
.reiter .pdf {
  font-family: var(--font-m); font-size: 11.5px; background: var(--akzent);
  color: #F5F3EE; font-weight: 600;
}
.reiter .pdf:hover { background: var(--akzent); color: #F5F3EE; filter: brightness(1.08); }
.deckung {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  font-size: 11.5px; color: var(--aus); background: var(--sunk);
  border: 1px solid var(--line); border-radius: 11px; padding: 10px 12px;
}
.deckung.ok { color: var(--akzent); }
.reiter .csv { margin-left: 0; font-family: var(--font-m); font-size: 11.5px; border: 1px solid var(--line); }

.vorlagen { display: grid; gap: 8px; }
.vorlage {
  text-align: left; display: grid; gap: 3px; background: var(--sunk);
  border: 1px solid var(--line); border-radius: 11px; padding: 10px 12px; cursor: pointer;
  transition: border-color .16s ease;
}
.vorlage:hover { border-color: var(--akzent); }
.vorlage-titel { font-family: var(--font-b); font-size: 12px; font-weight: 600; color: var(--text); }
.vorlage-hinweis { font-size: 11px; color: var(--muted); line-height: 1.4; }
.vorlagen-gruppe { display: grid; gap: 6px; margin-bottom: 4px; }
.vorlagen-kategorie {
  font-family: var(--font-m); font-size: 10px; letter-spacing: .06em; text-transform: uppercase;
  color: var(--muted);
}

/* Tafeln */
.tafel { border-radius: 22px; overflow-x: auto; overflow-y: hidden; }
table { width: 100%; border-collapse: collapse; font-family: var(--font-m); font-size: 12px; min-width: 660px; }
th {
  font-family: var(--font-b); font-size: 11px; font-weight: 600; color: var(--muted);
  text-align: right; padding: 16px 15px 11px; border-bottom: 1px solid var(--line); white-space: nowrap;
}
th:first-child { text-align: left; }
td { text-align: right; padding: 10px 15px; border-bottom: 1px solid var(--line); white-space: nowrap; color: var(--text); }
tbody tr:last-child td { border-bottom: none; }
tbody tr:hover td { background: var(--karte-2); }
td.jahr { text-align: left; color: var(--muted); }
td.aus { color: var(--aus); }
td.ein { color: var(--akzent); }
td.steuer { color: var(--steuer); }
tr.summe td { background: var(--sunk); font-weight: 500; }
tr.summe:hover td { background: var(--sunk); }
.marke-txt { display: block; font-family: var(--font-b); font-style: normal; font-size: 10px; color: var(--muted); }

.bloecke { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; padding: 22px 24px; border-bottom: 1px solid var(--line); }
@media (max-width: 820px) { .bloecke { grid-template-columns: 1fr; } }
.block h3 { font-family: var(--font-d); font-size: 14.5px; font-weight: 600; margin: 0 0 12px; letter-spacing: -.01em; }
dl { margin: 0; font-size: 12.5px; }
dl > div { display: flex; justify-content: space-between; gap: 14px; padding: 7px 0; border-bottom: 1px solid var(--line); }
dl > div:last-child { border-bottom: none; }
dt { color: var(--muted); }
dd { margin: 0; font-family: var(--font-m); color: var(--text); }
dl > div.stark { font-weight: 600; padding-top: 10px; }
dl > div.stark dt { color: var(--text); }
.bilanz { padding: 6px 24px 20px; }

.kurve { padding: 22px 24px 0; }
.kurve svg { width: 100%; height: 180px; display: block; }
.fl-eigen { fill: var(--eigen); }
.ln-wert { fill: none; stroke: var(--akzent); stroke-width: 2; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
.ln-schuld { fill: none; stroke: var(--aus); stroke-width: 2; stroke-linejoin: round; vector-effect: non-scaling-stroke; }

.leer { font-size: 12.5px; color: var(--muted); padding: 24px; margin: 0; }
.fussnote { font-size: 12px; color: var(--muted); line-height: 1.6; padding: 18px 24px 22px; margin: 0; }
.haftung { font-size: 11.5px; color: var(--muted); line-height: 1.6; margin: 0; max-width: 64ch; }

@media (prefers-reduced-motion: reduce) { .app * { transition: none !important; } }
`;

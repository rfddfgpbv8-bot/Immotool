import React, { useState, useMemo } from "react";

/* ============================================================
   Immobilien-Investitionsrechner
   Steuerteil nach dem amtlichen Tarif des § 32a EStG,
   Soli und Kirchensteuer wie im BMF-Steuerrechner
   ============================================================ */

const TARIFE = {
  2026: {
    gfb: 12348, e2: 17799, e3: 69878, e4: 277825,
    a2: 914.51, b2: 1400, a3: 173.1, b3: 2397, c3: 1034.87,
    c4: 11135.63, c5: 19470.38,
    soliFreigrenze: 20350, kinderfreibetrag: 9756,
  },
  2025: {
    gfb: 12096, e2: 17443, e3: 68480, e4: 277825,
    a2: 932.3, b2: 1400, a3: 176.64, b3: 2397, c3: 1015.13,
    c4: 10911.92, c5: 19246.67,
    soliFreigrenze: 19950, kinderfreibetrag: 9600,
  },
};

/* Grundtabelle: tarifliche Einkommensteuer, § 32a Abs. 1 EStG */
function estGrundtabelle(zvE, t) {
  const x = Math.floor(Math.max(0, zvE));
  if (x <= t.gfb) return 0;
  if (x <= t.e2) {
    const y = (x - t.gfb) / 10000;
    return Math.floor((t.a2 * y + t.b2) * y);
  }
  if (x <= t.e3) {
    const z = (x - t.e2) / 10000;
    return Math.floor((t.a3 * z + t.b3) * z + t.c3);
  }
  if (x <= t.e4) return Math.floor(0.42 * x - t.c4);
  return Math.floor(0.45 * x - t.c5);
}

/* Splitting: § 32a Abs. 5 EStG */
function estTariflich(zvE, t, splitting) {
  return splitting
    ? 2 * estGrundtabelle(Math.floor(zvE) / 2, t)
    : estGrundtabelle(zvE, t);
}

/* Solidaritätszuschlag: 5,5 %, Freigrenze und Milderungszone 11,9 % */
function soliBetrag(bemessung, freigrenze) {
  if (bemessung <= freigrenze) return 0;
  return Math.min(bemessung * 0.055, (bemessung - freigrenze) * 0.119);
}

/*
   Tarifverschiebung: werden die Eckwerte jährlich um f angehoben,
   gilt T_f(x) = f · T(x / f). Bei 0 % bleibt der Tarif eingefroren.
*/
function tarifFaktor(s, jahr) {
  const n = Math.max(0, jahr - s.tarifJahr);
  return Math.pow(1 + s.tarifAnpassung / 100, n);
}

function steuerDetail(zvE, s, jahr) {
  const t = TARIFE[s.tarifJahr] || TARIFE[2026];
  const f = tarifFaktor(s, jahr);
  const basis = Math.max(0, zvE) / f;

  const est = estTariflich(basis, t, s.splitting) * f;

  // Kinderfreibeträge mindern nur die Bemessungsgrundlage für Soli und Kirchensteuer
  const kfb = s.kinderfreibetraege * t.kinderfreibetrag;
  const estKfb = estTariflich(Math.max(0, basis - kfb), t, s.splitting) * f;

  const freigrenze = t.soliFreigrenze * (s.splitting ? 2 : 1) * f;
  const soli = s.soli ? soliBetrag(estKfb, freigrenze) : 0;
  const kirche = estKfb * (s.kirchensteuer / 100);

  return { est, soli, kirche, gesamt: est + soli + kirche };
}

function steuerlast(zvE, s, jahr) {
  return steuerDetail(zvE, s, jahr).gesamt;
}

function grenzsteuersatz(zvE, s, jahr) {
  const d = 100;
  return ((steuerlast(zvE + d, s, jahr) - steuerlast(zvE, s, jahr)) / d) * 100;
}

/* ---------- Darlehen ---------- */

function tilgeDarlehen(d, vonJahr, bisJahr, sonder) {
  const jahre = {};
  let saldo = d.betrag;
  const rate = (d.betrag * (d.zins + d.tilgung)) / 100 / 12;
  let zinssatz = d.zins;

  for (let jahr = vonJahr; jahr <= bisJahr; jahr++) {
    let zSum = 0, tSum = 0, sSum = 0;
    if (jahr > vonJahr && jahr - vonJahr >= d.zinsbindung) zinssatz = d.anschlusszins;
    for (let m = 1; m <= 12; m++) {
      if (saldo > 0.01) {
        const z = (saldo * zinssatz) / 100 / 12;
        let t = rate - z;
        if (t < 0) t = 0;
        if (t > saldo) t = saldo;
        saldo -= t;
        zSum += z;
        tSum += t;
      }
      if (sonder && sonder.betrag > 0 && jahr === sonder.jahr && m === sonder.monat && saldo > 0) {
        const st = Math.min(sonder.betrag, saldo);
        saldo -= st;
        sSum += st;
      }
    }
    jahre[jahr] = { zins: zSum, tilgung: tSum + sSum, sondertilgung: sSum, restschuld: saldo };
  }
  return { jahre };
}

/* ---------- Hauptberechnung ---------- */

function berechne(s) {
  const kaufGesamt = s.kaufpreis + s.stellplatzPreis;
  const grest = (kaufGesamt * s.grestSatz) / 100;
  const notar = (kaufGesamt * s.notarSatz) / 100;
  const beratung = (kaufGesamt * s.beratungSatz) / 100;
  const gesamtkosten = kaufGesamt + grest + notar + beratung;

  const darlehenSumme = s.darlehen.reduce((a, d) => a + d.betrag, 0);
  const eigenkapital = s.eigenkapital;
  const darlehensbedarf = gesamtkosten - eigenkapital;
  const deckungslücke = darlehensbedarf - darlehenSumme;

  const gebaeude = (s.kaufpreis * s.gebaeudeAnteil) / 100 + s.stellplatzPreis;
  const grundstueck = kaufGesamt - gebaeude;
  const quote = kaufGesamt > 0 ? gebaeude / kaufGesamt : 0;
  const zuschuss = s.zuschussBetrag;

  const bmgDegressiv = Math.max(
    0,
    gebaeude + (grest + notar + beratung) * quote - zuschuss
  );
  const bmg7bRoh = Math.max(0, gebaeude - zuschuss);
  const kappung = s.bgf * s.max7bProQm;
  const bmg7b = s.sonder7b ? Math.min(bmg7bRoh, kappung) : 0;

  const bis = s.endJahr;
  const sim = s.darlehen.map((d, i) =>
    tilgeDarlehen(
      d, s.darlehenBeginn, bis,
      s.zuschussBetrag > 0 && s.zuschussDarlehen === i
        ? { betrag: s.zuschussBetrag, jahr: s.zuschussJahr, monat: s.zuschussMonat }
        : null
    )
  );

  /* AfA */
  const afaProJahr = {};
  let restwert = bmgDegressiv;
  let sonderKumuliert = 0;
  const startJahr = s.fertigJahr;
  const ersterAnteil = (13 - s.fertigMonat) / 12;

  for (let jahr = startJahr; jahr <= bis; jahr++) {
    let normal = s.degressiv
      ? restwert * (s.degressivSatz / 100)
      : bmgDegressiv * (s.linearSatz / 100);
    if (jahr === startJahr) normal *= ersterAnteil;
    if (normal > restwert) normal = restwert;
    restwert -= normal;

    let sonder = 0;
    if (s.sonder7b && jahr < startJahr + s.sonder7bJahre) {
      sonder = bmg7b * (s.sonder7bSatz / 100);
      sonderKumuliert += sonder;
      if (jahr === startJahr + s.sonder7bJahre - 1)
        restwert = Math.max(0, restwert - sonderKumuliert);
    }
    afaProJahr[jahr] = { normal, sonder, gesamt: normal + sonder };
  }

  /* Jahresreihen */
  const zeilen = [];
  let zvE = s.zvE;
  let kumSteuerersparnis = 0;
  let kumAufwandNachSteuern = 0;
  let kumAufwandVorSteuern = 0;
  const cashflows = [];
  const kaltmieteBasis = s.wohnflaeche * s.mieteProQm + s.stellplatzMiete;

  for (let jahr = s.startJahr; jahr <= bis; jahr++) {
    if (jahr > s.startJahr) zvE = zvE * (1 + s.einkommenSteigerung / 100);

    let monate = 0;
    if (jahr > s.vermietungJahr) monate = 12;
    else if (jahr === s.vermietungJahr) monate = 13 - s.vermietungMonat;
    let steigerungen = 0;
    if (jahr >= s.mietSteigerungAb && s.mietIntervall > 0)
      steigerungen = Math.floor((jahr - s.mietSteigerungAb) / s.mietIntervall) + 1;
    const monatsmiete = kaltmieteBasis * Math.pow(1 + s.mietSteigerung / 100, steigerungen);
    const miete = monatsmiete * monate;

    const kostenFaktor =
      jahr >= s.kostenSteigerungAb
        ? Math.pow(1 + s.kostenSteigerung / 100, jahr - s.kostenSteigerungAb + 1)
        : 1;
    const aktiv = jahr >= s.vermietungJahr;
    const verwaltung = aktiv
      ? (s.verwaltungWEG + s.verwaltungSE + s.sonstigeKosten) * kostenFaktor
      : 0;
    const ruecklage = aktiv ? s.wohnflaeche * s.ruecklageProQm * 12 * kostenFaktor : 0;

    let zinsen = 0, tilgung = 0, sondertilgung = 0, restschuld = 0;
    sim.forEach((r) => {
      const j = r.jahre[jahr];
      if (j) {
        zinsen += j.zins;
        tilgung += j.tilgung;
        sondertilgung += j.sondertilgung;
        restschuld += j.restschuld;
      }
    });

    const afa = afaProJahr[jahr] ? afaProJahr[jahr].gesamt : 0;
    const ergebnis = miete - (zinsen + verwaltung + afa);
    const zvENeu = Math.max(0, zvE + ergebnis);
    const dAlt = steuerDetail(zvE, s, jahr);
    const dNeu = steuerDetail(zvENeu, s, jahr);
    const ersparnis = dAlt.gesamt - dNeu.gesamt;

    const eigeneTilgung = tilgung - sondertilgung;
    const aufwandVorSteuern = zinsen + eigeneTilgung + ruecklage + verwaltung - miete;
    const aufwandNachSteuern = aufwandVorSteuern - ersparnis;

    kumSteuerersparnis += ersparnis;
    kumAufwandVorSteuern += aufwandVorSteuern;
    kumAufwandNachSteuern += aufwandNachSteuern;
    cashflows.push(-aufwandNachSteuern);

    zeilen.push({
      jahr, zinsen, tilgung, sondertilgung, ruecklage, verwaltung, miete, afa,
      afaNormal: afaProJahr[jahr] ? afaProJahr[jahr].normal : 0,
      afaSonder: afaProJahr[jahr] ? afaProJahr[jahr].sonder : 0,
      ergebnis, zvE, zvENeu,
      steuerAlt: dAlt.gesamt, steuerNeu: dNeu.gesamt,
      estAlt: dAlt.est, soliAlt: dAlt.soli, kircheAlt: dAlt.kirche,
      ersparnis, aufwandVorSteuern, aufwandNachSteuern, restschuld,
    });
  }

  const letzte = zeilen[zeilen.length - 1] || { restschuld: 0, jahr: s.endJahr };
  const jahreWert = Math.max(0, s.endJahr - s.wertSteigerungAb + 1);
  const immobilienwert = kaufGesamt * Math.pow(1 + s.wertSteigerung / 100, jahreWert);
  const ueberschuss =
    immobilienwert - letzte.restschuld - eigenkapital - kumAufwandVorSteuern + kumSteuerersparnis;

  const jahreAktiv = zeilen.filter((z) => z.jahr >= s.vermietungJahr).length || 1;
  const aufwandPM = kumAufwandNachSteuern / jahreAktiv / 12;

  const irrFlows = [-eigenkapital, ...cashflows];
  irrFlows[irrFlows.length - 1] += immobilienwert - letzte.restschuld;

  return {
    kaufGesamt, grest, notar, beratung, gesamtkosten, darlehenSumme, eigenkapital,
    darlehensbedarf, deckungslücke,
    gebaeude, grundstueck, quote, bmgDegressiv, bmg7b, bmg7bRoh, kappung,
    zeilen, kumSteuerersparnis, kumAufwandVorSteuern, kumAufwandNachSteuern, aufwandPM,
    immobilienwert, restschuldEnde: letzte.restschuld, ueberschuss,
    irr: berechneIRR(irrFlows),
  };
}

function berechneIRR(flows) {
  const npv = (r) => flows.reduce((a, f, i) => a + f / Math.pow(1 + r, i), 0);
  let lo = -0.9, hi = 2.0;
  if (npv(lo) * npv(hi) > 0) return null;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (npv(lo) * npv(mid) <= 0) hi = mid;
    else lo = mid;
  }
  return ((lo + hi) / 2) * 100;
}

/* ---------- Formatierung ---------- */

const eur = (n) =>
  (n === null || n === undefined || isNaN(n) ? 0 : Math.round(n)).toLocaleString("de-DE");
const eur2 = (n) =>
  (isNaN(n) ? 0 : n).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (n) =>
  (isNaN(n) || n === null ? 0 : n).toLocaleString("de-DE", {
    minimumFractionDigits: 1, maximumFractionDigits: 1,
  });

/* ---------- PDF-Ausgabe ---------- */

const WINANSI = {
  "\u20AC": 0x80, "\u201A": 0x82, "\u201E": 0x84, "\u2026": 0x85, "\u2018": 0x91,
  "\u2019": 0x92, "\u201C": 0x93, "\u201D": 0x94, "\u2022": 0x95, "\u2013": 0x96,
  "\u2014": 0x97, "\u2212": 0x2D, "\u00A0": 0x20,
};

function pdfKod(t) {
  let o = "";
  for (const ch of String(t)) {
    const c = ch.charCodeAt(0);
    if (c < 256) o += ch;
    else if (WINANSI[ch] !== undefined) o += String.fromCharCode(WINANSI[ch]);
    else o += "?";
  }
  return o;
}
const pdfEsc = (t) => pdfKod(t).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

/* Baut den Bericht als PDF-Bytes. Schrift: Helvetica für Text, Courier für Zahlen. */
function pdfDatei(s, r, profil, grenz) {
  const W = 595.28, H = 841.89, M = 48, RE = W - M;
  const TINTE = "0.07 0.11 0.15";
  const GRAU = "0.42 0.49 0.55";
  const AKZ = "0.05 0.55 0.44";
  const ROT = "0.72 0.31 0.18";
  const LINIE_F = "0.85 0.88 0.91";
  const FLAECHE = "0.955 0.968 0.975";

  const seiten = [];
  let c = "";

  const cw = (txt, size) => pdfKod(String(txt)).length * 0.6 * size; // Courier-Breite
  const T = (x, y, txt, font, size, col) =>
    `${col || TINTE} rg\nBT /${font || "F1"} ${size || 9} Tf 1 0 0 1 ${x.toFixed(2)} ${(H - y).toFixed(2)} Tm (${pdfEsc(txt)}) Tj ET\n`;
  const TR = (xEnde, y, txt, font, size, col) =>
    T(xEnde - cw(txt, size || 8), y, txt, font || "F3", size || 8, col);
  const LN = (x1, y, x2, dicke, col) =>
    `${col || LINIE_F} RG\n${dicke || 0.6} w\n${x1.toFixed(2)} ${(H - y).toFixed(2)} m ${x2.toFixed(2)} ${(H - y).toFixed(2)} l S\n`;
  const BOX = (x, y, w, h, col) =>
    `${col} rg\n${x.toFixed(2)} ${(H - y - h).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f\n`;

  const kopf = () => {
    c += BOX(0, 0, W, 3.5, AKZ);
    c += T(M, 34, "INVESTITIONSRECHNER", "F2", 7.5, GRAU);
    c += TR(RE, 34, s.projektName || "Ohne Titel", "F3", 7.5, GRAU);
    c += LN(M, 40, RE);
  };
  const neueSeite = () => {
    if (c) seiten.push(c);
    c = "";
    kopf();
  };

  /* Umbruch für Fließtext, geschätzte Helvetica-Breite */
  const umbruch = (txt, size, maxBreite) => {
    const worte = String(txt).split(" ");
    const zeilen = [];
    let z = "";
    for (const w of worte) {
      const test = z ? z + " " + w : w;
      if (test.length * size * 0.5 > maxBreite && z) {
        zeilen.push(z);
        z = w;
      } else z = test;
    }
    if (z) zeilen.push(z);
    return zeilen;
  };

  const absatz = (y, txt, size, col) => {
    const zeilen = umbruch(txt, size || 8.5, RE - M);
    zeilen.forEach((z, i) => {
      c += T(M, y + i * (size || 8.5) * 1.5, z, "F1", size || 8.5, col || GRAU);
    });
    return y + zeilen.length * (size || 8.5) * 1.5;
  };

  const abschnitt = (y, titel) => {
    c += T(M, y, titel, "F2", 10.5, TINTE);
    c += LN(M, y + 6, RE, 0.8, "0.78 0.82 0.86");
    return y + 22;
  };

  const paar = (y, x, breite, label, wert, stark) => {
    c += T(x, y, label, stark ? "F2" : "F1", 8.5, stark ? TINTE : GRAU);
    c += TR(x + breite, y, wert, stark ? "F4" : "F3", 8.5, TINTE);
    c += LN(x, y + 4.5, x + breite, 0.4);
    return y + 15;
  };

  const tabelle = (y, spalten, zeilen, fuss) => {
    c += BOX(M, y - 10, RE - M, 16, FLAECHE);
    spalten.forEach((sp) => {
      if (sp.links) c += T(sp.x, y, sp.t, "F4", 7, GRAU);
      else c += TR(sp.x, y, sp.t, "F4", 7, GRAU);
    });
    y += 15;
    zeilen.forEach((zeile) => {
      spalten.forEach((sp, i) => {
        const v = zeile[i];
        const col = v && v.col ? v.col : TINTE;
        const txt = v && v.t !== undefined ? v.t : v;
        if (sp.links) c += T(sp.x, y, txt, "F3", 7.5, col);
        else c += TR(sp.x, y, txt, "F3", 7.5, col);
      });
      c += LN(M, y + 4, RE, 0.35);
      y += 14;
    });
    if (fuss) {
      c += BOX(M, y - 10, RE - M, 15, FLAECHE);
      spalten.forEach((sp, i) => {
        const v = fuss[i];
        if (v === undefined || v === null) return;
        if (sp.links) c += T(sp.x, y, v, "F4", 7.5, TINTE);
        else c += TR(sp.x, y, v, "F4", 7.5, TINTE);
      });
      y += 16;
    }
    return y + 6;
  };

  const spaltenSatz = (titel, ersteBreite, anzahl) => {
    const rest = (RE - M - ersteBreite) / anzahl;
    return titel.map((t, i) =>
      i === 0
        ? { t, x: M, links: true }
        : { t, x: M + ersteBreite + rest * i }
    );
  };

  /* ---- Seite 1: Überblick ---- */
  neueSeite();
  let y = 78;
  c += T(M, y, s.projektName || "Investitionsberechnung", "F2", 21, TINTE);
  y += 20;
  const zeile2 = [s.standort, s.kundeName ? "für " + s.kundeName : "",
    "Stand " + new Date().toLocaleDateString("de-DE")].filter(Boolean).join("   ·   ");
  c += T(M, y, zeile2, "F1", 9, GRAU);
  y += 26;

  const kzBreite = (RE - M - 30) / 4;
  const kzDaten = [
    ["Eigenkapital", eur(r.eigenkapital) + " EUR", TINTE],
    ["Aufwand p. M. nach Steuern", eur(r.aufwandPM) + " EUR", r.aufwandPM > 0 ? ROT : AKZ],
    ["Steuerersparnis kumuliert", eur(r.kumSteuerersparnis) + " EUR", TINTE],
    ["Überschuss " + s.endJahr, eur(r.ueberschuss) + " EUR", AKZ],
  ];
  kzDaten.forEach((k, i) => {
    const x = M + i * (kzBreite + 10);
    c += BOX(x, y, kzBreite, 52, FLAECHE);
    c += T(x + 10, y + 17, k[0], "F1", 6.8, GRAU);
    c += T(x + 10, y + 37, k[1], "F4", 11.5, k[2]);
  });
  y += 76;

  const spalteB = M + (RE - M) / 2 + 12;
  const halb = (RE - M) / 2 - 12;
  let yl = abschnitt(y, "Kosten und Finanzierung");
  const yStart = yl;
  yl = paar(yl, M, halb, "Kaufpreis Wohnung", eur(s.kaufpreis));
  yl = paar(yl, M, halb, "Stellplatz", eur(s.stellplatzPreis));
  yl = paar(yl, M, halb, "Grunderwerbsteuer " + pct(s.grestSatz) + " %", eur(r.grest));
  yl = paar(yl, M, halb, "Notar und Gericht", eur(r.notar));
  yl = paar(yl, M, halb, "Vermittlung und Beratung", eur(r.beratung));
  yl = paar(yl, M, halb, "Gesamtkosten", eur(r.gesamtkosten), true);
  yl = paar(yl, M, halb, "Eigenkapital", eur(r.eigenkapital));
  yl = paar(yl, M, halb, "Darlehensbedarf", eur(r.darlehensbedarf), true);
  s.darlehen.forEach((d) =>
    (yl = paar(yl, M, halb, d.name + " · " + pct(d.zins) + " % / " + pct(d.tilgung) + " %", eur(d.betrag)))
  );

  c += T(spalteB, y, "Steuer und Abschreibung", "F2", 10.5, TINTE);
  c += LN(spalteB, y + 6, RE, 0.8, "0.78 0.82 0.86");
  let yr = yStart;
  yr = paar(yr, spalteB, halb, "Zu versteuerndes Einkommen", eur(s.zvE));
  yr = paar(yr, spalteB, halb, "Veranlagung", s.splitting ? "zusammen" : "einzeln");
  yr = paar(yr, spalteB, halb, "Tarifjahr / Anpassung", s.tarifJahr + " / " + pct(s.tarifAnpassung) + " %");
  yr = paar(yr, spalteB, halb, "Einkommensteuer " + s.startJahr, eur(profil.est));
  yr = paar(yr, spalteB, halb, "Solidaritätszuschlag", eur(profil.soli));
  yr = paar(yr, spalteB, halb, "Kirchensteuer", eur(profil.kirche));
  yr = paar(yr, spalteB, halb, "Steuer gesamt", eur(profil.gesamt), true);
  yr = paar(yr, spalteB, halb, "Grenzsteuersatz", pct(grenz) + " %");
  yr = paar(yr, spalteB, halb,
    s.degressiv ? "Grundlage degressive AfA" : "Grundlage lineare AfA", eur(r.bmgDegressiv), true);
  if (s.sonder7b) yr = paar(yr, spalteB, halb, "Grundlage Sonder-AfA § 7b", eur(r.bmg7b), true);

  y = Math.max(yl, yr) + 14;
  y = abschnitt(y, "Annahmen");
  const annahmen = [
    ["Wohnfläche", eur2(s.wohnflaeche) + " m²"],
    ["Kaltmiete ab " + s.vermietungJahr, eur2(s.wohnflaeche * s.mieteProQm + s.stellplatzMiete) + " EUR/Monat"],
    ["Mietsteigerung", pct(s.mietSteigerung) + " % alle " + s.mietIntervall + " Jahre ab " + s.mietSteigerungAb],
    ["Bewirtschaftung", eur(s.verwaltungWEG + s.verwaltungSE + s.sonstigeKosten) + " EUR/Jahr"],
    ["Erhaltungsrücklage", eur2(s.ruecklageProQm) + " EUR/m²/Monat"],
    ["Kostensteigerung", pct(s.kostenSteigerung) + " % p. a."],
    ["Wertsteigerung", pct(s.wertSteigerung) + " % p. a. ab " + s.wertSteigerungAb],
    ["Tilgungszuschuss", eur(s.zuschussBetrag) + " EUR (" + s.zuschussMonat + "/" + s.zuschussJahr + ")"],
  ];
  annahmen.forEach((a, i) => {
    const x = i % 2 === 0 ? M : spalteB;
    if (i % 2 === 0 && i > 0) y += 0;
    const zy = y + Math.floor(i / 2) * 15;
    c += T(x, zy, a[0], "F1", 8.5, GRAU);
    c += TR(x + halb, zy, a[1], "F3", 8.5, TINTE);
    c += LN(x, zy + 4.5, x + halb, 0.4);
  });
  y += Math.ceil(annahmen.length / 2) * 15 + 10;

  /* ---- Seite 2: Liquidität ---- */
  neueSeite();
  y = 78;
  y = abschnitt(y, "Liquidität je Jahr");
  const sp1 = spaltenSatz(
    ["Jahr", "Zinsen", "Tilgung", "Rücklage", "Verwaltung", "Miete", "Ersparnis", "p. a.", "p. M."],
    34, 8
  );
  y = tabelle(
    y, sp1,
    r.zeilen.map((z) => [
      String(z.jahr),
      z.zinsen ? eur(z.zinsen) : "-",
      z.tilgung ? eur(z.tilgung) : "-",
      z.ruecklage ? eur(z.ruecklage) : "-",
      z.verwaltung ? eur(z.verwaltung) : "-",
      z.miete ? eur(z.miete) : "-",
      z.ersparnis ? eur(z.ersparnis) : "-",
      { t: eur(z.aufwandNachSteuern), col: z.aufwandNachSteuern > 0 ? ROT : AKZ },
      { t: eur(z.aufwandNachSteuern / 12), col: z.aufwandNachSteuern > 0 ? ROT : AKZ },
    ]),
    ["Summe",
     eur(r.zeilen.reduce((a, z) => a + z.zinsen, 0)),
     eur(r.zeilen.reduce((a, z) => a + z.tilgung, 0)),
     eur(r.zeilen.reduce((a, z) => a + z.ruecklage, 0)),
     eur(r.zeilen.reduce((a, z) => a + z.verwaltung, 0)),
     eur(r.zeilen.reduce((a, z) => a + z.miete, 0)),
     eur(r.kumSteuerersparnis),
     eur(r.kumAufwandNachSteuern), ""]
  );
  y += 8;
  y = absatz(y,
    "Positive Werte sind Eigenaufwand, negative Werte ein Überschuss. Die Tilgung enthält den Tilgungszuschuss, der nicht aus eigenen Mitteln aufgebracht wird. Die Erhaltungsrücklage mindert die Liquidität, aber nicht das steuerliche Ergebnis.");

  /* ---- Seite 3: Steuer und AfA ---- */
  neueSeite();
  y = 78;
  y = abschnitt(y, "Steuerwirkung");
  const sp2 = spaltenSatz(
    ["Jahr", "zvE", "ESt", "Soli", "KiSt", "AfA", "Erg. V+V", "zvE neu", "St. neu", "Erspar."],
    30, 9
  );
  y = tabelle(y, sp2, r.zeilen.map((z) => [
    String(z.jahr), eur(z.zvE), eur(z.estAlt),
    z.soliAlt ? eur(z.soliAlt) : "-", z.kircheAlt ? eur(z.kircheAlt) : "-",
    z.afa ? eur(z.afa) : "-",
    { t: eur(z.ergebnis), col: z.ergebnis < 0 ? ROT : TINTE },
    eur(z.zvENeu), eur(z.steuerNeu), z.ersparnis ? eur(z.ersparnis) : "-",
  ]));
  y += 14;
  y = abschnitt(y, "Abschreibung und Restschuld");
  const sp3 = spaltenSatz(
    ["Jahr", s.degressiv ? "Degressive AfA" : "Lineare AfA", "Sonder-AfA § 7b", "AfA gesamt", "Restschuld"],
    40, 4
  );
  y = tabelle(y, sp3, r.zeilen.map((z) => [
    String(z.jahr),
    z.afaNormal ? eur(z.afaNormal) : "-",
    z.afaSonder ? eur(z.afaSonder) : "-",
    z.afa ? eur(z.afa) : "-",
    z.restschuld ? eur(z.restschuld) : "-",
  ]));

  /* ---- Seite 4: Vermögen ---- */
  neueSeite();
  y = 78;
  y = abschnitt(y, "Vermögensbetrachtung " + s.endJahr);
  y = paar(y, M, RE - M, "Verkehrswert bei " + pct(s.wertSteigerung) + " % p. a.", eur(r.immobilienwert));
  y = paar(y, M, RE - M, "abzüglich Restschuld", "-" + eur(r.restschuldEnde));
  y = paar(y, M, RE - M, "abzüglich Eigenkapital", "-" + eur(r.eigenkapital));
  y = paar(y, M, RE - M, "abzüglich Liquiditätsbedarf vor Steuern", "-" + eur(r.kumAufwandVorSteuern));
  y = paar(y, M, RE - M, "zuzüglich Steuerersparnis", "+" + eur(r.kumSteuerersparnis));
  y = paar(y, M, RE - M, "Überschuss", eur(r.ueberschuss), true);
  y += 10;
  c += BOX(M, y, RE - M, 44, FLAECHE);
  c += T(M + 14, y + 18, "Interne Verzinsung des eingesetzten Kapitals nach Steuern", "F1", 8.5, GRAU);
  c += T(M + 14, y + 34, r.irr === null ? "nicht bestimmbar" : pct(r.irr) + " % p. a.", "F4", 12, AKZ);
  y += 62;

  y = abschnitt(y, "Hinweise");
  y = absatz(y,
    "Die Einkommensteuer folgt dem Tarif des § 32a EStG in der Fassung für " + s.tarifJahr +
    ", bei Zusammenveranlagung nach § 32a Abs. 5 EStG. Der Solidaritätszuschlag wird mit Freigrenze und Milderungszone berücksichtigt, die Kirchensteuer auf die um Kinderfreibeträge geminderte Bemessungsgrundlage. Bei einer Tarifanpassung von 0 % entsprechen die Beträge des Tarifjahres denen des amtlichen BMF-Steuerrechners.");
  y += 6;
  y = absatz(y,
    "Ein Verkauf innerhalb von zehn Jahren nach Anschaffung löst nach § 23 EStG einen steuerpflichtigen Veräußerungsgewinn aus; er ist in dieser Rechnung nicht berücksichtigt. Ebenfalls nicht berücksichtigt sind Mietausfälle, Instandhaltungen über die Rücklage hinaus und Kosten einer Anschlussfinanzierung über den angenommenen Zins hinaus.");
  y += 6;
  absatz(y,
    "Unverbindliche Modellrechnung. Sie ersetzt keine Steuerberatung. Die tatsächliche Entwicklung von Miete, Zins und Verkehrswert kann erheblich abweichen.");

  seiten.push(c);

  /* ---- Fußzeilen und Dateiaufbau ---- */
  const inhalte = seiten.map((inhalt, i) => {
    let f = LN(M, H - 52, RE, 0.6);
    f += T(M, H - 38, "Unverbindliche Modellrechnung", "F1", 7, GRAU);
    f += TR(RE, H - 38, "Seite " + (i + 1) + " von " + seiten.length, "F3", 7, GRAU);
    return inhalt + f;
  });

  const objekte = [];
  const anzahl = inhalte.length;
  const seitenIds = inhalte.map((_, i) => 3 + i * 2);
  objekte.push(`<< /Type /Catalog /Pages 2 0 R >>`);
  objekte.push(
    `<< /Type /Pages /Kids [${seitenIds.map((id) => id + " 0 R").join(" ")}] /Count ${anzahl} >>`
  );
  const fontStart = 3 + anzahl * 2;
  inhalte.forEach((inhalt, i) => {
    objekte.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W.toFixed(2)} ${H.toFixed(2)}] ` +
      `/Resources << /Font << /F1 ${fontStart} 0 R /F2 ${fontStart + 1} 0 R /F3 ${fontStart + 2} 0 R /F4 ${fontStart + 3} 0 R >> >> ` +
      `/Contents ${4 + i * 2} 0 R >>`
    );
    objekte.push(`<< /Length ${inhalt.length} >>\nstream\n${inhalt}\nendstream`);
  });
  [["Helvetica"], ["Helvetica-Bold"], ["Courier"], ["Courier-Bold"]].forEach(([n]) =>
    objekte.push(`<< /Type /Font /Subtype /Type1 /BaseFont /${n} /Encoding /WinAnsiEncoding >>`)
  );

  let datei = "%PDF-1.4\n%\u00E2\u00E3\u00CF\u00D3\n";
  const offsets = [0];
  objekte.forEach((o, i) => {
    offsets.push(datei.length);
    datei += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = datei.length;
  datei += `xref\n0 ${objekte.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objekte.length; i++)
    datei += String(offsets[i]).padStart(10, "0") + " 00000 n \n";
  datei += `trailer\n<< /Size ${objekte.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

  const bytes = new Uint8Array(datei.length);
  for (let i = 0; i < datei.length; i++) bytes[i] = datei.charCodeAt(i) & 0xff;
  return bytes;
}

/* ---------- Startwerte ---------- */

const START = {
  projektName: "",
  standort: "",
  kundeName: "",

  splitting: true,
  steuerklasse: "III",
  kirchensteuer: 0,
  kinderfreibetraege: 0,
  soli: true,
  tarifJahr: 2026,
  tarifAnpassung: 0,
  zvE: 100000,
  einkommenSteigerung: 1,

  kaufpreis: 296400,
  stellplatzPreis: 15000,
  gebaeudeAnteil: 80,
  wohnflaeche: 53.93,
  bgf: 61.52,
  grestSatz: 6.5,
  notarSatz: 2.0,
  beratungSatz: 4.76,

  startJahr: 2026,
  fertigJahr: 2027,
  fertigMonat: 12,
  vermietungJahr: 2028,
  vermietungMonat: 1,
  endJahr: 2038,

  mieteProQm: 16.7,
  stellplatzMiete: 70,
  mietSteigerung: 2,
  mietIntervall: 2,
  mietSteigerungAb: 2030,

  verwaltungWEG: 360,
  verwaltungSE: 360,
  sonstigeKosten: 100,
  ruecklageProQm: 0.4,
  kostenSteigerung: 2,
  kostenSteigerungAb: 2028,

  darlehenBeginn: 2028,
  eigenkapital: 41292,
  darlehen: [
    { name: "KfW 261", betrag: 150000, zins: 2.89, tilgung: 1.75, zinsbindung: 10, anschlusszins: 3.5 },
    { name: "Bankdarlehen", betrag: 161400, zins: 3.84, tilgung: 1.0, zinsbindung: 10, anschlusszins: 3.0 },
  ],
  zuschussBetrag: 37500,
  zuschussJahr: 2028,
  zuschussMonat: 8,
  zuschussDarlehen: 0,

  degressiv: true,
  degressivSatz: 5,
  linearSatz: 3,
  sonder7b: true,
  sonder7bSatz: 5,
  sonder7bJahre: 4,
  max7bProQm: 4000,

  wertSteigerung: 2,
  wertSteigerungAb: 2028,
};

/* ---------- Bausteine ---------- */

function Feld({ label, wert, onChange, suffix, hinweis }) {
  const [roh, setRoh] = useState(null);
  const anzeige = roh !== null ? roh : String(wert).replace(".", ",");
  return (
    <label className="feld">
      <span className="feld-label">{label}</span>
      <span className="feld-eingabe">
        <input
          inputMode="decimal"
          value={anzeige}
          onChange={(e) => {
            setRoh(e.target.value);
            const v = parseFloat(e.target.value.replace(/\./g, "").replace(",", "."));
            onChange(isNaN(v) ? 0 : v);
          }}
          onBlur={() => setRoh(null)}
        />
        {suffix && <span className="suffix">{suffix}</span>}
      </span>
      {hinweis && <span className="feld-hinweis">{hinweis}</span>}
    </label>
  );
}

function TextFeld({ label, wert, onChange, platzhalter, hinweis }) {
  return (
    <label className="feld">
      <span className="feld-label">{label}</span>
      <span className="feld-eingabe">
        <input
          className="textfeld"
          type="text"
          value={wert}
          placeholder={platzhalter}
          onChange={(e) => onChange(e.target.value)}
        />
      </span>
      {hinweis && <span className="feld-hinweis">{hinweis}</span>}
    </label>
  );
}

function Wahl({ label, wert, onChange, optionen, hinweis }) {
  return (
    <label className="feld">
      <span className="feld-label">{label}</span>
      <span className="feld-eingabe">
        <select value={wert} onChange={(e) => onChange(e.target.value)}>
          {optionen.map((o) => (
            <option key={o.v} value={o.v}>{o.t}</option>
          ))}
        </select>
      </span>
      {hinweis && <span className="feld-hinweis">{hinweis}</span>}
    </label>
  );
}

function Segment({ label, wert, onChange, optionen }) {
  return (
    <div className="feld">
      <span className="feld-label">{label}</span>
      <div className="segment">
        {optionen.map((o) => (
          <button
            key={o.v}
            className={String(wert) === String(o.v) ? "aktiv" : ""}
            onClick={() => onChange(o.v)}
          >
            {o.t}
          </button>
        ))}
      </div>
    </div>
  );
}

function Schalter({ label, wert, onChange, hinweis }) {
  return (
    <label className="schalter">
      <input type="checkbox" checked={wert} onChange={(e) => onChange(e.target.checked)} />
      <span className="knopf" aria-hidden="true" />
      <span className="schalter-text">
        {label}
        {hinweis && <em>{hinweis}</em>}
      </span>
    </label>
  );
}

function Gruppe({ titel, kennung, kinder, offenStd = true }) {
  const [offen, setOffen] = useState(offenStd);
  return (
    <section className={"gruppe" + (offen ? " offen" : "")}>
      <button className="gruppe-kopf" onClick={() => setOffen(!offen)}>
        <span className="kennung">{kennung}</span>
        <span className="gruppe-titel">{titel}</span>
        <span className="pfeil">{offen ? "−" : "+"}</span>
      </button>
      {offen && <div className="gruppe-inhalt">{kinder}</div>}
    </section>
  );
}

/* ---------- Liquiditätsband ---------- */

function Liquiditaetsband({ zeilen }) {
  if (!zeilen.length)
    return <p className="leer">Kein Jahr im Betrachtungszeitraum.</p>;

  const maxAus = Math.max(1, ...zeilen.map((z) => Math.max(z.aufwandVorSteuern, 0)));
  const maxEin = Math.max(1, ...zeilen.map((z) => Math.max(-z.aufwandNachSteuern, 0)));
  const skala = Math.max(maxAus, maxEin);
  const obenH = (maxEin / skala) * 44 + 6;
  const untenH = 104 - obenH;
  const breite = 100 / zeilen.length;

  return (
    <div className="band">
      <div className="band-kopf">
        <h2>Liquidität im Zeitverlauf</h2>
        <span className="band-hinweis">je Jahr, nach Steuern</span>
      </div>
      <svg viewBox="0 0 100 110" preserveAspectRatio="none" className="band-svg">
        <line x1="0" y1={obenH} x2="100" y2={obenH} className="achse" />
        {zeilen.map((z, i) => {
          const x = i * breite + breite * 0.22;
          const bw = breite * 0.56;
          const brutto = Math.max(0, z.aufwandVorSteuern);
          const netto = z.aufwandNachSteuern;
          if (netto >= 0) {
            const hGes = (brutto / skala) * untenH;
            const hNet = (Math.max(0, netto) / skala) * untenH;
            return (
              <g key={z.jahr}>
                <rect x={x} y={obenH} width={bw} height={Math.max(0.5, hGes)} className="bar-steuer" />
                <rect x={x} y={obenH} width={bw} height={Math.max(0.5, hNet)} className="bar-aus" />
              </g>
            );
          }
          const h = (Math.abs(netto) / skala) * (obenH - 4);
          return (
            <rect key={z.jahr} x={x} y={obenH - Math.max(0.5, h)} width={bw}
              height={Math.max(0.5, h)} className="bar-ein" />
          );
        })}
      </svg>
      <div className="band-jahre">
        {zeilen.map((z) => <span key={z.jahr}>{String(z.jahr).slice(2)}</span>)}
      </div>
      <div className="legende">
        <span><i className="pkt aus" />Eigenaufwand nach Steuern</span>
        <span><i className="pkt steuer" />durch Steuerersparnis gedeckt</span>
        <span><i className="pkt ein" />Überschuss</span>
      </div>
    </div>
  );
}

/* ---------- Vermögenskurve ---------- */

function Vermoegenskurve({ zeilen, s }) {
  const punkte = zeilen.map((z) => {
    const jahre = Math.max(0, z.jahr - s.wertSteigerungAb + 1);
    const wert = (s.kaufpreis + s.stellplatzPreis) * Math.pow(1 + s.wertSteigerung / 100, jahre);
    return { jahr: z.jahr, wert, schuld: z.restschuld };
  });
  const n = punkte.length;
  if (n < 2) return <p className="leer">Für eine Kurve werden mindestens zwei Jahre benötigt.</p>;
  const max = Math.max(...punkte.map((p) => p.wert)) * 1.06;
  const px = (i) => (i / (n - 1)) * 100;
  const py = (v) => 100 - (v / max) * 100;
  const linie = (key) => punkte.map((p, i) => `${i === 0 ? "M" : "L"}${px(i)},${py(p[key])}`).join(" ");
  const flaeche =
    linie("wert") + ` L100,${py(punkte[n - 1].schuld)} ` +
    punkte.slice().reverse().map((p, i) => `L${px(n - 1 - i)},${py(p.schuld)}`).join(" ") + " Z";
  return (
    <div className="kurve">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d={flaeche} className="fl-eigen" />
        <path d={linie("wert")} className="ln-wert" />
        <path d={linie("schuld")} className="ln-schuld" />
      </svg>
      <div className="legende">
        <span><i className="pkt ein" />Verkehrswert</span>
        <span><i className="pkt aus" />Restschuld</span>
        <span><i className="pkt eigen" />Eigenanteil</span>
      </div>
    </div>
  );
}

/* ---------- App ---------- */

export default function App() {
  const [s, setS] = useState(START);
  const [tab, setTab] = useState("liquiditaet");
  const [hell, setHell] = useState(false);

  const set = (k) => (v) => setS((alt) => ({ ...alt, [k]: v }));
  const setDarlehen = (i, k) => (v) =>
    setS((alt) => ({
      ...alt,
      darlehen: alt.darlehen.map((x, j) => (j === i ? { ...x, [k]: v } : x)),
    }));

  const r = useMemo(() => berechne(s), [s]);
  const profil = useMemo(() => steuerDetail(s.zvE, s, s.startJahr), [s]);
  const grenz = useMemo(() => grenzsteuersatz(s.zvE, s, s.startJahr), [s]);

  const schnittPM = r.aufwandPM;

  const dateiname = (endung) =>
    ((s.projektName || "immobilien-berechnung").toLowerCase()
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "berechnung") + endung;

  const lade = (blob, name) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const pdf = () => {
    const bytes = pdfDatei(s, r, profil, grenz);
    lade(new Blob([bytes], { type: "application/pdf" }), dateiname(".pdf"));
  };

  const csv = () => {
    const kopf = ["Jahr","Zinsen","Tilgung","Erhaltungsruecklage","Verwaltung","Mieteinnahmen",
      "AfA","Steuerl. Ergebnis","Steuerersparnis","Aufwand p.a.","Aufwand p.m.","Restschuld"];
    const zeilen = r.zeilen.map((z) =>
      [z.jahr, z.zinsen, z.tilgung, z.ruecklage, z.verwaltung, z.miete, z.afa, z.ergebnis,
       z.ersparnis, z.aufwandNachSteuern, z.aufwandNachSteuern / 12, z.restschuld]
        .map((v, i) => (i === 0 ? v : Math.round(v))).join(";")
    );
    const blob = new Blob(["\ufeff" + [kopf.join(";"), ...zeilen].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    lade(blob, dateiname(".csv"));
  };

  return (
    <div className={"app" + (hell ? " hell" : "")}>
      <style>{CSS}</style>

      <div className="huelle">
        <header className="kopf">
          <div className="leiste">
            <span className="marke">
              <span className="marke-punkt" />
              Investitionsrechner
            </span>
            <button className="thema" onClick={() => setHell(!hell)}>
              {hell ? "Dunkel" : "Hell"}
            </button>
          </div>
          <h1 className={s.projektName ? "" : "titel-leer"}>
            {s.projektName || "Projekt benennen"}
          </h1>
          <div className="kopf-meta">
            {s.standort && <span>{s.standort}</span>}
            {s.kundeName && <span>für {s.kundeName}</span>}
            <span className="mono">{s.startJahr}–{s.endJahr}</span>
          </div>
        </header>

        <div className="raster">
          {/* -------- Eingaben -------- */}
          <aside className="eingaben">
            <Gruppe
              titel="Projekt"
              kennung="Proj"
              kinder={
                <>
                  <TextFeld label="Projektname" wert={s.projektName} onChange={set("projektName")}
                    platzhalter="z. B. Neubau Musterstraße, WE 03" />
                  <TextFeld label="Standort" wert={s.standort} onChange={set("standort")}
                    platzhalter="z. B. 24119 Kiel" />
                  <TextFeld label="Kundin oder Kunde" wert={s.kundeName} onChange={set("kundeName")}
                    platzhalter="Name für die Berechnung" />
                </>
              }
            />

            <Gruppe
              titel="Steuer"
              kennung="ESt"
              kinder={
                <>
                  <Segment
                    label="Veranlagung"
                    wert={s.splitting ? "j" : "n"}
                    onChange={(v) => set("splitting")(v === "j")}
                    optionen={[
                      { v: "j", t: "Zusammen" },
                      { v: "n", t: "Einzeln" },
                    ]}
                  />
                  <Feld label="Zu versteuerndes Einkommen" wert={s.zvE} onChange={set("zvE")} suffix="€/Jahr" />
                  <Feld label="Einkommenssteigerung" wert={s.einkommenSteigerung}
                    onChange={set("einkommenSteigerung")} suffix="% p. a." />
                  <Wahl
                    label="Lohnsteuerklasse"
                    wert={s.steuerklasse}
                    onChange={set("steuerklasse")}
                    optionen={["I","II","III","IV","IV+F","V","VI"].map((v) => ({ v, t: "Klasse " + v }))}
                    hinweis="Nur für den Lohnsteuerabzug; die Jahressteuer folgt der Veranlagung"
                  />
                  <Wahl
                    label="Tarifjahr"
                    wert={String(s.tarifJahr)}
                    onChange={(v) => set("tarifJahr")(Number(v))}
                    optionen={[{ v: "2026", t: "2026" }, { v: "2025", t: "2025" }]}
                  />
                  <Feld label="Tarifanpassung" wert={s.tarifAnpassung} onChange={set("tarifAnpassung")}
                    suffix="% p. a." hinweis="Verschiebt die Eckwerte für Folgejahre. 0 % hält den Tarif fest wie im BMF-Rechner." />
                  <Wahl
                    label="Kirchensteuer"
                    wert={String(s.kirchensteuer)}
                    onChange={(v) => set("kirchensteuer")(Number(v))}
                    optionen={[
                      { v: "0", t: "keine" },
                      { v: "8", t: "8 % (BY, BW)" },
                      { v: "9", t: "9 % (übrige Länder)" },
                    ]}
                  />
                  <Feld label="Kinderfreibeträge" wert={s.kinderfreibetraege}
                    onChange={set("kinderfreibetraege")} suffix="Anzahl"
                    hinweis="Mindert die Bemessung für Soli und Kirchensteuer" />
                  <Schalter label="Solidaritätszuschlag" wert={s.soli} onChange={set("soli")}
                    hinweis={`5,5 % mit Milderungszone, Freigrenze ${eur(
                      (TARIFE[s.tarifJahr] || TARIFE[2026]).soliFreigrenze * (s.splitting ? 2 : 1)
                    )} € Einkommensteuer`} />

                  <div className="profil">
                    <div className="profil-kopf">
                      Steuer {s.startJahr} nach § 32a EStG
                      <span>Vergleich: bmf-steuerrechner.de</span>
                    </div>
                    <dl>
                      <div><dt>Einkommensteuer</dt><dd>{eur(profil.est)} €</dd></div>
                      <div><dt>Solidaritätszuschlag</dt><dd>{eur(profil.soli)} €</dd></div>
                      <div><dt>Kirchensteuer</dt><dd>{eur(profil.kirche)} €</dd></div>
                      <div className="stark"><dt>Gesamt</dt><dd>{eur(profil.gesamt)} €</dd></div>
                    </dl>
                    <div className="saetze">
                      <span>Ø {pct(s.zvE > 0 ? (profil.gesamt / s.zvE) * 100 : 0)} %</span>
                      <span>Grenzsatz {pct(grenz)} %</span>
                    </div>
                  </div>
                </>
              }
            />

            <Gruppe
              titel="Objekt und Nebenkosten"
              kennung="Obj"
              offenStd={false}
              kinder={
                <>
                  <Feld label="Kaufpreis Wohnung" wert={s.kaufpreis} onChange={set("kaufpreis")} suffix="€" />
                  <Feld label="Kaufpreis Stellplatz" wert={s.stellplatzPreis} onChange={set("stellplatzPreis")} suffix="€" />
                  <Feld label="Gebäudeanteil" wert={s.gebaeudeAnteil} onChange={set("gebaeudeAnteil")} suffix="%"
                    hinweis={`Gebäude ${eur(r.gebaeude)} € · Grund und Boden ${eur(r.grundstueck)} €`} />
                  <Feld label="Wohnfläche" wert={s.wohnflaeche} onChange={set("wohnflaeche")} suffix="m²" />
                  <Feld label="Bruttogrundfläche" wert={s.bgf} onChange={set("bgf")} suffix="m²" />
                  <Feld label="Grunderwerbsteuer" wert={s.grestSatz} onChange={set("grestSatz")} suffix="%" hinweis={`${eur(r.grest)} €`} />
                  <Feld label="Notar und Grundbuch" wert={s.notarSatz} onChange={set("notarSatz")} suffix="%" hinweis={`${eur(r.notar)} €`} />
                  <Feld label="Vermittlung / Beratung" wert={s.beratungSatz} onChange={set("beratungSatz")} suffix="%" hinweis={`${eur(r.beratung)} €`} />
                </>
              }
            />

            <Gruppe
              titel="Zeitachse"
              kennung="Zeit"
              offenStd={false}
              kinder={
                <>
                  <Feld label="Erstes Berechnungsjahr" wert={s.startJahr} onChange={set("startJahr")} />
                  <Feld label="Fertigstellung Jahr" wert={s.fertigJahr} onChange={set("fertigJahr")} />
                  <Feld label="Fertigstellung Monat" wert={s.fertigMonat} onChange={set("fertigMonat")}
                    hinweis="Steuert die zeitanteilige AfA im ersten Jahr" />
                  <Feld label="Vermietung ab Jahr" wert={s.vermietungJahr} onChange={set("vermietungJahr")} />
                  <Feld label="Vermietung ab Monat" wert={s.vermietungMonat} onChange={set("vermietungMonat")} />
                  <Feld label="Betrachtung bis" wert={s.endJahr} onChange={set("endJahr")} />
                </>
              }
            />

            <Gruppe
              titel="Finanzierung"
              kennung="Fin"
              offenStd={false}
              kinder={
                <>
                  <Feld
                    label="Eigenkapital"
                    wert={s.eigenkapital}
                    onChange={set("eigenkapital")}
                    suffix="€"
                    hinweis={`Gesamtkosten ${eur(r.gesamtkosten)} € · Darlehensbedarf ${eur(r.darlehensbedarf)} €`}
                  />
                  <div className={"deckung" + (Math.abs(r.deckungslücke) < 1 ? " ok" : "")}>
                    <span>
                      {Math.abs(r.deckungslücke) < 1
                        ? "Darlehen decken den Bedarf genau"
                        : r.deckungslücke > 0
                        ? `Es fehlen ${eur(r.deckungslücke)} € Darlehen`
                        : `${eur(-r.deckungslücke)} € Darlehen zu viel`}
                    </span>
                    {Math.abs(r.deckungslücke) >= 1 && s.darlehen.length > 0 && (
                      <button
                        className="mini"
                        onClick={() =>
                          setS((alt) => {
                            const i = alt.darlehen.length - 1;
                            return {
                              ...alt,
                              darlehen: alt.darlehen.map((d, j) =>
                                j === i
                                  ? { ...d, betrag: Math.max(0, Math.round(d.betrag + r.deckungslücke)) }
                                  : d
                              ),
                            };
                          })
                        }
                      >
                        ausgleichen
                      </button>
                    )}
                  </div>
                  <Feld label="Auszahlung der Darlehen ab" wert={s.darlehenBeginn} onChange={set("darlehenBeginn")} />
                  {s.darlehen.map((d, i) => (
                    <div className="darlehen" key={i}>
                      <div className="darlehen-kopf">
                        <input className="darlehen-name" value={d.name}
                          onChange={(e) => setDarlehen(i, "name")(e.target.value)} />
                        {s.darlehen.length > 1 && (
                          <button className="mini" onClick={() =>
                            setS((alt) => ({
                              ...alt,
                              darlehen: alt.darlehen.filter((_, j) => j !== i),
                              zuschussDarlehen: 0,
                            }))
                          }>entfernen</button>
                        )}
                      </div>
                      <div className="darlehen-felder">
                        <Feld label="Betrag" wert={d.betrag} onChange={setDarlehen(i, "betrag")} suffix="€" />
                        <Feld label="Sollzins" wert={d.zins} onChange={setDarlehen(i, "zins")} suffix="%" />
                        <Feld label="Anfangstilgung" wert={d.tilgung} onChange={setDarlehen(i, "tilgung")} suffix="%" />
                        <Feld label="Zinsbindung" wert={d.zinsbindung} onChange={setDarlehen(i, "zinsbindung")} suffix="Jahre" />
                        <Feld label="Anschlusszins" wert={d.anschlusszins} onChange={setDarlehen(i, "anschlusszins")} suffix="%" />
                      </div>
                    </div>
                  ))}
                  <button className="hinzu" onClick={() =>
                    setS((alt) => ({
                      ...alt,
                      darlehen: [...alt.darlehen,
                        { name: "Weiteres Darlehen", betrag: 50000, zins: 3.8, tilgung: 2, zinsbindung: 10, anschlusszins: 4 }],
                    }))
                  }>Darlehen hinzufügen</button>
                  <div className="trenner">Tilgungszuschuss</div>
                  <Feld label="Zuschuss" wert={s.zuschussBetrag} onChange={set("zuschussBetrag")} suffix="€"
                    hinweis="Mindert die Anschaffungskosten und wird als Sondertilgung verrechnet" />
                  <Feld label="Auszahlung im Jahr" wert={s.zuschussJahr} onChange={set("zuschussJahr")} />
                  <Feld label="Auszahlung im Monat" wert={s.zuschussMonat} onChange={set("zuschussMonat")} />
                  <Wahl label="Verrechnet mit" wert={String(s.zuschussDarlehen)}
                    onChange={(v) => set("zuschussDarlehen")(Number(v))}
                    optionen={s.darlehen.map((d, i) => ({ v: String(i), t: d.name }))} />
                </>
              }
            />

            <Gruppe
              titel="Abschreibung"
              kennung="AfA"
              offenStd={false}
              kinder={
                <>
                  <Schalter label="Degressive AfA § 7 Abs. 5a EStG" wert={s.degressiv} onChange={set("degressiv")}
                    hinweis="Fester Satz vom jeweiligen Restwert" />
                  {s.degressiv
                    ? <Feld label="Degressiver Satz" wert={s.degressivSatz} onChange={set("degressivSatz")} suffix="%" />
                    : <Feld label="Linearer Satz" wert={s.linearSatz} onChange={set("linearSatz")} suffix="%" />}
                  <Schalter label="Sonderabschreibung § 7b EStG" wert={s.sonder7b} onChange={set("sonder7b")}
                    hinweis="Zusätzlich in den ersten Jahren, ohne Zeitanteil im Fertigstellungsjahr" />
                  {s.sonder7b && (
                    <>
                      <Feld label="Satz je Jahr" wert={s.sonder7bSatz} onChange={set("sonder7bSatz")} suffix="%" />
                      <Feld label="Begünstigungszeitraum" wert={s.sonder7bJahre} onChange={set("sonder7bJahre")} suffix="Jahre" />
                      <Feld label="Kappung je m² BGF" wert={s.max7bProQm} onChange={set("max7bProQm")} suffix="€/m²" />
                    </>
                  )}
                </>
              }
            />

            <Gruppe
              titel="Miete, Kosten, Wert"
              kennung="Bew"
              offenStd={false}
              kinder={
                <>
                  <Feld label="Miete je m²" wert={s.mieteProQm} onChange={set("mieteProQm")} suffix="€" />
                  <Feld label="Miete Stellplatz" wert={s.stellplatzMiete} onChange={set("stellplatzMiete")} suffix="€/Monat"
                    hinweis={`Kaltmiete gesamt ${eur2(s.wohnflaeche * s.mieteProQm + s.stellplatzMiete)} €/Monat`} />
                  <Feld label="Mietsteigerung" wert={s.mietSteigerung} onChange={set("mietSteigerung")} suffix="%" />
                  <Feld label="Intervall" wert={s.mietIntervall} onChange={set("mietIntervall")} suffix="Jahre" />
                  <Feld label="Erstmals ab" wert={s.mietSteigerungAb} onChange={set("mietSteigerungAb")} />
                  <div className="trenner">Nicht umlagefähige Kosten</div>
                  <Feld label="Verwaltung WEG" wert={s.verwaltungWEG} onChange={set("verwaltungWEG")} suffix="€/Jahr" />
                  <Feld label="Verwaltung Sondereigentum" wert={s.verwaltungSE} onChange={set("verwaltungSE")} suffix="€/Jahr" />
                  <Feld label="Sonstige Kosten" wert={s.sonstigeKosten} onChange={set("sonstigeKosten")} suffix="€/Jahr" />
                  <Feld label="Erhaltungsrücklage" wert={s.ruecklageProQm} onChange={set("ruecklageProQm")} suffix="€/m²/Monat"
                    hinweis="Liquiditätswirksam, steuerlich erst bei Verausgabung" />
                  <Feld label="Kostensteigerung" wert={s.kostenSteigerung} onChange={set("kostenSteigerung")} suffix="% p. a." />
                  <Feld label="Kostensteigerung ab" wert={s.kostenSteigerungAb} onChange={set("kostenSteigerungAb")} />
                  <div className="trenner">Wertentwicklung</div>
                  <Feld label="Wertsteigerung" wert={s.wertSteigerung} onChange={set("wertSteigerung")} suffix="% p. a." />
                  <Feld label="Wertsteigerung ab" wert={s.wertSteigerungAb} onChange={set("wertSteigerungAb")} />
                </>
              }
            />

            <button className="reset" onClick={() =>
              setS({ ...START, projektName: s.projektName, standort: s.standort, kundeName: s.kundeName })
            }>Beispielwerte wiederherstellen</button>
          </aside>

          {/* -------- Ergebnis -------- */}
          <main className="ergebnis">
            <div className="kennzahlen">
              <div className="kz">
                <span className="kz-label">Eigenkapital</span>
                <span className="kz-wert">{eur(r.eigenkapital)} €</span>
                <span className="kz-fuss">Gesamtkosten {eur(r.gesamtkosten)} €</span>
              </div>
              <div className="kz">
                <span className="kz-label">Eigenaufwand nach Steuern</span>
                <span className={"kz-wert " + (schnittPM > 0 ? "aus" : "ein")}>
                  {schnittPM > 0 ? "" : "+"}{eur(-schnittPM)} €
                </span>
                <span className="kz-fuss">im Monat, Ø ab Vermietung</span>
              </div>
              <div className="kz">
                <span className="kz-label">Steuerersparnis</span>
                <span className="kz-wert steuer">{eur(r.kumSteuerersparnis)} €</span>
                <span className="kz-fuss">kumuliert {s.startJahr}–{s.endJahr}</span>
              </div>
              <div className="kz betont">
                <span className="kz-label">Vermögensüberschuss {s.endJahr}</span>
                <span className="kz-wert">{eur(r.ueberschuss)} €</span>
                <span className="kz-fuss">interne Verzinsung {r.irr === null ? "–" : pct(r.irr) + " %"}</span>
              </div>
            </div>

            <Liquiditaetsband zeilen={r.zeilen.filter((z) => z.jahr >= s.fertigJahr)} />

            <nav className="reiter">
              {[["liquiditaet","Liquidität"],["steuer","Steuerwirkung"],["kosten","Kosten und AfA"],["vermoegen","Vermögen"]]
                .map(([k, t]) => (
                  <button key={k} className={tab === k ? "aktiv" : ""} onClick={() => setTab(k)}>{t}</button>
                ))}
              <span className="export">
                <button className="pdf" onClick={pdf}>PDF</button>
                <button className="csv" onClick={csv}>CSV</button>
              </span>
            </nav>

            {tab === "liquiditaet" && (
              <div className="tafel">
                <table>
                  <thead>
                    <tr>
                      <th>Jahr</th><th>Zinsen</th><th>Tilgung</th><th>Rücklage</th>
                      <th>Verwaltung</th><th>Miete</th><th>Steuerersparnis</th>
                      <th>Aufwand p. a.</th><th>p. M.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.zeilen.map((z) => (
                      <tr key={z.jahr}>
                        <td className="jahr">{z.jahr}</td>
                        <td>{z.zinsen ? eur(z.zinsen) : "–"}</td>
                        <td>{z.tilgung ? eur(z.tilgung) : "–"}
                          {z.sondertilgung > 0 && <em className="marke-txt">inkl. Zuschuss</em>}</td>
                        <td>{z.ruecklage ? eur(z.ruecklage) : "–"}</td>
                        <td>{z.verwaltung ? eur(z.verwaltung) : "–"}</td>
                        <td>{z.miete ? eur(z.miete) : "–"}</td>
                        <td className="steuer">{z.ersparnis ? eur(z.ersparnis) : "–"}</td>
                        <td className={z.aufwandNachSteuern > 0 ? "aus" : "ein"}>{eur(z.aufwandNachSteuern)}</td>
                        <td className={z.aufwandNachSteuern > 0 ? "aus" : "ein"}>{eur(z.aufwandNachSteuern / 12)}</td>
                      </tr>
                    ))}
                    <tr className="summe">
                      <td>Σ</td>
                      <td>{eur(r.zeilen.reduce((a, z) => a + z.zinsen, 0))}</td>
                      <td>{eur(r.zeilen.reduce((a, z) => a + z.tilgung, 0))}</td>
                      <td>{eur(r.zeilen.reduce((a, z) => a + z.ruecklage, 0))}</td>
                      <td>{eur(r.zeilen.reduce((a, z) => a + z.verwaltung, 0))}</td>
                      <td>{eur(r.zeilen.reduce((a, z) => a + z.miete, 0))}</td>
                      <td className="steuer">{eur(r.kumSteuerersparnis)}</td>
                      <td>{eur(r.kumAufwandNachSteuern)}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {tab === "steuer" && (
              <div className="tafel">
                <table>
                  <thead>
                    <tr>
                      <th>Jahr</th><th>zvE</th><th>ESt</th><th>Soli</th><th>KiSt</th>
                      <th>AfA</th><th>Ergebnis V+V</th><th>zvE neu</th>
                      <th>Steuer neu</th><th>Ersparnis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.zeilen.map((z) => (
                      <tr key={z.jahr}>
                        <td className="jahr">{z.jahr}</td>
                        <td>{eur(z.zvE)}</td>
                        <td>{eur(z.estAlt)}</td>
                        <td>{z.soliAlt ? eur(z.soliAlt) : "–"}</td>
                        <td>{z.kircheAlt ? eur(z.kircheAlt) : "–"}</td>
                        <td>{z.afa ? eur(z.afa) : "–"}</td>
                        <td className={z.ergebnis < 0 ? "aus" : ""}>{eur(z.ergebnis)}</td>
                        <td>{eur(z.zvENeu)}</td>
                        <td>{eur(z.steuerNeu)}</td>
                        <td className="steuer">{z.ersparnis ? eur(z.ersparnis) : "–"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="fussnote">
                  Einkommensteuer nach dem Tarif {s.tarifJahr}, Splitting nach § 32a Abs. 5 EStG,
                  Solidaritätszuschlag mit Freigrenze und Milderungszone, Kirchensteuer auf die um
                  Kinderfreibeträge geminderte Bemessungsgrundlage. Bei Tarifanpassung 0 % ergeben
                  sich für das Tarifjahr dieselben Beträge wie im BMF-Steuerrechner. Die
                  Erhaltungsrücklage mindert die Liquidität, aber nicht das steuerliche Ergebnis.
                </p>
              </div>
            )}

            {tab === "kosten" && (
              <div className="tafel">
                <div className="bloecke">
                  <div className="block">
                    <h3>Kosten- und Darlehensbedarf</h3>
                    <dl>
                      <div><dt>Kaufpreis Wohnung</dt><dd>{eur(s.kaufpreis)} €</dd></div>
                      <div><dt>Stellplatz</dt><dd>{eur(s.stellplatzPreis)} €</dd></div>
                      <div><dt>Grunderwerbsteuer {pct(s.grestSatz)} %</dt><dd>{eur(r.grest)} €</dd></div>
                      <div><dt>Notar und Gericht</dt><dd>{eur(r.notar)} €</dd></div>
                      <div><dt>Vermittlung / Beratung</dt><dd>{eur(r.beratung)} €</dd></div>
                      <div className="stark"><dt>Gesamtkosten</dt><dd>{eur(r.gesamtkosten)} €</dd></div>
                      <div><dt>abzüglich Eigenkapital</dt><dd>− {eur(r.eigenkapital)} €</dd></div>
                      <div className="stark"><dt>Darlehensbedarf</dt><dd>{eur(r.darlehensbedarf)} €</dd></div>
                      <div><dt>eingetragene Darlehen</dt><dd>{eur(r.darlehenSumme)} €</dd></div>
                      {Math.abs(r.deckungslücke) >= 1 && (
                        <div><dt>Differenz</dt><dd>{eur(r.deckungslücke)} €</dd></div>
                      )}
                    </dl>
                  </div>
                  <div className="block">
                    <h3>Bemessungsgrundlagen</h3>
                    <dl>
                      <div><dt>Gebäude inkl. Stellplatz</dt><dd>{eur(r.gebaeude)} €</dd></div>
                      <div><dt>anteilige Nebenkosten ({pct(r.quote * 100)} %)</dt>
                        <dd>{eur((r.grest + r.notar + r.beratung) * r.quote)} €</dd></div>
                      <div><dt>abzüglich Zuschuss</dt><dd>{eur(s.zuschussBetrag)} €</dd></div>
                      <div className="stark"><dt>Grundlage {s.degressiv ? "degressive" : "lineare"} AfA</dt>
                        <dd>{eur(r.bmgDegressiv)} €</dd></div>
                      {s.sonder7b && (
                        <>
                          <div><dt>Herstellungskosten abzgl. Zuschuss</dt><dd>{eur(r.bmg7bRoh)} €</dd></div>
                          <div><dt>Kappung {eur(s.max7bProQm)} €/m² × {eur2(s.bgf)} m²</dt><dd>{eur(r.kappung)} €</dd></div>
                          <div className="stark"><dt>Grundlage § 7b EStG</dt><dd>{eur(r.bmg7b)} €</dd></div>
                        </>
                      )}
                    </dl>
                  </div>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Jahr</th><th>{s.degressiv ? "Degressive AfA" : "Lineare AfA"}</th>
                      <th>Sonder-AfA § 7b</th><th>AfA gesamt</th><th>Restschuld</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.zeilen.map((z) => (
                      <tr key={z.jahr}>
                        <td className="jahr">{z.jahr}</td>
                        <td>{z.afaNormal ? eur(z.afaNormal) : "–"}</td>
                        <td>{z.afaSonder ? eur(z.afaSonder) : "–"}</td>
                        <td>{z.afa ? eur(z.afa) : "–"}</td>
                        <td>{z.restschuld ? eur(z.restschuld) : "–"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === "vermoegen" && (
              <div className="tafel">
                <Vermoegenskurve zeilen={r.zeilen.filter((z) => z.jahr >= s.fertigJahr)} s={s} />
                <dl className="bilanz">
                  <div><dt>Verkehrswert {s.endJahr} bei {pct(s.wertSteigerung)} % p. a.</dt><dd>{eur(r.immobilienwert)} €</dd></div>
                  <div><dt>abzüglich Restschuld</dt><dd>− {eur(r.restschuldEnde)} €</dd></div>
                  <div><dt>abzüglich Eigenkapital</dt><dd>− {eur(r.eigenkapital)} €</dd></div>
                  <div><dt>abzüglich Liquiditätsbedarf vor Steuern</dt><dd>− {eur(r.kumAufwandVorSteuern)} €</dd></div>
                  <div><dt>zuzüglich Steuerersparnis</dt><dd>+ {eur(r.kumSteuerersparnis)} €</dd></div>
                  <div className="stark"><dt>Überschuss</dt><dd>{eur(r.ueberschuss)} €</dd></div>
                </dl>
                <p className="fussnote">
                  Interne Verzinsung des eingesetzten Kapitals nach Steuern:{" "}
                  {r.irr === null ? "nicht bestimmbar" : pct(r.irr) + " %"}. Ein Verkauf innerhalb
                  von zehn Jahren nach Anschaffung löst nach § 23 EStG einen steuerpflichtigen
                  Veräußerungsgewinn aus; er ist hier nicht berücksichtigt.
                </p>
              </div>
            )}

            <p className="haftung">
              Unverbindliche Modellrechnung. Sie ersetzt keine Steuerberatung, und die tatsächliche
              Entwicklung von Miete, Zins und Wert kann erheblich abweichen.
            </p>
          </main>
        </div>
      </div>
    </div>
  );
}

/* ---------- Gestaltung ---------- */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');

.app {
  --bg: #0A1017;
  --karte: #121C26;
  --karte-2: #16212D;
  --sunk: #0E1720;
  --line: #22303D;
  --text: #E9F0F4;
  --muted: #8397A6;
  --akzent: #4FE0B0;
  --akzent-weich: rgba(79,224,176,.14);
  --aus: #FF9270;
  --steuer: #F5C86E;
  --steuer-weich: rgba(245,200,110,.32);
  --eigen: rgba(79,224,176,.18);
  --schatten: 0 24px 60px -34px rgba(0,0,0,.9);
  --font-d: 'Space Grotesk', 'Segoe UI', sans-serif;
  --font-b: 'IBM Plex Sans', system-ui, sans-serif;
  --font-m: 'IBM Plex Mono', ui-monospace, monospace;
  background:
    radial-gradient(1100px 520px at 12% -10%, rgba(79,224,176,.10), transparent 60%),
    radial-gradient(900px 460px at 92% 4%, rgba(120,150,255,.10), transparent 62%),
    var(--bg);
  color: var(--text);
  font-family: var(--font-b);
  min-height: 100%;
  -webkit-font-smoothing: antialiased;
}
.app.hell {
  --bg: #F3F5F8;
  --karte: #FFFFFF;
  --karte-2: #FFFFFF;
  --sunk: #F2F5F8;
  --line: #E2E8EE;
  --text: #101A24;
  --muted: #6B7C8B;
  --akzent: #0E9B78;
  --akzent-weich: rgba(14,155,120,.10);
  --aus: #C25334;
  --steuer: #B98A28;
  --steuer-weich: rgba(185,138,40,.26);
  --eigen: rgba(14,155,120,.14);
  --schatten: 0 18px 40px -30px rgba(16,26,36,.55);
  background:
    radial-gradient(900px 460px at 10% -12%, rgba(14,155,120,.10), transparent 60%),
    var(--bg);
}
.app * { box-sizing: border-box; }
.app ::placeholder { color: var(--muted); opacity: .65; }
.app ::selection { background: var(--akzent); color: #06121B; }

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
.gruppe.offen .pfeil { background: var(--akzent); border-color: var(--akzent); color: #06121B; }
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
.segment button.aktiv { background: var(--akzent); color: #06121B; font-weight: 600; }

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
  background: linear-gradient(155deg, var(--akzent) 0%, #1FB790 55%, #0F8F72 100%);
  border-color: transparent; color: #05131B;
}
.kz.betont .kz-label, .kz.betont .kz-fuss { color: rgba(5,19,27,.72); }
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
.reiter button.aktiv { background: var(--akzent); color: #06121B; font-weight: 600; }
.export { margin-left: auto; display: flex; gap: 6px; }
.reiter .pdf {
  font-family: var(--font-m); font-size: 11.5px; background: var(--akzent);
  color: #06121B; font-weight: 600;
}
.reiter .pdf:hover { background: var(--akzent); color: #06121B; filter: brightness(1.08); }
.deckung {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  font-size: 11.5px; color: var(--aus); background: var(--sunk);
  border: 1px solid var(--line); border-radius: 11px; padding: 10px 12px;
}
.deckung.ok { color: var(--akzent); }
.reiter .csv { margin-left: 0; font-family: var(--font-m); font-size: 11.5px; border: 1px solid var(--line); }

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

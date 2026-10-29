/* Rechenkern: Steuer (§ 32a EStG), AfA, Finanzierung, Veräußerung. Keine UI. */
/* ============================================================
   Immobilien-Investitionsrechner
   Steuerteil nach dem amtlichen Tarif des § 32a EStG,
   Soli und Kirchensteuer wie im BMF-Steuerrechner
   ============================================================ */

export const TARIFE = {
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
export function estGrundtabelle(zvE, t) {
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
export function estTariflich(zvE, t, splitting) {
  return splitting
    ? 2 * estGrundtabelle(Math.floor(zvE) / 2, t)
    : estGrundtabelle(zvE, t);
}

/* Solidaritätszuschlag: 5,5 %, Freigrenze und Milderungszone 11,9 % */
export function soliBetrag(bemessung, freigrenze) {
  if (bemessung <= freigrenze) return 0;
  return Math.min(bemessung * 0.055, (bemessung - freigrenze) * 0.119);
}

/*
   Tarifverschiebung: werden die Eckwerte jährlich um f angehoben,
   gilt T_f(x) = f · T(x / f). Bei 0 % bleibt der Tarif eingefroren.
*/
export function tarifFaktor(s, jahr) {
  const n = Math.max(0, jahr - s.tarifJahr);
  return Math.pow(1 + s.tarifAnpassung / 100, n);
}

export function steuerDetail(zvE, s, jahr) {
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

export function steuerlast(zvE, s, jahr) {
  return steuerDetail(zvE, s, jahr).gesamt;
}

export function grenzsteuersatz(zvE, s, jahr) {
  const d = 100;
  return ((steuerlast(zvE + d, s, jahr) - steuerlast(zvE, s, jahr)) / d) * 100;
}

/* ---------- Darlehen ---------- */

export function tilgeDarlehen(d, vonJahr, bisJahr, sonder) {
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

export function berechne(s) {
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

  const anteiligeNebenkosten = (grest + notar + beratung) * quote;
  const gebaeudeKostenGesamt = Math.max(0, gebaeude + anteiligeNebenkosten - zuschuss);
  const istDenkmal = s.gebaeudeart === "denkmal";

  // Neubau: Grundlagen für degressive/lineare AfA und § 7b
  const bmgDegressiv = istDenkmal ? 0 : gebaeudeKostenGesamt;
  const bmg7bRoh = istDenkmal ? 0 : Math.max(0, gebaeude - zuschuss);
  const kappung = s.bgf * s.max7bProQm;
  const bmg7b = !istDenkmal && s.sonder7b ? Math.min(bmg7bRoh, kappung) : 0;

  // Neubau: gesetzliches Fenster der degressiven AfA (§ 7 Abs. 5a EStG), 1.10.2023–30.9.2029
  const kvDatum = s.kaufvertragJahr + (s.kaufvertragMonat - 1) / 12;
  const degressivMoeglich = kvDatum >= 2023 + 9 / 12 && kvDatum <= 2029 + 9 / 12;

  // Denkmal: Aufteilung in Modernisierung (§ 7h/§ 7i) und Altbausubstanz (linear)
  const denkmalModernisierung = istDenkmal
    ? Math.max(0, gebaeudeKostenGesamt * (s.denkmalSanierungsanteil / 100))
    : 0;
  const denkmalAltbau = istDenkmal
    ? Math.max(0, gebaeudeKostenGesamt - denkmalModernisierung)
    : 0;

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
  const startJahr = s.fertigJahr;
  const ersterAnteil = (13 - s.fertigMonat) / 12;

  if (!istDenkmal) {
    // Neubau: degressive oder lineare AfA + optional Sonder-AfA § 7b
    let restwert = bmgDegressiv;
    let sonderKumuliert = 0;
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
  } else {
    // Denkmal: § 7h/§ 7i auf die Modernisierung (zwei Zeitphasen), Altbausubstanz linear
    for (let jahr = startJahr; jahr <= bis; jahr++) {
      const jIndex = jahr - startJahr;
      let denkmalAfa = 0;
      if (jIndex < s.denkmalJahre1) denkmalAfa = denkmalModernisierung * (s.denkmalSatz1 / 100);
      else if (jIndex < s.denkmalJahre1 + s.denkmalJahre2)
        denkmalAfa = denkmalModernisierung * (s.denkmalSatz2 / 100);

      let altbauAfa = denkmalAltbau * (s.denkmalAltbauSatz / 100);
      if (jahr === startJahr) altbauAfa *= ersterAnteil;

      afaProJahr[jahr] = { normal: altbauAfa, sonder: denkmalAfa, gesamt: altbauAfa + denkmalAfa };
    }
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

  // Veräußerung: unabhängig vom Betrachtungsende zu jedem beliebigen Jahr durchspielbar
  let veraeusserung = null;
  if (s.veraeusserungAktiv) {
    const vJahr = s.veraeusserungJahr;
    const jahreWertV = Math.max(0, vJahr - s.wertSteigerungAb + 1);
    const verkaufspreis = kaufGesamt * Math.pow(1 + s.wertSteigerung / 100, jahreWertV);
    const verkaufskosten = verkaufspreis * (s.verkaufskostenSatz / 100);

    const zeileV = zeilen.find((z) => z.jahr === vJahr);
    const restschuldV = zeileV
      ? zeileV.restschuld
      : vJahr > bis
      ? letzte.restschuld
      : vJahr < startJahr
      ? darlehenSumme
      : 0;

    let kumAfaBisV = 0;
    for (let j = startJahr; j <= Math.min(vJahr, bis); j++)
      if (afaProJahr[j]) kumAfaBisV += afaProJahr[j].gesamt;

    const buchwert = Math.max(0, gesamtkosten - kumAfaBisV);
    const veraeusserungsgewinn = verkaufspreis - verkaufskosten - buchwert;

    const monateGehalten =
      vJahr * 12 + s.veraeusserungMonat - (s.kaufvertragJahr * 12 + s.kaufvertragMonat);
    const spekulationspflichtig = monateGehalten < 120;
    const steuerpflichtig = spekulationspflichtig && veraeusserungsgewinn >= 600;

    const zvEimVerkaufsjahr = zeileV ? zeileV.zvE : s.zvE;
    const spekulationssteuer = steuerpflichtig
      ? steuerlast(zvEimVerkaufsjahr + veraeusserungsgewinn, s, vJahr) -
        steuerlast(zvEimVerkaufsjahr, s, vJahr)
      : 0;

    const nettoerloes = verkaufspreis - verkaufskosten - restschuldV - spekulationssteuer;

    veraeusserung = {
      jahr: vJahr, verkaufspreis, verkaufskosten, restschuld: restschuldV, buchwert,
      gewinn: veraeusserungsgewinn, monateGehalten, spekulationspflichtig, steuerpflichtig,
      steuer: spekulationssteuer, nettoerloes,
    };
  }

  const jahreAktiv = zeilen.filter((z) => z.jahr >= s.vermietungJahr).length || 1;
  const aufwandPM = kumAufwandNachSteuern / jahreAktiv / 12;

  const irrFlows = [-eigenkapital, ...cashflows];
  irrFlows[irrFlows.length - 1] += immobilienwert - letzte.restschuld;

  return {
    kaufGesamt, grest, notar, beratung, gesamtkosten, darlehenSumme, eigenkapital,
    darlehensbedarf, deckungslücke,
    gebaeude, grundstueck, quote, bmgDegressiv, bmg7b, bmg7bRoh, kappung,
    degressivMoeglich, denkmalModernisierung, denkmalAltbau, gebaeudeKostenGesamt,
    zeilen, kumSteuerersparnis, kumAufwandVorSteuern, kumAufwandNachSteuern, aufwandPM,
    immobilienwert, restschuldEnde: letzte.restschuld, ueberschuss, veraeusserung,
    irr: berechneIRR(irrFlows),
  };
}

export function berechneIRR(flows) {
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

export const eur = (n) =>
  (n === null || n === undefined || isNaN(n) ? 0 : Math.round(n)).toLocaleString("de-DE");
export const eur2 = (n) =>
  (isNaN(n) ? 0 : n).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const pct = (n) =>
  (isNaN(n) || n === null ? 0 : n).toLocaleString("de-DE", {
    minimumFractionDigits: 1, maximumFractionDigits: 1,
  });

/* ---------- PDF-Ausgabe ---------- */

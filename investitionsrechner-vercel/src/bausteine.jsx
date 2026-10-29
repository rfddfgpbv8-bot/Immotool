import React, { useState } from "react";
import { eur, eur2, pct } from "./rechenkern";

export function Feld({ label, wert, onChange, suffix, hinweis }) {
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

export function TextFeld({ label, wert, onChange, platzhalter, hinweis }) {
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

export function Wahl({ label, wert, onChange, optionen, hinweis }) {
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

export function Segment({ label, wert, onChange, optionen }) {
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

export function Schalter({ label, wert, onChange, hinweis }) {
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

export function Gruppe({ titel, kennung, kinder, offenStd = true }) {
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

export function Liquiditaetsband({ zeilen }) {
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

export function Vermoegenskurve({ zeilen, s }) {
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


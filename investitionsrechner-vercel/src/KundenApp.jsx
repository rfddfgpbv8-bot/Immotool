import React, { useState, useMemo, useEffect } from "react";
import { supabase, supabaseKonfiguriert } from "./supabaseClient";
import { eur, pct } from "./rechenkern";
import {
  PROJEKTE, KUNDEN_STANDARD, PLATZHALTER_AKTIV, MARKE,
  projektVon, einheitVon, ekVorschlag, kundenErgebnis,
} from "./projekte";
import { KFW_VORLAGEN } from "./vorlagen";
import { KUNDEN_CSS } from "./kundenStyles";

const euro = (n) => eur(n) + " €";
const zahlDe = (n) => String(n).replace(".", ",");
const prozent2 = (n) => n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* Monatsbetrag: positiv = Sie zahlen, negativ = es bleibt etwas übrig */
function monat(n) {
  const r = Math.round(n);
  if (r === 0) return { text: "0 €", minus: false, wort: "ausgeglichen" };
  return r > 0
    ? { text: euro(r), minus: true, wort: "zahlen Sie pro Monat dazu" }
    : { text: euro(-r), minus: false, wort: "bleiben pro Monat übrig" };
}

/* ---------- kleine Eingabebausteine ---------- */

function Zahl({ label, wert, onChange, einheit, hinweis, min = 0, max = 1e9, id }) {
  const [roh, setRoh] = useState(null);
  const anzeige = roh !== null ? roh : eur(wert);
  const parse = (t) => {
    const n = parseFloat(t.replace(/\./g, "").replace(",", "."));
    return isNaN(n) ? null : Math.min(max, Math.max(min, n));
  };
  return (
    <label className="feld" htmlFor={id}>
      <span className="feld-label">{label}</span>
      <span className="eingabe-zeile">
        <input
          id={id} type="text" inputMode="decimal" value={anzeige}
          onFocus={() => setRoh(String(Math.round(wert)))}
          onChange={(e) => {
            setRoh(e.target.value);
            const n = parse(e.target.value);
            if (n !== null) onChange(n);
          }}
          onBlur={() => setRoh(null)}
        />
        {einheit && <span className="einheit">{einheit}</span>}
      </span>
      {hinweis && <span className="feld-hinweis">{hinweis}</span>}
    </label>
  );
}

function Regler({ label, wert, onChange, min, max, schritt, anzeige, id }) {
  return (
    <div className="feld">
      <div className="regler-kopf">
        <label className="feld-label" htmlFor={id}>{label}</label>
        <span className="regler-wert">{anzeige}</span>
      </div>
      <input id={id} type="range" min={min} max={max} step={schritt} value={wert}
        onChange={(e) => onChange(parseFloat(e.target.value))} />
    </div>
  );
}

function Segment({ label, wert, onChange, optionen }) {
  return (
    <div className="feld" role="group" aria-label={label}>
      <span className="feld-label">{label}</span>
      <div className="segment">
        {optionen.map(([k, text]) => (
          <button key={k} type="button" aria-pressed={wert === k} onClick={() => onChange(k)}>{text}</button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Diagramm: monatlicher Aufwand je Jahr ---------- */

function Monatsdiagramm({ zeilen }) {
  if (!zeilen.length) return null;
  const werte = zeilen.map((z) => z.aufwandNachSteuern / 12);
  const lo = Math.min(0, ...werte);
  const hi = Math.max(0, ...werte);
  const spanne = Math.max(100, hi - lo);
  const B = 560, H = 200, oben = 14, unten = 24, links = 6;
  const nutz = H - oben - unten;
  const yWert = (v) => oben + ((hi - v) / spanne) * nutz;
  const yNull = yWert(0);
  const breite = (B - links) / zeilen.length;
  const balken = Math.min(34, breite * 0.62);
  return (
    <figure className="diagramm" style={{ margin: 0 }}>
      <h3>Monatlicher Aufwand nach Steuern</h3>
      <p>Je Jahr: Was Sie monatlich aus eigener Tasche zahlen oder was übrig bleibt.</p>
      <svg viewBox={`0 0 ${B} ${H}`} role="img"
        aria-label="Balkendiagramm des monatlichen Aufwands nach Steuern je Jahr">
        {zeilen.map((z, i) => {
          const w = werte[i];
          const y1 = yWert(w);
          const x = links + i * breite + (breite - balken) / 2;
          return (
            <g key={z.jahr}>
              <rect x={x} y={Math.min(y1, yNull)} width={balken} height={Math.max(1, Math.abs(y1 - yNull))}
                rx="2" fill={w > 0 ? "var(--balken-zahlen)" : "var(--balken-uebrig)"}>
                <title>{z.jahr}: {w > 0 ? "zahlen Sie " : "bleiben "}{euro(Math.abs(w))} pro Monat</title>
              </rect>
              <text x={x + balken / 2} y={H - 8} textAnchor="middle">{String(z.jahr).slice(2)}</text>
            </g>
          );
        })}
        <line x1={links} x2={B} y1={yNull} y2={yNull} stroke="var(--linie-stark)" strokeWidth="1" />
      </svg>
      <div className="legende">
        <span><i style={{ background: "var(--balken-zahlen)" }} />Sie zahlen dazu</span>
        <span><i style={{ background: "var(--balken-uebrig)" }} />Es bleibt etwas übrig</span>
      </div>
    </figure>
  );
}

/* ---------- Symbole für die Vertrauensleiste ---------- */

const Symbol = ({ name }) => {
  const pfade = {
    schild: <><path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" /><path d="M9 12l2.2 2.2L15.5 10" /></>,
    liste: <><path d="M8 7h11M8 12h11M8 17h11" /><path d="M4 7h.01M4 12h.01M4 17h.01" /></>,
    schloss: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></>,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {pfade[name]}
    </svg>
  );
};

/* ---------- Seite ---------- */

export default function KundenApp() {
  const [e, setE] = useState(KUNDEN_STANDARD);
  const [thema, setThema] = useState("hell");
  const setzen = (k) => (v) => setE((alt) => ({ ...alt, [k]: v }));

  const projekt = projektVon(e.projektId);
  const einheit = einheitVon(projekt, e.einheitId);
  const erg = useMemo(() => kundenErgebnis(e), [e]);
  const hero = useMemo(() => kundenErgebnis(KUNDEN_STANDARD), []);
  const kfwVorlage = KFW_VORLAGEN.find((v) => v.id === projekt.kfwId);
  const vorschlag = ekVorschlag(projekt, einheit);

  const waehleProjekt = (id) => {
    const p = projektVon(id);
    setE((alt) => ({ ...alt, projektId: p.id, einheitId: p.einheiten[0].id, eigenkapital: null }));
  };
  const waehleEinheit = (id) => setE((alt) => ({ ...alt, einheitId: id, eigenkapital: null }));

  const springe = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };

  /* ---- feste Ergebnisleiste auf dem Handy ---- */
  const [leiste, setLeiste] = useState(false);
  useEffect(() => {
    const rechnerEl = document.getElementById("rechner");
    const ergebnisEl = document.getElementById("ergebnis");
    if (!rechnerEl || !ergebnisEl || !("IntersectionObserver" in window)) return;
    const zustand = { rechner: false, ergebnis: false };
    const aktualisieren = () => setLeiste(zustand.rechner && !zustand.ergebnis);
    const io = new IntersectionObserver((eintraege) => {
      eintraege.forEach((x) => { zustand[x.target.id] = x.isIntersecting; });
      aktualisieren();
    }, { threshold: 0.05 });
    io.observe(rechnerEl); io.observe(ergebnisEl);
    return () => io.disconnect();
  }, []);

  /* ---- Anmeldung (Kundenzugang) ---- */
  const [session, setSession] = useState(null);
  const [loginOffen, setLoginOffen] = useState(false);
  const [loginMail, setLoginMail] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [loginFehler, setLoginFehler] = useState("");
  const [loginLaedt, setLoginLaedt] = useState(false);
  const istTeam = session?.user?.app_metadata?.rolle === "team";

  useEffect(() => {
    if (!supabaseKonfiguriert) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: h } = supabase.auth.onAuthStateChange((_ev, sess) => setSession(sess));
    return () => h.subscription.unsubscribe();
  }, []);

  async function anmelden(ev) {
    ev.preventDefault();
    setLoginFehler(""); setLoginLaedt(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: loginMail, password: loginPw });
    setLoginLaedt(false);
    if (error) { setLoginFehler("E-Mail oder Passwort stimmt nicht."); return; }
    setLoginOffen(false); setLoginPw("");
    if (data.user?.app_metadata?.rolle === "team") window.location.href = "/team";
  }

  /* ---- gespeicherte Berechnungen (nur mit Kundenzugang) ---- */
  const [gespeichert, setGespeichert] = useState([]);
  const [speicherName, setSpeicherName] = useState("");
  const [speicherStatus, setSpeicherStatus] = useState("");

  async function listeLaden() {
    if (!session) return;
    const { data } = await supabase.from("berechnungen")
      .select("id, name, updated_at").eq("art", "kunde").order("updated_at", { ascending: false });
    setGespeichert(data || []);
  }
  useEffect(() => { if (session) listeLaden(); else setGespeichert([]); }, [session]);

  async function speichern() {
    const name = speicherName.trim();
    if (!name) return;
    setSpeicherStatus("speichert …");
    const { error } = await supabase.from("berechnungen")
      .insert({ user_id: session.user.id, name, art: "kunde", data: e });
    setSpeicherStatus(error ? "Speichern hat nicht geklappt." : "Gespeichert.");
    if (!error) { setSpeicherName(""); listeLaden(); }
    setTimeout(() => setSpeicherStatus(""), 2500);
  }
  async function laden(id) {
    const { data } = await supabase.from("berechnungen").select("data").eq("id", id).single();
    if (data?.data) { setE({ ...KUNDEN_STANDARD, ...data.data }); springe("rechner"); }
  }
  async function loeschen(id) {
    await supabase.from("berechnungen").delete().eq("id", id);
    listeLaden();
  }

  /* ---- Anfrage ---- */
  const [anliegen, setAnliegen] = useState("berechnung");
  const [mitBerechnung, setMitBerechnung] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", telefon: "", nachricht: "", website: "", zustimmung: false });
  const [status, setStatus] = useState({ art: "leer", text: "" });
  const setF = (k) => (ev) =>
    setForm((alt) => ({ ...alt, [k]: ev.target.type === "checkbox" ? ev.target.checked : ev.target.value }));

  const berechnungSenden = () => { setAnliegen("berechnung"); setMitBerechnung(true); springe("anfrage"); };

  async function absenden(ev) {
    ev.preventDefault();
    setStatus({ art: "laedt", text: "Wird gesendet …" });
    const { s, r, v, vermoegen } = erg;
    const berechnung = mitBerechnung ? {
      eingaben: e,
      projekt: projekt.name, adresse: projekt.adresse, wohnung: einheit.bezeichnung,
      beispielwerte: PLATZHALTER_AKTIV,
      ergebnis: {
        gesamtkosten: Math.round(r.gesamtkosten), eigenkapital: Math.round(r.eigenkapital),
        darlehen: Math.round(r.darlehenSumme),
        monatlichNachSteuern: Math.round(r.aufwandPM),
        steuerersparnis: Math.round(r.kumSteuerersparnis),
        vermoegenNachVerkauf: Math.round(vermoegen),
        renditeProzent: r.irr == null ? null : Math.round(r.irr * 10) / 10,
        verkaufsJahr: s.veraeusserungJahr,
      },
    } : null;
    try {
      const antwort = await fetch("/api/anfrage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anliegen, name: form.name, email: form.email, telefon: form.telefon,
          nachricht: form.nachricht, website: form.website,
          zustimmung: form.zustimmung, berechnung,
        }),
      });
      const daten = await antwort.json().catch(() => ({}));
      if (!antwort.ok) throw new Error(daten.fehler || "Senden fehlgeschlagen.");
      setStatus({ art: "ok", text: "Danke. Ihre Anfrage ist angekommen. Wir melden uns bei Ihnen." });
      setForm({ name: "", email: "", telefon: "", nachricht: "", website: "", zustimmung: false });
    } catch (fehler) {
      setStatus({
        art: "fehler",
        text: (fehler.message || "Senden fehlgeschlagen.") +
          " Sie erreichen uns auch direkt unter " + MARKE.mail + ".",
      });
    }
  }

  /* ---- abgeleitete Anzeigewerte ---- */
  const { s, r, v, vermoegen, kfwDarlehen, bankDarlehen } = erg;
  const pmErg = monat(r.aufwandPM);
  const heroPm = monat(hero.r.aufwandPM);
  const zeilenAnzeige = r.zeilen.filter((z) => z.jahr >= s.fertigJahr);

  return (
    <div className="jb" data-theme={thema}>
      <style>{KUNDEN_CSS}</style>

      {PLATZHALTER_AKTIV && (
        <div className="band-hinweis">
          <div className="huelle">
            Die hinterlegten Preise, Flächen und Mieten sind derzeit Beispielwerte. Verbindliche Angaben erhalten Sie von Ihrem Berater.
          </div>
        </div>
      )}

      <header className="nav">
        <div className="huelle nav-innen">
          <a className="marke" href="#top" aria-label={MARKE.name + " – Startseite"}>
            <img className="logo-hell" src="/logo-violet.svg" alt="" height="42" />
            <img className="logo-dunkel" src="/logo-white.svg" alt="" height="42" />
          </a>
          <nav className="nav-links" aria-label="Hauptnavigation">
            <a href="#projekte">Projekte</a>
            <a href="#rechner">Rechner</a>
            <a href="#ablauf">Ablauf</a>
            <a href="#fragen">Fragen</a>
          </nav>
          <div className="nav-rechts">
            <button className="knopf leise klein nav-text" type="button" onClick={() => setThema(thema === "hell" ? "dunkel" : "hell")}
              aria-label="Darstellung wechseln">{thema === "hell" ? "Dunkel" : "Hell"}</button>
            {supabaseKonfiguriert && (session ? (
              <>
                {istTeam && <a className="knopf leise klein" href="/team">Teamansicht</a>}
                <button className="knopf leise klein nav-text" type="button" onClick={() => supabase.auth.signOut()}>Abmelden</button>
              </>
            ) : (
              <button className="knopf leise klein nav-text" type="button" onClick={() => setLoginOffen(true)}>Kundenzugang</button>
            ))}
            <button className="knopf klein" style={{ gap: 0 }} type="button" onClick={() => springe("anfrage")}>Anfrage<span className="nur-gross">&nbsp;stellen</span></button>
          </div>
        </div>
      </header>

      <main id="top">
        {/* ---------- Hero ---------- */}
        <section className="hero">
          <div className="huelle hero-raster">
            <div>
              <p className="eyebrow">Investitionsrechner</p>
              <h1>
                <span>Rechnen Sie Ihre Kapitalanlage durch.</span>
                <span className="leicht">Bevor Sie entscheiden.</span>
              </h1>
              <p className="hero-text">
                Wählen Sie ein Projekt, tragen Sie Einkommen und Eigenkapital ein und sehen Sie,
                was die Wohnung nach Steuern, Zins und Tilgung monatlich kostet und was am Ende
                an Vermögen bleibt.
              </p>
              <div className="hero-aktionen">
                <button className="knopf" type="button" onClick={() => springe("rechner")}>Jetzt durchrechnen</button>
                <button className="knopf leise" type="button" onClick={() => springe("anfrage")}>Beratung anfragen</button>
              </div>
              <ul className="hero-punkte">
                <li>Steuerwirkung nach dem Einkommensteuertarif § 32a EStG</li>
                <li>Abschreibung passend zum Projekt: Neubau oder Denkmal</li>
                <li>Finanzierung mit dem passenden KfW-Programm</li>
              </ul>
            </div>

            <aside className="blatt" aria-label="Beispielrechnung">
              <div className="blatt-kopf">
                <span><strong>{hero.s.projektName}</strong> · {PROJEKTE[0].einheiten[0].bezeichnung}</span>
                <span>Beispielrechnung</span>
              </div>
              <div className={"blatt-gross" + (heroPm.minus ? " minus" : "")}>{heroPm.text}</div>
              <p className="blatt-unter">
                {heroPm.wort} (Durchschnitt ab Vermietung, nach Steuern) bei 100.000 € zu versteuerndem Einkommen, Zusammenveranlagung.
              </p>
              <dl className="blatt-zeilen">
                <div><dt>Eigenkapital</dt><dd>{euro(hero.r.eigenkapital)}</dd></div>
                <div><dt>Steuerersparnis bis {hero.s.veraeusserungJahr}</dt><dd>{euro(hero.r.kumSteuerersparnis)}</dd></div>
                <div><dt>Vermögenszuwachs nach Verkauf {hero.s.veraeusserungJahr}</dt><dd>{euro(hero.vermoegen)}</dd></div>
              </dl>
              <p className="blatt-fuss">Unverbindliche Modellrechnung mit Beispielwerten.</p>
            </aside>
          </div>
        </section>

        {/* ---------- Vertrauen ---------- */}
        <section className="vertrauen" aria-label="Darauf können Sie sich verlassen">
          <div className="huelle vertrauen-raster">
            <div className="vertrauen-punkt">
              <span className="vertrauen-icon"><Symbol name="schild" /></span>
              <div><strong>Amtlicher Steuertarif</strong><span>Die Steuerwirkung folgt dem Einkommensteuertarif nach § 32a EStG, mit Solidaritätszuschlag.</span></div>
            </div>
            <div className="vertrauen-punkt">
              <span className="vertrauen-icon"><Symbol name="liste" /></span>
              <div><strong>Jede Zahl nachvollziehbar</strong><span>Kosten, Zinsen, Abschreibung und Steuer sehen Sie Jahr für Jahr aufgeschlüsselt.</span></div>
            </div>
            <div className="vertrauen-punkt">
              <span className="vertrauen-icon"><Symbol name="schloss" /></span>
              <div><strong>Diskret und unverbindlich</strong><span>Ihre Eingaben bleiben in Ihrem Browser, bis Sie selbst eine Anfrage senden.</span></div>
            </div>
          </div>
        </section>

        {/* ---------- Projekte ---------- */}
        <section className="sektion" id="projekte">
          <div className="huelle">
            <div className="sektion-kopf">
              <h2>Unsere Projekte</h2>
              <p>Zu jedem Projekt gehören die passende Abschreibung und das passende KfW-Programm. Sie müssen beides nicht selbst einstellen.</p>
            </div>
            <div className="projekte">
              {PROJEKTE.map((p) => {
                const kfw = KFW_VORLAGEN.find((x) => x.id === p.kfwId);
                return (
                  <article key={p.id} className={"projekt" + (p.id === e.projektId ? " aktiv" : "")}>
                    <div className="projekt-zeile">
                      <div>
                        <h3>{p.name}</h3>
                        <p className="projekt-adresse">{p.adresse}</p>
                      </div>
                      <span className="marke-tag">{p.artLabel}</span>
                    </div>
                    <p>{p.kurz}</p>
                    <ul>{p.infos.map((t) => <li key={t}>{t}</li>)}</ul>
                    <div className="kfw-box">
                      <strong>{kfw.name}</strong>
                      <span>bis {euro(kfw.betrag)} je Wohnung · Zins ca. {prozent2(kfw.zins)} % · Zinsbindung {kfw.zinsbindung} Jahre</span>
                    </div>
                    <table className="einheiten">
                      <thead><tr><th>Wohnung</th><th>Fläche</th><th>Kaufpreis</th></tr></thead>
                      <tbody>
                        {p.einheiten.map((w) => (
                          <tr key={w.id}>
                            <td>{w.bezeichnung}</td>
                            <td>{zahlDe(w.wohnflaeche)} m²</td>
                            <td>{euro(w.kaufpreis + w.stellplatzPreis)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button className="knopf" type="button" onClick={() => { waehleProjekt(p.id); springe("rechner"); }}>
                      Mit {p.name} rechnen
                    </button>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* ---------- Rechner ---------- */}
        <section className="sektion" id="rechner">
          <div className="huelle">
            <div className="sektion-kopf">
              <h2>Ihr Investitionsrechner</h2>
              <p>Alle Ergebnisse aktualisieren sich sofort, sobald Sie einen Wert ändern.</p>
            </div>

            <div className="rechner">
              <div className="eingaben">
                <div className="kasten">
                  <h3>Projekt und Wohnung</h3>
                  <Segment label="Projekt" wert={e.projektId} onChange={waehleProjekt}
                    optionen={PROJEKTE.map((p) => [p.id, p.name])} />
                  <label className="feld" htmlFor="einheit">
                    <span className="feld-label">Wohnung</span>
                    <select id="einheit" className="auswahl" value={e.einheitId} onChange={(ev) => waehleEinheit(ev.target.value)}>
                      {projekt.einheiten.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.bezeichnung} · {zahlDe(w.wohnflaeche)} m² · {euro(w.kaufpreis + w.stellplatzPreis)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="fest">
                    <strong>{projekt.artLabel}: {projekt.artLabel === "Neubau" ? "degressive AfA und Sonder-AfA" : "Abschreibung nach § 7h/7i EStG"}</strong>
                    <span>Die Abschreibung ist für dieses Projekt fest hinterlegt.</span>
                  </div>
                </div>

                <div className="kasten">
                  <h3>Ihre Situation</h3>
                  <Zahl id="einkommen" label="Zu versteuerndes Einkommen pro Jahr" einheit="€" wert={e.einkommen}
                    onChange={setzen("einkommen")} min={0} max={2000000}
                    hinweis="Bei Zusammenveranlagung das gemeinsame Einkommen." />
                  <Segment label="Veranlagung" wert={e.veranlagung} onChange={setzen("veranlagung")}
                    optionen={[["zusammen", "Zusammen"], ["einzeln", "Einzeln"]]} />
                  <Zahl id="ek" label="Eigenkapital" einheit="€" wert={r.eigenkapital}
                    onChange={setzen("eigenkapital")} min={0} max={Math.round(r.gesamtkosten)}
                    hinweis={"Vorschlag: " + euro(vorschlag) + " (ca. 12 % der Gesamtkosten)"} />
                  {e.eigenkapital !== null && (
                    <button className="knopf leise klein" type="button" style={{ justifySelf: "start" }}
                      onClick={() => setzen("eigenkapital")(null)}>Vorschlag übernehmen</button>
                  )}
                </div>

                <div className="kasten">
                  <h3>Finanzierung</h3>
                  {kfwDarlehen && (
                    <div className="fest">
                      <strong>{kfwDarlehen.name}: {euro(kfwDarlehen.betrag)}</strong>
                      <span>Zins {prozent2(kfwDarlehen.zins)} % · Tilgung {prozent2(kfwDarlehen.tilgung)} % · Zinsbindung {kfwDarlehen.zinsbindung} Jahre</span>
                      <span>{kfwVorlage.hinweis}</span>
                    </div>
                  )}
                  {bankDarlehen ? (
                    <>
                      <p className="feld-hinweis">Restbetrag über ein Bankdarlehen: {euro(bankDarlehen.betrag)}. Zins und Tilgung gibt Ihre Bank vor, Sie können beides anpassen.</p>
                      <Regler id="zins" label="Zinssatz Bankdarlehen" wert={e.zins} onChange={setzen("zins")}
                        min={1} max={7} schritt={0.05} anzeige={prozent2(e.zins) + " %"} />
                      <Regler id="tilgung" label="Anfängliche Tilgung" wert={e.tilgung} onChange={setzen("tilgung")}
                        min={1} max={4} schritt={0.25} anzeige={zahlDe(e.tilgung) + " %"} />
                    </>
                  ) : (
                    <p className="feld-hinweis">Mit diesem Eigenkapital reicht das KfW-Darlehen. Ein Bankdarlehen ist nicht nötig.</p>
                  )}
                </div>

                <div className="kasten">
                  <h3>Annahmen zum Verkauf</h3>
                  <Regler id="wert" label="Wertsteigerung pro Jahr" wert={e.wertSteigerung} onChange={setzen("wertSteigerung")}
                    min={0} max={4} schritt={0.25} anzeige={zahlDe(e.wertSteigerung) + " %"} />
                  <label className="feld" htmlFor="verkauf">
                    <span className="feld-label">Verkauf im Jahr</span>
                    <select id="verkauf" className="auswahl" value={e.verkaufsJahr} onChange={(ev) => setzen("verkaufsJahr")(parseInt(ev.target.value, 10))}>
                      {Array.from({ length: 15 }, (_, i) => 2032 + i).map((j) => <option key={j} value={j}>{j}</option>)}
                    </select>
                  </label>
                  {v && v.spekulationspflichtig && (
                    <p className="hinweis-box">
                      Bei einem Verkauf innerhalb von 10 Jahren nach dem Kauf ist ein Gewinn steuerpflichtig (§ 23 EStG). Die Steuer ist in der Rechnung enthalten.
                    </p>
                  )}
                </div>

                {session && !istTeam && (
                  <div className="kasten">
                    <h3>Meine Berechnungen</h3>
                    <label className="feld">
                      <span className="feld-label">Name der Berechnung</span>
                      <span className="eingabe-zeile">
                        <input type="text" value={speicherName} onChange={(ev) => setSpeicherName(ev.target.value)} placeholder="z. B. WE 02 mit 60.000 € Eigenkapital" />
                      </span>
                    </label>
                    <div className="aktion-leiste">
                      <button className="knopf klein" type="button" onClick={speichern} disabled={!speicherName.trim()}>Berechnung speichern</button>
                      {speicherStatus && <span className="feld-hinweis">{speicherStatus}</span>}
                    </div>
                    {gespeichert.length > 0 && (
                      <div className="gespeichert-liste">
                        {gespeichert.map((g) => (
                          <div key={g.id}>
                            <span className="name">{g.name}</span>
                            <span className="knoepfe">
                              <button className="knopf leise klein" type="button" onClick={() => laden(g.id)}>Laden</button>
                              <button className="knopf leise klein" type="button" onClick={() => loeschen(g.id)}>Löschen</button>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="ergebnis" id="ergebnis" aria-live="polite">
                <div className="kennzahlen">
                  <div className="kz hervor">
                    <span className="kz-label">Ø monatlich nach Steuern, ab Vermietung</span>
                    <span className={"kz-wert" + (pmErg.minus ? " minus" : "")}>{pmErg.text}</span>
                    <span className="kz-sub">{pmErg.wort}</span>
                  </div>
                  <div className="kz">
                    <span className="kz-label">Eigenkapital</span>
                    <span className="kz-wert">{euro(r.eigenkapital)}</span>
                    <span className="kz-sub">von {euro(r.gesamtkosten)} Gesamtkosten</span>
                  </div>
                  <div className="kz">
                    <span className="kz-label">Steuerersparnis bis {s.veraeusserungJahr}</span>
                    <span className="kz-wert">{euro(r.kumSteuerersparnis)}</span>
                    <span className="kz-sub">durch Abschreibung und Zinsen</span>
                  </div>
                  <div className="kz">
                    <span className="kz-label">Vermögenszuwachs nach Verkauf {s.veraeusserungJahr}</span>
                    <span className={"kz-wert" + (vermoegen < 0 ? " minus" : "")}>{euro(vermoegen)}</span>
                    <span className="kz-sub">nach Steuern, abzüglich Ihres Einsatzes</span>
                  </div>
                  <div className="kz">
                    <span className="kz-label">Verzinsung Ihres Kapitals</span>
                    <span className="kz-wert">{r.irr == null ? "–" : pct(r.irr) + " % p. a."}</span>
                    <span className="kz-sub">nach Steuern, interner Zinsfuß</span>
                  </div>
                </div>

                <p className="zusammenfassung">
                  {Math.round(r.aufwandPM) === 0
                    ? <>Bei Ihren Angaben ist die Wohnung ab Vermietung im Durchschnitt <strong>ausgeglichen</strong> (nach Steuern). </>
                    : pmErg.minus
                      ? <>Bei Ihren Angaben kostet Sie die Wohnung ab Vermietung im Durchschnitt <strong>{pmErg.text} pro Monat</strong> (nach Steuern). </>
                      : <>Bei Ihren Angaben bleiben ab Vermietung im Durchschnitt <strong>{pmErg.text} pro Monat</strong> übrig (nach Steuern). </>}
                  Verkaufen Sie {s.veraeusserungJahr}, ergibt sich nach Abzug aller Kosten und Steuern {vermoegen >= 0 ? "ein Vermögenszuwachs von " : "ein Minus von "}
                  <strong>{euro(Math.abs(vermoegen))}</strong> bei einem Einsatz von {euro(r.eigenkapital)} Eigenkapital.
                </p>

                <Monatsdiagramm zeilen={zeilenAnzeige} />

                <div className="aktion-leiste">
                  <button className="knopf" type="button" onClick={berechnungSenden}>Berechnung an Berater senden</button>
                  {!session && supabaseKonfiguriert && (
                    <button className="knopf leise" type="button" onClick={() => springe("anfrage")}>Kundenzugang anfragen</button>
                  )}
                </div>

                <details className="auf">
                  <summary>So setzt sich die Rechnung zusammen</summary>
                  <div className="auf-inhalt">
                    <dl className="liste">
                      <div><dt>Kaufpreis inkl. Stellplatz</dt><dd>{euro(r.kaufGesamt)}</dd></div>
                      <div><dt>Grunderwerbsteuer ({pct(s.grestSatz)} %)</dt><dd>{euro(r.grest)}</dd></div>
                      <div><dt>Notar und Gericht ({pct(s.notarSatz)} %)</dt><dd>{euro(r.notar)}</dd></div>
                      <div><dt>Beratung und Vermittlung ({pct(s.beratungSatz)} %)</dt><dd>{euro(r.beratung)}</dd></div>
                      <div><dt>Gesamtkosten</dt><dd>{euro(r.gesamtkosten)}</dd></div>
                      <div><dt>Darlehen gesamt</dt><dd>{euro(r.darlehenSumme)}</dd></div>
                      {v && <>
                        <div><dt>Verkaufspreis {v.jahr}</dt><dd>{euro(v.verkaufspreis)}</dd></div>
                        <div><dt>Restschuld {v.jahr}</dt><dd>{euro(v.restschuld)}</dd></div>
                        {v.spekulationspflichtig && <div><dt>Steuer auf den Verkaufsgewinn</dt><dd>{euro(v.steuer)}</dd></div>}
                        <div><dt>Verkaufserlös nach Darlehen</dt><dd>{euro(v.nettoerloes)}</dd></div>
                      </>}
                    </dl>
                    <div className="tabelle-rahmen">
                      <table className="jahre">
                        <thead>
                          <tr><th>Jahr</th><th>Miete</th><th>Zinsen</th><th>Tilgung</th><th>Abschreibung</th><th>Steuerersparnis</th><th>Aufwand p. M.</th></tr>
                        </thead>
                        <tbody>
                          {zeilenAnzeige.map((z) => (
                            <tr key={z.jahr}>
                              <td>{z.jahr}</td><td>{eur(z.miete)}</td><td>{eur(z.zinsen)}</td>
                              <td>{eur(z.tilgung - z.sondertilgung)}</td><td>{eur(z.afa)}</td>
                              <td>{eur(z.ersparnis)}</td><td>{eur(z.aufwandNachSteuern / 12)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </details>

                <details className="auf">
                  <summary>Annahmen der Rechnung</summary>
                  <div className="auf-inhalt">
                    <p>Einkommensteuertarif {s.tarifJahr}, {s.splitting ? "Splittingtarif" : "Grundtarif"}, mit Solidaritätszuschlag, ohne Kirchensteuer und ohne Kinderfreibeträge.</p>
                    <p>Ihr Einkommen steigt um {zahlDe(s.einkommenSteigerung)} % pro Jahr. Die Miete steigt um {zahlDe(s.mietSteigerung)} % alle {s.mietIntervall} Jahre ab {s.mietSteigerungAb}. Die laufenden Kosten steigen um {zahlDe(s.kostenSteigerung)} % pro Jahr ab {s.kostenSteigerungAb}.</p>
                    <p>Vermietung ab {String(s.vermietungMonat).padStart(2, "0")}/{s.vermietungJahr}. Das Darlehen läuft ab {s.darlehenBeginn}. Nach der Zinsbindung wird ein Anschlusszins angenommen.</p>
                    <p>Ihr Berater berücksichtigt auf Wunsch Kirchensteuer, Kinder und weitere Einkünfte.</p>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- Ablauf ---------- */}
        <section className="sektion" id="ablauf">
          <div className="huelle">
            <div className="sektion-kopf">
              <h2>So läuft es ab</h2>
              <p>Vom ersten Überschlag bis zur persönlichen Beratung.</p>
            </div>
            <div className="schritte">
              <div className="schritt">
                <h3>Selbst durchrechnen</h3>
                <p>Sie wählen Projekt und Wohnung, tragen Einkommen und Eigenkapital ein und passen Zins, Tilgung und Wertsteigerung an.</p>
              </div>
              <div className="schritt">
                <h3>Berechnung senden</h3>
                <p>Mit einem Klick geht Ihre Berechnung an Ihren Berater. Er prüft die Annahmen mit Ihnen, auch mit Kirchensteuer, Kindern und weiteren Einkünften.</p>
              </div>
              <div className="schritt">
                <h3>Kundenzugang nutzen</h3>
                <p>Auf Wunsch richten wir Ihnen einen Zugang ein. Dort speichern und vergleichen Sie mehrere Berechnungen.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- Hinweise ---------- */}
        <section className="sektion" id="hinweise">
          <div className="huelle">
            <div className="sektion-kopf"><h2>Wichtige Hinweise</h2></div>
            <div className="hinweise">
              <p>Der Rechner liefert eine unverbindliche Modellrechnung auf Basis Ihrer Annahmen. Er ist keine Anlage-, Steuer- oder Rechtsberatung und keine Zusicherung von Erträgen.</p>
              <p>Miete, Zins, Wertentwicklung und Steuerrecht können sich ändern. Die tatsächliche Entwicklung kann erheblich abweichen.</p>
              <p>KfW-Zinssätze sind Richtwerte mit Datumsstand. Den verbindlichen Zins legt die KfW am Tag der Zusage fest. Ihre finanzierende Bank nennt Ihnen die aktuellen Konditionen.</p>
              <p>Ob die steuerlichen Voraussetzungen der Abschreibung in Ihrem Fall erfüllt sind, klären Sie bitte mit Ihrer Steuerberatung.</p>
            </div>
          </div>
        </section>

        {/* ---------- FAQ ---------- */}
        <section className="sektion" id="fragen">
          <div className="huelle">
            <div className="sektion-kopf"><h2>Häufige Fragen</h2></div>
            <div className="faq">
              <details>
                <summary>Wie genau ist die Berechnung?</summary>
                <p>Die Steuerwirkung wird nach dem Einkommensteuertarif § 32a EStG samt Solidaritätszuschlag berechnet. Alle Werte beruhen auf Ihren Eingaben und den sichtbaren Annahmen. Es bleibt eine Modellrechnung, keine Prognose.</p>
              </details>
              <details>
                <summary>Warum unterscheiden sich Neubau und Denkmal bei der Abschreibung?</summary>
                <p>Beim Neubau rechnen wir mit der degressiven Abschreibung und, soweit zulässig, der Sonderabschreibung nach § 7b EStG. Beim Denkmal gilt die erhöhte Abschreibung nach § 7h/7i EStG auf den Sanierungsanteil. Die Voraussetzungen prüft im Einzelfall Ihre Steuerberatung.</p>
              </details>
              <details>
                <summary>Woher kommen die Zinssätze?</summary>
                <p>Für das KfW-Darlehen hinterlegen wir einen Richtwert mit Datumsstand. Für das Bankdarlehen stellen Sie den Zins selbst ein, am besten mit dem Angebot Ihrer Bank.</p>
              </details>
              <details>
                <summary>Sind die Preise und Mieten verbindlich?</summary>
                <p>Nein. Die hinterlegten Werte dienen der Orientierung. Verbindliche Preise, Flächen und Mieten erhalten Sie von Ihrem Berater.</p>
              </details>
              <details>
                <summary>Was passiert mit meinen Eingaben?</summary>
                <p>Solange Sie nichts senden, bleiben Ihre Eingaben in Ihrem Browser. Erst wenn Sie das Formular absenden, übermitteln wir Ihre Angaben und, wenn Sie das wählen, Ihre Berechnung an uns.</p>
              </details>
              <details>
                <summary>Brauche ich einen Kundenzugang?</summary>
                <p>Nein. Der Rechner funktioniert ohne Anmeldung. Mit einem Kundenzugang können Sie Berechnungen speichern und später wieder öffnen.</p>
              </details>
            </div>
          </div>
        </section>

        {/* ---------- Anfrage ---------- */}
        <section className="sektion" id="anfrage">
          <div className="huelle anfrage">
            <div className="anfrage-text">
              <h2>Unverbindlich anfragen</h2>
              <p>Senden Sie uns Ihre Berechnung oder stellen Sie eine Frage. Wir melden uns persönlich bei Ihnen.</p>
              <ul className="zusagen">
                <li>Unverbindlich und ohne Verpflichtung</li>
                <li>Persönliche Antwort statt Standardmail</li>
                <li>Ihre Angaben nur für diese Anfrage</li>
              </ul>
              <p className="kontakt">Oder schreiben Sie direkt an <a href={"mailto:" + MARKE.mail}>{MARKE.mail}</a>.</p>
            </div>

            <form className="formular" onSubmit={absenden}>
              <label className="feld" htmlFor="anliegen">
                <span className="feld-label">Ihr Anliegen</span>
                <select id="anliegen" className="auswahl" value={anliegen} onChange={(ev) => setAnliegen(ev.target.value)}>
                  <option value="berechnung">Meine Berechnung besprechen</option>
                  <option value="kundenzugang">Kundenzugang anfragen</option>
                  <option value="allgemein">Allgemeine Frage</option>
                </select>
              </label>
              <div className="zwei">
                <label className="feld" htmlFor="f-name">
                  <span className="feld-label">Name *</span>
                  <input id="f-name" type="text" required autoComplete="name" value={form.name} onChange={setF("name")} />
                </label>
                <label className="feld" htmlFor="f-mail">
                  <span className="feld-label">E-Mail *</span>
                  <input id="f-mail" type="email" required autoComplete="email" value={form.email} onChange={setF("email")} />
                </label>
              </div>
              <label className="feld" htmlFor="f-tel">
                <span className="feld-label">Telefon (optional)</span>
                <input id="f-tel" type="tel" autoComplete="tel" value={form.telefon} onChange={setF("telefon")} />
              </label>
              <label className="feld" htmlFor="f-msg">
                <span className="feld-label">Nachricht (optional)</span>
                <textarea id="f-msg" value={form.nachricht} onChange={setF("nachricht")} />
              </label>

              <label className="haken">
                <input type="checkbox" checked={mitBerechnung} onChange={(ev) => setMitBerechnung(ev.target.checked)} />
                <span>Meine aktuelle Berechnung mitsenden ({projekt.name}, {einheit.bezeichnung}, Eigenkapital {euro(r.eigenkapital)})</span>
              </label>

              <div className="honig" aria-hidden="true">
                <label>Website <input type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={setF("website")} /></label>
              </div>

              <label className="haken">
                <input type="checkbox" required checked={form.zustimmung} onChange={setF("zustimmung")} />
                <span>Ich habe die <a href="#datenschutz">Datenschutzerklärung</a> gelesen und willige ein, dass meine Angaben zur Bearbeitung meiner Anfrage verarbeitet werden. *</span>
              </label>

              {status.art !== "leer" && (
                <p className={"meldung" + (status.art === "fehler" ? " fehler" : "")} role="status">{status.text}</p>
              )}
              <div>
                <button className="knopf" type="submit" disabled={status.art === "laedt"}>Anfrage senden</button>
              </div>
            </form>
          </div>
        </section>

        {/* ---------- Rechtstexte (Platzhalter) ---------- */}
        <section className="rechtstext" id="impressum">
          <div className="huelle">
            <h2>Impressum</h2>
            <p>Platzhalter. Hier gehören die Anbieterkennzeichnung nach § 5 DDG, Anschrift, Vertretungsberechtigte, Kontakt und Registerangaben hin. Bitte vor dem Start vollständig ergänzen.</p>
          </div>
        </section>
        <section className="rechtstext" id="datenschutz">
          <div className="huelle">
            <h2>Datenschutz</h2>
            <p>Platzhalter. Hier gehört die Datenschutzerklärung hin: verantwortliche Stelle, Zweck der Verarbeitung (Bearbeitung von Anfragen, Kundenzugang), Empfänger und Auftragsverarbeiter (Hosting, E-Mail-Versand, Datenbank), Speicherdauer und Ihre Rechte. Bitte vor dem Start von einer fachkundigen Stelle prüfen lassen.</p>
          </div>
        </section>
      </main>

      <div className={"leiste-mobil" + (leiste ? " sichtbar" : "")} aria-hidden={!leiste}>
        <span>
          <span className="l-label">{pmErg.minus ? "Ø monatlich zahlen Sie" : "Ø monatlich bleibt übrig"}</span>
          <span className="l-wert">{pmErg.text}</span>
        </span>
        <button className="knopf" type="button" tabIndex={leiste ? 0 : -1} onClick={() => springe("ergebnis")}>Ergebnis ansehen</button>
      </div>

      <footer className="fuss">
        <div className="huelle fuss-innen">
          <span className="fuss-logo">
            <img src="/logo-white.svg" alt={MARKE.name} height="40" />
            <span>© 2026</span>
          </span>
          <span className="fuss-links">
            <a href="#impressum">Impressum</a>
            <a href="#datenschutz">Datenschutz</a>
            <a href="/team">Team</a>
            <a href="#top" onClick={(ev) => { ev.preventDefault(); setThema(thema === "hell" ? "dunkel" : "hell"); }}>
              {thema === "hell" ? "Dunkle Darstellung" : "Helle Darstellung"}
            </a>
          </span>
        </div>
      </footer>

      {loginOffen && (
        <div className="dialog-hinter" onClick={() => setLoginOffen(false)}>
          <form className="dialog formular" onClick={(ev) => ev.stopPropagation()} onSubmit={anmelden} aria-label="Kundenzugang">
            <h2>Kundenzugang</h2>
            <label className="feld" htmlFor="l-mail">
              <span className="feld-label">E-Mail</span>
              <input id="l-mail" type="email" required autoComplete="username" value={loginMail} onChange={(ev) => setLoginMail(ev.target.value)} />
            </label>
            <label className="feld" htmlFor="l-pw">
              <span className="feld-label">Passwort</span>
              <input id="l-pw" type="password" required autoComplete="current-password" value={loginPw} onChange={(ev) => setLoginPw(ev.target.value)} />
            </label>
            {loginFehler && <p className="meldung fehler">{loginFehler}</p>}
            <div className="aktion-leiste">
              <button className="knopf" type="submit" disabled={loginLaedt}>{loginLaedt ? "Prüfe …" : "Anmelden"}</button>
              <button className="knopf leise" type="button" onClick={() => setLoginOffen(false)}>Abbrechen</button>
            </div>
            <p className="feld-hinweis">Noch keinen Zugang? Wählen Sie im Anfrageformular „Kundenzugang anfragen“.</p>
          </form>
        </div>
      )}
    </div>
  );
}

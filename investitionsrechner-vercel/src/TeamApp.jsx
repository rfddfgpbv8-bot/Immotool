import React, { useState, useMemo, useEffect } from "react";
import { supabase, supabaseKonfiguriert } from "./supabaseClient";
import { TARIFE, berechne, steuerDetail, grenzsteuersatz, eur, eur2, pct } from "./rechenkern";
import { pdfDatei } from "./pdf";
import { KFW_VORLAGEN, START } from "./vorlagen";
import { Feld, TextFeld, Wahl, Segment, Schalter, Gruppe, Liquiditaetsband, Vermoegenskurve } from "./bausteine";
import { CSS } from "./styles";
import { baueStaat } from "./projekte";

export default function TeamApp() {
  const [s, setS] = useState(START);
  const [tab, setTab] = useState("liquiditaet");
  const [hell, setHell] = useState(true);

  // ---- Login ----
  const [session, setSession] = useState(null);
  const [authLaedt, setAuthLaedt] = useState(true);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPasswort, setLoginPasswort] = useState("");
  const [loginFehler, setLoginFehler] = useState("");
  const [loginLaedt, setLoginLaedt] = useState(false);

  useEffect(() => {
    if (!supabaseKonfiguriert) { setAuthLaedt(false); return; }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLaedt(false);
    });
    const { data: hoerer } = supabase.auth.onAuthStateChange((_ev, sess) => setSession(sess));
    return () => hoerer.subscription.unsubscribe();
  }, []);

  async function anmelden(e) {
    e.preventDefault();
    setLoginFehler("");
    setLoginLaedt(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail, password: loginPasswort,
    });
    setLoginLaedt(false);
    if (error) setLoginFehler("E-Mail oder Passwort falsch.");
  }
  const abmelden = () => supabase.auth.signOut();

  // ---- Gespeicherte Berechnungen ----
  const [gespeichert, setGespeichert] = useState([]);
  const [gespeichertLaedt, setGespeichertLaedt] = useState(false);
  const [speicherName, setSpeicherName] = useState("");
  const [speicherStatus, setSpeicherStatus] = useState("");
  const [aktiveId, setAktiveId] = useState(null);

  async function listeAktualisieren() {
    if (!session) return;
    setGespeichertLaedt(true);
    const { data, error } = await supabase
      .from("berechnungen")
      .select("id, name, updated_at")
      .eq("art", "team")
      .order("updated_at", { ascending: false });
    setGespeichertLaedt(false);
    if (!error) setGespeichert(data || []);
  }
  useEffect(() => { if (session) listeAktualisieren(); }, [session]);

  // ---- Kundenanfragen ----
  const [anfragen, setAnfragen] = useState([]);
  const [anfragenFehler, setAnfragenFehler] = useState("");
  const istTeam = session?.user?.app_metadata?.rolle === "team";

  async function anfragenLaden() {
    if (!session || !istTeam) return;
    const { data, error } = await supabase
      .from("anfragen")
      .select("id, created_at, name, email, telefon, anliegen, nachricht, status, berechnung")
      .order("created_at", { ascending: false })
      .limit(50);
    setAnfragenFehler(error ? "Anfragen konnten nicht geladen werden." : "");
    setAnfragen(data || []);
  }
  useEffect(() => { anfragenLaden(); }, [session]);

  async function anfrageStatus(id, status) {
    await supabase.from("anfragen").update({ status }).eq("id", id);
    anfragenLaden();
  }

  function anfrageUebernehmen(a) {
    const eingaben = a.berechnung && a.berechnung.eingaben;
    if (!eingaben) return;
    setS({ ...baueStaat(eingaben), kundeName: a.name || "" });
    setAktiveId(null);
    window.scrollTo({ top: 0 });
  }

  async function berechnungSpeichern() {
    const name = speicherName.trim();
    if (!name) return;
    setSpeicherStatus("speichert…");
    const { data, error } = await supabase
      .from("berechnungen")
      .insert({ user_id: session.user.id, name, art: "team", data: s })
      .select("id")
      .single();
    if (error) { setSpeicherStatus("Fehler beim Speichern"); return; }
    setSpeicherStatus("gespeichert");
    setAktiveId(data.id);
    setSpeicherName("");
    listeAktualisieren();
    setTimeout(() => setSpeicherStatus(""), 2000);
  }

  async function berechnungAktualisieren() {
    if (!aktiveId) return;
    setSpeicherStatus("speichert…");
    const { error } = await supabase
      .from("berechnungen")
      .update({ data: s, updated_at: new Date().toISOString() })
      .eq("id", aktiveId);
    setSpeicherStatus(error ? "Fehler beim Speichern" : "gespeichert");
    listeAktualisieren();
    setTimeout(() => setSpeicherStatus(""), 2000);
  }

  async function berechnungLaden(id) {
    const { data, error } = await supabase
      .from("berechnungen").select("data").eq("id", id).single();
    if (!error && data) { setS({ ...START, ...data.data }); setAktiveId(id); }
  }

  async function berechnungLoeschen(id) {
    await supabase.from("berechnungen").delete().eq("id", id);
    if (aktiveId === id) setAktiveId(null);
    listeAktualisieren();
  }

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

  // ---- Ladebildschirm ----
  if (authLaedt) {
    return (
      <div className={"app" + (hell ? " hell" : "")}>
        <style>{CSS}</style>
        <div className="login-buehne"><p className="login-lade">Lädt…</p></div>
      </div>
    );
  }

  // ---- Ohne Supabase-Zugangsdaten: Hinweis statt Login ----
  if (!supabaseKonfiguriert) {
    return (
      <div className={"app" + (hell ? " hell" : "")}>
        <style>{CSS}</style>
        <div className="login-buehne">
          <div className="login-karte">
            <span className="marke"><span className="marke-punkt" />Investitionsrechner</span>
            <h1>Login nicht eingerichtet</h1>
            <p className="login-hinweis">
              Es fehlen die Umgebungsvariablen VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY.
              In Vercel unter Project → Settings → Environment Variables eintragen und danach
              neu deployen.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ---- Login-Maske ----
  if (!session) {
    return (
      <div className={"app" + (hell ? " hell" : "")}>
        <style>{CSS}</style>
        <div className="login-buehne">
          <form className="login-karte" onSubmit={anmelden}>
            <span className="marke"><span className="marke-punkt" />Investitionsrechner</span>
            <h1>Anmelden</h1>
            <label className="feld">
              <span className="feld-label">E-Mail</span>
              <span className="feld-eingabe">
                <input type="email" value={loginEmail} autoComplete="username"
                  onChange={(e) => setLoginEmail(e.target.value)} required />
              </span>
            </label>
            <label className="feld">
              <span className="feld-label">Passwort</span>
              <span className="feld-eingabe">
                <input type="password" value={loginPasswort} autoComplete="current-password"
                  onChange={(e) => setLoginPasswort(e.target.value)} required />
              </span>
            </label>
            {loginFehler && <p className="login-fehler">{loginFehler}</p>}
            <button className="login-knopf" type="submit" disabled={loginLaedt}>
              {loginLaedt ? "Prüfe…" : "Anmelden"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ---- Nur für das Team ----
  if (!istTeam) {
    return (
      <div className={"app" + (hell ? " hell" : "")}>
        <style>{CSS}</style>
        <div className="login-buehne">
          <div className="login-karte">
            <span className="marke"><span className="marke-punkt" />Investitionsrechner</span>
            <h1>Kein Teamzugang</h1>
            <p className="login-hinweis">
              Dieses Konto hat keinen Zugriff auf die Teamansicht. Bitte melden Sie sich mit einem Teamkonto an
              oder gehen Sie zur Kundenseite.
            </p>
            <button className="login-knopf" type="button" onClick={abmelden}>Abmelden</button>
            <a className="login-hinweis" href="/">Zur Kundenseite</a>
          </div>
        </div>
      </div>
    );
  }

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
            <span className="leiste-rechts">
              <button className="thema" onClick={() => setHell(!hell)}>
                {hell ? "Dunkel" : "Hell"}
              </button>
              <button className="thema" onClick={abmelden}>Abmelden</button>
            </span>
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
              titel={"Kundenanfragen" + (anfragen.filter((a) => a.status === "neu").length ? " (" + anfragen.filter((a) => a.status === "neu").length + " neu)" : "")}
              kennung="Inbox"
              offenStd={false}
              kinder={
                <>
                  {anfragenFehler && <div className="deckung">{anfragenFehler}</div>}
                  {anfragen.length === 0 && !anfragenFehler && (
                    <p className="hinweis-klein">Noch keine Anfragen.</p>
                  )}
                  {anfragen.map((a) => (
                    <div key={a.id} className="speicher-zeile" style={{ borderTop: "1px solid var(--line)", paddingTop: 10, marginTop: 10 }}>
                      <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                        <strong>{a.name}</strong> · {new Date(a.created_at).toLocaleDateString("de-DE")} · {a.status}
                        <br />{a.email}{a.telefon ? " · " + a.telefon : ""}
                        <br />{a.anliegen}
                        {a.berechnung && a.berechnung.projekt ? " · " + a.berechnung.projekt + ", " + a.berechnung.wohnung : ""}
                        {a.nachricht ? <><br /><em>{a.nachricht}</em></> : null}
                      </div>
                      <div className="speicher-knoepfe">
                        {a.berechnung && a.berechnung.eingaben && (
                          <button className="mini" onClick={() => anfrageUebernehmen(a)}>Berechnung übernehmen</button>
                        )}
                        <button className="mini" onClick={() => anfrageStatus(a.id, a.status === "neu" ? "erledigt" : "neu")}>
                          {a.status === "neu" ? "Als erledigt markieren" : "Wieder öffnen"}
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              }
            />
            <Gruppe
              titel="Gespeicherte Berechnungen"
              kennung="Save"
              kinder={
                <>
                  {aktiveId && (
                    <div className="deckung ok">
                      <span>Geladen: {gespeichert.find((g) => g.id === aktiveId)?.name || "…"}</span>
                    </div>
                  )}
                  <div className="speicher-zeile">
                    <TextFeld
                      label="Name dieser Berechnung"
                      wert={speicherName}
                      onChange={setSpeicherName}
                      platzhalter="z. B. Parkvilla WE 3"
                    />
                    <div className="speicher-knoepfe">
                      <button className="mini" onClick={berechnungSpeichern} disabled={!speicherName.trim()}>
                        Als neu speichern
                      </button>
                      {aktiveId && (
                        <button className="mini" onClick={berechnungAktualisieren}>
                          Aktuelle aktualisieren
                        </button>
                      )}
                    </div>
                    {speicherStatus && <span className="feld-hinweis">{speicherStatus}</span>}
                  </div>

                  <div className="trenner">Deine gespeicherten Berechnungen</div>
                  {gespeichertLaedt && <span className="feld-hinweis">Lädt…</span>}
                  {!gespeichertLaedt && gespeichert.length === 0 && (
                    <span className="feld-hinweis">Noch nichts gespeichert.</span>
                  )}
                  <div className="vorlagen">
                    {gespeichert.map((g) => (
                      <div key={g.id} className={"gespeichert-eintrag" + (g.id === aktiveId ? " aktiv" : "")}>
                        <button className="gespeichert-name" onClick={() => berechnungLaden(g.id)}>
                          {g.name}
                        </button>
                        <button className="gespeichert-loeschen" onClick={() => berechnungLoeschen(g.id)}>
                          löschen
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              }
            />

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
                  <Feld label="Kaufvertrag Jahr" wert={s.kaufvertragJahr} onChange={set("kaufvertragJahr")}
                    hinweis="Maßgeblich für die 10-Jahres-Spekulationsfrist § 23 EStG und, bei Neubau, für das Zeitfenster der degressiven AfA" />
                  <Feld label="Kaufvertrag Monat" wert={s.kaufvertragMonat} onChange={set("kaufvertragMonat")} />
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

                  <div className="trenner">Vorlagen als Startpunkt — Zinssatz danach vom Berater eintragen</div>
                  {["Neubau", "Sanierung", "Allgemein"].map((kat) => {
                    const treffer = KFW_VORLAGEN.filter(
                      (v) => v.kategorie === kat && (!v.gebaeudeart || v.gebaeudeart === s.gebaeudeart)
                    );
                    if (!treffer.length) return null;
                    return (
                      <div key={kat} className="vorlagen-gruppe">
                        <span className="vorlagen-kategorie">{kat}</span>
                        <div className="vorlagen">
                          {treffer.map((v) => (
                            <button
                              key={v.id}
                              className="vorlage"
                              onClick={() =>
                                setS((alt) => ({
                                  ...alt,
                                  darlehen: [...alt.darlehen, {
                                    name: v.name, betrag: v.betrag, zins: v.zins, tilgung: v.tilgung,
                                    zinsbindung: v.zinsbindung, anschlusszins: v.anschlusszins,
                                  }],
                                }))
                              }
                            >
                              <span className="vorlage-titel">{v.label}</span>
                              <span className="vorlage-hinweis">{v.hinweis}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  <span className="feld-hinweis">
                    Nur ein grober Startpunkt (Stand der jeweiligen KfW-Merkblätter). Sollzins,
                    Anschlusszins, Tilgung und Betrag anschließend immer mit dem tatsächlichen,
                    tagesaktuellen Angebot der Bank oder des Beraters überschreiben — jedes Feld
                    bleibt frei editierbar. Programme mit dem Hinweis „nur Eigennutzung" scheiden
                    für vermietete Kapitalanlagen aus und sind nur der Vollständigkeit halber gelistet.
                  </span>

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
                  <Segment
                    label="Gebäudeart"
                    wert={s.gebaeudeart}
                    onChange={set("gebaeudeart")}
                    optionen={[
                      { v: "neubau", t: "Neubau" },
                      { v: "denkmal", t: "Denkmal" },
                    ]}
                  />

                  {s.gebaeudeart === "neubau" && (
                    <>
                      <div className={"deckung" + (r.degressivMoeglich ? " ok" : "")}>
                        <span>
                          {r.degressivMoeglich
                            ? "Zeitfenster für degressive AfA erfüllt (§ 7 Abs. 5a EStG)"
                            : "Außerhalb des gesetzlichen Zeitfensters — degressive AfA rechtlich derzeit nicht vorgesehen"}
                        </span>
                      </div>
                      <Schalter label="Degressive AfA § 7 Abs. 5a EStG" wert={s.degressiv} onChange={set("degressiv")}
                        hinweis="Fester Satz vom jeweiligen Restwert" />
                      {s.degressiv
                        ? <Feld label="Degressiver Satz" wert={s.degressivSatz} onChange={set("degressivSatz")} suffix="%" />
                        : <Feld label="Linearer Satz" wert={s.linearSatz} onChange={set("linearSatz")} suffix="%"
                            hinweis="3 % für Neubauten ab Fertigstellung 2023, davor 2 %" />}
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
                  )}

                  {s.gebaeudeart === "denkmal" && (
                    <>
                      <Feld label="Sanierungsanteil am Gebäudewert" wert={s.denkmalSanierungsanteil}
                        onChange={set("denkmalSanierungsanteil")} suffix="%"
                        hinweis={`Modernisierung ${eur(r.denkmalModernisierung)} € · Altbausubstanz ${eur(r.denkmalAltbau)} €`} />
                      <div className="trenner">Modernisierung — § 7h / § 7i EStG</div>
                      <Feld label="Satz Jahre 1 bis N" wert={s.denkmalSatz1} onChange={set("denkmalSatz1")} suffix="%" />
                      <Feld label="Anzahl Jahre, Phase 1" wert={s.denkmalJahre1} onChange={set("denkmalJahre1")} suffix="Jahre" />
                      <Feld label="Satz Folgejahre" wert={s.denkmalSatz2} onChange={set("denkmalSatz2")} suffix="%" />
                      <Feld label="Anzahl Jahre, Phase 2" wert={s.denkmalJahre2} onChange={set("denkmalJahre2")} suffix="Jahre"
                        hinweis="Gesetzlicher Regelfall: 8 Jahre 9 %, danach 4 Jahre 7 % — zusammen 100 % über 12 Jahre, volle Jahresbeträge ab dem Jahr der Fertigstellung der Baumaßnahme" />
                      <div className="trenner">Altbausubstanz — linear</div>
                      <Feld label="Linearer Satz Altbau" wert={s.denkmalAltbauSatz} onChange={set("denkmalAltbauSatz")} suffix="%"
                        hinweis="2 % für Gebäude ab Baujahr 1925, 2,5 % für ältere Gebäude — kein Wahlrecht zur degressiven AfA" />
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

            <Gruppe
              titel="Veräußerung"
              kennung="Exit"
              offenStd={false}
              kinder={
                <>
                  <Schalter label="Verkauf modellieren" wert={s.veraeusserungAktiv} onChange={set("veraeusserungAktiv")}
                    hinweis="Zeigt Verkaufserlös, Restschuld-Ablösung und eine mögliche Spekulationssteuer für ein frei wählbares Jahr" />
                  {s.veraeusserungAktiv && (
                    <>
                      <Feld label="Verkauf im Jahr" wert={s.veraeusserungJahr} onChange={set("veraeusserungJahr")}
                        hinweis="Unabhängig vom Betrachtungsende — auch außerhalb des Zeitraums oben möglich" />
                      <Feld label="Verkauf im Monat" wert={s.veraeusserungMonat} onChange={set("veraeusserungMonat")} />
                      <Feld label="Verkaufskosten" wert={s.verkaufskostenSatz} onChange={set("verkaufskostenSatz")} suffix="%"
                        hinweis="Makler, Vermarktung u. Ä., in % vom Verkaufspreis" />
                    </>
                  )}
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
              {[["liquiditaet","Liquidität"],["steuer","Steuerwirkung"],["kosten","Kosten und AfA"],["vermoegen","Vermögen"],["veraeusserung","Veräußerung"]]
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
                  {s.gebaeudeart === "denkmal" &&
                    " Bei Denkmalimmobilien läuft die AfA nur über § 7h/§ 7i EStG (9 % über 8 Jahre, danach 7 % über 4 Jahre auf die Modernisierungskosten); die Altbausubstanz wird daneben linear abgeschrieben. Degressive AfA und § 7b EStG gelten ausschließlich für Neubauten."}
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
                      {s.gebaeudeart === "neubau" ? (
                        <>
                          <div className="stark"><dt>Grundlage {s.degressiv ? "degressive" : "lineare"} AfA</dt>
                            <dd>{eur(r.bmgDegressiv)} €</dd></div>
                          {s.sonder7b && (
                            <>
                              <div><dt>Herstellungskosten abzgl. Zuschuss</dt><dd>{eur(r.bmg7bRoh)} €</dd></div>
                              <div><dt>Kappung {eur(s.max7bProQm)} €/m² × {eur2(s.bgf)} m²</dt><dd>{eur(r.kappung)} €</dd></div>
                              <div className="stark"><dt>Grundlage § 7b EStG</dt><dd>{eur(r.bmg7b)} €</dd></div>
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="stark"><dt>Grundlage Modernisierung § 7h/7i</dt>
                            <dd>{eur(r.denkmalModernisierung)} €</dd></div>
                          <div className="stark"><dt>Grundlage Altbau, linear</dt>
                            <dd>{eur(r.denkmalAltbau)} €</dd></div>
                        </>
                      )}
                    </dl>
                  </div>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Jahr</th>
                      <th>{s.gebaeudeart === "denkmal" ? "Altbau linear" : (s.degressiv ? "Degressive AfA" : "Lineare AfA")}</th>
                      <th>{s.gebaeudeart === "denkmal" ? "Modernisierung § 7h/7i" : "Sonder-AfA § 7b"}</th>
                      <th>AfA gesamt</th><th>Restschuld</th>
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
                  {r.irr === null ? "nicht bestimmbar" : pct(r.irr) + " %"}. Diese Ansicht geht von
                  einem Halten der Immobilie über den gesamten Betrachtungszeitraum aus. Für einen
                  Verkauf zu einem frei wählbaren Jahr — inklusive einer möglichen Spekulationssteuer
                  nach § 23 EStG — siehe den Tab „Veräußerung".
                </p>
              </div>
            )}

            {tab === "veraeusserung" && (
              <div className="tafel">
                {!s.veraeusserungAktiv ? (
                  <p className="leer">
                    „Verkauf modellieren" ist in der Eingabespalte unter „Veräußerung" ausgeschaltet.
                    Aktivieren, um Verkaufserlös, Restschuld-Ablösung und eine mögliche
                    Spekulationssteuer für ein frei wählbares Jahr zu sehen.
                  </p>
                ) : (
                  <>
                    <dl className="bilanz">
                      <div><dt>Verkaufspreis im Jahr {r.veraeusserung.jahr}</dt><dd>{eur(r.veraeusserung.verkaufspreis)} €</dd></div>
                      {s.verkaufskostenSatz > 0 && (
                        <div><dt>abzüglich Verkaufskosten ({pct(s.verkaufskostenSatz)} %)</dt>
                          <dd>− {eur(r.veraeusserung.verkaufskosten)} €</dd></div>
                      )}
                      <div><dt>abzüglich Restschuld Darlehen</dt><dd>− {eur(r.veraeusserung.restschuld)} €</dd></div>
                      <div className="stark"><dt>Buchwert (Gesamtkosten abzgl. kumulierter AfA)</dt>
                        <dd>{eur(r.veraeusserung.buchwert)} €</dd></div>
                      <div className={r.veraeusserung.gewinn >= 0 ? "" : "stark"}>
                        <dt>Veräußerungsgewinn</dt>
                        <dd className={r.veraeusserung.gewinn >= 0 ? "steuer" : "aus"}>{eur(r.veraeusserung.gewinn)} €</dd>
                      </div>
                      <div>
                        <dt>Haltedauer</dt>
                        <dd>{Math.floor(r.veraeusserung.monateGehalten / 12)} Jahre, {r.veraeusserung.monateGehalten % 12} Monate</dd>
                      </div>
                      <div>
                        <dt>Spekulationsfrist § 23 EStG (10 Jahre)</dt>
                        <dd>{r.veraeusserung.spekulationspflichtig ? "noch nicht abgelaufen" : "abgelaufen — steuerfrei"}</dd>
                      </div>
                      {r.veraeusserung.spekulationspflichtig && (
                        <div>
                          <dt>{r.veraeusserung.steuerpflichtig ? "Spekulationssteuer" : "Spekulationssteuer (unter Freigrenze 600 €)"}</dt>
                          <dd>{r.veraeusserung.steuerpflichtig ? "− " + eur(r.veraeusserung.steuer) + " €" : "0 €"}</dd>
                        </div>
                      )}
                      <div className="stark"><dt>Netto-Verkaufserlös</dt><dd>{eur(r.veraeusserung.nettoerloes)} €</dd></div>
                    </dl>
                    <p className="fussnote">
                      Der Buchwert ergibt sich aus den Gesamtkosten abzüglich der bis zum Verkaufsjahr
                      tatsächlich in Anspruch genommenen AfA (degressiv/linear, § 7b oder § 7h/7i, je
                      nach Gebäudeart). Innerhalb von zehn Jahren seit dem Kaufvertrag ist ein Gewinn
                      von 600 € oder mehr in voller Höhe mit dem persönlichen Grenzsteuersatz im
                      Verkaufsjahr zu versteuern (Freigrenze, kein Freibetrag); nach Ablauf der Frist
                      ist der Gewinn steuerfrei. Maklerprovisionen des Käufers und Details der
                      Anschlussfinanzierung ab Verkaufsjahr sind nicht berücksichtigt.
                    </p>
                  </>
                )}
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

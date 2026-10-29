import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import KundenApp from "./KundenApp.jsx";
import "@fontsource/barlow/400.css";
import "@fontsource/barlow/500.css";
import "@fontsource/barlow/600.css";
import "@fontsource/barlow-semi-condensed/300.css";
import "@fontsource/barlow-semi-condensed/400.css";
import "@fontsource/barlow-semi-condensed/600.css";
import "@fontsource/barlow-semi-condensed/700.css";
import "./index.css";

// Die Teamansicht liegt unter /team und wird nur dort geladen.
const TeamApp = lazy(() => import("./TeamApp.jsx"));
const istTeamPfad = window.location.pathname.replace(/\/+$/, "").endsWith("/team");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {istTeamPfad ? (
      <Suspense fallback={null}>
        <TeamApp />
      </Suspense>
    ) : (
      <KundenApp />
    )}
  </React.StrictMode>
);

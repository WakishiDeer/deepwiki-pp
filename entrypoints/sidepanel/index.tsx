// filepath: entrypoints/sidepanel/index.tsx
import React from "react";
import ReactDOM from "react-dom/client";

function Sidepanel() {
  return (
    <div>
      <h1>Page Stacks</h1>
      <section>
        <h2>Images</h2>
        {/* IMAGES */}
      </section>
      <section>
        <h2>Tables</h2>
        {/* TABLES */}
      </section>
      <section>
        <h2>GitHub Repositories</h2>
        {/* REFERENCES */}
      </section>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Sidepanel />
  </React.StrictMode>
);

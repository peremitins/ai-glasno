import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

import AppRouter from "./app/AppRouter";
import { AppProviders } from "./app/providers/AppProviders";
import "./app/styles.css";
import { enableMocking } from "./mocks/enableMocking";

async function bootstrap() {
  await enableMocking();

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <AppProviders>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </AppProviders>
    </StrictMode>,
  );
}

void bootstrap();

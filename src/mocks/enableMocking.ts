export async function enableMocking() {
  if (!import.meta.env.DEV || import.meta.env.VITE_API_MODE === "remote") {
    return;
  }

  const { worker } = await import("./browser");

  await worker.start({ onUnhandledRequest: "bypass" });
}

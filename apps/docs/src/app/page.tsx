import { SENTIENT_PROJECT } from "@sentient/shared";

export default function DocsHomePage() {
  return (
    <main className="docs-shell">
      <h1>{SENTIENT_PROJECT.name} Developer Docs</h1>
      <p>API contracts, webhook guides, and integration documentation will live here.</p>
    </main>
  );
}

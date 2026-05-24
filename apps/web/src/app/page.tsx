import { SENTIENT_PROJECT } from "@sentient/shared";

export default function HomePage() {
  return (
    <main className="shell">
      <section className="intro">
        <p className="eyebrow">Phase 0</p>
        <h1>{SENTIENT_PROJECT.name}</h1>
        <p>{SENTIENT_PROJECT.description}</p>
      </section>
    </main>
  );
}

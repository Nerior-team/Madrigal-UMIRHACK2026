type PublicHoldingPageProps = {
  title: string;
};

export function PublicHoldingPage({ title }: PublicHoldingPageProps) {
  return (
    <main className="public-page public-page--holding">
      <section className="public-holding-card">
        <span className="public-eyebrow">Nerior</span>
        <h1>{title}</h1>
        <p>Не доступно в данный момент.</p>
      </section>
    </main>
  );
}

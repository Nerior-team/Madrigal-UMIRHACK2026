type PublicHoldingPageProps = { title: string };

export function PublicHoldingPage({ title }: PublicHoldingPageProps) {
  return <main className="public-page public-page--holding"><section className="public-holding-card"><span className="public-eyebrow">Nerior</span><h1>{title}</h1><p>{"\u041d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u043d\u043e \u0432 \u0434\u0430\u043d\u043d\u044b\u0439 \u043c\u043e\u043c\u0435\u043d\u0442."}</p></section></main>;
}

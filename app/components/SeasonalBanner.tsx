import Link from "next/link";
import { PRODUCT } from "@/lib/product";

function christmasPromoActive() {
  return Date.now() <= new Date(`${PRODUCT.christmas.endsIso}T23:59:59Z`).getTime();
}

// Rendered on the server; the homepage revalidates daily so the banner
// disappears on its own after Christmas.
export default function SeasonalBanner() {
  const { printOrderBy } = PRODUCT.christmas;
  if (!christmasPromoActive()) return null;

  return (
    <aside className="mtt-season" aria-label="Christmas ordering">
      <p>
        <span className="mtt-season__tag">New</span>
        A Christmas Eve story for them. Order printed books by <strong>{printOrderBy}</strong> for Christmas delivery; digital books arrive instantly.
      </p>
      <Link href="/create?theme=christmas" className="mtt-season__link">Start their Christmas story <span aria-hidden="true">→</span></Link>
    </aside>
  );
}

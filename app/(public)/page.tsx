import { resolveHomepageMode } from "@/lib/homepage-mode";
import { SinglePropertyHome } from "./_components/home/SinglePropertyHome";
import { PortfolioHome } from "./_components/home/PortfolioHome";
import { PortalHome } from "./_components/home/PortalHome";
import { EmptyHome } from "./_components/home/EmptyHome";

export const revalidate = 60;

export default async function HomePage() {
  const mode = await resolveHomepageMode();

  switch (mode) {
    case "single":
      return <SinglePropertyHome />;
    case "portfolio":
      return <PortfolioHome />;
    case "portal":
      return <PortalHome />;
    default:
      return <EmptyHome />;
  }
}

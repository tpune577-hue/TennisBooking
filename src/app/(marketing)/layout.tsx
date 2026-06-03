import { MarketingLangProvider } from "@/components/marketing/lang";
import { SiteFooter } from "@/components/marketing/site-footer";
import "./marketing.css";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MarketingLangProvider>
      {children}
      <SiteFooter />
    </MarketingLangProvider>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bilingual, useMarketingLang, type MarketingLang } from "./lang";

const NAV = [
  { href: "/", en: "Home", th: "หน้าแรก" },
  { href: "/courts", en: "The Courts", th: "คอร์ต" },
  { href: "/coaches", en: "Coaches", th: "โค้ช" },
  { href: "/booking", en: "Booking", th: "จองคอร์ต" },
  { href: "/contact", en: "Contact", th: "ติดต่อ" },
] as const;

export function SiteHeader({ onDark = false }: { onDark?: boolean }) {
  const pathname = usePathname();
  const { lang, setLang } = useMarketingLang();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const headerClass = [
    "site-header",
    onDark && !scrolled ? "on-dark" : "",
    scrolled ? "scrolled" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <header className={headerClass}>
        <Link className="brand" href="/" aria-label="Greenwich Tennis Academy — home">
          <span className="mark" aria-hidden="true">
            <Image
              src="/club/img/logo.png"
              alt=""
              width={42}
              height={42}
              priority
            />
          </span>
          <span className="name">
            <b>Greenwich</b>
            <span>Tennis Academy</span>
          </span>
        </Link>
        <nav className="nav" aria-label="Primary">
          <ul className="nav-links">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={pathname === item.href ? "page" : undefined}
                >
                  <Bilingual en={item.en} th={item.th} />
                </Link>
              </li>
            ))}
          </ul>
          <div className="nav-tools">
            <div className="lang-toggle" role="group" aria-label="Language">
              {(["en", "th"] as MarketingLang[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  data-lang={code}
                  className={lang === code ? "active" : undefined}
                  aria-pressed={lang === code}
                  onClick={() => setLang(code)}
                >
                  {code.toUpperCase()}
                </button>
              ))}
            </div>
            <Link className="nav-cta desktop-only" href="/booking">
              <Bilingual en="Book a court" th="จองคอร์ต" />
            </Link>
          </div>
          <button
            className="nav-toggle"
            type="button"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <svg width="20" height="14" viewBox="0 0 20 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M0 1h20M0 7h20M0 13h20" />
            </svg>
          </button>
        </nav>
      </header>

      <div className={`mobile-menu${menuOpen ? " open" : ""}`} aria-hidden={!menuOpen}>
        <button
          className="close"
          type="button"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        >
          &times;
        </button>
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
            <Bilingual en={item.en} th={item.th} />
          </Link>
        ))}
      </div>
    </>
  );
}

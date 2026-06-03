"use client";

import { useState } from "react";
import { Bilingual } from "./lang";
import { Reveal } from "./reveal";

export type FaqItem = {
  qEn: string;
  qTh: string;
  aEn: string;
  aTh: string;
};

export function FaqList({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="faq">
      {items.map((item, i) => {
        const open = openIndex === i;
        return (
          <div key={item.qEn} className={`faq-item${open ? " open" : ""}`}>
            <button
              className="faq-q"
              type="button"
              aria-expanded={open}
              onClick={() => setOpenIndex(open ? -1 : i)}
            >
              <Bilingual en={item.qEn} th={item.qTh} />
            </button>
            <div className="faq-a">
              <div className="inner">
                <Bilingual en={item.aEn} th={item.aTh} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function FaqSection({
  eyebrowEn,
  eyebrowTh,
  titleEn,
  titleTh,
  items,
  linkHref,
  linkEn,
  linkTh,
}: {
  eyebrowEn: string;
  eyebrowTh: string;
  titleEn: string;
  titleTh: string;
  items: FaqItem[];
  linkHref?: string;
  linkEn?: string;
  linkTh?: string;
}) {
  return (
    <section className="section band">
      <div className="container">
        <div className="sec-head center reveal in">
          <p className="eyebrow center">
            <Bilingual en={eyebrowEn} th={eyebrowTh} />
          </p>
          <h2 className="title">
            <Bilingual en={titleEn} th={titleTh} />
          </h2>
        </div>
        <Reveal>
          <FaqList items={items} />
        </Reveal>
        {linkHref && linkEn && linkTh ? (
          <div className="center" style={{ marginTop: 40 }}>
            <Reveal>
              <a className="link-arrow" href={linkHref}>
                <Bilingual en={linkEn} th={linkTh} /> →
              </a>
            </Reveal>
          </div>
        ) : null}
      </div>
    </section>
  );
}

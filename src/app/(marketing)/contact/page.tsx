import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Bilingual } from "@/components/marketing/lang";
import { FaqSection, type FaqItem } from "@/components/marketing/faq";
import { Reveal } from "@/components/marketing/reveal";
import { SiteHeader } from "@/components/marketing/site-header";

export const metadata: Metadata = {
  title: "Contact & FAQ — Greenwich Tennis Academy",
  description: "Visit Greenwich Tennis Academy — address, hours, LINE and enquiries.",
};

const CONTACT_FAQ: FaqItem[] = [
  {
    qEn: "How do I book a court?",
    qTh: "จองคอร์ตได้อย่างไร?",
    aEn: "Members book through the booking page or LINE. Continue to the member app to sign in and confirm.",
    aTh: "สมาชิกจองผ่านหน้าจองหรือ LINE ไปยังแอปสมาชิกเพื่อเข้าสู่ระบบและยืนยัน",
  },
  {
    qEn: "How do I become a member?",
    qTh: "สมัครสมาชิกอย่างไร?",
    aEn: "Contact us for a private tour and membership conversation. Greenwich is a private members' club.",
    aTh: "ติดต่อเราเพื่อนัดทัวร์ส่วนตัวและพูดคุยเรื่องสมาชิก Greenwich เป็นสโมสรสมาชิกส่วนตัว",
  },
  {
    qEn: "What are your opening hours?",
    qTh: "เปิดกี่โมง?",
    aEn: "We are open daily from 06:00 to 23:00.",
    aTh: "เปิดทุกวัน 06:00–23:00 น.",
  },
  {
    qEn: "Is parking available?",
    qTh: "มีที่จอดรถไหม?",
    aEn: "Complimentary parking is available for members and guests visiting by appointment.",
    aTh: "มีที่จอดรถสำหรับสมาชิกและแขกที่นัดหมายเยี่ยมชม",
  },
];

export default function ContactPage() {
  return (
    <>
      <SiteHeader onDark />
      <section className="page-hero" style={{ minHeight: "52vh" }}>
        <div className="hero-bg">
          <Image
            src="/club/img/lounge-sofas.jpg"
            alt="The members' lounge"
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover" }}
          />
          <div className="scrim" />
        </div>
        <div className="container">
          <div className="hero-content">
            <p className="eyebrow">
              <Bilingual en="Contact & Visit" th="ติดต่อและเยี่ยมชม" />
            </p>
            <h1 className="display" style={{ textWrap: "balance" }}>
              <Bilingual
                en={
                  <>
                    We&apos;d love
                    <br />
                    to welcome you.
                  </>
                }
                th={
                  <>
                    เรายินดี
                    <br />
                    ต้อนรับคุณ
                  </>
                }
              />
            </h1>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="contact-grid">
            <Reveal>
              <div className="info-block">
                <div className="k">
                  <Bilingual en="Address" th="ที่อยู่" />
                </div>
                <div className="v">
                  <Bilingual
                    en="Greenwich Tennis Academy, Bangkok 10110, Thailand"
                    th="Greenwich Tennis Academy กรุงเทพมหานคร 10110"
                  />
                </div>
              </div>
              <div className="info-block">
                <div className="k">
                  <Bilingual en="Opening hours" th="เวลาทำการ" />
                </div>
                <div className="v">
                  <Bilingual en="Daily · 06:00 – 23:00" th="ทุกวัน · 06:00 – 23:00" />
                </div>
              </div>
              <div className="info-block">
                <div className="k">
                  <Bilingual en="Phone" th="โทรศัพท์" />
                </div>
                <div className="v">
                  <a href="tel:+6620000000">+66 2 000 0000</a>
                </div>
              </div>
              <div className="info-block">
                <div className="k">LINE</div>
                <div className="v">
                  <a href="https://line.me" target="_blank" rel="noopener noreferrer">
                    @greenwichtennis
                  </a>
                </div>
              </div>
              <div className="info-block">
                <div className="k">
                  <Bilingual en="Email" th="อีเมล" />
                </div>
                <div className="v">
                  <a href="mailto:hello@greenwichtennis.co.th">hello@greenwichtennis.co.th</a>
                </div>
              </div>
              <div className="info-block">
                <div className="k">
                  <Bilingual en="Member booking" th="จองสำหรับสมาชิก" />
                </div>
                <div className="v">
                  <Link href="/liff">
                    <Bilingual en="Open member app (LINE)" th="เปิดแอปสมาชิก (LINE)" />
                  </Link>
                </div>
              </div>
            </Reveal>
            <Reveal>
              <iframe
                className="map-embed"
                title="Map to Greenwich Tennis Academy"
                src="https://maps.google.com/maps?q=Bangkok&t=&z=12&ie=UTF8&iwloc=&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal>
            <div className="line-card">
              <div>
                <b>
                  <Bilingual en="Quickest way to reach us" th="วิธีติดต่อที่เร็วที่สุด" />
                </b>
                <div style={{ opacity: 0.92, marginTop: 4 }}>
                  <Bilingual
                    en="Add us on LINE for bookings, enquiries and membership."
                    th="เพิ่มเพื่อนใน LINE สำหรับการจอง สอบถาม และสมาชิก"
                  />
                </div>
              </div>
              <a className="btn btn-light" href="https://line.me" target="_blank" rel="noopener noreferrer">
                <Bilingual en="Add @greenwichtennis" th="เพิ่ม @greenwichtennis" />
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <FaqSection
        eyebrowEn="FAQ"
        eyebrowTh="คำถามที่พบบ่อย"
        titleEn="Answers at a glance"
        titleTh="คำตอบสั้นๆ"
        items={CONTACT_FAQ}
      />
    </>
  );
}

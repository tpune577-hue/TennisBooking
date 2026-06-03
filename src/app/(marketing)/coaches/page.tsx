import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Bilingual } from "@/components/marketing/lang";
import { Reveal } from "@/components/marketing/reveal";
import { SiteHeader } from "@/components/marketing/site-header";

export const metadata: Metadata = {
  title: "Coaches & Academy — Greenwich Tennis Academy",
  description:
    "Train beside ITF-certified coaches at Greenwich Tennis Academy — private, group, junior and adult programmes.",
};

const PROGRAMMES = [
  {
    kickerEn: "Private",
    kickerTh: "ส่วนตัว",
    titleEn: "Private coaching",
    titleTh: "คลาสส่วนตัว",
    bodyEn: "One-to-one sessions shaped entirely around your goals, tempo and schedule.",
    bodyTh: "คลาสตัวต่อตัวที่ออกแบบตามเป้าหมาย จังหวะ และตารางเวลาของคุณ",
  },
  {
    kickerEn: "Group",
    kickerTh: "กลุ่ม",
    titleEn: "Group clinics",
    titleTh: "คลินิกกลุ่ม",
    bodyEn: "Small, friendly groups for steady progress and the company of fellow members.",
    bodyTh: "กลุ่มเล็กที่เป็นกันเอง เพื่อพัฒนาการที่มั่นคงและมิตรภาพระหว่างสมาชิก",
  },
  {
    kickerEn: "Junior",
    kickerTh: "เยาวชน",
    titleEn: "Junior development",
    titleTh: "พัฒนาเยาวชน",
    bodyEn: "A structured pathway for young players, from first racquet to competitive play.",
    bodyTh: "เส้นทางที่เป็นระบบสำหรับนักกีฬารุ่นเยาว์ ตั้งแต่ไม้แรกจนถึงการแข่งขัน",
  },
  {
    kickerEn: "Adult",
    kickerTh: "ผู้ใหญ่",
    titleEn: "Adult & wellness",
    titleTh: "ผู้ใหญ่และสุขภาพ",
    bodyEn: "Play for fitness and pleasure, with technique that keeps you moving well for years.",
    bodyTh: "เล่นเพื่อสุขภาพและความสุข ด้วยเทคนิคที่ช่วยให้คุณเคลื่อนไหวได้ดีไปอีกนาน",
  },
];

const COACHES = [
  {
    img: "/club/img/court-doubles.jpg",
    name: "Khun Anan P.",
    roleEn: "Head Coach",
    roleTh: "หัวหน้าโค้ช",
    bioEn:
      "Davis Cup background. Twenty years developing players from first serve to national level.",
    bioTh: "อดีตนักเดวิสคัพ ประสบการณ์ 20 ปี พัฒนานักกีฬาตั้งแต่เริ่มต้นจนถึงระดับชาติ",
  },
  {
    img: "/club/img/court-interior-side.jpg",
    name: "Coach Mariana R.",
    roleEn: "Performance",
    roleTh: "เพอร์ฟอร์แมนซ์",
    bioEn: "ITF-certified. Specialist in junior development and competitive movement.",
    bioTh: "ได้รับการรับรองจาก ITF เชี่ยวชาญการพัฒนาเยาวชนและการเคลื่อนไหวเชิงแข่งขัน",
  },
  {
    img: "/club/img/court-interior-wide.jpg",
    name: "Coach Théo L.",
    roleEn: "Private & Adult",
    roleTh: "ส่วนตัวและผู้ใหญ่",
    bioEn: "Patient, precise, and warm. Tailors every session to your own goals.",
    bioTh: "ใจเย็น แม่นยำ และอบอุ่น ออกแบบทุกคลาสให้ตรงเป้าหมายของคุณ",
  },
];

export default function CoachesPage() {
  return (
    <>
      <SiteHeader onDark />
      <section className="page-hero">
        <div className="hero-bg">
          <Image
            src="/club/img/court-doubles.jpg"
            alt="Coaching on court"
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
              <Bilingual en="Coaches & Academy" th="โค้ชและอะคาเดมี" />
            </p>
            <h1 className="display" style={{ textWrap: "balance" }}>
              <Bilingual
                en={
                  <>
                    Guided by people
                    <br />
                    who love the game.
                  </>
                }
                th={
                  <>
                    ดูแลโดยผู้คน
                    <br />
                    ที่รักในเกมนี้
                  </>
                }
              />
            </h1>
            <p className="lede">
              <Bilingual
                en="From a first lesson to national-level preparation — our coaches meet you exactly where you are."
                th="ตั้งแต่บทเรียนแรกจนถึงการเตรียมตัวระดับชาติ โค้ชของเราพร้อมดูแลคุณในทุกระดับ"
              />
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal className="sec-head center">
            <p className="eyebrow center">
              <Bilingual en="Programmes" th="โปรแกรม" />
            </p>
            <h2 className="title" style={{ textWrap: "balance" }}>
              <Bilingual en="A path for everyone" th="เส้นทางสำหรับทุกคน" />
            </h2>
          </Reveal>
          <Reveal>
            <div className="grid cols-2">
              {PROGRAMMES.map((p) => (
                <article key={p.titleEn} className="card">
                  <div className="card-body">
                    <div className="card-kicker">
                      <Bilingual en={p.kickerEn} th={p.kickerTh} />
                    </div>
                    <h3>
                      <Bilingual en={p.titleEn} th={p.titleTh} />
                    </h3>
                    <p>
                      <Bilingual en={p.bodyEn} th={p.bodyTh} />
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section band">
        <div className="container">
          <Reveal className="sec-head center">
            <p className="eyebrow center">
              <Bilingual en="Our coaches" th="โค้ชของเรา" />
            </p>
            <h2 className="title" style={{ textWrap: "balance" }}>
              <Bilingual en="Experience you can trust." th="ประสบการณ์ที่ไว้ใจได้" />
            </h2>
          </Reveal>
          <div className="grid cols-3">
            {COACHES.map((c) => (
              <Reveal key={c.name}>
                <article className="coach">
                  <div className="figure">
                    <Image
                      src={c.img}
                      alt="Coach on court"
                      width={600}
                      height={800}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <div className="meta">
                    <h3>{c.name}</h3>
                    <div className="role">
                      <Bilingual en={c.roleEn} th={c.roleTh} />
                    </div>
                    <p className="bio">
                      <Bilingual en={c.bioEn} th={c.bioTh} />
                    </p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <div className="center" style={{ marginTop: 48 }}>
              <Link className="btn btn-primary" href="/contact">
                <Bilingual en="Enquire about coaching" th="สอบถามเรื่องคลาส" />
                <span className="arrow">→</span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Bilingual } from "@/components/marketing/lang";
import { FaqSection, type FaqItem } from "@/components/marketing/faq";
import { Reveal } from "@/components/marketing/reveal";
import { SiteHeader } from "@/components/marketing/site-header";
import { MEMBER_SIGN_IN_HREF } from "@/lib/marketing/member-auth-links";

export const metadata: Metadata = {
  title: "Greenwich Tennis Academy — A private home for the game",
  description:
    "Greenwich Tennis Academy — a private members' club where European architecture meets garden serenity, with international-standard indoor courts.",
};

const HOME_FAQ: FaqItem[] = [
  {
    qEn: "How do I book a court?",
    qTh: "จองคอร์ตได้อย่างไร?",
    aEn: "Members book in seconds through the online booking page or our LINE official account. Credits are topped up via PromptPay.",
    aTh: "สมาชิกจองได้ในไม่กี่วินาทีผ่านหน้าจองออนไลน์หรือ LINE official account เติมเครดิตผ่าน PromptPay",
  },
  {
    qEn: "Do I need to be a member?",
    qTh: "ต้องเป็นสมาชิกหรือไม่?",
    aEn: "Greenwich is a private members' club. We welcome enquiries and arrange private tours for prospective members.",
    aTh: "Greenwich เป็นสโมสรสมาชิกส่วนตัว เรายินดีต้อนรับการสอบถามและจัดทัวร์ส่วนตัวสำหรับผู้สนใจ",
  },
  {
    qEn: "Are coaching sessions available for beginners?",
    qTh: "มีคลาสสำหรับผู้เริ่มต้นไหม?",
    aEn: "Yes: from first-timers to competitive juniors and adults. Private and group sessions are available with our coaches.",
    aTh: "มีครับ ตั้งแต่ผู้เริ่มต้น เยาวชนเชิงแข่งขัน ไปจนถึงผู้ใหญ่ ทั้งคลาสส่วนตัวและกลุ่มกับโค้ชของเรา",
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

export default function MarketingHomePage() {
  return (
    <>
      <SiteHeader onDark />
      <section className="hero" data-hero="editorial">
        <div className="hero-variant" data-variant="editorial">
          <div className="hv-editorial">
            <div className="hero-bg">
              <Image
                src="/club/img/courtyard-garden.jpg"
                alt="Greenwich Tennis Academy courtyard with cherry blossoms"
                fill
                priority
                sizes="100vw"
                style={{ objectFit: "cover" }}
              />
            </div>
            <div className="scrim" />
            <div className="container">
              <div className="hero-content reveal in">
                <p className="eyebrow">
                  <Bilingual
                    en="International Indoor Tennis · Members Only"
                    th="คอร์ตเทนนิสในร่มมาตรฐานสากล · เฉพาะสมาชิก"
                  />
                </p>
                <h1 className="display" style={{ textWrap: "balance" }}>
                  <Bilingual
                    en={
                      <>
                        A private home for
                        <br />
                        the game you love.
                      </>
                    }
                    th={
                      <>
                        บ้านส่วนตัว
                        <br />
                        สำหรับเกมที่คุณรัก
                      </>
                    }
                  />
                </h1>
                <p className="hero-sub">
                  <Bilingual
                    en="An international indoor tennis academy where European architecture meets the calm of a Japanese garden. Members only. Unhurried by design."
                    th="อะคาเดมีเทนนิสในร่มระดับสากล ที่ผสานสถาปัตยกรรมยุโรปเข้ากับความสงบของสวนญี่ปุ่น เฉพาะสมาชิก เรียบง่ายอย่างตั้งใจ"
                  />
                </p>
                <div className="hero-cta">
                  <Link className="btn btn-primary" href={MEMBER_SIGN_IN_HREF}>
                    <Bilingual en="Book a court" th="จองคอร์ต" />
                    <span className="arrow">→</span>
                  </Link>
                  <Link className="btn btn-outline-light" href="/courts">
                    <Bilingual en="Explore the academy" th="ชมอะคาเดมี" />
                  </Link>
                  <Link className="btn btn-outline-light" href="/liff">
                    <Bilingual en="Member app (LINE)" th="แอปสมาชิก (LINE)" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-scroll" aria-hidden="true">
          <Bilingual en="Scroll" th="เลื่อนลง" />
          <span className="line" />
        </div>
      </section>

      <section className="section band-wood">
        <div className="container">
          <div className="feature">
            <Reveal className="feature-media">
              <div className="figure ratio-3-2">
                <Image
                  src="/club/img/courtyard-garden.jpg"
                  alt="Garden courtyard between the two vaulted halls"
                  width={1200}
                  height={800}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div className="tag-float">
                <div className="n">六</div>
                <div className="l">
                  <Bilingual en="Six courts, wrapped in gardens" th="หกคอร์ต โอบล้อมด้วยสวน" />
                </div>
              </div>
            </Reveal>
            <Reveal className="feature-body">
              <p className="eyebrow">
                <Bilingual en="Our philosophy" th="ปรัชญาของเรา" />
              </p>
              <h2 className="title" style={{ textWrap: "balance" }}>
                <Bilingual en="A sanctuary, not a stadium." th="สถานที่พักใจ ไม่ใช่สนามกีฬา" />
              </h2>
              <div className="stack">
                <p>
                  <Bilingual
                    en="Greenwich Tennis Academy is built around a simple belief: the calm of a garden and the quiet grandeur of European architecture belong together. Cherry blossoms and willows frame courts held to international standard."
                    th="Greenwich Tennis Academy สร้างขึ้นบนความเชื่อเรียบง่าย: ความสงบของสวนและความสง่างามเงียบสงบของสถาปัตยกรรมยุโรปนั้นเป็นหนึ่งเดียวกัน ดอกซากุระและต้นหลิวโอบล้อมคอร์ตที่ได้มาตรฐานสากล"
                  />
                </p>
                <p>
                  <Bilingual
                    en="Every detail is considered so that arriving here feels less like checking in, and more like coming home."
                    th="ทุกรายละเอียดถูกคิดมาอย่างพิถีพิถัน เพื่อให้การมาที่นี่ ไม่ใช่แค่การเช็คอิน แต่คือการกลับบ้าน"
                  />
                </p>
              </div>
              <Link className="link-arrow" href="/courts" style={{ marginTop: "1.6rem" }}>
                <Bilingual en="Discover the facility" th="สำรวจสถานที่" /> →
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal className="sec-head center">
            <p className="eyebrow center">
              <Bilingual en="The Courts" th="คอร์ต" />
            </p>
            <h2 className="title" style={{ textWrap: "balance" }}>
              <Bilingual en="An indoor standard, all year round." th="มาตรฐานในร่ม ตลอดทั้งปี" />
            </h2>
            <p className="lede mx-auto">
              <Bilingual
                en="Climate-controlled halls beneath sweeping aluminium vaults: true tournament conditions, shielded from sun, rain and heat."
                th="ฮอลล์ปรับอากาศใต้หลังคาโค้งอะลูมิเนียม สภาพการเล่นระดับทัวร์นาเมนต์ ปลอดแดด ฝน และความร้อน"
              />
            </p>
          </Reveal>
          <Reveal>
            <div className="figure ratio-16-9" style={{ boxShadow: "var(--shadow-md)" }}>
              <Image
                src="/club/img/court-interior-wide.jpg"
                alt="Indoor tennis court under the vaulted roof"
                width={1600}
                height={900}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          </Reveal>
          <div style={{ marginTop: 42 }}>
            <Reveal>
            <div className="stat-row">
              <div className="stat">
                <div className="n">6</div>
                <div className="l">
                  <Bilingual en="Indoor courts" th="คอร์ตในร่ม" />
                </div>
              </div>
              <div className="stat">
                <div className="n">ITF</div>
                <div className="l">
                  <Bilingual en="Standard surface & lighting" th="พื้นผิวและแสงมาตรฐาน" />
                </div>
              </div>
              <div className="stat">
                <div className="n">06–23</div>
                <div className="l">
                  <Bilingual en="Open daily, hrs" th="เปิดทุกวัน (น.)" />
                </div>
              </div>
              <div className="stat">
                <div className="n">24°C</div>
                <div className="l">
                  <Bilingual en="Climate-controlled" th="ควบคุมอุณหภูมิ" />
                </div>
              </div>
            </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section band">
        <div className="container">
          <Reveal className="sec-head">
            <p className="eyebrow">
              <Bilingual en="The Academy" th="อะคาเดมี" />
            </p>
            <h2 className="title" style={{ textWrap: "balance" }}>
              <Bilingual
                en={
                  <>
                    Learn beside coaches
                    <br />
                    who have been there.
                  </>
                }
                th={
                  <>
                    เรียนรู้เคียงข้างโค้ช
                    <br />
                    ผู้มากประสบการณ์
                  </>
                }
              />
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
              <Link className="btn btn-ghost" href="/coaches">
                <Bilingual en="Meet the coaches" th="พบกับโค้ชทั้งหมด" />
                <span className="arrow">→</span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section wood-band">
        <div className="container">
          <div className="feature reverse">
            <Reveal className="feature-media">
              <div className="figure ratio-4-3">
                <Image
                  src="/club/img/cafe-counter.jpg"
                  alt="The café counter in warm timber"
                  width={1200}
                  height={900}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            </Reveal>
            <Reveal className="feature-body">
              <p className="eyebrow">
                <Bilingual en="Clubhouse & Café" th="คลับเฮาส์และคาเฟ่" />
              </p>
              <h2 className="title" style={{ textWrap: "balance" }}>
                <Bilingual
                  en={
                    <>
                      The warmest room
                      <br />
                      after the last point.
                    </>
                  }
                  th={
                    <>
                      ห้องที่อบอุ่นที่สุด
                      <br />
                      หลังแต้มสุดท้าย
                    </>
                  }
                />
              </h2>
              <p>
                <Bilingual
                  en="Oak, marble and soft light. A café, a lounge, and quiet corners that open onto the garden: somewhere to slow down, share a coffee, and stay long after the match."
                  th="ไม้โอ๊ก หินอ่อน และแสงนุ่มนวล คาเฟ่ เลาจน์ และมุมสงบที่เปิดออกสู่สวน ที่ให้คุณได้ผ่อนคลาย จิบกาแฟ และอยู่ต่อนานหลังจบเกม"
                />
              </p>
              <ul className="checks">
                <li>
                  <Bilingual en="Specialty coffee & fresh bakery" th="กาแฟพิเศษและเบเกอรีสดใหม่" />
                </li>
                <li>
                  <Bilingual en="Members' lounge with garden views" th="เลาจน์สมาชิกพร้อมวิวสวน" />
                </li>
                <li>
                  <Bilingual en="Pro shop & racquet stringing" th="โปรช็อปและบริการขึ้นเอ็น" />
                </li>
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal>
            <div className="cta-band">
              <div className="bg">
                <Image
                  src="/club/img/exterior-sunset.jpg"
                  alt="The academy at golden hour"
                  fill
                  sizes="100vw"
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div className="scrim" />
              <div className="inner">
                <p className="eyebrow">
                  <Bilingual en="Membership" th="สมาชิก" />
                </p>
                <h2 className="title" style={{ textWrap: "balance" }}>
                  <Bilingual en="An invitation to belong." th="คำเชิญสู่การเป็นส่วนหนึ่ง" />
                </h2>
                <p style={{ margin: "1rem 0 2rem", fontSize: "1.1rem", color: "rgba(255,255,255,.92)" }}>
                  <Bilingual
                    en="Reserve a court, arrange a private tour, or speak with our team about membership at Greenwich Tennis Academy."
                    th="จองคอร์ต นัดเยี่ยมชมแบบส่วนตัว หรือพูดคุยกับทีมงานเกี่ยวกับการเป็นสมาชิกของ Greenwich Tennis Academy"
                  />
                </p>
                <div className="hero-cta">
                  <Link className="btn btn-light" href={MEMBER_SIGN_IN_HREF}>
                    <Bilingual en="Book a court" th="จองคอร์ต" />
                    <span className="arrow">→</span>
                  </Link>
                  <Link className="btn btn-outline-light" href="/contact">
                    <Bilingual en="Contact the club" th="ติดต่อสโมสร" />
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <FaqSection
        eyebrowEn="Questions"
        eyebrowTh="คำถามที่พบบ่อย"
        titleEn="Good to know"
        titleTh="เรื่องน่ารู้"
        items={HOME_FAQ}
        linkHref="/contact"
        linkEn="All questions & contact"
        linkTh="คำถามทั้งหมดและการติดต่อ"
      />
    </>
  );
}

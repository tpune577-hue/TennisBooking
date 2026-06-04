import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Bilingual } from "@/components/marketing/lang";
import { Reveal } from "@/components/marketing/reveal";
import { SiteHeader } from "@/components/marketing/site-header";
import { BookCourtCta } from "@/components/marketing/book-court-cta";

export const metadata: Metadata = {
  title: "The Courts — Greenwich Tennis Academy",
  description:
    "International-standard indoor tennis courts beneath sweeping aluminium vaults at Greenwich Tennis Academy.",
};

export default function CourtsPage() {
  return (
    <>
      <SiteHeader onDark />
      <section className="page-hero">
        <div className="hero-bg">
          <Image
            src="/club/img/court-interior-wide.jpg"
            alt="Indoor court beneath the vaulted roof"
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
              <Bilingual en="The Courts" th="คอร์ต" />
            </p>
            <h1 className="display" style={{ textWrap: "balance" }}>
              <Bilingual
                en={
                  <>
                    Built for the game,
                    <br />
                    all year round.
                  </>
                }
                th={
                  <>
                    สร้างมาเพื่อเกม
                    <br />
                    ตลอดทั้งปี
                  </>
                }
              />
            </h1>
            <p className="lede">
              <Bilingual
                en="Six climate-controlled indoor courts beneath sweeping aluminium vaults — true tournament conditions, whatever the weather outside."
                th="หกคอร์ตในร่มปรับอากาศ ใต้หลังคาโค้งอะลูมิเนียม สภาพการเล่นระดับทัวร์นาเมนต์ ไม่ว่าอากาศภายนอกจะเป็นอย่างไร"
              />
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="feature">
            <Reveal className="feature-body">
              <p className="eyebrow">
                <Bilingual en="The architecture" th="สถาปัตยกรรม" />
              </p>
              <h2 className="title" style={{ textWrap: "balance" }}>
                <Bilingual en="Light, held overhead." th="แสง ที่โอบไว้เหนือศีรษะ" />
              </h2>
              <div className="stack">
                <p>
                  <Bilingual
                    en="Twin barrel vaults rise over the courts, drawing soft, even daylight through clerestory glazing while the aluminium skin keeps sun and heat at bay. The result is a hall that feels open to the sky, yet protected."
                    th="หลังคาโค้งคู่ทอดตัวเหนือคอร์ต รับแสงธรรมชาติที่นุ่มนวลและสม่ำเสมอผ่านช่องกระจกด้านบน ขณะที่ผิวอะลูมิเนียมช่วยกันแดดและความร้อน ผลลัพธ์คือฮอลล์ที่รู้สึกเปิดโล่งสู่ท้องฟ้า แต่ยังได้รับการปกป้อง"
                  />
                </p>
              </div>
              <ul className="checks">
                <li>
                  <Bilingual en="Even, glare-free daylight by day" th="แสงธรรมชาติสม่ำเสมอ ไร้แสงสะท้อนในเวลากลางวัน" />
                </li>
                <li>
                  <Bilingual en="Tournament-grade LED lighting by night" th="ไฟ LED ระดับทัวร์นาเมนต์ในเวลากลางคืน" />
                </li>
                <li>
                  <Bilingual en="Acoustically calm, fully climate-controlled" th="เสียงเงียบสงบ ควบคุมอุณหภูมิเต็มรูปแบบ" />
                </li>
              </ul>
            </Reveal>
            <Reveal className="feature-media">
              <div className="figure ratio-4-3">
                <Image
                  src="/club/img/court-interior-side.jpg"
                  alt="Vaulted roof structure over the court"
                  width={1200}
                  height={900}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section band" style={{ paddingBlock: "clamp(48px,7vw,88px)" }}>
        <div className="container">
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
                  <Bilingual en="Standard surface" th="พื้นผิวมาตรฐาน" />
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
      </section>

      <section className="section">
        <div className="container">
          <div className="feature reverse">
            <Reveal className="feature-media">
              <div className="figure ratio-4-3">
                <Image
                  src="/club/img/court-doubles.jpg"
                  alt="Players in a doubles rally"
                  width={1200}
                  height={900}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            </Reveal>
            <Reveal className="feature-body">
              <p className="eyebrow">
                <Bilingual en="Surface & play" th="พื้นผิวและการเล่น" />
              </p>
              <h2 className="title" style={{ textWrap: "balance" }}>
                <Bilingual en="Courts that reward precision." th="คอร์ตที่ให้รางวัลความแม่นยำ" />
              </h2>
              <p>
                <Bilingual
                  en="ITF-standard acrylic surfaces with consistent bounce and pace. Lighting calibrated for evening matches without glare or shadow pockets."
                  th="พื้นอะคริลิกมาตรฐาน ITF ลูกเด้งและจังหวะสม่ำเสมอ แสงปรับสำหรับการแข่งขันตอนเย็นโดยไม่มีแสงสะท้อนหรือเงาบดบัง"
                />
              </p>
              <BookCourtCta className="btn btn-primary" style={{ marginTop: "1.6rem" }}>
                <Bilingual en="Book a court" th="จองคอร์ต" />
                <span className="arrow">→</span>
              </BookCourtCta>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}

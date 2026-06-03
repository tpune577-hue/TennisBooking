import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Bilingual } from "@/components/marketing/lang";
import { Reveal } from "@/components/marketing/reveal";
import { SiteHeader } from "@/components/marketing/site-header";

export const metadata: Metadata = {
  title: "Book a Court — Greenwich Tennis Academy",
  description: "Reserve an indoor court at Greenwich Tennis Academy — members sign in to book.",
};

const BOOK_CALLBACK = "/liff/home";
const SIGN_IN_HREF = `/sign-in?callbackUrl=${encodeURIComponent(BOOK_CALLBACK)}`;

export default function BookingPage() {
  return (
    <>
      <SiteHeader />
      <section className="section marketing-page-intro">
        <div className="container">
          <Reveal className="sec-head" startIn>
            <p className="eyebrow">
              <Bilingual en="Booking" th="จองคอร์ต" />
            </p>
            <h1 className="title" style={{ textWrap: "balance" }}>
              <Bilingual en="Reserve your court" th="จองคอร์ตของคุณ" />
            </h1>
            <p className="lede">
              <Bilingual
                en="Court booking is for members only. Sign in once, then choose your day, court, and time."
                th="การจองคอร์ตสำหรับสมาชิกเท่านั้น เข้าสู่ระบบครั้งเดียว แล้วเลือกวัน คอร์ต และเวลา"
              />
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal>
            <div
              className="booking-card"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: "var(--radius)",
                padding: "clamp(28px, 4vw, 48px)",
                boxShadow: "var(--shadow-sm)",
                maxWidth: 560,
                margin: "0 auto",
                textAlign: "center",
              }}
            >
              <p style={{ marginBottom: "1.5rem", color: "var(--ink-2)" }}>
                <Bilingual
                  en="Use the same member account on the website and in LINE."
                  th="ใช้บัญชีสมาชิกเดียวกันทั้งบนเว็บและใน LINE"
                />
              </p>
              <Link className="btn btn-primary" href={SIGN_IN_HREF} style={{ width: "100%", justifyContent: "center" }}>
                <Bilingual en="Sign in to book" th="เข้าสู่ระบบเพื่อจอง" />
                <span className="arrow">→</span>
              </Link>
              <p style={{ marginTop: "1.25rem", fontSize: "0.9rem", color: "var(--ink-3)" }}>
                <Bilingual
                  en="LINE · email magic link · phone OTP"
                  th="LINE · ลิงก์อีเมล · OTP เบอร์โทร"
                />
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section band-wood">
        <div className="container">
          <Reveal className="sec-head center">
            <p className="eyebrow center">
              <Bilingual en="How it works" th="ขั้นตอนการจอง" />
            </p>
            <h2 className="title" style={{ textWrap: "balance" }}>
              <Bilingual en="Three quiet steps" th="สามขั้นตอนง่ายๆ" />
            </h2>
          </Reveal>
          <Reveal>
            <div className="grid cols-3">
              <div className="step">
                <div className="num">1</div>
                <div>
                  <h3>
                    <Bilingual en="Sign in" th="เข้าสู่ระบบ" />
                  </h3>
                  <p>
                    <Bilingual
                      en="Use LINE, email, or the phone number registered with the club."
                      th="ใช้ LINE อีเมล หรือเบอร์ที่ลงทะเบียนกับสโมสร"
                    />
                  </p>
                </div>
              </div>
              <div className="step">
                <div className="num">2</div>
                <div>
                  <h3>
                    <Bilingual en="Pick your slot" th="เลือกช่วงเวลา" />
                  </h3>
                  <p>
                    <Bilingual
                      en="Choose day, court, and time. Credits are reserved when you confirm."
                      th="เลือกวัน คอร์ต และเวลา เครดิตจะถูกจองเมื่อคุณยืนยัน"
                    />
                  </p>
                </div>
              </div>
              <div className="step">
                <div className="num">3</div>
                <div>
                  <h3>
                    <Bilingual en="Play" th="ลงเล่น" />
                  </h3>
                  <p>
                    <Bilingual
                      en="LINE confirmation is sent when your account is linked."
                      th="รับการยืนยันผ่าน LINE เมื่อผูกบัญชีแล้ว"
                    />
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal>
            <div className="cta-band">
              <div className="bg">
                <Image
                  src="/club/img/courtyard-garden.jpg"
                  alt="Academy courtyard"
                  fill
                  sizes="100vw"
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div className="scrim" />
              <div className="inner">
                <p className="eyebrow">
                  <Bilingual en="Not a member yet?" th="ยังไม่ได้เป็นสมาชิก?" />
                </p>
                <h2 className="title" style={{ textWrap: "balance" }}>
                  <Bilingual en="Begin with a private tour." th="เริ่มต้นด้วยการเยี่ยมชมส่วนตัว" />
                </h2>
                <p style={{ margin: "1rem 0 2rem", fontSize: "1.1rem", color: "rgba(255,255,255,.92)" }}>
                  <Bilingual
                    en="Speak with our team about membership and visit the courts in person."
                    th="พูดคุยกับทีมงานเรื่องสมาชิก และเยี่ยมชมคอร์ตด้วยตัวคุณเอง"
                  />
                </p>
                <Link className="btn btn-light" href="/contact">
                  <Bilingual en="Contact the club" th="ติดต่อสโมสร" />
                  <span className="arrow">→</span>
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

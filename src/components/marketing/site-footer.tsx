import Link from "next/link";
import { Bilingual } from "./lang";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="foot-brand">
          <b>Greenwich Tennis Academy</b>
          <p>
            <Bilingual
              en="An international indoor tennis academy. A private home for the game you love."
              th="อะคาเดมีเทนนิสในร่มระดับสากล บ้านส่วนตัวสำหรับเกมที่คุณรัก"
            />
          </p>
        </div>
        <div>
          <h4>
            <Bilingual en="Explore" th="เมนู" />
          </h4>
          <ul>
            <li>
              <Link href="/courts">
                <Bilingual en="The Courts" th="คอร์ต" />
              </Link>
            </li>
            <li>
              <Link href="/coaches">
                <Bilingual en="Coaches" th="โค้ช" />
              </Link>
            </li>
            <li>
              <Link href="/booking">
                <Bilingual en="Booking" th="จองคอร์ต" />
              </Link>
            </li>
            <li>
              <Link href="/contact">
                <Bilingual en="Contact & FAQ" th="ติดต่อและคำถาม" />
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4>
            <Bilingual en="Visit" th="เยี่ยมชม" />
          </h4>
          <ul>
            <li>
              <Bilingual en="Open daily · 06:00–23:00" th="เปิดทุกวัน · 06:00–23:00" />
            </li>
            <li>
              <Link href="/contact">
                <Bilingual en="Find us on the map" th="ดูแผนที่" />
              </Link>
            </li>
            <li>
              <a href="https://line.me" target="_blank" rel="noopener noreferrer">
                LINE · @greenwichtennis
              </a>
            </li>
            <li>
              <a href="tel:+6620000000">+66 2 000 0000</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="container foot-bottom">
        <span>© 2026 Greenwich Tennis Academy</span>
        <span>
          <Bilingual en="Members' tennis club · Bangkok" th="สโมสรเทนนิสสมาชิก · กรุงเทพฯ" />
        </span>
      </div>
    </footer>
  );
}

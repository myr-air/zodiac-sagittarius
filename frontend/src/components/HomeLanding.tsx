import Image from "next/image";
import Link from "next/link";

export function HomeLanding() {
  return (
    <main className="home-pixel-page" aria-labelledby="home-title">
      <h1 id="home-title" className="sr-only">
        วางแผนทริปกับเพื่อนง่ายขึ้น สนุกขึ้น ทุกการเดินทางเริ่มที่ Sagittarius
      </h1>
      <p className="sr-only">
        รวมทุกอย่างไว้ในที่เดียว คุยกัน ตัดสินใจ แชร์ไอเดีย ทำแผนเที่ยว และออกเดินทางไปด้วยกัน
      </p>

      <div className="home-pixel-canvas">
        <Image
          className="home-pixel-art"
          src="/landing/home-pixel-reference.png"
          alt="Sagittarius landing page preview with playful friend trip planning hero, trip board, map, checklist, and three-step workflow"
          width={1440}
          height={1100}
          priority
          unoptimized
        />

        <Link className="home-pixel-hotspot home-pixel-brand" href="/" aria-label="Sagittarius home" />
        <a className="home-pixel-hotspot home-pixel-features" href="#home-pixel-bottom" aria-label="ฟีเจอร์" />
        <a className="home-pixel-hotspot home-pixel-how" href="#home-pixel-bottom" aria-label="วิธีใช้งาน" />
        <Link className="home-pixel-hotspot home-pixel-plans" href="/join" aria-label="แผนและราคา" />
        <Link className="home-pixel-hotspot home-pixel-ideas" href="/join" aria-label="ไอเดียทริป" />
        <a className="home-pixel-hotspot home-pixel-about" href="#home-pixel-bottom" aria-label="เกี่ยวกับเรา" />
        <Link className="home-pixel-hotspot home-pixel-login" href="/login" aria-label="เข้าสู่ระบบ" />
        <Link className="home-pixel-hotspot home-pixel-register" href="/register" aria-label="สมัครฟรี" />
        <Link className="home-pixel-hotspot home-pixel-primary" href="/register" aria-label="เริ่มวางแผนทริปของคุณ" />
        <Link className="home-pixel-hotspot home-pixel-demo" href="/login" aria-label="ดูวิดีโอแนะนำ 1 นาที" />
        <span id="home-pixel-bottom" className="home-pixel-bottom-anchor" aria-hidden="true" />
      </div>
    </main>
  );
}

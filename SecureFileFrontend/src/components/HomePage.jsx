import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";

export default function HomePage() {
  const heroImageRef = useRef(null);

  useEffect(() => {
    /* ── 1. PAGE ENTRANCE ANIMATIONS ── */
    const entries = [
      { sel: ".cl-tag",           delay: 0   },
      { sel: ".cl-hero-h1",       delay: 120 },
      { sel: ".cl-hero-p",        delay: 240 },
      { sel: ".cl-buttons",       delay: 360 },
      { sel: ".cl-features",      delay: 480 },
      { sel: ".cl-hero-image",    delay: 200 },
    ];
    entries.forEach(({ sel, delay }) => {
      const el = document.querySelector(sel);
      if (!el) return;
      el.style.opacity   = "0";
      el.style.transform = "translateY(30px)";
      el.style.transition = `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`;
      setTimeout(() => {
        el.style.opacity   = "1";
        el.style.transform = "translateY(0)";
      }, 50);
    });

    /* ── 2. FLOATING CARD RAF LOOP ── */
    const floatCards = document.querySelectorAll(".cl-float-card");
    const floatParams = [
      { range: 14, period: 3200, phase: 0   },
      { range: 18, period: 3800, phase: 1.1 },
      { range: 12, period: 2900, phase: 2.0 },
      { range: 16, period: 3500, phase: 0.7 },
    ];
    let rafFloat;
    function animateFloats(ts) {
      floatCards.forEach((card, i) => {
        const { range, period, phase } = floatParams[i] || floatParams[0];
        const t   = (ts / period) * Math.PI * 2 + phase;
        const y   = Math.sin(t) * range;
        const rot = Math.sin(t * 0.6) * 4;
        card.style.transform = `translateY(${y}px) rotate(${rot}deg)`;
      });
      rafFloat = requestAnimationFrame(animateFloats);
    }
    rafFloat = requestAnimationFrame(animateFloats);

    /* ── 3. CLOUD BOX GENTLE BOB ── */
    const cloudBox    = document.querySelector(".cl-cloud-box");
    const glassCircle = document.querySelector(".cl-glass-circle");
    let rafCloud;
    function animateCloudBox(ts) {
      const t  = (ts / 4000) * Math.PI * 2;
      const y  = Math.sin(t) * 10;
      const y2 = Math.sin(t + 1) * 6;
      if (cloudBox)    cloudBox.style.transform    = `translateY(${y}px)`;
      if (glassCircle) glassCircle.style.transform = `translateY(${y2}px) scale(${1 + Math.sin(t) * 0.015})`;
      rafCloud = requestAnimationFrame(animateCloudBox);
    }
    rafCloud = requestAnimationFrame(animateCloudBox);

    /* ── 4. MOUSE PARALLAX ── */
    const heroImg = heroImageRef.current;
    function onMouseMove(e) {
      if (!heroImg) return;
      const x = (e.clientX - window.innerWidth  / 2) / window.innerWidth;
      const y = (e.clientY - window.innerHeight / 2) / window.innerHeight;
      heroImg.style.setProperty("--px", `${x * 25}px`);
      heroImg.style.setProperty("--py", `${y * 18}px`);
    }
    document.addEventListener("mousemove", onMouseMove);

    /* ── 5. FEATURE CARD HOVER LIFT ── */
    const featCards = document.querySelectorAll(".cl-feature-card");
    featCards.forEach(card => {
      card.style.transition = "transform 0.35s ease, box-shadow 0.35s ease, background 0.35s ease";
      card.addEventListener("mouseenter", () => {
        card.style.transform  = "translateY(-8px) scale(1.04)";
        card.style.boxShadow  = "0 20px 45px rgba(40,118,255,0.18)";
        card.style.background = "rgba(255,255,255,0.85)";
      });
      card.addEventListener("mouseleave", () => {
        card.style.transform  = "translateY(0) scale(1)";
        card.style.boxShadow  = "none";
        card.style.background = "rgba(255,255,255,0.55)";
      });
    });

    /* ── 6. FLOAT CARD HOVER GLOW ── */
    floatCards.forEach(card => {
      card.style.transition = "box-shadow 0.3s ease";
      card.addEventListener("mouseenter", () => {
        card.style.boxShadow  = "0 15px 35px rgba(40,118,255,0.25)";
        card.style.background = "rgba(255,255,255,0.9)";
      });
      card.addEventListener("mouseleave", () => {
        card.style.boxShadow  = "none";
        card.style.background = "rgba(255,255,255,0.65)";
      });
    });

    /* ── 7. BUTTON RIPPLE ── */
    const rippleBtns = document.querySelectorAll(".cl-btn-primary, .cl-btn-secondary, .cl-nav-btn");
    rippleBtns.forEach(btn => {
      btn.addEventListener("click", function (e) {
        const rect   = this.getBoundingClientRect();
        const size   = Math.max(rect.width, rect.height) * 2;
        const x      = e.clientX - rect.left - size / 2;
        const y      = e.clientY - rect.top  - size / 2;
        const ripple = document.createElement("span");
        ripple.style.cssText = `
          position:absolute;width:${size}px;height:${size}px;
          left:${x}px;top:${y}px;border-radius:50%;
          background:rgba(255,255,255,0.35);transform:scale(0);
          animation:clRipple 0.6s linear forwards;pointer-events:none;
        `;
        this.style.position = "relative";
        this.style.overflow = "hidden";
        this.appendChild(ripple);
        setTimeout(() => ripple.remove(), 650);
      });
    });

    /* ── 8. INJECT KEYFRAMES ── */
    const styleTag = document.createElement("style");
    styleTag.id = "cl-keyframes";
    styleTag.textContent = `
      @keyframes clRipple { to { transform:scale(1); opacity:0; } }
    `;
    document.head.appendChild(styleTag);

    return () => {
      cancelAnimationFrame(rafFloat);
      cancelAnimationFrame(rafCloud);
      document.removeEventListener("mousemove", onMouseMove);
      document.getElementById("cl-keyframes")?.remove();
    };
  }, []);

  return (
    <div className="cl-page">

      {/* Background blur blobs */}
      <div className="cl-blur cl-blur-one" />
      <div className="cl-blur cl-blur-two" />

      {/* ── HERO ── */}
      <section className="cl-hero">

        {/* Left Content */}
        <div className="cl-hero-content">
          <div className="cl-tag">🛡 Smart • Secure • Simplified</div>

          <h1 className="cl-hero-h1">
            Helping You<br />
            With Any Of<br />
            <span>Your Document<br />Needs!</span>
          </h1>

          <p className="cl-hero-p">
            CloudPulse is a modern cloud platform for secure document
            storage, sharing and management with complete peace of mind.
          </p>

          <div className="cl-buttons">
            <Link to="/owner-login" className="cl-btn-primary">Get Started →</Link>
            <a href="#about" className="cl-btn-secondary">Learn More</a>
          </div>

          {/* Feature mini-cards */}
          <div className="cl-features">
            <div className="cl-feature-card">
              <div className="cl-icon">🔒</div>
              <h3>Secure</h3>
              <p>End-to-end encryption</p>
            </div>
            <div className="cl-feature-card">
              <div className="cl-icon">☁</div>
              <h3>Reliable</h3>
              <p>99.9% uptime guarantee</p>
            </div>
            <div className="cl-feature-card">
              <div className="cl-icon">⚡</div>
              <h3>Fast</h3>
              <p>Quick access anytime</p>
            </div>
          </div>
        </div>

        {/* Right Illustration */}
        <div className="cl-hero-image" ref={heroImageRef}>
          <div className="cl-glass-circle" />

          <div className="cl-cloud-box">
            <div className="cl-top-layer" />
            <div className="cl-cloud">☁</div>
            <div className="cl-file">📄</div>
            <div className="cl-folder">📁</div>
          </div>

          {/* Floating cards */}
          <div className="cl-float-card cl-fc-lock">🔒</div>
          <div className="cl-float-card cl-fc-document">📄</div>
          <div className="cl-float-card cl-fc-share">🔗</div>
          <div className="cl-float-card cl-fc-users">👥</div>
        </div>

      </section>

      {/* ── STATS ── */}
      <section className="cl-stats">
        <div className="cl-stat">
          <span className="cl-stat-num">25K+</span>
          <span className="cl-stat-lbl">Happy Users</span>
        </div>
        <div className="cl-stat-div" />
        <div className="cl-stat">
          <span className="cl-stat-num">10K+</span>
          <span className="cl-stat-lbl">Files Stored</span>
        </div>
        <div className="cl-stat-div" />
        <div className="cl-stat">
          <span className="cl-stat-num">99.9%</span>
          <span className="cl-stat-lbl">Security</span>
        </div>
        <div className="cl-stat-div" />
        <div className="cl-stat">
          <span className="cl-stat-num">24/7</span>
          <span className="cl-stat-lbl">Support</span>
        </div>
      </section>

      {/* ── WHY CHOOSE US ── */}
      <section className="cl-why" id="about">
        <div className="cl-why-inner">
          <div className="cl-why-header">
            <span className="cl-section-tag">WHY CHOOSE US</span>
            <h2>Everything You Need For <span>Secure Cloud Storage</span></h2>
            <p>Store, manage and share your important documents with enterprise-level security.</p>
          </div>

          <div className="cl-why-grid">
            <div className="cl-why-card">
              <div className="cl-why-icon">☁</div>
              <h4>Cloud Storage</h4>
              <p>Securely upload and manage documents from anywhere with unlimited accessibility.</p>
            </div>
            <div className="cl-why-card">
              <div className="cl-why-icon">🛡</div>
              <h4>AES-256 Encryption</h4>
              <p>Every uploaded file is protected with military-grade AES-256 encryption at rest.</p>
            </div>
            <div className="cl-why-card">
              <div className="cl-why-icon">👥</div>
              <h4>Easy Collaboration</h4>
              <p>Share documents with authorized users while maintaining complete access control.</p>
            </div>
            <div className="cl-why-card">
              <div className="cl-why-icon">🔒</div>
              <h4>OTP Downloads</h4>
              <p>Every file download requires a one-time password — enforcing MFA-style access.</p>
            </div>
            <div className="cl-why-card">
              <div className="cl-why-icon">📊</div>
              <h4>Audit Logging</h4>
              <p>Every action is logged with timestamps, user IDs, and IP addresses for full traceability.</p>
            </div>
            <div className="cl-why-card">
              <div className="cl-why-icon">⚡</div>
              <h4>24/7 Support</h4>
              <p>Our support team is available anytime to help you with your cloud storage needs.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="cl-footer">
        <p>All rights reserved | PASSPCloud — Secure File Management</p>
      </footer>

    </div>
  );
}

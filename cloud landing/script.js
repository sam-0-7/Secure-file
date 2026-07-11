/* ============================================================
   CloudPulse — Landing Page Script
   ============================================================ */


/* ── 1. PAGE ENTRANCE ANIMATIONS ── */

window.addEventListener('load', () => {

    const els = [
        { sel: '.tag',          delay: 0   },
        { sel: '.hero-content h1', delay: 120 },
        { sel: '.hero-content p',  delay: 240 },
        { sel: '.buttons',         delay: 360 },
        { sel: '.features',        delay: 480 },
        { sel: '.hero-image',      delay: 200 },
    ];

    els.forEach(({ sel, delay }) => {
        const el = document.querySelector(sel);
        if (!el) return;
        el.style.opacity    = '0';
        el.style.transform  = 'translateY(30px)';
        el.style.transition = `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`;
        setTimeout(() => {
            el.style.opacity   = '1';
            el.style.transform = 'translateY(0)';
        }, 50);
    });

});


/* ── 2. FLOATING ANIMATIONS (rAF loop) ── */

const floatCards = document.querySelectorAll('.float-card');

// Each card gets its own phase, range and speed so they move independently
const floatParams = [
    { range: 14, period: 3200, phase: 0    },
    { range: 18, period: 3800, phase: 1.1  },
    { range: 12, period: 2900, phase: 2.0  },
    { range: 16, period: 3500, phase: 0.7  },
];

function animateFloats(timestamp) {
    floatCards.forEach((card, i) => {
        const { range, period, phase } = floatParams[i] || floatParams[0];
        const t   = (timestamp / period) * Math.PI * 2 + phase;
        const y   = Math.sin(t) * range;
        const rot = Math.sin(t * 0.6) * 4;
        card.style.transform = `translateY(${y}px) rotate(${rot}deg)`;
    });
    requestAnimationFrame(animateFloats);
}

requestAnimationFrame(animateFloats);


/* ── 3. CLOUD BOX GENTLE BOB ── */

const cloudBox   = document.querySelector('.cloud-box');
const glassCircle = document.querySelector('.glass-circle');

function animateCloudBox(timestamp) {
    const t  = timestamp / 4000 * Math.PI * 2;
    const y  = Math.sin(t) * 10;
    const y2 = Math.sin(t + 1) * 6;

    if (cloudBox)    cloudBox.style.transform    = `translateY(${y}px)`;
    if (glassCircle) glassCircle.style.transform = `translateY(${y2}px) scale(${1 + Math.sin(t) * 0.015})`;

    requestAnimationFrame(animateCloudBox);
}

requestAnimationFrame(animateCloudBox);


/* ── 4. MOUSE PARALLAX ON HERO ILLUSTRATION ── */

const heroImage = document.querySelector('.hero-image');

document.addEventListener('mousemove', (e) => {
    if (!heroImage) return;

    const { innerWidth, innerHeight } = window;
    const x = (e.clientX - innerWidth  / 2) / innerWidth;
    const y = (e.clientY - innerHeight / 2) / innerHeight;

    // Apply subtle tilt via CSS custom properties for smooth transition
    heroImage.style.setProperty('--px', `${x * 25}px`);
    heroImage.style.setProperty('--py', `${y * 18}px`);
});


/* ── 5. ACTIVE NAV LINK ON CLICK ── */

const navLinks = document.querySelectorAll('nav a');

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
    });
});


/* ── 6. BUTTON RIPPLE EFFECT ── */

const rippleBtns = document.querySelectorAll('.primary, .secondary, .nav-btn');

rippleBtns.forEach(btn => {
    btn.addEventListener('click', function (e) {
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 2;
        const x    = e.clientX - rect.left - size / 2;
        const y    = e.clientY - rect.top  - size / 2;

        const ripple = document.createElement('span');
        ripple.className = 'ripple-wave';
        ripple.style.cssText = `
            position:absolute;
            width:${size}px;
            height:${size}px;
            left:${x}px;
            top:${y}px;
            border-radius:50%;
            background:rgba(255,255,255,0.35);
            transform:scale(0);
            animation:rippleAnim 0.6s linear forwards;
            pointer-events:none;
        `;

        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(ripple);
        setTimeout(() => ripple.remove(), 650);
    });
});


/* ── 7. FEATURE CARD HOVER LIFT ── */

document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.transform  = 'translateY(-8px) scale(1.04)';
        card.style.boxShadow  = '0 20px 45px rgba(40,118,255,0.18)';
        card.style.background = 'rgba(255,255,255,0.85)';
    });
    card.addEventListener('mouseleave', () => {
        card.style.transform  = 'translateY(0) scale(1)';
        card.style.boxShadow  = 'none';
        card.style.background = 'rgba(255,255,255,0.55)';
    });
});

/* add a shared transition once */
document.querySelectorAll('.feature-card').forEach(card => {
    card.style.transition = 'transform 0.35s ease, box-shadow 0.35s ease, background 0.35s ease';
});


/* ── 8. NAV LINK UNDERLINE HOVER ── */

navLinks.forEach(link => {
    link.style.transition = 'color 0.25s ease';
    link.addEventListener('mouseenter', function () {
        if (!this.classList.contains('active')) {
            this.style.color = '#2876ff';
        }
    });
    link.addEventListener('mouseleave', function () {
        if (!this.classList.contains('active')) {
            this.style.color = '#18264a';
        }
    });
});


/* ── 9. FLOAT CARD HOVER SCALE ── */

floatCards.forEach(card => {
    card.style.transition = 'box-shadow 0.3s ease';
    card.addEventListener('mouseenter', () => {
        card.style.boxShadow  = '0 15px 35px rgba(40,118,255,0.25)';
        card.style.background = 'rgba(255,255,255,0.9)';
    });
    card.addEventListener('mouseleave', () => {
        card.style.boxShadow  = 'none';
        card.style.background = 'rgba(255,255,255,0.65)';
    });
});


/* ── 10. INJECT GLOBAL KEYFRAMES ── */

const style = document.createElement('style');
style.textContent = `
    @keyframes rippleAnim {
        to {
            transform: scale(1);
            opacity: 0;
        }
    }

    .float-card {
        cursor: default;
        will-change: transform;
    }

    .cloud-box {
        will-change: transform;
        transition: box-shadow 0.4s ease;
    }

    .glass-circle {
        will-change: transform;
    }

    /* Parallax shift on the whole hero-image via CSS var */
    .hero-image {
        --px: 0px;
        --py: 0px;
        transition: none;
    }

    .hero-image .cloud-box {
        /* combine bob + parallax */
        transition: none;
    }

    .primary,
    .secondary,
    .nav-btn {
        cursor: pointer;
        transition: opacity 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
    }

    .primary:hover {
        opacity: 0.9;
        transform: translateY(-2px);
        box-shadow: 0 16px 35px rgba(40,118,255,0.45);
    }

    .secondary:hover {
        background: rgba(255,255,255,0.85);
        transform: translateY(-2px);
    }

    .nav-btn:hover {
        opacity: 0.88;
        transform: translateY(-2px);
    }

    .logo-icon {
        cursor: pointer;
        transition: transform 0.3s ease;
    }

    .logo-icon:hover {
        transform: rotate(-8deg) scale(1.1);
    }
`;

document.head.appendChild(style);

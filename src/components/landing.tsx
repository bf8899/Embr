"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

// Marketing landing, adapted from the original Ember demo (Demo/index.html).
// Same look — aurora, rising-ember canvas, flame mark, two-modes + tip-economy
// sections — but wired to the real app: CTAs go to /signup and /login, and the
// fabricated waitlist stats/form are replaced with honest copy since signups
// are live.

const CSS = `
.lp{position:relative;z-index:3;overflow-x:hidden}
.lp .aurora{position:fixed;inset:-20%;z-index:0;pointer-events:none;
  background:
    radial-gradient(38% 32% at 12% 8%,rgba(255,92,57,.10),transparent 70%),
    radial-gradient(42% 36% at 88% 90%,rgba(255,46,136,.09),transparent 70%),
    radial-gradient(30% 26% at 78% 12%,rgba(255,176,58,.06),transparent 70%);
  filter:blur(40px);animation:lpAurora 26s ease-in-out infinite alternate}
@keyframes lpAurora{from{transform:translate3d(-2%,-1%,0) scale(1)}to{transform:translate3d(2%,2%,0) scale(1.06)}}
.lp #emberField{position:fixed;inset:0;z-index:1;pointer-events:none}
.lp .content{position:relative;z-index:3}

.lp header{position:sticky;top:0;z-index:60;display:flex;align-items:center;gap:26px;
  padding:16px clamp(16px,4vw,42px);background:linear-gradient(rgba(14,11,18,.85),transparent);
  backdrop-filter:blur(10px)}
.lp .h-brand{display:flex;align-items:center;gap:10px;text-decoration:none;
  font-family:var(--font-display);font-weight:800;font-size:16px;letter-spacing:.14em}
.lp .h-brand .mk{width:26px;height:26px;border-radius:8px;background:var(--ember-grad);
  display:grid;place-items:center;box-shadow:0 0 14px rgba(255,92,57,.4)}
.lp .h-brand .mk svg{width:14px;height:14px;fill:#1A0A08}
.lp .h-brand em{font-style:normal;background:var(--ember-grad);-webkit-background-clip:text;background-clip:text;color:transparent}
.lp nav{margin-left:auto;display:flex;gap:4px;align-items:center}
.lp nav a{text-decoration:none;font-size:13px;color:var(--ink-dim);padding:8px 14px;border-radius:999px;transition:color .2s}
.lp nav a:hover{color:var(--ink)}
.lp nav a.cta{background:var(--ember-grad);color:#1A0A08;font-weight:600;font-family:var(--font-display);
  font-size:12px;letter-spacing:.06em;padding:9px 18px;box-shadow:0 6px 20px -6px rgba(255,92,57,.55)}
@media (max-width:640px){.lp nav a.hide-sm{display:none}}

.lp .hero{min-height:92svh;display:flex;flex-direction:column;align-items:center;justify-content:center;
  text-align:center;padding:80px clamp(16px,4vw,42px) 60px}
.lp .mark{position:relative;width:clamp(92px,13vw,140px);height:clamp(92px,13vw,140px);margin-bottom:10px;cursor:pointer}
.lp .mark svg{width:100%;height:100%;overflow:visible;filter:drop-shadow(0 0 26px rgba(255,92,57,.45));animation:lpBreathe 3.2s ease-in-out infinite}
@keyframes lpBreathe{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
.lp .wordmark{font-family:var(--font-display);font-weight:800;letter-spacing:.16em;
  font-size:clamp(44px,9vw,104px);line-height:1;background:var(--ember-grad);-webkit-background-clip:text;
  background-clip:text;color:transparent;margin:4px 0 18px}
.lp .tagline{max-width:52ch;color:var(--ink-dim);font-size:clamp(15px,1.6vw,17px);line-height:1.6}
.lp .tagline b{color:var(--ink);font-weight:600}
.lp .hero-cta{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin-top:30px}
.lp .btn{display:inline-flex;align-items:center;gap:9px;padding:13px 24px;border-radius:999px;
  font-family:var(--font-display);font-weight:700;font-size:13.5px;letter-spacing:.04em;text-decoration:none;transition:transform .2s,filter .2s}
.lp .btn.primary{background:var(--ember-grad);color:#1A0A08;box-shadow:0 10px 30px -10px rgba(255,92,57,.6)}
.lp .btn.primary:hover{transform:translateY(-1px);filter:brightness(1.06)}
.lp .btn.ghost{border:1px solid var(--line);color:var(--ink-dim)}
.lp .btn.ghost:hover{color:var(--ink);border-color:rgba(255,176,58,.4)}
.lp .props{display:flex;gap:26px;flex-wrap:wrap;justify-content:center;margin-top:34px;
  font-family:var(--font-mono);font-size:12.5px;color:var(--ink-faint)}
.lp .props b{color:var(--ink-dim);font-weight:500}

.lp section.band{max-width:1120px;margin:0 auto;padding:clamp(60px,9vw,110px) clamp(16px,4vw,42px)}
.lp .sec-head{text-align:center;max-width:640px;margin:0 auto 48px}
.lp .eyebrow{font-family:var(--font-mono);font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--ember-1)}
.lp .sec-head h2{font-family:var(--font-display);font-weight:800;font-size:clamp(26px,4vw,40px);line-height:1.1;margin:14px 0 12px}
.lp .sec-head h2 span{background:var(--ember-grad);-webkit-background-clip:text;background-clip:text;color:transparent}
.lp .sec-head p{color:var(--ink-dim);font-size:15px}

.lp .modes{display:grid;grid-template-columns:1.25fr .75fr;gap:24px;align-items:stretch}
@media (max-width:820px){.lp .modes{grid-template-columns:1fr}}
.lp .frame{border:1px solid var(--line);border-radius:22px;background:var(--pane);padding:18px;overflow:hidden}
.lp .f-label{font-family:var(--font-display);font-weight:700;font-size:12px;letter-spacing:.14em;text-transform:uppercase;
  color:var(--ink-dim);display:flex;align-items:center;gap:8px;margin-bottom:14px}
.lp .f-label i{width:7px;height:7px;border-radius:50%;background:var(--ember-grad)}
.lp .mini-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.lp .mini-thumb{position:relative;aspect-ratio:16/9;border-radius:12px;overflow:hidden;border:1px solid var(--line)}
.lp .scene{position:absolute;inset:0;background:
  radial-gradient(120% 90% at 30% 20%,hsl(var(--h1) 85% 58%/.9),transparent 62%),
  radial-gradient(110% 100% at 70% 100%,hsl(var(--h2) 80% 46%/.85),transparent 66%),
  linear-gradient(160deg,hsl(var(--h1) 40% 12%),hsl(var(--h2) 45% 8%))}
.lp .mini-thumb .bar{position:absolute;left:0;bottom:0;height:3px;background:var(--ember-grad);box-shadow:0 0 8px rgba(255,92,57,.8)}
.lp .phone{width:min(190px,100%);margin:0 auto;aspect-ratio:9/17;border-radius:24px;overflow:hidden;
  border:1px solid rgba(245,239,232,.16);position:relative;box-shadow:0 24px 60px -20px rgba(0,0,0,.7)}
.lp .p-rail{position:absolute;right:8px;bottom:14px;display:flex;flex-direction:column;gap:9px;z-index:2}
.lp .p-rail i{width:22px;height:22px;border-radius:50%;background:rgba(23,18,32,.65);border:1px solid rgba(245,239,232,.2);display:block}
.lp .p-rail i.f{background:var(--ember-grad);border:none;box-shadow:0 0 12px rgba(255,92,57,.6)}
.lp .f-note{margin-top:14px;color:var(--ink-dim);font-size:13.5px}

.lp .steps{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
@media (max-width:760px){.lp .steps{grid-template-columns:1fr}}
.lp .step{border:1px solid var(--line);border-radius:22px;padding:28px;background:var(--pane)}
.lp .s-ico{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;margin-bottom:18px;
  background:rgba(255,176,58,.1);border:1px solid rgba(255,176,58,.3)}
.lp .s-ico svg{width:19px;height:19px;fill:none;stroke:var(--ember-1);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.lp .s-ico svg.fil{fill:var(--ember-1);stroke:none}
.lp .step h3{font-family:var(--font-display);font-weight:700;font-size:16.5px;margin-bottom:8px}
.lp .step p{color:var(--ink-dim);font-size:13.5px}

.lp .cta-band{text-align:center;border:1px solid var(--line);border-radius:26px;background:var(--pane);
  padding:clamp(36px,6vw,64px);position:relative;overflow:hidden}
.lp .cta-band::before{content:"";position:absolute;inset:0;opacity:.5;pointer-events:none;
  background:radial-gradient(120% 70% at 50% -10%,rgba(255,92,57,.14),transparent 60%)}
.lp .cta-band h2{position:relative;font-family:var(--font-display);font-weight:800;font-size:clamp(24px,3.6vw,36px);margin-bottom:10px}
.lp .cta-band p{position:relative;color:var(--ink-dim);margin-bottom:26px}

.lp footer{max-width:1120px;margin:0 auto;padding:30px clamp(16px,4vw,42px) 48px;border-top:1px solid var(--line);
  display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;color:var(--ink-faint);font-size:12px;font-family:var(--font-mono);line-height:1.7}

.lp .rev{opacity:0;transform:translateY(22px);transition:opacity .7s ease,transform .7s ease}
.lp .rev.vis{opacity:1;transform:none}
@media (prefers-reduced-motion:reduce){
  .lp .rev{opacity:1;transform:none}
  .lp .mark svg,.lp .aurora{animation:none}
}
`;

export function Landing() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // rising ember particles
    let raf = 0;
    let removeResize: (() => void) | undefined;
    const cv = canvasRef.current;
    if (cv && !reduced) {
      const ctx = cv.getContext("2d")!;
      let W = 0;
      let H = 0;
      const size = () => {
        W = cv.width = window.innerWidth;
        H = cv.height = window.innerHeight;
      };
      size();
      window.addEventListener("resize", size);
      type P = {
        x: number; y: number; r: number; vy: number; sway: number;
        swaySp: number; hue: number; life: number; maxLife: number;
      };
      const spawn = (): P => ({
        x: Math.random() * W, y: H + 10, r: 0.8 + Math.random() * 2.2,
        vy: 0.25 + Math.random() * 0.6, sway: Math.random() * 2 * Math.PI,
        swaySp: 0.004 + Math.random() * 0.01, hue: 20 + Math.random() * 20,
        life: 0, maxLife: 600 + Math.random() * 500,
      });
      const parts: P[] = [];
      for (let i = 0; i < 26; i++) {
        const p = spawn();
        p.y = Math.random() * H;
        parts.push(p);
      }
      const loop = () => {
        ctx.clearRect(0, 0, W, H);
        for (const p of parts) {
          p.y -= p.vy;
          p.sway += p.swaySp;
          p.x += Math.sin(p.sway) * 0.3;
          p.life++;
          const fade =
            Math.min(p.life / 60, 1) * Math.max(1 - p.life / p.maxLife, 0) * 0.55;
          ctx.beginPath();
          ctx.fillStyle = `hsla(${p.hue} 90% 62% / ${fade})`;
          ctx.shadowColor = `hsla(${p.hue} 90% 60% / ${fade})`;
          ctx.shadowBlur = 8;
          ctx.arc(p.x, p.y, p.r, 0, 7);
          ctx.fill();
          if (p.y < -12 || p.life > p.maxLife) Object.assign(p, spawn());
        }
        ctx.shadowBlur = 0;
        raf = requestAnimationFrame(loop);
      };
      loop();
      removeResize = () => window.removeEventListener("resize", size);
    }

    // scroll reveals
    const io = new IntersectionObserver(
      (es) => {
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("vis");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.14 }
    );
    document.querySelectorAll(".lp .rev").forEach((el) => io.observe(el));

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      removeResize?.();
    };
  }, []);

  return (
    <div className="lp">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="aurora" aria-hidden />
      <canvas ref={canvasRef} id="emberField" aria-hidden />

      <div className="content">
        <header>
          <Link className="h-brand" href="/">
            <span className="mk">
              <svg viewBox="0 0 24 24">
                <path d="M12 2c.6 3.6-1.4 5.4-3 7.3C7.3 11.2 6 13 6 15.4A6.3 6.3 0 0 0 12.3 22 6 6 0 0 0 18 15.8c0-2.3-1.1-3.9-2.2-5.3-.4 1.3-1.1 2.1-2.1 2.6.5-3.7-.5-8-1.7-11.1z" />
              </svg>
            </span>
            EM<em>BER</em>
          </Link>
          <nav>
            <a href="#modes" className="hide-sm">The experience</a>
            <a href="#economy" className="hide-sm">Tip economy</a>
            <Link href="/login" className="hide-sm">Log in</Link>
            <Link href="/signup" className="cta">Get started</Link>
          </nav>
        </header>

        <section className="hero">
          <div className="mark" aria-label="Ember flame logo">
            <svg viewBox="0 0 24 24">
              <defs>
                <linearGradient id="lpFlame" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#FFB03A" />
                  <stop offset=".55" stopColor="#FF5C39" />
                  <stop offset="1" stopColor="#FF2E88" />
                </linearGradient>
              </defs>
              <path
                fill="url(#lpFlame)"
                d="M12 2c.6 3.6-1.4 5.4-3 7.3C7.3 11.2 6 13 6 15.4A6.3 6.3 0 0 0 12.3 22 6 6 0 0 0 18 15.8c0-2.3-1.1-3.9-2.2-5.3-.4 1.3-1.1 2.1-2.1 2.6.5-3.7-.5-8-1.7-11.1z"
              />
              <path
                fill="#FFE1A8"
                opacity=".85"
                d="M12.2 12.5c.4 1.8-.5 2.7-1.3 3.7-.7.8-1.2 1.6-1.2 2.6a2.9 2.9 0 0 0 2.9 3 2.8 2.8 0 0 0 2.7-2.9c0-1.1-.5-1.8-1-2.5-.2.6-.5 1-1 1.2.3-1.7-.3-3.6-1.1-5.1z"
              />
            </svg>
          </div>

          <h1 className="wordmark">EMBER</h1>

          <p className="tagline">
            A new home for video where appreciation is the currency. Watch what
            you love, <b>hold the flame</b>, and send embers to the people who
            made it — a platform built to reward the work audiences genuinely
            value.
          </p>

          <div className="hero-cta">
            <Link className="btn primary" href="/signup">
              Get started
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <Link className="btn ghost" href="/login">
              Log in
            </Link>
          </div>

          <div className="props">
            <span><b>Free</b> to watch</span>
            <span><b>Two ways</b> to browse</span>
            <span><b>Hold</b> to send embers</span>
          </div>
        </section>

        <section className="band" id="modes">
          <div className="sec-head rev">
            <span className="eyebrow">The experience</span>
            <h2>
              Lean back like YouTube.
              <br />
              Fall in like <span>TikTok.</span>
            </h2>
            <p>
              One toggle moves you between a browsable grid of everything and a
              full-screen vertical flow that plays one moment at a time. Same
              library, two moods.
            </p>
          </div>
          <div className="modes">
            <div className="frame rev">
              <div className="f-label"><i />Tile mode</div>
              <div className="mini-grid">
                {[
                  ["28", "12", "82%"],
                  ["198", "230", "64%"],
                  ["38", "6", "93%"],
                  ["322", "262", "47%"],
                ].map(([h1, h2, w], i) => (
                  <div className="mini-thumb" key={i}>
                    <div
                      className="scene"
                      style={{ ["--h1" as string]: h1, ["--h2" as string]: h2 }}
                    />
                    <div className="bar" style={{ width: w }} />
                  </div>
                ))}
              </div>
              <p className="f-note">
                Browse everything at once. The ember bar under each video shows
                how warmly the audience has received it.
              </p>
            </div>
            <div className="frame rev">
              <div className="f-label"><i />Flow mode</div>
              <div className="phone">
                <div
                  className="scene"
                  style={{ ["--h1" as string]: "168", ["--h2" as string]: "140" }}
                />
                <div className="p-rail"><i /><i /><i className="f" /></div>
              </div>
              <p className="f-note">
                Full-screen, one video at a time. Hold the flame to send embers
                without ever leaving the moment.
              </p>
            </div>
          </div>
        </section>

        <section className="band" id="economy">
          <div className="sec-head rev">
            <span className="eyebrow">How it works</span>
            <h2>
              A <span>tip economy</span>, built for better video.
            </h2>
            <p>
              Ember is designed so genuine appreciation — not raw impressions —
              decides what thrives. That changes what gets made, and who gets
              rewarded for making it.
            </p>
          </div>
          <div className="steps">
            <div className="step rev">
              <div className="s-ico">
                <svg viewBox="0 0 24 24">
                  <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <h3>Watch, free</h3>
              <p>
                Nothing paywalled, no subscription. Browse the grid or drop into
                the flow — the whole library is open from day one.
              </p>
            </div>
            <div className="step rev">
              <div className="s-ico">
                <svg className="fil" viewBox="0 0 24 24">
                  <path d="M12 2c.6 3.6-1.4 5.4-3 7.3C7.3 11.2 6 13 6 15.4A6.3 6.3 0 0 0 12.3 22 6 6 0 0 0 18 15.8c0-2.3-1.1-3.9-2.2-5.3-.4 1.3-1.1 2.1-2.1 2.6.5-3.7-.5-8-1.7-11.1z" />
                </svg>
              </div>
              <h3>Hold the flame</h3>
              <p>
                When something moves you, hold to send embers. Tips go toward the
                creator, with a share supporting the platform that hosts their
                work.
              </p>
            </div>
            <div className="step rev">
              <div className="s-ico">
                <svg viewBox="0 0 24 24">
                  <path d="M12 3v18M5 10l7-7 7 7" />
                </svg>
              </div>
              <h3>Quality rises</h3>
              <p>
                Creators are rewarded for work people truly value, and viewers
                shape what succeeds. Everyone&apos;s incentive points the same
                way: make it worth watching.
              </p>
            </div>
          </div>
        </section>

        <section className="band">
          <div className="cta-band rev">
            <h2>Be there when the first flame is lit.</h2>
            <p>Create your account and start watching — it&apos;s free.</p>
            <div className="hero-cta" style={{ justifyContent: "center" }}>
              <Link className="btn primary" href="/signup">
                Create your account
              </Link>
              <Link className="btn ghost" href="/login">
                Log in
              </Link>
            </div>
          </div>
        </section>

        <footer>
          <span>© {new Date().getFullYear()} Ember. Video worth burning for.</span>
          <span>Embers are non-monetary while in beta.</span>
        </footer>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { CreatorApplyForm } from "@/components/creator-apply-form";

// Pre-launch creator-recruitment landing, ported from the ember-creators design.
// Scoped under .cl with its own amber palette (distinct from the in-app ember
// pink) so it doesn't leak into the rest of the site.
const CSS = `
.cl{
  --bg:#0B0908; --bg-deep:#050403; --ink:#F5F1EA; --ink-dim:#B8B0A4;
  --ember-1:#FDE68A; --ember-2:#F59E0B; --ember-3:#EA580C; --ember-4:#C2410C;
  --panel:#151009; --line:rgba(245,158,11,.18);
  position:relative; min-height:100vh; background:var(--bg); color:var(--ink);
  font-family:var(--font-instrument-sans),sans-serif; line-height:1.6; overflow-x:hidden;
}
.cl ::selection{background:var(--ember-3);color:var(--bg-deep)}
.cl .bg-flame{position:fixed;z-index:0;pointer-events:none;right:-6vw;top:4vh;width:min(46vw,640px);opacity:.5;filter:blur(38px);animation:clbgflick 5.5s ease-in-out infinite alternate;transform-origin:50% 92%}
@keyframes clbgflick{0%{transform:scaleY(1) scaleX(1);opacity:.42}45%{transform:scaleY(1.05) scaleX(.985);opacity:.55}70%{transform:scaleY(.985) scaleX(1.02);opacity:.46}100%{transform:scaleY(1.06) scaleX(.99);opacity:.58}}
.cl .bg-flame-inner{animation:clbgsway 9s ease-in-out infinite alternate;transform-origin:50% 92%}
@keyframes clbgsway{from{transform:rotate(-1.6deg)}to{transform:rotate(1.8deg)}}
.cl nav{display:flex;align-items:center;justify-content:space-between;padding:26px clamp(24px,5vw,72px);position:relative;z-index:5}
.cl .wordmark{font-family:var(--font-syne),sans-serif;font-weight:800;font-size:26px;letter-spacing:.5px;text-decoration:none;position:relative;display:inline-flex}
.cl .wordmark .l{color:#3B332B;animation:clignite .5s ease forwards}
.cl .wordmark .l:nth-child(1){animation-delay:.95s}.cl .wordmark .l:nth-child(2){animation-delay:1.10s}.cl .wordmark .l:nth-child(3){animation-delay:1.25s}.cl .wordmark .l:nth-child(4){animation-delay:1.40s}.cl .wordmark .l:nth-child(5){animation-delay:1.55s}
@keyframes clignite{0%{color:#3B332B;text-shadow:none}60%{color:var(--ember-1);text-shadow:0 0 26px rgba(253,230,138,.9)}100%{color:var(--ember-2);text-shadow:0 0 14px rgba(245,158,11,.45)}}
.cl .wm-flame{position:absolute;right:-16px;top:-14px;width:16px;opacity:0;animation:clwmflame .5s ease 1.55s forwards, clflick 1.7s ease-in-out 2.05s infinite alternate;transform-origin:50% 90%}
@keyframes clwmflame{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:scale(1)}}
.cl .nav-cta{font-family:var(--font-instrument-sans),sans-serif;font-weight:600;font-size:15px;color:var(--ink);text-decoration:none;border:1px solid var(--line);border-radius:999px;padding:10px 22px;transition:border-color .25s,background .25s}
.cl .nav-cta:hover{border-color:var(--ember-2);background:rgba(245,158,11,.07)}
.cl .hero{display:grid;grid-template-columns:1.05fr .95fr;gap:clamp(32px,5vw,80px);align-items:center;padding:clamp(30px,6vh,70px) clamp(24px,5vw,72px) clamp(60px,9vh,110px);max-width:1320px;margin:0 auto;position:relative;z-index:1}
.cl .hero::before{content:"";position:absolute;top:-15%;left:55%;width:760px;height:760px;background:radial-gradient(circle,rgba(234,88,12,.14) 0%,rgba(234,88,12,0) 68%);pointer-events:none}
.cl .eyebrow{font-family:var(--font-spline-mono),monospace;font-size:13px;letter-spacing:3px;color:var(--ember-2);text-transform:uppercase;margin-bottom:22px;display:flex;align-items:center;gap:12px}
.cl .eyebrow::before{content:"";width:34px;height:1px;background:var(--ember-2)}
.cl h1{font-family:var(--font-syne),sans-serif;font-weight:800;font-size:clamp(38px,5vw,64px);line-height:1.06;letter-spacing:-.5px;margin-bottom:24px}
.cl h1 .lit{background:linear-gradient(100deg,var(--ember-1),var(--ember-2) 45%,var(--ember-4));-webkit-background-clip:text;background-clip:text;color:transparent;opacity:0;animation:cllitfade .8s ease 1.7s forwards}
@keyframes cllitfade{from{opacity:0}to{opacity:1}}
.cl .lede{font-size:clamp(16px,1.4vw,19px);color:var(--ink-dim);max-width:52ch;margin-bottom:36px}
.cl .cta-row{display:flex;gap:16px;flex-wrap:wrap;align-items:center}
.cl .btn-primary{font-family:var(--font-syne),sans-serif;font-weight:700;font-size:16px;color:var(--bg-deep);text-decoration:none;background:linear-gradient(100deg,var(--ember-1),var(--ember-2) 40%,var(--ember-3));border-radius:999px;padding:16px 34px;box-shadow:0 0 34px rgba(245,158,11,.35);transition:transform .2s,box-shadow .2s;display:inline-block;cursor:pointer;border:none}
.cl .btn-primary:hover{transform:translateY(-2px);box-shadow:0 0 48px rgba(245,158,11,.5)}
.cl .cta-note{font-family:var(--font-spline-mono),monospace;font-size:13px;color:var(--ink-dim)}
.cl .features{margin-top:46px;background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:28px 30px;position:relative;max-width:520px}
.cl .features h2{font-family:var(--font-spline-mono),monospace;font-weight:500;font-size:13px;letter-spacing:3px;text-transform:uppercase;color:var(--ember-2);margin-bottom:18px}
.cl .features ul{list-style:none;margin:0;padding:0}
.cl .features li{display:flex;gap:14px;align-items:flex-start;padding:10px 0;font-size:15.5px;color:var(--ink)}
.cl .features li+li{border-top:1px solid rgba(245,158,11,.08)}
.cl .features li strong{font-weight:600}
.cl .features li span{color:var(--ink-dim);font-weight:400}
.cl .fl{flex:none;width:20px;height:26px;margin-top:1px}
.cl .phone-wrap{display:flex;justify-content:center;position:relative;z-index:2}
.cl .phone{width:min(340px,86vw);aspect-ratio:9/19;border-radius:38px;border:1px solid rgba(245,158,11,.25);background:var(--bg-deep);box-shadow:0 40px 90px rgba(0,0,0,.6),0 0 70px rgba(234,88,12,.12);overflow:hidden;position:relative;padding:10px}
.cl .screen{width:100%;height:100%;border-radius:30px;overflow:hidden;position:relative;background:var(--bg)}
.cl .topbar{position:absolute;top:12px;left:12px;right:12px;z-index:6;display:flex;align-items:center;justify-content:space-between;gap:8px}
.cl .balance{display:flex;align-items:center;gap:6px;background:rgba(11,9,8,.6);backdrop-filter:blur(6px);border:1px solid rgba(245,158,11,.25);border-radius:999px;padding:5px 12px 5px 8px}
.cl .balance svg{width:12px;height:16px}
.cl .balance b{font-family:var(--font-spline-mono),monospace;font-weight:500;font-size:12px;color:var(--ember-1)}
.cl .mode-pill{display:flex;background:rgba(11,9,8,.6);border-radius:999px;padding:4px;font-family:var(--font-spline-mono),monospace;font-size:11px;letter-spacing:1px;backdrop-filter:blur(6px)}
.cl .mode-pill button{padding:5px 14px;border-radius:999px;color:var(--ink-dim);background:none;border:none;font:inherit;letter-spacing:inherit;cursor:pointer}
.cl .mode-pill button.active{background:linear-gradient(100deg,var(--ember-2),var(--ember-3));color:var(--bg-deep);font-weight:500}
.cl .view-flow{position:absolute;inset:0;background:linear-gradient(160deg,#0F172A 0%,#581C87 42%,#9D174D 72%,#EA580C 100%);background-size:130% 130%;animation:cldriftbg 14s ease-in-out infinite alternate}
@keyframes cldriftbg{from{background-position:0% 0%}to{background-position:100% 100%}}
.cl .view-flow::after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgba(0,0,0,.72) 0%,rgba(0,0,0,0) 42%,rgba(0,0,0,.25) 100%)}
.cl .meta{position:absolute;left:18px;bottom:120px;z-index:3;max-width:62%}
.cl .handle{font-family:var(--font-syne),sans-serif;font-weight:700;font-size:17px}
.cl .caption{font-size:13px;color:rgba(245,241,234,.85);margin-top:3px}
.cl .rail{position:absolute;right:14px;bottom:120px;z-index:3;display:flex;flex-direction:column;align-items:center;gap:20px}
.cl .tipbtn{position:relative;width:62px;height:62px}
.cl .tipbtn svg.ring{position:absolute;inset:0}
.cl .ring-fg{stroke-dasharray:163;stroke-dashoffset:163;animation:clcharge 3.6s ease-in-out infinite;transform:rotate(-90deg);transform-origin:center}
@keyframes clcharge{0%{stroke-dashoffset:163}55%{stroke-dashoffset:0}70%{stroke-dashoffset:0}100%{stroke-dashoffset:163}}
.cl .flame{position:absolute;left:50%;top:50%;transform:translate(-50%,-54%);animation:clflick 1.6s ease-in-out infinite alternate;transform-origin:50% 90%}
@keyframes clflick{from{transform:translate(-50%,-54%) scale(1)}to{transform:translate(-50%,-54%) scale(1.08)}}
.cl .tipcount{font-family:var(--font-spline-mono),monospace;font-size:12px;color:var(--ember-1);text-align:center;margin-top:6px}
.cl .railbtn{width:44px;height:44px;border-radius:50%;background:rgba(11,9,8,.65);display:flex;align-items:center;justify-content:center}
.cl .chat{position:absolute;left:0;right:0;bottom:0;z-index:4;background:linear-gradient(0deg,rgba(5,4,3,.92) 65%,rgba(5,4,3,0));padding:34px 16px 14px}
.cl .chat-label{font-family:var(--font-spline-mono),monospace;font-size:10px;letter-spacing:2px;color:var(--ink-dim);text-transform:uppercase;margin-bottom:8px}
.cl .msgs{display:flex;flex-direction:column;gap:7px;height:96px;overflow:hidden;justify-content:flex-end}
.cl .msg{display:flex;gap:8px;align-items:baseline;font-size:12.5px;opacity:0;animation:clmsgin .5s ease forwards}
.cl .msg b{color:var(--ember-2);font-weight:600;font-family:var(--font-spline-mono),monospace;font-size:11.5px;flex:none}
.cl .msg span{color:rgba(245,241,234,.92)}
.cl .msg .ember-tag{color:var(--ember-1);font-family:var(--font-spline-mono),monospace;font-size:11px;background:rgba(245,158,11,.12);border-radius:6px;padding:1px 7px;flex:none}
@keyframes clmsgin{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.cl .view-grid{position:absolute;inset:0;background:var(--bg);padding:58px 12px 14px;display:none;overflow:hidden}
.cl .grid-tiles{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.cl .tile{border-radius:12px;aspect-ratio:16/10;position:relative;overflow:hidden;opacity:0;transform:translateY(10px)}
.cl.mode-grid .tile{animation:cltilein .4s ease forwards}
.cl.mode-grid .tile:nth-child(1){animation-delay:.03s}.cl.mode-grid .tile:nth-child(2){animation-delay:.08s}.cl.mode-grid .tile:nth-child(3){animation-delay:.13s}.cl.mode-grid .tile:nth-child(4){animation-delay:.18s}.cl.mode-grid .tile:nth-child(5){animation-delay:.23s}.cl.mode-grid .tile:nth-child(6){animation-delay:.28s}.cl.mode-grid .tile:nth-child(7){animation-delay:.33s}.cl.mode-grid .tile:nth-child(8){animation-delay:.38s}
@keyframes cltilein{to{opacity:1;transform:translateY(0)}}
.cl .t1{background:linear-gradient(135deg,#1E3A8A,#7C3AED)}.cl .t2{background:linear-gradient(135deg,#065F46,#10B981)}.cl .t3{background:linear-gradient(135deg,#7C2D12,#F59E0B)}.cl .t4{background:linear-gradient(135deg,#831843,#EC4899)}.cl .t5{background:linear-gradient(135deg,#1E293B,#475569)}.cl .t6{background:linear-gradient(135deg,#3730A3,#6366F1)}.cl .t7{background:linear-gradient(135deg,#78350F,#D97706)}.cl .t8{background:linear-gradient(135deg,#134E4A,#2DD4BF)}
.cl .dur{position:absolute;left:7px;bottom:6px;background:rgba(0,0,0,.55);border-radius:5px;padding:1px 6px;font-family:var(--font-spline-mono),monospace;font-size:10px;color:var(--ink)}
.cl .tile-tip{position:absolute;right:7px;bottom:6px;display:flex;align-items:center;gap:4px;background:rgba(0,0,0,.55);border-radius:999px;padding:2px 8px 2px 5px}
.cl .tile-tip svg{width:9px;height:12px}
.cl .tile-tip b{font-family:var(--font-spline-mono),monospace;font-weight:500;font-size:10px;color:var(--ember-1)}
.cl.mode-grid .view-grid{display:block}
.cl.mode-grid .view-flow,.cl.mode-grid .meta,.cl.mode-grid .rail,.cl.mode-grid .chat{display:none}
.cl .apply{max-width:640px;margin:0 auto;padding:clamp(40px,7vh,90px) clamp(24px,5vw,72px) 90px;position:relative;z-index:1}
.cl .apply h2{font-family:var(--font-syne),sans-serif;font-weight:800;font-size:clamp(28px,4vw,40px);margin-bottom:12px}
.cl .apply .sub{color:var(--ink-dim);margin-bottom:30px;max-width:52ch}
.cl footer{border-top:1px solid var(--line);padding:34px clamp(24px,5vw,72px);display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;font-size:13px;color:var(--ink-dim);position:relative;z-index:1}
.cl footer .boiler{max-width:60ch}
@media (max-width:920px){.cl .hero{grid-template-columns:1fr;padding-top:12px}.cl .phone-wrap{order:-1;margin-bottom:8px}.cl .features{max-width:none}.cl .bg-flame{right:-30vw;width:90vw;opacity:.35}}
@media (prefers-reduced-motion:reduce){
  .cl .view-flow,.cl .ring-fg,.cl .flame,.cl .msg,.cl .bg-flame,.cl .bg-flame-inner,.cl .wordmark .l,.cl .wm-flame,.cl h1 .lit,.cl .tile{animation:none!important}
  .cl .msg,.cl h1 .lit,.cl .wm-flame{opacity:1}.cl .tile{opacity:1;transform:none}.cl .wordmark .l{color:var(--ember-2)}
}
`;

const FLAME = (
  <>
    <path d="M50 8 C34 34 24 52 24 70 C24 92 36 106 50 106 C64 106 76 92 76 70 C76 52 66 34 50 8 Z" fill="#F59E0B" />
    <path d="M50 52 C43 66 40 75 40 84 C40 95 44 101 50 101 C56 101 60 95 60 84 C60 75 57 66 50 52 Z" fill="#FDE68A" />
  </>
);

const FEATURES: [string, string][] = [
  ["Earn tips from day one", "— embers flow the moment your first video is live, no follower threshold, no monetisation waitlist."],
  ["Hold-to-tip flame", "— a signature gesture that makes appreciation feel like something, not a throwaway like."],
  ["Two ways to be seen", "— a browsable tile grid and a full-screen Flow feed, so your work fits how people actually watch."],
  ["Live chat & leaderboards", "— every video has its own room, and your top supporters get seen too."],
  ["Keep your other platforms", "— cross-post what you already make. Ember works alongside your channel, not instead of it."],
];

export function CreatorLanding() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const btnGrid = root.querySelector<HTMLButtonElement>("#cl-grid");
    const btnFlow = root.querySelector<HTMLButtonElement>("#cl-flow");
    const msgs = root.querySelector<HTMLDivElement>("#cl-msgs");
    const tipEl = root.querySelector("#cl-tip");
    const balEl = root.querySelector("#cl-bal");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const setMode = (grid: boolean) => {
      root.classList.toggle("mode-grid", grid);
      btnGrid?.classList.toggle("active", grid);
      btnFlow?.classList.toggle("active", !grid);
      if (grid)
        root.querySelectorAll<HTMLElement>(".tile").forEach((t) => {
          t.style.animation = "none";
          void t.offsetWidth;
          t.style.animation = "";
        });
    };
    btnGrid?.addEventListener("click", () => setMode(true));
    btnFlow?.addEventListener("click", () => setMode(false));

    const feed = [
      { u: "mara_k", t: "this deserves way more embers" },
      { u: "tomo", t: "sent", tag: "+5 embers" },
      { u: "lens.daily", t: "the one-take?? unreal" },
      { u: "sef", t: "held the flame the whole way", tag: "+12 embers" },
      { u: "quietfern", t: "first here from your channel, staying" },
      { u: "arlo", t: "chat's got a whole different energy here lol" },
      { u: "nia.films", t: "top of the leaderboard, earned it", tag: "+8 embers" },
      { u: "dov", t: "this is what the flame is for" },
    ];
    let i = 0, tips = 128, bal = 2450;
    const push = () => {
      if (!msgs) return;
      const m = feed[i % feed.length];
      i++;
      const el = document.createElement("div");
      el.className = "msg";
      el.innerHTML = `<b>${m.u}</b><span>${m.t}</span>` + (m.tag ? `<span class="ember-tag">${m.tag}</span>` : "");
      msgs.appendChild(el);
      while (msgs.children.length > 4) msgs.removeChild(msgs.firstChild!);
      if (m.tag) {
        const n = parseInt(m.tag.match(/\d+/)![0]);
        tips += n; if (tipEl) tipEl.textContent = String(tips);
        bal += n; if (balEl) balEl.textContent = bal.toLocaleString();
      }
    };
    push(); push(); push();
    const id = reduced ? undefined : window.setInterval(push, 2200);
    return () => { if (id) clearInterval(id); };
  }, []);

  return (
    <div className="cl" ref={rootRef}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <svg className="bg-flame" viewBox="0 0 100 130" aria-hidden>
        <g className="bg-flame-inner">
          <path d="M50 8 C34 34 24 52 24 70 C24 92 36 106 50 106 C64 106 76 92 76 70 C76 52 66 34 50 8 Z" fill="#EA580C" opacity=".55" />
          <path d="M50 34 C40 50 35 62 35 73 C35 88 42 97 50 97 C58 97 65 88 65 73 C65 62 60 50 50 34 Z" fill="#F59E0B" opacity=".6" />
          <path d="M50 56 C44 67 41 75 41 82 C41 91 45 96 50 96 C55 96 59 91 59 82 C59 75 56 67 50 56 Z" fill="#FDE68A" opacity=".55" />
        </g>
      </svg>

      <nav>
        <a className="wordmark" href="#top" aria-label="ember">
          <span className="l">e</span><span className="l">m</span><span className="l">b</span><span className="l">e</span><span className="l">r</span>
          <svg className="wm-flame" viewBox="0 0 100 130" aria-hidden>{FLAME}</svg>
        </a>
        <a className="nav-cta" href="#join">Join the creator list</a>
      </nav>

      <main className="hero" id="top">
        <section>
          <div className="eyebrow">For creators</div>
          <h1>Your audience already values you.<br /><span className="lit">Now they can show it.</span></h1>
          <p className="lede">
            Ember is a video platform built around a tip economy. Viewers hold the
            flame to send embers straight to you — appreciation for the work
            itself, not just another passive view.
          </p>
          <div className="cta-row">
            <a className="btn-primary" href="#join">Request early access</a>
            <span className="cta-note">Cross-post one video. See what happens.</span>
          </div>
          <div className="features">
            <h2>What you get</h2>
            <ul>
              {FEATURES.map(([strong, rest]) => (
                <li key={strong}>
                  <svg className="fl" viewBox="0 0 100 130">{FLAME}</svg>
                  <div><strong>{strong}</strong> <span>{rest}</span></div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div className="phone-wrap">
          <div className="phone">
            <div className="screen">
              <div className="view-flow" />
              <div className="view-grid">
                <div className="grid-tiles">
                  <div className="tile t1"><span className="dur">2:10</span></div>
                  <div className="tile t2"><span className="dur">0:47</span></div>
                  <div className="tile t3"><span className="dur">4:12</span><span className="tile-tip"><svg viewBox="0 0 100 130"><path d="M50 8 C34 34 24 52 24 70 C24 92 36 106 50 106 C64 106 76 92 76 70 C76 52 66 34 50 8 Z" fill="#F59E0B" /></svg><b>312</b></span></div>
                  <div className="tile t4"><span className="dur">1:03</span></div>
                  <div className="tile t5"><span className="dur">0:58</span></div>
                  <div className="tile t6"><span className="dur">3:24</span><span className="tile-tip"><svg viewBox="0 0 100 130"><path d="M50 8 C34 34 24 52 24 70 C24 92 36 106 50 106 C64 106 76 92 76 70 C76 52 66 34 50 8 Z" fill="#F59E0B" /></svg><b>87</b></span></div>
                  <div className="tile t7"><span className="dur">0:39</span></div>
                  <div className="tile t8"><span className="dur">2:51</span></div>
                </div>
              </div>
              <div className="topbar">
                <div className="balance">
                  <svg viewBox="0 0 100 130">{FLAME}</svg>
                  <b id="cl-bal">2,450</b>
                </div>
                <div className="mode-pill">
                  <button id="cl-grid" type="button">Grid</button>
                  <button id="cl-flow" type="button" className="active">Flow</button>
                </div>
              </div>
              <div className="meta">
                <div className="handle">@your_handle</div>
                <div className="caption">this could be your upload</div>
              </div>
              <div className="rail">
                <div>
                  <div className="tipbtn">
                    <svg className="ring" viewBox="0 0 62 62">
                      <circle cx="31" cy="31" r="26" fill="rgba(11,9,8,.6)" />
                      <circle cx="31" cy="31" r="26" fill="none" stroke="rgba(58,49,40,.9)" strokeWidth="4" />
                      <circle className="ring-fg" cx="31" cy="31" r="26" fill="none" stroke="url(#clrg)" strokeWidth="4" strokeLinecap="round" />
                      <defs><linearGradient id="clrg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#FDE68A" /><stop offset="100%" stopColor="#C2410C" /></linearGradient></defs>
                    </svg>
                    <svg className="flame" width="26" height="34" viewBox="0 0 100 130">{FLAME}</svg>
                  </div>
                  <div className="tipcount" id="cl-tip">128</div>
                </div>
                <div className="railbtn"><svg width="20" height="20" viewBox="0 0 24 24"><path d="M4 4h16v12H8l-4 4V4z" fill="#F5F1EA" opacity=".85" /></svg></div>
                <div className="railbtn"><svg width="18" height="18" viewBox="0 0 24 24"><path d="M12 2l2.6 6.6L21 9l-5 4.4L17.5 21 12 17.3 6.5 21 8 13.4 3 9l6.4-.4L12 2z" fill="#FDE68A" opacity=".9" /></svg></div>
              </div>
              <div className="chat">
                <div className="chat-label">Live chat</div>
                <div className="msgs" id="cl-msgs" />
              </div>
            </div>
          </div>
        </div>
      </main>

      <section className="apply" id="join">
        <h2>Request early access</h2>
        <p className="sub">
          We&apos;re onboarding creators in small waves. Tell us where you post
          and we&apos;ll get you set up — with one quick step to confirm the
          channel is really yours.
        </p>
        <CreatorApplyForm />
      </section>

      <footer>
        <div className="boiler">
          Ember is a video platform where viewers reward creators directly through
          embers — a tip gesture of appreciation.
        </div>
        <div>
          <a href="/privacy">Privacy</a> · e-mbr.uk
        </div>
      </footer>
    </div>
  );
}

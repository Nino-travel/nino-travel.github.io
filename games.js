/* Nino Game Center — Crowd Runner + Neon Ball. Vanilla JS + canvas, no libraries. */
(function () {
  "use strict";
  if (window.NinoGames) return;
  var LS = {
    get: function (k, d) { try { var v = localStorage.getItem("ngc_" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem("ngc_" + k, JSON.stringify(v)); } catch (e) {} }
  };
  var rnd = function (a, b) { return a + Math.random() * (b - a); };
  var rint = function (a, b) { return Math.floor(rnd(a, b + 1)); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var FONT = '-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",Roboto,Helvetica,Arial,sans-serif';

  /* ---------- styles ---------- */
  var css = "" +
    "#ngc{position:fixed;inset:0;z-index:2147483000;display:none;align-items:center;justify-content:center;background:rgba(8,10,20,.55);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);font-family:" + FONT + ";-webkit-tap-highlight-color:transparent}" +
    "#ngc.on{display:flex}#ngc *{font-family:" + FONT + ";box-sizing:border-box}" +
    "#ngc .ngc-f{position:relative;width:414px;max-width:100vw;height:min(880px,94vh);border-radius:34px;overflow:hidden;background:#0d1020;box-shadow:0 0 0 2px #2b2b30,0 0 0 6px #0b0b0d,0 30px 80px rgba(0,0,0,.5);animation:ngcIn .28s cubic-bezier(.2,.9,.3,1.1)}" +
    "@media (max-width:520px){#ngc .ngc-f{width:100vw;height:100vh;height:100dvh;border-radius:0;box-shadow:none}}" +
    "@keyframes ngcIn{from{transform:scale(.94);opacity:0}to{transform:none;opacity:1}}" +
    "#ngc canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;user-select:none;-webkit-user-select:none}" +
    "#ngc .ngc-top{position:absolute;left:0;right:0;top:0;padding:calc(env(safe-area-inset-top,0px) + 10px) 12px 0;display:flex;gap:8px;z-index:5;pointer-events:none}" +
    "#ngc .ngc-b{pointer-events:auto;width:36px;height:36px;border-radius:50%;border:0;background:rgba(0,0,0,.38);color:#fff;font-size:16px;font-weight:700;display:grid;place-items:center;cursor:pointer;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);box-shadow:0 2px 8px rgba(0,0,0,.2);transition:transform .15s}" +
    "#ngc .ngc-b:active{transform:scale(.9)}" +
    "#ngc .ngc-menu{position:absolute;inset:0;z-index:6;background:linear-gradient(180deg,#1b1f3b 0%,#0d1020 60%);display:flex;flex-direction:column;justify-content:flex-end}" +
    "#ngc .ngc-sheet{background:#f2f2f7;border-radius:22px 22px 0 0;padding:8px 16px calc(env(safe-area-inset-bottom,0px) + 22px);animation:ngcUp .32s cubic-bezier(.2,.9,.3,1)}" +
    "@keyframes ngcUp{from{transform:translateY(100%)}to{transform:none}}" +
    "#ngc .ngc-grab{width:38px;height:5px;border-radius:3px;background:#c7c7cc;margin:0 auto 12px}" +
    "#ngc .ngc-h{display:flex;align-items:center;justify-content:space-between;margin:0 2px 4px}" +
    "#ngc .ngc-h h3{margin:0;font-size:1.32rem;font-weight:800;color:#111;letter-spacing:-.01em}" +
    "#ngc .ngc-x{width:30px;height:30px;border-radius:50%;border:0;background:#e3e3e8;color:#555;font-size:14px;font-weight:700;cursor:pointer}" +
    "#ngc .ngc-sub{margin:0 2px 14px;color:#6b6b73;font-size:.82rem}" +
    "#ngc .ngc-card{display:flex;align-items:center;gap:12px;width:100%;text-align:left;background:#fff;border:0;border-radius:16px;padding:10px;margin-bottom:10px;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,.06);transition:transform .15s;font-family:inherit}" +
    "#ngc .ngc-card:active{transform:scale(.98)}" +
    "#ngc .ngc-th{width:64px;height:64px;border-radius:14px;flex:none;display:grid;place-items:center;font-size:30px;position:relative;overflow:hidden}" +
    "#ngc .ngc-th.r{background:linear-gradient(180deg,#5fb8ff 0%,#9fe1ff 48%,#2a9df4 49%,#4fd1c5 100%)}" +
    "#ngc .ngc-th.n{background:radial-gradient(circle at 50% 40%,#1e5a2a 0%,#050805 70%);box-shadow:inset 0 0 0 1.5px #39ff6a}" +
    "#ngc .ngc-card strong{display:block;font-size:1rem;color:#111}" +
    "#ngc .ngc-card small{display:block;font-size:.76rem;color:#6b6b73;margin-top:2px}" +
    "#ngc .ngc-play{margin-left:auto;background:#0a84ff;color:#fff;font-weight:800;font-size:.8rem;border-radius:999px;padding:7px 14px}" +
    "#ngc .ngc-card.ft{background:linear-gradient(135deg,#ff4f7a 0%,#ffb300 45%,#1e88e5 100%);padding:12px;box-shadow:0 6px 18px rgba(255,79,122,.35)}" +
    "#ngc .ngc-card.ft strong{color:#fff;font-size:1.12rem;text-shadow:0 1px 2px rgba(0,0,0,.25)}#ngc .ngc-card.ft small{color:rgba(255,255,255,.92)}" +
    "#ngc .ngc-card.ft .ngc-play{background:#fff;color:#e53935}" +
    "#ngc .ngc-th.l{width:70px;height:70px;background:linear-gradient(180deg,#5fb8ff,#bfe9ff 55%,#4fc24a 56%);box-shadow:inset 0 0 0 2px rgba(255,255,255,.7)}" +
    "#ngc .ngc-new{display:inline-block;margin-left:6px;vertical-align:2px;background:#fff;color:#e53935;font-size:.6rem;font-weight:900;border-radius:6px;padding:2px 5px;letter-spacing:.04em}" +
    "#ngc .ngc-load{position:absolute;inset:0;z-index:3;display:none;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#fff;font-weight:900;font-size:1.2rem;background:linear-gradient(180deg,#2b7fe0,#8fd0ff 60%,#4fc24a 60%)}" +
    "#ngc .ngc-load.on{display:flex}#ngc .ngc-load i{width:44px;height:44px;border-radius:50%;border:5px solid rgba(255,255,255,.35);border-top-color:#fff;animation:ngcSp .8s linear infinite}@keyframes ngcSp{to{transform:rotate(360deg)}}" +
    "#ngc .ngc-foot{text-align:center;color:#8e8e93;font-size:.72rem;margin-top:4px}" +
    "#ngc .ngc-hero{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;text-align:center;padding:20px}" +
    "#ngc .ngc-hero b{font-size:56px;filter:drop-shadow(0 6px 18px rgba(10,132,255,.6))}" +
    "#ngc .ngc-hero span{font-size:1.5rem;font-weight:800;margin-top:6px}" +
    "#ngc .ngc-hero em{font-style:normal;opacity:.65;font-size:.85rem;margin-top:4px}" +
    "#ngc .ngc-pan{position:absolute;inset:0;z-index:7;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.35)}" +
    "#ngc .ngc-pan.on{display:flex}" +
    "#ngc .ngc-box{width:min(320px,86%);background:#fff;border-radius:24px;padding:22px 18px 16px;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,.35);animation:ngcIn .25s ease}" +
    "#ngc .ngc-box.dk{background:#0b120c;color:#eaffef;box-shadow:0 0 0 1.5px #39ff6a,0 0 40px rgba(57,255,106,.35)}" +
    "#ngc .ngc-box h4{margin:0 0 6px;font-size:1.4rem;font-weight:900}" +
    "#ngc .ngc-box p{margin:4px 0;font-size:.95rem;opacity:.85}" +
    "#ngc .ngc-box .big{font-size:2rem;font-weight:900;margin:6px 0;opacity:1}" +
    "#ngc .ngc-btn{display:block;width:100%;border:0;border-radius:14px;padding:12px;margin-top:9px;font:800 .95rem " + FONT + ";cursor:pointer;background:#0a84ff;color:#fff;transition:transform .12s}" +
    "#ngc .ngc-btn:active{transform:scale(.97)}" +
    "#ngc .ngc-btn.g{background:#e9e9ee;color:#111}" +
    "#ngc .ngc-box.dk .ngc-btn{background:#39ff6a;color:#04140a}" +
    "#ngc .ngc-box.dk .ngc-btn.g{background:#17261a;color:#bfffcf}" +
    "#ngc .ngc-btn.t{background:none;color:#0a84ff;font-weight:700;font-size:.85rem;padding:8px}" +
    "#ngc .ngc-box.dk .ngc-btn.t{background:none;color:#7dffa0}" +
    "#ngc .ngc-paused{position:absolute;inset:0;z-index:6;display:none;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:1.2rem;background:rgba(0,0,0,.4);cursor:pointer}" +
    "#ngc .ngc-paused.on{display:flex}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  /* ---------- DOM ---------- */
  var root = document.createElement("div");
  root.id = "ngc"; root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Game Center");
  root.innerHTML =
    '<div class="ngc-f">' +
      '<canvas aria-label="Game"></canvas>' +
      '<div class="ngc-top"><button class="ngc-b" data-a="back" aria-label="Back to Game Center">✕</button><button class="ngc-b" data-a="snd" aria-label="Sound">🔇</button></div>' +
      '<div class="ngc-load"><i></i><span>Building Nino Land…</span></div>' +
      '<div class="ngc-paused" data-a="resume">⏸ Paused — tap to play</div>' +
      '<div class="ngc-pan"><div class="ngc-box"></div></div>' +
      '<div class="ngc-menu"><div class="ngc-hero"><b>🎮</b><span>Nino Game Center</span><em>Free games · no sign-up</em></div>' +
        '<div class="ngc-sheet"><div class="ngc-grab"></div>' +
          '<div class="ngc-h"><h3>Pick a game</h3><button class="ngc-x" data-a="close" aria-label="Close Game Center">✕</button></div>' +
          '<p class="ngc-sub">Play, beat your best, then text Nino your score 💬</p>' +
          '<button class="ngc-card ft" data-a="land"><span class="ngc-th l">🎡</span><span><strong>Nino Land<span class="ngc-new">NEW · 3D</span></strong><small data-s="land"></small></span><span class="ngc-play">Play</span></button>' +
          '<button class="ngc-card" data-a="runner"><span class="ngc-th r">🏃</span><span><strong>Crowd Runner</strong><small data-s="runner"></small></span><span class="ngc-play">Play</span></button>' +
          '<button class="ngc-card" data-a="neon"><span class="ngc-th n">⚽</span><span><strong>Neon Ball</strong><small data-s="neon"></small></span><span class="ngc-play">Play</span></button>' +
          '<div class="ngc-foot">Works with touch or mouse · progress saves on this device</div>' +
        '</div></div>' +
    '</div>';
  document.body.appendChild(root);
  var frame = root.querySelector(".ngc-f"), cv = root.querySelector("canvas"), ctx = cv.getContext("2d");
  var menu = root.querySelector(".ngc-menu"), pan = root.querySelector(".ngc-pan"), box = root.querySelector(".ngc-box");
  var pausedEl = root.querySelector(".ngc-paused"), topBar = root.querySelector(".ngc-top"), sndBtn = root.querySelector('[data-a="snd"]');

  var W = 0, H = 0, DPR = 1;
  function resize() {
    var r = frame.getBoundingClientRect();
    W = Math.max(200, r.width); H = Math.max(300, r.height);
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (game && game.resize) game.resize();
  }

  /* ---------- sound (muted by default) ---------- */
  var soundOn = !!LS.get("sound", false), ac = null;
  function updSnd() { sndBtn.textContent = soundOn ? "🔊" : "🔇"; sndBtn.setAttribute("aria-label", soundOn ? "Mute sound" : "Turn sound on"); }
  updSnd();
  function beep(f, d, type, vol) {
    if (!soundOn) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      var o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
      o.type = type || "sine"; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 1.5, t + d);
      g.gain.setValueAtTime(vol || 0.08, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + d + 0.02);
    } catch (e) {}
  }
  var sfx = { good: function () { beep(660, 0.12, "triangle"); }, bad: function () { beep(200, 0.18, "sawtooth", 0.05); }, win: function () { beep(523, 0.15); setTimeout(function () { beep(784, 0.25); }, 140); }, hit: function () { beep(140, 0.05, "square", 0.03); } };

  /* ---------- number formatting ---------- */
  var SUF = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
  function spaced(n) { return String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " "); }
  function abbr(n, dec) {
    n = Math.floor(n); if (n < 1000) return String(n);
    var i = Math.floor(Math.log10(n) / 3); if (i >= SUF.length) return n.toExponential(2).replace("+", "");
    var v = n / Math.pow(1000, i), s = v >= 100 ? v.toFixed(0) : v.toFixed(dec == null ? (v >= 10 ? 1 : 2) : dec);
    s = s.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
    return s + SUF[i];
  }
  function bigFmt(n) { return n < 1e9 ? spaced(n) : abbr(n); }
  function nice(v) { v = Math.max(1, v); var p = Math.pow(10, Math.floor(Math.log10(v))); var m = v / p; m = m < 1.5 ? 1 : m < 2.5 ? 2 : m < 4 ? 3 : m < 7 ? 5 : m < 9 ? 8 : 10; return m * p; }

  /* ---------- input ---------- */
  var drag = { on: false, x0: 0, v0: 0 };
  function px(e) { var r = cv.getBoundingClientRect(); return (e.clientX - r.left); }
  cv.addEventListener("pointerdown", function (e) { if (!game) return; drag.on = true; drag.x0 = px(e); drag.v0 = game.getX(); try { cv.setPointerCapture(e.pointerId); } catch (_) {} game.touched = true; e.preventDefault(); });
  cv.addEventListener("pointermove", function (e) { if (!drag.on || !game) return; game.setX(drag.v0 + (px(e) - drag.x0)); e.preventDefault(); });
  function up() { drag.on = false; }
  cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up); cv.addEventListener("lostpointercapture", up);
  cv.addEventListener("contextmenu", function (e) { e.preventDefault(); });

  /* ---------- loop ---------- */
  var game = null, raf = 0, last = 0, paused = false;
  function frameFn(t) {
    raf = requestAnimationFrame(frameFn);
    var dt = Math.min(0.05, Math.max(0, (t - last) / 1000)); last = t;
    if (!game) return;
    if (!paused) game.update(dt);
    game.draw();
  }
  function startLoop() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frameFn); } }
  function stopLoop() { if (raf) cancelAnimationFrame(raf); raf = 0; }
  function setPaused(p) { if (!game) p = false; paused = p; pausedEl.classList.toggle("on", p && !pan.classList.contains("on")); if (!p) last = performance.now(); }
  document.addEventListener("visibilitychange", function () { if (document.hidden) { if (game && !game.over) setPaused(true); stopLoop(); if (land) { land.pause(); pausedEl.classList.add("on"); } } else if (root.classList.contains("on") && game) startLoop(); });

  /* ---------- panel ---------- */
  function panel(opts) {
    box.className = "ngc-box" + (opts.dark ? " dk" : "");
    box.innerHTML = "";
    var h = document.createElement("h4"); h.textContent = opts.title; box.appendChild(h);
    (opts.lines || []).forEach(function (l) { var p = document.createElement("p"); if (l.big) p.className = "big"; p.textContent = l.t; box.appendChild(p); });
    (opts.buttons || []).forEach(function (b) { var x = document.createElement("button"); x.className = "ngc-btn" + (b.cls ? " " + b.cls : ""); x.textContent = b.label; x.addEventListener("click", function (e) { e.stopPropagation(); b.fn(); }); box.appendChild(x); });
    pan.classList.add("on");
  }
  function hidePanel() { pan.classList.remove("on"); }

  function textNino(msg) {
    close();
    var t = document.getElementById("nw-t");
    if (!t) return;
    t.value = msg.slice(0, 200);
    try { t.dispatchEvent(new Event("input", { bubbles: true })); } catch (e) {}
    var wall = document.querySelector(".nw") || t;
    try { wall.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (e) {}
    setTimeout(function () { try { t.focus({ preventScroll: true }); } catch (e) {} }, 350);
  }

  /* =====================================================================
     GAME 1: CROWD RUNNER
     ===================================================================== */
  function makeFig(color, dark) {
    var c = document.createElement("canvas"), s = 2; c.width = 16 * s; c.height = 26 * s;
    var g = c.getContext("2d"); g.scale(s, s);
    g.fillStyle = "rgba(0,0,0,.18)"; g.beginPath(); g.ellipse(8, 24, 6, 2, 0, 0, 7); g.fill();
    g.fillStyle = dark; g.beginPath(); g.roundRect ? g.roundRect(3.2, 15, 3.6, 9, 1.8) : g.rect(3.2, 15, 3.6, 9); g.fill();
    g.beginPath(); g.roundRect ? g.roundRect(9.2, 15, 3.6, 9, 1.8) : g.rect(9.2, 15, 3.6, 9); g.fill();
    g.fillStyle = color; g.beginPath(); g.roundRect ? g.roundRect(2.5, 7.5, 11, 10, 4) : g.rect(2.5, 7.5, 11, 10); g.fill();
    g.beginPath(); g.arc(8, 4.6, 4.2, 0, 7); g.fill();
    g.fillStyle = "rgba(255,255,255,.35)"; g.beginPath(); g.arc(6.6, 3.4, 1.5, 0, 7); g.fill();
    return c;
  }
  var FIG_B = makeFig("#2f7bff", "#1f56c8"), FIG_R = makeFig("#ff3b4e", "#c41f31");
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

  function Runner() {
    var S = this, R = 3, D = 6, CH = 3;
    var HY, FY, RW, bg = null;
    S.level = LS.get("rlevel", 1); S.coins = LS.get("coins", 0);
    S.resize = function () {
      HY = H * 0.33; FY = (H * 0.74 - HY) / CH; RW = W * 0.40;
      bg = document.createElement("canvas"); bg.width = Math.round(W * DPR); bg.height = Math.round(H * DPR);
      var g = bg.getContext("2d"); g.scale(DPR, DPR);
      var sky = g.createLinearGradient(0, 0, 0, HY); sky.addColorStop(0, "#2f9cf0"); sky.addColorStop(1, "#bfe9ff");
      g.fillStyle = sky; g.fillRect(0, 0, W, HY + 1);
      var sea = g.createLinearGradient(0, HY, 0, H); sea.addColorStop(0, "#7fe0f0"); sea.addColorStop(0.25, "#38b8e6"); sea.addColorStop(1, "#1f8fd6");
      g.fillStyle = sea; g.fillRect(0, HY, W, H - HY);
      g.fillStyle = "rgba(255,255,255,.95)";
      [[0.62, 0.17, 1], [0.12, 0.25, 0.8], [0.9, 0.24, 0.7]].forEach(function (c) {
        var x = W * c[0], y = H * c[1], k = W / 414 * c[2];
        [[0, 0, 34], [30, -10, 30], [60, 2, 28], [-28, 6, 24], [86, 8, 20]].forEach(function (b) { g.beginPath(); g.ellipse(x + b[0] * k, y + b[1] * k, b[2] * k * 1.2, b[2] * k * 0.75, 0, 0, 7); g.fill(); });
      });
      g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 2;
      for (var i = 0; i < 26; i++) { var yy = HY + 12 + Math.random() * (H - HY - 12), xx = Math.random() * W; g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx + 10 + Math.random() * 18, yy); g.stroke(); }
      [[0.28, -1], [0.74, 1]].forEach(function (p) {
        var x = W * p[0], y = HY + 2; g.fillStyle = "#e8d9a0"; g.beginPath(); g.ellipse(x, y, 11, 3, 0, 0, 7); g.fill();
        g.strokeStyle = "#7a5a2a"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + p[1] * 2, y - 12); g.stroke();
        g.fillStyle = "#2fa84f"; g.beginPath(); g.ellipse(x + p[1] * 2, y - 13, 7, 3.5, 0, 0, 7); g.fill();
      });
    };
    S.reset = function () {
      S.count = 10; S.shown = 10; S.trav = 0; S.speed = 12 + Math.min(S.level, 10) * 0.5; S.x = 0;
      S.L = 190 + Math.min(S.level, 12) * 28; S.objs = []; S.phase = "play"; S.over = false; S.pops = []; S.fight = null; S.t = 0; S.endT = 0;
      var z = 34, i = 0;
      while (z < S.L - 22) {
        var enemyP = S.level >= 2 ? 0.22 + Math.min(S.level, 8) * 0.02 : (i === 3 ? 1 : 0);
        if (i > 1 && Math.random() < enemyP) S.objs.push({ k: "e", z: z, n: rint(5, 9) + S.level * 5, dead: false, xo: 0 });
        else S.objs.push(S.gatePair(z));
        z += rnd(24, 30) - Math.min(S.level, 6); i++;
      }
      S.boss = 18 + S.level * 22;
      S.objs.push({ k: "fin", z: S.L }); S.objs.push({ k: "boss", z: S.L + 7, n: S.boss });
    };
    S.gatePair = function (z) {
      var good = [function () { return { o: "+", v: nice(rint(5, 15 + S.level * 4)) }; }, function () { return { o: "×", v: 2 }; }, function () { return { o: "+", v: rint(2, 6) * 5 }; }, function () { return Math.random() < 0.25 ? { o: "×", v: 3 } : { o: "×", v: 2 }; }];
      var bad = [function () { return { o: "−", v: rint(1, 3) * 5 + S.level * 3 }; }, function () { return { o: "÷", v: 2 }; }, function () { return { o: "−", v: rint(2, 4) * 5 }; }];
      var a = good[rint(0, good.length - 1)](), b;
      if (Math.random() < Math.min(0.3 + S.level * 0.08, 0.75)) b = bad[rint(0, bad.length - 1)]();
      else { do { b = good[rint(0, good.length - 1)](); } while (b.o === a.o && b.v === a.v); }
      return Math.random() < 0.5 ? { k: "g", z: z, l: a, r: b, used: false } : { k: "g", z: z, l: b, r: a, used: false };
    };
    S.radius = function (n) { return Math.sqrt(Math.min(n, 140)) * 5.2 * (W / 414) + 6; };
    S.getX = function () { return S.x * RW / R; };
    S.setX = function (p) { var lim = RW - S.radius(S.count) * 0.7; S.x = clamp(p, -lim, lim) * R / RW; };
    S.proj = function (x, z, y) { var dep = z - S.trav + D; if (dep < 0.4) return null; var k = D / dep; return { x: W / 2 + x / R * RW * k, y: HY + (CH - (y || 0)) * FY * k, k: k }; };
    function apply(op, n) { if (op.o === "+") return n + op.v; if (op.o === "×") return n * op.v; if (op.o === "−") return n - op.v; return Math.floor(n / op.v); }
    function isGood(op) { return op.o === "+" || op.o === "×"; }
    S.pop = function (txt, good) { S.pops.push({ t: txt, g: good, a: 1, y: 0 }); };
    S.update = function (dt) {
      S.t += dt;
      if (S.phase === "play") {
        S.trav += S.speed * dt;
        for (var i = 0; i < S.objs.length; i++) {
          var o = S.objs[i];
          if (o.k === "g" && !o.used && o.z <= S.trav) {
            o.used = true; var op = S.x < 0 ? o.l : o.r, before = S.count;
            S.count = Math.max(0, apply(op, S.count)); o.hit = S.x < 0 ? "l" : "r";
            S.pop((S.count >= before ? "+" : "−") + Math.abs(S.count - before), isGood(op)); (isGood(op) ? sfx.good : sfx.bad)();
            if (S.count <= 0) return S.lose();
          }
          if (o.k === "e" && !o.dead && o.z - S.trav <= 1.6) { S.phase = "fight"; S.fight = o; S.ft = 0; }
          if (o.k === "boss" && o.z - S.trav <= 2.2 && S.phase === "play") { S.phase = "fight"; S.fight = o; S.ft = 0; }
        }
        if (S.phase === "play") S.objs = S.objs.filter(function (o) { return o.z > S.trav - 6; });
      } else if (S.phase === "fight") {
        S.ft += dt;
        var f = S.fight;
        while (S.ft > 0.045) {
          S.ft -= 0.045; var k = Math.max(1, Math.ceil(Math.min(S.count, f.n) / 22));
          k = Math.min(k, S.count, f.n); S.count -= k; f.n -= k; if (Math.random() < 0.5) sfx.hit();
          if (f.n <= 0) { f.dead = true; S.phase = "play"; if (f.k === "boss") return S.win(); break; }
          if (S.count <= 0) return S.lose();
        }
      }
      S.shown += (S.count - S.shown) * Math.min(1, dt * 10);
      if (Math.abs(S.shown - S.count) < 0.5) S.shown = S.count;
      S.pops.forEach(function (p) { p.y += dt * 60; p.a -= dt * 1.1; }); S.pops = S.pops.filter(function (p) { return p.a > 0; });
    };
    S.lose = function () {
      S.phase = "end"; S.over = true; sfx.bad();
      panel({ title: "Out of runners! 😅", lines: [{ t: "Level " + S.level }, { t: "Pick the blue gates and dodge the red ones." }],
        buttons: [{ label: "Try again", fn: function () { hidePanel(); S.reset(); } }, { label: "Game Center", cls: "g", fn: showMenu }] });
    };
    S.win = function () {
      S.phase = "end"; S.over = true; sfx.win();
      var earned = 10 + S.level * 5 + Math.floor(S.count / 4), lv = S.level;
      S.coins += earned; LS.set("coins", S.coins); S.level++; LS.set("rlevel", S.level);
      var left = S.count;
      panel({ title: "Level " + lv + " complete! 🎉", lines: [{ t: left + " runners left" }, { t: "+" + earned + " 🪙", big: true }, { t: "Total coins: " + S.coins }],
        buttons: [{ label: "Next level ▶", fn: function () { hidePanel(); S.reset(); } },
          { label: "💬 Text Nino my score", cls: "t", fn: function () { textNino("I beat Level " + lv + " in Crowd Runner with " + left + " runners left 🎮"); } },
          { label: "Game Center", cls: "g", fn: showMenu }] });
    };
    function drawCrowd(cx, cy, n, sc, fig, t, moving) {
      var m = Math.min(n, 140), spread = 5.2 * (W / 414) * sc, fw = 16 * sc * (W / 414) * 1.05, fh = 26 * sc * (W / 414) * 1.05;
      var pts = [];
      for (var i = 0; i < m; i++) { var r = Math.sqrt(i + 0.5) * spread, a = i * 2.39996; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.55]); }
      pts.sort(function (a, b) { return a[1] - b[1]; });
      for (var j = 0; j < pts.length; j++) { var bob = moving ? Math.abs(Math.sin(t * 14 + j * 1.7)) * 2.2 * sc : 0; ctx.drawImage(fig, pts[j][0] - fw / 2, pts[j][1] - fh - bob, fw, fh); }
    }
    function bubble(x, y, txt, col, sc) {
      ctx.font = "800 " + Math.round(22 * sc) + "px " + FONT; var w = ctx.measureText(txt).width + 26 * sc, h = 34 * sc;
      ctx.fillStyle = "rgba(0,0,0,.18)"; rr(ctx, x - w / 2, y - h / 2 + 3 * sc, w, h, 11 * sc); ctx.fill();
      ctx.fillStyle = col; rr(ctx, x - w / 2, y - h / 2, w, h, 11 * sc); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = 2.5 * sc; ctx.stroke();
      ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(txt, x, y + 1);
    }
    function drawObj(o) {
      if (o.k === "g") {
        var gh = 1.05, a = S.proj(-R, o.z, 0), b = S.proj(R, o.z, gh), m = S.proj(0, o.z, 0); if (!a) return;
        var top = b.y, bot = a.y, xl = a.x, xr = W - a.x + 0, xm = m.x; xr = 2 * xm - xl;
        [[xl, xm, o.l, "l"], [xm, xr, o.r, "r"]].forEach(function (s) {
          var good = isGood(s[2]), hit = o.hit === s[3];
          var gr = ctx.createLinearGradient(0, top, 0, bot);
          gr.addColorStop(0, good ? "rgba(60,150,255,.75)" : "rgba(255,70,90,.75)"); gr.addColorStop(1, good ? "rgba(120,190,255,.45)" : "rgba(255,130,140,.45)");
          ctx.globalAlpha = hit ? 0.35 : 1; ctx.fillStyle = gr; ctx.fillRect(s[0], top, s[1] - s[0], bot - top);
          ctx.font = "900 " + Math.max(8, Math.round(46 * a.k * (W / 414))) + "px " + FONT; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.lineWidth = Math.max(1, 4 * a.k); ctx.strokeStyle = good ? "#1a4fb0" : "#a3122a"; var tx = s[2].o + s[2].v;
          ctx.strokeText(tx, (s[0] + s[1]) / 2, (top + bot) / 2); ctx.fillStyle = "#fff"; ctx.fillText(tx, (s[0] + s[1]) / 2, (top + bot) / 2);
          ctx.globalAlpha = 1;
        });
        ctx.fillStyle = "#fff"; var pw = Math.max(1.5, 7 * a.k * (W / 414));
        [xl, xm, xr].forEach(function (x) { rr(ctx, x - pw / 2, top - pw, pw, bot - top + pw, pw / 2); ctx.fill(); });
      } else if (o.k === "e" && !o.dead) {
        var p = S.proj(0, o.z, 0); if (!p) return;
        drawCrowd(p.x, p.y, o.n, p.k, FIG_R, S.t, false);
        bubble(p.x, p.y - S.radius(o.n) * 0.55 * p.k - 42 * p.k * (W / 414), String(o.n), "#ff3b4e", Math.max(0.35, p.k));
      } else if (o.k === "fin") {
        var c0 = S.proj(-R, o.z, 0), c1 = S.proj(-R, o.z + 1.2, 0); if (!c0 || !c1) return;
        var n = 12, cw = (W - 2 * c0.x) / n, cw1 = (W - 2 * c1.x) / n;
        for (var r = 0; r < 2; r++) for (var i = 0; i < n; i++) {
          ctx.fillStyle = (i + r) % 2 ? "#111" : "#fff";
          var y0 = r ? (c0.y + c1.y) / 2 : c0.y, y1 = r ? c1.y : (c0.y + c1.y) / 2, x0 = c0.x + i * cw, x1 = c1.x + i * cw1, f = r ? 0.5 : 0;
          ctx.beginPath(); ctx.moveTo(c0.x + (c1.x - c0.x) * f + i * (cw + (cw1 - cw) * f), y0); ctx.lineTo(c0.x + (c1.x - c0.x) * f + (i + 1) * (cw + (cw1 - cw) * f), y0);
          var f2 = r ? 1 : 0.5; ctx.lineTo(c0.x + (c1.x - c0.x) * f2 + (i + 1) * (cw + (cw1 - cw) * f2), y1); ctx.lineTo(c0.x + (c1.x - c0.x) * f2 + i * (cw + (cw1 - cw) * f2), y1); ctx.fill();
        }
      } else if (o.k === "boss" && !o.dead) {
        var q = S.proj(0, o.z, 0), q2 = S.proj(0, o.z, 2.6); if (!q) return;
        var bw = RW * 0.55 * q.k, th = q.y - q2.y;
        ctx.fillStyle = "#c41f31"; rr(ctx, q.x - bw / 2, q2.y, bw, th, 6 * q.k); ctx.fill();
        ctx.fillStyle = "#ff3b4e"; rr(ctx, q.x - bw / 2 + 4 * q.k, q2.y + 4 * q.k, bw - 8 * q.k, th - 8 * q.k, 5 * q.k); ctx.fill();
        for (var c = 0; c < 4; c++) { ctx.fillStyle = "#c41f31"; ctx.fillRect(q.x - bw / 2 + c * bw / 3.5, q2.y - 10 * q.k, bw / 7, 10 * q.k); }
        ctx.font = Math.round(34 * q.k) + "px " + FONT; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("👑", q.x, q2.y + th * 0.38);
        drawCrowd(q.x, q.y + 4 * q.k, Math.min(o.n, 40), q.k, FIG_R, S.t, false);
        bubble(q.x, q2.y - 30 * q.k, String(o.n), "#ff3b4e", Math.max(0.4, q.k));
      }
    }
    S.draw = function () {
      if (!bg) S.resize();
      ctx.drawImage(bg, 0, 0, W, H);
      var zFar = S.trav + 140, zNear = S.trav - D + 0.45;
      var pf = S.proj(-R, zFar, 0), pn = S.proj(-R, zNear, 0), ef = S.proj(-R - 0.45, zFar, 0), en = S.proj(-R - 0.45, zNear, 0);
      ctx.fillStyle = "#1aa39a"; ctx.beginPath(); ctx.moveTo(ef.x, ef.y); ctx.lineTo(W - ef.x, ef.y); ctx.lineTo(W - en.x, en.y + 40); ctx.lineTo(en.x, en.y + 40); ctx.fill();
      ctx.fillStyle = "#47e6c4"; ctx.beginPath(); ctx.moveTo(ef.x, ef.y); ctx.lineTo(W - ef.x, ef.y); ctx.lineTo(W - en.x, en.y); ctx.lineTo(en.x, en.y); ctx.fill();
      ctx.fillStyle = "#f4f6fb"; ctx.beginPath(); ctx.moveTo(pf.x, pf.y); ctx.lineTo(W - pf.x, pf.y); ctx.lineTo(W - pn.x, pn.y); ctx.lineTo(pn.x, pn.y); ctx.fill();
      ctx.fillStyle = "#e3e7f0";
      var sl = 7, z0 = Math.floor(zNear / sl) * sl;
      for (var z = z0; z < zFar; z += sl * 2) {
        var a = S.proj(-R, Math.max(z, zNear), 0), b = S.proj(-R, Math.min(z + sl, zFar), 0); if (!a || !b) continue;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(W - a.x, a.y); ctx.lineTo(W - b.x, b.y); ctx.lineTo(b.x, b.y); ctx.fill();
      }
      ctx.fillStyle = "rgba(200,206,220,.9)";
      for (z = Math.floor(zNear / 10) * 10; z < S.trav + 60; z += 10) { var c1 = S.proj(-0.05, Math.max(z, zNear), 0), c2 = S.proj(-0.05, z + 4, 0); if (!c1 || !c2) continue; var w1 = (W / 2 - c1.x) * 2, w2 = (W / 2 - c2.x) * 2; ctx.beginPath(); ctx.moveTo(W / 2 - w1 / 2, c1.y); ctx.lineTo(W / 2 + w1 / 2, c1.y); ctx.lineTo(W / 2 + w2 / 2, c2.y); ctx.lineTo(W / 2 - w2 / 2, c2.y); ctx.fill(); }
      var front = [], back = [];
      for (var i = S.objs.length - 1; i >= 0; i--) { var o = S.objs[i]; (o.z >= S.trav - 0.2 ? back : front).push(o); }
      back.sort(function (a, b) { return b.z - a.z; }).forEach(drawObj);
      var px0 = W / 2 + S.x / R * RW, py0 = HY + CH * FY;
      ctx.fillStyle = "rgba(20,40,80,.10)"; ctx.beginPath(); var rad = S.radius(S.count); ctx.ellipse(px0, py0 - 4, rad + 10, (rad + 10) * 0.5, 0, 0, 7); ctx.fill();
      if (S.count > 0) drawCrowd(px0, py0, S.count, 1, FIG_B, S.t, S.phase === "play");
      front.sort(function (a, b) { return b.z - a.z; }).forEach(drawObj);
      var by = py0 - rad * 0.55 - 70 * (W / 414);
      if (S.count > 0) bubble(px0, by, String(Math.round(S.shown)), "#2f7bff", W / 414);
      S.pops.forEach(function (p) { ctx.globalAlpha = Math.max(0, p.a); ctx.font = "900 " + Math.round(26 * W / 414) + "px " + FONT; ctx.textAlign = "center"; ctx.lineWidth = 4; ctx.strokeStyle = p.g ? "#1a4fb0" : "#a3122a"; ctx.strokeText(p.t, px0, by - 30 - p.y); ctx.fillStyle = "#fff"; ctx.fillText(p.t, px0, by - 30 - p.y); ctx.globalAlpha = 1; });
      var top = 58 + (parseFloat(getComputedStyle(topBar).paddingTop) || 10) - 10;
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = "900 " + Math.round(19 * W / 414) + "px " + FONT;
      ctx.lineWidth = 4; ctx.strokeStyle = "rgba(20,50,110,.55)"; ctx.strokeText("LEVEL " + S.level, W / 2, top); ctx.fillStyle = "#fff"; ctx.fillText("LEVEL " + S.level, W / 2, top);
      var bw = W * 0.3, bx = W / 2 - bw / 2, bh = 7; ctx.fillStyle = "rgba(20,50,110,.3)"; rr(ctx, bx, top + 16, bw, bh, 3.5); ctx.fill();
      ctx.fillStyle = "#fff"; rr(ctx, bx, top + 16, Math.max(bh, bw * clamp(S.trav / S.L, 0, 1)), bh, 3.5); ctx.fill();
      var cw = 96 * W / 414, cx = W - cw - 12, cy = top - 15; ctx.fillStyle = "rgba(20,50,110,.35)"; rr(ctx, cx, cy, cw, 32, 16); ctx.fill();
      ctx.fillStyle = "#ffc21a"; ctx.beginPath(); ctx.arc(cx + 17, cy + 16, 11, 0, 7); ctx.fill(); ctx.strokeStyle = "#e09a00"; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = "#fff"; ctx.font = "800 15px " + FONT; ctx.fillText(String(S.coins), cx + cw / 2 + 10, cy + 17);
      if (!S.touched && S.phase === "play") {
        var hy = H * 0.86, a2 = 0.6 + Math.sin(S.t * 4) * 0.25, off = Math.sin(S.t * 3) * 40;
        ctx.fillStyle = "rgba(20,40,80,.16)"; rr(ctx, W / 2 - 80, hy - 22, 160, 44, 22); ctx.fill();
        ctx.font = "40px " + FONT; ctx.fillText("👆", W / 2 + off, hy + 4);
        ctx.font = "900 " + Math.round(20 * W / 414) + "px " + FONT; ctx.lineWidth = 4; ctx.strokeStyle = "#1a3c8a"; ctx.strokeText("DRAG TO STEER", W / 2, hy + 48); ctx.fillStyle = "#fff"; ctx.fillText("DRAG TO STEER", W / 2, hy + 48);
      }
    };
    S.title = "Crowd Runner";
    S.resize(); S.reset();
  }

  /* =====================================================================
     GAME 2: NEON BALL
     ===================================================================== */
  function makeBall(r) {
    var c = document.createElement("canvas"), s = 2, d = Math.ceil(r * 2 + 6); c.width = d * s; c.height = d * s;
    var g = c.getContext("2d"); g.scale(s, s); var cx = d / 2;
    g.fillStyle = "#0a1a40"; g.beginPath(); g.arc(cx, cx, r + 2.5, 0, 7); g.fill();
    var gr = g.createRadialGradient(cx - r * 0.35, cx - r * 0.35, r * 0.1, cx, cx, r); gr.addColorStop(0, "#fff"); gr.addColorStop(1, "#d9dde6");
    g.fillStyle = gr; g.beginPath(); g.arc(cx, cx, r, 0, 7); g.fill();
    g.save(); g.beginPath(); g.arc(cx, cx, r, 0, 7); g.clip();
    function pent(x, y, s2, rot) { g.beginPath(); for (var i = 0; i < 5; i++) { var a = rot + i * Math.PI * 2 / 5; g[i ? "lineTo" : "moveTo"](x + Math.cos(a) * s2, y + Math.sin(a) * s2); } g.closePath(); g.fill(); }
    g.fillStyle = "#1b1f2a"; pent(cx, cx, r * 0.3, -Math.PI / 2);
    g.strokeStyle = "#1b1f2a"; g.lineWidth = r * 0.06;
    for (var i = 0; i < 5; i++) {
      var a = -Math.PI / 2 + i * Math.PI * 2 / 5, x = cx + Math.cos(a) * r * 0.92, y = cx + Math.sin(a) * r * 0.92;
      pent(x, y, r * 0.28, a + Math.PI / 5);
      g.beginPath(); g.moveTo(cx + Math.cos(a) * r * 0.3, cx + Math.sin(a) * r * 0.3); g.lineTo(cx + Math.cos(a) * r * 0.66, cx + Math.sin(a) * r * 0.66); g.stroke();
    }
    g.restore();
    return c;
  }
  function NeonBall() {
    var S = this, ballImg = null, bgc = null, BR = 0;
    S.best = LS.get("nbest", 0); S.title = "Neon Ball";
    S.resize = function () {
      BR = Math.round(W * 0.1); ballImg = makeBall(BR);
      bgc = document.createElement("canvas"); bgc.width = Math.round(W * DPR); bgc.height = Math.round(H * DPR);
      var g = bgc.getContext("2d"); g.scale(DPR, DPR);
      var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#020403"); gr.addColorStop(0.5, "#07120a"); gr.addColorStop(1, "#020302");
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      var rg = g.createRadialGradient(W / 2, H * 0.55, 10, W / 2, H * 0.55, H * 0.6); rg.addColorStop(0, "rgba(40,120,60,.22)"); rg.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = rg; g.fillRect(0, 0, W, H);
      g.fillStyle = "rgba(57,255,106,.05)"; g.beginPath(); g.moveTo(0, H * 0.1); g.lineTo(W, H * 0.02); g.lineTo(W, H * 0.12); g.lineTo(0, H * 0.22); g.fill();
      S.bx = clamp(S.bx || W / 2, BR, W - BR);
    };
    S.reset = function () {
      S.num = 100; S.shown = 100; S.time = 50; S.el = 0; S.rows = []; S.spawn = 0.6; S.bx = W / 2; S.rot = 0; S.parts = []; S.over = false; S.pops = []; S.flash = 0; S.flashG = true;
      S.stars = []; for (var i = 0; i < 40; i++) S.stars.push([Math.random(), Math.random(), rnd(0.3, 1)]);
    };
    S.getX = function () { return S.bx; };
    S.setX = function (p) { S.bx = clamp(p, BR + 4, W - BR - 4); };
    function gen(good) {
      var n = S.num, late = S.el / 50;
      if (good) {
        var r = Math.random();
        if (r < 0.32) return { o: "x", v: Math.random() < 0.3 + late * 0.3 ? 3 : 2 };
        if (r < 0.4) return { o: "x", v: 5 };
        return { o: "+", v: nice(n * rnd(0.6, 4)) };
      }
      return Math.random() < 0.5 ? { o: "÷", v: Math.random() < 0.5 ? 2 : 3 } : { o: "−", v: nice(n * rnd(0.35, 0.7 + late * 0.7)) };
    }
    function good(op) { return op.o === "x" || op.o === "+"; }
    function lab(op) { return op.o === "x" ? "x" + op.v : op.o + abbr(op.v); }
    S.update = function (dt) {
      if (S.over) return;
      S.el += dt; S.time -= dt; S.flash = Math.max(0, S.flash - dt * 3);
      var sp = H * (0.32 + Math.min(S.el, 50) / 50 * 0.3);
      S.spawn -= dt;
      if (S.spawn <= 0) {
        var bothGood = Math.random() < 0.35, a = gen(true), b = bothGood ? gen(true) : gen(false);
        if (bothGood && a.o === b.o && a.v === b.v) b = { o: "x", v: a.o === "x" && a.v === 2 ? 3 : 2 };
        var sw = Math.random() < 0.5; S.rows.push({ y: -H * 0.16, l: sw ? a : b, r: sw ? b : a, used: false, seed: Math.random() * 1000 });
        S.spawn = rnd(1.35, 1.75) * (H * 0.36) / sp;
      }
      var by = H * 0.58, gh = H * 0.15;
      for (var i = 0; i < S.rows.length; i++) {
        var row = S.rows[i]; row.y += sp * dt;
        if (!row.used && row.y + gh * 0.55 >= by) {
          row.used = true; var left = S.bx < W / 2, op = left ? row.l : row.r, before = S.num; row.hit = left ? "l" : "r";
          if (op.o === "x") S.num *= op.v; else if (op.o === "+") S.num += op.v; else if (op.o === "−") S.num -= op.v; else S.num = Math.floor(S.num / op.v);
          S.num = Math.max(0, Math.floor(S.num)); S.flash = 1; S.flashG = good(op); (good(op) ? sfx.good : sfx.bad)();
          for (var k = 0; k < 18; k++) { var an = Math.random() * Math.PI * 2, v = rnd(80, 260); S.parts.push({ x: S.bx, y: by, vx: Math.cos(an) * v, vy: Math.sin(an) * v, a: 1, g: good(op) }); }
          S.pops.push({ t: lab(op), g: good(op), a: 1, y: 0, x: S.bx });
          if (S.num <= 0) return S.end(true);
        }
      }
      S.rows = S.rows.filter(function (r) { return r.y < H + 40; });
      S.parts.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.94; p.vy *= 0.94; p.a -= dt * 1.6; }); S.parts = S.parts.filter(function (p) { return p.a > 0; });
      S.pops.forEach(function (p) { p.y += dt * 70; p.a -= dt * 1.2; }); S.pops = S.pops.filter(function (p) { return p.a > 0; });
      S.rot += dt * (sp / BR) * 0.6;
      var lt = Math.log10(S.shown + 1), ln = Math.log10(S.num + 1); lt += (ln - lt) * Math.min(1, dt * 7); S.shown = Math.max(0, Math.pow(10, lt) - 1); if (Math.abs(S.shown - S.num) < 1) S.shown = S.num;
      if (S.time <= 0) { S.time = 0; S.end(false); }
    };
    S.end = function (zero) {
      S.over = true; S.shown = S.num; var score = S.num, nb = score > S.best;
      if (nb) { S.best = score; LS.set("nbest", score); } (nb ? sfx.win : sfx.bad)();
      var sc = bigFmt(score);
      panel({ dark: true, title: zero ? "Ball hit zero! 😬" : (nb ? "New best! 🏆" : "Time's up! ⏱"), lines: [{ t: "Score" }, { t: sc, big: true }, { t: "Best: " + bigFmt(S.best) }],
        buttons: [{ label: "Play again", fn: function () { hidePanel(); S.reset(); } },
          { label: "💬 Text Nino my score", cls: "t", fn: function () { textNino("I scored " + abbr(score) + " in Neon Ball 🎮"); } },
          { label: "Game Center", cls: "g", fn: showMenu }] });
    };
    function gate(x, y, w, h, op, row, side) {
      var gd = good(op), col = gd ? "57,255,106" : "255,40,90", hit = row.hit === side;
      var gr = ctx.createLinearGradient(0, y, 0, y + h);
      gr.addColorStop(0, "rgba(" + col + ",0.04)"); gr.addColorStop(0.7, "rgba(" + col + ",0.32)"); gr.addColorStop(1, "rgba(" + col + ",0.62)");
      ctx.globalAlpha = hit ? 0.35 : 1;
      ctx.fillStyle = gr; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "rgba(" + col + ",0.22)";
      var sd = row.seed + (side === "l" ? 0 : 50);
      for (var i = 0; i < 7; i++) { var q = (Math.sin(sd + i * 12.9898) * 43758.5453) % 1; q = Math.abs(q); var q2 = Math.abs((Math.sin(sd + i * 78.233) * 12345.678) % 1); var s = 7 + q2 * 6; ctx.fillRect(x + 8 + q * (w - 24), y + 8 + q2 * (h - 24), s, s); }
      ctx.shadowColor = "rgb(" + col + ")"; ctx.shadowBlur = 18; ctx.fillStyle = "rgb(" + col + ")"; ctx.fillRect(x, y + h - 4, w, 4);
      ctx.font = "900 " + Math.round(h * 0.3) + "px " + FONT; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.shadowBlur = 12; ctx.lineWidth = 3; ctx.strokeStyle = gd ? "#0d7a2c" : "#8a0f2e"; var t = lab(op);
      ctx.strokeText(t, x + w / 2, y + h * 0.5); ctx.fillStyle = "#fff"; ctx.fillText(t, x + w / 2, y + h * 0.5);
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    }
    function post(x, y, h) {
      var pw = Math.max(8, W * 0.022), g = ctx.createLinearGradient(x - pw / 2, 0, x + pw / 2, 0);
      g.addColorStop(0, "#555b63"); g.addColorStop(0.45, "#e9edf2"); g.addColorStop(1, "#4a5058");
      ctx.fillStyle = g; rr(ctx, x - pw / 2, y - 6, pw, h + 10, pw / 2); ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,.5)"; ctx.beginPath(); ctx.ellipse(x, y + h + 4, pw * 0.8, 3, 0, 0, 7); ctx.fill();
    }
    S.draw = function () {
      if (!bgc) S.resize();
      ctx.drawImage(bgc, 0, 0, W, H);
      ctx.fillStyle = "rgba(120,255,160,.35)";
      for (var i = 0; i < S.stars.length; i++) { var s = S.stars[i]; var yy = ((s[1] * H + S.el * H * 0.25 * s[2]) % H); ctx.fillRect(s[0] * W, yy, 1.6 * s[2], 6 * s[2]); }
      var m = W * 0.06, gw = (W - 2 * m) / 2, gh = H * 0.15;
      S.rows.forEach(function (r) { gate(m, r.y, gw, gh, r.l, r, "l"); gate(m + gw, r.y, gw, gh, r.r, r, "r"); post(m, r.y, gh); post(m + gw, r.y, gh); post(m + 2 * gw, r.y, gh); });
      var by = H * 0.58;
      S.parts.forEach(function (p) { ctx.globalAlpha = Math.max(0, p.a); ctx.fillStyle = p.g ? "#7dffa0" : "#ff4f7a"; ctx.fillRect(p.x - 2.5, p.y - 2.5, 5, 5); }); ctx.globalAlpha = 1;
      if (S.flash > 0) { ctx.globalAlpha = S.flash * 0.6; var fg = ctx.createRadialGradient(S.bx, by, 4, S.bx, by, BR * 3); fg.addColorStop(0, S.flashG ? "rgba(57,255,106,.9)" : "rgba(255,40,90,.9)"); fg.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = fg; ctx.fillRect(S.bx - BR * 3, by - BR * 3, BR * 6, BR * 6); ctx.globalAlpha = 1; }
      ctx.save(); ctx.translate(S.bx, by); ctx.rotate(S.rot); var bd = ballImg.width / 2; ctx.drawImage(ballImg, -bd / 2, -bd / 2, bd, bd); ctx.restore();
      var txt = bigFmt(S.shown), ny = by + BR + H * 0.09;
      ctx.font = "900 " + Math.round(W * 0.085) + "px " + FONT; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      var tw = ctx.measureText(txt).width + 34;
      ctx.shadowColor = "#39ff6a"; ctx.shadowBlur = 26; ctx.fillStyle = "rgba(57,255,106,.55)"; rr(ctx, W / 2 - tw / 2, ny - 26, tw, 52, 26); ctx.fill();
      ctx.shadowBlur = 0; ctx.fillStyle = "rgba(20,90,40,.9)"; rr(ctx, W / 2 - tw / 2 + 3, ny - 23, tw - 6, 46, 23); ctx.fill();
      ctx.lineWidth = 5; ctx.strokeStyle = "#0b4a1d"; ctx.strokeText(txt, W / 2, ny + 1); ctx.fillStyle = "#eafff0"; ctx.shadowColor = "#39ff6a"; ctx.shadowBlur = 10; ctx.fillText(txt, W / 2, ny + 1); ctx.shadowBlur = 0;
      S.pops.forEach(function (p) { ctx.globalAlpha = Math.max(0, p.a); ctx.font = "900 " + Math.round(W * 0.07) + "px " + FONT; ctx.fillStyle = p.g ? "#7dffa0" : "#ff4f7a"; ctx.fillText(p.t, p.x, by - BR - 20 - p.y); }); ctx.globalAlpha = 1;
      var top = 58 + (parseFloat(getComputedStyle(topBar).paddingTop) || 10) - 10;
      var bw = W * 0.46, bx = W / 2 - bw / 2;
      ctx.fillStyle = "rgba(57,255,106,.15)"; rr(ctx, bx, top - 4, bw, 8, 4); ctx.fill();
      ctx.fillStyle = S.time < 10 ? "#ff4f7a" : "#39ff6a"; rr(ctx, bx, top - 4, Math.max(8, bw * S.time / 50), 8, 4); ctx.fill();
      ctx.font = "800 " + Math.round(13 * W / 414) + "px " + FONT; ctx.fillStyle = "rgba(220,255,230,.85)"; ctx.fillText(Math.ceil(S.time) + "s", W / 2, top + 18);
      ctx.textAlign = "right"; ctx.fillText("BEST " + abbr(S.best), W - 14, top - 18);
      if (!S.touched) { ctx.textAlign = "center"; ctx.font = "800 " + Math.round(17 * W / 414) + "px " + FONT; ctx.fillStyle = "rgba(200,255,215," + (0.6 + Math.sin(S.el * 4) * 0.3) + ")"; ctx.fillText("👆 DRAG TO MOVE THE BALL", W / 2, H * 0.9); }
    };
    S.resize(); S.reset();
  }

  /* ---------- menu / open / close ---------- */
  function stats() {
    var r = root.querySelector('[data-s="runner"]'), n = root.querySelector('[data-s="neon"]');
    r.textContent = "Grow your crowd through the gates · Level " + LS.get("rlevel", 1) + " · 🪙 " + LS.get("coins", 0);
    var lp = LS.get("land", null) || {}; root.querySelector('[data-s="land"]').textContent = "3D park adventure · rides, stars & 5 hidden tokens" + (lp.tokens && lp.tokens.length ? " · " + lp.tokens.length + "/5" : "");
    var b = LS.get("nbest", 0); n.textContent = "Multiply your number in 50s" + (b ? " · Best " + abbr(b) : "");
  }
  function stopLand() { landReq++; loadEl.classList.remove("on"); if (land) { try { land.stop(); } catch (e) {} land = null; } cv.style.display = ""; }
  function showMenu() { hidePanel(); stopLand(); setPaused(false); game = null; stopLoop(); stats(); menu.style.display = ""; topBar.style.display = "none"; ctx.clearRect(0, 0, W, H); }
  var land = null, landReq = 0, loadEl = root.querySelector(".ngc-load"), loaded = {};
  function loadScript(src) { return new Promise(function (res, rej) { if (loaded[src]) return res(); var s = document.createElement("script"); s.src = src; s.async = true; s.onload = function () { loaded[src] = 1; res(); }; s.onerror = function () { rej(new Error("load " + src)); }; document.head.appendChild(s); }); }
  var landApi = { LS: LS, sfx: sfx, panel: panel, hidePanel: hidePanel, textNino: function (m) { textNino(m); }, showMenu: function () { showMenu(); } };
  function playLand() {
    menu.style.display = "none"; topBar.style.display = ""; hidePanel(); stopLoop(); game = null; cv.style.display = "none"; loadEl.classList.add("on");
    var my = ++landReq;
    (window.THREE ? Promise.resolve() : loadScript("/vendor/three.min.js?v=160")).then(function () { return window.NinoLand ? null : loadScript("/ninoland.js?v=1"); }).then(function () {
      if (my !== landReq || !root.classList.contains("on")) return;
      try { land = window.NinoLand.start(frame, landApi); } catch (e) { land = null; loadEl.classList.remove("on"); panel({ title: "Nino Land needs 3D", lines: [{ t: "This browser couldn't start 3D graphics. Try Safari or Chrome." }], buttons: [{ label: "Game Center", fn: showMenu }] }); return; }
      loadEl.classList.remove("on");
    }).catch(function () { if (my !== landReq) return; loadEl.classList.remove("on"); panel({ title: "Couldn't load Nino Land", lines: [{ t: "Check your connection and try again." }], buttons: [{ label: "Try again", fn: playLand }, { label: "Game Center", cls: "g", fn: showMenu }] }); });
  }
  function play(which) {
    if (which === "land") return playLand();
    menu.style.display = "none"; topBar.style.display = ""; hidePanel(); resize();
    game = which === "neon" ? new NeonBall() : new Runner(); game.touched = false; setPaused(false); startLoop();
  }
  var prevOverflow = "";
  function open() {
    if (root.classList.contains("on")) return;
    root.classList.add("on"); prevOverflow = document.documentElement.style.overflow; document.documentElement.style.overflow = "hidden";
    resize(); showMenu();
  }
  function close() { showMenu(); root.classList.remove("on"); document.documentElement.style.overflow = prevOverflow; var b = document.getElementById("nw-gc"); if (b) try { b.focus({ preventScroll: true }); } catch (e) {} }
  root.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("[data-a]") : null; if (!t) { if (e.target === root) close(); return; }
    var a = t.getAttribute("data-a");
    if (a === "close") close(); else if (a === "back") showMenu(); else if (a === "runner" || a === "neon" || a === "land") play(a);
    else if (a === "resume") { setPaused(false); if (land) { pausedEl.classList.remove("on"); land.resume(); } }
    else if (a === "snd") { soundOn = !soundOn; LS.set("sound", soundOn); updSnd(); if (soundOn) sfx.good(); }
  });
  document.addEventListener("keydown", function (e) {
    if (!root.classList.contains("on")) return;
    if (e.key === "Escape") { if (game || land) showMenu(); else close(); }
    if (game && (e.key === "ArrowLeft" || e.key === "ArrowRight")) { game.touched = true; game.setX(game.getX() + (e.key === "ArrowLeft" ? -24 : 24)); }
  });
  window.addEventListener("resize", function () { if (root.classList.contains("on")) resize(); });
  window.NinoGames = { open: open, close: close, play: function (w) { open(); play(w); }, _state: function () { return game; }, _land: function () { return land; }, _fmt: { spaced: spaced, abbr: abbr, bigFmt: bigFmt } };
})();

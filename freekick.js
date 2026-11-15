/* Nino Free Kick — canvas 2D. window.NinoFreeKick.start(host, api) */
(function () {
  "use strict";
  var FONT = '-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",Roboto,Helvetica,Arial,sans-serif';
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function ninoBadge(g, x, y, r) {
    g.save(); g.translate(x, y);
    g.fillStyle = "rgba(0,0,0,.3)"; g.beginPath(); g.arc(0, r * 0.08, r * 1.04, 0, 7); g.fill();
    var bg = g.createRadialGradient(0, -r * 0.3, r * 0.1, 0, 0, r); bg.addColorStop(0, "#3d6fe0"); bg.addColorStop(1, "#1b2f86");
    g.fillStyle = bg; g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill();
    g.lineWidth = r * 0.1; g.strokeStyle = "#ffd23f"; g.stroke();
    g.save(); g.beginPath(); g.arc(0, 0, r * 0.95, 0, 7); g.clip();
    g.fillStyle = "#1a1c25"; g.beginPath(); g.ellipse(0, r * 1.05, r * 0.85, r * 0.55, 0, 0, 7); g.fill();
    g.fillStyle = "#7a4b2e"; g.beginPath(); g.ellipse(0, r * 0.12, r * 0.5, r * 0.58, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(-r * 0.5, r * 0.1, r * 0.1, r * 0.15, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(r * 0.5, r * 0.1, r * 0.1, r * 0.15, 0, 0, 7); g.fill();
    g.fillStyle = "#14100c"; g.beginPath(); g.ellipse(0, -r * 0.3, r * 0.5, r * 0.2, 0, Math.PI, 0); g.fill();
    g.fillStyle = "#fff"; [-1, 1].forEach(function (s) { g.beginPath(); g.ellipse(s * r * 0.19, r * 0.03, r * 0.11, r * 0.08, 0, 0, 7); g.fill(); });
    g.fillStyle = "#1a1208"; [-1, 1].forEach(function (s) { g.beginPath(); g.arc(s * r * 0.19, r * 0.04, r * 0.05, 0, 7); g.fill(); });
    g.strokeStyle = "#2a160b"; g.lineWidth = r * 0.06; g.lineCap = "round"; [-1, 1].forEach(function (s) { g.beginPath(); g.moveTo(s * r * 0.28, -r * 0.1); g.lineTo(s * r * 0.1, -r * 0.08); g.stroke(); });
    g.fillStyle = "#2a160b"; g.beginPath(); g.ellipse(0, r * 0.47, r * 0.3, r * 0.17, 0, 0, Math.PI); g.fill();
    g.strokeStyle = "#fff"; g.lineWidth = r * 0.05; g.beginPath(); g.arc(0, r * 0.3, r * 0.17, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke();
    g.restore();
    var cw = r * 0.95, cy = -r * 0.42;
    var cg = g.createLinearGradient(0, cy - r * 0.45, 0, cy); cg.addColorStop(0, "#fff19a"); cg.addColorStop(1, "#e7a300");
    g.fillStyle = cg; g.strokeStyle = "#9a6400"; g.lineWidth = r * 0.04;
    g.beginPath(); g.moveTo(-cw / 2, cy); g.lineTo(-cw / 2, cy - r * 0.28); g.lineTo(-cw / 4, cy - r * 0.14); g.lineTo(0, cy - r * 0.42); g.lineTo(cw / 4, cy - r * 0.14); g.lineTo(cw / 2, cy - r * 0.28); g.lineTo(cw / 2, cy); g.closePath(); g.fill(); g.stroke();
    [["#e53935", 0], ["#1e88e5", -cw * 0.3], ["#1e88e5", cw * 0.3]].forEach(function (j) { g.fillStyle = j[0]; g.beginPath(); g.arc(j[1], cy - r * 0.07, r * 0.06, 0, 7); g.fill(); });
    g.restore();
  }
  function makeBall(r) {
    var c = document.createElement("canvas"), s = 2, d = Math.ceil(r * 2 + 4); c.width = c.height = d * s;
    var g = c.getContext("2d"); g.scale(s, s); var cx = d / 2;
    var gr = g.createRadialGradient(cx - r * 0.35, cx - r * 0.35, r * 0.1, cx, cx, r); gr.addColorStop(0, "#fff"); gr.addColorStop(1, "#cfd4de");
    g.fillStyle = gr; g.beginPath(); g.arc(cx, cx, r, 0, 7); g.fill(); g.strokeStyle = "#333"; g.lineWidth = Math.max(1, r * 0.06); g.stroke();
    g.save(); g.beginPath(); g.arc(cx, cx, r, 0, 7); g.clip(); g.fillStyle = "#1b1f2a";
    function pent(x, y, s2, rot) { g.beginPath(); for (var i = 0; i < 5; i++) { var a = rot + i * Math.PI * 2 / 5; g[i ? "lineTo" : "moveTo"](x + Math.cos(a) * s2, y + Math.sin(a) * s2); } g.closePath(); g.fill(); }
    pent(cx, cx, r * 0.32, -Math.PI / 2); for (var i = 0; i < 5; i++) { var a = -Math.PI / 2 + i * Math.PI * 2 / 5; pent(cx + Math.cos(a) * r * 0.95, cx + Math.sin(a) * r * 0.95, r * 0.3, a + Math.PI / 5); }
    g.restore(); return c;
  }

  function start(host, api) {
    var cvs = document.createElement("canvas"); cvs.setAttribute("aria-label", "Nino Free Kick");
    host.insertBefore(cvs, host.querySelector(".ngc-top"));
    var ctx = cvs.getContext("2d"), W = 390, H = 844, DPR = 1, bgC = null, ballImg = null;
    var Dg = 20, Dw = 9.15, camZ = -6, camH = 2.1, F = 1, HY = 0, GW = 3.66, GH = 2.44;
    function resize() {
      var r = host.getBoundingClientRect(); W = Math.max(280, r.width); H = Math.max(480, r.height); DPR = Math.min(window.devicePixelRatio || 1, 2);
      cvs.width = Math.round(W * DPR); cvs.height = Math.round(H * DPR); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      F = Math.min(W * 2.2, H * 1.05); HY = H * 0.7 - camH * F / (0 - camZ);
      ballImg = makeBall(Math.max(8, 0.11 * F / 6)); buildBg();
    }
    function P(x, y, z) { var d = z - camZ; if (d < 0.3) d = 0.3; var s = F / d; return { x: W / 2 + x * s, y: HY + (camH - y) * s, s: s }; }
    function buildBg() {
      bgC = document.createElement("canvas"); bgC.width = Math.round(W * DPR); bgC.height = Math.round(H * DPR);
      var g = bgC.getContext("2d"); g.scale(DPR, DPR);
      var far = P(0, 0, 44).y, sky = g.createLinearGradient(0, 0, 0, far); sky.addColorStop(0, "#0b1030"); sky.addColorStop(1, "#1a2560");
      g.fillStyle = sky; g.fillRect(0, 0, W, far + 2);
      var top = H * 0.09, rows = 26, cols = ["#ffffff", "#e8ecff", "#5b7cff", "#2f4bd6", "#ff5fa2", "#ffd23f", "#ff7043", "#25f4ee", "#9b5cff", "#ff3b4e"];
      for (var r = 0; r < rows; r++) {
        var y0 = top + (far - top) * r / rows, hh = (far - top) / rows, cw = 4 + r * 0.25;
        g.fillStyle = r % 2 ? "#141a46" : "#18205a"; g.fillRect(0, y0, W, hh);
        for (var x = (r % 2) * cw * 0.5; x < W; x += cw * 1.25) { if (Math.random() < 0.12) continue; g.fillStyle = cols[(Math.random() * cols.length) | 0]; g.globalAlpha = 0.55 + Math.random() * 0.45; g.fillRect(x, y0 + hh * 0.18, cw * 0.8, hh * 0.62); }
        g.globalAlpha = 1;
      }
      g.fillStyle = "#0d1238"; g.fillRect(0, far - 5, W, 6);
      [[0.08, 0.04], [0.92, 0.04]].forEach(function (l) { var gl = g.createRadialGradient(W * l[0], H * l[1], 2, W * l[0], H * l[1], W * 0.5); gl.addColorStop(0, "rgba(255,255,240,.85)"); gl.addColorStop(0.15, "rgba(255,255,230,.25)"); gl.addColorStop(1, "rgba(255,255,230,0)"); g.fillStyle = gl; g.fillRect(0, 0, W, H * 0.6); });
      // pitch stripes
      for (var z = 44; z > camZ + 0.4; z -= 4) {
        var a = P(0, 0, z).y, b = P(0, 0, Math.max(camZ + 0.4, z - 4)).y;
        g.fillStyle = (Math.round(z / 4) % 2) ? "#2e9e45" : "#35ac4d"; g.fillRect(0, a, W, b - a + 1);
      }
      g.strokeStyle = "rgba(255,255,255,.9)"; g.lineWidth = 2;
      function line(x1, z1, x2, z2) { var a = P(x1, 0, z1), b = P(x2, 0, z2); g.lineWidth = Math.max(1.2, 0.12 * (a.s + b.s) / 2); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); }
      line(-40, Dg, 40, Dg); line(-9.16, Dg - 5.5, 9.16, Dg - 5.5); line(-9.16, Dg, -9.16, Dg - 5.5); line(9.16, Dg, 9.16, Dg - 5.5);
      line(-20.16, Dg - 16.5, 20.16, Dg - 16.5); line(-20.16, Dg, -20.16, Dg - 16.5); line(20.16, Dg, 20.16, Dg - 16.5);
      g.beginPath(); for (var i = 0; i <= 24; i++) { var an = Math.PI * (0.2 + 0.6 * i / 24), p = P(Math.cos(an) * 9.15, 0, Dg - 11 - Math.sin(an) * 9.15); if (Dg - 11 - Math.sin(an) * 9.15 > Dg - 16.5) continue; i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y); } g.stroke();
      var vg = g.createRadialGradient(W / 2, H * 0.55, H * 0.25, W / 2, H * 0.55, H * 0.8); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,20,.35)"); g.fillStyle = vg; g.fillRect(0, 0, W, H);
    }

    /* ---------- state ---------- */
    var best = api.LS.get("fkbest", 0);
    var S = { level: 1, score: 0, balls: 3, phase: "aim", t: 0 };
    var ball, keeper, wall, target, msg = null, parts = [], trail = [], swipe = null, net = 0, netX = 0, netY = 0, crowdJump = 0, hintT = 0, touched = false;
    function setupLevel() {
      var L = S.level;
      ball = { x: clamp((Math.random() - 0.5) * (L > 2 ? 2.2 : 1.2), -1.1, 1.1), y: 0.11, z: 0, vx: 0, vy: 0, vz: 0, fly: false, t: 0, spin: 0, done: false, rot: 0 };
      var n = L < 3 ? 3 : L < 6 ? 4 : 5;
      var wx = ball.x * 0.55 + (ball.x > 0 ? -0.6 : 0.6);
      wall = { n: n, base: wx, x: wx, amp: L >= 3 ? Math.min(1.6, 0.5 + L * 0.12) : 0, sp: 0.9 + L * 0.12, jump: 0, jt: 0, jumps: L >= 4 };
      keeper = { x: 0, y: 0, base: 0, dive: 0, dir: 0, react: Math.max(0.12, 0.34 - L * 0.025), speed: 3.6 + L * 0.45, patrol: L >= 2 ? Math.min(1.8, 0.6 + L * 0.15) : 0.3, tx: 0, ang: 0, armUp: 0 };
      target = L >= 2 ? { x: (Math.random() < 0.5 ? -1 : 1) * (2.2 + Math.random() * 1), y: 1.5 + Math.random() * 0.6, r: 0.55, hit: false } : null;
      trail = []; S.phase = "aim"; S.t = 0;
    }
    setupLevel();

    /* ---------- input ---------- */
    function pt(e) { var r = cvs.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() }; }
    function down(e) { if (S.phase !== "aim" || pan()) return; swipe = [pt(e)]; try { cvs.setPointerCapture(e.pointerId); } catch (_) {} e.preventDefault(); }
    function move(e) { if (!swipe) return; var p = pt(e), l = swipe[swipe.length - 1]; if (Math.hypot(p.x - l.x, p.y - l.y) > 4) swipe.push(p); e.preventDefault(); }
    function up(e) { if (!swipe) return; var s = swipe; swipe = null; move(e); if (s.length >= 2) shoot(s); }
    cvs.addEventListener("pointerdown", down); cvs.addEventListener("pointermove", move); cvs.addEventListener("pointerup", up); cvs.addEventListener("pointercancel", function () { swipe = null; });
    function pan() { var p = host.querySelector(".ngc-pan"); return p && p.classList.contains("on"); }

    function shoot(s) {
      var a = s[0], b = s[s.length - 1], dx = b.x - a.x, dy = a.y - b.y, len = Math.hypot(dx, dy);
      if (dy < H * 0.05 || len < H * 0.06) return;
      var dur = Math.max(60, b.t - a.t), spd = len / dur * 1000;
      var nx = -dy / len, ny = -dx / len, dev = 0, n = 0;
      for (var i = 1; i < s.length - 1; i++) { var d = (s[i].x - a.x) * (dy / len) - (a.y - s[i].y) * (dx / len); if (Math.abs(d) > Math.abs(dev)) dev = d; n++; }
      var aimX = ball.x + dx / (W * 0.45) * 4.2;
      var aimY = clamp((dy - H * 0.08) / (H * 0.42) * 2.4, 0.15, 3.6);
      var bow = clamp(dev / W * 9, -3.2, 3.2);
      var T = clamp(1.25 - spd / 3200, 0.55, 1.15);
      ball.fly = true; ball.t = 0; ball.T = T; ball.x0 = ball.x; ball.aimX = aimX; ball.aimY = aimY; ball.bow = bow; ball.z0 = 0;
      ball.vy0 = (aimY - 0.11 + 4.9 * T * T) / T;
      S.phase = "fly"; touched = true; api.sfx.good();
      keeper.predict = aimX + bow * 0.0; keeper.kt = 0;
      if (wall.jumps) wall.jt = 0.001;
    }

    /* ---------- update ---------- */
    function say(text, color, sub) { msg = { t: text, c: color, s: sub, a: 0 }; }
    function confetti() { var cols = ["#ffd23f", "#ff3b4e", "#25f4ee", "#ffffff", "#7b2ff7", "#43e05f"]; for (var i = 0; i < 90; i++) parts.push({ x: W / 2 + (Math.random() - 0.5) * W * 0.3, y: H * 0.35, vx: (Math.random() - 0.5) * W * 1.6, vy: -Math.random() * H * 1.1 - H * 0.2, c: cols[i % cols.length], a: 1, r: Math.random() * 6, w: 4 + Math.random() * 5 }); }
    function finish(kind) {
      S.phase = "result"; S.t = 0;
      if (kind === "goal") {
        var pts = 100 + (target && target.hit ? 50 : 0) + (Math.abs(ball.bow) > 1 ? 25 : 0) + (S.level - 1) * 10;
        S.score += pts; S.res = "goal"; say("GOAL!", "#ffd23f", "+" + pts + (target && target.hit ? "  🎯 target!" : "") + (Math.abs(ball.bow) > 1 ? "  🌀 curl!" : ""));
        confetti(); crowdJump = 1.6; api.sfx.win();
      } else {
        S.balls--; S.res = kind; api.sfx.bad();
        say(kind === "save" ? "SAVED!" : kind === "wall" ? "BLOCKED!" : kind === "post" ? "OFF THE POST!" : "MISSED!", "#ffffff", S.balls > 0 ? S.balls + (S.balls === 1 ? " ball left" : " balls left") : "");
      }
    }
    function update(dt) {
      S.t += dt; hintT += dt;
      var L = S.level;
      if (wall.amp) wall.x = wall.base + Math.sin(hintT * wall.sp) * wall.amp;
      if (wall.jt > 0) { wall.jt += dt; wall.jump = Math.max(0, Math.sin(Math.min(1, (wall.jt - 0.12) / 0.55) * Math.PI)) * 0.45; if (wall.jt > 0.8) wall.jt = 0; }
      if (S.phase === "aim") { keeper.x = keeper.base + Math.sin(hintT * (0.9 + L * 0.1)) * keeper.patrol; keeper.dive = 0; keeper.ang *= 0.8; }
      if (S.phase === "fly") {
        keeper.kt += dt;
        if (keeper.kt > keeper.react) {
          var tx = clamp(ball.aimX, -GW + 0.4, GW - 0.4), d = tx - keeper.x, st = keeper.speed * dt;
          keeper.x += clamp(d, -st, st); keeper.dir = Math.sign(d) || keeper.dir;
          keeper.dive = Math.min(1, keeper.dive + dt * 4 * (Math.abs(d) > 0.6 ? 1 : 0.3)); keeper.ang = keeper.dir * keeper.dive * 1.15;
          keeper.armUp = ball.aimY > 1.7 ? 1 : 0;
        }
        var b = ball; b.t += dt; var u = b.t / b.T, prevZ = b.z;
        if (!b.done) {
          b.x = b.x0 + (b.aimX - b.x0) * u + b.bow * 4 * u * (1 - u);
          b.y = 0.11 + b.vy0 * b.t - 4.9 * b.t * b.t; b.z = Dg * u; b.rot += dt * 14;
          if (b.y < 0.11) b.y = 0.11;
          trail.push({ x: b.x, y: b.y, z: b.z }); if (trail.length > 22) trail.shift();
          if (prevZ < Dw && b.z >= Dw) {
            for (var i = 0; i < wall.n; i++) { var px = wall.x + (i - (wall.n - 1) / 2) * 0.56; if (Math.abs(b.x - px) < 0.36 && b.y < 1.85 + wall.jump + 0.1) { b.done = "wall"; b.vz = -6; b.vx = (b.x - px) * 6; b.vy = 2; break; } }
          }
          if (!b.done && prevZ < Dg - 0.4 && b.z >= Dg - 0.4) {
            var kx = keeper.x, dxk = b.x - kx, reachX = 0.45 + keeper.dive * 0.95, reachY = 2.15 + keeper.armUp * 0.25 - keeper.dive * 0.55;
            var inside = (keeper.dive > 0.5 ? (dxk * keeper.dir > -0.35 && Math.abs(dxk) < reachX) : Math.abs(dxk) < 0.5);
            if (inside && b.y < reachY) { b.done = "save"; b.vz = -5; b.vx = keeper.dir * 3; b.vy = 3; }
          }
          if (!b.done && prevZ < Dg && b.z >= Dg) {
            var ax = Math.abs(b.x);
            if ((Math.abs(ax - GW) < 0.17 && b.y < GH + 0.1) || (Math.abs(b.y - GH) < 0.15 && ax < GW + 0.1)) { b.done = "post"; b.vz = -7; b.vx = (b.x > 0 ? 1 : -1) * 2; b.vy = 2; }
            else if (ax < GW - 0.11 && b.y < GH - 0.11) { b.done = "goal"; netX = b.x; netY = b.y; net = 1; b.vz = 6; b.vx = 0; b.vy = 0; if (target && Math.hypot(b.x - target.x, b.y - target.y) < target.r + 0.15) target.hit = true; }
            else b.done = "miss", b.vz = 12, b.vx = (b.x - b.x0) / b.T, b.vy = b.vy0 - 9.8 * b.t;
          }
          if (!b.done && b.t > b.T * 1.6) b.done = "miss";
          if (b.done) { finish(b.done); }
        }
      }
      if ((S.phase === "result") && ball.done) {
        var b2 = ball; if (b2.done === "goal") { b2.z = Math.min(Dg + 1.6, b2.z + b2.vz * dt); b2.vz *= 0.86; b2.y = Math.max(0.11, b2.y - dt * 1.5); }
        else { b2.x += (b2.vx || 0) * dt; b2.z += (b2.vz || 0) * dt; b2.vy = (b2.vy || 0) - 9.8 * dt; b2.y = Math.max(0.11, b2.y + b2.vy * dt); if (b2.y <= 0.11) b2.vy = -b2.vy * 0.4; }
        b2.rot += dt * 6;
        if (S.t > 1.9) {
          if (S.res === "goal") { S.level++; setupLevel(); }
          else if (S.balls <= 0) gameOver();
          else { var lv = S.level; setupLevel(); }
          msg = null;
        }
      }
      net *= Math.pow(0.08, dt); crowdJump = Math.max(0, crowdJump - dt);
      for (var k = parts.length - 1; k >= 0; k--) { var p = parts[k]; p.vy += H * 1.4 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.985; p.r += dt * 8; p.a -= dt * 0.45; if (p.a <= 0 || p.y > H + 20) parts.splice(k, 1); }
      if (msg) msg.a = Math.min(1, msg.a + dt * 5);
    }
    function gameOver() {
      S.phase = "over"; var nb = S.score > best; if (nb) { best = S.score; api.LS.set("fkbest", best); }
      var sc = S.score, lv = S.level;
      api.panel({ title: nb && sc > 0 ? "New best! 🏆" : "Full time! ⚽", lines: [{ t: "Level " + lv }, { t: sc + " pts", big: true }, { t: "Best: " + best }],
        buttons: [{ label: "Play again", fn: function () { api.hidePanel(); S.level = 1; S.score = 0; S.balls = 3; setupLevel(); } },
          { label: "💬 Text Nino my score", cls: "t", fn: function () { api.textNino("I scored " + sc + " points in Nino Free Kick ⚽ (level " + lv + ")"); } },
          { label: "Game Center", cls: "g", fn: api.showMenu }] });
    }

    /* ---------- draw ---------- */
    function person(x, z, kind, lift, ang, armUp) {
      var base = P(x, 0, z), s = base.s, jy = (lift || 0);
      ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.beginPath(); ctx.ellipse(base.x, base.y, 0.42 * s, 0.1 * s, 0, 0, 7); ctx.fill();
      var p = P(x, jy, z); ctx.save(); ctx.translate(p.x, p.y);
      if (ang) { ctx.translate(0, -0.9 * s); ctx.rotate(ang); ctx.translate(0, 0.9 * s); }
      var keeper = kind === "k", shirt = keeper ? "#ff7a1a" : "#2f5fe0", shirt2 = keeper ? "#ff9a3c" : "#3d72f5", leg = keeper ? "#15161c" : "#141a3a";
      ctx.fillStyle = leg; rr(ctx, -0.2 * s, -0.95 * s, 0.17 * s, 0.95 * s, 0.05 * s); ctx.fill(); rr(ctx, 0.03 * s, -0.95 * s, 0.17 * s, 0.95 * s, 0.05 * s); ctx.fill();
      ctx.fillStyle = keeper ? "#ffd23f" : "#ffffff"; ctx.fillRect(-0.21 * s, -0.08 * s, 0.19 * s, 0.08 * s); ctx.fillRect(0.02 * s, -0.08 * s, 0.19 * s, 0.08 * s);
      var g = ctx.createLinearGradient(-0.3 * s, 0, 0.3 * s, 0); g.addColorStop(0, shirt); g.addColorStop(0.5, shirt2); g.addColorStop(1, shirt);
      ctx.fillStyle = g; rr(ctx, -0.27 * s, -1.6 * s, 0.54 * s, 0.72 * s, 0.1 * s); ctx.fill();
      if (!keeper) { ctx.fillStyle = "#fff"; ctx.fillRect(-0.27 * s, -1.22 * s, 0.54 * s, 0.06 * s); }
      else { ctx.fillStyle = "#15161c"; ctx.fillRect(-0.27 * s, -0.98 * s, 0.54 * s, 0.14 * s); }
      var skin = "#c98a5e";
      if (keeper) {
        ctx.strokeStyle = shirt; ctx.lineWidth = 0.13 * s; ctx.lineCap = "round";
        var up = armUp ? 1 : 0.55;
        [-1, 1].forEach(function (sd) { ctx.beginPath(); ctx.moveTo(sd * 0.22 * s, -1.5 * s); ctx.lineTo(sd * 0.5 * s, (-1.5 - 0.45 * up) * s); ctx.stroke(); ctx.fillStyle = "#ffd23f"; ctx.beginPath(); ctx.arc(sd * 0.53 * s, (-1.53 - 0.47 * up) * s, 0.1 * s, 0, 7); ctx.fill(); });
      } else {
        ctx.fillStyle = skin; ctx.beginPath(); ctx.ellipse(-0.06 * s, -1.0 * s, 0.09 * s, 0.07 * s, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(0.06 * s, -1.0 * s, 0.09 * s, 0.07 * s, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = shirt; ctx.lineWidth = 0.12 * s; ctx.lineCap = "round"; [-1, 1].forEach(function (sd) { ctx.beginPath(); ctx.moveTo(sd * 0.24 * s, -1.5 * s); ctx.lineTo(sd * 0.1 * s, -1.05 * s); ctx.stroke(); });
      }
      ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(0, -1.75 * s, 0.14 * s, 0, 7); ctx.fill();
      ctx.fillStyle = "#1c120c"; ctx.beginPath(); ctx.arc(0, -1.79 * s, 0.145 * s, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
      ctx.restore();
    }
    function drawGoal(front) {
      var bz = Dg + 1.8;
      if (!front) {
        ctx.strokeStyle = "rgba(255,255,255,.5)"; ctx.lineWidth = 1;
        function bp(x, y) { var d = net > 0.02 ? Math.exp(-((x - netX) * (x - netX) + (y - netY) * (y - netY)) / 0.6) * net * 0.9 : 0; return P(x, y * (1.6 / GH) + (GH - 1.6) * 0, bz + d); }
        for (var x = -GW; x <= GW + 0.01; x += 0.3) { ctx.beginPath(); for (var y = 0; y <= GH + 0.01; y += 0.3) { var q = bp(x, Math.min(y, GH) * 1); y ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); } ctx.stroke(); }
        for (var y2 = 0; y2 <= GH + 0.01; y2 += 0.3) { ctx.beginPath(); for (var x2 = -GW; x2 <= GW + 0.01; x2 += 0.3) { var q2 = bp(x2, y2); x2 > -GW ? ctx.lineTo(q2.x, q2.y) : ctx.moveTo(q2.x, q2.y); } ctx.stroke(); }
        for (var z = Dg; z <= bz + 0.01; z += 0.3) { var t1 = P(-GW, GH - (z - Dg) / 1.8 * (GH - 1.6), z), t2 = P(GW, GH - (z - Dg) / 1.8 * (GH - 1.6), z); ctx.beginPath(); ctx.moveTo(t1.x, t1.y); ctx.lineTo(t2.x, t2.y); ctx.stroke(); [-GW, GW].forEach(function (sx) { var a = P(sx, 0, z), b = P(sx, GH - (z - Dg) / 1.8 * (GH - 1.6), z); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }); }
        if (target && !target.hit) {
          var tc = P(target.x, target.y, Dg + 0.05), tr = target.r * tc.s;
          ctx.lineWidth = Math.max(2, 0.07 * tc.s); [1, 0.66, 0.33].forEach(function (k, i) { ctx.strokeStyle = i % 2 ? "#ffffff" : "#ff3b4e"; ctx.beginPath(); ctx.arc(tc.x, tc.y, tr * k, 0, 7); ctx.stroke(); });
          ctx.fillStyle = "#ffd23f"; ctx.font = "800 " + Math.round(0.28 * tc.s) + "px " + FONT; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("+50", tc.x, tc.y - tr - 0.2 * tc.s);
        }
        return;
      }
      var a1 = P(-GW, 0, Dg), a2 = P(-GW, GH, Dg), b2 = P(GW, GH, Dg), b1 = P(GW, 0, Dg);
      ctx.strokeStyle = "#ffffff"; ctx.lineWidth = Math.max(3, 0.12 * a1.s); ctx.lineJoin = "round"; ctx.lineCap = "round";
      ctx.shadowColor = "rgba(0,0,0,.35)"; ctx.shadowBlur = 4; ctx.beginPath(); ctx.moveTo(a1.x, a1.y); ctx.lineTo(a2.x, a2.y); ctx.lineTo(b2.x, b2.y); ctx.lineTo(b1.x, b1.y); ctx.stroke(); ctx.shadowBlur = 0;
    }
    function drawBall() {
      var b = ball, g0 = P(b.x, 0, b.z), p = P(b.x, b.y, b.z), r = 0.11 * p.s;
      ctx.fillStyle = "rgba(0,0,0," + clamp(0.3 - b.y * 0.05, 0.08, 0.3) + ")"; ctx.beginPath(); ctx.ellipse(g0.x, g0.y, r * 1.1, r * 0.35, 0, 0, 7); ctx.fill();
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(b.rot); ctx.drawImage(ballImg, -r - 1, -r - 1, 2 * r + 2, 2 * r + 2); ctx.restore();
    }
    function draw() {
      if (!bgC) resize();
      ctx.drawImage(bgC, 0, 0, W, H);
      if (crowdJump > 0) { var far = P(0, 0, 44).y; ctx.fillStyle = "rgba(255,255,255,.9)"; for (var i = 0; i < 40; i++) ctx.fillRect(Math.random() * W, H * 0.09 + Math.random() * (far - H * 0.09), 2, 2); }
      var sp = P(ball.x, 0, 0);
      ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.beginPath(); ctx.ellipse(sp.x, sp.y, 0.3 * sp.s, 0.09 * sp.s, 0, 0, 7); ctx.fill();
      drawGoal(false);
      if (ball.z >= Dg - 0.4) drawBall();
      person(keeper.x, Dg - 0.4, "k", keeper.dive * 0.35, keeper.ang, keeper.armUp);
      drawGoal(true);
      if (ball.z >= Dw && ball.z < Dg - 0.4) drawBall();
      for (var w = 0; w < wall.n; w++) person(wall.x + (w - (wall.n - 1) / 2) * 0.56, Dw, "d", wall.jump, 0);
      ctx.fillStyle = "rgba(255,255,255,.55)";
      for (var k = 0; k < trail.length; k += 2) { var tp = P(trail[k].x, trail[k].y, trail[k].z); ctx.globalAlpha = k / trail.length * 0.5; ctx.beginPath(); ctx.arc(tp.x, tp.y, 0.06 * tp.s, 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1;
      if (ball.z < Dw) drawBall();
      if (swipe && swipe.length) { ctx.fillStyle = "rgba(120,230,120,.55)"; for (var q = 0; q < swipe.length; q++) { ctx.beginPath(); ctx.arc(swipe[q].x, swipe[q].y, 10 + (q % 3) * 3, 0, 7); ctx.fill(); } }
      parts.forEach(function (p) { ctx.globalAlpha = Math.max(0, p.a); ctx.fillStyle = p.c; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillRect(-p.w / 2, -p.w * 0.3, p.w, p.w * 0.6); ctx.restore(); }); ctx.globalAlpha = 1;
      // HUD
      var top = (parseFloat(getComputedStyle(host.querySelector(".ngc-top")).paddingTop) || 10) + 46;
      ctx.fillStyle = "rgba(10,14,40,.62)"; rr(ctx, 12, top, 124, 62, 16); ctx.fill();
      ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; ctx.fillStyle = "#9fb4ff"; ctx.font = "800 13px " + FONT; ctx.fillText("LEVEL " + S.level, 24, top + 21);
      ctx.fillStyle = "#fff"; ctx.font = "900 28px " + FONT; ctx.fillText(String(S.score), 24, top + 52);
      var bw = 3 * 30 + 16; ctx.fillStyle = "rgba(10,14,40,.62)"; rr(ctx, W - bw - 12, top, bw, 44, 16); ctx.fill();
      for (var bi = 0; bi < 3; bi++) { ctx.globalAlpha = bi < S.balls ? 1 : 0.22; ctx.drawImage(ballImg, W - bw - 4 + bi * 30, top + 8, 26, 26); } ctx.globalAlpha = 1;
      ctx.textAlign = "right"; ctx.font = "700 11px " + FONT; ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.fillText("BEST " + best, W - 16, top + 60);
      ninoBadge(ctx, 52, H - 56 - (parseFloat(getComputedStyle(host).paddingBottom) || 0), 34);
      if (!touched) { ctx.textAlign = "center"; ctx.font = "800 15px " + FONT; ctx.fillStyle = "rgba(255,255,255," + (0.65 + Math.sin(hintT * 4) * 0.3) + ")"; ctx.fillText("👆 Swipe up to shoot", W / 2, H * 0.86); ctx.font = "700 12px " + FONT; ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.fillText("Curve your swipe to bend it around the wall", W / 2, H * 0.86 + 20); }
      if (msg) {
        var sc = msg.a < 1 ? 0.6 + 0.6 * Math.sin(msg.a * Math.PI * 0.5) * 1.1 : 1 + Math.sin(S.t * 8) * 0.03;
        ctx.save(); ctx.translate(W / 2, H * 0.4); ctx.scale(sc, sc); ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.font = "900 " + Math.round(W * 0.15) + "px " + FONT; ctx.lineJoin = "round"; ctx.lineWidth = 10; ctx.strokeStyle = msg.c === "#ffd23f" ? "#b0300a" : "#1b2f86"; ctx.strokeText(msg.t, 0, 0); ctx.fillStyle = msg.c; ctx.fillText(msg.t, 0, 0);
        if (msg.s) { ctx.font = "800 18px " + FONT; ctx.lineWidth = 5; ctx.strokeStyle = "rgba(0,0,0,.6)"; ctx.strokeText(msg.s, 0, W * 0.1); ctx.fillStyle = "#fff"; ctx.fillText(msg.s, 0, W * 0.1); }
        ctx.restore();
      }
    }

    /* ---------- loop ---------- */
    var raf = 0, last = 0, running = false;
    function frame(ts) { raf = requestAnimationFrame(frame); var dt = Math.min(0.05, Math.max(0, (ts - last) / 1000)); last = ts; update(dt); draw(); }
    function resume() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
    function pause() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; swipe = null; }
    window.addEventListener("resize", resize); resize(); resume();
    function stop() { pause(); window.removeEventListener("resize", resize); if (cvs.parentNode) cvs.parentNode.removeChild(cvs); bgC = null; }
    return { stop: stop, pause: pause, resume: resume, _dbg: function () { return { level: S.level, score: S.score, balls: S.balls, phase: S.phase, res: S.res, ball: { x: +ball.x.toFixed(2), y: +ball.y.toFixed(2), z: +ball.z.toFixed(2) }, keeper: +keeper.x.toFixed(2), wall: +wall.x.toFixed(2) }; } };
  }
  window.NinoFreeKick = { start: start };
})();

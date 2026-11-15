/* Nino Hill Climb — canvas 2D side-scroller. window.NinoHillClimb.start(host, api) */
(function () {
  "use strict";
  var FONT = '-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",Roboto,Helvetica,Arial,sans-serif';
  var BIG = '"Arial Rounded MT Bold","Arial Black",-apple-system,Helvetica,Arial,sans-serif';
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function sstep(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function hash(n) { var s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function terrain(x) {
    if (x < 0) return 0;
    var d = clamp(x / 1400, 0, 1), k = sstep(0, 45, x);
    return k * (Math.sin(x * 0.045) * 4 * (0.6 + d) + Math.sin(x * 0.11 + 1.3) * 1.9 * (0.5 + d) + Math.sin(x * 0.27 + 0.4) * 0.55 * (0.3 + d * 1.3) + (Math.sin(x * 0.011 - 1.57) + 1) * 6);
  }
  function slope(x) { return (terrain(x + 0.05) - terrain(x - 0.05)) / 0.1; }

  function start(host, api) {
    var cvs = document.createElement("canvas"); cvs.setAttribute("aria-label", "Nino Hill Climb");
    host.insertBefore(cvs, host.querySelector(".ngc-top"));
    var ctx = cvs.getContext("2d"), W = 390, H = 844, DPR = 1, S = 32;
    function resize() { var r = host.getBoundingClientRect(); W = Math.max(280, r.width); H = Math.max(480, r.height); DPR = Math.min(window.devicePixelRatio || 1, 2); cvs.width = Math.round(W * DPR); cvs.height = Math.round(H * DPR); ctx.setTransform(DPR, 0, 0, DPR, 0, 0); S = W / 12; }

    /* ---------- pedals (DOM) ---------- */
    var ui = document.createElement("div"); ui.className = "hc-ui";
    ui.innerHTML = '<style>.hc-ui{position:absolute;inset:0;z-index:4;pointer-events:none}' +
      '.hc-p{position:absolute;bottom:calc(env(safe-area-inset-bottom,0px) + 16px);pointer-events:auto;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;display:flex;flex-direction:column;align-items:center;cursor:pointer}' +
      '.hc-p.b{left:16px}.hc-p.g{right:16px}' +
      '.hc-plate{position:relative;border-radius:14px;background:linear-gradient(160deg,#fbfcfd 0%,#d9dee6 45%,#aab2be 100%);box-shadow:inset 0 2px 0 #fff,inset 0 -3px 0 rgba(0,0,0,.18),0 0 0 2.5px #2d3138,0 8px 14px rgba(0,0,0,.35);display:grid;align-content:start;justify-content:center;gap:9px;padding:14px 14px 0;transition:transform .08s}' +
      '.hc-p.b .hc-plate{width:132px;height:112px;grid-template-columns:repeat(3,26px)}.hc-p.g .hc-plate{width:84px;height:120px;grid-template-columns:repeat(2,24px)}' +
      '.hc-h{width:26px;height:26px;border-radius:50%;background:radial-gradient(circle at 50% 35%,#2a2e35,#55606e 70%,#8d96a3);box-shadow:inset 0 2px 3px rgba(0,0,0,.6)}.hc-p.g .hc-h{width:24px;height:24px}' +
      '.hc-l{position:absolute;left:0;right:0;bottom:12px;text-align:center;font:900 17px -apple-system,Helvetica,Arial,sans-serif;color:#2d3138;letter-spacing:.03em;text-shadow:0 1px 0 #fff}' +
      '.hc-stem{width:22px;height:30px;background:linear-gradient(90deg,#8a929e,#f2f4f7 45%,#7d8592);box-shadow:0 0 0 2px #2d3138}' +
      '.hc-base{width:84px;height:12px;border-radius:50%;background:linear-gradient(#e8ebef,#9aa2ae);box-shadow:0 0 0 2px #2d3138,0 4px 8px rgba(0,0,0,.3);margin-top:-2px}' +
      '.hc-p.on .hc-plate{transform:translateY(5px) scale(.97);filter:brightness(.92)}</style>' +
      '<div class="hc-p b" data-p="brake" aria-label="Brake" role="button"><div class="hc-plate"><i class="hc-h"></i><i class="hc-h"></i><i class="hc-h"></i><i class="hc-h"></i><i class="hc-h"></i><i class="hc-h"></i><span class="hc-l">BRAKE</span></div><div class="hc-stem"></div><div class="hc-base"></div></div>' +
      '<div class="hc-p g" data-p="gas" aria-label="Gas" role="button"><div class="hc-plate"><i class="hc-h"></i><i class="hc-h"></i><i class="hc-h"></i><i class="hc-h"></i><span class="hc-l">GAS</span></div><div class="hc-stem"></div><div class="hc-base"></div></div>';
    host.insertBefore(ui, host.querySelector(".ngc-top"));
    var inp = { gas: false, brake: false, kg: false, kb: false }, touched = false;
    [].forEach.call(ui.querySelectorAll(".hc-p"), function (el) {
      var k = el.getAttribute("data-p"), ids = {};
      function on(e) { ids[e.pointerId] = 1; inp[k] = true; el.classList.add("on"); touched = true; try { el.setPointerCapture(e.pointerId); } catch (_) {} e.preventDefault(); e.stopPropagation(); }
      function off(e) { delete ids[e.pointerId]; if (!Object.keys(ids).length) { inp[k] = false; el.classList.remove("on"); } }
      el.addEventListener("pointerdown", on); el.addEventListener("pointerup", off); el.addEventListener("pointercancel", off); el.addEventListener("lostpointercapture", off);
      el.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    });
    function kd(e) { var k = (e.key || "").toLowerCase(), hit = true; if (k === "arrowright" || k === "arrowup" || k === "d" || k === "w") inp.kg = true; else if (k === "arrowleft" || k === "arrowdown" || k === "a" || k === "s") inp.kb = true; else hit = false; if (hit) { touched = true; e.preventDefault(); e.stopPropagation(); } }
    function ku(e) { var k = (e.key || "").toLowerCase(); if (k === "arrowright" || k === "arrowup" || k === "d" || k === "w") inp.kg = false; if (k === "arrowleft" || k === "arrowdown" || k === "a" || k === "s") inp.kb = false; }
    window.addEventListener("keydown", kd, true); window.addEventListener("keyup", ku, true);

    /* ---------- state ---------- */
    var best = api.LS.get("hcbest", 0), bank = api.LS.get("hccoins", 0);
    var nfT = 0, car, items, nextCoinX, nextFuelX, puffs, over, coins, fuel, dist, crashT, lowT, camX, camY, wrot, msgT, msg, sparkle;
    var WH = [[-1.15, -0.55], [1.15, -0.55]], WR = 0.48, HULL = [[-1.6, -0.25], [1.65, -0.2], [1.5, 0.45], [-1.6, 0.55], [-0.4, 1.35], [0.3, 1.3]];
    function reset() {
      car = { x: 2, y: terrain(2) + 1.1, a: 0, vx: 0, vy: 0, w: 0, contact: [false, false], air: 0 };
      items = []; nextCoinX = 14; nextFuelX = 110; puffs = []; over = false; coins = 0; fuel = 100; dist = 0; crashT = 0; lowT = 0; nfT = 0; camX = car.x; camY = car.y; wrot = 0; msgT = 0; msg = null; sparkle = [];
      spawn();
    }
    function spawn() {
      var ahead = car.x + 80;
      while (nextCoinX < ahead) {
        var n = 5 + Math.floor(hash(nextCoinX) * 4);
        for (var i = 0; i < n; i++) { var x = nextCoinX + i * 1.35; items.push({ k: "c", x: x, y: terrain(x) + 1.25, v: (Math.floor(nextCoinX) % 5 === 0) ? 5 : 1, got: false }); }
        nextCoinX += n * 1.35 + 14 + hash(nextCoinX + 3) * 18;
      }
      while (nextFuelX < ahead) { items.push({ k: "f", x: nextFuelX, y: terrain(nextFuelX) + 1.0, got: false }); nextFuelX += 130 + Math.min(160, nextFuelX * 0.08) + hash(nextFuelX) * 40; }
      items = items.filter(function (it) { return it.x > car.x - 30 && !it.got; });
    }
    reset();

    /* ---------- physics ---------- */
    function toWorld(p) { var c = Math.cos(car.a), s = Math.sin(car.a); return [car.x + p[0] * c - p[1] * s, car.y + p[0] * s + p[1] * c]; }
    function step(dt) {
      var gas = (inp.gas || inp.kg) && fuel > 0 && !over, brake = (inp.brake || inp.kb) && !over;
      var fx = 0, fy = -9.8, tq = 0, any = false;
      function contact(px, py, r, drive, idx) {
        var m = slope(px), ln = Math.sqrt(1 + m * m), nx = -m / ln, ny = 1 / ln, d = (py - terrain(px)) / ln, pen = r - d;
        if (idx != null) car.contact[idx] = pen > -0.02;
        if (pen <= 0) return;
        var cx = px - nx * r, cy = py - ny * r, rx = cx - car.x, ry = cy - car.y;
        var vpx = car.vx - car.w * ry, vpy = car.vy + car.w * rx, vn = vpx * nx + vpy * ny, tx = ny, ty = -nx, vt = vpx * tx + vpy * ty;
        var Fn = Math.max(0, 170 * pen - 13 * vn), Ft;
        if (drive) {
          var mu = 0.95 * Fn;
          if (gas) Ft = Math.min(5.2, mu) * Math.max(0, 1 - vt / 23);
          else if (brake) Ft = fuel <= 0 ? -clamp(vt * 4, -Math.min(8, mu), Math.min(8, mu)) : vt > 0.4 ? -Math.min(8, mu) : -Math.min(2.6, mu) * Math.max(0, 1 + vt / 6);
          else Ft = -clamp(vt * 0.35, -0.6, 0.6);
        } else Ft = -clamp(vt * 2, -0.6 * Fn, 0.6 * Fn);
        var Fx = nx * Fn + tx * Ft, Fy = ny * Fn + ty * Ft;
        fx += Fx; fy += Fy; tq += rx * Fy - ry * Fx; any = true;
      }
      for (var i = 0; i < 2; i++) { var w = toWorld(WH[i]); contact(w[0], w[1], WR, true, i); }
      for (var j = 0; j < HULL.length; j++) { var h = toWorld(HULL[j]); contact(h[0], h[1], 0.05, false); }
      var grounded = car.contact[0] || car.contact[1];
      if (!grounded) { if (gas) tq += 5.5; if (brake) tq -= 5.5; } else { if (gas) tq += 1.2; if (brake) tq -= 0.8; }
      car.vx += fx * dt; car.vy += fy * dt; car.w += tq / 0.95 * dt; car.w *= (1 - 0.9 * dt);
      car.x += car.vx * dt; car.y += car.vy * dt; car.a += car.w * dt;
      if (car.x < -12) { car.x = -12; car.vx = Math.max(0, car.vx); }
      return { gas: gas, grounded: grounded };
    }
    function end(kind) {
      if (over) return; over = true; crashT = 0; api.sfx.bad();
      var d = Math.floor(dist), nb = d > best; if (nb) { best = d; api.LS.set("hcbest", best); } bank += coins; api.LS.set("hccoins", bank);
      var cc = coins;
      setTimeout(function () {
        api.panel({ title: kind === "fuel" ? "Out of fuel! ⛽" : "Ouch! Driver down! 💥", lines: [{ t: nb ? "New best distance! 🏆" : "Best: " + best + "m" }, { t: d + " m", big: true }, { t: "🪙 " + cc + " coins this run · " + bank + " total" }],
          buttons: [{ label: "Drive again", fn: function () { api.hidePanel(); reset(); } },
            { label: "💬 Text Nino my score", cls: "t", fn: function () { api.textNino("I drove " + d + "m in Nino Hill Climb 🚙 and got " + cc + " coins"); } },
            { label: "Game Center", cls: "g", fn: api.showMenu }] });
      }, kind === "fuel" ? 300 : 900);
    }
    var acc = 0, st = { gas: false, grounded: true };
    function update(dt) {
      acc += dt; var n = 0;
      while (acc >= 1 / 240 && n < 16) { st = step(1 / 240); acc -= 1 / 240; n++; }
      if (n >= 16) acc = 0;
      var spd = Math.hypot(car.vx, car.vy);
      wrot -= (car.vx * Math.cos(car.a) + car.vy * Math.sin(car.a)) / WR * dt;
      if (!over) dist = Math.max(dist, car.x - 2);
      if (!over) {
        fuel = Math.max(0, fuel - dt * (1.6 + (st.gas ? 2.6 : 0)));
        var head = toWorld([0.0, 1.15]), hm = slope(head[0]), hd = (head[1] - terrain(head[0])) / Math.sqrt(1 + hm * hm);
        if (hd < 0.38) { end("crash"); msg = "💥"; }
        else if (Math.cos(car.a) < -0.2 && (car.contact[0] || car.contact[1] || spd < 0.6)) { crashT += dt; if (crashT > 1.2) end("crash"); } else crashT = 0;
        if (fuel <= 0) { nfT += dt; if (nfT > 7) end("fuel"); } else nfT = 0;
        if (fuel <= 0 && spd < 0.4) { lowT += dt; if (lowT > 1.2) end("fuel"); } else lowT = 0;
        for (var i = 0; i < items.length; i++) {
          var it = items[i]; if (it.got) continue;
          var dx = it.x - car.x, dy = it.y - (car.y + 0.3);
          if (dx * dx + dy * dy < (it.k === "f" ? 2.6 : 2.0)) {
            it.got = true;
            if (it.k === "c") { coins += it.v; api.sfx.good(); } else { fuel = 100; api.sfx.win(); msg = "⛽ FUEL!"; msgT = 1.4; }
            for (var k = 0; k < 8; k++) sparkle.push({ x: it.x, y: it.y, vx: (Math.random() - 0.5) * 6, vy: Math.random() * 5, a: 1, c: it.k === "c" ? "#ffd23f" : "#ff5252" });
          }
        }
        if (st.gas && Math.random() < 0.5) { var ex = toWorld([-1.6, -0.1]); puffs.push({ x: ex[0], y: ex[1], vx: -1 - Math.random(), vy: 0.6, r: 0.12, a: 0.6 }); }
      }
      spawn();
      puffs.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.r += dt * 0.5; p.a -= dt * 0.9; }); puffs = puffs.filter(function (p) { return p.a > 0; });
      sparkle.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy -= 12 * dt; p.a -= dt * 1.6; }); sparkle = sparkle.filter(function (p) { return p.a > 0; });
      msgT = Math.max(0, msgT - dt);
      var lead = clamp(car.vx * 0.25, -1, 3);
      camX += (car.x + 2.2 + lead - camX) * Math.min(1, dt * 4); camY += (car.y - camY) * Math.min(1, dt * 3.2);
    }

    /* ---------- draw ---------- */
    function sx(x) { return W * 0.4 + (x - camX) * S; }
    function sy(y) { return H * 0.56 - (y - camY) * S; }
    var clouds = []; for (var ci = 0; ci < 7; ci++) clouds.push([ci * 0.38 + hash(ci) * 0.2, 0.06 + hash(ci + 9) * 0.2, 0.6 + hash(ci + 4) * 0.7]);
    function cloud(x, y, s) { ctx.beginPath(); [[0, 0, 34], [30, -12, 28], [58, 0, 30], [26, 8, 30], [-26, 6, 22]].forEach(function (b) { ctx.moveTo(x + b[0] * s + b[2] * s, y + b[1] * s); ctx.arc(x + b[0] * s, y + b[1] * s, b[2] * s, 0, 7); }); ctx.fill(); }
    function drawBg() {
      var g = ctx.createLinearGradient(0, 0, 0, H * 0.6); g.addColorStop(0, "#5fb6f5"); g.addColorStop(1, "#c9ecff"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "rgba(255,255,255,.95)"; var span = W * 2.6;
      clouds.forEach(function (c) { var x = ((c[0] * span - camX * S * 0.05) % span + span) % span - W * 0.5; cloud(x, H * c[1], c[2] * W / 414); });
      var mBase = H * 0.5 + clamp(-(camY) * S * 0.08, -60, 60), off = camX * S * 0.12, pw = W * 0.55;
      var i0 = Math.floor((off - W) / pw) - 1, i1 = Math.floor((off + 2 * W) / pw) + 1;
      for (var i = i0; i <= i1; i++) {
        var px = i * pw - off + hash(i) * pw * 0.4, ph = H * (0.17 + hash(i + 7) * 0.12), bw = pw * (0.75 + hash(i + 3) * 0.4);
        var mg = ctx.createLinearGradient(0, mBase - ph, 0, mBase); mg.addColorStop(0, "#c6d2ec"); mg.addColorStop(1, "#8b9bc9");
        ctx.fillStyle = mg; ctx.strokeStyle = "#7684b3"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(px - bw, mBase + 4); ctx.lineTo(px - bw * 0.35, mBase - ph * 0.55); ctx.lineTo(px, mBase - ph); ctx.lineTo(px + bw * 0.3, mBase - ph * 0.6); ctx.lineTo(px + bw, mBase + 4); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.moveTo(px - bw * 0.2, mBase - ph * 0.68); ctx.lineTo(px, mBase - ph); ctx.lineTo(px + bw * 0.17, mBase - ph * 0.72); ctx.lineTo(px + bw * 0.06, mBase - ph * 0.64); ctx.lineTo(px - bw * 0.06, mBase - ph * 0.74); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.beginPath(); ctx.moveTo(px, mBase - ph); ctx.lineTo(px + bw * 0.3, mBase - ph * 0.6); ctx.lineTo(px + bw * 0.12, mBase - ph * 0.45); ctx.closePath(); ctx.fill();
      }
      var hb = H * 0.6 + clamp(-camY * S * 0.25, -120, 120), ho = camX * S * 0.35;
      ctx.fillStyle = "#7ccd4a"; ctx.strokeStyle = "#4f9a2c"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, H);
      for (var x = 0; x <= W + 8; x += 8) { var wx = (x + ho) / W; ctx.lineTo(x, hb - Math.sin(wx * 2.2) * H * 0.05 - Math.sin(wx * 5.1 + 1) * H * 0.02); }
      ctx.lineTo(W, H); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    function drawGround() {
      var x0 = camX - W * 0.4 / S - 2, x1 = camX + W * 0.6 / S + 2, stp = 6 / S;
      ctx.beginPath(); ctx.moveTo(sx(x0), H + 10);
      for (var x = x0; x <= x1; x += stp) ctx.lineTo(sx(x), sy(terrain(x)));
      ctx.lineTo(sx(x1), H + 10); ctx.closePath();
      var dg = ctx.createLinearGradient(0, sy(camY), 0, H); dg.addColorStop(0, "#9a5a2e"); dg.addColorStop(1, "#7a4320"); ctx.fillStyle = dg; ctx.fill();
      ctx.save(); ctx.clip();
      for (var cx = Math.floor(x0 / 2.2); cx <= x1 / 2.2; cx++) {
        for (var r = 0; r < 3; r++) {
          var hsh = hash(cx * 3 + r), rx = cx * 2.2 + hsh * 2.2, depth = 0.9 + r * 1.9 + hash(cx + r * 11) * 1.2, ry = terrain(rx) - depth, rw = (0.35 + hash(cx * 7 + r) * 0.45) * S;
          ctx.fillStyle = "#6e3c1c"; ctx.beginPath(); ctx.ellipse(sx(rx), sy(ry), rw, rw * 0.62, hsh * 2, 0, 7); ctx.fill();
          ctx.fillStyle = "#b06b3a"; ctx.beginPath(); ctx.ellipse(sx(rx) - rw * 0.15, sy(ry) - rw * 0.15, rw * 0.55, rw * 0.3, hsh * 2, 0, 7); ctx.fill();
        }
      }
      ctx.restore();
      ctx.beginPath(); for (x = x0; x <= x1; x += stp) { var X = sx(x), Y = sy(terrain(x)); x === x0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); }
      ctx.lineJoin = "round"; ctx.lineCap = "round";
      ctx.strokeStyle = "#2f7a1d"; ctx.lineWidth = 0.62 * S; ctx.stroke();
      ctx.strokeStyle = "#4cbb2e"; ctx.lineWidth = 0.44 * S; ctx.stroke();
      ctx.save(); ctx.translate(0, -0.1 * S); ctx.strokeStyle = "#7fe04f"; ctx.lineWidth = 0.1 * S; ctx.stroke(); ctx.restore();
      for (var m = Math.ceil(x0 / 50) * 50; m <= x1; m += 50) {
        if (m <= 0) continue; var by = sy(terrain(m)); ctx.fillStyle = "#fff"; ctx.fillRect(sx(m) - 2, by - 1.6 * S, 4, 1.4 * S);
        ctx.fillStyle = "#e53935"; rr(ctx, sx(m) - 0.75 * S, by - 2.3 * S, 1.5 * S, 0.7 * S, 5); ctx.fill(); ctx.fillStyle = "#fff"; ctx.font = "900 " + Math.round(0.42 * S) + "px " + FONT; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText((m - 2 + 2) + "m", sx(m), by - 1.95 * S);
      }
    }
    function coinGfx(x, y, r, v, t) {
      var sq = Math.abs(Math.cos(t * 3 + x)); ctx.save(); ctx.translate(x, y); ctx.scale(0.35 + sq * 0.65, 1);
      ctx.fillStyle = "#c98a00"; ctx.beginPath(); ctx.arc(0, r * 0.1, r, 0, 7); ctx.fill();
      var g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r); g.addColorStop(0, "#fff3a0"); g.addColorStop(1, "#ffc21a"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
      ctx.strokeStyle = "#e39b00"; ctx.lineWidth = r * 0.14; ctx.beginPath(); ctx.arc(0, 0, r * 0.72, 0, 7); ctx.stroke();
      ctx.fillStyle = "#d88a00"; ctx.font = "900 " + Math.round(r * 1.1) + "px " + BIG; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(v === 5 ? "5" : "$", 0, r * 0.06);
      ctx.restore();
    }
    function fuelCan(x, y, s) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(T * 3) * 0.08);
      ctx.fillStyle = "#b71c1c"; rr(ctx, -0.42 * s, -0.5 * s, 0.84 * s, 1.0 * s, 0.12 * s); ctx.fill();
      ctx.fillStyle = "#ff4d4d"; rr(ctx, -0.36 * s, -0.44 * s, 0.72 * s, 0.88 * s, 0.1 * s); ctx.fill();
      ctx.fillStyle = "#ffd23f"; ctx.fillRect(-0.12 * s, -0.68 * s, 0.24 * s, 0.2 * s);
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 0.08 * s; ctx.beginPath(); ctx.moveTo(-0.24 * s, -0.24 * s); ctx.lineTo(0.24 * s, 0.24 * s); ctx.moveTo(0.24 * s, -0.24 * s); ctx.lineTo(-0.24 * s, 0.24 * s); ctx.stroke();
      ctx.font = "900 " + Math.round(0.26 * s) + "px " + FONT; ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("FUEL", 0, 0.34 * s);
      ctx.restore();
    }
    function wheel(px, py) {
      ctx.save(); ctx.translate(px, py); ctx.rotate(-wrot); var r = WR * S;
      ctx.fillStyle = "#1c1d22"; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
      ctx.fillStyle = "#33353d"; for (var i = 0; i < 12; i++) { ctx.save(); ctx.rotate(i * Math.PI / 6); ctx.fillRect(-r * 0.12, -r * 1.02, r * 0.24, r * 0.2); ctx.restore(); }
      ctx.fillStyle = "#c9ced8"; ctx.beginPath(); ctx.arc(0, 0, r * 0.56, 0, 7); ctx.fill(); ctx.fillStyle = "#8d94a3"; ctx.beginPath(); ctx.arc(0, 0, r * 0.4, 0, 7); ctx.fill();
      ctx.strokeStyle = "#e9ecf2"; ctx.lineWidth = r * 0.12; for (i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(0, 0); var a = i * Math.PI * 2 / 5; ctx.lineTo(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5); ctx.stroke(); }
      ctx.fillStyle = "#555b66"; ctx.beginPath(); ctx.arc(0, 0, r * 0.13, 0, 7); ctx.fill();
      ctx.restore();
    }
    function drawCar() {
      var X = sx(car.x), Y = sy(car.y);
      ctx.save(); ctx.translate(X, Y); ctx.rotate(-car.a); ctx.scale(S, S);
      ctx.lineJoin = "round"; ctx.lineCap = "round";
      ctx.fillStyle = "#2b2d33"; ctx.beginPath(); ctx.arc(-1.72, -0.32, 0.36, 0, 7); ctx.fill(); ctx.fillStyle = "#666b77"; ctx.beginPath(); ctx.arc(-1.72, -0.32, 0.18, 0, 7); ctx.fill();
      ctx.strokeStyle = "#2a2c33"; ctx.lineWidth = 0.1; ctx.beginPath(); ctx.moveTo(-0.75, -0.2); ctx.lineTo(-0.62, -1.25); ctx.lineTo(0.05, -1.25); ctx.stroke();
      // driver
      var bob = Math.sin(T * 9) * 0.02 * clamp(Math.abs(car.vx) / 8, 0, 1);
      ctx.fillStyle = "#1d2230"; rr(ctx, -0.45, -0.95, 0.6, 0.85, 0.2); ctx.fill();
      ctx.strokeStyle = "#1d2230"; ctx.lineWidth = 0.18; ctx.beginPath(); ctx.moveTo(-0.05, -0.75); ctx.lineTo(0.45, -0.55); ctx.stroke();
      ctx.fillStyle = "#7a4b2e"; ctx.beginPath(); ctx.arc(0.48, -0.55, 0.09, 0, 7); ctx.fill();
      ctx.save(); ctx.translate(-0.05, -1.2 + bob); ctx.rotate(car.w * 0.03);
      ctx.fillStyle = "#6b3f24"; ctx.beginPath(); ctx.arc(-0.37, 0.05, 0.11, 0, 7); ctx.fill();
      var hg = ctx.createRadialGradient(0.1, -0.12, 0.05, 0, 0, 0.5); hg.addColorStop(0, "#a36a43"); hg.addColorStop(1, "#7a4b2e"); ctx.fillStyle = hg;
      ctx.beginPath(); ctx.ellipse(0, 0, 0.42, 0.45, 0, 0, 7); ctx.fill();
      ctx.fillStyle = "#16100b"; ctx.beginPath(); ctx.ellipse(-0.05, -0.28, 0.42, 0.22, -0.15, Math.PI, 0); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(0.2, -0.02, 0.1, 0.12, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(0.38, -0.02, 0.08, 0.11, 0, 0, 7); ctx.fill();
      ctx.fillStyle = "#1a1208"; ctx.beginPath(); ctx.arc(0.24, 0.0, 0.05, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(0.41, 0.0, 0.045, 0, 7); ctx.fill();
      ctx.strokeStyle = "#2a160b"; ctx.lineWidth = 0.04; ctx.beginPath(); ctx.moveTo(0.12, -0.16); ctx.lineTo(0.28, -0.14); ctx.moveTo(0.33, -0.14); ctx.lineTo(0.45, -0.15); ctx.stroke();
      ctx.fillStyle = "#2a160b"; ctx.beginPath(); ctx.ellipse(0.24, 0.27, 0.2, 0.1, 0, 0, Math.PI); ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 0.035; ctx.beginPath(); ctx.arc(0.27, 0.18, 0.1, 0.2 * Math.PI, 0.85 * Math.PI); ctx.stroke();
      var cg = ctx.createLinearGradient(0, -0.85, 0, -0.42); cg.addColorStop(0, "#fff19a"); cg.addColorStop(1, "#e7a300"); ctx.fillStyle = cg; ctx.strokeStyle = "#9a6400"; ctx.lineWidth = 0.03;
      ctx.save(); ctx.translate(0, -0.42); ctx.rotate(0.12);
      ctx.beginPath(); ctx.moveTo(-0.38, 0); ctx.lineTo(-0.42, -0.3); ctx.lineTo(-0.2, -0.15); ctx.lineTo(0, -0.38); ctx.lineTo(0.2, -0.15); ctx.lineTo(0.42, -0.3); ctx.lineTo(0.38, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      [["#e53935", 0, -0.08], ["#1e88e5", -0.22, -0.07], ["#1e88e5", 0.22, -0.07]].forEach(function (j) { ctx.fillStyle = j[0]; ctx.beginPath(); ctx.arc(j[1], j[2], 0.045, 0, 7); ctx.fill(); });
      ctx.fillStyle = "#fff8c8"; [-0.42, 0, 0.42].forEach(function (x2, k) { ctx.beginPath(); ctx.arc(x2, k === 1 ? -0.38 : -0.3, 0.04, 0, 7); ctx.fill(); });
      ctx.restore(); ctx.restore();
      // body
      var bg = ctx.createLinearGradient(0, -0.5, 0, 0.55); bg.addColorStop(0, "#ff4a3d"); bg.addColorStop(1, "#c8141c");
      ctx.fillStyle = bg; ctx.strokeStyle = "#5a0a0e"; ctx.lineWidth = 0.06;
      ctx.beginPath(); ctx.moveTo(-1.6, 0.45); ctx.lineTo(-1.62, -0.38); ctx.lineTo(-0.55, -0.42); ctx.lineTo(-0.5, -0.12); ctx.lineTo(0.42, -0.12); ctx.lineTo(0.55, -0.48); ctx.lineTo(1.55, -0.42); ctx.lineTo(1.68, 0.05); ctx.lineTo(1.6, 0.45); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#1c1d22"; [-1.15, 1.15].forEach(function (wx) { ctx.beginPath(); ctx.arc(wx, 0.55, 0.62, Math.PI, 0); ctx.fill(); });
      ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.fillRect(-1.45, -0.32, 0.8, 0.07); ctx.fillRect(0.7, -0.36, 0.75, 0.07);
      ctx.strokeStyle = "#2a2c33"; ctx.lineWidth = 0.09; ctx.beginPath(); ctx.moveTo(0.55, -0.45); ctx.lineTo(0.3, -1.1); ctx.stroke();
      ctx.strokeStyle = "rgba(170,225,255,.55)"; ctx.lineWidth = 0.05; ctx.beginPath(); ctx.moveTo(0.5, -0.5); ctx.lineTo(0.27, -1.05); ctx.stroke();
      ctx.fillStyle = "#ffe27a"; ctx.beginPath(); ctx.ellipse(1.6, -0.25, 0.08, 0.12, 0, 0, 7); ctx.fill();
      ctx.fillStyle = "#2a2c33"; for (var gx = 0; gx < 3; gx++) ctx.fillRect(1.25 + gx * 0.1, -0.35, 0.05, 0.2);
      ctx.strokeStyle = "#2a2c33"; ctx.lineWidth = 0.04; ctx.beginPath(); ctx.moveTo(-0.9, -0.42); ctx.lineTo(-1.05, -1.1); ctx.stroke();
      ctx.restore();
      for (var i = 0; i < 2; i++) { var w = toWorld(WH[i]); wheel(sx(w[0]), sy(w[1])); }
    }
    function txt(s, x, y, size, fill, stroke, align) { ctx.font = "900 " + size + "px " + BIG; ctx.textAlign = align || "center"; ctx.textBaseline = "middle"; ctx.lineJoin = "round"; ctx.lineWidth = size * 0.2; ctx.strokeStyle = stroke; ctx.strokeText(s, x, y); ctx.lineWidth = size * 0.08; ctx.strokeStyle = "#fff"; ctx.fillStyle = fill; ctx.fillText(s, x, y); }
    var T = 0;
    function draw() {
      drawBg(); drawGround();
      items.forEach(function (it) { if (it.got) return; var X = sx(it.x), Y = sy(it.y); if (X < -40 || X > W + 40) return; if (it.k === "c") coinGfx(X, Y, 0.36 * S, it.v, T); else fuelCan(X, Y, S); });
      puffs.forEach(function (p) { ctx.globalAlpha = p.a; ctx.fillStyle = "#e6e6e6"; ctx.beginPath(); ctx.arc(sx(p.x), sy(p.y), p.r * S, 0, 7); ctx.fill(); }); ctx.globalAlpha = 1;
      drawCar();
      sparkle.forEach(function (p) { ctx.globalAlpha = p.a; ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(sx(p.x), sy(p.y), 0.1 * S, 0, 7); ctx.fill(); }); ctx.globalAlpha = 1;
      var top = (parseFloat(getComputedStyle(host.querySelector(".ngc-top")).paddingTop) || 10) + 46;
      var kmh = Math.round(Math.abs(car.vx * Math.cos(car.a) + car.vy * Math.sin(car.a)) * 3.6);
      txt(kmh + " km/h", 14, top + 16, 24, "#e040fb", "#5a1170", "left");
      var fx = 14, fy = top + 40, fw = 118;
      ctx.fillStyle = "rgba(0,0,0,.35)"; rr(ctx, fx, fy, fw + 30, 22, 11); ctx.fill();
      ctx.fillStyle = "#e53935"; rr(ctx, fx + 4, fy + 3, 16, 16, 4); ctx.fill(); ctx.fillStyle = "#fff"; ctx.font = "900 10px " + FONT; ctx.textAlign = "center"; ctx.fillText("⛽", fx + 12, fy + 12);
      var fl = fuel / 100, low = fl < 0.25 && Math.sin(T * 10) > 0;
      ctx.fillStyle = "rgba(255,255,255,.25)"; rr(ctx, fx + 24, fy + 6, fw, 10, 5); ctx.fill();
      ctx.fillStyle = low ? "#ff1744" : fl < 0.25 ? "#ff7043" : fl < 0.5 ? "#ffd23f" : "#43e05f"; rr(ctx, fx + 24, fy + 6, Math.max(10, fw * fl), 10, 5); ctx.fill();
      txt(Math.floor(dist) + "m", W / 2, top + 58, 52, "#e040fb", "#5a1170");
      txt("BEST " + Math.max(best, Math.floor(dist)) + "m", W - 14, top + 16, 20, "#2979ff", "#0d2a7a", "right");
      coinGfx(W - 34, top + 52, 17, 1, 0.4); ctx.save(); ctx.font = "900 15px " + BIG; ctx.textAlign = "right"; ctx.textBaseline = "middle"; ctx.lineWidth = 4; ctx.strokeStyle = "#7a4a00"; ctx.strokeText(String(coins), W - 58, top + 53); ctx.fillStyle = "#fff"; ctx.fillText(String(coins), W - 58, top + 53); ctx.restore();
      if (!touched) { ctx.globalAlpha = 0.7 + Math.sin(T * 4) * 0.3; txt("Hold GAS to drive!", W / 2, H * 0.3, 24, "#ffd23f", "#7a4a00"); ctx.globalAlpha = 1; ctx.font = "800 13px " + FONT; ctx.fillStyle = "#1d2230"; ctx.textAlign = "center"; ctx.fillText("Tilt in the air with GAS / BRAKE · don't land on your head!", W / 2, H * 0.3 + 30); }
      if (msgT > 0 && msg) { ctx.globalAlpha = Math.min(1, msgT * 2); txt(msg, W / 2, H * 0.36, 34, "#ff5252", "#5a0a0e"); ctx.globalAlpha = 1; }
      if (fuel <= 0 && !over) txt("Out of fuel!", W / 2, H * 0.36, 30, "#ff5252", "#5a0a0e");
    }

    /* ---------- loop ---------- */
    var raf = 0, last = 0, running = false;
    function frame(ts) { raf = requestAnimationFrame(frame); var dt = Math.min(0.05, Math.max(0, (ts - last) / 1000)); last = ts; T += dt; update(dt); draw(); }
    function resume() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
    function pause() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; inp.gas = inp.brake = inp.kg = inp.kb = false; [].forEach.call(ui.querySelectorAll(".hc-p"), function (el) { el.classList.remove("on"); }); }
    window.addEventListener("resize", resize); resize(); resume();
    function stop() { pause(); window.removeEventListener("resize", resize); window.removeEventListener("keydown", kd, true); window.removeEventListener("keyup", ku, true); if (cvs.parentNode) cvs.parentNode.removeChild(cvs); if (ui.parentNode) ui.parentNode.removeChild(ui); }
    return { stop: stop, pause: pause, resume: resume, _dbg: function () { return { x: +car.x.toFixed(2), y: +car.y.toFixed(2), a: +car.a.toFixed(2), vx: +car.vx.toFixed(2), dist: Math.floor(dist), coins: coins, fuel: Math.round(fuel), over: over }; }, _fuel: function (f) { fuel = f; }, _flip: function () { car.a = Math.PI; car.w = 0; car.y = terrain(car.x) + 2.2; } };
  }
  window.NinoHillClimb = { start: start };
})();

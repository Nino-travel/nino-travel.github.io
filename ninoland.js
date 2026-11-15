/* Nino Land — 3D Lego amusement park. Requires window.THREE (vendored r160). */
(function () {
  "use strict";
  var THREE = window.THREE;
  var FONT = '"Arial Black","Segoe UI Black",Impact,-apple-system,Helvetica,Arial,sans-serif';
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerpAng(a, b, t) { var d = ((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI; return a + d * t; }

  function start(host, api) {
    var LSK = "land", saved = api.LS.get(LSK, null) || {};
    var P = { coins: saved.coins || 0, tokens: saved.tokens || [], stars: saved.stars || [], done: saved.done || {}, quest: !!saved.quest, finished: !!saved.finished, jumped: !!saved.jumped };
    function save() { api.LS.set(LSK, P); }

    var W = host.clientWidth || 414, H = host.clientHeight || 896;
    var renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    var PR = Math.min(window.devicePixelRatio || 1, 1.75);
    renderer.setPixelRatio(PR); renderer.setSize(W, H, false);
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
    var cvs = renderer.domElement; cvs.setAttribute("aria-label", "Nino Land 3D park");
    host.insertBefore(cvs, host.querySelector(".ngc-top"));
    var maxAniso = Math.min(4, renderer.capabilities.getMaxAnisotropy());

    var scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xcfeaff, 70, 190);
    var camera = new THREE.PerspectiveCamera(58, W / H, 0.1, 600);

    var textures = [];
    function ctex(w, h, draw, srgb) {
      var c = document.createElement("canvas"); c.width = w; c.height = h; var g = c.getContext("2d"); draw(g, w, h);
      var t = new THREE.CanvasTexture(c); if (srgb !== false) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso; textures.push(t); return t;
    }
    var mats = {}, mid = 0;
    function mat(color, o) {
      o = o || {}; var key = color + "|" + JSON.stringify(o, function (k, v) { return v && v.isTexture ? v.uuid : v; });
      if (mats[key]) return mats[key];
      var m = new THREE.MeshPhongMaterial({ color: color, specular: o.spec != null ? o.spec : 0x333333, shininess: o.shin || 60, map: o.map || null, emissive: o.em || 0x000000, transparent: !!o.tr, opacity: o.op == null ? 1 : o.op, side: o.ds ? THREE.DoubleSide : THREE.FrontSide, depthWrite: o.dw !== false });
      mats[key] = m; return m;
    }
    function keep(m) { mats["k" + (mid++)] = m; return m; }

    var brickTex = ctex(256, 256, function (g, w, h) {
      g.fillStyle = "#c4c4c4"; g.fillRect(0, 0, w, h);
      for (var r = 0; r < 4; r++) for (var c = -1; c < 3; c++) {
        var x = c * 128 + (r % 2 ? 64 : 0), y = r * 64;
        var gr = g.createLinearGradient(0, y, 0, y + 64); gr.addColorStop(0, "#ffffff"); gr.addColorStop(0.12, "#f4f4f4"); gr.addColorStop(0.85, "#e8e8e8"); gr.addColorStop(1, "#c8c8c8");
        g.fillStyle = gr; g.fillRect(x + 2, y + 2, 124, 60);
      }
    });
    brickTex.wrapS = brickTex.wrapT = THREE.RepeatWrapping;
    var studTex = ctex(128, 128, function (g, w, h) {
      g.fillStyle = "#ededed"; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 2; i++) for (var j = 0; j < 2; j++) {
        var cx = 32 + i * 64, cy = 32 + j * 64;
        g.fillStyle = "rgba(0,0,0,.22)"; g.beginPath(); g.arc(cx + 4, cy + 5, 20, 0, 7); g.fill();
        var gr = g.createRadialGradient(cx - 7, cy - 7, 2, cx, cy, 20); gr.addColorStop(0, "#ffffff"); gr.addColorStop(1, "#dcdcdc");
        g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, 19, 0, 7); g.fill();
        g.strokeStyle = "rgba(0,0,0,.12)"; g.lineWidth = 2; g.stroke();
      }
      g.strokeStyle = "rgba(0,0,0,.05)"; g.strokeRect(0, 0, w, h);
    });
    studTex.wrapS = studTex.wrapT = THREE.RepeatWrapping;
    var roadTex = ctex(128, 128, function (g, w, h) {
      g.fillStyle = "#5d6472"; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 260; i++) { g.fillStyle = "rgba(255,255,255," + Math.random() * 0.05 + ")"; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
      g.fillStyle = "#ffd23f"; g.fillRect(w / 2 - 3, 10, 6, 56);
      g.fillStyle = "#e9edf3"; g.fillRect(4, 0, 4, h); g.fillRect(w - 8, 0, 4, h);
    });
    roadTex.wrapS = roadTex.wrapT = THREE.RepeatWrapping;
    var tileTex = ctex(128, 128, function (g, w, h) {
      g.fillStyle = "#f1e2c2"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#e6cf9f"; g.fillRect(0, 0, 64, 64); g.fillRect(64, 64, 64, 64);
      g.strokeStyle = "rgba(120,90,40,.18)"; g.lineWidth = 2; g.strokeRect(1, 1, 62, 62); g.strokeRect(65, 65, 62, 62); g.strokeRect(65, 1, 62, 62); g.strokeRect(1, 65, 62, 62);
    });
    tileTex.wrapS = tileTex.wrapT = THREE.RepeatWrapping;
    function stripeTex(a, b, n) { var t = ctex(256, 64, function (g, w, h) { for (var i = 0; i < n; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect(i * w / n, 0, w / n + 1, h); } }); t.wrapS = THREE.RepeatWrapping; return t; }
    function textTex(txt, o) {
      o = o || {}; var w = o.w || 512, h = o.h || 128;
      return ctex(w, h, function (g) {
        if (o.bg) { g.fillStyle = o.bg; g.fillRect(0, 0, w, h); }
        if (o.border) { g.strokeStyle = o.border; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10); }
        var fs = o.fs || h * 0.6; g.font = "900 " + fs + "px " + FONT; g.textAlign = "center"; g.textBaseline = "middle";
        while (g.measureText(txt).width > w * 0.9 && fs > 10) { fs -= 2; g.font = "900 " + fs + "px " + FONT; }
        if (o.stroke) { g.lineJoin = "round"; g.lineWidth = fs * 0.18; g.strokeStyle = o.stroke; g.strokeText(txt, w / 2, h / 2 + fs * 0.05); }
        if (o.grad) { var gr = g.createLinearGradient(0, h * 0.2, 0, h * 0.8); o.grad.forEach(function (c, i) { gr.addColorStop(i / (o.grad.length - 1), c); }); g.fillStyle = gr; } else g.fillStyle = o.fg || "#fff";
        g.fillText(txt, w / 2, h / 2 + fs * 0.05);
      });
    }
    var glowTex = ctex(64, 64, function (g) { var gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, "rgba(255,255,255,.55)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
    function glow(x, y, z, s, color, op) {
      var m = keep(new THREE.SpriteMaterial({ map: glowTex, color: color, transparent: true, opacity: op || 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
      var sp = new THREE.Sprite(m); sp.position.set(x, y, z); sp.scale.set(s, s, s); scene.add(sp); return sp;
    }
    function boxUV(g, w, h, d, u) {
      var uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
      for (var f = 0; f < 6; f++) for (var i = 0; i < 4; i++) { var k = f * 4 + i; uv.setXY(k, uv.getX(k) * dims[f][0] / u, uv.getY(k) * dims[f][1] / u); }
      uv.needsUpdate = true; return g;
    }
    function mesh(geo, m, x, y, z, parent, cast, recv) {
      var o = new THREE.Mesh(geo, m); o.position.set(x || 0, y || 0, z || 0); o.castShadow = cast !== false; o.receiveShadow = recv !== false; (parent || scene).add(o); return o;
    }
    function bx(w, h, d, m, x, y, z, parent) { return mesh(new THREE.BoxGeometry(w, h, d), m, x, y, z, parent); }
    function beam(a, b, t, m, parent) { var len = a.distanceTo(b), o = bx(t, t, len, m, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2, parent); o.lookAt(b.x, b.y, b.z); return o; }

    var inst = {}, dummy = new THREE.Object3D();
    function addI(name, m4, color) { (inst[name] = inst[name] || []).push([m4, color]); }
    function addIp(name, x, y, z, sx, sy, sz, ry, color, rx, rz) { dummy.position.set(x, y, z); dummy.rotation.set(rx || 0, ry || 0, rz || 0); dummy.scale.set(sx, sy, sz); dummy.updateMatrix(); addI(name, dummy.matrix.clone(), color); }
    function addIlocal(name, parent, x, y, z, sx, sy, sz, ry, color) { parent.updateMatrixWorld(true); dummy.position.set(x, y, z); dummy.rotation.set(0, ry || 0, 0); dummy.scale.set(sx, sy, sz); dummy.updateMatrix(); addI(name, new THREE.Matrix4().multiplyMatrices(parent.matrixWorld, dummy.matrix), color); }
    function buildI(name, geo, m, cast) {
      var L = inst[name]; if (!L || !L.length) return null; var im = new THREE.InstancedMesh(geo, m, L.length);
      for (var i = 0; i < L.length; i++) { im.setMatrixAt(i, L[i][0]); if (L[i][1] != null) im.setColorAt(i, new THREE.Color(L[i][1])); }
      im.castShadow = !!cast; im.receiveShadow = true; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; scene.add(im); return im;
    }
    function studsOn(x0, z0, w, d, y, color, parent) {
      var nx = Math.max(1, Math.floor(w)), nz = Math.max(1, Math.floor(d));
      for (var i = 0; i < nx; i++) for (var j = 0; j < nz; j++) {
        var lx = x0 - (nx - 1) / 2 + i, lz = z0 - (nz - 1) / 2 + j;
        if (parent) addIlocal("stud", parent, lx, y + 0.09, lz, 1, 1, 1, 0, color); else addIp("stud", lx, y + 0.09, lz, 1, 1, 1, 0, color);
      }
    }
    /* ---------- lights / sky ---------- */
    var hemi = new THREE.HemisphereLight(0xdff2ff, 0x6fa35a, 1.05); scene.add(hemi);
    var sun = new THREE.DirectionalLight(0xfff1d6, 2.1); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024); var shc = sun.shadow.camera; shc.left = -34; shc.right = 34; shc.top = 34; shc.bottom = -34; shc.near = 1; shc.far = 140;
    sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03; scene.add(sun); scene.add(sun.target);
    var skyMat = keep(new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { top: { value: new THREE.Color(0x2b7fe0) }, mid: { value: new THREE.Color(0x8fd0ff) }, bot: { value: new THREE.Color(0xe8f6ff) } },
      vertexShader: "varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
      fragmentShader: "uniform vec3 top;uniform vec3 mid;uniform vec3 bot;varying vec3 vP;void main(){float h=vP.y;vec3 c=h>0.15?mix(mid,top,smoothstep(.15,.7,h)):mix(bot,mid,smoothstep(-.05,.15,h));gl_FragColor=vec4(c,1.);}" }));
    var sky = new THREE.Mesh(new THREE.SphereGeometry(450, 24, 12), skyMat); scene.add(sky);
    for (var ci = 0; ci < 14; ci++) {
      var cang = ci / 14 * Math.PI * 2 + Math.random() * 0.3, crad = 150 + Math.random() * 70, cxp = Math.cos(cang) * crad, czp = Math.sin(cang) * crad, cyp = 45 + Math.random() * 25;
      for (var cb = 0; cb < 5; cb++) { var cs0 = 7 + Math.random() * 7; addIp("cloud", cxp + (cb - 2) * 7 + Math.random() * 3, cyp + Math.random() * 3, czp + Math.random() * 4, cs0 * 1.3, cs0 * 0.75, cs0, 0, null); }
    }

    /* ---------- ground & roads ---------- */
    var outer = mesh(new THREE.PlaneGeometry(900, 900), mat(0x58b34f, { spec: 0x111111, shin: 10 }), 0, -0.05, 0, null, false, true); outer.rotation.x = -Math.PI / 2;
    var gTex = studTex.clone(); gTex.needsUpdate = true; gTex.repeat.set(60, 60); textures.push(gTex);
    var ground = mesh(new THREE.PlaneGeometry(120, 120), mat(0x4fc24a, { map: gTex, spec: 0x222222, shin: 30 }), 0, 0, 0, null, false, true); ground.rotation.x = -Math.PI / 2;
    function road(x, z, len, ry) { var geo = boxUV(new THREE.BoxGeometry(8, 0.08, len), 8, 0.08, len, 8), o = mesh(geo, mat(0xffffff, { map: roadTex, spec: 0x111111, shin: 8 }), x, 0.04, z, null, false, true); o.rotation.y = ry || 0; }
    road(0, 31, 46, 0); road(-32, 0, 36, Math.PI / 2); road(32, 0, 36, Math.PI / 2); road(0, -21, 14, 0);
    var plz = mesh(new THREE.CylinderGeometry(14, 14, 0.1, 48), mat(0xffffff, { map: tileTex, spec: 0x222222, shin: 20 }), 0, 0.05, 0, null, false, true);
    (function () { var uv = plz.geometry.attributes.uv, pos = plz.geometry.attributes.position; for (var i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / 4, pos.getZ(i) / 4); uv.needsUpdate = true; })();
    [-4.6, 4.6].forEach(function (x) { bx(1.2, 0.3, 38, mat(0xe8e8e8), x, 0.15, 34); studsOn(x, 34, 1, 38, 0.3, 0xe8e8e8); });

    var cols = [];
    function col(cx, cz, ex, ez, top, soft) { cols.push({ x0: cx - ex, x1: cx + ex, z0: cz - ez, z1: cz + ez, top: top, tree: !!soft }); }

    /* ---------- buildings ---------- */
    var winMat = mat(0x8fd6ff, { em: 0x1d5a86, spec: 0xffffff, shin: 120 });
    var awnColors = [["#ffffff", "#e53935"], ["#ffffff", "#1e88e5"], ["#fff3c4", "#ff8f00"], ["#ffffff", "#8e24aa"], ["#ffffff", "#ff4f9a"], ["#ffffff", "#2e7d32"]];
    function building(x, z, w, d, h, color, roof, sign, ry, awn, signCol) {
      var g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
      mesh(boxUV(new THREE.BoxGeometry(w, h, d), w, h, d, 4), mat(color, { map: brickTex, shin: 70 }), 0, h / 2, 0, g);
      bx(w + 0.5, 0.45, d + 0.5, mat(roof), 0, h + 0.22, 0, g);
      bx(w + 0.3, 0.5, d + 0.3, mat(roof), 0, 0.25, 0, g);
      studsOn(0, 0, w, d, h + 0.45, roof, g);
      bx(2.2, 3.2, 0.3, mat(0x3b2a20, { shin: 20 }), 0, 1.6, d / 2 + 0.05, g);
      bx(2.6, 0.3, 0.4, mat(0xffffff), 0, 3.3, d / 2 + 0.1, g);
      var nw = Math.max(1, Math.floor(w / 3));
      for (var wy = 5.8; wy < h - 1.3; wy += 3) {
        for (var i = 0; i < nw; i++) { var wx = -w / 2 + (i + 0.5) * w / nw; addIlocal("win", g, wx, wy, d / 2 + 0.03, 1, 1, 1, 0, null); addIlocal("winF", g, wx, wy, d / 2 + 0.01, 1, 1, 1, 0, 0xffffff); }
        [-1, 1].forEach(function (s) { addIlocal("win", g, s * (w / 2 + 0.03), wy, 0, 1, 1, 1, Math.PI / 2, null); addIlocal("winF", g, s * (w / 2 + 0.01), wy, 0, 1, 1, 1, Math.PI / 2, 0xffffff); });
      }
      [-1, 1].forEach(function (s) { if (w > 6) { addIlocal("win", g, s * (w / 2 - 1.6), 1.9, d / 2 + 0.03, 1, 1, 1, 0, null); addIlocal("winF", g, s * (w / 2 - 1.6), 1.9, d / 2 + 0.01, 1, 1, 1, 0, 0xffffff); } });
      if (awn) {
        var at = stripeTex(awn[0], awn[1], 8); at.repeat.set(w / 4, 1);
        var a = bx(w * 0.86, 0.25, 1.8, mat(0xffffff, { map: at, shin: 30 }), 0, 3.95, d / 2 + 0.85, g); a.rotation.x = 0.28;
      }
      if (sign) {
        var sw = Math.min(w * 0.9, 9), st = textTex(sign, { bg: signCol || "#12141c", grad: ["#fff6b0", "#ffd23f", "#ff9f1c"], border: "#ffd23f" });
        var sm = keep(new THREE.MeshBasicMaterial({ map: st, toneMapped: false })), dk = mat(0x12141c);
        var sp = new THREE.Mesh(new THREE.BoxGeometry(sw, 1.6, 0.3), [dk, dk, dk, dk, sm, dk]);
        sp.position.set(0, h > 8 ? 5.6 : Math.max(4.9, h - 1.1), d / 2 + 0.25); if (h > 8) sp.position.y = h - 1.3; g.add(sp); sp.castShadow = true;
        g.updateMatrixWorld(true); var wp = new THREE.Vector3(0, sp.position.y, d / 2 + 1.0).applyMatrix4(g.matrixWorld); glow(wp.x, wp.y, wp.z, sw * 1.05, 0xffc94a, 0.3);
      }
      var sw90 = Math.abs(Math.sin(ry)) > 0.5, ex = sw90 ? d / 2 : w / 2, ez = sw90 ? w / 2 : d / 2;
      col(x, z, ex + 0.25, ez + 0.25, h + 0.45);
      return g;
    }
    var LF = Math.PI / 2, RT = -Math.PI / 2;
    building(-11, 40, 10, 8, 8, 0xe53935, 0xffd23f, "NINO MERCH", LF, awnColors[0]);
    building(-10.5, 26, 9, 7, 6, 0xffc107, 0xe53935, "SNACK SHACK", LF, awnColors[2], "#7a1010");
    building(-10.5, 13, 7, 7, 13, 0x1e88e5, 0xffffff, "NINO HQ", LF, awnColors[1]);
    building(11, 38, 11, 8, 9, 0x8e24aa, 0x25f4ee, "ARCADE", RT, awnColors[3], "#1b0a2e");
    building(10.5, 24, 8, 7, 6, 0xff5fa2, 0xffffff, "ICE CREAM", RT, awnColors[4], "#5a0f33");
    building(10.5, 12, 8, 7, 7, 0x43a047, 0xffd23f, "BRICK TOYS", RT, awnColors[5], "#0d3311");
    building(-26, 9.5, 10, 7, 7, 0xff7043, 0x1e88e5, "GAME ZONE", Math.PI, awnColors[1]);
    building(-42, 9.5, 9, 7, 10, 0x26c6da, 0xff5fa2, null, Math.PI, null);
    building(46, -9.5, 9, 7, 8, 0xfdd835, 0x8e24aa, "PRIZES", 0, awnColors[3]);

    /* ---------- entrance gate ---------- */
    (function () {
      var z = 53;
      [-6.5, 6.5].forEach(function (x, i) {
        mesh(boxUV(new THREE.BoxGeometry(3, 12, 3), 3, 12, 3, 4), mat(i ? 0x1e88e5 : 0xe53935, { map: brickTex }), x, 6, z);
        bx(3.6, 0.5, 3.6, mat(0xffd23f), x, 12.25, z); studsOn(x, z, 3, 3, 12.5, 0xffd23f); col(x, z, 1.7, 1.7, 12.5);
        mesh(new THREE.SphereGeometry(1, 16, 12), mat(0xffd23f, { em: 0x8a5a00, shin: 120, spec: 0xffffff }), x, 13.6, z);
        glow(x, 13.6, z, 5, 0xffc94a, 0.5);
      });
      var t = textTex("NINO LAND", { bg: "#12141c", grad: ["#fff6b0", "#ffd23f", "#ff7a1c"], stroke: "#7a1a00", border: "#e53935", w: 1024, h: 220 });
      var sm = keep(new THREE.MeshBasicMaterial({ map: t, toneMapped: false })), side = mat(0xe53935);
      var sign = new THREE.Mesh(new THREE.BoxGeometry(12, 2.6, 0.6), [side, side, side, side, sm, sm]); sign.position.set(0, 10, z); sign.castShadow = true; scene.add(sign);
      var t2 = textTex("★ AMUSEMENT PARK ★", { bg: "#1e88e5", fg: "#fff", w: 1024, h: 120, border: "#ffd23f" });
      var sm2 = keep(new THREE.MeshBasicMaterial({ map: t2, toneMapped: false })), s2m = mat(0x1e88e5);
      var sign2 = new THREE.Mesh(new THREE.BoxGeometry(9, 1, 0.5), [s2m, s2m, s2m, s2m, sm2, sm2]); sign2.position.set(0, 8.1, z); scene.add(sign2);
      var bc = [0xff4f7a, 0xffd23f, 0x25f4ee, 0x7dff7a];
      for (var i = 0; i < 13; i++) { addIp("bulb", -6 + i, 11.45, z + 0.35, 1, 1, 1, 0, bc[i % 4]); addIp("bulb", -6 + i, 11.45, z - 0.35, 1, 1, 1, 0, bc[i % 4]); }
      glow(0, 10, z - 1, 13, 0xffb347, 0.25);
    })();

    /* ---------- fences ---------- */
    (function () {
      var E = 57;
      for (var a = -E; a <= E; a += 2) {
        addIp("post", a, 0.7, -E, 1, 1, 1, 0, 0xffffff); addIp("post", -E, 0.7, a, 1, 1, 1, 0, 0xffffff); addIp("post", E, 0.7, a, 1, 1, 1, 0, 0xffffff);
        if (Math.abs(a) > 8) addIp("post", a, 0.7, E, 1, 1, 1, 0, 0xffffff);
      }
      var rm = mat(0xe53935);
      bx(2 * E, 0.35, 0.3, rm, 0, 1.2, -E); bx(0.3, 0.35, 2 * E, rm, -E, 1.2, 0); bx(0.3, 0.35, 2 * E, rm, E, 1.2, 0);
      bx(E - 8, 0.35, 0.3, rm, -(E + 8) / 2, 1.2, E); bx(E - 8, 0.35, 0.3, rm, (E + 8) / 2, 1.2, E);
    })();

    /* ---------- lamps ---------- */
    var lampPos = [];
    for (var lz = 10; lz <= 48; lz += 9) { lampPos.push([-5.3, lz]); lampPos.push([5.3, lz]); }
    for (var la = 0; la < 8; la++) { var lan = la / 8 * Math.PI * 2 + 0.39; lampPos.push([Math.cos(lan) * 13, Math.sin(lan) * 13]); }
    [-20, -44, 20, 44].forEach(function (x) { lampPos.push([x, -5.3]); lampPos.push([x, 5.3]); });
    lampPos.forEach(function (p) {
      addIp("pole", p[0], 2.5, p[1], 1, 1, 1, 0, 0x2b2f3a); addIp("lampHead", p[0], 5.15, p[1], 1, 1, 1, 0, 0x2b2f3a); addIp("lampBulb", p[0], 4.75, p[1], 1, 1, 1, 0, null);
      glow(p[0], 4.7, p[1], 2.8, 0xffd27a, 0.55);
    });

    /* ---------- palms & bushes ---------- */
    var palms = [[-9, 49], [9, 49], [-18, 30], [18, 28], [-16, -10], [16, -10], [-50, 50], [-46, 44], [50, 48], [-52, -6], [52, 4], [-20, -40], [0, -46], [-48, 28], [26, 46], [38, 30], [-36, 30], [8, -40], [-8, -30], [24, 4.5]];
    palms.forEach(function (p, k) {
      var tilt = 0.12 * (k % 2 ? 1 : -1), hx = p[0], hz = p[1];
      for (var s3 = 0; s3 < 6; s3++) addIp("trunk", hx + Math.sin(tilt) * s3 * 1.05, 0.55 + s3 * 1.05, hz, 1, 1, 1, 0, s3 % 2 ? 0x8d6e4b : 0x7a5a3a, 0, -tilt);
      var tx = hx + Math.sin(tilt) * 6.3, ty = 6.6;
      for (var lf = 0; lf < 7; lf++) addIp("leaf", tx, ty, hz, 1, 1, 1, lf / 7 * Math.PI * 2 + k, lf % 2 ? 0x2fbf4a : 0x24a63c, 0, -0.45);
      addIp("coco", tx, ty - 0.35, hz, 1, 1, 1, 0, 0x6b4a2b);
      col(hx, hz, 0.5, 0.5, 99, true);
    });
    for (var bsh = 0; bsh < 30; bsh++) { var ba = bsh / 30 * Math.PI * 2; if (Math.abs(Math.cos(ba)) > 0.96 || Math.abs(Math.sin(ba)) > 0.96) continue; addIp("bush", Math.cos(ba) * 15.2, 0.45, Math.sin(ba) * 15.2, 1, 1, 1, ba, [0x2fbf4a, 0x3fd65c, 0xff5fa2, 0xffd23f][bsh % 4]); }

    /* ---------- fountain ---------- */
    var water1, water2;
    (function () {
      mesh(new THREE.CylinderGeometry(3.4, 3.6, 0.9, 32), mat(0x1e88e5, { map: brickTex }), 0, 0.45, 0);
      mesh(new THREE.CylinderGeometry(3.0, 3.0, 0.1, 32), mat(0x45c8ff, { em: 0x0a4a7a, tr: true, op: 0.85, shin: 140, spec: 0xffffff }), 0, 0.86, 0, null, false);
      mesh(new THREE.CylinderGeometry(0.5, 0.6, 2.6, 16), mat(0xffd23f), 0, 2, 0);
      mesh(new THREE.CylinderGeometry(1.6, 0.8, 0.5, 24), mat(0xffd23f), 0, 3.3, 0);
      water1 = mesh(new THREE.ConeGeometry(1.4, 2.2, 20, 1, true), mat(0x9fe6ff, { em: 0x2a8fc4, tr: true, op: 0.55, ds: true, dw: false }), 0, 4.6, 0, null, false, false); water1.rotation.x = Math.PI;
      water2 = mesh(new THREE.CylinderGeometry(0.18, 0.3, 2.2, 10), mat(0xc9f3ff, { em: 0x3aa8d8, tr: true, op: 0.7, dw: false }), 0, 4.6, 0, null, false, false);
      glow(0, 4, 0, 7, 0x6fd8ff, 0.35);
      col(0, 0, 3.4, 3.4, 0.9);
    })();
    /* ---------- ferris wheel ---------- */
    var FW = { c: new THREE.Vector3(-30, 13, -26), r: 10, g: null, gond: [], lights: null, speed: 0.22 };
    (function () {
      var c = FW.c, sm = mat(0xf5f5f5, { shin: 90 });
      [-1, 1].forEach(function (zz) {
        beam(new THREE.Vector3(c.x - 6, 0, c.z + zz * 3), new THREE.Vector3(c.x, c.y, c.z + zz * 1.5), 0.55, sm);
        beam(new THREE.Vector3(c.x + 6, 0, c.z + zz * 3), new THREE.Vector3(c.x, c.y, c.z + zz * 1.5), 0.55, sm);
      });
      bx(16, 0.6, 9, mat(0xe53935, { map: brickTex }), c.x, 0.3, c.z); studsOn(c.x, c.z, 16, 9, 0.6, 0xe53935);
      col(c.x, c.z, 8, 4.5, 0.6);
      var g = new THREE.Group(); g.position.copy(c); scene.add(g); FW.g = g;
      var rimM = mat(0xff4f9a, { em: 0x3a0018, shin: 100 }), rim2 = mat(0x1e88e5, { shin: 100 });
      [-0.9, 0.9].forEach(function (zz) { mesh(new THREE.TorusGeometry(FW.r, 0.22, 8, 64), rimM, 0, 0, zz, g); mesh(new THREE.TorusGeometry(FW.r * 0.55, 0.15, 6, 40), rim2, 0, 0, zz, g); });
      mesh(new THREE.CylinderGeometry(1, 1, 3.4, 20), mat(0xffd23f, { shin: 120 }), 0, 0, 0, g).rotation.x = Math.PI / 2;
      for (var i = 0; i < 12; i++) {
        var a = i / 12 * Math.PI * 2; [-0.9, 0.9].forEach(function (zz) { var s = bx(0.16, FW.r, 0.16, mat(0xffffff), Math.cos(a) * FW.r / 2, Math.sin(a) * FW.r / 2, zz, g); s.rotation.z = a - Math.PI / 2; });
      }
      var gcol = [0xe53935, 0xffd23f, 0x1e88e5, 0x43a047, 0x8e24aa, 0xff7043, 0x25f4ee, 0xff5fa2, 0xfdd835, 0x26c6da];
      for (i = 0; i < 10; i++) {
        var a2 = i / 10 * Math.PI * 2, piv = new THREE.Group(); piv.position.set(Math.cos(a2) * FW.r, Math.sin(a2) * FW.r, 0); g.add(piv);
        var hang = new THREE.Group(); piv.add(hang);
        bx(0.12, 1.2, 0.12, mat(0xdddddd), 0, -0.6, 0, hang);
        bx(2, 1.4, 1.7, mat(gcol[i], { shin: 90 }), 0, -1.8, 0, hang);
        bx(2.3, 0.25, 2, mat(0xffffff), 0, -1.05, 0, hang);
        bx(2.2, 0.2, 1.9, mat(0xffffff), 0, -2.55, 0, hang);
        FW.gond.push({ piv: piv, hang: hang });
      }
      var lm = new THREE.InstancedMesh(new THREE.SphereGeometry(0.2, 6, 4), keep(new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })), 96);
      for (i = 0; i < 48; i++) { var a3 = i / 48 * Math.PI * 2; [-1.15, 1.15].forEach(function (zz, k) { dummy.position.set(Math.cos(a3) * (FW.r + 0.05), Math.sin(a3) * (FW.r + 0.05), zz); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); lm.setMatrixAt(i * 2 + k, dummy.matrix); lm.setColorAt(i * 2 + k, new THREE.Color(0xffffff)); }); }
      g.add(lm); FW.lights = lm;
      glow(c.x, c.y, c.z + 1.8, 9, 0xff7ac0, 0.35);
    })();

    /* ---------- roller coaster ---------- */
    var CO = {};
    (function () {
      var pts = [[14, 1.4, -14], [24, 1.4, -13], [34, 1.6, -14], [44, 5, -16], [51, 13, -22], [50, 16, -31], [44, 11, -38], [36, 4, -42], [28, 9, -48], [18, 14, -48], [11, 9, -42], [13, 4, -34], [22, 7, -28], [28, 6, -22], [20, 3, -18]].map(function (p) { return new THREE.Vector3(p[0], p[1], p[2]); });
      var curve = new THREE.CatmullRomCurve3(pts, true, "catmullrom", 0.5); CO.curve = curve; CO.len = curve.getLength();
      var N = 360, lp = [], rp = [], up = new THREE.Vector3(0, 1, 0);
      for (var i = 0; i < N; i++) {
        var u = i / N, p = curve.getPointAt(u), t = curve.getTangentAt(u), sd = new THREE.Vector3().crossVectors(t, up).normalize();
        lp.push(p.clone().addScaledVector(sd, 0.7)); rp.push(p.clone().addScaledVector(sd, -0.7));
        if (i % 3 === 0) { dummy.position.set(p.x, p.y - 0.12, p.z); dummy.scale.set(1, 1, 1); dummy.lookAt(p.x + t.x, p.y - 0.12 + t.y, p.z + t.z); dummy.updateMatrix(); addI("tie", dummy.matrix.clone(), 0x5a3d2a); }
        if (i % 12 === 0 && p.y > 2) { dummy.rotation.set(0, 0, 0); addIp("support", p.x, (p.y - 0.3) / 2, p.z, 1, p.y - 0.3, 1, 0, 0xe0e0e0); }
      }
      var railM = mat(0xff3b4e, { shin: 120, spec: 0xffffff });
      mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(lp, true), 500, 0.14, 6, true), railM, 0, 0, 0, null, true, false);
      mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rp, true), 500, 0.14, 6, true), railM, 0, 0, 0, null, true, false);
      bx(14, 1.0, 4.4, mat(0x1e88e5, { map: brickTex }), 22, 0.5, -9.6); studsOn(22, -9.6, 14, 4, 1.0, 0x1e88e5); col(22, -9.6, 7, 2.2, 1.0);
      [[15.5, -8], [28.5, -8]].forEach(function (p) { bx(0.4, 4.4, 0.4, mat(0xffffff), p[0], 3.2, p[1]); });
      var rt = stripeTex("#ffffff", "#ff3b4e", 10); rt.repeat.set(3, 1);
      bx(14.5, 0.4, 6.4, mat(0xffffff, { map: rt }), 22, 5.4, -10.6);
      var cst = textTex("NINO COASTER", { bg: "#ff3b4e", grad: ["#ffffff", "#fff3a0"], border: "#ffd23f" }), csm = keep(new THREE.MeshBasicMaterial({ map: cst, toneMapped: false }));
      var cside = mat(0xff3b4e), csign = new THREE.Mesh(new THREE.BoxGeometry(8, 1.6, 0.3), [cside, cside, cside, cside, csm, csm]); csign.position.set(22, 6.5, -7.5); scene.add(csign);
      var cm = [0xffd23f, 0x25f4ee, 0x8e24aa]; CO.segs = [];
      for (var k = 0; k < 3; k++) {
        var seg = new THREE.Group(); scene.add(seg);
        bx(1.9, 0.9, 2, mat(cm[k], { shin: 110 }), 0, 0.55, 0, seg); bx(1.9, 0.9, 0.3, mat(0x222222), 0, 1.1, -0.85, seg);
        bx(2, 0.25, 0.25, mat(0xffffff), 0, 1.05, 0.9, seg); CO.segs.push(seg);
      }
      CO.cart = CO.segs[0]; CO.u = 0.02; CO.v = 9;
    })();

    /* ---------- carousel ---------- */
    var CA = {};
    (function () {
      var x = 30, z = 16;
      mesh(new THREE.CylinderGeometry(6.4, 6.6, 0.6, 32), mat(0xffd23f, { map: brickTex }), x, 0.3, z);
      var g = new THREE.Group(); g.position.set(x, 0.6, z); scene.add(g); CA.g = g; CA.horses = [];
      mesh(new THREE.CylinderGeometry(6, 6, 0.3, 32), mat(0xffffff), 0, 0.15, 0, g);
      mesh(new THREE.CylinderGeometry(0.8, 0.8, 7, 16), mat(0xff5fa2, { shin: 120 }), 0, 3.5, 0, g);
      var ct = stripeTex("#ff3b4e", "#ffffff", 16);
      mesh(new THREE.ConeGeometry(7, 2.6, 16, 1, false), mat(0xffffff, { map: ct, shin: 60 }), 0, 8.3, 0, g);
      mesh(new THREE.CylinderGeometry(7, 7, 0.6, 16), mat(0x1e88e5), 0, 6.9, 0, g);
      mesh(new THREE.SphereGeometry(0.6, 12, 8), mat(0xffd23f, { em: 0x6a4a00, shin: 120 }), 0, 9.8, 0, g);
      var hcl = [0xffffff, 0x8fd6ff, 0xffd23f, 0xff8fc4, 0xc9a2ff, 0x9fffb0, 0xffffff, 0xffc29a];
      for (var i = 0; i < 8; i++) {
        var a = i / 8 * Math.PI * 2, hx = Math.cos(a) * 4.4, hz = Math.sin(a) * 4.4;
        bx(0.12, 6.4, 0.12, mat(0xffd23f, { shin: 120 }), hx, 3.5, hz, g);
        var hg = new THREE.Group(); hg.position.set(hx, 2.2, hz); hg.rotation.y = -a; g.add(hg);
        var hm = mat(hcl[i], { shin: 90 });
        bx(0.8, 0.9, 2.2, hm, 0, 0, 0, hg); bx(0.6, 1.2, 0.6, hm, 0, 0.7, 1, hg).rotation.x = -0.4; bx(0.55, 0.55, 0.9, hm, 0, 1.25, 1.35, hg);
        bx(0.22, 1, 0.22, hm, 0.25, -0.85, 0.8, hg); bx(0.22, 1, 0.22, hm, -0.25, -0.85, -0.8, hg); bx(0.82, 0.2, 0.9, mat(0xe53935), 0, 0.52, -0.1, hg);
        CA.horses.push({ g: hg, ph: i });
      }
      var cl = new THREE.InstancedMesh(new THREE.SphereGeometry(0.17, 6, 4), keep(new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })), 24);
      for (i = 0; i < 24; i++) { var a2 = i / 24 * Math.PI * 2; dummy.position.set(Math.cos(a2) * 7.05, 6.9, Math.sin(a2) * 7.05); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); cl.setMatrixAt(i, dummy.matrix); cl.setColorAt(i, new THREE.Color([0xffd23f, 0xff4f7a, 0x25f4ee][i % 3])); }
      g.add(cl);
      glow(x, 7, z, 16, 0xffc0e0, 0.22);
      col(x, z, 6.4, 6.4, 0.6);
    })();

    /* ---------- build instanced statics ---------- */
    buildI("stud", new THREE.CylinderGeometry(0.28, 0.28, 0.18, 10), mat(0xffffff, { shin: 80 }), false);
    buildI("win", new THREE.BoxGeometry(1.5, 1.7, 0.08), winMat, false);
    buildI("winF", new THREE.BoxGeometry(1.8, 2.0, 0.06), mat(0xffffff), false);
    buildI("bulb", new THREE.SphereGeometry(0.17, 6, 4), keep(new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })), false);
    buildI("post", new THREE.BoxGeometry(0.35, 1.4, 0.35), mat(0xffffff), false);
    buildI("pole", new THREE.CylinderGeometry(0.13, 0.18, 5, 8), mat(0xffffff, { shin: 90 }), true);
    buildI("lampHead", new THREE.CylinderGeometry(0.55, 0.35, 0.35, 8), mat(0xffffff), false);
    buildI("lampBulb", new THREE.SphereGeometry(0.33, 10, 8), keep(new THREE.MeshBasicMaterial({ color: 0xffe9a8, toneMapped: false })), false);
    buildI("trunk", new THREE.CylinderGeometry(0.42, 0.5, 1.05, 7), mat(0xffffff, { shin: 20 }), true);
    var leafGeo = new THREE.BoxGeometry(3.6, 0.12, 1.1); leafGeo.translate(1.8, 0, 0);
    buildI("leaf", leafGeo, mat(0xffffff, { shin: 40 }), true);
    buildI("coco", new THREE.SphereGeometry(0.55, 8, 6), mat(0xffffff), false);
    buildI("bush", new THREE.IcosahedronGeometry(0.9, 0), mat(0xffffff, { shin: 30 }), true);
    buildI("tie", new THREE.BoxGeometry(1.9, 0.14, 0.32), mat(0xffffff, { shin: 20 }), false);
    buildI("support", new THREE.CylinderGeometry(0.16, 0.2, 1, 6), mat(0xffffff, { shin: 60 }), true);
    buildI("cloud", new THREE.IcosahedronGeometry(1, 1), keep(new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x9fb8d8 })), false);

    /* ---------- minifig ---------- */
    function minifig(o) {
      var root = new THREE.Group(), body = new THREE.Group(); root.add(body);
      var skin = mat(0xffd23f, { shin: 90 }), pants = mat(o.pants, { shin: 70 }), shirt = mat(o.shirt, { shin: 70 });
      bx(1.0, 0.3, 0.62, pants, 0, 1.32, 0, body);
      function leg(x) { var p = new THREE.Group(); p.position.set(x, 1.2, 0); body.add(p); bx(0.47, 1.05, 0.6, pants, 0, -0.52, 0, p); bx(0.47, 0.22, 0.75, pants, 0, -1.08, 0.07, p); return p; }
      var legL = leg(-0.25), legR = leg(0.25);
      var front = keep(new THREE.MeshPhongMaterial({ map: o.shirtTex, shininess: 70, specular: 0x333333 }));
      var torsoGeo = new THREE.CylinderGeometry(0.62, 0.72, 1.25, 4, 1); torsoGeo.rotateY(Math.PI / 4); torsoGeo.scale(1.08, 1, 0.58);
      mesh(torsoGeo, shirt, 0, 2.08, 0, body);
      var tf = new THREE.Mesh(new THREE.PlaneGeometry(0.98, 1.16), front); tf.position.set(0, 2.08, 0.335); tf.rotation.x = -0.035; body.add(tf);
      function arm(s) {
        var p = new THREE.Group(); p.position.set(s * 0.68, 2.55, 0); body.add(p);
        var a = bx(0.34, 1.0, 0.4, shirt, s * 0.08, -0.45, 0, p); a.rotation.z = s * 0.12;
        mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.28, 10), skin, s * 0.14, -1.05, 0.08, p); return p;
      }
      var armL = arm(-1), armR = arm(1);
      mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.16, 10), skin, 0, 2.78, 0, body);
      var hg = new THREE.CylinderGeometry(0.44, 0.44, 0.66, 24); hg.rotateY(Math.PI);
      var faceM = keep(new THREE.MeshPhongMaterial({ map: o.faceTex, shininess: 90, specular: 0x444444 }));
      mesh(hg, [faceM, skin, skin], 0, 3.18, 0, body);
      mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.18, 12), skin, 0, 3.58, 0, body);
      if (o.hair === "curls") {
        var hm = mat(0x141414, { shin: 40 }), cg = new THREE.IcosahedronGeometry(0.2, 0);
        mesh(new THREE.CylinderGeometry(0.47, 0.47, 0.3, 18), hm, 0, 3.47, -0.03, body);
        for (var i = 0; i < 18; i++) { var a = i / 18 * Math.PI * 2, r = i % 2 ? 0.38 : 0.2, y = i % 2 ? 3.6 : 3.74; if (i % 2 && Math.sin(a) > 0.75) y = 3.68; mesh(cg, hm, Math.cos(a) * r, y + (i % 3) * 0.04, Math.sin(a) * r - 0.05, body, true, false); }
      } else if (o.hair === "cap") {
        mesh(new THREE.CylinderGeometry(0.47, 0.47, 0.3, 18), mat(o.capColor || 0xe53935), 0, 3.6, 0, body);
        bx(0.8, 0.08, 0.5, mat(o.capColor || 0xe53935), 0, 3.48, 0.5, body);
      }
      var cape = null;
      if (o.cape) {
        cape = new THREE.Group(); cape.position.set(0, 2.68, -0.34); body.add(cape);
        var cgeo = new THREE.PlaneGeometry(1.25, 2.0, 1, 4); cgeo.translate(0, -1.0, 0);
        mesh(cgeo, mat(0xd61f2c, { ds: true, shin: 30 }), 0, 0, 0, cape);
      }
      root.userData = { body: body, legL: legL, legR: legR, armL: armL, armR: armR, cape: cape };
      return root;
    }
    var ninoShirt = ctex(256, 256, function (g, w, h) {
      g.fillStyle = "#111216"; g.fillRect(0, 0, w, h);
      g.strokeStyle = "#ffd23f"; g.lineWidth = 7; g.beginPath(); g.arc(128, 10, 70, 0.25 * Math.PI, 0.75 * Math.PI); g.stroke();
      g.fillStyle = "#ffd23f"; g.beginPath(); g.arc(128, 80, 9, 0, 7); g.fill();
      g.textAlign = "center"; g.font = "900 56px " + FONT; g.lineWidth = 8; g.strokeStyle = "#000"; g.fillStyle = "#ffffff"; g.strokeText("YSSN", 128, 146); g.fillText("YSSN", 128, 146);
      var gr = g.createLinearGradient(0, 160, 0, 220); gr.addColorStop(0, "#fff3a0"); gr.addColorStop(1, "#ffb300"); g.font = "900 66px " + FONT; g.strokeText("NINO", 128, 216); g.fillStyle = gr; g.fillText("NINO", 128, 216);
    });
    function faceTex(mask) {
      return ctex(512, 128, function (g, w, h) {
        g.fillStyle = "#ffd23f"; g.fillRect(0, 0, w, h);
        var cx = 256;
        if (mask) { g.fillStyle = "#111"; g.beginPath(); g.moveTo(cx - 88, 32); g.quadraticCurveTo(cx, 20, cx + 88, 32); g.lineTo(cx + 84, 70); g.quadraticCurveTo(cx, 60, cx - 84, 70); g.closePath(); g.fill(); g.fillRect(cx + 80, 40, w, 18); g.fillRect(0, 40, cx - 80, 18); }
        g.fillStyle = mask ? "#ffffff" : "#111"; [-34, 34].forEach(function (d) { g.beginPath(); g.ellipse(cx + d, 47, mask ? 15 : 8, mask ? 9 : 11, d > 0 ? -0.25 : 0.25, 0, 7); g.fill(); });
        if (mask) { g.fillStyle = "#111"; [-34, 34].forEach(function (d) { g.beginPath(); g.arc(cx + d + 2, 48, 4.5, 0, 7); g.fill(); }); }
        g.strokeStyle = "#111"; g.lineWidth = 6; g.lineCap = "round"; g.beginPath(); g.arc(cx, 74, 26, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
      });
    }
    var player = minifig({ shirt: 0x111216, pants: 0x1b1c22, shirtTex: ninoShirt, faceTex: faceTex(true), hair: "curls", cape: true });
    scene.add(player);
    var guideShirt = ctex(256, 256, function (g, w, h) { g.fillStyle = "#1e88e5"; g.fillRect(0, 0, w, h); g.fillStyle = "#ffd23f"; g.fillRect(0, 150, w, 30); g.textAlign = "center"; g.font = "900 54px " + FONT; g.fillStyle = "#fff"; g.fillText("GUIDE", 128, 120); g.font = "900 44px " + FONT; g.fillStyle = "#ffd23f"; g.fillText("★", 128, 232); });
    var npc = minifig({ shirt: 0x1e88e5, pants: 0xffffff, shirtTex: guideShirt, faceTex: faceTex(false), hair: "cap", capColor: 0xe53935 });
    npc.position.set(-6, 0, 7); npc.rotation.y = 0.6; scene.add(npc); col(-6, 7, 0.7, 0.7, 99, true);
    var bubTex = ctex(512, 200, function (g, w, h) {
      g.fillStyle = "#fff"; g.strokeStyle = "#12141c"; g.lineWidth = 8;
      g.beginPath(); g.moveTo(40, 10); g.lineTo(w - 40, 10); g.quadraticCurveTo(w - 10, 10, w - 10, 40); g.lineTo(w - 10, 120); g.quadraticCurveTo(w - 10, 150, w - 40, 150); g.lineTo(280, 150); g.lineTo(256, 190); g.lineTo(232, 150); g.lineTo(40, 150); g.quadraticCurveTo(10, 150, 10, 120); g.lineTo(10, 40); g.quadraticCurveTo(10, 10, 40, 10); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = "#12141c"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "900 50px " + FONT; g.fillText("QUEST !", 256, 62); g.font = "800 32px -apple-system,Helvetica,Arial,sans-serif"; g.fillStyle = "#3a3f4b"; g.fillText("Come talk to me", 256, 114);
    });
    var bubble = new THREE.Sprite(keep(new THREE.SpriteMaterial({ map: bubTex, depthWrite: false }))); bubble.scale.set(4.4, 1.72, 1); bubble.position.set(-6, 5.6, 7); scene.add(bubble);
    [0xff3b4e, 0xffd23f, 0x25f4ee, 0x8e24aa].forEach(function (c, i) { var bp = new THREE.Vector3(-8.2 + i * 0.6, 6.4 + (i % 2) * 0.8, 6 + (i % 3) * 0.4); mesh(new THREE.SphereGeometry(0.55, 12, 10), mat(c, { shin: 140, spec: 0xffffff }), bp.x, bp.y, bp.z).scale.y = 1.2; beam(new THREE.Vector3(-7.6, 1.6, 6.4), new THREE.Vector3(bp.x, bp.y - 0.6, bp.z), 0.03, mat(0xffffff)); });
    /* ---------- collectibles ---------- */
    var coinPos = [];
    for (var cz = 9; cz <= 49; cz += 3.2) coinPos.push([0, 1.2, cz]);
    for (var cx2 = -48; cx2 <= 48; cx2 += 4) if (Math.abs(cx2) > 16) coinPos.push([cx2, 1.2, 0]);
    for (var cr = 0; cr < 14; cr++) { var ca = cr / 14 * Math.PI * 2; coinPos.push([Math.cos(ca) * 9, 1.2, Math.sin(ca) * 9]); }
    [[-30, -15], [-26, -15], [-34, -15], [18, -5], [26, -5], [30, 7], [34, 7], [24, 24], [36, 24], [-40, -40], [-44, -36], [40, 40], [44, 36], [-30, 30], [30, 32], [-48, -20], [48, -48], [0, -38], [-14, -26], [0, -18], [0, -24]].forEach(function (p) { coinPos.push([p[0], 1.2, p[1]]); });
    var coinGeo = new THREE.CylinderGeometry(0.62, 0.62, 0.16, 18); coinGeo.rotateX(Math.PI / 2);
    var coinMesh = new THREE.InstancedMesh(coinGeo, mat(0xffc21a, { em: 0x7a4a00, shin: 140, spec: 0xffffff }), coinPos.length);
    coinMesh.castShadow = true; scene.add(coinMesh);
    var coins = coinPos.map(function (p) { return { x: p[0], y: p[1], z: p[2], got: false }; });
    var starShape = new THREE.Shape(); for (var si = 0; si < 10; si++) { var sa = si / 10 * Math.PI * 2 - Math.PI / 2, srr = si % 2 ? 0.45 : 1; if (si) starShape.lineTo(Math.cos(sa) * srr, -Math.sin(sa) * srr); else starShape.moveTo(Math.cos(sa) * srr, -Math.sin(sa) * srr); }
    var starGeo = new THREE.ExtrudeGeometry(starShape, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 1 }); starGeo.center();
    var starPos = [[-10.5, 14.9, 11.5], [-10.5, 7.6, 26], [11, 10.6, 38], [10.5, 7.6, 24], [10.5, 8.6, 12], [0, 3.1, 0], [0, 4.4, 30], [-26, 8.6, 9.5]];
    var starMesh = new THREE.InstancedMesh(starGeo, mat(0xffe14a, { em: 0x8a6a00, shin: 140, spec: 0xffffff }), starPos.length); scene.add(starMesh);
    var stars = starPos.map(function (p, i) { return { x: p[0], y: p[1], z: p[2], got: P.stars.indexOf(i) >= 0, g: glow(p[0], p[1], p[2], 3.2, 0xffe14a, 0.6) }; });
    var tokTex = ctex(128, 128, function (g) { var gr = g.createRadialGradient(50, 45, 5, 64, 64, 64); gr.addColorStop(0, "#ffb3ff"); gr.addColorStop(1, "#8e24aa"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); g.strokeStyle = "#ffd23f"; g.lineWidth = 10; g.beginPath(); g.arc(64, 64, 54, 0, 7); g.stroke(); g.fillStyle = "#fff"; g.font = "900 74px " + FONT; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("N", 64, 68); });
    var tokGeo = new THREE.CylinderGeometry(1, 1, 0.25, 28); tokGeo.rotateX(Math.PI / 2);
    var tokM = keep(new THREE.MeshPhongMaterial({ map: tokTex, emissive: 0x5a1070, shininess: 120, specular: 0xffffff })), tokSide = mat(0xffd23f, { em: 0x6a4a00, shin: 140 });
    var tokPos = [[-10.5, 15.4, 14.5], [-30, 1.7, -38], [24, 1.7, 41], [47, 1.7, -47], [-51, 1.7, 51]];
    var tokens = tokPos.map(function (p, i) {
      var m = new THREE.Mesh(tokGeo, [tokSide, tokM, tokM]); m.position.set(p[0], p[1], p[2]); m.castShadow = true; scene.add(m);
      var gg = glow(p[0], p[1], p[2], 4.2, 0xd36bff, 0.75), got = P.tokens.indexOf(i) >= 0; m.visible = gg.visible = !got;
      return { m: m, g: gg, got: got, i: i };
    });

    /* ---------- pads ---------- */
    var padTex = ctex(256, 256, function (g) { var gr = g.createRadialGradient(128, 128, 20, 128, 128, 128); gr.addColorStop(0, "rgba(255,255,255,.85)"); gr.addColorStop(0.55, "rgba(255,255,255,.3)"); gr.addColorStop(0.75, "rgba(255,255,255,.95)"); gr.addColorStop(0.86, "rgba(255,255,255,.2)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
    var pads = [];
    function pad(type, x, z, color, label, extra) {
      var m = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), keep(new THREE.MeshBasicMaterial({ map: padTex, color: color, transparent: true, depthWrite: false, toneMapped: false })));
      m.rotation.x = -Math.PI / 2; m.position.set(x, 0.13, z); scene.add(m);
      var o = { type: type, x: x, z: z, m: m }; for (var k in extra || {}) o[k] = extra[k];
      if (type === "jump") { o.tr = mesh(new THREE.CylinderGeometry(1.3, 1.45, 0.4, 20), mat(color, { em: 0x0a3a12, shin: 120 }), x, 0.2, z); mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.05, 20), mat(0x12141c), x, 0.42, z, null, false); m.position.y = 0.46; m.scale.set(0.85, 0.85, 0.85); }
      if (label) { var t = textTex(label, { fg: "#fff", stroke: "#12141c", w: 512, h: 128 }); var s = new THREE.Sprite(keep(new THREE.SpriteMaterial({ map: t, depthWrite: false }))); s.scale.set(4.2, 1.05, 1); s.position.set(x, 2.6, z); scene.add(s); o.label = s; }
      pads.push(o); return o;
    }
    pad("ferris", -30, -19.5, 0xff5fa2, "RIDE THE WHEEL");
    pad("coaster", 22, -5.6, 0x25f4ee, "RIDE COASTER");
    pad("rush", 9, -6.5, 0xffd23f, "COIN RUSH");
    pad("jump", -5.4, 22.4, 0x43e05f, null, { vy: 21.5, tx: -10.5, tz: 26 });
    pad("jump", -5.4, 17.2, 0x43e05f, null, { vy: 29.5, tx: -10.5, tz: 13 });
    pad("jump", 5.4, 33.6, 0x43e05f, null, { vy: 25, tx: 11, tz: 38 });
    pad("jump", 5.4, 20.4, 0x43e05f, null, { vy: 21.5, tx: 10.5, tz: 24 });
    pad("jump", 5.4, 16.2, 0x43e05f, null, { vy: 23, tx: 10.5, tz: 12 });
    pad("jump", -26, 4.2, 0x43e05f, null, { vy: 23, tx: -26, tz: 9.5 });

    /* ---------- coin rush rings ---------- */
    var ringPts = [[11, 2.2, 0], [6, 2.2, -10], [-4, 2.2, -10.5], [-11, 2.2, -3], [-10, 2.2, 3.5], [-2, 2.4, 15], [1.5, 2.8, 25], [-1, 3.2, 34], [0, 2.4, 45]];
    var ringGeo = new THREE.TorusGeometry(1.7, 0.2, 8, 28);
    var rings = ringPts.map(function (p, i) {
      var m = new THREE.Mesh(ringGeo, keep(new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.9, toneMapped: false })));
      m.position.set(p[0], p[1], p[2]); var a = ringPts[Math.max(0, i - 1)], b = ringPts[Math.min(ringPts.length - 1, i + 1)];
      m.lookAt(p[0] + (b[0] - a[0]), p[1], p[2] + (b[2] - a[2])); m.visible = false; scene.add(m); return m;
    });
    var rush = null;

    /* ---------- HUD ---------- */
    var hud = document.createElement("div"); hud.className = "nl-hud";
    hud.innerHTML =
      '<style>.nl-hud{position:absolute;inset:0;z-index:4;pointer-events:none;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display",Helvetica,Arial,sans-serif;color:#fff}' +
      '.nl-st{position:absolute;right:10px;top:calc(env(safe-area-inset-top,0px) + 10px);display:flex;gap:5px}' +
      '.nl-pill{background:rgba(18,20,28,.55);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border-radius:999px;padding:6px 10px 6px 6px;font-weight:800;font-size:14px;display:flex;align-items:center;gap:5px;box-shadow:0 2px 10px rgba(0,0,0,.18)}' +
      '.nl-i{width:21px;height:21px;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:900;box-shadow:inset 0 -2px 0 rgba(0,0,0,.2)}' +
      '.nl-q{position:absolute;left:10px;right:10px;top:calc(env(safe-area-inset-top,0px) + 56px);display:flex;justify-content:center}' +
      '.nl-q span{background:rgba(18,20,28,.5);border-radius:12px;padding:6px 12px;font-size:12.5px;font-weight:700;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);text-align:center}' +
      '.nl-toast{position:absolute;left:50%;top:24%;transform:translate(-50%,0) scale(.9);opacity:0;transition:opacity .25s,transform .25s;background:rgba(18,20,28,.78);border:2px solid #ffd23f;border-radius:16px;padding:10px 16px;font-weight:800;font-size:15px;text-align:center;max-width:84%;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}' +
      '.nl-toast.on{opacity:1;transform:translate(-50%,0) scale(1)}' +
      '.nl-timer{position:absolute;left:50%;top:calc(env(safe-area-inset-top,0px) + 92px);transform:translateX(-50%);font-size:26px;font-weight:900;color:#ffd23f;text-shadow:0 2px 0 #7a4a00,0 0 18px rgba(255,210,63,.6);display:none;white-space:nowrap}' +
      '.nl-joy{position:absolute;left:22px;bottom:calc(env(safe-area-inset-bottom,0px) + 26px);width:124px;height:124px;border-radius:50%;background:rgba(255,255,255,.2);border:2px solid rgba(255,255,255,.5);pointer-events:auto;touch-action:none;-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}' +
      '.nl-knob{position:absolute;left:50%;top:50%;width:56px;height:56px;margin:-28px 0 0 -28px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#dfe6f2);box-shadow:0 4px 12px rgba(0,0,0,.3)}' +
      '.nl-jump{position:absolute;right:24px;bottom:calc(env(safe-area-inset-bottom,0px) + 40px);width:84px;height:84px;border-radius:50%;border:0;pointer-events:auto;touch-action:none;background:radial-gradient(circle at 35% 30%,#7fd3ff,#0a84ff);color:#fff;font:900 15px -apple-system,Helvetica,Arial,sans-serif;box-shadow:0 6px 0 #0657b0,0 10px 20px rgba(0,0,0,.3);letter-spacing:.02em;cursor:pointer}' +
      '.nl-jump:active{transform:translateY(4px);box-shadow:0 2px 0 #0657b0}' +
      '.nl-hint{position:absolute;left:0;right:0;bottom:calc(env(safe-area-inset-bottom,0px) + 166px);text-align:center;font-weight:800;font-size:13px;text-shadow:0 1px 3px rgba(0,0,0,.7);transition:opacity .5s}' +
      '.nl-talk{position:absolute;left:12px;right:12px;bottom:calc(env(safe-area-inset-bottom,0px) + 168px);background:#fff;color:#12141c;border-radius:18px;padding:12px 14px;font-size:14px;font-weight:600;line-height:1.35;box-shadow:0 10px 30px rgba(0,0,0,.3);display:none}' +
      '.nl-talk b{display:block;color:#1e88e5;font-size:12px;margin-bottom:2px;text-transform:uppercase;letter-spacing:.04em}.nl-talk em{font-style:normal;color:#8e24aa;font-weight:800}' +
      '.nl-load{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:linear-gradient(#2b7fe0,#8fd0ff);font-weight:900;font-size:20px;transition:opacity .4s}</style>' +
      '<div class="nl-st"><div class="nl-pill"><span class="nl-i" style="background:#ffc21a;color:#7a4a00">$</span><span data-h="c">0</span></div><div class="nl-pill"><span class="nl-i" style="background:#ffe14a;color:#8a6a00">★</span><span data-h="s">0/8</span></div><div class="nl-pill"><span class="nl-i" style="background:#b13fd6">N</span><span data-h="t">0/5</span></div></div>' +
      '<div class="nl-q"><span data-h="q"></span></div><div class="nl-toast" data-h="toast"></div><div class="nl-timer" data-h="timer"></div>' +
      '<div class="nl-talk" data-h="talk"></div><div class="nl-hint" data-h="hint"></div>' +
      '<div class="nl-joy" data-h="joy"><div class="nl-knob" data-h="knob"></div></div><button class="nl-jump" data-h="jump" aria-label="Jump">JUMP</button>';
    host.insertBefore(hud, host.querySelector(".ngc-top"));
    function $h(k) { return hud.querySelector('[data-h="' + k + '"]'); }
    var hc = $h("c"), hs = $h("s"), ht = $h("t"), hq = $h("q"), toastEl = $h("toast"), timerEl = $h("timer"), talkEl = $h("talk"), hintEl = $h("hint"), joy = $h("joy"), knob = $h("knob"), jumpBtn = $h("jump");
    var coarse = window.matchMedia && window.matchMedia("(pointer:coarse)").matches;
    hintEl.textContent = coarse ? "Use the stick to run · drag the screen to look" : "WASD / arrows to run · Space to jump · drag to look";
    var sessionCoins = 0, toastT = 0;
    function toast(msg, dur) { toastEl.textContent = msg; toastEl.classList.add("on"); toastT = dur || 2.2; }
    function nStars() { return stars.filter(function (s) { return s.got; }).length; }
    function updHud() {
      hc.textContent = P.coins; hs.textContent = nStars() + "/" + stars.length; ht.textContent = P.tokens.length + "/5";
      hq.textContent = P.finished ? "🏆 Quest complete! Keep exploring Nino Land" : P.quest ? "Quest: find the 5 hidden Nino tokens (" + P.tokens.length + "/5)" : "💬 Talk to the Park Guide by the fountain";
    }
    updHud();
    /* ---------- input ---------- */
    var keys = {}, joyV = { x: 0, y: 0, id: null }, look = { id: null, x: 0, y: 0 }, jumpQ = false, moved = false;
    var KEYS = ["arrowup", "arrowdown", "arrowleft", "arrowright", " ", "w", "a", "s", "d"];
    function kd(e) { var k = (e.key || "").toLowerCase(); if (KEYS.indexOf(k) >= 0) { keys[k] = true; if (k === " ") jumpQ = true; e.preventDefault(); e.stopPropagation(); } }
    function ku(e) { keys[(e.key || "").toLowerCase()] = false; }
    window.addEventListener("keydown", kd, true); window.addEventListener("keyup", ku, true);
    function joyMove(e) { var r = joy.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), m = Math.hypot(dx, dy), max = r.width / 2 - 10; if (m > max) { dx *= max / m; dy *= max / m; } knob.style.transform = "translate(" + dx + "px," + dy + "px)"; joyV.x = dx / max; joyV.y = dy / max; }
    joy.addEventListener("pointerdown", function (e) { joyV.id = e.pointerId; try { joy.setPointerCapture(e.pointerId); } catch (_) {} joyMove(e); e.preventDefault(); e.stopPropagation(); });
    joy.addEventListener("pointermove", function (e) { if (e.pointerId === joyV.id) joyMove(e); });
    function joyEnd(e) { if (e.pointerId !== joyV.id) return; joyV.id = null; joyV.x = joyV.y = 0; knob.style.transform = ""; }
    joy.addEventListener("pointerup", joyEnd); joy.addEventListener("pointercancel", joyEnd); joy.addEventListener("lostpointercapture", joyEnd);
    jumpBtn.addEventListener("pointerdown", function (e) { jumpQ = true; e.preventDefault(); e.stopPropagation(); });
    var yaw = 0, pitch = 0.4, camDist = 14.5, introT = 2.2;
    cvs.addEventListener("pointerdown", function (e) { look.id = e.pointerId; look.x = e.clientX; look.y = e.clientY; try { cvs.setPointerCapture(e.pointerId); } catch (_) {} e.preventDefault(); });
    cvs.addEventListener("pointermove", function (e) { if (e.pointerId !== look.id) return; yaw -= (e.clientX - look.x) * 0.008; pitch = clamp(pitch + (e.clientY - look.y) * 0.005, 0.05, 1.1); look.x = e.clientX; look.y = e.clientY; });
    function lookEnd(e) { if (e.pointerId === look.id) look.id = null; }
    cvs.addEventListener("pointerup", lookEnd); cvs.addEventListener("pointercancel", lookEnd);
    function onWheel(e) { camDist = clamp(camDist + e.deltaY * 0.01, 6, 20); e.preventDefault(); }
    cvs.addEventListener("wheel", onWheel, { passive: false });

    /* ---------- player ---------- */
    var pl = { x: 0, y: 0, z: 45, vy: 0, fx: 0, fz: 0, ground: true, face: Math.PI, walk: 0, spd: 0 };
    var ride = null, rideCool = 0, t = 0, chaseT = 0, U = player.userData;
    function groundAt(x, z, y) { var h = 0; for (var i = 0; i < cols.length; i++) { var c = cols[i]; if (c.tree) continue; if (x > c.x0 && x < c.x1 && z > c.z0 && z < c.z1 && y >= c.top - 0.6) h = Math.max(h, c.top); } return h; }
    function collide() {
      var r = 0.55;
      for (var i = 0; i < cols.length; i++) {
        var c = cols[i]; if (pl.y >= c.top - 0.55) continue;
        var nx = clamp(pl.x, c.x0, c.x1), nz = clamp(pl.z, c.z0, c.z1), dx = pl.x - nx, dz = pl.z - nz, d2 = dx * dx + dz * dz;
        if (d2 < r * r) {
          if (d2 > 1e-6) { var d = Math.sqrt(d2); pl.x = nx + dx / d * r; pl.z = nz + dz / d * r; }
          else { var m = [pl.x - c.x0, c.x1 - pl.x, pl.z - c.z0, c.z1 - pl.z], k = m.indexOf(Math.min.apply(null, m)); if (k === 0) pl.x = c.x0 - r; else if (k === 1) pl.x = c.x1 + r; else if (k === 2) pl.z = c.z0 - r; else pl.z = c.z1 + r; }
        }
      }
      pl.x = clamp(pl.x, -55.8, 55.8); pl.z = clamp(pl.z, -55.8, pl.x > -7 && pl.x < 7 ? 52 : 55.8);
    }
    function addCoins(n, why) { P.coins += n; sessionCoins += n; save(); updHud(); if (why) toast(why); }
    function startRide(type) {
      if (type === "ferris") {
        var best = 0, by = 1e9, wp = new THREE.Vector3(); FW.gond.forEach(function (gd, i) { gd.hang.getWorldPosition(wp); if (wp.y < by) { by = wp.y; best = i; } });
        ride = { type: type, gi: best, t: 0, dur: 11.5 }; FW.speed = 0.48; toast("🎡 Enjoy the view!");
      } else { CO.u = 0.03; ride = { type: type, t: 0, dur: 45, lastU: CO.u }; toast("🎢 Hold on tight!"); }
      talkEl.style.display = "none"; api.sfx.win();
    }
    function endRide() {
      var tp = ride.type; ride = null; rideCool = 2.5; FW.speed = 0.22;
      if (tp === "ferris") { pl.x = -30; pl.z = -16.2; yaw = 0; } else { pl.x = 22; pl.z = -2.6; yaw = 0; }
      pl.y = 0; pl.vy = 0; pl.fx = pl.fz = 0; player.quaternion.identity(); U.body.position.y = 0;
      var first = !P.done[tp], amt = first ? 30 : 10; P.done[tp] = true;
      addCoins(amt, (tp === "ferris" ? "🎡 Ferris wheel" : "🎢 Coaster") + " complete! +" + amt + " coins"); api.sfx.win();
    }
    function startRush() { rush = { i: 0, t: 28 }; rings.forEach(function (r) { r.visible = true; }); timerEl.style.display = "block"; toast("⚡ COIN RUSH! Run through all 9 gold rings!"); api.sfx.good(); }
    function endRush(ok) {
      rings.forEach(function (r) { r.visible = false; }); timerEl.style.display = "none"; rush = null;
      if (ok) { var first = !P.done.rush, amt = first ? 50 : 20; P.done.rush = true; addCoins(amt, "⚡ Coin Rush complete! +" + amt + " coins"); api.sfx.win(); }
      else { toast("⏱ Time's up! Step on the pad to try again"); api.sfx.bad(); }
    }
    function questComplete() {
      P.finished = true; P.done.quest = true; save(); updHud(); api.sfx.win();
      var rides = ["ferris", "coaster", "rush"].filter(function (k) { return P.done[k]; }).length;
      setTimeout(function () {
        api.panel({ title: "Quest complete! 🏆", lines: [{ t: "You found all 5 Nino tokens!" }, { t: P.coins + " coins", big: true }, { t: "★ " + nStars() + "/8 stars · " + rides + "/3 activities" }],
          buttons: [{ label: "Keep exploring", fn: function () { api.hidePanel(); } },
            { label: "💬 Text Nino my score", cls: "t", fn: function () { api.textNino("I found all 5 Nino tokens in Nino Land with " + P.coins + " coins 🎮"); } },
            { label: "Game Center", cls: "g", fn: api.showMenu }] });
      }, 800);
    }

    /* ---------- update ---------- */
    var tmpV = new THREE.Vector3(), tmpV2 = new THREE.Vector3(), camTarget = new THREE.Vector3(0, 2.4, 40), camPos = new THREE.Vector3(0, 30, 82), cc = new THREE.Color();
    function placeSeg(seg, u) { var p = CO.curve.getPointAt(u), tg = CO.curve.getTangentAt(u); seg.position.copy(p); seg.lookAt(p.x + tg.x, p.y + tg.y, p.z + tg.z); }
    function update(dt) {
      t += dt; rideCool = Math.max(0, rideCool - dt);
      if (toastT > 0) { toastT -= dt; if (toastT <= 0) toastEl.classList.remove("on"); }
      FW.g.rotation.z += dt * FW.speed;
      for (var i = 0; i < FW.gond.length; i++) FW.gond[i].piv.rotation.z = -FW.g.rotation.z;
      chaseT += dt; if (chaseT > 0.12) { chaseT = 0; var ph = Math.floor(t * 8); for (i = 0; i < 96; i++) { cc.setHSL(((i >> 1) / 48 + t * 0.12) % 1, 1, ((i >> 1) + ph) % 4 === 0 ? 0.8 : 0.55); FW.lights.setColorAt(i, cc); } FW.lights.instanceColor.needsUpdate = true; }
      CA.g.rotation.y += dt * 0.55; for (i = 0; i < CA.horses.length; i++) CA.horses[i].g.position.y = 2.2 + Math.sin(t * 2.4 + i * 0.8) * 0.45;
      water1.scale.set(1 + Math.sin(t * 6) * 0.05, 1 + Math.sin(t * 5) * 0.08, 1 + Math.cos(t * 6) * 0.05); water2.scale.y = 1 + Math.sin(t * 8) * 0.15;
      var cpy = CO.curve.getPointAt(CO.u).y; CO.v = Math.sqrt(36 + 2 * 12 * Math.max(0, 16.5 - cpy)) * 0.8;
      CO.u = (CO.u + CO.v * dt / CO.len) % 1;
      for (i = 0; i < CO.segs.length; i++) placeSeg(CO.segs[i], (CO.u - i * 2.3 / CO.len + 1) % 1);
      var spin = t * 2.6;
      for (i = 0; i < coins.length; i++) { var c = coins[i], s = c.got ? 0 : 1; dummy.position.set(c.x, c.y + Math.sin(t * 3 + i) * 0.12, c.z); dummy.rotation.set(0, spin + i * 0.3, 0); dummy.scale.set(s, s, s); dummy.updateMatrix(); coinMesh.setMatrixAt(i, dummy.matrix); }
      coinMesh.instanceMatrix.needsUpdate = true;
      for (i = 0; i < stars.length; i++) { var st = stars[i], s2 = st.got ? 0 : 1; dummy.position.set(st.x, st.y + Math.sin(t * 2 + i) * 0.2, st.z); dummy.rotation.set(0, t * 1.8 + i, 0); dummy.scale.set(s2, s2, s2); dummy.updateMatrix(); starMesh.setMatrixAt(i, dummy.matrix); st.g.visible = !st.got; }
      starMesh.instanceMatrix.needsUpdate = true;
      for (i = 0; i < tokens.length; i++) { var tk = tokens[i]; if (tk.got) continue; tk.m.rotation.y = t * 2.2 + i; tk.m.position.y = tokPos[i][1] + Math.sin(t * 2 + i) * 0.25; tk.g.position.y = tk.m.position.y; tk.g.material.opacity = 0.55 + Math.sin(t * 4 + i) * 0.25; }
      for (i = 0; i < pads.length; i++) { var pd = pads[i]; pd.m.material.opacity = 0.65 + Math.sin(t * 4 + i) * 0.3; if (pd.tr) pd.tr.scale.y = Math.min(1, pd.tr.scale.y + dt * 3); if (pd.label) pd.label.position.y = 2.6 + Math.sin(t * 3 + i) * 0.15; }
      bubble.position.y = 5.6 + Math.sin(t * 2.5) * 0.15; bubble.visible = !P.quest;
      npc.userData.armR.rotation.x = -2.2 + Math.sin(t * 5) * 0.35;

      if (ride) return updRide(dt);

      var ix = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0) + joyV.x;
      var iz = (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0) + joyV.y;
      var im = Math.hypot(ix, iz); if (im > 1) { ix /= im; iz /= im; im = 1; }
      if (im > 0.05 && !moved) { moved = true; hintEl.style.opacity = "0"; }
      var fwx = -Math.sin(yaw), fwz = -Math.cos(yaw), rtx = Math.cos(yaw), rtz = -Math.sin(yaw);
      var mx = fwx * -iz + rtx * ix, mz = fwz * -iz + rtz * ix, speed = 9.5;
      pl.x += (mx * speed + pl.fx) * dt; pl.z += (mz * speed + pl.fz) * dt;
      if (im > 0.05) { pl.face = lerpAng(pl.face, Math.atan2(mx, mz), Math.min(1, dt * 12)); if (look.id == null && iz < 0.3) yaw = lerpAng(yaw, Math.atan2(-mx, -mz), dt * 0.9 * im); }
      pl.spd += (im - pl.spd) * Math.min(1, dt * 10);
      collide();
      var gh = groundAt(pl.x, pl.z, pl.y);
      if (jumpQ && pl.ground) { pl.vy = 11.5; pl.ground = false; api.sfx.good(); }
      jumpQ = false;
      pl.vy -= 30 * dt; pl.y += pl.vy * dt;
      if (pl.y <= gh) { pl.y = gh; pl.vy = 0; pl.ground = true; pl.fx = pl.fz = 0; } else if (pl.y > gh + 0.05) pl.ground = false;
      for (i = 0; i < pads.length; i++) {
        var p = pads[i], dx = pl.x - p.x, dz = pl.z - p.z;
        if (dx * dx + dz * dz > 1.7 * 1.7 || pl.y > 0.6) continue;
        if (p.type === "jump") { if (pl.vy <= 0) { pl.vy = p.vy; pl.ground = false; var fl = p.vy / 30 * 1.15; pl.fx = (p.tx - pl.x) / fl; pl.fz = (p.tz - pl.z) / fl; p.tr.scale.y = 0.35; api.sfx.good(); if (!P.jumped) { P.jumped = true; save(); toast("🚀 Boing! Grab the rooftop star!"); } } }
        else if ((p.type === "ferris" || p.type === "coaster") && !rideCool) { startRide(p.type); return; }
        else if (p.type === "rush" && !rush && !rideCool) { startRush(); rideCool = 1; }
      }
      var cy = pl.y + 1.6;
      for (i = 0; i < coins.length; i++) { var c2 = coins[i]; if (c2.got) continue; var ddx = c2.x - pl.x, ddz = c2.z - pl.z; if (ddx * ddx + ddz * ddz < 1.9 && Math.abs(c2.y - cy) < 1.9) { c2.got = true; addCoins(1); api.sfx.good(); } }
      for (i = 0; i < stars.length; i++) { var s3 = stars[i]; if (s3.got) continue; if (Math.hypot(s3.x - pl.x, s3.z - pl.z) < 1.7 && Math.abs(s3.y - cy) < 2.2) { s3.got = true; P.stars.push(i); addCoins(10, "⭐ Star found! +10 coins"); api.sfx.win(); } }
      for (i = 0; i < tokens.length; i++) { var tk2 = tokens[i]; if (tk2.got) continue; if (Math.hypot(tk2.m.position.x - pl.x, tk2.m.position.z - pl.z) < 1.9 && Math.abs(tk2.m.position.y - cy) < 2.3) { tk2.got = true; tk2.m.visible = tk2.g.visible = false; P.tokens.push(tk2.i); P.quest = true; addCoins(25, "🟣 Nino token " + P.tokens.length + "/5! +25 coins"); api.sfx.win(); if (P.tokens.length >= 5 && !P.finished) questComplete(); } }
      var allGot = true; for (i = 0; i < coins.length; i++) if (!coins[i].got) { allGot = false; break; } if (allGot) coins.forEach(function (c) { c.got = false; });
      if (rush) {
        rush.t -= dt; timerEl.textContent = "⚡ " + Math.ceil(rush.t) + "s  ·  " + rush.i + "/9";
        for (i = 0; i < rings.length; i++) { var rg = rings[i]; rg.visible = i >= rush.i; rg.material.opacity = i === rush.i ? 0.95 : 0.28; var rs = i === rush.i ? 1 + Math.sin(t * 8) * 0.08 : 1; rg.scale.set(rs, rs, rs); }
        var rp = rings[rush.i].position; if (Math.hypot(rp.x - pl.x, rp.z - pl.z) < 1.9 && Math.abs(rp.y - (pl.y + 1.4)) < 2) { rush.i++; addCoins(2); api.sfx.good(); if (rush.i >= rings.length) endRush(true); }
        if (rush && rush.t <= 0) endRush(false);
      }
      var nd = Math.hypot(pl.x + 6, pl.z - 7);
      if (nd < 4.2) {
        if (talkEl.style.display !== "block") {
          talkEl.innerHTML = "<b>Park Guide</b>" + (P.finished ? "You found every Nino token, legend! 🏆 Ride the wheel and the coaster, or try the Coin Rush for more coins." : "Welcome to Nino Land! 🎡 Nino hid <em>5 purple N tokens</em> around the park: behind shops, by the rides, even up on a rooftop. Find them all! Green pads bounce you up to the roofs ⭐");
          talkEl.style.display = "block"; if (!P.quest) { P.quest = true; save(); updHud(); }
        }
        npc.rotation.y = lerpAng(npc.rotation.y, Math.atan2(pl.x + 6, pl.z - 7), dt * 5);
      } else if (talkEl.style.display === "block") talkEl.style.display = "none";
      player.position.set(pl.x, pl.y, pl.z); player.rotation.set(0, pl.face, 0);
      pl.walk += dt * 11 * pl.spd;
      var sw = Math.sin(pl.walk) * 0.75 * pl.spd;
      if (!pl.ground) { U.legL.rotation.x = -0.6; U.legR.rotation.x = 0.35; U.armL.rotation.x = -2.5; U.armR.rotation.x = -2.5; }
      else { U.legL.rotation.x = sw; U.legR.rotation.x = -sw; U.armL.rotation.x = -sw; U.armR.rotation.x = sw; }
      U.body.position.y = pl.ground ? Math.abs(Math.cos(pl.walk)) * 0.12 * pl.spd : 0;
      U.cape.rotation.x = 0.12 + pl.spd * 0.55 + (pl.ground ? Math.sin(t * 9) * 0.06 * pl.spd : 0.6);
      tmpV.set(pl.x, pl.y + 2.6, pl.z); camTarget.lerp(tmpV, Math.min(1, dt * (introT > 0 ? 3 : 10)));
      tmpV2.set(camTarget.x + Math.sin(yaw) * Math.cos(pitch) * camDist, Math.max(camTarget.y + Math.sin(pitch) * camDist + 0.6, 0.8), camTarget.z + Math.cos(yaw) * Math.cos(pitch) * camDist);
      introT = Math.max(0, introT - dt); camPos.lerp(tmpV2, Math.min(1, dt * (introT > 0 ? 1.6 : 8))); camera.position.copy(camPos); camera.lookAt(camTarget);
      sun.position.set(pl.x + 30, 50, pl.z + 22); sun.target.position.set(pl.x, 0, pl.z);
    }
    function updRide(dt) {
      ride.t += dt;
      U.legL.rotation.x = U.legR.rotation.x = -1.4; U.armL.rotation.x = U.armR.rotation.x = -2.6 + Math.sin(t * 6) * 0.3; U.cape.rotation.x = 0.3;
      if (ride.type === "ferris") {
        var wp = new THREE.Vector3(0, -2.45, 0); FW.gond[ride.gi].hang.localToWorld(wp);
        player.position.set(wp.x, wp.y - 0.55, wp.z + 0.1); player.rotation.set(0, 0, 0); U.body.position.y = 0;
        tmpV.set(FW.c.x + 17, FW.c.y + 3, FW.c.z + 21); camera.position.lerp(tmpV, Math.min(1, dt * 2)); camera.lookAt(wp.x, wp.y + 1.5, wp.z);
        sun.position.set(wp.x + 30, 50, wp.z + 22); sun.target.position.set(wp.x, 0, wp.z);
        if (ride.t > ride.dur) endRide();
      } else {
        var seg = CO.segs[0], cp = seg.position, tg = CO.curve.getTangentAt(CO.u);
        player.position.copy(cp); player.quaternion.copy(seg.quaternion); player.translateY(0.15); player.translateZ(-0.2); U.body.position.y = 0;
        tmpV.copy(cp).addScaledVector(tg, -10); tmpV.y += 7; camera.position.lerp(tmpV, Math.min(1, dt * 4));
        tmpV2.copy(cp).addScaledVector(tg, 9); tmpV2.y += 0.5; camera.lookAt(tmpV2);
        sun.position.set(cp.x + 30, 50, cp.z + 22); sun.target.position.set(cp.x, 0, cp.z);
        if ((ride.lastU > 0.9 && CO.u < 0.1) || ride.t > ride.dur) endRide(); else ride.lastU = CO.u;
      }
    }

    /* ---------- loop ---------- */
    var raf = 0, last = 0, running = false, frames = 0, fpsT = 0, fps = 0, qT = 0, qL = 0;
    function frame(ts) {
      raf = requestAnimationFrame(frame);
      var rdt = Math.max(0, (ts - last) / 1000), dt = Math.min(0.05, rdt); last = ts;
      update(dt); renderer.render(scene, camera);
      frames++; fpsT += rdt; if (fpsT >= 1) { fps = frames / fpsT; frames = 0; fpsT = 0; }
      qT += rdt; if (qT > 3 && fps && !window.__nlNoAdapt) { qT = 0; if (fps < 36 && qL === 0) { qL = 1; renderer.setPixelRatio(1); onResize(); } else if (fps < 22 && qL === 1) { qL = 2; sun.castShadow = false; } }
    }
    function resume() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
    function pause() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; keys = {}; joyV.x = joyV.y = 0; knob.style.transform = ""; }
    function onResize() { W = host.clientWidth || W; H = host.clientHeight || H; renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); }
    window.addEventListener("resize", onResize);
    player.position.set(pl.x, pl.y, pl.z); player.rotation.y = pl.face; camera.position.copy(camPos); camera.lookAt(camTarget);
    resume();
    setTimeout(function () { if (running) toast(P.quest ? "🎡 Welcome back to Nino Land!" : "🎡 Welcome to Nino Land!", 2.6); }, 300);

    function stop() {
      pause(); save();
      window.removeEventListener("keydown", kd, true); window.removeEventListener("keyup", ku, true); window.removeEventListener("resize", onResize);
      scene.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.isInstancedMesh && o.dispose) o.dispose(); });
      Object.keys(mats).forEach(function (k) { mats[k].dispose(); }); textures.forEach(function (tx) { tx.dispose(); });
      renderer.dispose(); try { renderer.forceContextLoss(); } catch (e) {}
      if (cvs.parentNode) cvs.parentNode.removeChild(cvs); if (hud.parentNode) hud.parentNode.removeChild(hud);
    }
    return {
      stop: stop, pause: pause, resume: resume,
      _dbg: function () { return { x: +pl.x.toFixed(2), y: +pl.y.toFixed(2), z: +pl.z.toFixed(2), coins: P.coins, session: sessionCoins, stars: nStars(), tokens: P.tokens.length, ride: ride && ride.type, rush: rush && rush.i, fps: Math.round(fps), q: qL, calls: renderer.info.render.calls, tris: renderer.info.render.triangles }; },
      _tp: function (x, z, y) { pl.x = x; pl.z = z; pl.y = y || 0; pl.vy = 0; }, _keys: function () { return keys; }, _cam: function (y, p, d) { yaw = y; if (p != null) pitch = p; if (d != null) camDist = d; }
    };
  }
  window.NinoLand = { start: start };
})();

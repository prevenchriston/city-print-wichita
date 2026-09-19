/* City Print — interactions & motion.
   Everything animates transform/opacity only; all motion respects prefers-reduced-motion. */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var cfg = window.CITYPRINT || {};
  var raf = window.requestAnimationFrame.bind(window);

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function clamp(n, a, b) { return Math.min(b, Math.max(a, n)); }

  /* ---------- 1. hero entrance ---------- */
  function ready() {
    raf(function () { raf(function () { root.classList.add("is-ready"); }); });
  }
  if (document.fonts && document.fonts.ready && !reduced) {
    // wait briefly for the display face so the headline doesn't reflow mid-animation
    Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 700); })]).then(ready);
  } else {
    ready();
  }

  /* ---------- 2. scroll reveal + stagger ---------- */
  $$("[data-stagger]").forEach(function (parent) {
    $$("[data-reveal]", parent).forEach(function (el, i) { el.style.setProperty("--i", i % 6); });
  });
  var revealEls = $$("[data-reveal]");
  if ("IntersectionObserver" in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- 3. header: ink-coverage progress (C → M → Y → K) ---------- */
  var plates = $$(".ink-bar i");
  var ticking = false;
  var callbar = $(".callbar");
  var quoteSection = $("#quote");
  var quoteVisible = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    raf(function () {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var p = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
      plates.forEach(function (el, i) { el.style.setProperty("--p", clamp(p * 4 - i, 0, 1).toFixed(3)); });
      if (callbar) callbar.classList.toggle("show", window.scrollY > 520 && !quoteVisible);
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  if (quoteSection && "IntersectionObserver" in window) {
    new IntersectionObserver(function (en) { quoteVisible = en[0].isIntersecting; onScroll(); }, { threshold: 0.15 }).observe(quoteSection);
  }

  /* ---------- 4. mobile menu ---------- */
  var burger = $(".burger");
  var menu = $("#menu");
  function setMenu(open) {
    if (!burger || !menu) return;
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.classList.toggle("open", open);
    menu.toggleAttribute("inert", !open);
    document.body.style.overflow = open ? "hidden" : "";
    if (open) { var f = $("a", menu); if (f) setTimeout(function () { f.focus(); }, 60); }
  }
  if (burger && menu) {
    menu.setAttribute("inert", "");
    burger.addEventListener("click", function () { setMenu(burger.getAttribute("aria-expanded") !== "true"); });
    $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") { setMenu(false); burger.focus(); } });
    window.matchMedia("(min-width: 980px)").addEventListener("change", function (m) { if (m.matches) setMenu(false); });
  }

  /* ---------- 5. hero parallax (fine pointers only) ---------- */
  var stage = $(".stage");
  if (stage && !reduced && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    var tx = 0, ty = 0, cx = 0, cy = 0, running = false;
    function loop() {
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      stage.style.setProperty("--px", cx.toFixed(3));
      stage.style.setProperty("--py", cy.toFixed(3));
      if (Math.abs(tx - cx) > 0.002 || Math.abs(ty - cy) > 0.002) raf(loop); else running = false;
    }
    var hero = $(".hero");
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (!running) { running = true; raf(loop); }
    }, { passive: true });
    hero.addEventListener("pointerleave", function () { tx = 0; ty = 0; if (!running) { running = true; raf(loop); } });
  }

  /* ---------- 6. count-up stats ---------- */
  var counters = $$("[data-count]");
  function runCount(el) {
    var end = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduced) { el.textContent = end + suffix; return; }
    var t0 = null, dur = 1400;
    function step(t) {
      if (t0 === null) t0 = t;
      var k = clamp((t - t0) / dur, 0, 1);
      var eased = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(end * eased) + suffix;
      if (k < 1) raf(step);
    }
    raf(step);
  }
  if ("IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { runCount(e.target); cio.unobserve(e.target); } });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  /* ---------- 7. black-plate → full-color slider ---------- */
  var ba = $(".ba");
  if (ba) {
    var handle = $(".ba__handle", ba);
    var pos = 50, userTouched = false, dragging = false;
    function setPos(p, fromUser) {
      pos = clamp(p, 0, 100);
      ba.style.setProperty("--pos", pos + "%");
      handle.setAttribute("aria-valuenow", Math.round(pos));
      if (fromUser) userTouched = true;
    }
    function fromEvent(e) {
      var r = ba.getBoundingClientRect();
      setPos(((e.clientX - r.left) / r.width) * 100, true);
    }
    ba.addEventListener("pointerdown", function (e) {
      dragging = true; ba.setPointerCapture(e.pointerId); fromEvent(e);
    });
    ba.addEventListener("pointermove", function (e) { if (dragging) fromEvent(e); });
    ["pointerup", "pointercancel"].forEach(function (t) { ba.addEventListener(t, function () { dragging = false; }); });
    handle.addEventListener("keydown", function (e) {
      var step = e.shiftKey ? 10 : 4;
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") { setPos(pos - step, true); e.preventDefault(); }
      else if (e.key === "ArrowRight" || e.key === "ArrowUp") { setPos(pos + step, true); e.preventDefault(); }
      else if (e.key === "Home") { setPos(0, true); e.preventDefault(); }
      else if (e.key === "End") { setPos(100, true); e.preventDefault(); }
    });
    setPos(reduced ? 50 : 8);
    if (!reduced && "IntersectionObserver" in window) {
      var sio = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return;
        sio.disconnect();
        var t0 = null, from = 8, to = 62, dur = 2200;
        (function sweep(t) {
          if (userTouched) return;
          if (t0 === null) t0 = t;
          var k = clamp((t - t0) / dur, 0, 1);
          var e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
          setPos(from + (to - from) * e, false);
          if (k < 1) raf(sweep);
        })(performance.now());
      }, { threshold: 0.55 });
      sio.observe(ba);
    }
  }

  /* ---------- 8. product → quote form preselect ---------- */
  var productSel = $("#product");
  $$("[data-product]").forEach(function (a) {
    a.addEventListener("click", function () {
      var v = a.getAttribute("data-product");
      if (productSel) {
        var found = false;
        Array.prototype.forEach.call(productSel.options, function (o) { if (o.value === v) { productSel.value = v; found = true; } });
        if (!found) productSel.value = "Something else";
      }
    });
  });

  /* ---------- 9. reviews (rendered only if real reviews are supplied) ---------- */
  var reviews = Array.isArray(cfg.reviews) ? cfg.reviews : [];
  var rsec = $("#reviews");
  if (rsec && reviews.length) {
    var star = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z"/></svg>';
    var grid = $(".rgrid", rsec);
    grid.innerHTML = "";
    reviews.forEach(function (r, i) {
      var fig = document.createElement("figure");
      fig.className = "review";
      fig.setAttribute("data-reveal", "");
      fig.style.setProperty("--i", i % 6);
      var n = clamp(parseInt(r.rating || 5, 10), 1, 5);
      var stars = document.createElement("div");
      stars.className = "review__stars";
      stars.setAttribute("role", "img");
      stars.setAttribute("aria-label", n + " out of 5 stars");
      stars.innerHTML = new Array(n + 1).join(star);
      var bq = document.createElement("blockquote");
      bq.textContent = "“" + r.text + "”";
      var cap = document.createElement("figcaption");
      var b = document.createElement("b"); b.textContent = r.name || "Customer";
      cap.appendChild(b);
      if (r.source) cap.appendChild(document.createTextNode(" · " + r.source));
      fig.appendChild(stars); fig.appendChild(bq); fig.appendChild(cap);
      grid.appendChild(fig);
      if (reduced || !("IntersectionObserver" in window)) fig.classList.add("in"); else io.observe(fig);
    });
    if (cfg.reviewsUrl) {
      var l = $(".reviews__link", rsec);
      if (l) { l.href = cfg.reviewsUrl; l.hidden = false; }
    }
    rsec.hidden = false;
    $$('a[href="#reviews"]').forEach(function (a) { a.hidden = false; });
  }

  /* ---------- 10. quote form ---------- */
  var form = $("#quote-form");
  if (form) {
    var status = $(".form__status", form);
    var btn = $("button[type=submit]", form);
    function say(msg, cls) { status.textContent = msg; status.className = "form__status " + (cls || ""); }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.hp && form.hp.value) return; // honeypot
      if (!form.checkValidity()) { form.reportValidity(); say("Please fill in the highlighted fields.", "err"); return; }
      var d = {};
      new FormData(form).forEach(function (v, k) { if (k !== "hp") d[k] = String(v).trim(); });
      var lines = [
        "Name: " + d.name, "Company: " + (d.company || "-"), "Email: " + d.email, "Phone: " + (d.phone || "-"),
        "Product: " + d.product, "Quantity: " + (d.quantity || "-"), "", "Details:", d.details || "-"
      ];
      if (cfg.formEndpoint) {
        btn.disabled = true; say("Sending…");
        fetch(cfg.formEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(d) })
          .then(function (r) { if (!r.ok) throw new Error(); say("Thank you! A City Print rep will be in touch shortly.", "ok"); form.reset(); })
          .catch(function () { say("Something went wrong. Please call (316) 267-5555.", "err"); })
          .then(function () { btn.disabled = false; });
      } else {
        var subject = "Quote request: " + d.product + (d.company ? " — " + d.company : "");
        window.location.href = "mailto:" + (cfg.formEmail || "sales@cityprintusa.com") + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(lines.join("\n"));
        say("Opening your email app with your request ready to send…", "ok");
      }
    });
  }

  var yr = $("#year");
  if (yr) yr.textContent = new Date().getFullYear();
})();

/* ==========================================================================
   theme.js — ambient motion, nav, reveal, progress
   Everything degrades gracefully; all motion is opt-out aware.
   ========================================================================== */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------------------------------------------------- Cursor spotlight -- */

  function initSpotlight() {
    var el = document.querySelector(".spotlight");
    if (!el || reduceMotion || !canHover) return;

    var targetX = window.innerWidth / 2;
    var targetY = window.innerHeight / 3;
    var x = targetX;
    var y = targetY;
    var raf = null;

    function loop() {
      x += (targetX - x) * 0.12;
      y += (targetY - y) * 0.12;
      el.style.transform = "translate3d(" + x + "px," + y + "px,0)";
      raf = requestAnimationFrame(loop);
    }

    window.addEventListener("pointermove", function (e) {
      targetX = e.clientX;
      targetY = e.clientY;
      document.body.classList.add("pointer-active");
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });

    document.addEventListener("mouseleave", function () {
      document.body.classList.remove("pointer-active");
    });
  }

  /* ------------------------------------------------------- Particle field -- */

  function initParticles() {
    var canvas = document.getElementById("particles");
    if (!canvas || reduceMotion) return;

    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var dots = [];
    var w = 0;
    var h = 0;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var running = true;
    var raf = null;

    function size() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }

    function build() {
      var count = Math.min(64, Math.max(22, Math.round((w * h) / 34000)));
      dots = [];
      for (var i = 0; i < count; i++) {
        dots.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.5 + 0.4,
          vx: (Math.random() - 0.5) * 0.16,
          vy: (Math.random() - 0.5) * 0.16,
          a: Math.random() * 0.32 + 0.06,
          tw: Math.random() * Math.PI * 2
        });
      }
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);

      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        d.x += d.vx;
        d.y += d.vy;
        d.tw += 0.015;

        if (d.x < -10) d.x = w + 10;
        if (d.x > w + 10) d.x = -10;
        if (d.y < -10) d.y = h + 10;
        if (d.y > h + 10) d.y = -10;

        var alpha = d.a * (0.6 + 0.4 * Math.sin(d.tw));
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255," + alpha.toFixed(3) + ")";
        ctx.fill();
      }

      if (running) raf = requestAnimationFrame(frame);
    }

    size();
    raf = requestAnimationFrame(frame);

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(size, 180);
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        raf = null;
      } else if (!running) {
        running = true;
        raf = requestAnimationFrame(frame);
      }
    });
  }

  /* ------------------------------------------------------ Reveal on scroll -- */

  function initReveal() {
    var items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      for (var i = 0; i < items.length; i++) items[i].classList.add("is-in");
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = parseInt(el.getAttribute("data-delay") || "0", 10);
        setTimeout(function () { el.classList.add("is-in"); }, delay);
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.12 });

    for (var j = 0; j < items.length; j++) io.observe(items[j]);
  }

  /* ----------------------------------------------------------- Sticky nav -- */

  function initNav() {
    var nav = document.querySelector(".site-nav");
    var toggle = document.querySelector(".nav-toggle");
    var menu = document.querySelector(".mobile-menu");

    function onScroll() {
      if (!nav) return;
      if (window.scrollY > 10) nav.classList.add("is-stuck");
      else nav.classList.remove("is-stuck");
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (toggle && menu) {
      toggle.addEventListener("click", function () {
        var open = menu.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
      menu.addEventListener("click", function (e) {
        if (e.target.tagName === "A") {
          menu.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
        }
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && menu.classList.contains("is-open")) {
          menu.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
          toggle.focus();
        }
      });
    }
  }

  /* ------------------------------------------------------- Scroll progress -- */

  function initProgress() {
    var bar = document.querySelector(".progress-bar");
    if (!bar) return;

    function update() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - doc.clientHeight;
      var pct = max > 0 ? (doc.scrollTop / max) * 100 : 0;
      bar.style.width = Math.min(100, Math.max(0, pct)) + "%";
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  /* --------------------------------------------------------- Hero typing -- */

  function initTyping() {
    var el = document.querySelector("[data-type]");
    if (!el) return;

    var phrases = (el.getAttribute("data-type") || "").split("|").filter(Boolean);
    if (!phrases.length) return;

    if (reduceMotion) {
      el.textContent = phrases[0];
      return;
    }

    var text = "";
    var phrase = 0;
    var char = 0;
    var deleting = false;

    function tick() {
      var full = phrases[phrase];
      if (!deleting) {
        char++;
        text = full.slice(0, char);
        if (char === full.length) {
          deleting = true;
          el.textContent = text;
          return setTimeout(tick, 2100);
        }
      } else {
        char--;
        text = full.slice(0, char);
        if (char === 0) {
          deleting = false;
          phrase = (phrase + 1) % phrases.length;
          el.textContent = "";
          return setTimeout(tick, 380);
        }
      }
      el.textContent = text;
      setTimeout(tick, deleting ? 34 : 68);
    }

    setTimeout(tick, 700);
  }

  /* ------------------------------------------------------------ Count up -- */

  function initCounters() {
    var nodes = document.querySelectorAll("[data-count]");
    if (!nodes.length) return;

    function run(el) {
      var end = parseFloat(el.getAttribute("data-count"));
      var suffix = el.getAttribute("data-suffix") || "";
      if (reduceMotion || isNaN(end)) {
        el.textContent = end + suffix;
        return;
      }
      var start = performance.now();
      var dur = 1100;

      function step(now) {
        var p = Math.min(1, (now - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(end * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    if (!("IntersectionObserver" in window)) {
      for (var i = 0; i < nodes.length; i++) run(nodes[i]);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        run(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.5 });

    for (var j = 0; j < nodes.length; j++) io.observe(nodes[j]);
  }

  /* ---------------------------------------------------------------- Boot -- */

  function boot() {
    initSpotlight();
    initParticles();
    initReveal();
    initNav();
    initProgress();
    initTyping();
    initCounters();

    var year = document.querySelector("[data-year]");
    if (year) year.textContent = String(new Date().getFullYear());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

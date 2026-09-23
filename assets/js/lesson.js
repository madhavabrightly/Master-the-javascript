/* ==========================================================================
   lesson.js — TOC scrollspy, reading progress, copy buttons, quiz
   ========================================================================== */

(function () {
  "use strict";

  /* -------------------------------------------------------- Scrollspy TOC -- */

  function initScrollspy() {
    var links = Array.prototype.slice.call(document.querySelectorAll(".toc a[href^='#']"));
    if (!links.length) return;

    var targets = links
      .map(function (link) {
        var id = link.getAttribute("href").slice(1);
        var el = document.getElementById(id);
        return el ? { link: link, el: el } : null;
      })
      .filter(Boolean);

    if (!targets.length) return;

    function update() {
      var line = window.scrollY + parseInt(getComputedStyle(document.documentElement).scrollPaddingTop || "90", 10) + 8;
      var current = targets[0];

      for (var i = 0; i < targets.length; i++) {
        if (targets[i].el.offsetTop <= line) current = targets[i];
      }

      // bottom of page => last section
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 4) {
        current = targets[targets.length - 1];
      }

      for (var j = 0; j < targets.length; j++) {
        targets[j].link.classList.toggle("is-active", targets[j] === current);
      }
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  /* ---------------------------------------------------- Reading progress -- */

  function initReadingProgress() {
    var fill = document.querySelector(".aside-progress .bar i");
    var pct = document.querySelector(".aside-progress .pct");
    var article = document.querySelector(".prose");
    if (!fill || !article) return;

    function update() {
      var top = article.offsetTop;
      var height = article.offsetHeight - window.innerHeight * 0.4;
      var scrolled = window.scrollY - top + window.innerHeight * 0.3;
      var value = height > 0 ? (scrolled / height) * 100 : 0;
      value = Math.min(100, Math.max(0, value));

      fill.style.width = value + "%";
      if (pct) pct.textContent = Math.round(value) + "%";
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  /* ---------------------------------------------------------- Copy button -- */

  function initCopyButtons() {
    var buttons = document.querySelectorAll(".copy-btn");

    Array.prototype.forEach.call(buttons, function (btn) {
      btn.addEventListener("click", function () {
        var block = btn.closest(".code-block");
        var code = block ? block.querySelector("pre code, pre") : null;
        if (!code) return;

        var text = code.innerText;

        function done() {
          var original = btn.getAttribute("data-label") || btn.textContent;
          btn.setAttribute("data-label", original);
          btn.classList.add("is-done");
          btn.textContent = "Copied";
          setTimeout(function () {
            btn.classList.remove("is-done");
            btn.textContent = original;
          }, 1600);
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, fallback);
        } else {
          fallback();
        }

        function fallback() {
          var ta = document.createElement("textarea");
          ta.value = text;
          ta.setAttribute("readonly", "");
          ta.style.position = "fixed";
          ta.style.top = "-1000px";
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand("copy"); done(); } catch (e) { /* noop */ }
          document.body.removeChild(ta);
        }
      });
    });
  }

  /* ----------------------------------------------------------------- Quiz -- */

  function initQuiz() {
    var questions = document.querySelectorAll(".quiz-q");

    Array.prototype.forEach.call(questions, function (q) {
      var options = q.querySelectorAll(".quiz-opt");
      var explain = q.querySelector(".quiz-explain");

      Array.prototype.forEach.call(options, function (opt) {
        opt.addEventListener("click", function () {
          var isCorrect = opt.getAttribute("data-correct") === "true";

          Array.prototype.forEach.call(options, function (o) {
            o.disabled = true;
            if (o.getAttribute("data-correct") === "true") o.classList.add("is-correct");
            else if (o === opt) o.classList.add("is-wrong");
          });

          if (explain) explain.classList.add("is-shown");
          opt.setAttribute("aria-pressed", isCorrect ? "true" : "false");
        });
      });
    });
  }

  /* ---------------------------------------------------------- Back to top -- */

  function initBackToTop() {
    var btn = document.querySelector(".to-top");
    if (!btn) return;

    function update() {
      btn.classList.toggle("is-shown", window.scrollY > 620);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });

    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------------------------------------------------------------- Boot -- */

  function boot() {
    initScrollspy();
    initReadingProgress();
    initCopyButtons();
    initQuiz();
    initBackToTop();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

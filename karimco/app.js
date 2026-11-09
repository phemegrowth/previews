/* Karimco Holdings site script */
(function () {
  // ---- settings to fill in before launch ----
  var CONFIG = {
    // URL that receives enquiries (e.g. a Google Apps Script web app writing to the leads sheet).
    // Leave empty and the form shows a "not connected yet" notice instead of pretending to send.
    endpoint: "",
    whatsapp: "35799254691"
  };

  var root = document.documentElement;

  // ---- every new page opens at the top (unless the link points to a section) ----
  try { if ("scrollRestoration" in history) history.scrollRestoration = "manual"; } catch (e) {}
  function toTop() {
    var hh = location.hash || "";
    if (hh.length > 1 && hh !== "#villas" && hh !== "#apartments") return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    try { document.body.scrollIntoView({ block: "start", behavior: "instant" }); } catch (e) {}
  }
  toTop();
  window.addEventListener("pageshow", function (e) { if (e.persisted) toTop(); });

  // ---- language ----
  function getSaved() { try { return localStorage.getItem("karimco-lang"); } catch (e) { return null; } }
  function save(l) { try { localStorage.setItem("karimco-lang", l); } catch (e) {} }
  function applyLang(l) {
    root.dataset.lang = l;
    root.lang = l === "el" || l === "ar" ? l : "en";
    root.dir = l === "ar" ? "rtl" : "ltr";
    document.querySelectorAll("[data-en]").forEach(function (el) {
      var v = el.getAttribute("data-" + l) || el.getAttribute("data-en");
      if (el.hasAttribute("data-attr")) el.setAttribute(el.getAttribute("data-attr"), v);
      else el.textContent = v;
    });
    document.querySelectorAll(".lang button").forEach(function (b) {
      b.setAttribute("aria-pressed", b.dataset.set === l ? "true" : "false");
    });
    var t = document.querySelector("title[data-en]");
    if (t) document.title = t.getAttribute("data-" + l);
  }
  var browserLang = (navigator.language || "").toLowerCase().slice(0, 2);
  // ?lang=ar / ?lang=el / ?lang=en in a link (e.g. from an ad) picks the language and remembers it
  var urlLang = null;
  try { urlLang = new URLSearchParams(location.search).get("lang"); } catch (e) {}
  if (urlLang === "en" || urlLang === "el" || urlLang === "ar") save(urlLang);
  var initial = getSaved() || (browserLang === "el" || browserLang === "ar" ? browserLang : "en");
  applyLang(initial);
  document.addEventListener("click", function (e) {
    var b = e.target.closest(".lang button");
    if (b) { applyLang(b.dataset.set); save(b.dataset.set); }
  });

  // ---- mobile menu ----
  var menuBtn = document.querySelector(".menu-btn");
  var mnav = document.querySelector(".mobile-nav");
  if (menuBtn && mnav) {
    menuBtn.addEventListener("click", function () {
      var open = mnav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    mnav.addEventListener("click", function (e) { if (e.target.closest("a")) { mnav.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); } });
  }

  // ---- WhatsApp links carry the page's project ----
  document.querySelectorAll("[data-wa]").forEach(function (a) {
    var proj = a.getAttribute("data-wa");
    var msg = proj ? "Hello, I'm interested in " + proj + ". Could you send me prices and availability?" :
      "Hello, I'd like information about your Karimco projects.";
    a.href = "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(msg);
  });

  // ---- gallery lightbox ----
  var dlg = document.querySelector(".lightbox");
  var shots = Array.prototype.slice.call(document.querySelectorAll(".gallery button"));
  var idx = 0;
  function show(i) {
    idx = (i + shots.length) % shots.length;
    var img = shots[idx].querySelector("img");
    var big = dlg.querySelector("img");
    big.src = img.src; big.alt = img.alt;
    dlg.querySelector(".lb-count").textContent = (idx + 1) + " / " + shots.length;
  }
  if (dlg && shots.length) {
    shots.forEach(function (b, i) { b.addEventListener("click", function () { show(i); dlg.showModal(); }); });
    dlg.querySelector(".lb-prev").addEventListener("click", function () { show(idx - 1); });
    dlg.querySelector(".lb-next").addEventListener("click", function () { show(idx + 1); });
    dlg.querySelector(".lb-close").addEventListener("click", function () { dlg.close(); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") show(idx - 1);
      if (e.key === "ArrowRight") show(idx + 1);
    });
  }

  // ---- enquiry form ----
  var form = document.getElementById("enquiry");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var lang = root.dataset.lang || "en";
      var ok = true;
      ["f-name", "f-phone"].forEach(function (id) {
        var input = document.getElementById(id);
        var err = document.getElementById(id + "-err");
        var bad = !input.value.trim() || (id === "f-phone" && input.value.replace(/\D/g, "").length < 8);
        err.hidden = !bad; ok = ok && !bad;
        input.setAttribute("aria-invalid", bad ? "true" : "false");
      });
      if (!ok) return;

      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      data.page = location.pathname.split("/").pop() || "home";
      data.language = lang;
      data.submitted = new Date().toISOString();
      try {
        var q = new URLSearchParams(location.search);
        ["utm_source", "utm_medium", "utm_campaign", "utm_content", "fbclid"].forEach(function (k) { if (q.get(k)) data[k] = q.get(k); });
      } catch (err) {}

      var done = document.getElementById("form-done");
      var btn = form.querySelector("button[type=submit]");
      if (!CONFIG.endpoint) {
        done.querySelector(".done-live").hidden = true;
        done.querySelector(".done-preview").hidden = false;
        done.hidden = false;
        return;
      }
      btn.disabled = true;
      fetch(CONFIG.endpoint, { method: "POST", mode: "no-cors", body: new URLSearchParams(data) })
        .then(function () {
          form.querySelectorAll(".field, .budgets, .form-foot").forEach(function (n) { n.hidden = true; });
          done.querySelector(".done-preview").hidden = true;
          done.querySelector(".done-live").hidden = false;
          done.hidden = false;
        })
        .catch(function () {
          btn.disabled = false;
          document.getElementById("form-fail").hidden = false;
        });
    });
  }

  // optional images (e.g. founder portrait not supplied yet) fall back to their placeholder
  document.querySelectorAll("img[data-optional]").forEach(function (img) {
    function miss() { img.parentNode.classList.add("missing"); }
    if (img.complete && !img.naturalWidth) miss();
    img.addEventListener("error", miss);
  });

  // ---- project filter (projects page) ----
  var filterBtns = document.querySelectorAll(".filters button");
  if (filterBtns.length) {
    var items = document.querySelectorAll("[data-type]");
    var list = document.getElementById("project-list");
    var bar = document.getElementById("filters");
    function setFilter(key, scroll) {
      filterBtns.forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.filter === key ? "true" : "false"); });
      items.forEach(function (el) {
        var show = key === "all" || el.dataset.type === key;
        el.hidden = !show;
        el.classList.remove("show");
        if (show) { void el.offsetWidth; el.classList.add("show"); }
      });
      // keep alternating image sides tidy for the visible rows
      var n = 0;
      document.querySelectorAll(".proj-row").forEach(function (r) { if (!r.hidden) { r.classList.toggle("flip", n % 2 === 1); n++; } });
      if (scroll && list && bar) {
        var y = list.getBoundingClientRect().top + window.scrollY - bar.offsetHeight - 80;
        if (window.scrollY > y) window.scrollTo({ top: y, behavior: "smooth" });
      }
    }
    filterBtns.forEach(function (b) { b.addEventListener("click", function () { setFilter(b.dataset.filter, true); }); });
    // projects.html#villas or #apartments opens pre-filtered (handy for ads)
    function fromHash() {
      var h = (location.hash || "").replace("#", "");
      if (h === "villas") setFilter("villa", false);
      else if (h === "apartments") setFilter("apartment", false);
    }
    fromHash();
    window.addEventListener("hashchange", fromHash);
  }

  // ---- background videos: load when they come near the screen, play only while visible ----
  var noMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var saveData = !!(navigator.connection && navigator.connection.saveData);
  var phone = window.matchMedia("(max-width: 700px)").matches;
  var canHover = window.matchMedia("(hover: hover)").matches;
  var vids = Array.prototype.slice.call(document.querySelectorAll("video.bgv"));
  vids.forEach(function (v) { if (phone && v.dataset.posterM) v.poster = v.dataset.posterM; });
  function load(v) {
    if (v.dataset.loaded) return;
    v.src = phone && v.dataset.srcM ? v.dataset.srcM : v.dataset.src;
    v.dataset.loaded = "1";
  }
  function play(v) {
    load(v);
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
    v.classList.add("playing");
  }
  function stop(v) { v.pause(); v.classList.remove("playing"); }
  if (!noMotion && !saveData && vids.length) {
    var hoverVids = canHover ? vids.filter(function (v) { return v.classList.contains("card-vid"); }) : [];
    hoverVids.forEach(function (v) {
      var host = v.closest(".card, .proj-img");
      host.addEventListener("mouseenter", function () { play(v); });
      host.addEventListener("mouseleave", function () { stop(v); });
    });
    var watched = vids.filter(function (v) { return hoverVids.indexOf(v) < 0; });
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) play(e.target); else stop(e.target); });
      }, { threshold: 0.35 });
      watched.forEach(function (v) { io.observe(v); });
    } else {
      watched.forEach(play);
    }
  }

  // ---- films: poster with a play button, swapped for the real video (with sound) on click ----
  document.addEventListener("click", function (e) {
    var b = e.target.closest(".film-play");
    if (!b) return;
    document.querySelectorAll(".film video").forEach(function (o) { o.pause(); });
    var v = document.createElement("video");
    v.src = b.dataset.film; v.controls = true; v.autoplay = true; v.setAttribute("playsinline", "");
    v.poster = b.querySelector("img").src;
    b.replaceWith(v);
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
  });

  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();

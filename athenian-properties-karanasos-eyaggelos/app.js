/* Athenian Properties: number-led hero, header, menu, reveals, count-up, cursor image on service rows, card carousels, form. No dependencies. */
(function () {
  'use strict';
  var d = document;
  var html = d.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Hero (mechanic G): count-up and arch reveal; start on the first frame, never wait for fonts or images. */
  if (reduce) {
    html.classList.add('is-ready');
  } else {
    requestAnimationFrame(function () { requestAnimationFrame(function () { html.classList.add('is-ready'); }); });
  }

  /* Hero photo drifts slower than the page (transform only) */
  var photo = d.querySelector('.hero__arch img');
  if (photo && !reduce) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = Math.min(window.scrollY, 900);
        photo.style.transform = 'translate3d(0,' + (y * 0.1).toFixed(1) + 'px,0) scale(1.1)';
        ticking = false;
      });
    }, { passive: true });
  }

  /* Header shrink */
  var header = d.querySelector('.header');
  function onScroll() { if (header) header.classList.toggle('is-small', window.scrollY > 40); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile menu */
  var burger = d.querySelector('.burger');
  var menu = d.getElementById('menu');
  function setMenu(open) {
    if (!burger || !menu) return;
    menu.classList.toggle('is-open', open);
    d.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Κλείσιμο μενού' : 'Άνοιγμα μενού');
    if (open) { var first = menu.querySelector('a'); if (first) first.focus(); }
  }
  if (burger && menu) {
    burger.addEventListener('click', function () { setMenu(!menu.classList.contains('is-open')); });
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); burger.focus(); }
    });
  }

  /* Smooth anchor scroll with header offset */
  d.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) { e.preventDefault(); return; }
      var t = d.querySelector(id);
      if (!t) return;
      e.preventDefault();
      var off = header ? header.offsetHeight + 8 : 0;
      window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - off, behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  /* Scroll reveals: in view at load shows at once, the rest when it arrives (60ms stagger per group) */
  function reveal(els, cb) {
    if ('IntersectionObserver' in window && !reduce) {
      var io = new IntersectionObserver(function (entries) {
        var k = 0;
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            var el = en.target;
            setTimeout(function () { cb(el); }, (k++) * 70);
            io.unobserve(el);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      els.forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) cb(el);
        else io.observe(el);
      });
    } else {
      els.forEach(cb);
    }
  }
  reveal(d.querySelectorAll('.r'), function (el) { el.classList.add('is-in'); });

  /* Count-up (sourced quantities only) */
  reveal(d.querySelectorAll('.count'), function (el) {
    var to = parseInt(el.getAttribute('data-to'), 10);
    if (reduce || !to) { el.textContent = to; return; }
    var t0 = null, dur = 1200;
    function tick(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    }
    el.textContent = '0';
    requestAnimationFrame(tick);
  });

  /* Service rows: the photo follows the cursor (desktop pointers only) */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduce) {
    d.querySelectorAll('.row').forEach(function (row) {
      var img = row.querySelector('.row__img');
      if (!img) return;
      row.addEventListener('mousemove', function (e) {
        var r = row.getBoundingClientRect();
        img.style.setProperty('--x', (e.clientX - r.left) + 'px');
        img.style.setProperty('--y', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* Listing card carousels: buttons, dots, swipe via native scroll */
  d.querySelectorAll('[data-slides]').forEach(function (box) {
    var track = box.querySelector('.slides__track');
    var imgs = track.querySelectorAll('img');
    var dots = box.querySelector('.slides__dots');
    imgs.forEach(function () { dots.appendChild(d.createElement('span')); });
    function idx() { return Math.round(track.scrollLeft / track.clientWidth); }
    function paint() { var n = idx(); dots.querySelectorAll('span').forEach(function (s, i) { s.classList.toggle('is-on', i === n); }); }
    function go(n) {
      n = (n + imgs.length) % imgs.length;
      track.scrollTo({ left: n * track.clientWidth, behavior: reduce ? 'auto' : 'smooth' });
    }
    box.querySelector('.slides__btn--prev').addEventListener('click', function () { go(idx() - 1); });
    box.querySelector('.slides__btn--next').addEventListener('click', function () { go(idx() + 1); });
    track.addEventListener('scroll', function () { window.requestAnimationFrame(paint); }, { passive: true });
    paint();
  });

  /* Form validation with inline messages */
  var form = d.querySelector('form.form');
  if (form) {
    var rules = {
      name: function (v) { return v.trim().length >= 2; },
      phone: function (v) { return v.replace(/\D/g, '').length >= 10; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); },
      topic: function (v) { return v !== ''; },
      message: function (v) { return v.trim().length >= 10; }
    };
    function check(el) {
      var fn = rules[el.name];
      if (!fn) return true;
      var ok = fn(el.value);
      var field = el.closest('.field');
      if (field) field.classList.toggle('is-bad', !ok);
      el.setAttribute('aria-invalid', ok ? 'false' : 'true');
      var err = d.getElementById('e-' + el.name);
      if (err) el.setAttribute('aria-describedby', err.id);
      return ok;
    }
    Object.keys(rules).forEach(function (n) {
      var el = form.elements[n];
      if (!el) return;
      el.addEventListener('blur', function () { if (el.value !== '') check(el); });
      el.addEventListener('input', function () { if (el.closest('.field').classList.contains('is-bad')) check(el); });
    });
    form.addEventListener('submit', function (e) {
      var firstBad = null;
      Object.keys(rules).forEach(function (n) {
        var el = form.elements[n];
        if (el && !check(el) && !firstBad) firstBad = el;
      });
      if (firstBad) { e.preventDefault(); firstBad.focus(); }
    });
  }

  /* Footer year */
  d.querySelectorAll('[data-year]').forEach(function (y) { y.textContent = new Date().getFullYear(); });
})();

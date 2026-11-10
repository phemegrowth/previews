(function () {
  var d = document, de = d.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // loader (home only, once per session)
  var intro = d.querySelector('.intro');
  if (intro) {
    if (reduce) { de.classList.add('seen'); }
    else {
      d.body.classList.add('is-intro');
      var done = function () {
        intro.classList.add('out');
        setTimeout(function () {
          de.classList.add('seen'); d.body.classList.remove('is-intro');
          try { sessionStorage.setItem('gl-intro', '1'); } catch (e) {}
        }, 1400);
      };
      setTimeout(done, 2900);
      intro.addEventListener('click', done);
    }
  }

  // sticky header
  var hdr = d.querySelector('.hdr');
  function onScroll() { if (hdr) hdr.classList.toggle('stuck', window.scrollY > 20); }
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

  // mobile menu
  var m = d.querySelector('.mnav');
  function setMenu(o) { if (!m) return; m.classList.toggle('open', o); d.body.style.overflow = o ? 'hidden' : ''; }
  d.querySelectorAll('[data-menu-open]').forEach(function (b) { b.addEventListener('click', function () { setMenu(true); }); });
  d.querySelectorAll('[data-menu-close]').forEach(function (b) { b.addEventListener('click', function () { setMenu(false); }); });
  d.querySelectorAll('.mnav a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  // reveals
  var els = d.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (e) { io.observe(e); });
  } else { els.forEach(function (e) { e.classList.add('in'); }); }

  // count-up
  d.querySelectorAll('[data-count]').forEach(function (el) {
    var end = parseInt(el.getAttribute('data-count'), 10), suf = el.getAttribute('data-suffix') || '';
    if (reduce || !('IntersectionObserver' in window)) { el.textContent = end + suf; return; }
    var go = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return; go.disconnect();
      var t0 = null;
      (function step(t) { if (!t0) t0 = t; var p = Math.min((t - t0) / 1600, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suf; if (p < 1) requestAnimationFrame(step); })(performance.now());
    }, { threshold: .6 });
    go.observe(el);
  });

  // form validation
  d.querySelectorAll('form[data-validate]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      var bad = null;
      f.querySelectorAll('[required]').forEach(function (i) { if (!i.value.trim() && !bad) bad = i; });
      if (bad) { e.preventDefault(); bad.focus(); bad.setAttribute('aria-invalid', 'true'); }
    });
  });
})();

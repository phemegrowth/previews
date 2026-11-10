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

/* scroll-driven plate hero: 97 frames on a canvas, played by the scroll */
(function () {
  var sec = document.querySelector('.plate'); if (!sec) return;
  var pin = sec.querySelector('.plate-pin'), cv = sec.querySelector('.plate-cv'), ctx = cv.getContext('2d');
  var N = parseInt(sec.getAttribute('data-frames'), 10), path = sec.getAttribute('data-path');
  var words = sec.querySelectorAll('.plate-w'), nEl = sec.querySelector('.plate-n b'), capEl = sec.querySelector('.plate-cap');
  var cue = sec.querySelector('.plate-cue'), bar = sec.querySelector('.plate-bar');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var imgs = new Array(N), ready = new Array(N), cw = 0, ch = 0, cur = 0, target = 0, last = -1, raf = 0, wi = -1;

  function url(i) { return path + ('00' + (i + 1)).slice(-3) + '.webp'; }
  function load(i) {
    if (imgs[i]) return; var im = new Image(); im.decoding = 'async';
    im.onload = function () { ready[i] = true; if (nearest(Math.round(cur)) === i || last < 0) { last = -1; draw(); } };
    im.src = url(i); imgs[i] = im;
  }
  // checkpoint order: first, last, then every 16th, 8th, 4th, 2nd, rest
  var order = [0, N - 1];
  [16, 8, 4, 2, 1].forEach(function (st) { for (var i = 0; i < N; i += st) if (order.indexOf(i) < 0) order.push(i); });
  var q = 0; (function pump() { for (var k = 0; k < 6 && q < order.length; k++) load(order[q++]); if (q < order.length) setTimeout(pump, 40); })();

  function nearest(i) { for (var d = 0; d < N; d++) { if (ready[i - d]) return i - d; if (ready[i + d]) return i + d; } return -1; }

  function size() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2), r = cv.getBoundingClientRect();
    cw = Math.max(1, Math.round(r.width * dpr)); ch = Math.max(1, Math.round(r.height * dpr));
    if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; }
    last = -1; draw();
  }
  function draw() {
    var i = nearest(Math.round(cur)); if (i < 0 || i === last) return; var im = imgs[i]; if (!im || !im.naturalWidth) return;
    last = i; var desk = window.innerWidth > 900, s = Math.max(cw / im.naturalWidth, ch / im.naturalHeight) * (desk ? 0.87 : 1), dw = im.naturalWidth * s, dh = im.naturalHeight * s;
    var x = (cw - dw) / 2 + (desk ? cw * 0.15 : 0), y = (ch - dh) / 2;
    ctx.fillStyle = '#1b1a18'; ctx.fillRect(0, 0, cw, ch); ctx.drawImage(im, x, y, dw, dh);
  }
  function progress() {
    var r = sec.getBoundingClientRect(), total = sec.offsetHeight - pin.offsetHeight;
    return total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
  }
  function beat(p) {
    var w = p < 0.03 ? -1 : p < 0.36 ? 0 : p < 0.68 ? 1 : 2;
    if (w === wi) return; wi = w;
    words.forEach(function (el, k) { el.classList.toggle('on', k === w); });
    if (capEl) capEl.classList.toggle('live', w >= 0); if (nEl && w >= 0) nEl.textContent = '0' + (w + 1);
  }
  function tick() {
    var p = progress(), play = Math.min(1, p / 0.9);  // rest on the finished dish for the last 10%
    target = play * (N - 1); cur += (target - cur) * 0.14; if (Math.abs(target - cur) < 0.02) cur = target;
    draw(); beat(p);
    if (bar) bar.style.transform = 'scaleX(' + p + ')'; if (cue) cue.style.opacity = p > 0.02 ? 0 : 1;
    raf = (cur !== target) ? requestAnimationFrame(tick) : 0;
  }
  function kick() { if (!raf) raf = requestAnimationFrame(tick); }

  if (reduce) { sec.classList.add('static'); cur = N - 1; load(N - 1); size(); window.addEventListener('resize', size); return; }
  window.addEventListener('scroll', kick, { passive: true }); window.addEventListener('resize', function () { size(); kick(); });
  size(); kick();
})();

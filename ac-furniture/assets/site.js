// A.C Furniture – menu, header, reveals, portfolio filter + lightbox, form prefill.
(function () {
  var d = document;
  d.documentElement.classList.remove('no-js');

  var hdr = d.querySelector('.hdr');
  var onScroll = function () { if (hdr) hdr.classList.toggle('scrolled', window.scrollY > 12); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  var mnav = d.querySelector('.mnav');
  var openMenu = function (o) { if (!mnav) return; mnav.classList.toggle('open', o); d.body.style.overflow = o ? 'hidden' : ''; };
  d.querySelectorAll('[data-menu-open]').forEach(function (b) { b.addEventListener('click', function () { openMenu(true); }); });
  d.querySelectorAll('[data-menu-close], .mnav a').forEach(function (b) { b.addEventListener('click', function () { openMenu(false); }); });

  var rv = d.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    rv.forEach(function (el, i) { el.style.transitionDelay = ((i % 3) * 90) + 'ms'; io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add('in'); });

  // portfolio filter (?cat=kitchens deep link)
  var fb = d.querySelectorAll('.filters button');
  var setCat = function (c) {
    fb.forEach(function (x) { x.setAttribute('aria-pressed', x.dataset.cat === c); });
    d.querySelectorAll('[data-cat-item]').forEach(function (it) { it.hidden = c !== 'all' && it.dataset.catItem !== c; });
  };
  fb.forEach(function (b) { b.addEventListener('click', function () { setCat(b.dataset.cat); }); });
  var q = new URLSearchParams(location.search);
  if (fb.length && q.get('cat')) setCat(q.get('cat'));

  // lightbox
  var lb = d.querySelector('.lb');
  if (lb) {
    var img = lb.querySelector('img'), cap = lb.querySelector('p'), idx = 0;
    var vis = function () { return [].slice.call(d.querySelectorAll('.work')).filter(function (w) { return !w.hidden; }); };
    var show = function (i) {
      var list = vis(); if (!list.length) return;
      idx = (i + list.length) % list.length;
      var w = list[idx];
      img.src = w.querySelector('img').src; img.alt = w.querySelector('img').alt;
      cap.textContent = w.dataset.title;
      lb.classList.add('open'); d.body.style.overflow = 'hidden';
    };
    var close = function () { lb.classList.remove('open'); d.body.style.overflow = ''; };
    d.querySelectorAll('.work').forEach(function (w) { w.addEventListener('click', function () { show(vis().indexOf(w)); }); });
    lb.querySelector('.lb-x').addEventListener('click', close);
    lb.querySelector('.lb-p').addEventListener('click', function () { show(idx - 1); });
    lb.querySelector('.lb-n').addEventListener('click', function () { show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    d.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
  }
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape') openMenu(false); });

  // contact form: ?piece=kitchens ticks that chip
  var piece = q.get('piece');
  if (piece) d.querySelectorAll('input[name="piece[]"]').forEach(function (c) { if (c.value === piece) c.checked = true; });
})();

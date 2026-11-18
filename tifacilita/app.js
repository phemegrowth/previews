(function () {
  var d = document, root = d.documentElement;
  root.classList.add('js');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };

  $$('[data-year]').forEach(function (e) { e.textContent = new Date().getFullYear(); });

  /* header + menu */
  var hd = $('#hd'), burger = $('#burger'), menu = $('#menu');
  function setMenu(open) {
    menu.hidden = !open;
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Chiudi il menu' : 'Apri il menu');
    d.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', function () { setMenu(menu.hidden); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); burger.focus(); } });

  /* headings: split into lines after fonts load */
  function split(el) {
    var label = el.textContent.replace(/\s+/g, ' ').trim(), i = 0;
    function wrap(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = d.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (w) {
            if (!w) return;
            if (/^\s+$/.test(w)) { frag.appendChild(d.createTextNode(' ')); return; }
            var ln = d.createElement('span'), inn = d.createElement('span');
            ln.className = 'ln'; inn.textContent = w; inn.style.transitionDelay = (i++ * 0.045) + 's';
            ln.appendChild(inn); frag.appendChild(ln);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeName !== 'BR') wrap(n);
      });
    }
    wrap(el);
    el.setAttribute('aria-label', label);
  }

  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }) : null;
  function settle(el) { setTimeout(function () { el.classList.add('done'); }, 2600); }
  var io2 = 'MutationObserver' in window ? new MutationObserver(function (ms) { ms.forEach(function (m) { if (m.target.classList.contains('in') && !m.target.dataset.st) { m.target.dataset.st = 1; settle(m.target); } }); }) : null;
  function watch(el) { if (io2) io2.observe(el, { attributes: true, attributeFilter: ['class'] }); if (io) io.observe(el); else el.classList.add('in'); }

  $$('.rv').forEach(watch);
  var ready = (d.fonts && d.fonts.ready) ? d.fonts.ready : Promise.resolve();
  var timeout = new Promise(function (r) { setTimeout(r, 1500); });
  Promise.race([ready, timeout]).then(function () {
    $$('[data-split]').forEach(function (el) { if (!reduce) split(el); watch(el); });
  });

  /* word scrub */
  var scrub = $('[data-scrub]'), words = [];
  if (scrub && !reduce) {
    var txt = scrub.textContent.trim().split(/\s+/);
    scrub.setAttribute('aria-label', txt.join(' '));
    scrub.textContent = '';
    txt.forEach(function (w) {
      var s = d.createElement('span'); s.className = 'w'; s.textContent = w; s.setAttribute('aria-hidden', 'true');
      scrub.appendChild(s); scrub.appendChild(d.createTextNode(' ')); words.push(s);
    });
  }

  /* parallax + scroll state: one rAF per scroll */
  var pars = reduce ? [] : $$('[data-par]'), tick = false;
  function frame() {
    tick = false;
    var vh = innerHeight, y = scrollY;
    hd.classList.toggle('sc', y > 12);
    var rects = pars.map(function (p) { return p.parentElement.getBoundingClientRect(); });
    var sr = words.length ? scrub.getBoundingClientRect() : null;
    pars.forEach(function (p, i) {
      var r = rects[i]; if (r.bottom < -100 || r.top > vh + 100) return;
      var prog = (r.top + r.height / 2 - vh / 2) / vh;
      p.style.transform = 'translate3d(0,' + (-6 + prog * -6).toFixed(2) + '%,0)';
    });
    if (sr) {
      var p2 = Math.min(1, Math.max(0, (vh * 0.85 - sr.top) / (sr.height + vh * 0.35)));
      var n = Math.round(p2 * words.length);
      words.forEach(function (w, i) { w.classList.toggle('on', i < n); });
    }
  }
  addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(frame); } }, { passive: true });
  addEventListener('resize', frame);
  frame();

  /* services: active item swaps the photo */
  var svcs = $$('.svc'), media = $$('.svc-media img');
  function setSvc(i) {
    svcs.forEach(function (s, j) { s.classList.toggle('on', j === i); });
    media.forEach(function (m, j) { m.classList.toggle('on', j === i); });
  }
  if (svcs.length && media.length) {
    svcs.forEach(function (s, i) {
      s.addEventListener('mouseenter', function () { setSvc(i); });
      s.addEventListener('focusin', function () { setSvc(i); });
    });
    if ('IntersectionObserver' in window) {
      var sio = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) setSvc(+e.target.dataset.svc); });
      }, { rootMargin: '-45% 0px -45% 0px' });
      svcs.forEach(function (s) { sio.observe(s); });
    }
  }

  /* count up */
  if (io && !reduce) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; cio.unobserve(e.target);
        var el = e.target, to = +el.dataset.count, t0 = null;
        function step(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / 1200); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    $$('[data-count]').forEach(function (el) { cio.observe(el); });
  }

  /* price calculator */
  var calc = $('[data-calc]');
  if (calc) {
    var BANK = 1000000, MAXP = 1300000;
    var chf = function (n) { return 'CHF ' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '’'); };
    var c = function (k) { return $('[data-c="' + k + '"]', calc); };
    var range = $('input[type=range]', calc);
    var upd = function () {
      var price = +range.value, mort = BANK * 0.8, eq = price - mort, pct = eq / price * 100;
      c('price').textContent = chf(price); c('mort').textContent = chf(mort); c('eq').textContent = chf(eq);
      c('bar-m').style.width = (mort / MAXP * 100) + '%'; c('bar-e').style.width = (eq / MAXP * 100) + '%';
      c('pct').textContent = (Math.round(pct * 10) / 10).toString().replace('.', ',') + '%';
      c('msg').textContent = pct <= 20.5 ? 'È la soglia abituale: la vendita può andare in porto.'
        : pct < 27 ? 'Sono ' + chf(price - BANK) + ' in più da trovare: molti acquirenti si fermano qui.'
        : 'Sono ' + chf(price - BANK) + ' oltre la stima: spesso la trattativa non va in porto.';
    };
    range.addEventListener('input', upd); upd();
  }

  /* drag to scroll the places strip */
  $$('[data-drag]').forEach(function (el) {
    var down = false, sx = 0, sl = 0;
    el.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = true; sx = e.clientX; sl = el.scrollLeft; el.classList.add('drag'); });
    addEventListener('pointermove', function (e) { if (down) el.scrollLeft = sl - (e.clientX - sx); });
    addEventListener('pointerup', function () { down = false; el.classList.remove('drag'); });
  });

  /* forms */
  function check(scope) {
    var ok = true;
    $$('[required]', scope).forEach(function (f) {
      var bad;
      if (f.type === 'radio') { bad = !$$('input[name="' + f.name + '"]:checked', scope).length; f.closest('.opts').classList.toggle('bad', bad); }
      else if (f.type === 'checkbox') { bad = !f.checked; f.closest('.chk').classList.toggle('bad', bad); }
      else { bad = !f.value.trim() || (f.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.value)) || (f.type === 'tel' && f.value.replace(/\D/g, '').length < 7); f.classList.toggle('bad', bad); }
      if (bad) ok = false;
    });
    return ok;
  }
  d.addEventListener('input', function (e) { if (e.target.classList) e.target.classList.remove('bad'); });
  d.addEventListener('change', function (e) { var o = e.target.closest && e.target.closest('.opts,.chk'); if (o) o.classList.remove('bad'); });

  $$('[data-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = check(form); $('.f-err', form).hidden = ok;
      if (ok) location.href = 'grazie.html';
    });
  });

  var wiz = $('[data-wiz]');
  if (wiz) {
    var steps = $$('.wz', wiz), cur = 0, next = $('[data-wiz-next]', wiz), back = $('[data-wiz-back]', wiz), err = $('.f-err', wiz);
    var qs = new URLSearchParams(location.search);
    var tipo = qs.get('tipo'), comune = qs.get('comune');
    if (tipo) $$('input[name=tipo]', wiz).forEach(function (r) { if (r.value === tipo) r.checked = true; });
    if (comune) wiz.elements.comune.value = comune.slice(0, 60);
    var show = function (i) {
      cur = i;
      steps.forEach(function (s, j) { s.classList.toggle('on', j === i); });
      $('[data-wiz-n]', wiz).textContent = i + 1;
      $('.wiz-bar i', wiz).style.width = ((i + 1) / steps.length * 100) + '%';
      back.hidden = i === 0; err.hidden = true;
      next.firstChild.textContent = i === steps.length - 1 ? 'Invia la richiesta ' : 'Avanti ';
    };
    next.addEventListener('click', function () {
      if (!check(steps[cur])) { err.hidden = false; return; }
      if (cur < steps.length - 1) { show(cur + 1); var f = $('input,select', steps[cur]); if (f && innerWidth > 860) f.focus(); }
      else location.href = 'grazie.html';
    });
    back.addEventListener('click', function () { show(cur - 1); });
    wiz.addEventListener('submit', function (e) { e.preventDefault(); next.click(); });
    wiz.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'BUTTON') { e.preventDefault(); next.click(); } });
    if (tipo && comune) show(2); else if (tipo) show(1);
    $$('input[name=tipo]', wiz).forEach(function (r) { r.addEventListener('change', function () { if (cur === 0) setTimeout(function () { next.click(); }, 220); }); });
  }
})();

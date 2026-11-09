// C.C Metal Designs – menu, header, reveals, project filter, product configurator, preview cart.
(function () {
  var d = document, root = d.documentElement;
  root.classList.remove('no-js');
  var lang = root.lang === 'el' ? 'el' : 'en';
  var T = window.CC_T || {};

  // header shadow
  var hdr = d.querySelector('.hdr');
  var onScroll = function () { if (hdr) hdr.classList.toggle('scrolled', window.scrollY > 12); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // mobile menu
  var mnav = d.querySelector('.mnav');
  var openMenu = function (o) { if (!mnav) return; mnav.classList.toggle('open', o); d.body.style.overflow = o ? 'hidden' : ''; };
  d.querySelectorAll('[data-menu-open]').forEach(function (b) { b.addEventListener('click', function () { openMenu(true); }); });
  d.querySelectorAll('[data-menu-close], .mnav a').forEach(function (b) { b.addEventListener('click', function () { openMenu(false); }); });

  // reveals
  var rv = d.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    rv.forEach(function (el, i) { el.style.transitionDelay = ((i % 4) * 80) + 'ms'; io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add('in'); });

  // project filter
  var fb = d.querySelectorAll('.filters button');
  fb.forEach(function (b) {
    b.addEventListener('click', function () {
      fb.forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      var c = b.dataset.cat;
      d.querySelectorAll('[data-cat-item]').forEach(function (it) { it.hidden = c !== 'all' && it.dataset.catItem !== c; });
    });
  });

  // prefill forms (?product=…)
  var q = new URLSearchParams(location.search);
  var pre = q.get('product');
  if (pre) d.querySelectorAll('textarea[name=message]').forEach(function (t) { if (!t.value) t.value = pre + '\n'; });
  if (q.get('type')) d.querySelectorAll('select[name=project-type]').forEach(function (s) { s.value = q.get('type'); });

  // cart (preview only: lives in this browser)
  var KEY = 'ccmd-cart';
  var load = function () { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } };
  var save = function (c) { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {} };
  var cart = load();
  var eur = function (n) { return '€' + n.toLocaleString('en-GB'); };
  var prefix = d.body.dataset.prefix || '';

  function render() {
    var n = cart.reduce(function (s, i) { return s + i.qty; }, 0);
    d.querySelectorAll('.cart-count').forEach(function (el) { el.textContent = n || ''; el.dataset.n = n; });
    var box = d.querySelector('.drawer .items'); if (!box) return;
    if (!cart.length) { box.innerHTML = '<p class="empty">' + T.empty + '</p>'; }
    else box.innerHTML = cart.map(function (i, k) {
      return '<div class="ci"><img src="' + prefix + i.img + '" alt=""><div><b>' + i.name[lang] + '</b>' + i.desc[lang] +
        '<br>× ' + i.qty + ' <button class="rm" data-rm="' + k + '">' + T.remove + '</button></div><div>' + eur(i.price * i.qty) + '</div></div>';
    }).join('');
    var tot = cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
    var te = d.querySelector('.drawer .tot b'); if (te) te.textContent = eur(tot);
    var co = d.querySelector('[data-checkout]'); if (co) co.disabled = !cart.length;
  }
  d.addEventListener('click', function (e) {
    var rm = e.target.closest('[data-rm]');
    if (rm) { cart.splice(+rm.dataset.rm, 1); save(cart); render(); }
    if (e.target.closest('[data-cart-open]')) d.body.classList.add('cart-open');
    if (e.target.closest('[data-cart-close]')) d.body.classList.remove('cart-open');
    var co = e.target.closest('[data-checkout]');
    if (co) { var nt = d.querySelector('[data-checkout-note]'); if (nt) nt.hidden = false; }
  });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape') { d.body.classList.remove('cart-open'); openMenu(false); } });
  render();

  // product configurator
  var cfg = d.querySelector('[data-product]');
  if (cfg) {
    var P = JSON.parse(d.getElementById('product-data').textContent);
    var priceEl = cfg.querySelector('[data-price]'), qty = cfg.querySelector('[name=qty]'), msg = cfg.querySelector('.added');
    var current = function () {
      var p = 0, parts = [];
      P.groups.forEach(function (g) {
        var v = cfg.querySelector('[name="' + g.id + '"]:checked'); if (!v) return;
        var o = g.options[+v.value]; p += o.price; parts.push(o.label);
      });
      return { price: p, parts: parts };
    };
    var upd = function () { priceEl.textContent = eur(current().price); };
    cfg.addEventListener('change', upd); upd();
    cfg.querySelectorAll('[data-q]').forEach(function (b) {
      b.addEventListener('click', function () { qty.value = Math.max(1, Math.min(20, (+qty.value || 1) + (+b.dataset.q))); });
    });
    cfg.addEventListener('submit', function (e) {
      e.preventDefault();
      var c = current(), n = Math.max(1, +qty.value || 1);
      var desc = { en: '', el: '' };
      ['en', 'el'].forEach(function (l) { desc[l] = '<br><span class="muted">' + c.parts.map(function (x) { return x[l]; }).join(' · ') + '</span>'; });
      cart.push({ name: P.name, desc: desc, price: c.price, qty: n, img: P.img });
      save(cart); render();
      msg.textContent = T.added;
      d.body.classList.add('cart-open');
    });
    // gallery thumbs
    var main = d.querySelector('.gallery .main img');
    d.querySelectorAll('.thumbs button').forEach(function (b, i, all) {
      b.addEventListener('click', function () {
        main.src = b.querySelector('img').src;
        all.forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      });
    });
  }
})();

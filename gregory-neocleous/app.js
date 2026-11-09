document.documentElement.classList.add('js');

// header on scroll + mobile menu
const hd = document.querySelector('.hd');
const onScroll = () => hd.classList.toggle('scrolled', scrollY > 20);
addEventListener('scroll', onScroll, {passive: true}); onScroll();
const burger = document.querySelector('.burger'), nav = document.getElementById('nav');
burger.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  burger.setAttribute('aria-expanded', open);
});

// reveal on scroll
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), {rootMargin: '0px 0px -8% 0px'});
document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = (i % 4) * 80 + 'ms';
  io.observe(el);
});

// seminar booking: seats x price, save registration (Netlify form), then card payment (Stripe link) or confirmation
const tk = document.querySelector('.ticket[data-seminar]');
if (tk) {
  const sem = JSON.parse(tk.dataset.seminar);
  const form = tk.querySelector('form'), q = form.querySelector('[name=seats]');
  const totalEl = form.querySelector('[data-total]'), totalIn = form.querySelector('[name=total]');
  const btn = form.querySelector('[data-label]');
  const update = () => {
    const t = sem.price * +q.value;
    totalEl.textContent = '€' + t.toLocaleString('en');
    totalIn.value = t;
    const card = form.payment.value === 'Card';
    btn.firstChild.textContent = card ? 'Continue to payment ' : 'Request invoice ';
  };
  form.querySelectorAll('[data-q]').forEach(b => b.addEventListener('click', () => {
    q.value = Math.min(20, Math.max(1, +q.value + +b.dataset.q)); update();
  }));
  form.querySelectorAll('[name=payment]').forEach(r => r.addEventListener('change', update));
  update();
  form.addEventListener('submit', async e => {
    e.preventDefault();
    btn.disabled = true;
    const data = new FormData(form);
    try { await fetch('/', {method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded'}, body: new URLSearchParams(data).toString()}); } catch (_) {}
    try { sessionStorage.setItem('gn-booking', JSON.stringify({name: data.get('name'), seats: data.get('seats'), total: data.get('total'), title: sem.title, payment: data.get('payment')})); } catch (_) {}
    if (data.get('payment') === 'Card' && sem.stripe) {
      const u = new URL(sem.stripe);
      u.searchParams.set('prefilled_email', data.get('email'));
      u.searchParams.set('client_reference_id', sem.slug);
      location.href = u;
    } else {
      location.href = '/seminars/booked/';
    }
  });
}

// booking confirmation summary
const booked = document.querySelector('.booked');
if (booked) {
  let b = null;
  try { b = JSON.parse(sessionStorage.getItem('gn-booking')); } catch (_) {}
  if (b) {
    booked.querySelector('[data-name]').textContent = (b.name || '').split(' ')[0] || 'you are in';
    booked.querySelector('[data-summary]').textContent =
      `${b.seats} seat${b.seats > 1 ? 's' : ''} for ${b.title} · €${(+b.total).toLocaleString('en')} · ${b.payment === 'Card' ? 'card payment' : 'invoice'}.`;
  }
}

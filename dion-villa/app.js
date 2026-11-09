// Dion Villa draft: gallery lightbox + booking demo (no real availability, no real payment)
(() => {
  const RATE = 550, MIN_NIGHTS = 2, CUR = '£';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const fmt = n => CUR + n.toLocaleString('en-GB');
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dayKey = d => d.toISOString().slice(0, 10);
  const addDays = (d, n) => { const x = new Date(d); x.setUTCDate(x.getUTCDate() + n); return x; };
  const nice = d => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  // Demo "already booked" nights: fixed pseudo-random stays so the calendar looks real.
  const booked = new Set();
  let seed = 7;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  for (let d = addDays(today, 3); d < addDays(today, 365);) {
    d = addDays(d, 2 + Math.floor(rnd() * 9));
    const len = 2 + Math.floor(rnd() * 5);
    for (let i = 0; i < len; i++) booked.add(dayKey(addDays(d, i)));
    d = addDays(d, len);
  }

  // ---- Calendar ----
  // Open on next month when this one is almost over (phones show one month only).
  const daysLeft = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0)).getUTCDate() - today.getUTCDate();
  let view = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + (daysLeft < 7 ? 1 : 0), 1));
  let start = null, end = null;
  const monthsEl = $('#cal-months');

  const nightsFree = (a, b) => { for (let d = a; d < b; d = addDays(d, 1)) if (booked.has(dayKey(d))) return false; return true; };

  function renderMonth(first) {
    const m = document.createElement('div');
    m.className = 'month';
    m.innerHTML = `<h4>${MONTHS[first.getUTCMonth()]} ${first.getUTCFullYear()}</h4>
      <div class="dow">${['Mo','Tu','We','Th','Fr','Sa','Su'].map(x => `<span>${x}</span>`).join('')}</div>`;
    const grid = document.createElement('div');
    grid.className = 'days';
    const offset = (first.getUTCDay() + 6) % 7;
    for (let i = 0; i < offset; i++) grid.insertAdjacentHTML('beforeend', '<span class="day empty"></span>');
    for (let d = new Date(first); d.getUTCMonth() === first.getUTCMonth(); d = addDays(d, 1)) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'day';
      b.textContent = d.getUTCDate();
      b.dataset.date = dayKey(d);
      const isBooked = booked.has(dayKey(d));
      const past = d < today;
      // A booked day can still be a check-out day if every night before it is free.
      const validCheckout = start && !end && d > start && nightsFree(start, d);
      if (past) { b.classList.add('past'); b.disabled = true; }
      else if (isBooked && !validCheckout) { b.classList.add('booked'); b.disabled = true; b.title = 'Booked'; }
      if (start && dayKey(d) === dayKey(start)) b.classList.add('start');
      if (end && dayKey(d) === dayKey(end)) b.classList.add('end');
      if (start && end && d > start && d < end) b.classList.add('in-range');
      grid.appendChild(b);
    }
    m.appendChild(grid);
    return m;
  }

  function render() {
    monthsEl.innerHTML = '';
    const second = new Date(Date.UTC(view.getUTCFullYear(), view.getUTCMonth() + 1, 1));
    monthsEl.append(renderMonth(view), renderMonth(second));
    $('#cal-title').textContent = start && !end ? 'Now pick your check-out' : 'Select your dates';
    $('#cal-prev').disabled = view <= new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    summary();
  }

  monthsEl.addEventListener('click', e => {
    const b = e.target.closest('.day');
    if (!b || b.disabled || !b.dataset.date) return;
    const d = new Date(b.dataset.date + 'T00:00:00Z');
    if (!start || end || d <= start) { start = booked.has(dayKey(d)) ? null : d; end = null; }
    else if (nightsFree(start, d)) end = d;
    else { start = d; end = null; }
    render();
  });
  $('#cal-prev').onclick = () => { view = new Date(Date.UTC(view.getUTCFullYear(), view.getUTCMonth() - 1, 1)); render(); };
  $('#cal-next').onclick = () => { view = new Date(Date.UTC(view.getUTCFullYear(), view.getUTCMonth() + 1, 1)); render(); };

  // ---- Summary ----
  const guestsSel = $('#s-guests');
  const reserveBtn = $('#reserve');
  let total = 0, nights = 0;

  function summary() {
    $('#s-in').textContent = start ? nice(start) : 'Select';
    $('#s-out').textContent = end ? nice(end) : 'Select';
    const box = $('#sum-lines');
    nights = start && end ? Math.round((end - start) / 864e5) : 0;
    if (!nights) {
      box.innerHTML = `<p class="muted">${start ? 'Now choose your check-out date.' : 'Pick your check-in and check-out dates on the calendar.'}</p>`;
      reserveBtn.disabled = true;
      return;
    }
    if (nights < MIN_NIGHTS) {
      box.innerHTML = `<p class="muted">The minimum stay is ${MIN_NIGHTS} nights.</p>`;
      reserveBtn.disabled = true;
      return;
    }
    total = nights * RATE;
    box.innerHTML = `
      <div class="ln"><span>${fmt(RATE)} × ${nights} nights</span><span>${fmt(total)}</span></div>
      <div class="ln"><span>Service fee (booking direct)</span><span>${fmt(0)}</span></div>
      <div class="ln tot"><span>Total</span><span>${fmt(total)}</span></div>
      ${nights >= 3 ? '<p class="note">Fireplace included for this stay.</p>' : ''}`;
    reserveBtn.disabled = false;
  }
  guestsSel.onchange = summary;

  // ---- Hero quick search: sync guests and jump to the calendar ----
  const qGuests = $('#q-guests');
  $('#quick').addEventListener('submit', e => { e.preventDefault(); guestsSel.value = qGuests.value; summary(); $('#book').scrollIntoView(); });
  ['#q-in', '#q-out'].forEach(s => $(s).addEventListener('click', () => { guestsSel.value = qGuests.value; $('#book').scrollIntoView(); }));

  // ---- Checkout demo ----
  const modal = $('#checkout');
  const steps = $$('.step', modal);
  const stepTabs = $$('.steps li', modal);
  function go(n) {
    steps.forEach(s => s.hidden = s.dataset.step != n);
    stepTabs.forEach((t, i) => t.classList.toggle('on', i < n));
  }
  function fillSummary() {
    const pet = $('#s-pet').checked ? ' + pet' : '';
    const html = `<div><span>${nice(start)} → ${nice(end)}</span><span>${nights} nights</span></div>
      <div><span>Guests</span><span>${guestsSel.value}${pet}</span></div>
      <div class="t"><span>Total</span><span>${fmt(total)}</span></div>`;
    $$('[data-summary]', modal).forEach(el => el.innerHTML = html);
    $('#pay-btn').textContent = `Pay ${fmt(total)}`;
  }
  reserveBtn.onclick = () => { fillSummary(); go(1); modal.hidden = false; document.body.style.overflow = 'hidden'; };
  const close = () => { modal.hidden = true; document.body.style.overflow = ''; };
  $('.modal-close', modal).onclick = close;
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  $('#co-details').addEventListener('submit', e => { e.preventDefault(); go(2); });
  $('[data-back]', modal).onclick = () => go(1);
  $('#co-pay').addEventListener('submit', e => {
    e.preventDefault();
    const btn = $('#pay-btn');
    btn.disabled = true; btn.textContent = 'Processing…';
    setTimeout(() => {
      // Close the demo dates so the calendar shows them as taken, like the real sync would.
      for (let d = start; d < end; d = addDays(d, 1)) booked.add(dayKey(d));
      $('#co-ref').textContent = 'DV-' + Math.random().toString(36).slice(2, 8).toUpperCase();
      btn.disabled = false;
      go(3);
    }, 1400);
  });
  $('[data-done]', modal).onclick = () => { close(); start = end = null; render(); };

  // ---- Lightbox ----
  const lb = $('#lightbox'), lbImg = $('img', lb);
  const shots = $$('#gallery-grid button');
  let idx = 0;
  const show = i => { idx = (i + shots.length) % shots.length; lbImg.src = shots[idx].dataset.src; lbImg.alt = $('img', shots[idx]).alt; };
  shots.forEach((b, i) => b.onclick = () => { show(i); lb.hidden = false; });
  $('.lb-close', lb).onclick = () => lb.hidden = true;
  $('.lb-prev', lb).onclick = () => show(idx - 1);
  $('.lb-next', lb).onclick = () => show(idx + 1);
  lb.addEventListener('click', e => { if (e.target === lb) lb.hidden = true; });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { lb.hidden = true; if (!modal.hidden) close(); }
    if (!lb.hidden && e.key === 'ArrowRight') show(idx + 1);
    if (!lb.hidden && e.key === 'ArrowLeft') show(idx - 1);
  });

  render();
})();

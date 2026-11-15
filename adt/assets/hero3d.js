// Homepage hero: the live 3D logo, on computers and (since 15 Nov 2026) phones and tablets too.
// Wide screens: logo beside the text, follows the mouse. Narrow screens: logo centred above the text,
// sways by itself. Reduced motion, no WebGL2 or a phone too slow to keep up keep the still logo.
const hero = document.querySelector(".hero");
const narrow = matchMedia("(max-width: 980px)").matches;
const touch = !matchMedia("(pointer: fine)").matches;
const wantsLive =
  hero &&
  !matchMedia("(prefers-reduced-motion: reduce)").matches &&
  !!document.createElement("canvas").getContext("webgl2");

window.__adtHero3d = wantsLive ? start() : Promise.resolve(false);

async function start() {
  try {
    // the 3D library comes from a CDN; give a slow first download one more try
    const { createScene } = await import("./hero3d-scene.js").catch(() => import("./hero3d-scene.js?retry"));
    hero.classList.add("has-3d"); // sizes the box on narrow screens before the canvas measures it
    const box = hero.querySelector(".hero-video");
    const canvas = document.createElement("canvas");
    canvas.className = "hero-3d";
    canvas.setAttribute("aria-hidden", "true");
    box.appendChild(canvas);

    const pr = Math.min(devicePixelRatio || 1, narrow ? 1.75 : 1.25); // the phone box is small, so it can afford sharper pixels
    const size = () => [box.clientWidth, box.clientHeight];
    const [w, h] = size();
    const scene = createScene({ canvas, width: w, height: h, duration: 9, layout: narrow ? "center" : "site", pixelRatio: pr });
    addEventListener("resize", () => scene.setSize(...size()));

    // mouse (eased) and how far the hero has scrolled away
    const ix = { mx: 0, my: 0, scroll: 0 };
    const target = { mx: 0, my: 0 };
    hero.addEventListener("pointermove", (e) => {
      target.mx = (e.clientX / innerWidth) * 2 - 1;
      target.my = (e.clientY / innerHeight) * 2 - 1;
    });
    hero.addEventListener("pointerleave", () => { target.mx = 0; target.my = 0; });

    let visible = true;
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(hero);

    const t0 = performance.now();
    let first = true;
    let raf = 0, slow = 0, frames = 0, last = 0;
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      if (!visible) { last = 0; return; } // no GPU work while the hero is off screen
      // a phone that can't keep up (over 1 in 3 frames slower than ~22 fps in the first 3 s) gets the still logo back
      if (last && frames < 180) { frames++; if (now - last > 45) slow++; if (frames === 180 && slow > 60) { cancelAnimationFrame(raf); canvas.remove(); hero.classList.remove("has-3d", "is-live"); return; } }
      last = now;
      if (touch) { const s = (now - t0) / 1000; target.mx = 0.55 * Math.sin(s * 0.42); target.my = 0.25 * Math.sin(s * 0.31 + 1); } // no mouse: a slow sway
      ix.mx += (target.mx - ix.mx) * 0.06;
      ix.my += (target.my - ix.my) * 0.06;
      ix.scroll = Math.min(1, Math.max(0, -hero.getBoundingClientRect().top / hero.offsetHeight));
      scene.renderAt((now - t0) / 1000, ix);
      if (first) { first = false; canvas.classList.add("ready"); }
    };
    requestAnimationFrame(loop);
    return true;
  } catch (err) {
    console.warn("3D hero unavailable, using the video", err);
    return false;
  }
}

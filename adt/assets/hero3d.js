// Homepage hero: the live 3D logo on desktop computers. Phones, touch screens, reduced motion and
// browsers without WebGL2 keep the video/poster that app.js handles (it waits for window.__adtHero3d).
const hero = document.querySelector(".hero");
const wantsLive =
  hero &&
  matchMedia("(min-width: 981px) and (pointer: fine)").matches &&
  !matchMedia("(prefers-reduced-motion: reduce)").matches &&
  !!document.createElement("canvas").getContext("webgl2");

window.__adtHero3d = wantsLive ? start() : Promise.resolve(false);

async function start() {
  try {
    // the 3D library comes from a CDN; give a slow first download one more try
    const { createScene } = await import("./hero3d-scene.js").catch(() => import("./hero3d-scene.js?retry"));
    const box = hero.querySelector(".hero-video");
    const canvas = document.createElement("canvas");
    canvas.className = "hero-3d";
    canvas.setAttribute("aria-hidden", "true");
    box.appendChild(canvas);

    const pr = Math.min(devicePixelRatio || 1, 1.25);
    const size = () => [box.clientWidth, box.clientHeight];
    const [w, h] = size();
    const scene = createScene({ canvas, width: w, height: h, duration: 9, layout: "site", pixelRatio: pr });
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
    const loop = (now) => {
      requestAnimationFrame(loop);
      if (!visible) return; // no GPU work while the hero is off screen
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

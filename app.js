/* Front page: stickers that float on the sides, little hearts, the three girls, and each girl's page
   (pages are shown inside this same document so the music never stops). */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const rand = (a, b) => a + Math.random() * (b - a);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- stickers on the sides ----------
     [file, x%, y%, width (px at 1366x768, scaled), rotation]  — wide screens and phones have their own layout */
  const SETS = {
    // the front page: pink/brown buttons and bows
    home: {
      wide: [
        ["st/st-31", 6, 13, 150, -14], ["st/st-01", 15.5, 36, 86, 10], ["st/st-28", 5, 55, 118, -8], ["st/st-09", 14, 74, 92, 14],
        ["st/st-06", 5, 90, 76, -10], ["st/st-02", 24, 9, 60, 18], ["st/st-13", 22, 91, 58, 8],
        ["st/st-29", 92, 12, 138, 12], ["st/st-04", 83, 32, 84, -12], ["st/st-07", 94.5, 43, 78, 8], ["st/st-30", 86, 58, 128, -10],
        ["st/st-19", 75, 8, 58, -6], ["st/st-10", 95, 72, 66, 10], ["st/st-32", 62, 93, 84, -6],
      ],
      tall: [
        ["st/st-31", 15, 7.5, 96, -14], ["st/st-29", 85, 7, 90, 12], ["st/st-02", 42, 4.5, 40, 18], ["st/st-19", 60, 10.5, 38, -6],
        ["st/st-01", 5, 24, 56, 10], ["st/st-04", 95, 22, 52, -12], ["st/st-28", 7, 78.5, 72, -8], ["st/st-09", 93, 77, 54, 14],
        ["st/st-07", 30, 83, 40, 8],
      ],
    },
    // Kahin's world: her caramel stickers (deer, cookie, wings, mug, sweet heart...) + two pink bows
    kahin: {
      wide: [
        ["kahin/st/ks-04", 5.5, 20, 116, -8], ["kahin/st/ks-01", 4, 47, 92, 10], ["kahin/st/ks-10", 5.5, 74, 100, -6],
        ["kahin/st/ks-07", 4, 94, 70, -12], ["st/st-31", 13, 6, 96, -14],
        ["kahin/st/ks-06", 95, 20, 104, 10], ["kahin/st/ks-03", 95.5, 47, 104, -8], ["kahin/st/ks-08", 94.5, 72, 112, 6],
        ["kahin/st/ks-12", 96, 93, 72, 12], ["kahin/st/ks-02", 87, 5, 104, 6],
      ],
      tall: [
        ["kahin/st/ks-04", 90, 4.5, 64, 8], ["kahin/st/ks-02", 62, 3, 62, -4], ["kahin/st/ks-01", 3, 34, 58, 10],
        ["kahin/st/ks-03", 97, 52, 60, -8], ["kahin/st/ks-10", 3, 74, 58, -6], ["kahin/st/ks-06", 96, 88, 58, 10],
      ],
    },
    // Rita's world: her soft pink things (swan, lamb, roses, cake, mug, wings...) + two pink bows
    rita: {
      wide: [
        ["rita/st/swan", 5.5, 22, 112, -6], ["rita/st/roses", 5, 47, 120, 10], ["rita/st/lamb", 6, 72, 104, -8],
        ["rita/st/watch", 4, 94, 44, -12], ["st/st-31", 13, 6, 96, -14],
        ["rita/st/cake", 95, 22, 96, 8], ["rita/st/mug", 95, 47, 104, -8], ["rita/st/angel", 94.5, 72, 112, 6],
        ["rita/st/candle", 96, 93, 62, 10], ["rita/st/wings", 87, 6, 112, 6],
      ],
      tall: [
        ["rita/st/wings", 88, 4.5, 72, 8], ["rita/st/roses", 62, 3, 70, -6], ["rita/st/swan", 3, 34, 60, 10],
        ["rita/st/cake", 97, 52, 58, -8], ["rita/st/lamb", 3, 74, 60, -6], ["rita/st/angel", 96, 88, 62, 10],
      ],
    },
    // Sana's world: her cream things (books, the statue, the drawn portrait, the singing kitty, coffee, rolls...)
    // + one pink bow
    sana: {
      wide: [
        ["sana/st/bust", 5.5, 22, 100, -6], ["sana/st/books", 5, 47, 120, 8], ["sana/st/kitty", 6, 72, 96, -8],
        ["sana/st/candle", 4, 93, 64, -10], ["st/st-31", 13, 6, 96, -14],
        ["sana/st/portrait", 95, 22, 96, 8], ["sana/st/coffee", 95, 47, 100, -8], ["sana/st/rolls", 94.5, 72, 112, 6],
        ["sana/st/mirror", 96, 93, 66, 10], ["sana/st/butterfly", 87, 6, 110, 6],
      ],
      tall: [
        ["sana/st/butterfly", 88, 4.5, 72, 8], ["sana/st/books", 62, 3, 72, -6], ["sana/st/bust", 3, 34, 56, 10],
        ["sana/st/portrait", 97, 52, 56, -8], ["sana/st/kitty", 3, 74, 58, -6], ["sana/st/coffee", 96, 88, 60, 10],
      ],
    },
  };
  let setName = "home";
  const box = $("#stickers");
  function placeStickers() {
    const tall = window.innerWidth / window.innerHeight < 0.9;
    const set = tall ? SETS[setName].tall : SETS[setName].wide;
    const scale = tall ? Math.min(1.25, window.innerWidth / 390) : Math.min(1.3, Math.max(0.7, Math.min(window.innerWidth / 1366, window.innerHeight / 768)));
    box.textContent = "";
    set.forEach(([file, x, y, w, r], i) => {
      const d = document.createElement("div");
      d.className = "stk";
      d.style.cssText = `--x:${x}%;--y:${y}%;--w:${Math.round(w * scale)}px;--r:${r}deg;--dp:${(rand(8, 22) * (w / 100)).toFixed(1)}px;--fd:${rand(2.4, 4).toFixed(2)}s;--fdl:${rand(-4, 0).toFixed(2)}s;--in:${(0.15 + i * 0.05).toFixed(2)}s`;
      d.innerHTML = `<span><img src="img/${file}.png" alt="" draggable="false"></span>`;
      d.addEventListener("click", () => {
        d.classList.remove("is-spin");
        void d.offsetWidth;
        d.classList.add("is-spin");
        hearts(d.getBoundingClientRect(), 5);
      });
      box.appendChild(d);
    });
  }
  function useStickers(name) {
    if (name === setName && box.childElementCount) return;
    setName = name;
    placeStickers();
  }
  let rT = 0;
  window.addEventListener("resize", () => {
    clearTimeout(rT);
    rT = setTimeout(placeStickers, 150);
  });

  /* ---------- floating hearts + sparkles ---------- */
  const fx = $("#fx");
  if (!reduceMotion) {
    for (let i = 0; i < 14; i++) {
      const s = document.createElement("span");
      s.textContent = "♥";
      s.style.cssText = `--x:${rand(2, 96)}%;--z:${rand(10, 22).toFixed(0)}px;--c:${["#fff", "#f7c9d4", "#e9a5b6", "#fde7ec"][i % 4]};--t:${rand(12, 22).toFixed(1)}s;--dl:${rand(-22, 0).toFixed(1)}s;--dx:${rand(-60, 60).toFixed(0)}px;--rot:${rand(-40, 40).toFixed(0)}deg;--o:${rand(0.35, 0.7).toFixed(2)}`;
      fx.appendChild(s);
    }
    for (let i = 0; i < 16; i++) {
      const t = document.createElement("i");
      t.style.cssText = `--x:${rand(2, 98)}%;--y:${rand(2, 96)}%;--z:${rand(6, 13).toFixed(1)}px;--t:${rand(2.4, 4.5).toFixed(2)}s;--dl:${rand(-4, 0).toFixed(2)}s`;
      fx.appendChild(t);
    }
  }
  function hearts(rect, n) {
    for (let i = 0; i < n; i++) {
      const h = document.createElement("span");
      h.textContent = "♥";
      h.style.cssText = `position:fixed;z-index:40;pointer-events:none;left:${rect.left + rect.width / 2}px;top:${rect.top + rect.height / 3}px;font-size:${rand(12, 22).toFixed(0)}px;color:${["#e9a5b6", "#c97f93", "#fff", "#f7c9d4"][i % 4]};text-shadow:0 0 6px rgba(255,255,255,.7)`;
      document.body.appendChild(h);
      const a = h.animate(
        [
          { transform: "translate(-50%,-50%) scale(.4)", opacity: 0 },
          { transform: `translate(calc(-50% + ${rand(-14, 14).toFixed(0)}px), calc(-50% - 24px)) scale(1)`, opacity: 1, offset: 0.25 },
          { transform: `translate(calc(-50% + ${rand(-60, 60).toFixed(0)}px), calc(-50% - ${rand(90, 150).toFixed(0)}px)) scale(.8)`, opacity: 0 },
        ],
        { duration: rand(1100, 1600), easing: "ease-out" }
      );
      a.onfinish = () => h.remove();
    }
  }
  // the same hearts are used on the girls' own pages (kahin.js)
  window.trioHearts = hearts;

  /* ---------- a little depth: stickers + plaid follow the finger / mouse ---------- */
  const par = { x: 0, y: 0 }, parT = { x: 0, y: 0 };
  let lastMove = -1e9;
  window.addEventListener("pointermove", (e) => {
    parT.x = (e.clientX / window.innerWidth - 0.5) * 2;
    parT.y = (e.clientY / window.innerHeight - 0.5) * 2;
    lastMove = performance.now();
  });
  // Changing --px/--py on the page restyles everything, so: never on phones/tablets (no mouse there, and they
  // are the slowest), never with reduced motion, and on computers only while the stickers are still gliding.
  const touchOnly = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  let running = false;
  function tick() {
    par.x += (parT.x - par.x) * 0.08;
    par.y += (parT.y - par.y) * 0.08;
    document.documentElement.style.setProperty("--px", par.x.toFixed(3));
    document.documentElement.style.setProperty("--py", par.y.toFixed(3));
    if (Math.abs(parT.x - par.x) > 0.002 || Math.abs(parT.y - par.y) > 0.002) requestAnimationFrame(tick);
    else running = false;
  }
  if (!touchOnly && !reduceMotion) {
    window.addEventListener("pointermove", () => {
      if (!running && !document.hidden) {
        running = true;
        requestAnimationFrame(tick);
      }
    });
  }

  /* ---------- pages: #kahin, #rita, #sana ---------- */
  const GIRLS = {
    kahin: { name: "kahin", img: "img/kahin.png" },
    rita: { name: "rita", img: "img/rita.png" },
    sana: { name: "sana", img: "img/sana.png" },
  };
  const home = $("#home");
  const girlView = $("#girl");
  const girlImg = $("#girl-img");
  const girlTitle = $("#girl-title");
  let cameFromHome = false;

  // each girl who has her own world: #<girl>-world, with its section and its sticker set
  const WORLDS = {
    "kahin-world": { el: $("#kworld"), stickers: "kahin", title: "Kahin's world ✨" },
    "rita-world": { el: $("#rworld"), stickers: "rita", title: "Rita's world ✨" },
    "sana-world": { el: $("#sworld"), stickers: "sana", title: "Sana's world ✨" },
  };
  function route() {
    const key = location.hash.replace("#", "");
    const g = GIRLS[key];
    const w = WORLDS[key];
    document.body.classList.toggle("is-world", !!w);
    Object.values(WORLDS).forEach((x) => (x.el.hidden = x !== w));
    useStickers(w ? w.stickers : "home");
    if (w) {
      // a world's pictures only get their address now, so opening the site doesn't download all three worlds
      w.el.querySelectorAll("img[data-src]").forEach((img) => {
        img.src = img.dataset.src;
        img.removeAttribute("data-src");
      });
      home.hidden = true;
      girlView.hidden = true;
      restart(w.el);
      document.title = w.title;
    } else if (g) {
      girlView.dataset.girl = key;
      girlView.setAttribute("aria-label", g.name);
      girlImg.src = g.img;
      girlImg.alt = g.name;
      girlTitle.textContent = g.name;
      // a girl who has a world: her page simply opens into it after a moment
      $("#girl-sub").textContent = WORLDS[`${key}-world`] ? "opening her world… ♡" : "her little page is coming soon ♡";
      home.hidden = true;
      girlView.hidden = false;
      restart(girlView);
      document.title = `${g.name} ♡`;
    } else {
      girlView.hidden = true;
      home.hidden = false;
      restart(home);
      document.title = "the diary ♡";
    }
    window.scrollTo(0, 0);
    // worlds.js listens to this to open a world / start the welcome
    window.dispatchEvent(new CustomEvent("routechange", { detail: key }));
  }
  function restart(el) {
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = "";
  }
  $$(".girl").forEach((b) =>
    b.addEventListener("click", () => {
      b.classList.add("is-picked");
      hearts(b.getBoundingClientRect(), 7);
      setTimeout(() => {
        b.classList.remove("is-picked");
        cameFromHome = true;
        location.hash = b.dataset.girl;
      }, 380);
    })
  );
  $("#back").addEventListener("click", () => {
    if (cameFromHome) history.back();
    else location.hash = "";
  });
  window.addEventListener("hashchange", route);
  route();
})();

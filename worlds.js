/* The girls' worlds (Kahin, Rita; more can be added the same way):
   #<girl>        her picture and name for a moment (from app.js), then straight into her world.
   #<girl>-world  her own world (front-page style): her head + two little ponies, info cards, favourites,
                  little books that open and turn their pages, birthday countdowns.
   Taps: [data-hearts="n"] bounce + front-page hearts, [data-pop="a b c"] bounce + those little things,
   [data-flash] a camera flash, [data-cycle="a.jpg b.jpg"] shows the next picture on each tap,
   [data-book="key"] opens that book. Nobody talks. */
(() => {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const timers = new Set();
  const later = (fn, ms) => {
    const t = setTimeout(() => {
      timers.delete(t);
      fn();
    }, ms);
    timers.add(t);
    return t;
  };
  const clearAll = () => {
    timers.forEach(clearTimeout);
    timers.clear();
  };

  /* ---------- little flying things (apples, hearts, paws, confetti) ---------- */
  function pop(x, y, chars, n, spread = 90, up = 120) {
    for (let i = 0; i < n; i++) {
      const p = document.createElement("span");
      p.className = "k-particle";
      p.textContent = pick(chars);
      p.style.cssText += `left:${x}px;top:${y}px;font-size:${rand(14, 24).toFixed(0)}px`;
      document.body.appendChild(p);
      const dx = rand(-spread, spread), dy = -rand(up * 0.5, up);
      const a = p.animate(
        [
          { transform: "translate(-50%,-50%) scale(.4)", opacity: 0 },
          { transform: `translate(calc(-50% + ${dx * 0.3}px), calc(-50% + ${dy * 0.3}px)) scale(1)`, opacity: 1, offset: 0.2 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.8) rotate(${rand(-60, 60).toFixed(0)}deg)`, opacity: 0 },
        ],
        { duration: rand(1000, 1500), easing: "ease-out" }
      );
      a.onfinish = () => p.remove();
    }
  }
  // soft confetti in the site's colours (pink, cream, caramel) with a few hearts
  function confetti() {
    const colors = ["#e9a5b6", "#f7c9d4", "#fff8f3", "#c97f93", "#e0b98a", "#b07a4a"];
    const n = reduceMotion ? 18 : 60;
    for (let i = 0; i < n; i++) {
      const c = document.createElement("span");
      c.className = "k-particle";
      if (i % 6 === 0) {
        c.textContent = "♥";
        c.style.cssText += `left:${rand(5, 95)}vw;top:-20px;font-size:${rand(14, 22).toFixed(0)}px;color:${pick(colors.slice(0, 4))}`;
      } else {
        const w = rand(7, 11);
        c.style.cssText += `left:${rand(5, 95)}vw;top:-12px;width:${w}px;height:${w * 0.55}px;background:${pick(colors)};border-radius:2px`;
      }
      document.body.appendChild(c);
      const a = c.animate(
        [
          { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
          { transform: `translate(${rand(-80, 80).toFixed(0)}px, ${rand(70, 105).toFixed(0)}vh) rotate(${rand(-540, 540).toFixed(0)}deg)`, opacity: 0.85 },
        ],
        { duration: rand(2400, 3800), delay: rand(0, 700), easing: "cubic-bezier(.2,.6,.4,1)" }
      );
      a.onfinish = () => c.remove();
    }
  }
  function center(el) {
    const r = el.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 3];
  }
  function bounce(el, cls = "is-hop") {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  /* ---------- #<girl>: her picture and name for a moment, then straight into her world ---------- */
  const HAS_WORLD = ["kahin", "rita", "sana"];
  let enterT = 0;
  function startEntry(girl) {
    clearTimeout(enterT);
    // a plain timeout: it must still fire after the page change clears the page timers
    enterT = setTimeout(() => {
      if (location.hash === `#${girl}`) location.replace(`#${girl}-world`);
    }, 1800);
  }

  /* ---------- taps inside the worlds ---------- */
  // the girl's head and the ponies: a little bounce and the same pink hearts as on the front page
  const hearts = (el, n) => window.trioHearts && window.trioHearts(el.getBoundingClientRect(), n);
  $$("[data-hearts]").forEach((btn) =>
    btn.addEventListener("click", () => {
      bounce(btn);
      hearts(btn, +btn.dataset.hearts || 6);
    })
  );
  // little favourites: a bounce and their own little things flying up
  $$("[data-pop]").forEach((btn) =>
    btn.addEventListener("click", () => {
      bounce(btn);
      const [x, y] = center(btn);
      pop(x, y, btn.dataset.pop.split(" "), 7, 80, 120);
    })
  );
  // changing pictures, every tap shows the next one with a little flip:
  //   data-cycle="a.jpg b.jpg"  swaps the picture inside the tile (movies & series)
  //   data-cycle (no value)     switches between the tile's .cycle-item pieces (games: the chibi ↔ Minecraft)
  $$("[data-cycle]").forEach((btn) => {
    const pics = btn.dataset.cycle ? btn.dataset.cycle.split(" ") : null;
    const items = pics ? null : $$(".cycle-item", btn);
    const img = pics ? btn.querySelector(".fav-pic img") : null;
    const frame = pics ? img.parentElement : btn.querySelector(".fav-pic");
    const count = pics ? pics.length : items.length;
    // only the NEXT picture is fetched ahead (once the tile is on screen, then after every tap), so opening the
    // site doesn't download every poster at once
    const preload = (k) => {
      if (pics) new Image().src = pics[k % pics.length];
    };
    if (pics && "IntersectionObserver" in window) {
      const io = new IntersectionObserver((es) => {
        if (es.some((e) => e.isIntersecting)) {
          preload(1);
          io.disconnect();
        }
      });
      io.observe(btn);
    }
    let i = 0;
    btn.addEventListener("click", () => {
      i = (i + 1) % count;
      const half = reduceMotion ? 0 : 160;
      // the flip is only decoration: the picture is swapped by a timer, so it always changes
      if (half) {
        frame.animate(
          [{ transform: "perspective(500px) rotateY(0)" }, { transform: "perspective(500px) rotateY(90deg)" }],
          { duration: half, easing: "ease-in" }
        );
      }
      setTimeout(() => {
        if (pics) {
          img.src = pics[i];
          preload(i + 1);
        }
        else {
          items.forEach((el, k) => (el.hidden = k !== i));
          // a piece can carry its own name (games: Yandere Simulator ↔ Minecraft)
          const nameEl = btn.querySelector(".cycle-name");
          if (nameEl && items[i].dataset.name) nameEl.textContent = items[i].dataset.name;
        }
        if (half) {
          frame.animate(
            [{ transform: "perspective(500px) rotateY(-90deg)" }, { transform: "perspective(500px) rotateY(0)" }],
            { duration: 200, easing: "ease-out" }
          );
        }
      }, half);
    });
  });
  // photography: a soft camera flash
  $$("[data-flash]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const f = document.createElement("div");
      f.className = "cam-flash";
      document.body.appendChild(f);
      f.animate([{ opacity: 0.9 }, { opacity: 0 }], { duration: 500, easing: "ease-out" }).onfinish = () => f.remove();
    })
  );

  // her favourite Identity V character: touching it writes a small "I love you" next to it
  $("#fav-idv").addEventListener("click", (e) => {
    const b = e.currentTarget;
    bounce(b);
    const [x, y] = center(b);
    pop(x, y, ["♥", "♡", "💗"], 6, 70, 110);
    const r = b.getBoundingClientRect();
    const t = document.createElement("div");
    t.className = "love-pop";
    t.textContent = "I love you ♡";
    t.style.left = `${r.left + r.width / 2}px`;
    t.style.top = `${r.top + 6}px`;
    document.body.appendChild(t);
    const a = t.animate(
      [
        { transform: "translate(-50%,-60%) scale(.6)", opacity: 0 },
        { transform: "translate(-50%,-100%) scale(1.05)", opacity: 1, offset: 0.15 },
        { transform: "translate(-50%,-105%) scale(1)", opacity: 1, offset: 0.8 },
        { transform: "translate(-50%,-150%) scale(.96)", opacity: 0 },
      ],
      { duration: 2400, easing: "ease-out" }
    );
    a.onfinish = () => t.remove();
  });
  $("#fav-usagi").addEventListener("click", (e) => {
    const b = e.currentTarget;
    bounce(b);
    const [x, y] = center(b);
    pop(x, y, ["♡", "✨", "♡"], 6, 70, 110);
  });
  // Shasha's photos: tap = a little wiggle + paws and meows
  $$(".shasha-pic").forEach((b) =>
    b.addEventListener("click", () => {
      bounce(b);
      const [x, y] = center(b);
      pop(x, y, ["🐾", "meow ♡", "🐾", "♡"], 7, 90, 130);
    })
  );
  $$(".chip-btn").forEach((b) => b.addEventListener("click", () => bounce(b.querySelector(".ball"), "is-bounce")));
  $$(".world-back").forEach((b) =>
    b.addEventListener("click", () => {
      location.hash = "";
    })
  );

  // live birthday countdowns: every .bday box (data-month, data-day, optional data-born year) counts down
  // to the next birthday at midnight local time; on the day itself it shows its happy-birthday line.
  // Kahin: May 24. Shasha Morgana: March 15, born in 2026 (her age and "her Nth birthday" are worked out too).
  (() => {
    const two = (n) => String(n).padStart(2, "0");
    const ordinal = (n) => n + (n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th");
    const boxes = $$(".bday").map((el) => ({
      el,
      month: +el.dataset.month - 1,
      day: +el.dataset.day,
      born: el.dataset.born ? +el.dataset.born : null,
      cd: el.querySelector(".cd"),
      today: el.querySelector(".bday-count"),
      out: ["d", "h", "m", "s"].map((k) => el.querySelector(`.cd-${k}`)),
    }));
    const ageEl = $("#shasha-age");
    const nextEl = $("#shasha-next");
    function shashaAge(now) {
      // born March 15, 2026
      let months = (now.getFullYear() - 2026) * 12 + (now.getMonth() - 2);
      if (now.getDate() < 15) months--;
      if (months < 1) {
        const days = Math.max(0, Math.floor((now - new Date(2026, 2, 15)) / 86400000));
        return `${days} day${days === 1 ? "" : "s"} old`;
      }
      const y = Math.floor(months / 12), m = months % 12;
      const ys = y ? `${y} year${y === 1 ? "" : "s"}` : "";
      const ms = m ? `${m} month${m === 1 ? "" : "s"}` : "";
      return `${[ys, ms].filter(Boolean).join(" & ")} old 🍼`;
    }
    function tick() {
      const now = new Date();
      boxes.forEach((b) => {
        const isToday = now.getMonth() === b.month && now.getDate() === b.day;
        b.cd.hidden = isToday;
        b.today.hidden = !isToday;
        let next = new Date(now.getFullYear(), b.month, b.day);
        if (!isToday && next <= now) next = new Date(now.getFullYear() + 1, b.month, b.day);
        if (b.born && nextEl && b.el.contains(nextEl)) {
          nextEl.textContent = isToday ? "" : `her ${ordinal(next.getFullYear() - b.born)} birthday in`;
          nextEl.hidden = isToday;
        }
        if (isToday) return;
        let left = Math.max(0, Math.floor((next - now) / 1000));
        const d = Math.floor(left / 86400);
        left -= d * 86400;
        const h = Math.floor(left / 3600);
        left -= h * 3600;
        const m = Math.floor(left / 60);
        b.out[0].textContent = String(d);
        b.out[1].textContent = two(h);
        b.out[2].textContent = two(m);
        b.out[3].textContent = two(left - m * 60);
      });
      if (ageEl) ageEl.textContent = shashaAge(now);
    }
    tick();
    setInterval(tick, 1000);
  })();

  /* ---------- the little books (Kahin: Blue Lock, No Home · Rita: How to Make My Husband Stay by My Side · Sana: Olgami) ---------- */
  // each book: a cover (optionally with its title written on it), the pages, and a last page for its girl
  const BOOKS = {
    og: {
      name: "Olgami",
      for: "Sana",
      cover: ["img/sana/og-cover.jpg", 560, 837],
      title: "OLGAMI",
      sub: "manhwa",
      pages: [["img/sana/og-1.jpg", 760, 1214], ["img/sana/og-2.jpg", 736, 981], ["img/sana/og-3.jpg", 687, 926], ["img/sana/og-4.jpg", 736, 1308], ["img/sana/og-5.jpg", 760, 1466], ["img/sana/og-6.jpg", 736, 1308], ["img/sana/og-7.jpg", 656, 1781], ["img/sana/og-8.jpg", 688, 1077], ["img/sana/og-9.jpg", 760, 1007]],
    },
    hm: {
      name: "How to Make My Husband Stay by My Side",
      for: "Rita",
      cover: ["img/rita/hm-cover.jpg", 723, 823],
      title: "How to Make My Husband Stay by My Side",
      sub: "manhwa",
      small: true,
      pages: [["img/rita/hm-1.jpg", 736, 1154], ["img/rita/hm-2.jpg", 736, 1308], ["img/rita/hm-3.jpg", 736, 1308], ["img/rita/hm-4.jpg", 760, 1351], ["img/rita/hm-5.jpg", 564, 1127]],
    },
    bl: {
      name: "Blue Lock",
      for: "Kahin",
      cover: ["img/kahin/bl-cover.jpg", 513, 767],
      pages: [["img/kahin/bl-1.jpg", 736, 748], ["img/kahin/bl-2.jpg", 665, 665], ["img/kahin/bl-3.jpg", 736, 909], ["img/kahin/bl-4.jpg", 736, 1104]],
    },
    nh: {
      name: "No Home",
      for: "Kahin",
      cover: ["img/kahin/nh-cover.jpg", 735, 919],
      title: "NO HOME",
      sub: "manhwa",
      pages: [["img/kahin/nh-1.jpg", 760, 793], ["img/kahin/nh-2.jpg", 760, 926], ["img/kahin/nh-3.jpg", 760, 785], ["img/kahin/nh-4.jpg", 690, 1000], ["img/kahin/nh-5.jpg", 760, 887]],
    },
  };
  const bk = $("#bk");
  const bookBox = $("#bk-book");
  const prevB = $("#bk-prev");
  const nextB = $("#bk-next");
  const count = $("#bk-count");
  let pages = [];
  let openBtn = null;
  let at = 0; // the page that is open
  let turning = 0;
  function fillBook(key) {
    const b = BOOKS[key];
    bookBox.textContent = "";
    bk.setAttribute("aria-label", b.name);
    const add = (cls, html) => {
      const d = document.createElement("div");
      d.className = `bk-page ${cls}`.trim();
      d.innerHTML = html;
      bookBox.appendChild(d);
      return d;
    };
    const cover = add("bk-cover", `<img src="${b.cover[0]}" alt="${b.name} cover" width="${b.cover[1]}" height="${b.cover[2]}">`);
    if (b.title) {
      const t = document.createElement("div");
      t.className = "bk-title" + (b.small ? " bk-title-small" : "") + (b.light ? " bk-title-light" : "");
      t.innerHTML = `<b></b><span></span>`;
      t.querySelector("b").textContent = b.title;
      t.querySelector("span").textContent = b.sub || "";
      cover.appendChild(t);
    }
    b.pages.forEach(([src, w, h], i) => add("", `<img src="${src}" alt="page ${i + 1}" width="${w}" height="${h}">`));
    add("bk-end", `<p>the end… for now ♡</p><p class="bk-end-sub">for ${b.for}</p>`);
    pages = Array.from(bookBox.children);
  }
  // at rest exactly one page is shown, flat and whole
  function layout() {
    clearTimeout(turning);
    turning = 0;
    pages.forEach((p, i) => {
      p.classList.remove("is-leaving", "is-coming");
      p.classList.toggle("is-on", i === at);
    });
    prevB.disabled = at === 0;
    nextB.disabled = at === pages.length - 1;
    count.textContent = `${at + 1} / ${pages.length}`;
  }
  // forward: the open page swings away and the next one is already underneath;
  // back: the previous page swings back in on top. After the turn, layout() leaves one flat page.
  function turn(d) {
    const n = Math.max(0, Math.min(pages.length - 1, at + d));
    if (n === at) return;
    if (turning) layout();
    const old = pages[at];
    const nw = pages[n];
    at = n;
    if (d > 0) {
      nw.classList.add("is-on");
      old.classList.remove("is-on");
      old.classList.add("is-leaving");
    } else {
      nw.classList.add("is-coming");
    }
    prevB.disabled = at === 0;
    nextB.disabled = at === pages.length - 1;
    count.textContent = `${at + 1} / ${pages.length}`;
    turning = setTimeout(layout, reduceMotion ? 30 : 540);
  }
  function openBook(key, btn) {
    openBtn = btn || null;
    fillBook(key);
    at = 0;
    layout();
    bk.hidden = false;
    nextB.focus();
  }
  function closeBook() {
    bk.hidden = true;
    if (openBtn) openBtn.focus();
  }
  $$("[data-book]").forEach((btn) =>
    btn.addEventListener("click", () => {
      bounce(btn);
      setTimeout(() => openBook(btn.dataset.book, btn), 250);
    })
  );
  prevB.addEventListener("click", () => turn(-1));
  nextB.addEventListener("click", () => turn(1));
  $("#bk-close").addEventListener("click", closeBook);
  $("#bk-backdrop").addEventListener("click", closeBook);
  // tap the right half = next page, the left half = previous; swipe works too
  const bookEl = $("#bk-book");
  let sx = null;
  bookEl.addEventListener("pointerdown", (e) => (sx = e.clientX));
  bookEl.addEventListener("pointerup", (e) => {
    if (sx === null) return;
    const dx = e.clientX - sx;
    sx = null;
    if (Math.abs(dx) > 40) return turn(dx < 0 ? 1 : -1);
    const r = bookEl.getBoundingClientRect();
    turn(e.clientX > r.left + r.width / 2 ? 1 : -1);
  });
  document.addEventListener("keydown", (e) => {
    if (bk.hidden) return;
    if (e.key === "Escape") closeBook();
    else if (e.key === "ArrowRight") turn(1);
    else if (e.key === "ArrowLeft") turn(-1);
  });

  // the welcome: just a little confetti (nobody talks, nobody flies around)
  function enterWorld() {
    if (!reduceMotion) later(confetti, 300);
  }

  /* ---------- follow the pages ---------- */
  function onRoute(key) {
    clearAll();
    clearTimeout(enterT);
    if (!bk.hidden) bk.hidden = true;
    if (HAS_WORLD.includes(key)) startEntry(key);
    else if (HAS_WORLD.some((g) => key === `${g}-world`)) enterWorld();
  }
  window.addEventListener("routechange", (e) => onRoute(e.detail));
  // design checks only: ?shot=1 with &tap=<element id> | &bk=<pages to turn>&book=bl|nh
  const qs = new URLSearchParams(location.search);
  if (qs.has("shot") && qs.get("tap")) setTimeout(() => (document.getElementById(qs.get("tap")) || document.querySelector(`.view:not([hidden]) ${qs.get("tap")}`))?.click(), 1500);
  if (qs.has("shot") && qs.has("bk")) setTimeout(() => { openBook(qs.get("book") || "bl"); turn(+qs.get("bk")); }, 1200);
  onRoute(location.hash.replace("#", "")); // in case the page was opened directly on a girl / a world
})();

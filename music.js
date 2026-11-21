/* Music corner: plays only the SOUND of YouTube songs (the video is never shown).
   - starts on a random song with the first tap anywhere (browsers don't allow sound before a tap)
   - the bunny sticker = next song (shuffled), the round button = stop / play, the list button = whole playlist
   - a song that can't play is skipped automatically */
(() => {
  "use strict";

  const SONGS = [
    ["HCPTL619XgY", "Lollipop (Candyman)", "Aqua"],
    ["a_NmvWGy9pE", "I'm In Heaven", "A Touch Of Class"],
    ["QzcvRDWgRIE", "Butterfly", "Smile"],
    ["E5g5h3o6-MQ", "Around the World", "A Touch Of Class"],
    ["YnopHCL1Jk8", "Dragostea Din Tei", "O-Zone"],
    ["pnTIsubYbCU", "Go Away", "Weezer"],
    ["S9bCLPwzSC0", "Mockingbird", "Eminem"],
    ["tGv7CUutzqU", "About You", "The 1975"],
    ["3ukt7LLeIXg", "Boyfriend", "Big Time Rush"],
    ["koUpqQRkJis", "Any Kind of Guy", "Big Time Rush"],
    ["QJO3ROT-A4E", "What Makes You Beautiful", "One Direction"],
    ["4fndeDfaWCg", "I Want It That Way", "Backstreet Boys"],
    ["Eo-KmOd3i7s", "Bye Bye Bye", "NSYNC"],
    ["GQMlWwIXg3M", "It's Gonna Be Me", "NSYNC"],
    ["yXEtangIzvM", "Carmen", "Lana Del Rey"],
    ["Crouv5TtSvI", "Art Deco", "Lana Del Rey"],
    ["FNr6p2NSA7U", "Born To Die", "Lana Del Rey"],
    ["y1WBjdx-Q1E", "Cinnamon Girl", "Lana Del Rey"],
    ["o_1aF54DO60", "Young and Beautiful", "Lana Del Rey"],
    ["ByIpmobqkyE", "Lilith", "Saint Avangeline"],
    ["2EH-f_-YyjU", "I Will", "Chelsy"],
    ["7wvcBOZuhE0", "Secret Base", "AnoHana"],
    ["1V4AscLidWg", "Join Me In Death", "HIM"],
    ["uhRXfUPAneU", "Military Fashion Show", "And One"],
    ["JssEAFWnNHA", "Solo Tu", "Highland"],
    ["9fU60gxNScI", "Fashion", "Lady GaGa"],
  ].map(([id, title, artist], i) => ({ id, title, artist, i }));

  const $ = (s) => document.querySelector(s);
  const box = $("#music");
  const sticker = $("#m-sticker");
  const toggleBtn = $("#m-toggle");
  const listBtn = $("#m-list-btn");
  const list = $("#m-list");
  const listItems = $("#m-list-items");
  const titleEl = $("#m-title");
  const artistEl = $("#m-artist");
  const labelEl = $("#m-label");
  const hint = $("#m-hint");
  const host = $("#yt-host");
  const params = new URLSearchParams(location.search);

  const shuffle = (a) => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  let order = shuffle(SONGS.map((s) => s.i));
  let pos = 0;
  const broken = new Set();
  let yt = null, ready = false, started = false, playing = false, wantPlay = false;
  let tapT = 0, hintT = 0, skips = 0;
  const current = () => SONGS[order[pos]];

  /* ---------- what's shown ---------- */
  function show() {
    const s = current();
    titleEl.textContent = s.title;
    artistEl.textContent = s.artist;
    titleEl.classList.remove("is-long");
    requestAnimationFrame(() => {
      const over = titleEl.scrollWidth - titleEl.parentElement.clientWidth;
      if (over > 2) {
        titleEl.style.setProperty("--shift", `-${over + 24}px`);
        titleEl.style.setProperty("--dur", `${Math.max(5, over / 18)}s`);
        titleEl.classList.add("is-long");
      }
    });
    listItems.querySelectorAll("li").forEach((li) => li.classList.toggle("is-now", +li.dataset.i === s.i));
  }
  function setPlaying(on) {
    playing = on;
    box.classList.toggle("is-playing", on);
    toggleBtn.setAttribute("aria-label", on ? "Stop" : "Play");
    labelEl.textContent = on ? "now playing" : started ? "stopped" : "ready";
  }
  function say(text, ms) {
    hint.textContent = text;
    hint.classList.remove("is-off");
    clearTimeout(hintT);
    if (ms) hintT = setTimeout(() => hint.classList.add("is-off"), ms);
  }

  /* ---------- the hidden YouTube player ---------- */
  function create() {
    const vars = { controls: 0, disablekb: 1, fs: 0, rel: 0, iv_load_policy: 3, playsinline: 1 };
    if (/^https?:$/.test(location.protocol)) vars.origin = location.origin;
    yt = new YT.Player("yt", {
      width: "220",
      height: "220",
      videoId: current().id,
      playerVars: vars,
      events: {
        onReady: () => {
          ready = true;
          yt.setVolume(85);
          if (params.has("check")) return check();
          if (wantPlay) playSong();
        },
        onStateChange: (e) => {
          if (params.has("check")) return;
          const S = YT.PlayerState;
          if (e.data === S.PLAYING) {
            started = true;
            skips = 0;
            clearTimeout(tapT);
            host.classList.remove("is-tap");
            setPlaying(true);
          } else if (e.data === S.PAUSED) {
            setPlaying(false);
          } else if (e.data === S.ENDED) {
            next(false);
          }
        },
        onError: () => {
          if (params.has("check")) return;
          broken.add(current().id);
          const li = listItems.querySelector(`li[data-i="${current().i}"]`);
          if (li) li.classList.add("is-broken");
          if (++skips < SONGS.length) next(false);
        },
      },
    });
  }
  // The YouTube player is heavy: it is loaded a moment after the page and its pictures have finished, so the
  // page shows quickly on phones. It is loaded right away if someone wants music before that.
  window.onYouTubeIframeAPIReady = create;
  let apiLoading = false;
  function loadApi() {
    if (apiLoading) return;
    apiLoading = true;
    const api = document.createElement("script");
    api.src = "https://www.youtube.com/iframe_api";
    api.async = true;
    document.head.appendChild(api);
  }
  if (document.readyState === "complete") setTimeout(loadApi, 1200);
  else window.addEventListener("load", () => setTimeout(loadApi, 1200));

  function playSong() {
    wantPlay = true;
    loadApi();
    if (!ready) return;
    yt.loadVideoById(current().id);
    // iPhone/iPad only let the sound start from a tap on the player itself:
    // if nothing plays after a moment, the (invisible) player is put under the bunny for the next tap
    clearTimeout(tapT);
    tapT = setTimeout(() => {
      const st = yt.getPlayerState ? yt.getPlayerState() : -1;
      if (!playing && st !== YT.PlayerState.BUFFERING && st !== YT.PlayerState.PLAYING) {
        const r = sticker.getBoundingClientRect();
        host.style.left = `${Math.round(r.left + r.width / 2 - 110)}px`;
        host.style.top = `${Math.round(r.top + r.height / 2 - 110)}px`;
        host.classList.add("is-tap");
        say("tap the bunny to start the music ♪");
      }
    }, 4000);
  }

  /* ---------- controls ---------- */
  function next(byHand) {
    let guard = 0;
    do {
      pos++;
      if (pos >= order.length) {
        const last = order[order.length - 1];
        order = shuffle(SONGS.map((s) => s.i));
        if (order[0] === last) order.push(order.shift());
        pos = 0;
      }
    } while (broken.has(current().id) && ++guard < SONGS.length);
    show();
    if (byHand || started || wantPlay) playSong();
  }
  function start() {
    if (started || wantPlay) return;
    say("tap the bunny to change the song", 4000);
    playSong();
  }
  function toggle() {
    if (!started && !wantPlay) return start();
    if (playing) {
      yt.pauseVideo();
      wantPlay = false;
    } else if (ready) {
      wantPlay = true;
      if (yt.getPlayerState() === YT.PlayerState.PAUSED) yt.playVideo();
      else playSong();
    }
  }
  function notes() {
    const r = sticker.getBoundingClientRect();
    for (let k = 0; k < 5; k++) {
      const n = document.createElement("span");
      n.className = "m-note";
      n.textContent = k % 2 ? "♫" : "♪";
      n.style.cssText = `left:${r.left + r.width / 2}px;top:${r.top + r.height * 0.3}px;--z:${14 + Math.random() * 12}px`;
      document.body.appendChild(n);
      const dx = -20 - Math.random() * 70, dy = -40 - Math.random() * 70;
      const a = n.animate(
        [
          { transform: "translate(-50%,-50%) scale(.5)", opacity: 0 },
          { transform: `translate(calc(-50% + ${dx * 0.3}px), calc(-50% + ${dy * 0.3}px)) scale(1)`, opacity: 1, offset: 0.25 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.9) rotate(${Math.random() * 40 - 20}deg)`, opacity: 0 },
        ],
        { duration: 900 + Math.random() * 400, easing: "ease-out" }
      );
      a.onfinish = () => n.remove();
    }
  }

  sticker.addEventListener("click", () => {
    sticker.classList.remove("is-squish");
    void sticker.offsetWidth;
    sticker.classList.add("is-squish");
    notes();
    if (!started && !wantPlay) start();
    else next(true);
  });
  toggleBtn.addEventListener("click", toggle);

  // the whole playlist
  SONGS.forEach((s) => {
    const li = document.createElement("li");
    li.dataset.i = s.i;
    const b = document.createElement("button");
    b.type = "button";
    b.innerHTML = `<span class="n">${s.i + 1}</span><span class="t"><b></b><span></span></span>`;
    b.querySelector("b").textContent = s.title;
    b.querySelector(".t span").textContent = s.artist;
    b.addEventListener("click", () => {
      pos = order.indexOf(s.i);
      show();
      playSong();
      openList(false);
    });
    li.appendChild(b);
    listItems.appendChild(li);
  });
  $("#m-list-n").textContent = `${SONGS.length} songs`;
  function openList(on) {
    list.hidden = !on;
    listBtn.setAttribute("aria-expanded", String(on));
    if (on) {
      clearTimeout(hintT);
      hint.classList.add("is-off");
      const now = listItems.querySelector(".is-now");
      if (now) now.scrollIntoView({ block: "center" });
    }
  }
  listBtn.addEventListener("click", () => openList(list.hidden));
  document.addEventListener("pointerdown", (e) => {
    if (!list.hidden && !box.contains(e.target)) openList(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") openList(false);
  });

  // first tap anywhere on the page starts the music
  const firstTap = (e) => {
    if (e.target && box.contains(e.target)) return;
    document.removeEventListener("pointerdown", firstTap, true);
    document.removeEventListener("keydown", firstTap, true);
    start();
  };
  document.addEventListener("pointerdown", firstTap, true);
  document.addEventListener("keydown", firstTap, true);

  show();
  setPlaying(false);
  if (params.has("list")) openList(true);

  /* ---------- ?check=1: tries every song (muted) and writes which ones play ---------- */
  function check() {
    const out = document.createElement("pre");
    out.id = "check-out";
    out.style.cssText = "position:fixed;left:8px;top:8px;right:8px;z-index:99;background:#fff;font:12px monospace;white-space:pre-wrap;padding:8px";
    document.body.appendChild(out);
    yt.mute();
    let k = 0;
    const lines = [];
    const report = (msg) => {
      if (location.hostname === "localhost") new Image().src = `/__report?msg=${encodeURIComponent(msg)}&t=${Date.now()}`;
    };
    const tryOne = () => {
      if (k >= SONGS.length) {
        out.textContent = lines.join("\n") + "\nDONE";
        report("DONE");
        return;
      }
      const s = SONGS[k];
      let done = false;
      const finish = (txt) => {
        if (done) return;
        done = true;
        yt.removeEventListener("onStateChange", onState);
        yt.removeEventListener("onError", onErr);
        lines.push(`${k + 1}. ${s.artist} - ${s.title}: ${txt}`);
        out.textContent = lines.join("\n");
        report(lines[lines.length - 1]);
        k++;
        setTimeout(tryOne, 300);
      };
      const onState = (e) => {
        if (e.data === YT.PlayerState.PLAYING) setTimeout(() => finish(`OK (${Math.round(yt.getDuration())}s)`), 600);
      };
      const onErr = (e) => finish(`ERROR ${e.data}`);
      yt.addEventListener("onStateChange", onState);
      yt.addEventListener("onError", onErr);
      yt.loadVideoById(s.id);
      setTimeout(() => finish(`TIMEOUT (state ${yt.getPlayerState()})`), 15000);
    };
    tryOne();
  }
})();

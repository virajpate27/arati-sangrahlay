/**
 * reader.js — the Aarti Reading Experience.
 *
 * Responsibilities:
 *  - render an Aarti's verses as semantic <section data-verse="n"> blocks
 *  - track which verse is currently "being read" via IntersectionObserver
 *    (never via scroll-position math)
 *  - sync that state to: verse highlighting, the desktop rail,
 *    the mobile sticky "कडवा X / N" indicator
 *  - Normal / Focus reading modes
 *  - font-size control (persisted)
 *  - manual verse marker (bookmark) per Aarti, persisted
 *  - favorite toggle, share (Web Share API + clipboard fallback)
 *  - records the Aarti into "recently read"
 *  - if audio + verse timings exist in data, verse pointer can follow
 *    audio playback (architecture ready; no audio files shipped yet)
 */

(function () {
  const params = new URLSearchParams(window.location.search);
  const aartiId = params.get("id");
  const aarti = aartiId ? AppUtils.findAarti(aartiId) : null;

  const root = document.querySelector("[data-reader-root]");
  if (!root) return;

  if (!aarti) {
    root.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>
        <p>ही आरती सापडली नाही.</p>
        <div style="margin-top:18px;"><a class="btn btn-primary" href="list.html">आरत्यांकडे परत जा</a></div>
      </div>`;
    return;
  }

  Storage.pushRecent(aarti.id);

  // ---------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------
  const titleEl = document.querySelector("[data-aarti-title]");
  const introTitleEl = document.querySelector("[data-intro-title]");
  const introDeityEl = document.querySelector("[data-intro-deity]");
  const railEl = document.querySelector("[data-verse-rail]");
  const versesWrap = document.querySelector("[data-verses-wrap]");
  const indicatorEl = document.querySelector("[data-verse-indicator]");
  const readerBody = document.querySelector("[data-reader-body]");
  const favBtnHeader = document.querySelector("[data-fav-toggle-header]");
  const favBtnBar = document.querySelector("[data-fav-toggle-bar]");

  document.title = `${aarti.title} — आरती संग्रहालय`;
  if (titleEl) titleEl.textContent = aarti.title;
  if (introTitleEl) introTitleEl.textContent = aarti.title;
  if (introDeityEl) introDeityEl.textContent = aarti.deity;

  function verseLabelText(n) {
    return `कडवा ${n} / ${aarti.verses.length}`;
  }

  function verseTemplate(v, i) {
    return `
      <section class="aarti-verse" id="verse-${v.id}" data-verse="${v.id}" tabindex="-1" aria-label="कडवा ${i + 1}">
        <span class="verse-label">${verseLabelText(i + 1)}</span>
        <button class="verse-mark-btn" data-mark-verse="${v.id}" aria-label="हा कडवा निवडा" aria-pressed="false">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21 12 16l-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        </button>
        <p>${AppUtils.esc(v.text)}</p>
      </section>`;
  }

  function railTemplate(v, i) {
    return `
      <button data-rail-verse="${v.id}" aria-label="कडवा ${i + 1} कडे जा">
        <span class="dot"></span>
        कडवा ${i + 1}
      </button>`;
  }

  if (versesWrap) {
    versesWrap.innerHTML = aarti.verses.map(verseTemplate).join("");
  }
  if (railEl) {
    railEl.innerHTML = `<div class="rail-line"></div>` + aarti.verses.map(railTemplate).join("");
  }

  const verseEls = Array.from(document.querySelectorAll(".aarti-verse"));
  const railBtns = Array.from(document.querySelectorAll("[data-rail-verse]"));

  // ---------------------------------------------------------------
  // Favorite state
  // ---------------------------------------------------------------
  function heartIcon(active) {
    return `<svg viewBox="0 0 24 24" fill="${active ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`;
  }
  function syncFavButtons() {
    const isFav = Storage.isFavorite(aarti.id);
    [favBtnHeader, favBtnBar].forEach((btn) => {
      if (!btn) return;
      btn.classList.toggle("is-active", isFav);
      btn.setAttribute("aria-pressed", String(isFav));
      const icon = btn.querySelector("svg") ? null : null;
      if (btn.dataset.iconHost !== undefined) return;
      btn.querySelectorAll("svg").forEach((s) => s.remove());
      btn.insertAdjacentHTML("beforeend", heartIcon(isFav));
    });
  }
  [favBtnHeader, favBtnBar].forEach((btn) => {
    if (!btn) return;
    btn.addEventListener("click", () => {
      Storage.toggleFavorite(aarti.id);
      syncFavButtons();
      document.dispatchEvent(new CustomEvent("favorites:changed", { detail: { id: aarti.id } }));
    });
  });
  syncFavButtons();

  // ---------------------------------------------------------------
  // Manual verse marker ("हा कडवा निवडा")
  // ---------------------------------------------------------------
  function syncMarker() {
    const marked = Storage.getMarker(aarti.id);
    verseEls.forEach((el) => {
      const vId = Number(el.getAttribute("data-verse"));
      const isMarked = marked === vId;
      el.classList.toggle("is-marked", isMarked);
      const btn = el.querySelector("[data-mark-verse]");
      if (btn) btn.setAttribute("aria-pressed", String(isMarked));
    });
  }
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-mark-verse]");
    if (!btn) return;
    const vId = Number(btn.getAttribute("data-mark-verse"));
    const current = Storage.getMarker(aarti.id);
    if (current === vId) {
      Storage.clearMarker(aarti.id);
      showToast("कडवा चिन्हांकन काढले");
    } else {
      Storage.setMarker(aarti.id, vId);
      showToast("कडवा चिन्हांकित केला");
    }
    syncMarker();
  });
  syncMarker();

  // ---------------------------------------------------------------
  // Active verse tracking via IntersectionObserver
  // ---------------------------------------------------------------
  let activeVerseId = aarti.verses[0].id;

  function setActiveVerse(verseId, opts) {
    opts = opts || {};
    if (verseId === activeVerseId && !opts.force) return;
    activeVerseId = verseId;
    const index = aarti.verses.findIndex((v) => v.id === verseId);

    verseEls.forEach((el) => {
      el.classList.toggle("is-active", Number(el.getAttribute("data-verse")) === verseId);
    });
    railBtns.forEach((btn) => {
      btn.classList.toggle("is-active", Number(btn.getAttribute("data-rail-verse")) === verseId);
    });

    if (indicatorEl) {
      indicatorEl.querySelector("[data-indicator-text]").textContent = verseLabelText(index + 1);
      if (!AppUtils.prefersReducedMotion()) {
        indicatorEl.classList.remove("bump");
        // force reflow to restart animation
        void indicatorEl.offsetWidth;
        indicatorEl.classList.add("bump");
      }
    }
  }

  const visibility = new Map();

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const id = Number(entry.target.getAttribute("data-verse"));
        visibility.set(id, entry.isIntersecting ? entry.intersectionRatio : 0);
      });
      // Pick the verse with the greatest visible ratio within the focus band.
      let bestId = activeVerseId;
      let bestRatio = -1;
      visibility.forEach((ratio, id) => {
        if (ratio > bestRatio) {
          bestRatio = ratio;
          bestId = id;
        }
      });
      if (bestRatio > 0) setActiveVerse(bestId);
    },
    {
      root: null,
      // Narrow band around the vertical center of the viewport —
      // whichever verse occupies that band is "the one being read".
      rootMargin: "-38% 0px -42% 0px",
      threshold: [0, 0.25, 0.5, 0.75, 1],
    }
  );

  verseEls.forEach((el) => observer.observe(el));
  setActiveVerse(activeVerseId, { force: true });

  // Rail / indicator click-to-scroll
  railBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.getAttribute("data-rail-verse"));
      document.getElementById(`verse-${id}`)?.scrollIntoView({ behavior: AppUtils.prefersReducedMotion() ? "auto" : "smooth", block: "center" });
    });
  });

  // ---------------------------------------------------------------
  // Reading mode: Normal / Focus
  // ---------------------------------------------------------------
  const modeButtons = document.querySelectorAll("[data-reading-mode]");
  function applyReadingMode(mode) {
    if (readerBody) readerBody.classList.toggle("focus-mode", mode === "focus");
    modeButtons.forEach((btn) => btn.classList.toggle("is-active", btn.getAttribute("data-reading-mode") === mode));
    Storage.setReadingMode(mode);
  }
  modeButtons.forEach((btn) => {
    btn.addEventListener("click", () => applyReadingMode(btn.getAttribute("data-reading-mode")));
  });
  applyReadingMode(Storage.getReadingMode());

  // ---------------------------------------------------------------
  // Font size controls
  // ---------------------------------------------------------------
  function applyFontSize(size) {
    if (!versesWrap) return;
    Storage.FONT_STEPS.forEach((s) => versesWrap.classList.remove(`font-${s}`));
    versesWrap.classList.add(`font-${size}`);
    Storage.setFontSize(size);
    document.querySelectorAll("[data-font-option]").forEach((btn) => {
      btn.classList.toggle("is-active", btn.getAttribute("data-font-option") === size);
    });
  }
  applyFontSize(Storage.getFontSize());

  document.querySelectorAll("[data-font-decrease]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const idx = Storage.FONT_STEPS.indexOf(Storage.getFontSize());
      applyFontSize(Storage.FONT_STEPS[Math.max(0, idx - 1)]);
    })
  );
  document.querySelectorAll("[data-font-increase]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const idx = Storage.FONT_STEPS.indexOf(Storage.getFontSize());
      applyFontSize(Storage.FONT_STEPS[Math.min(Storage.FONT_STEPS.length - 1, idx + 1)]);
    })
  );
  document.querySelectorAll("[data-font-reset]").forEach((btn) =>
    btn.addEventListener("click", () => applyFontSize("normal"))
  );
  document.querySelectorAll("[data-font-option]").forEach((btn) =>
    btn.addEventListener("click", () => applyFontSize(btn.getAttribute("data-font-option")))
  );

  // ---------------------------------------------------------------
  // Share
  // ---------------------------------------------------------------
  function currentVerseText() {
    const v = aarti.verses.find((v) => v.id === activeVerseId);
    return v ? v.text.replace(/\n/g, " ") : "";
  }
  async function shareAarti() {
    const shareText = `${aarti.title}\n\n${currentVerseText()}\n\n— आरती संग्रहालय`;
    if (navigator.share) {
      try {
        await navigator.share({ title: aarti.title, text: shareText });
      } catch (e) {
        /* user cancelled — no-op */
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        showToast("मजकूर क्लिपबोर्डवर कॉपी केला");
      } catch (e) {
        showToast("शेअर करता आले नाही");
      }
    }
  }
  document.querySelectorAll("[data-share-aarti]").forEach((btn) => btn.addEventListener("click", shareAarti));

  // ---------------------------------------------------------------
  // Audio (architecture-ready; no files shipped in v1)
  // ---------------------------------------------------------------
  document.querySelectorAll("[data-audio-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (aarti.audio && aarti.audio.src) {
        // Future: Howler.js playback + verse-follow via aarti.audio.timings
        showToast("ऑडिओ प्लेबॅक लवकरच येत आहे");
      } else {
        showToast("या आरतीसाठी ऑडिओ अद्याप उपलब्ध नाही");
      }
    });
  });

  // ---------------------------------------------------------------
  // Bottom sheet ("more options")
  // ---------------------------------------------------------------
  const sheet = document.querySelector("[data-sheet]");
  const sheetBackdrop = document.querySelector("[data-sheet-backdrop]");
  function openSheet() {
    sheet?.classList.add("is-open");
    sheetBackdrop?.classList.add("is-open");
  }
  function closeSheet() {
    sheet?.classList.remove("is-open");
    sheetBackdrop?.classList.remove("is-open");
  }
  document.querySelectorAll("[data-open-sheet]").forEach((btn) => btn.addEventListener("click", openSheet));
  sheetBackdrop?.addEventListener("click", closeSheet);
  document.querySelectorAll("[data-close-sheet]").forEach((btn) => btn.addEventListener("click", closeSheet));

  // ---------------------------------------------------------------
  // Toast
  // ---------------------------------------------------------------
  let toastTimer = null;
  function showToast(msg) {
    let toastEl = document.querySelector(".toast");
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
  }
})();

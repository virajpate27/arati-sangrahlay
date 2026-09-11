/**
 * aarti.js — rendering helpers for Aarti cards, category tiles,
 * and the featured/popular sections on the Home page.
 * Kept generic: pages just call these with whatever data subset
 * they need, so adding a new Aarti to data/aartis.js is enough
 * for it to show up everywhere.
 */

const AartiCards = (() => {
  function heartIcon(active) {
    return `<svg viewBox="0 0 24 24" fill="${active ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`;
  }

  function cardTemplate(aarti) {
    const fav = Storage.isFavorite(aarti.id);
    return `
      <article class="aarti-card" data-entrance data-aarti-card="${aarti.id}">
        <a href="aarti.html?id=${encodeURIComponent(aarti.id)}" class="card-top-link" style="display:block; text-decoration:none; color:inherit;">
          <div class="card-top">
            <div>
              <span class="card-deity">${AppUtils.esc(aarti.deity)}</span>
              <h3>${AppUtils.esc(aarti.title)}</h3>
            </div>
          </div>
          <p class="card-line">${AppUtils.esc(AppUtils.firstLine(aarti))}</p>
        </a>
        <div class="card-meta">
          <span class="verse-count">कडवे: ${aarti.verses.length}</span>
          <div class="card-actions">
            <button class="fav-btn ${fav ? "is-active" : ""}" data-fav-toggle="${aarti.id}" aria-label="आवडती चिन्हांकित करा" aria-pressed="${fav}">
              ${heartIcon(fav)}
            </button>
            <a class="read-link" href="aarti.html?id=${encodeURIComponent(aarti.id)}">
              वाचा
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </a>
          </div>
        </div>
      </article>`;
  }

  function renderCards(container, aartis, emptyMessage) {
    if (!container) return;
    if (!aartis.length) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
          <p>${emptyMessage || "तुमच्या शोधाशी जुळणारी आरती सापडली नाही."}</p>
        </div>`;
      return;
    }
    container.innerHTML = aartis.map(cardTemplate).join("");
    bindFavButtons(container);
  }

  function bindFavButtons(scope) {
    (scope || document).querySelectorAll("[data-fav-toggle]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const id = btn.getAttribute("data-fav-toggle");
        const nowFav = Storage.toggleFavorite(id);
        btn.classList.toggle("is-active", nowFav);
        btn.setAttribute("aria-pressed", String(nowFav));
        btn.innerHTML = heartIcon(nowFav);
        document.dispatchEvent(new CustomEvent("favorites:changed", { detail: { id, isFavorite: nowFav } }));
      });
    });
  }

  function categoryTileTemplate(cat) {
    const count = AARTI_DATA.filter((a) => a.category === cat.id).length;
    return `
      <a class="category-tile" data-entrance href="list.html?category=${cat.id}">
        <span class="tile-icon"><i data-lucide="${cat.icon}"></i></span>
        <h3>${AppUtils.esc(cat.label)}</h3>
        <span class="tile-count">${count} आरत्या</span>
      </a>`;
  }

  function renderCategoryGrid(container) {
    if (!container) return;
    container.innerHTML = CATEGORY_DATA.map(categoryTileTemplate).join("");
    if (window.lucide) lucide.createIcons();
  }

  function chipTemplate(cat, activeId) {
    return `<a class="chip ${cat.id === activeId ? "is-active" : ""}" href="list.html?category=${cat.id}"><i data-lucide="${cat.icon}"></i>${AppUtils.esc(cat.label)}</a>`;
  }

  function renderChips(container, activeId) {
    if (!container) return;
    container.innerHTML = CATEGORY_DATA.map((c) => chipTemplate(c, activeId)).join("");
    if (window.lucide) lucide.createIcons();
  }

  return { renderCards, renderCategoryGrid, renderChips, bindFavButtons, cardTemplate };
})();

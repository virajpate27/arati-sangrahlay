/**
 * favorites.js — powers favorites.html: two tabs,
 * "माझ्या आवडत्या आरत्या" and "अलीकडे वाचलेल्या".
 */

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.querySelector("[data-fav-grid]");
  const tabs = document.querySelectorAll("[data-fav-tab]");
  if (!grid || !tabs.length) return;

  let active = "favorites";

  function render() {
    let list;
    let emptyMsg;
    if (active === "favorites") {
      const favIds = Storage.getFavorites();
      list = favIds.map((id) => AppUtils.findAarti(id)).filter(Boolean);
      emptyMsg = "अजून कोणतीही आरती आवडती म्हणून चिन्हांकित केलेली नाही.";
    } else {
      const recentIds = Storage.getRecent();
      list = recentIds.map((id) => AppUtils.findAarti(id)).filter(Boolean);
      emptyMsg = "अजून कोणतीही आरती वाचलेली नाही.";
    }
    AartiCards.renderCards(grid, list, emptyMsg);
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      active = tab.getAttribute("data-fav-tab");
      tabs.forEach((t) => t.classList.toggle("is-active", t === tab));
      render();
    });
  });

  document.addEventListener("favorites:changed", () => {
    if (active === "favorites") render();
  });

  render();
});

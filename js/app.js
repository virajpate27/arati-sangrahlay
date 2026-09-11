/**
 * app.js — bootstrapping shared across every page:
 * icon rendering, active-nav highlighting, header menu,
 * footer year, reduced-motion detection, small helpers.
 */

const AppUtils = (() => {
  function byCategory(id) {
    return CATEGORY_DATA.find((c) => c.id === id);
  }

  function findAarti(id) {
    return AARTI_DATA.find((a) => a.id === id);
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  // Escape text placed into innerHTML.
  function esc(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // Format "पहिली ओळ" — first line of an aarti's opening verse.
  function firstLine(aarti) {
    return aarti.description || (aarti.verses[0] && aarti.verses[0].text.split("\n")[0]);
  }

  return { byCategory, findAarti, prefersReducedMotion, esc, firstLine };
})();

document.addEventListener("DOMContentLoaded", () => {
  // Icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // Footer year
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  // Mobile menu toggle
  const menuBtn = document.querySelector("[data-menu-toggle]");
  const menuPanel = document.querySelector("[data-menu-panel]");
  if (menuBtn && menuPanel) {
    menuBtn.addEventListener("click", () => {
      const isOpen = menuPanel.classList.toggle("is-open");
      menuBtn.setAttribute("aria-expanded", String(isOpen));
      document.body.classList.toggle("no-scroll", isOpen);
    });
    menuPanel.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        menuPanel.classList.remove("is-open");
        menuBtn.setAttribute("aria-expanded", "false");
        document.body.classList.remove("no-scroll");
      });
    });
  }

  // Highlight current nav link
  const path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("[data-nav-link]").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === path || (path === "" && href === "index.html")) {
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
    }
  });

  // Page entrance animation (single orchestrated moment)
  if (!AppUtils.prefersReducedMotion() && window.gsap) {
    gsap.set("[data-entrance]", { opacity: 0, y: 16 });
    gsap.to("[data-entrance]", {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: "power2.out",
      stagger: 0.06,
      delay: 0.05,
    });
  } else {
    document.querySelectorAll("[data-entrance]").forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
  }
});

/**
 * search.js — instant client-side search across title, deity,
 * category label and first line. Shared by the home search bar
 * (which redirects to list.html?q=...) and the list page itself.
 */

const AartiSearch = (() => {
  function normalize(str) {
    return (str || "").toLowerCase().trim();
  }

  function matches(aarti, query) {
    if (!query) return true;
    const q = normalize(query);
    const cat = AppUtils.byCategory(aarti.category);
    const haystack = [
      aarti.title,
      aarti.deity,
      cat ? cat.label : "",
      AppUtils.firstLine(aarti),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  }

  function run(query, opts) {
    opts = opts || {};
    let results = AARTI_DATA.filter((a) => matches(a, query));

    if (opts.category) {
      results = results.filter((a) => a.category === opts.category);
    }
    if (opts.favoritesOnly) {
      const favs = Storage.getFavorites();
      results = results.filter((a) => favs.includes(a.id));
    }
    if (opts.letter) {
      results = results.filter((a) => a.title.trim().startsWith(opts.letter));
    }

    switch (opts.sort) {
      case "az":
        results = results.sort((a, b) => a.title.localeCompare(b.title, "mr"));
        break;
      case "verses":
        results = results.sort((a, b) => a.verses.length - b.verses.length);
        break;
      default:
        break; // "relevance" / default: keep data order
    }

    return results;
  }

  // Attach an instant-search input to a render callback.
  function bindInstantSearch(input, onChange) {
    if (!input) return;
    let timer = null;
    input.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(() => onChange(input.value), 90);
    });
  }

  return { run, matches, bindInstantSearch };
})();

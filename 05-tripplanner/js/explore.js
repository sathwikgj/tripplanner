document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("countries-grid");
  const countText = document.getElementById("countries-count");
  const loadMoreButton = document.getElementById("load-more-btn");
  const regionButtons = document.querySelectorAll("[data-region]");
  const templateElement = document.getElementById("country-card-template");
  const sortSelect = document.getElementById("sort-select");

  if (!grid || !countText || !loadMoreButton || !templateElement) {
    return;
  }

  const API_URL =
    "https://restcountries.com/v3.1/all?fields=name,capital,region,population,flags,cca3,area";

  const PAGE_SIZE = 12;

  const cardTemplate = templateElement.content
    .querySelector(".card")
    .cloneNode(true);

  templateElement.remove();

  let allCountries = [];
  let currentRegion = "all";
  let visibleCount = PAGE_SIZE;
  let currentSort = "name-asc";

  loadCountries();
  setupRegionButtons();
  setupLoadMoreButton();
  setupSortSelect();

  async function loadCountries() {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      console.log("Fetched countries:", data);

      allCountries = data;

      showCountries();
    } catch (error) {
      console.error("Failed to load countries:", error);
      grid.innerHTML =
        "<p>Could not load countries. Please refresh the page and try again.</p>";
      countText.textContent = "Showing 0 countries";
      loadMoreButton.style.display = "none";
    }
  }

  function setupRegionButtons() {
    regionButtons.forEach((button) => {
      button.addEventListener("click", () => {
        currentRegion = button.dataset.region || "all";
        visibleCount = PAGE_SIZE;

        regionButtons.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");

        showCountries();
      });
    });
  }

  function setupLoadMoreButton() {
    loadMoreButton.addEventListener("click", () => {
      visibleCount += PAGE_SIZE;
      showCountries();
    });
  }

  function setupSortSelect() {
    if (!sortSelect) return;

    sortSelect.addEventListener("change", () => {
      currentSort = sortSelect.value || "name-asc";
      visibleCount = PAGE_SIZE;
      showCountries();
    });
  }

  function getCountriesForCurrentRegion() {
    if (currentRegion === "all") {
      return allCountries;
    }

    return allCountries.filter((country) => country.region === currentRegion);
  }

  function showCountries() {
    const filtered = sortCountries(getCountriesForCurrentRegion().slice());
    const visibleCountries = filtered.slice(0, visibleCount);

    grid.innerHTML = "";

    visibleCountries.forEach((country) => {
      const card = createCountryCard(country);
      grid.appendChild(card);
    });

    countText.textContent = `Showing ${visibleCountries.length} countries`;

    if (visibleCountries.length >= filtered.length) {
      loadMoreButton.style.display = "none";
    } else {
      loadMoreButton.style.display = "inline-flex";
    }
  }

  function sortCountries(list) {
    switch (currentSort) {
      case "name-desc":
        return list.sort((a, b) =>
          b.name.common.localeCompare(a.name.common)
        );
      case "population-desc":
        return list.sort((a, b) => (b.population || 0) - (a.population || 0));
      case "population-asc":
        return list.sort((a, b) => (a.population || 0) - (b.population || 0));
      case "area-desc":
        return list.sort((a, b) => (b.area || 0) - (a.area || 0));
      case "name-asc":
      default:
        return list.sort((a, b) =>
          a.name.common.localeCompare(b.name.common)
        );
    }
  }

  function createCountryCard(country) {
    const card = cardTemplate.cloneNode(true);

    const flagImg = card.querySelector(".country-flag");
    const nameEl = card.querySelector(".country-name");
    const regionEl = card.querySelector(".country-region");
    const capitalEl = card.querySelector(".country-capital");
    const populationEl = card.querySelector(".country-population");
    const areaEl = card.querySelector(".country-area");

    const flagUrl =
      country.flags && (country.flags.svg || country.flags.png || "");

    if (flagImg && flagUrl) {
      flagImg.src = flagUrl;
      flagImg.alt = `${country.name.common} flag`;
    }

    if (nameEl) {
      nameEl.textContent = country.name.common;
    }

    if (regionEl) {
      regionEl.textContent = country.region || "Unknown region";
    }

    const capital =
      country.capital && country.capital.length > 0 ? country.capital[0] : "N/A";

    if (capitalEl) {
      capitalEl.textContent = `Capital: ${capital}`;
    }

    if (populationEl) {
      populationEl.textContent = `Population: ${formatNumber(
        country.population
      )}`;
    }

    if (areaEl) {
      areaEl.textContent = `Area: ${formatNumber(country.area)} km²`;
    }

    // ✅ ===== Wishlist Logic (FIXED - INSIDE createCountryCard) =====
    const heartBtn = card.querySelector(".heart");

    if (heartBtn) {
      const WISHLIST_KEY = "wishlist";

      function getWishlist() {
        return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [];
      }

      function saveWishlist(list) {
        localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
      }

      // set initial state
      const exists = getWishlist().some((c) => c.cca3 === country.cca3);
      heartBtn.textContent = exists ? "♥" : "♡";

      heartBtn.addEventListener("click", () => {
        let list = getWishlist();
        const alreadyExists = list.some((c) => c.cca3 === country.cca3);

        if (alreadyExists) {
          list = list.filter((c) => c.cca3 !== country.cca3);
          heartBtn.textContent = "♡";
        } else {
          list.push({
            cca3: country.cca3,
            name: country.name.common,
            capital: country.capital?.[0] || "N/A",
            region: country.region,
            population: country.population,
            area: country.area,
            flag: country.flags?.svg || country.flags?.png || "",
          });

          heartBtn.textContent = "♥";
        }

        saveWishlist(list);
        if (window.updateWishlistCount) {
          window.updateWishlistCount();
        }
      });
    }
    // ✅ ===== End Wishlist Logic =====

    return card;
  }

  function formatNumber(value) {
    if (typeof value !== "number") {
      return "-";
    }

    return value.toLocaleString("en-US");
  }
});
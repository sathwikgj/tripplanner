// Country detail page — read code from URL, fetch and render country details,
// border countries, and wishlist toggle

document.addEventListener("DOMContentLoaded", () => {
  const htmlEl = document.documentElement;
  if (!htmlEl || htmlEl.dataset.page !== "country") return;

  const flagImg = document.getElementById("country-flag");
  const nameEl = document.getElementById("country-name");
  const nativeNameEl = document.getElementById("country-native-name");
  const capitalEl = document.getElementById("country-capital");
  const regionEl = document.getElementById("country-region");
  const subregionEl = document.getElementById("country-subregion");
  const populationEl = document.getElementById("country-population");
  const areaEl = document.getElementById("country-area");
  const languagesEl = document.getElementById("country-languages");
  const currenciesEl = document.getElementById("country-currencies");
  const timezonesEl = document.getElementById("country-timezones");
  const borderContainer = document.getElementById("border-countries");
  const wishlistToggle = document.getElementById("wishlist-toggle");
  const errorEl = document.getElementById("country-error");

  if (
    !flagImg ||
    !nameEl ||
    !capitalEl ||
    !regionEl ||
    !subregionEl ||
    !populationEl ||
    !areaEl ||
    !languagesEl ||
    !currenciesEl ||
    !timezonesEl ||
    !borderContainer ||
    !wishlistToggle ||
    !errorEl
  ) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");

  if (!code) {
    showError("No country selected. Go back and choose a country.");
    return;
  }

  function getCurrentUser() {
    return localStorage.getItem("currentUser") || null;
  }

  function makeUserKey(base) {
    const user = getCurrentUser();
    return user ? `${base}_${user}` : base;
  }

  const FIELDS =
    "name,capital,region,subregion,population,area,flags,cca3,borders,languages,currencies,timezones";

  const COUNTRY_URL = `https://restcountries.com/v3.1/alpha/${encodeURIComponent(
    code
  )}?fields=${FIELDS}`;

  const WISHLIST_KEY = makeUserKey("wishlist");

  function getWishlist() {
    return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [];
  }

  function saveWishlist(list) {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
  }

  function formatNumber(value) {
    if (typeof value !== "number") return "-";
    return value.toLocaleString("en-US");
  }

  function showError(message) {
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  async function loadCountry() {
    try {
      const response = await fetch(COUNTRY_URL);
      const data = await response.json();
      const country = Array.isArray(data) ? data[0] : data;

      if (!country) {
        showError("Could not load this country. Please try again.");
        return;
      }

      renderCountry(country);
      await renderBorders(country.borders || []);
    } catch (error) {
      console.error("Failed to load country", error);
      showError("Something went wrong while loading this country.");
    }
  }

  function renderCountry(country) {
    const flagUrl =
      country.flags && (country.flags.svg || country.flags.png || "");

    if (flagUrl) {
      flagImg.src = flagUrl;
      flagImg.alt = `${country.name?.common || "Country"} flag`;
    }

    const commonName = country.name?.common || "Unknown country";
    const nativeName =
      country.name?.nativeName &&
      Object.values(country.name.nativeName)[0]?.official;

    nameEl.textContent = commonName;
    nativeNameEl.textContent = nativeName || "";

    const capital =
      country.capital && country.capital.length > 0
        ? country.capital[0]
        : "N/A";

    capitalEl.textContent = capital;
    regionEl.textContent = country.region || "Unknown region";
    subregionEl.textContent = country.subregion || "N/A";
    populationEl.textContent = `${formatNumber(country.population)} people`;
    areaEl.textContent = `${formatNumber(country.area)} km²`;

    const languages = country.languages
      ? Object.values(country.languages).join(", ")
      : "N/A";
    languagesEl.textContent = languages;

    const currencies = country.currencies
      ? Object.values(country.currencies)
          .map((c) => `${c.name}${c.symbol ? ` (${c.symbol})` : ""}`)
          .join(", ")
      : "N/A";
    currenciesEl.textContent = currencies;

    const timezones = Array.isArray(country.timezones)
      ? country.timezones.join(", ")
      : "N/A";
    timezonesEl.textContent = timezones;

    const summary = {
      cca3: country.cca3,
      name: commonName,
      capital,
      region: country.region,
      population: country.population,
      area: country.area,
      flag: flagUrl,
    };

    setupWishlistToggle(summary);
  }

  async function renderBorders(borderCodes) {
    borderContainer.innerHTML = "";

    if (!Array.isArray(borderCodes) || borderCodes.length === 0) {
      borderContainer.textContent = "No border countries";
      return;
    }

    try {
      const response = await fetch(
        `https://restcountries.com/v3.1/alpha?codes=${borderCodes.join(
          ","
        )}&fields=name,cca3,flags`
      );
      const data = await response.json();

      data.forEach((borderCountry) => {
        const pill = document.createElement("button");
        pill.className = "border-pill";
        const borderName = borderCountry.name?.common || borderCountry.cca3;
        const flagUrl =
          borderCountry.flags &&
          (borderCountry.flags.svg || borderCountry.flags.png || "");

        if (flagUrl) {
          pill.innerHTML = `
            <img class="border-flag" src="${flagUrl}" alt="${borderName} flag" />
            <span>${borderName}</span>
          `;
        } else {
          pill.textContent = borderName;
        }

        pill.addEventListener("click", () => {
          const nextCode = borderCountry.cca3;
          if (!nextCode) return;

          const url = new URL(window.location.href);
          url.searchParams.set("code", nextCode);
          window.location.href = url.toString();
        });
        borderContainer.appendChild(pill);
      });
    } catch (error) {
      console.error("Failed to load border countries", error);
      borderContainer.textContent = "Could not load border countries";
    }
  }

  function setupWishlistToggle(summary) {
    function isInWishlist() {
      return getWishlist().some((c) => c.cca3 === summary.cca3);
    }

    function updateButton() {
      if (isInWishlist()) {
        wishlistToggle.textContent = "♥ In Wishlist";
        wishlistToggle.classList.add("is-active");
      } else {
        wishlistToggle.textContent = "♡ Add to Wishlist";
        wishlistToggle.classList.remove("is-active");
      }
    }

    wishlistToggle.addEventListener("click", () => {
      let list = getWishlist();
      const exists = list.some((c) => c.cca3 === summary.cca3);

      if (exists) {
        list = list.filter((c) => c.cca3 !== summary.cca3);
      } else {
        list.push(summary);
      }

      saveWishlist(list);
      updateButton();

      if (window.updateWishlistCount) {
        window.updateWishlistCount();
      }
    });

    updateButton();
  }

  loadCountry();
});

// Country detail page — read code from URL, fetch and render country details, border countries, wishlist toggle

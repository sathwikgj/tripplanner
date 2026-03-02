// Wishlist page — load wishlist from localStorage, render country cards, remove functionality
document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("wishlist-grid");
  const count = document.getElementById("wishlist-count");
  const empty = document.getElementById("empty-state");
  const planButton = document.querySelector(".btn-plan");

  if (!grid || !count || !empty) return;

  if (planButton) {
    planButton.addEventListener("click", () => {
      window.location.href = "planner.html";
    });
  }

  const WISHLIST_KEY = "wishlist";

  function getWishlist() {
    return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [];
  }

  function saveWishlist(list) {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
  }

  function render() {
    const list = getWishlist();

    count.textContent = `${list.length} countries in your wishlist`;

    if (list.length === 0) {
      empty.style.display = "block";
      grid.style.display = "none";
      grid.innerHTML = "";
      return;
    }

    empty.style.display = "none";
    grid.style.display = "flex";
    grid.innerHTML = "";

    list.forEach((country) => {
      const card = document.createElement("div");
      card.className = "country-card";

      card.innerHTML = `
        <img class="country-flag" src="${country.flag}" alt="${country.name} flag" />

        <div class="country-details">
          <h3 class="country-name">${country.name}</h3>
          <p class="country-capital">Capital: ${country.capital}</p>
          <p class="country-population">Population: ${Number(country.population || 0).toLocaleString()}</p>
          <p class="country-area">Area: ${Number(country.area || 0).toLocaleString()} km²</p>
          <p class="country-region">${country.region}</p>
        </div>

        <button class="btn-remove" title="Remove from wishlist">♥</button>
      `;

      // navigate to country details when clicking the card (but not the remove button)
      card.addEventListener("click", (event) => {
        if (event.target.closest(".btn-remove")) return;
        if (!country.cca3) return;
        window.location.href = `country.html?code=${encodeURIComponent(
          country.cca3
        )}`;
      });

      // remove from wishlist
      card.querySelector(".btn-remove").addEventListener("click", () => {
        const updated = getWishlist().filter((c) => c.cca3 !== country.cca3);
        saveWishlist(updated);
        render();
        if (window.updateWishlistCount) {
          window.updateWishlistCount();
        }
      });

      grid.appendChild(card);
    });
  }

  render();
});
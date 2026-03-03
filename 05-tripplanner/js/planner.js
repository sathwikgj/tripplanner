// Planner page — dropdown/search should list countries from wishlist (localStorage)
document.addEventListener("DOMContentLoaded", () => {
  const htmlEl = document.documentElement;
  if (!htmlEl || htmlEl.dataset.page !== "planner") return;

  const toggle = document.getElementById("countryDropdownToggle");
  const menu = document.getElementById("countryDropdownMenu");
  const searchInput = document.getElementById("countrySearchInput");
  const listContainer = document.getElementById("countryListContainer");
  const selectedText = document.getElementById("selectedCountriesText");

  if (!toggle || !menu || !searchInput || !listContainer || !selectedText) return;

  function getCurrentUser() {
    return localStorage.getItem("currentUser") || null;
  }

  function makeUserKey(base) {
    const user = getCurrentUser();
    return user ? `${base}_${user}` : base;
  }

  const WISHLIST_KEY = makeUserKey("wishlist");

  function getWishlist() {
    const raw = JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [];
    // Support both shapes:
    // - string[]  (["India", "Japan"])
    // - object[]  ([{ name: "India", cca3: "IND", ... }])
    return Array.isArray(raw) ? raw : [];
  }

  function getCountryName(item) {
    if (!item) return "";
    if (typeof item === "string") return item;
    if (typeof item.name === "string") return item.name;
    // fallback: sometimes name might be nested (defensive)
    if (item.name && typeof item.name.common === "string") return item.name.common;
    return "";
  }

  let selected = new Set();

  function updateSelectedText() {
    const names = Array.from(selected);
    selectedText.textContent = names.length ? names.join(", ") : "Select countries";
  }

  function renderList(filterText = "") {
    const wishlist = getWishlist();
    const q = filterText.trim().toLowerCase();

    const names = wishlist
      .map(getCountryName)
      .filter(Boolean)
      .filter((name) => name.toLowerCase().includes(q));

    listContainer.innerHTML = "";

    if (names.length === 0) {
      const empty = document.createElement("div");
      empty.className = "planner-empty-msg";
      empty.textContent = "No countries in wishlist. Add some first!";
      listContainer.appendChild(empty);
      return;
    }

    names.forEach((name) => {
      const label = document.createElement("label");
      label.className = "planner-country-item";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = selected.has(name);

      const text = document.createElement("span");
      text.textContent = name;

      checkbox.addEventListener("change", () => {
        if (checkbox.checked) selected.add(name);
        else selected.delete(name);
        updateSelectedText();
      });

      label.appendChild(checkbox);
      label.appendChild(text);
      listContainer.appendChild(label);
    });
  }

  // Open/close dropdown
  toggle.addEventListener("click", () => {
    menu.classList.toggle("show");
    if (menu.classList.contains("show")) {
      renderList(searchInput.value);
      searchInput.focus();
    }
  });

  // Filter as user types
  searchInput.addEventListener("input", () => {
    renderList(searchInput.value);
  });

  // Close if clicked outside
  document.addEventListener("click", (e) => {
    if (toggle.contains(e.target) || menu.contains(e.target)) return;
    menu.classList.remove("show");
  });

  updateSelectedText();
  renderList("");

  // ===== Trips: save, list, delete =====
  const form = document.getElementById("plannerForm");
  const tripListContainer = document.getElementById("tripListContainer");
  const emptyStateBox = document.getElementById("emptyStateBox");
  const tripNameInput = document.getElementById("tripNameInput");
  const startDateInput = document.getElementById("startDateInput");
  const endDateInput = document.getElementById("endDateInput");
  const tripNotesInput = document.getElementById("tripNotesInput");

  if (
    !form ||
    !tripListContainer ||
    !emptyStateBox ||
    !tripNameInput ||
    !startDateInput ||
    !endDateInput ||
    !tripNotesInput
  ) {
    return;
  }

  const TRIPS_KEY = makeUserKey("trips");
  let trips = JSON.parse(localStorage.getItem(TRIPS_KEY)) || [];

  function saveTrips() {
    localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
  }

  function formatDate(isoDate) {
    if (!isoDate || typeof isoDate !== "string") return "";
    const [yyyy, mm, dd] = isoDate.split("-");
    if (!yyyy || !mm || !dd) return isoDate;
    return `${dd}/${mm}/${yyyy}`;
  }

  function renderTrips() {
    tripListContainer.innerHTML = "";

    if (!Array.isArray(trips) || trips.length === 0) {
      emptyStateBox.style.display = "flex";
      return;
    }

    emptyStateBox.style.display = "none";

    trips.forEach((trip) => {
      const card = document.createElement("article");
      card.className = "planner-trip-card";

      card.innerHTML = `
        <header class="planner-trip-header">
          <h3 class="planner-trip-title">${trip.name}</h3>
          <button class="planner-trip-delete" data-id="${trip.id}" aria-label="Delete trip">🗑</button>
        </header>
        <div class="planner-trip-body">
          <div class="planner-trip-row">
            <span class="label">Dates:</span>
            <span>${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}</span>
          </div>
          <div class="planner-trip-row">
            <span class="label">Countries:</span>
            <div class="planner-trip-countries">
              ${(trip.countries || [])
                .map((name) => `<span class="planner-country-pill">${name}</span>`)
                .join("")}
            </div>
          </div>
          <div class="planner-trip-row">
            <span class="label">Notes:</span>
            <span class="planner-trip-notes">${trip.notes || "No notes added."}</span>
          </div>
        </div>
      `;

      tripListContainer.appendChild(card);
    });

    // Wire delete buttons
    tripListContainer
      .querySelectorAll(".planner-trip-delete")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id");
          trips = trips.filter((trip) => String(trip.id) !== String(id));
          saveTrips();
          renderTrips();
        });
      });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = tripNameInput.value.trim();
    const start = startDateInput.value;
    const end = endDateInput.value;
    const notes = tripNotesInput.value.trim();
    const countries = Array.from(selected);

    if (!name || !start || !end || countries.length === 0) {
      alert("Please fill all fields and select at least one country.");
      return;
    }

    const newTrip = {
      id: Date.now(),
      name,
      startDate: start,
      endDate: end,
      notes,
      countries,
    };

    trips.push(newTrip);
    saveTrips();

    form.reset();
    selected = new Set();
    updateSelectedText();
    renderTrips();
  });

  renderTrips();
});
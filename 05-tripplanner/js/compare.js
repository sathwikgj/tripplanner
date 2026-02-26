// Compare page — country selector dropdowns, side-by-side comparison table, up to 3 countries



document.addEventListener("DOMContentLoaded", () => {
  const keys = ["country1", "country2", "country3"];

  fetch("https://restcountries.com/v3.1/all?fields=name,cca3")
    .then(res => res.json())
    .then(data => {
      // Sort alphabetically
      data.sort((a, b) =>
        a.name.common.localeCompare(b.name.common)
      );

      setupCustomCountryDropdowns(data, keys);
    })
    .catch(err => console.error("Error fetching countries:", err));

  showPlaceholder();
});


const selectedCountries = {
  country1: "",
  country2: "",
  country3: ""
};

document.querySelectorAll(".clear-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.target;
    if (!key) return;

    setSelectedCountry(key, "");
    updateComparison(); // re-render table
  });
});

async function updateComparison() {
  const selectedCodes = Object.values(selectedCountries)
    .filter(v => v !== "");

  const uniqueCodes = [...new Set(selectedCodes)];

  if (uniqueCodes.length === 0) {
    showPlaceholder();
    return;
  }

  const responses = await Promise.all(
    uniqueCodes.map(code =>
      fetch(`https://restcountries.com/v3.1/alpha/${code}`)
        .then(res => res.json())
    )
  );

  const countries = responses.map(r => r[0]);

  renderTable(countries);
}

function renderTable(countries) {

  let tableHTML = `
    <table class="compare-table">
      <thead>
        <tr>
          <th>Attribute</th>
          ${countries.map(c => `<th>${c.name.common}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
  `;

  const rows = [
    {
      label: "Flag",
      value: c => `<img src="${c.flags.png}" width="60">`
    },
    {
      label: "Capital",
      value: c => c.capital?.[0] || "N/A"
    },
    {
      label: "Region",
      value: c => c.region
    },
    {
      label: "Subregion",
      value: c => c.subregion || "N/A"
    },
    {
      label: "Population",
      value: c => c.population.toLocaleString()
    },
    {
      label: "Area",
      value: c => c.area.toLocaleString() + " km²"
    },
    {
      label: "Languages",
      value: c => c.languages 
        ? Object.values(c.languages).join(", ")
        : "N/A"
    },
    {
      label: "Currencies",
      value: c => c.currencies
        ? Object.values(c.currencies)
            .map(cur => cur.name)
            .join(", ")
        : "N/A"
    },
    {
      label: "Timezones",
      value: c => c.timezones.join(", ")
    }
  ];

  rows.forEach(row => {
    tableHTML += `
      <tr>
        <td><strong>${row.label}</strong></td>
        ${countries.map(c => `<td>${row.value(c)}</td>`).join("")}
      </tr>
    `;
  });

  tableHTML += `
      </tbody>
    </table>
  `;

  section.innerHTML = tableHTML;
}

const section = document.getElementById("comparisonSection");

function showPlaceholder() {
  section.innerHTML = `
    <div class="empty-state">
      <img src="images/emptypage2.jpg" alt="Empty" />
      <h2>Select countries to compare</h2>
      <p>Choose at least 2 countries from the dropdowns above to see a side-by-side comparison.</p>
    </div>
  `;
}

function setupCustomCountryDropdowns(countries, keys) {
  const dropdowns = document.querySelectorAll(".country-select");

  dropdowns.forEach(dropdown => {
    const key = dropdown.dataset.key;
    if (!keys.includes(key)) return;

    const toggle = dropdown.querySelector(".country-select-toggle");
    const labelEl = dropdown.querySelector(".country-select-label");
    const searchInput = dropdown.querySelector(".country-select-search");
    const optionsList = dropdown.querySelector(".country-select-options");

    // Build option list
    countries.forEach(country => {
      const li = document.createElement("li");
      li.className = "country-option";
      li.dataset.value = country.cca3;
      li.textContent = country.name.common;
      optionsList.appendChild(li);

      li.addEventListener("click", () => {
        setSelectedCountry(key, country.cca3);
        labelEl.textContent = country.name.common;

        // Mark selected
        optionsList.querySelectorAll(".country-option").forEach(opt => {
          opt.classList.toggle("is-selected", opt === li);
        });

        closeAllDropdowns();
        updateComparison();
      });
    });

    // Toggle open/close
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.contains("open");
      closeAllDropdowns();
      if (!isOpen) {
        dropdown.classList.add("open");
        if (searchInput) {
          searchInput.value = "";
          searchInput.dispatchEvent(new Event("input"));
          searchInput.focus();
        }
      }
    });

    // Search filter
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        const term = searchInput.value.toLowerCase();
        optionsList.querySelectorAll(".country-option").forEach(li => {
          const matches = li.textContent.toLowerCase().includes(term);
          li.style.display = matches ? "flex" : "none";
        });
      });
    }
  });

  // Close when clicking outside
  document.addEventListener("click", () => {
    closeAllDropdowns();
  });
}

function closeAllDropdowns() {
  document.querySelectorAll(".country-select.open").forEach(dd => {
    dd.classList.remove("open");
  });
}

function setSelectedCountry(key, code) {
  selectedCountries[key] = code;

  const dropdown = document.querySelector(`.country-select[data-key="${key}"]`);
  if (!dropdown) return;

  const labelEl = dropdown.querySelector(".country-select-label");
  const optionsList = dropdown.querySelector(".country-select-options");

  if (!code) {
    if (labelEl) labelEl.textContent = "Select a country";
    if (optionsList) {
      optionsList.querySelectorAll(".country-option").forEach(opt => {
        opt.classList.remove("is-selected");
        opt.style.display = "flex";
      });
    }
    return;
  }

  if (!optionsList) return;

  const match = optionsList.querySelector(`.country-option[data-value="${code}"]`);
  optionsList.querySelectorAll(".country-option").forEach(opt => {
    opt.classList.toggle("is-selected", opt === match);
  });
}
// Compare page — country selector dropdowns, side-by-side comparison table, up to 3 countries



document.addEventListener("DOMContentLoaded", () => {
  const selects = [
    document.getElementById("country1"),
    document.getElementById("country2"),
    document.getElementById("country3")
  ];

  fetch("https://restcountries.com/v3.1/all?fields=name,cca3")
    .then(res => res.json())
    .then(data => {

      // Sort alphabetically
      data.sort((a, b) => 
        a.name.common.localeCompare(b.name.common)
      );

      data.forEach(country => {
        selects.forEach(select => {
          const option = document.createElement("option");
          option.value = country.cca3; // useful later
          option.textContent = country.name.common;
          select.appendChild(option);
        });
      });

    })
    .catch(err => console.error("Error fetching countries:", err));
});


document.querySelectorAll(".clear-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const targetSelect = document.getElementById(btn.dataset.target);
    targetSelect.value = "";
    updateComparison(); // re-render table
  });
});


const selects = document.querySelectorAll("select");
const tableContainer = document.getElementById("comparisonTable");

selects.forEach(select => {
  select.addEventListener("change", updateComparison);
});

async function updateComparison() {
  const selectedCodes = [...selects]
    .map(s => s.value)
    .filter(v => v !== "");

  // Remove duplicates
  const uniqueCodes = [...new Set(selectedCodes)];

  if (uniqueCodes.length === 0) {
    tableContainer.innerHTML = "";
    return;
  }

  // Fetch country details
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

  tableContainer.innerHTML = tableHTML;
}
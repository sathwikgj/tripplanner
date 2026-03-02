// Planner page — trip form with country selection from wishlist, dates, notes, save/delete trips
const form = document.getElementById("plannerForm");
const tripListContainer = document.getElementById("tripListContainer");
const emptyStateBox = document.getElementById("emptyStateBox");

const tripNameInput = document.getElementById("tripNameInput");
const countrySelectInput = document.getElementById("countrySelectInput");
const startDateInput = document.getElementById("startDateInput");
const endDateInput = document.getElementById("endDateInput");
const tripNotesInput = document.getElementById("tripNotesInput");

/* Load trips from localStorage */
let trips = JSON.parse(localStorage.getItem("trips")) || [];

/* Render trips */
function renderTrips() {

  tripListContainer.innerHTML = "";

  if (trips.length === 0) {
    emptyStateBox.style.display = "flex";
    return;
  }

  emptyStateBox.style.display = "none";

  trips.forEach((trip, index) => {

    const card = document.createElement("div");
    card.className = "planner-trip-card";
    card.style.display = "flex";
    card.style.flexDirection = "column";
    card.style.gap = "0.5rem";
    card.style.padding = "1rem";
    card.style.border = "1px solid #e5e7eb";
    card.style.borderRadius = "0.5rem";

    card.innerHTML = `
      <strong>${trip.name}</strong>
      <span>Countries: ${trip.countries}</span>
      <span>${trip.startDate} → ${trip.endDate}</span>
      <span>${trip.notes}</span>
      <button data-index="${index}" style="padding:0.5rem; border:none; background:#ef4444; color:white; border-radius:0.4rem; cursor:pointer;">Delete</button>
    `;

    tripListContainer.appendChild(card);
  });
}

/* Save trip */
form.addEventListener("submit", function(e){
  e.preventDefault();

  const selectedCountries = Array.from(countrySelectInput.selectedOptions)
                                 .map(option => option.value)
                                 .join(", ");

  const newTrip = {
    name: tripNameInput.value,
    countries: selectedCountries,
    startDate: startDateInput.value,
    endDate: endDateInput.value,
    notes: tripNotesInput.value
  };

  trips.push(newTrip);

  localStorage.setItem("trips", JSON.stringify(trips));

  form.reset();

  renderTrips();
});

/* Delete trip */
tripListContainer.addEventListener("click", function(e){

  if (e.target.tagName === "BUTTON") {
    const index = e.target.getAttribute("data-index");
    trips.splice(index, 1);
    localStorage.setItem("trips", JSON.stringify(trips));
    renderTrips();
  }
});

/* Initial Load */
renderTrips();
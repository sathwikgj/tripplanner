// Itinerary page — days, activities, drag & drop, budget, save/load

document.addEventListener("DOMContentLoaded", () => {
  const htmlEl = document.documentElement;
  if (!htmlEl || htmlEl.dataset.page !== "itinerary") return;

  const tripNameInput = document.getElementById("itinerary-trip-name");
  const destinationInput = document.getElementById("itinerary-destination");
  const dailyBudgetInput = document.getElementById("itinerary-daily-budget");

  const daysContainer = document.getElementById("days-container");
  const addDayBtn = document.getElementById("add-day-btn");

  const budgetDaysContainer = document.getElementById("budget-days");
  const budgetTotalBudgetEl = document.getElementById("budget-total-budget");
  const budgetTotalSpentEl = document.getElementById("budget-total-spent");

  const saveBtn = document.getElementById("save-itinerary-btn");
  const clearBtn = document.getElementById("clear-itinerary-btn");

  const savedList = document.getElementById("saved-itineraries");
  const savedEmptyText = document.getElementById("saved-empty");

  if (
    !tripNameInput ||
    !destinationInput ||
    !dailyBudgetInput ||
    !daysContainer ||
    !addDayBtn ||
    !budgetDaysContainer ||
    !budgetTotalBudgetEl ||
    !budgetTotalSpentEl ||
    !saveBtn ||
    !clearBtn ||
    !savedList ||
    !savedEmptyText
  ) {
    return;
  }

  const STORAGE_KEY = "tripPlanner_itineraries";

  let toastContainer = document.getElementById("toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    toastContainer.className = "toast-container";
    document.body.appendChild(toastContainer);
  }

  let itinerary = {
    tripName: "",
    destination: "",
    dailyBudget: Number(dailyBudgetInput.value) || 150,
    days: [],
  };

  let savedItineraries =
    JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") || [];

  let dragState = null; // { dayId, activityId }

  function createId() {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function showToast(type, message) {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    const icon =
      type === "error" ? "⨯" : type === "success" ? "✓" : "i";

    toast.innerHTML = `
      <div class="toast-side"></div>
      <div class="toast-body">
        <div class="toast-icon">${icon}</div>
        <div class="toast-message">${message}</div>
        <button class="toast-close" aria-label="Dismiss">×</button>
      </div>
    `;

    const closeBtn = toast.querySelector(".toast-close");
    const remove = () => {
      toast.classList.remove("toast-show");
      toast.classList.add("toast-hide");
      setTimeout(() => {
        toast.remove();
      }, 300);
    };

    closeBtn.addEventListener("click", remove);

    toastContainer.appendChild(toast);
    requestAnimationFrame(() => {
      toast.classList.add("toast-show");
    });

    setTimeout(remove, 3500);
  }

  function addDay(dayData, { fromUserClick = false } = {}) {
    const id = dayData?.id || createId();
    const day = {
      id,
      title: dayData?.title || `Day ${itinerary.days.length + 1}`,
      budget:
        typeof dayData?.budget === "number"
          ? dayData.budget
          : itinerary.dailyBudget,
      activities: dayData?.activities || [],
    };
    itinerary.days.push(day);
    renderDays();
    updateBudgetOverview();

    if (fromUserClick) {
      showToast("success", "New day added");
    }
  }

  function deleteDay(dayId) {
    itinerary.days = itinerary.days.filter((d) => d.id !== dayId);
    itinerary.days.forEach((day, index) => {
      if (day.title.startsWith("Day ")) {
        day.title = `Day ${index + 1}`;
      }
    });
    if (itinerary.days.length === 0) {
      addDay();
      showToast("info", "Day removed");
      return;
    }

    showToast("info", "Day removed");
    renderDays();
    updateBudgetOverview();
  }

  function addActivityToDay(dayId, activity) {
    const day = itinerary.days.find((d) => d.id === dayId);
    if (!day) return;
    day.activities.push(activity);
    renderDays();
    updateBudgetOverview();
    showToast("success", "Activity added");
  }

  function deleteActivity(dayId, activityId) {
    const day = itinerary.days.find((d) => d.id === dayId);
    if (!day) return;
    day.activities = day.activities.filter((a) => a.id !== activityId);
    renderDays();
    updateBudgetOverview();
    showToast("info", "Activity removed");
  }

  function moveActivity(fromDayId, toDayId, activityId) {
    if (!fromDayId || !toDayId || !activityId) return;
    const fromDay = itinerary.days.find((d) => d.id === fromDayId);
    const toDay = itinerary.days.find((d) => d.id === toDayId);
    if (!fromDay || !toDay) return;

    const index = fromDay.activities.findIndex((a) => a.id === activityId);
    if (index === -1) return;

    const [activity] = fromDay.activities.splice(index, 1);
    toDay.activities.push(activity);
    renderDays();
    updateBudgetOverview();
  }

  function renderDays() {
    daysContainer.innerHTML = "";

    itinerary.days.forEach((day) => {
      const dayCard = document.createElement("section");
      dayCard.className = "day-card";
      dayCard.dataset.dayId = day.id;

      const header = document.createElement("div");
      header.className = "day-header";
      header.innerHTML = `
        <h2>${day.title}</h2>
        <button class="icon-btn day-delete-btn" title="Delete day">🗑️</button>
      `;

      const deleteBtn = header.querySelector("button");
      deleteBtn.addEventListener("click", () => {
        deleteDay(day.id);
      });

      const dropzone = document.createElement("div");
      dropzone.className = "activity-dropzone";
      dropzone.dataset.dayId = day.id;
      dropzone.addEventListener("dragover", (event) => {
        event.preventDefault();
        dropzone.classList.add("drag-over");
      });
      dropzone.addEventListener("dragleave", () => {
        dropzone.classList.remove("drag-over");
      });
      dropzone.addEventListener("drop", (event) => {
        event.preventDefault();
        dropzone.classList.remove("drag-over");
        if (!dragState) return;
        moveActivity(dragState.dayId, day.id, dragState.activityId);
        dragState = null;
      });

      if (day.activities.length === 0) {
        const empty = document.createElement("div");
        empty.className = "activity-empty";
        empty.textContent = "Drop activities here or add one below";
        dropzone.appendChild(empty);
      } else {
        day.activities.forEach((activity) => {
          const card = document.createElement("div");
          card.className = "activity-card";
          card.draggable = true;
          card.dataset.dayId = day.id;
          card.dataset.activityId = activity.id;

          card.addEventListener("dragstart", () => {
            dragState = { dayId: day.id, activityId: activity.id };
            card.classList.add("dragging");
          });
          card.addEventListener("dragend", () => {
            card.classList.remove("dragging");
          });

          card.innerHTML = `
            <div class="activity-main">
              <div class="activity-time">${activity.time || ""}</div>
              <div class="activity-info">
                <div class="activity-title">${activity.title}</div>
                <div class="activity-meta">${activity.category}</div>
              </div>
            </div>
            <div class="activity-cost">
              $${Number(activity.cost || 0).toFixed(2)}
              <button class="icon-btn activity-delete" title="Delete activity">×</button>
            </div>
          `;

          const deleteActivityBtn = card.querySelector(".activity-delete");
          deleteActivityBtn.addEventListener("click", () => {
            deleteActivity(day.id, activity.id);
          });

          dropzone.appendChild(card);
        });
      }

      const form = document.createElement("div");
      form.className = "activity-form-row";
      form.innerHTML = `
        <input type="time" class="activity-time-input" value="09:00">
        <input type="text" class="activity-title-input" placeholder="e.g., Visit temple">
        <select class="activity-category-input">
          <option value="Sightseeing">Sightseeing</option>
          <option value="Food & Dining">Food &amp; Dining</option>
          <option value="Transport">Transport</option>
          <option value="Accommodation">Accommodation</option>
          <option value="Shopping">Shopping</option>
          <option value="Entertainment">Entertainment</option>
        </select>
        <input type="number" class="activity-cost-input" min="0" step="1" value="0">
        <button class="primary-btn small">Add</button>
      `;
      form.style.display = "none";

      const addActivityToggle = document.createElement("button");
      addActivityToggle.type = "button";
      addActivityToggle.className = "add-activity-btn full-width-btn";
      addActivityToggle.textContent = "+ Add Activity";
      addActivityToggle.addEventListener("click", () => {
        const isHidden = form.style.display === "none";
        form.style.display = isHidden ? "grid" : "none";
        if (isHidden) {
          const titleInput = form.querySelector(".activity-title-input");
          if (titleInput) titleInput.focus();
        }
      });

      const addActivityBtn = form.querySelector(".primary-btn");
      addActivityBtn.addEventListener("click", () => {
        const timeInput = form.querySelector(".activity-time-input");
        const titleInput = form.querySelector(".activity-title-input");
        const categoryInput = form.querySelector(".activity-category-input");
        const costInput = form.querySelector(".activity-cost-input");

        const title = titleInput.value.trim();
        if (!title) {
          titleInput.focus();
          return;
        }

        const newActivity = {
          id: createId(),
          time: timeInput.value,
          title,
          category: categoryInput.value,
          cost: Number(costInput.value) || 0,
        };

        addActivityToDay(day.id, newActivity);

        titleInput.value = "";
        costInput.value = "0";
        form.style.display = "none";
      });

      dayCard.appendChild(header);
      dayCard.appendChild(dropzone);
      dayCard.appendChild(addActivityToggle);
      dayCard.appendChild(form);
      daysContainer.appendChild(dayCard);
    });
  }

  function getDaySpent(day) {
    return day.activities.reduce(
      (sum, activity) => sum + (Number(activity.cost) || 0),
      0
    );
  }

  function updateBudgetOverview() {
    budgetDaysContainer.innerHTML = "";

    let totalBudget = 0;
    let totalSpent = 0;

    itinerary.days.forEach((day, index) => {
      const spent = getDaySpent(day);
      const budget = typeof day.budget === "number" ? day.budget : 0;
      totalBudget += budget;
      totalSpent += spent;

      const remainingRaw = budget - spent;
      const overAmount = remainingRaw < 0 ? Math.abs(remainingRaw) : 0;
      const ratio = budget > 0 ? spent / budget : 0;

      let remainingLabel = "";
      let remainingClass = "";
      let barClass = "";

      if (overAmount > 0) {
        remainingLabel = `-$${overAmount.toFixed(2)} over`;
        remainingClass = "budget-remaining over";
        barClass = "budget-bar-fill over";
      } else {
        remainingLabel = `$${remainingRaw.toFixed(2)} left`;
        if (ratio >= 0.75) {
          remainingClass = "budget-remaining warn";
          barClass = "budget-bar-fill warn";
        } else {
          remainingClass = "budget-remaining ok";
          barClass = "budget-bar-fill ok";
        }
      }

      const card = document.createElement("div");
      card.className = "budget-day-card";
      card.innerHTML = `
        <div class="budget-day-title">Day ${index + 1}</div>
        <div class="budget-day-row">
          <span>Spent: $${spent.toFixed(2)}</span>
          <span class="${remainingClass}">${remainingLabel}</span>
        </div>
        <div class="budget-bar">
          <div class="${barClass}" style="width: ${
        budget ? Math.min((spent / budget) * 100, 100) : spent > 0 ? 100 : 0
      }%"></div>
        </div>
      `;

      budgetDaysContainer.appendChild(card);
    });

    budgetTotalBudgetEl.textContent = `$${totalBudget.toFixed(2)} budget`;
    budgetTotalSpentEl.textContent = `$${totalSpent.toFixed(2)}`;
  }

  function renderSavedItineraries() {
    savedList.innerHTML = "";

    if (!savedItineraries.length) {
      savedEmptyText.style.display = "block";
      return;
    }

    savedEmptyText.style.display = "none";

    savedItineraries.forEach((item) => {
      const totalDays = item.days.length;
      const totalSpent = item.days.reduce(
        (sum, day) =>
          sum +
          day.activities.reduce(
            (inner, act) => inner + (Number(act.cost) || 0),
            0
          ),
        0
      );

      const row = document.createElement("div");
      row.className = "saved-itinerary-row";
      row.innerHTML = `
        <div class="saved-main">
          <div class="saved-title">${item.tripName || "Untitled trip"}</div>
          <div class="saved-meta">
            ${totalDays} day${totalDays !== 1 ? "s" : ""} ·
            ${item.destination || "No destination"} ·
            $${totalSpent.toFixed(2)} total
          </div>
        </div>
        <div class="saved-actions">
          <button class="primary-btn small" data-action="load">Load</button>
          <button class="ghost-btn small" data-action="delete">Delete</button>
        </div>
      `;

      const loadBtn = row.querySelector('[data-action="load"]');
      const deleteBtn = row.querySelector('[data-action="delete"]');

      loadBtn.addEventListener("click", () => {
        itinerary = {
          tripName: item.tripName,
          destination: item.destination,
          dailyBudget: item.dailyBudget,
          days: item.days,
        };

        tripNameInput.value = itinerary.tripName;
        destinationInput.value = itinerary.destination;
        dailyBudgetInput.value = String(itinerary.dailyBudget);

        renderDays();
        updateBudgetOverview();
        showToast("success", "Itinerary loaded");
      });

      deleteBtn.addEventListener("click", () => {
        savedItineraries = savedItineraries.filter((i) => i.id !== item.id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedItineraries));
        renderSavedItineraries();
        showToast("info", "Itinerary deleted");
      });

      savedList.appendChild(row);
    });
  }

  tripNameInput.addEventListener("input", () => {
    itinerary.tripName = tripNameInput.value.trim();
  });

  destinationInput.addEventListener("input", () => {
    itinerary.destination = destinationInput.value.trim();
  });

  dailyBudgetInput.addEventListener("input", () => {
    const value = Number(dailyBudgetInput.value);
    if (Number.isNaN(value) || value < 0) return;
    itinerary.dailyBudget = value;
    itinerary.days.forEach((day) => {
      day.budget = value;
    });
    updateBudgetOverview();
  });

  addDayBtn.addEventListener("click", () => addDay());

  saveBtn.addEventListener("click", () => {
    const tripName = itinerary.tripName || tripNameInput.value.trim();
    if (!tripName) {
      tripNameInput.focus();
      showToast("error", "Please enter a trip name before saving");
      return;
    }

    if (!itinerary.days.length) {
      showToast("error", "You need at least one day in the itinerary");
      return;
    }

    itinerary.tripName = tripName;
    itinerary.destination = destinationInput.value.trim();

    const snapshot = JSON.parse(JSON.stringify(itinerary));
    const item = {
      id: createId(),
      ...snapshot,
    };

    savedItineraries.push(item);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedItineraries));
    renderSavedItineraries();
    showToast("success", "Itinerary saved");
  });

  clearBtn.addEventListener("click", () => {
    tripNameInput.value = "";
    destinationInput.value = "";
    dailyBudgetInput.value = "150";

    itinerary = {
      tripName: "",
      destination: "",
      dailyBudget: 150,
      days: [],
    };

    addDay();
    showToast("info", "All itinerary data cleared");
  });

  addDay();
  updateBudgetOverview();
  renderSavedItineraries();
});


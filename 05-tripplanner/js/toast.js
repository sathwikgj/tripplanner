document.addEventListener("DOMContentLoaded", () => {
  if (window.showToast) return;

  let toastContainer = document.getElementById("toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    toastContainer.className = "toast-container";
    document.body.appendChild(toastContainer);
  }

  window.showToast = function showToast(type, message) {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    const icon = type === "error" ? "⨯" : type === "success" ? "✓" : "i";

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
  };
});


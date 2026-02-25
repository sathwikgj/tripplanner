document.addEventListener("DOMContentLoaded", () => {
  fetch("navbar.html")
    .then((res) => res.text())
    .then((data) => {
      document.getElementById("navbar").innerHTML = data;

      const links = document.querySelectorAll(".nav-links a");
      const currentPage = window.location.pathname.split("/").pop();

      links.forEach((link) => {
        if (link.getAttribute("href") === currentPage) {
          link.classList.add("active");
        }
      });

      const badge = document.getElementById("wishlist-count-badge");

      if (badge) {
        function updateWishlistCount() {
          const list =
            JSON.parse(localStorage.getItem("wishlist")) || [];
          const total = list.length;

          if (total === 0) {
            badge.style.display = "none";
          } else {
            badge.style.display = "inline-flex";
            badge.textContent = String(total);
          }
        }

        updateWishlistCount();
        window.updateWishlistCount = updateWishlistCount;
      }
    });
});
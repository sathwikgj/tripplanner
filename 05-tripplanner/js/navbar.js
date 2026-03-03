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

      function getCurrentUser() {
        return localStorage.getItem("currentUser") || null;
      }

      function makeUserKey(base) {
        const user = getCurrentUser();
        return user ? `${base}_${user}` : base;
      }

      const badge = document.getElementById("wishlist-count-badge");
      const userLabel = document.getElementById("nav-user-label");
      const loginLink = document.getElementById("nav-login-link");
      const logoutButton = document.getElementById("nav-logout-button");

      if (badge) {
        function updateWishlistCount() {
          const currentUser = getCurrentUser();
          if (!currentUser) {
            badge.style.display = "none";
            badge.textContent = "";
            return;
          }

          const key = makeUserKey("wishlist");
          const list = JSON.parse(localStorage.getItem(key)) || [];
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

      if (userLabel && loginLink && logoutButton) {
        function syncAuthUi() {
          const user = getCurrentUser();
          if (user) {
            userLabel.textContent = `Signed in as ${user}`;
            loginLink.style.display = "none";
            logoutButton.style.display = "inline-flex";
          } else {
            userLabel.textContent = "";
            loginLink.style.display = "inline-flex";
            logoutButton.style.display = "none";
          }
        }

        logoutButton.addEventListener("click", () => {
          localStorage.removeItem("currentUser");
          syncAuthUi();
          if (window.updateWishlistCount) {
            window.updateWishlistCount();
          }
        });

        syncAuthUi();
      }
    });
});
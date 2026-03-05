document.addEventListener("DOMContentLoaded", () => {
  const htmlEl = document.documentElement;
  if (!htmlEl || htmlEl.dataset.page !== "login") return;

  const form = document.getElementById("auth-form");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const messageEl = document.getElementById("auth-message");
  const loginToggle = document.getElementById("login-toggle");
  const registerToggle = document.getElementById("register-toggle");

  if (
    !form ||
    !usernameInput ||
    !passwordInput ||
    !messageEl ||
    !loginToggle ||
    !registerToggle
  ) {
    return;
  }

  const USERS_KEY = "users";
  const CURRENT_USER_KEY = "currentUser";

  let mode = "login"; 

  function getUsers() {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function setCurrentUser(username) {
    localStorage.setItem(CURRENT_USER_KEY, username);
  }

  function showMessage(text, isError = false) {
    messageEl.textContent = text;
    messageEl.classList.toggle("auth-message-error", isError);
    messageEl.classList.toggle("auth-message-success", !isError && !!text);
    if (window.showToast && text) {
      window.showToast(isError ? "error" : "success", text);
    }
  }

  function switchMode(nextMode) {
    mode = nextMode;
    if (mode === "login") {
      loginToggle.classList.add("auth-toggle-btn-active");
      registerToggle.classList.remove("auth-toggle-btn-active");
    } else {
      registerToggle.classList.add("auth-toggle-btn-active");
      loginToggle.classList.remove("auth-toggle-btn-active");
    }
    showMessage("");
    passwordInput.value = "";
  }

  loginToggle.addEventListener("click", () => switchMode("login"));
  registerToggle.addEventListener("click", () => switchMode("register"));

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      showMessage("Please enter both username and password.", true);
      return;
    }

    const users = getUsers();
    const existing = users.find((u) => u.username === username);

    if (mode === "register") {
      if (existing) {
        showMessage("That username is already taken.", true);
        return;
      }

      // Store passwords in localStorage as-is (no hashing, as requested)
      users.push({ username, password });
      saveUsers(users);
      setCurrentUser(username);
      showMessage("Account created. Redirecting...", false);
    } else {
      if (!existing || existing.password !== password) {
        showMessage("Invalid username or password.", true);
        return;
      }

      setCurrentUser(username);
      showMessage("Logged in. Redirecting...", false);
    }

    setTimeout(() => {
      window.location.href = "index.html";
    }, 700);
  });
});


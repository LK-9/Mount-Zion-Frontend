// Super Admin Master Auth Guard
function checkSuperAuth() {
  const currentPath = (
    window.location.pathname.split("/").pop() || ""
  ).toLowerCase();
  const isLoginPage =
    currentPath === "super-admin-login.html" ||
    currentPath === "super-admin-login" ||
    window.location.pathname.toLowerCase().includes("super-admin-login");

  if (isLoginPage) {
    return;
  }

  const isAuth =
    sessionStorage.getItem("mzhl-super-auth") === "1" ||
    (typeof STORAGE_KEYS !== "undefined" &&
      sessionStorage.getItem(STORAGE_KEYS.superAuth) === "1");

  if (isAuth) {
    document.documentElement.classList.remove("super-logged-out");
    document.documentElement.classList.add("super-logged-in");
  } else {
    document.documentElement.classList.remove("super-logged-in");
    document.documentElement.classList.add("super-logged-out");
    window.location.replace("super-admin-login.html");
  }
}

function superAdminSignOut() {
  sessionStorage.removeItem("mzhl-super-auth");
  localStorage.removeItem("mzhl-super-auth");
  if (typeof STORAGE_KEYS !== "undefined" && STORAGE_KEYS.superAuth) {
    sessionStorage.removeItem(STORAGE_KEYS.superAuth);
    localStorage.removeItem(STORAGE_KEYS.superAuth);
  }

  document.documentElement.classList.remove("super-logged-in");
  document.documentElement.classList.add("super-logged-out");

  window.location.replace("super-admin-login.html");
}
window.superAdminSignOut = superAdminSignOut;

document.addEventListener("DOMContentLoaded", () => {
  checkSuperAuth();

  const loginForm = document.getElementById("super-login-form");
  const loginBtn =
    document.getElementById("super-login-btn") ||
    document.querySelector('#super-login-form button[type="submit"]');

  function proceedToSuperAdmin(e) {
    if (e) e.preventDefault();

    sessionStorage.setItem("mzhl-super-auth", "1");
    if (typeof STORAGE_KEYS !== "undefined" && STORAGE_KEYS.superAuth) {
      sessionStorage.setItem(STORAGE_KEYS.superAuth, "1");
    }

    if (typeof AppStore !== "undefined" && AppStore.logAudit) {
      AppStore.logAudit("Super Admin Login", "Master suite unlocked");
    }

    const err = document.getElementById("super-login-error");
    if (err) err.classList.add("hidden");

    window.location.replace("super-admin.html");
  }

  if (loginForm) {
    loginForm.addEventListener("submit", proceedToSuperAdmin);
  }
  if (loginBtn) {
    loginBtn.addEventListener("click", proceedToSuperAdmin);
  }

  document
    .querySelectorAll("#super-signout-btn, .super-signout-btn")
    .forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        superAdminSignOut();
      });
    });

  const menuToggle = document.getElementById("super-menu-toggle");
  const sidebar = document.getElementById("super-sidebar");
  const backdrop = document.getElementById("super-sidebar-backdrop");

  if (menuToggle && sidebar && backdrop) {
    menuToggle.addEventListener("click", () => {
      sidebar.classList.remove("-translate-x-full");
      backdrop.classList.remove("hidden");
    });
    backdrop.addEventListener("click", () => {
      sidebar.classList.add("-translate-x-full");
      backdrop.classList.add("hidden");
    });
  }
});

// Real-time synchronization across multiple browser tabs / windows
window.addEventListener("storage", (e) => {
  if (e.key === STORAGE_KEYS.superAuth || e.key === "mzhl-super-auth") {
    checkSuperAuth();
  }
});

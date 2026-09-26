// Staff Admin Master Auth Guard & Direct Navigation Handler
function checkAdminAuth() {
  const isAuth =
    sessionStorage.getItem("mzhl-admin-auth") === "1" ||
    sessionStorage.getItem(STORAGE_KEYS.auth) === "1";

  const currentPath = (
    window.location.pathname.split("/").pop() || ""
  ).toLowerCase();
  const isLoginPage =
    currentPath === "admin-login.html" ||
    currentPath === "admin-login" ||
    window.location.pathname.toLowerCase().includes("admin-login");

  if (!isLoginPage && !isAuth) {
    window.location.replace("admin-login.html");
  }
}

function syncLoggedInStaffUI() {
  if (typeof AppStore !== "undefined" && AppStore.getActiveStaff) {
    const activeStaff = AppStore.getActiveStaff();
    const staffNameEl = document.getElementById("logged-staff-name");
    if (staffNameEl && activeStaff) {
      const roleTag = activeStaff.role
        ? ` <span class="text-xs font-normal text-muted-foreground">(${activeStaff.role})</span>`
        : "";
      staffNameEl.innerHTML = `${activeStaff.name}${roleTag}`;
    }
  }
}

function adminSignOut() {
  sessionStorage.removeItem("mzhl-admin-auth");
  sessionStorage.removeItem(STORAGE_KEYS.auth);
  sessionStorage.removeItem("mzhl-auth");
  localStorage.removeItem("mzhl-admin-auth");
  localStorage.removeItem(STORAGE_KEYS.auth);
  localStorage.removeItem("mzhl-auth");
  sessionStorage.removeItem(STORAGE_KEYS.activeStaffUser);
  localStorage.removeItem(STORAGE_KEYS.activeStaffUser);
  sessionStorage.removeItem("mzhl-active-staff-user");
  localStorage.removeItem("mzhl-active-staff-user");

  document.documentElement.classList.remove("admin-logged-in");
  document.documentElement.classList.add("admin-logged-out");

  window.location.replace("admin-login.html");
}
window.adminSignOut = adminSignOut;

document.addEventListener("DOMContentLoaded", () => {
  checkAdminAuth();
  syncLoggedInStaffUI();

  const loginForm = document.getElementById("admin-login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const emailInput =
        document.getElementById("login-email") ||
        document.getElementById("login-username");
      const emailVal = (emailInput?.value || "").trim();

      let staffUser = {
        name: "Tamuno Briggs",
        role: "PHC Depot Manager",
        email: "tamuno@mountzion.com",
        phone: "0809 555 7788",
      };

      if (
        emailVal &&
        emailVal.toLowerCase() !== "tamuno@mountzion.com" &&
        emailVal.toLowerCase() !== "admin"
      ) {
        staffUser.name = emailVal.includes("@")
          ? emailVal.split("@")[0]
          : emailVal;
        staffUser.email = emailVal;
      }

      if (typeof AppStore !== "undefined" && AppStore.setActiveStaff) {
        AppStore.setActiveStaff(staffUser);
      }

      sessionStorage.setItem("mzhl-admin-auth", "1");
      sessionStorage.setItem(STORAGE_KEYS.auth, "1");

      window.location.href = "admin.html";
    });
  }

  document
    .querySelectorAll("#admin-signout-btn, .admin-signout-btn")
    .forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        adminSignOut();
      });
    });

  const menuToggle = document.getElementById("admin-menu-toggle");
  const sidebar = document.getElementById("admin-sidebar");
  const backdrop = document.getElementById("admin-sidebar-backdrop");

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

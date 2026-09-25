// Staff Admin Master Auth Guard & Centralized Staff State Sync
function normalizeDigits(str) {
  return (str || "").replace(/\D/g, "");
}

function checkAdminAuth() {
  const isAuth =
    sessionStorage.getItem(STORAGE_KEYS.auth) === "1" ||
    localStorage.getItem(STORAGE_KEYS.auth) === "1" ||
    sessionStorage.getItem("mzhl-admin-auth") === "1" ||
    localStorage.getItem("mzhl-admin-auth") === "1";
  const currentPath = (
    window.location.pathname.split("/").pop() || ""
  ).toLowerCase();
  const isLoginPage =
    currentPath === "admin-login.html" || currentPath === "admin-login";

  if (isAuth) {
    if (isLoginPage) {
      window.location.replace("admin.html");
      return;
    }
    document.documentElement.classList.remove("admin-logged-out");
    document.documentElement.classList.add("admin-logged-in");
  } else {
    document.documentElement.classList.remove("admin-logged-in");
    document.documentElement.classList.add("admin-logged-out");
    if (!isLoginPage) {
      window.location.replace("admin-login.html");
      return;
    }
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
  sessionStorage.removeItem(STORAGE_KEYS.auth);
  localStorage.removeItem(STORAGE_KEYS.auth);
  sessionStorage.removeItem("mzhl-admin-auth");
  localStorage.removeItem("mzhl-admin-auth");
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
      const passInput = document.getElementById("login-password");
      const emailVal = (emailInput?.value || "").trim().toLowerCase();
      const passVal = (passInput?.value || "").trim();
      const err = document.getElementById("login-error-alert");

      const staffList =
        typeof AppStore !== "undefined" && AppStore.getStaff
          ? AppStore.getStaff()
          : [];

      // Match by staff email and password (phone number)
      const matchedStaff = staffList.find((s) => {
        if (!s.email) return false;
        const emailMatch = s.email.trim().toLowerCase() === emailVal;
        if (!emailMatch) return false;

        const rawPassword = s.password || s.phone || "";
        const isExactPass = rawPassword === passVal;
        const isPhonePass =
          normalizeDigits(rawPassword) !== "" &&
          normalizeDigits(rawPassword) === normalizeDigits(passVal);
        return isExactPass || isPhonePass;
      });

      // Fallback for quick testing
      const isDemoFallback =
        (emailVal === "admin" && passVal === "admin") ||
        (emailVal === "tamuno@mountzion.com" &&
          (passVal === "admin" || normalizeDigits(passVal) === "08095557788"));

      if (matchedStaff && matchedStaff.status !== "Inactive") {
        AppStore.setActiveStaff({
          name: matchedStaff.name,
          email: matchedStaff.email,
          phone: matchedStaff.phone,
          role: matchedStaff.role,
          photo: matchedStaff.photo || "",
        });
        sessionStorage.setItem(STORAGE_KEYS.auth, "1");
        localStorage.setItem(STORAGE_KEYS.auth, "1");
        sessionStorage.setItem("mzhl-admin-auth", "1");
        localStorage.setItem("mzhl-admin-auth", "1");
        AppStore.logAudit(
          "Staff Login",
          `${matchedStaff.name} (${matchedStaff.role}) logged in`,
        );
        if (err) err.classList.add("hidden");
        window.location.replace("admin.html");
      } else if (isDemoFallback) {
        const defaultUser = staffList.find((s) =>
          s.email?.toLowerCase().includes("tamuno"),
        ) || {
          name: "Tamuno Briggs",
          role: "PHC Depot Manager",
          email: "tamuno@mountzion.com",
          phone: "0809 555 7788",
        };
        AppStore.setActiveStaff(defaultUser);
        sessionStorage.setItem(STORAGE_KEYS.auth, "1");
        localStorage.setItem(STORAGE_KEYS.auth, "1");
        sessionStorage.setItem("mzhl-admin-auth", "1");
        localStorage.setItem("mzhl-admin-auth", "1");
        if (err) err.classList.add("hidden");
        window.location.replace("admin.html");
      } else {
        if (err) err.classList.remove("hidden");
      }
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

// Real-time synchronization across multiple browser tabs / windows
window.addEventListener("storage", (e) => {
  if (
    e.key === STORAGE_KEYS.activeStaffUser ||
    e.key === STORAGE_KEYS.auth ||
    e.key === "mzhl-admin-auth"
  ) {
    syncLoggedInStaffUI();
    checkAdminAuth();
  }
});

// Mount Zion — Universal Dark / Light Theme Manager
(function initTheme() {
  const storedTheme = localStorage.getItem('mzhl-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = storedTheme === 'dark' || (!storedTheme && prefersDark);
  applyTheme(isDark);

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const currentlyDark = document.documentElement.classList.contains('dark');
        applyTheme(!currentlyDark);
      });
    });
  });
})();

function applyTheme(isDark) {
  if (isDark) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('mzhl-theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('mzhl-theme', 'light');
  }

  document.querySelectorAll('.theme-icon-sun').forEach(el => {
    el.style.display = isDark ? 'block' : 'none';
  });
  document.querySelectorAll('.theme-icon-moon').forEach(el => {
    el.style.display = isDark ? 'none' : 'block';
  });
}

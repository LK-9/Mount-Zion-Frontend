// Mount Zion — Public Mobile Drawer & Navigation
document.addEventListener('DOMContentLoaded', () => {
  const menuButtons = [
    document.getElementById('mobile-menu-btn'),
    document.getElementById('mobile-menu-toggle')
  ].filter(Boolean);

  const drawers = [
    document.getElementById('mobile-menu-drawer'),
    document.getElementById('mobile-drawer')
  ].filter(Boolean);

  const backdrops = [
    document.getElementById('mobile-menu-backdrop'),
    document.getElementById('drawer-backdrop')
  ].filter(Boolean);

  const closeButtons = [
    document.getElementById('mobile-menu-close'),
    document.getElementById('drawer-close-btn')
  ].filter(Boolean);

  function openDrawer() {
    drawers.forEach(d => d.classList.remove('translate-x-full'));
    backdrops.forEach(b => b.classList.remove('hidden'));
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    drawers.forEach(d => d.classList.add('translate-x-full'));
    backdrops.forEach(b => b.classList.add('hidden'));
    document.body.style.overflow = '';
  }

  menuButtons.forEach(btn => btn.addEventListener('click', openDrawer));
  closeButtons.forEach(btn => btn.addEventListener('click', closeDrawer));
  backdrops.forEach(b => b.addEventListener('click', closeDrawer));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
  });
});

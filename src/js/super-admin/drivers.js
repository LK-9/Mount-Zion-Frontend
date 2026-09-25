// Super Admin Fleet & Driver Management (Interstate Trucks & PHC Base Drivers)

function getInitials(name) {
  if (!name) return 'DR';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// 1. Render Interstate Trucks & Trailers Table
function renderSuperTrucks() {
  const drivers = AppStore.getDrivers();
  const tbody = document.getElementById('super-trucks-table');
  if (!tbody) return;

  if (drivers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="p-8 text-center text-muted-foreground text-xs">No interstate trucks registered yet. Click "+ Add Truck / Trailer" to add one.</td></tr>';
    return;
  }

  tbody.innerHTML = drivers.map(d => {
    const avatarHtml = d.photo
      ? `<img src="${d.photo}" class="w-8 h-8 rounded-full object-cover border border-border shrink-0 shadow-sm" alt="${d.name}" />`
      : `<div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center border border-blue-200 dark:border-blue-900 shrink-0 text-xs">${getInitials(d.name)}</div>`;

    return `
      <tr class="hover:bg-surface/50 transition-colors">
        <td class="p-4">
          <div class="flex items-center gap-3">
            ${avatarHtml}
            <div>
              <span class="font-bold text-foreground text-xs block font-poppins">${d.name}</span>
              <span class="text-muted-foreground text-[11px] block">${d.phone}</span>
            </div>
          </div>
        </td>
        <td class="p-4">
          <div class="space-y-0.5">
            <span class="font-bold font-mono text-xs text-foreground block bg-surface px-2 py-0.5 rounded border border-border w-fit">${d.vehicle.split('(')[0].trim()}</span>
            <span class="text-muted-foreground text-[11px] block">${d.vehicle.includes('(') ? d.vehicle.substring(d.vehicle.indexOf('(')) : 'Heavy Hauler'}</span>
          </div>
        </td>
        <td class="p-4 text-right">
          <button type="button" onclick="deleteTruckDriver('${d.id}')" class="px-2.5 py-1 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer">Remove</button>
        </td>
      </tr>
    `;
  }).join('');
}

// 2. Render Port Harcourt Base Drivers Table
function renderSuperPHCDrivers() {
  const phcDrivers = AppStore.getPHCDrivers();
  const tbody = document.getElementById('super-phc-drivers-table');
  if (!tbody) return;

  if (phcDrivers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="p-8 text-center text-muted-foreground text-xs">No Port Harcourt base drivers registered yet. Click "+ Add PHC Base Driver" to add one.</td></tr>';
    return;
  }

  tbody.innerHTML = phcDrivers.map(d => {
    const avatarHtml = d.photo
      ? `<img src="${d.photo}" class="w-8 h-8 rounded-full object-cover border border-border shrink-0 shadow-sm" alt="${d.name}" />`
      : `<div class="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center border border-emerald-200 dark:border-emerald-900 shrink-0 text-xs">${getInitials(d.name)}</div>`;

    return `
      <tr class="hover:bg-surface/50 transition-colors">
        <td class="p-4">
          <div class="flex items-center gap-3">
            ${avatarHtml}
            <div>
              <span class="font-bold text-foreground text-xs block font-poppins">${d.name}</span>
              <span class="text-muted-foreground text-[11px] block">${d.phone}</span>
            </div>
          </div>
        </td>
        <td class="p-4">
          <span class="font-semibold text-xs text-foreground block">${d.vehicle.split('(')[0].trim()}</span>
          <span class="text-muted-foreground text-[10px] font-mono block">${d.vehicle.includes('(') ? d.vehicle.substring(d.vehicle.indexOf('(')) : 'PHC Local Dispatch'}</span>
        </td>
        <td class="p-4">
          <div class="flex items-center gap-1.5 text-xs text-foreground font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-600"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
            <span>${d.guarantor || 'Guarantor Verified'}</span>
          </div>
        </td>
        <td class="p-4 text-right">
          <button type="button" onclick="deletePHCDriver('${d.id}')" class="px-2.5 py-1 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer">Remove</button>
        </td>
      </tr>
    `;
  }).join('');
}

// 3. Update Counts and Badges
function updateFleetMetrics() {
  const trucks = AppStore.getDrivers();
  const phc = AppStore.getPHCDrivers();
  const total = trucks.length + phc.length;

  const tabTotal = document.getElementById('tab-count-all');
  if (tabTotal) tabTotal.textContent = total;

  const tabTrucks = document.getElementById('tab-count-trucks');
  if (tabTrucks) tabTrucks.textContent = trucks.length;

  const tabPHC = document.getElementById('tab-count-phc');
  if (tabPHC) tabPHC.textContent = phc.length;

  const sidebarBadge = document.getElementById('super-badge-drivers');
  if (sidebarBadge) sidebarBadge.textContent = total;
}

// 4. Deletes

function deleteTruckDriver(id) {
  if (confirm('Remove truck / trailer driver profile?')) {
    const drivers = AppStore.getDrivers().filter(d => d.id !== id);
    AppStore.saveDrivers(drivers);
    AppStore.logAudit('Removed truck driver', id);
    renderSuperTrucks();
    updateFleetMetrics();
  }
}

function deletePHCDriver(id) {
  if (confirm('Remove Port Harcourt base driver profile?')) {
    const drivers = AppStore.getPHCDrivers().filter(d => d.id !== id);
    AppStore.savePHCDrivers(drivers);
    AppStore.logAudit('Removed PHC base driver', id);
    renderSuperPHCDrivers();
    updateFleetMetrics();
  }
}

// 5. Initializer & Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  renderSuperTrucks();
  renderSuperPHCDrivers();
  updateFleetMetrics();

  // Photo Upload State
  let currentTruckPhoto = '';
  let currentPHCPhoto = '';

  const truckPhotoInput = document.getElementById('truck-driver-input-photo');
  const truckPhotoImg = document.getElementById('truck-driver-photo-img');
  const truckPhotoPreview = document.getElementById('truck-driver-photo-preview');
  const btnRemoveTruckPhoto = document.getElementById('btn-remove-truck-photo');

  function resetTruckPhotoUpload() {
    currentTruckPhoto = '';
    if (truckPhotoInput) truckPhotoInput.value = '';
    if (truckPhotoImg) {
      truckPhotoImg.src = '';
      truckPhotoImg.classList.add('hidden');
    }
    if (truckPhotoPreview) truckPhotoPreview.classList.remove('hidden');
    if (btnRemoveTruckPhoto) btnRemoveTruckPhoto.classList.add('hidden');
  }

  truckPhotoInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        currentTruckPhoto = event.target.result;
        if (truckPhotoImg) {
          truckPhotoImg.src = currentTruckPhoto;
          truckPhotoImg.classList.remove('hidden');
        }
        if (truckPhotoPreview) truckPhotoPreview.classList.add('hidden');
        if (btnRemoveTruckPhoto) btnRemoveTruckPhoto.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    }
  });

  btnRemoveTruckPhoto?.addEventListener('click', () => {
    resetTruckPhotoUpload();
  });

  const phcPhotoInput = document.getElementById('phc-driver-input-photo');
  const phcPhotoImg = document.getElementById('phc-driver-photo-img');
  const phcPhotoPreview = document.getElementById('phc-driver-photo-preview');
  const btnRemovePHCPhoto = document.getElementById('btn-remove-phc-photo');

  function resetPHCPhotoUpload() {
    currentPHCPhoto = '';
    if (phcPhotoInput) phcPhotoInput.value = '';
    if (phcPhotoImg) {
      phcPhotoImg.src = '';
      phcPhotoImg.classList.add('hidden');
    }
    if (phcPhotoPreview) phcPhotoPreview.classList.remove('hidden');
    if (btnRemovePHCPhoto) btnRemovePHCPhoto.classList.add('hidden');
  }

  phcPhotoInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        currentPHCPhoto = event.target.result;
        if (phcPhotoImg) {
          phcPhotoImg.src = currentPHCPhoto;
          phcPhotoImg.classList.remove('hidden');
        }
        if (phcPhotoPreview) phcPhotoPreview.classList.add('hidden');
        if (btnRemovePHCPhoto) btnRemovePHCPhoto.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    }
  });

  btnRemovePHCPhoto?.addEventListener('click', () => {
    resetPHCPhotoUpload();
  });

  // Tab Switching
  const tabAll = document.getElementById('filter-fleet-all');
  const tabTrucks = document.getElementById('filter-fleet-trucks');
  const tabPHC = document.getElementById('filter-fleet-phc');
  const secTrucks = document.getElementById('section-trucks-trailers');
  const secPHC = document.getElementById('section-phc-drivers');

  function setTabActive(activeTab) {
    [tabAll, tabTrucks, tabPHC].forEach(t => {
      if (t) {
        t.classList.remove('bg-primary', 'text-white', 'shadow-sm');
        t.classList.add('bg-surface', 'border', 'border-border', 'text-muted-foreground');
      }
    });
    if (activeTab) {
      activeTab.classList.remove('bg-surface', 'border', 'border-border', 'text-muted-foreground');
      activeTab.classList.add('bg-primary', 'text-white', 'shadow-sm');
    }
  }

  tabAll?.addEventListener('click', () => {
    setTabActive(tabAll);
    if (secTrucks) secTrucks.classList.remove('hidden');
    if (secPHC) secPHC.classList.remove('hidden');
  });

  tabTrucks?.addEventListener('click', () => {
    setTabActive(tabTrucks);
    if (secTrucks) secTrucks.classList.remove('hidden');
    if (secPHC) secPHC.classList.add('hidden');
  });

  tabPHC?.addEventListener('click', () => {
    setTabActive(tabPHC);
    if (secTrucks) secTrucks.classList.add('hidden');
    if (secPHC) secPHC.classList.remove('hidden');
  });

  // Modal Openers
  document.getElementById('btn-open-add-truck')?.addEventListener('click', () => {
    resetTruckPhotoUpload();
    document.getElementById('modal-add-truck')?.classList.remove('hidden');
  });

  document.getElementById('btn-open-add-phc-driver')?.addEventListener('click', () => {
    resetPHCPhotoUpload();
    document.getElementById('modal-add-phc-driver')?.classList.remove('hidden');
  });

  // Form Submit: Interstate Truck Driver
  document.getElementById('form-add-truck')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('truck-driver-name').value.trim();
    const phone = document.getElementById('truck-driver-phone').value.trim();
    const plate = document.getElementById('truck-driver-plate').value.trim();
    const type = document.getElementById('truck-driver-type').value;

    const current = AppStore.getDrivers();
    const newDriver = {
      id: 'DRV-' + (current.length + 1).toString().padStart(2, '0'),
      name,
      phone,
      vehicle: `${plate} (${type})`,
      photo: currentTruckPhoto
    };

    AppStore.saveDrivers([...current, newDriver]);
    AppStore.logAudit('Added interstate truck driver', `${name} - ${plate}`);
    document.getElementById('form-add-truck').reset();
    resetTruckPhotoUpload();
    document.getElementById('modal-add-truck')?.classList.add('hidden');
    renderSuperTrucks();
    updateFleetMetrics();
  });

  // Form Submit: Port Harcourt Base Driver
  document.getElementById('form-add-phc-driver')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('phc-driver-name').value.trim();
    const phone = document.getElementById('phc-driver-phone').value.trim();
    const vehicleType = document.getElementById('phc-driver-vehicle-type').value;
    const plate = document.getElementById('phc-driver-plate').value.trim();
    const guarantor = document.getElementById('phc-driver-guarantor').value.trim();

    const current = AppStore.getPHCDrivers();
    const newDriver = {
      id: 'PHD-' + (current.length + 1).toString().padStart(2, '0'),
      name,
      phone,
      vehicle: `${vehicleType} (${plate})`,
      guarantor,
      joinedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      photo: currentPHCPhoto
    };

    AppStore.savePHCDrivers([...current, newDriver]);
    AppStore.logAudit('Added PHC base driver', `${name} - ${vehicleType} (${plate})`);
    document.getElementById('form-add-phc-driver').reset();
    resetPHCPhotoUpload();
    document.getElementById('modal-add-phc-driver')?.classList.add('hidden');
    renderSuperPHCDrivers();
    updateFleetMetrics();
  });

  // Close modals
  document.querySelectorAll('.btn-close-modal').forEach(b => b.addEventListener('click', () => {
    resetTruckPhotoUpload();
    resetPHCPhotoUpload();
    document.querySelectorAll('[id^="modal-"]').forEach(m => m.classList.add('hidden'));
  }));
});

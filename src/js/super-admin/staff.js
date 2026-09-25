// Super Admin Staff & Role Management
function getStaffInitials(name) {
  if (!name) return 'ST';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function renderSuperStaff() {
  const staff = AppStore.getStaff();
  const tbody = document.getElementById('super-staff-table');
  if (!tbody) return;

  tbody.innerHTML = staff.map(s => {
    const avatarHtml = s.photo
      ? `<img src="${s.photo}" class="w-9 h-9 rounded-full object-cover border border-border shrink-0 shadow-sm" alt="${s.name}" />`
      : `<div class="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center border border-primary/20 shrink-0 text-xs">${getStaffInitials(s.name)}</div>`;

    return `
      <tr class="hover:bg-surface/50 transition-colors">
        <td class="p-4">
          <div class="flex items-center gap-3">
            ${avatarHtml}
            <div>
              <span class="font-bold text-foreground text-xs block font-poppins">${s.name}</span>
              <span class="text-[10px] text-muted-foreground font-mono">${s.id}</span>
            </div>
          </div>
        </td>
        <td class="p-4 text-xs font-medium text-foreground">
          <span class="block">${s.email}</span>
          <span class="text-muted-foreground block text-[10px]">${s.phone}</span>
        </td>
        <td class="p-4 text-xs font-semibold text-primary">${s.role}</td>
        <td class="p-4">
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            ${s.status}
          </span>
        </td>
        <td class="p-4 text-right space-x-2">
          <button type="button" onclick="resetStaffPassword('${s.id}')" class="px-2.5 py-1 rounded-lg border border-border text-xs font-semibold hover:bg-surface cursor-pointer">Reset Pass</button>
          <button type="button" onclick="deleteStaffAccount('${s.id}')" class="px-2.5 py-1 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

function resetStaffPassword(id) {
  const staff = AppStore.getStaff();
  const member = staff.find(s => s.id === id);
  if (!member) return;

  member.password = member.phone;
  AppStore.saveStaff(staff);
  AppStore.logAudit('Reset staff password', `${member.name} (${member.phone})`);
  alert(`Password for ${member.name} has been reset to their phone number: ${member.phone}`);
}

function deleteStaffAccount(id) {
  if (confirm('Delete staff account?')) {
    const staff = AppStore.getStaff().filter(s => s.id !== id);
    AppStore.saveStaff(staff);
    AppStore.logAudit('Deleted staff account', id);
    renderSuperStaff();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderSuperStaff();

  let currentUploadedPhoto = '';

  const photoInput = document.getElementById('staff-input-photo');
  const photoImg = document.getElementById('staff-photo-img');
  const photoPreview = document.getElementById('staff-photo-preview');
  const btnRemovePhoto = document.getElementById('btn-remove-photo');

  function resetPhotoUpload() {
    currentUploadedPhoto = '';
    if (photoInput) photoInput.value = '';
    if (photoImg) {
      photoImg.src = '';
      photoImg.classList.add('hidden');
    }
    if (photoPreview) photoPreview.classList.remove('hidden');
    if (btnRemovePhoto) btnRemovePhoto.classList.add('hidden');
  }

  photoInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        currentUploadedPhoto = event.target.result;
        if (photoImg) {
          photoImg.src = currentUploadedPhoto;
          photoImg.classList.remove('hidden');
        }
        if (photoPreview) photoPreview.classList.add('hidden');
        if (btnRemovePhoto) btnRemovePhoto.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    }
  });

  btnRemovePhoto?.addEventListener('click', () => {
    resetPhotoUpload();
  });

  document.getElementById('btn-open-add-staff')?.addEventListener('click', () => {
    resetPhotoUpload();
    document.getElementById('modal-super-staff')?.classList.remove('hidden');
  });

  document.getElementById('form-super-staff')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('staff-input-name').value.trim();
    const role = document.getElementById('staff-input-role').value;
    const phone = document.getElementById('staff-input-phone').value.trim();
    const email = document.getElementById('staff-input-email').value.trim();

    const current = AppStore.getStaff();
    const newStaff = {
      id: 'STF-' + (current.length + 1).toString().padStart(2, '0'),
      name,
      email,
      phone,
      password: phone, // Default login password set as staff phone number
      role,
      status: 'Active',
      photo: currentUploadedPhoto
    };

    AppStore.saveStaff([...current, newStaff]);
    AppStore.logAudit('Created staff account', `${name} (${role})`);
    document.getElementById('form-super-staff').reset();
    resetPhotoUpload();
    document.getElementById('modal-super-staff')?.classList.add('hidden');
    renderSuperStaff();
  });

  document.querySelectorAll('.btn-close-modal').forEach(b => b.addEventListener('click', () => {
    resetPhotoUpload();
    document.querySelectorAll('[id^="modal-"]').forEach(m => m.classList.add('hidden'));
  }));
});

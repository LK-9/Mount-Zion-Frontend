// Super Admin Activity & Audit Logs
function renderSuperAuditLogs() {
  const logs = AppStore.getAudit();
  const tbody = document.getElementById('super-audit-table');
  if (!tbody) return;

  tbody.innerHTML = logs.map(l => `
    <tr class="hover:bg-surface/50 transition-colors">
      <td class="p-4 text-xs text-muted-foreground">${l.timestamp}</td>
      <td class="p-4 text-xs font-bold text-foreground font-poppins">${l.user}</td>
      <td class="p-4 text-xs font-semibold text-primary">${l.action}</td>
      <td class="p-4 text-xs font-medium text-foreground">${l.target}</td>
    </tr>
  `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  renderSuperAuditLogs();
});

// Super Admin Manifests Full-Screen Management Engine

let activeManifestId = null;
let currentEditingManifestId = null;
let editingWaybillsList = [];

function getStatusClass(status) {
  if (status === "In Transit")
    return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800";
  if (status === "Offloaded" || status === "Offloaded & Closed")
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800";
  if (status === "Offloading")
    return "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-300 dark:border-teal-800";
  if (status === "Arrived D-Line PHC")
    return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800";
  if (status === "Loading" || status === "Loading at Alaba Base")
    return "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300 dark:border-purple-800";
  return "bg-surface text-foreground border-border";
}

let superManifestPeriodType = "all";
let superManifestPeriodValue = "";

function renderSuperManifests() {
  const allManifests = AppStore.getManifests();
  const allPeriods = AppStore.getAvailablePeriods(allManifests);

  if (
    superManifestPeriodType === "day" &&
    !superManifestPeriodValue &&
    allPeriods.days.length > 0
  ) {
    superManifestPeriodValue = allPeriods.days[0].key;
  } else if (
    superManifestPeriodType === "week" &&
    !superManifestPeriodValue &&
    allPeriods.weeks.length > 0
  ) {
    superManifestPeriodValue = allPeriods.weeks[0].key;
  } else if (
    superManifestPeriodType === "month" &&
    !superManifestPeriodValue &&
    allPeriods.months.length > 0
  ) {
    superManifestPeriodValue = allPeriods.months[0].key;
  } else if (
    superManifestPeriodType === "year" &&
    !superManifestPeriodValue &&
    allPeriods.years.length > 0
  ) {
    superManifestPeriodValue = allPeriods.years[0].key;
  }

  const manifests = AppStore.filterByPeriod(
    allManifests,
    superManifestPeriodType,
    superManifestPeriodValue,
  );

  // Render Period Toolbar
  DateUtils.renderPeriodToolbar({
    containerId: "super-manifests-period-toolbar",
    periodType: superManifestPeriodType,
    periodValue: superManifestPeriodValue,
    availablePeriods: allPeriods,
    countsSummary: getManifestCountsSummary(
      allManifests,
      superManifestPeriodType,
      superManifestPeriodValue,
    ),
    onChange: (newType, newVal) => {
      superManifestPeriodType = newType;
      superManifestPeriodValue = newVal;
      renderSuperManifests();
    },
  });

  const tbody = document.getElementById("super-manifests-table");
  if (!tbody) return;

  const badgeEl = document.getElementById("super-badge-manifests");
  if (badgeEl)
    badgeEl.textContent = allManifests.filter(
      (m) => m.status !== "Offloaded" && m.status !== "Offloaded & Closed",
    ).length;

  if (manifests.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="p-8 text-center text-muted-foreground text-xs">No manifests found for this period. Click "+ Create New Manifest".</td></tr>';
    return;
  }

  // Render Table with Date Group Headers
  if (superManifestPeriodType === "all" || !superManifestPeriodValue) {
    const groups = AppStore.groupItemsByPeriod(
      manifests,
      superManifestPeriodType === "year" ? "month" : "day",
    );
    tbody.innerHTML = groups
      .map((g) => {
        let totalPaid = 0;
        let totalCharged = 0;
        g.items.forEach((m) => {
          (m.waybills || []).forEach((w) => {
            totalCharged += Number(w.amountCharged) || 0;
            totalPaid += Number(w.amountPaid) || 0;
          });
        });
        const header = DateUtils.renderDateGroupHeader(
          g,
          6,
          `Collections: ₦${totalPaid.toLocaleString()} / ₦${totalCharged.toLocaleString()}`,
        );
        const rows = g.items.map((m) => renderSuperManifestRow(m)).join("");
        return header + rows;
      })
      .join("");
  } else if (
    superManifestPeriodType === "month" ||
    superManifestPeriodType === "week"
  ) {
    const groups = AppStore.groupItemsByPeriod(manifests, "day");
    tbody.innerHTML = groups
      .map((g) => {
        let totalPaid = 0;
        let totalCharged = 0;
        g.items.forEach((m) => {
          (m.waybills || []).forEach((w) => {
            totalCharged += Number(w.amountCharged) || 0;
            totalPaid += Number(w.amountPaid) || 0;
          });
        });
        const header = DateUtils.renderDateGroupHeader(
          g,
          6,
          `Collections: ₦${totalPaid.toLocaleString()} / ₦${totalCharged.toLocaleString()}`,
        );
        const rows = g.items.map((m) => renderSuperManifestRow(m)).join("");
        return header + rows;
      })
      .join("");
  } else {
    tbody.innerHTML = manifests.map((m) => renderSuperManifestRow(m)).join("");
  }
}

function getManifestCountsSummary(allManifests, periodType, periodValue) {
  const filtered = AppStore.filterByPeriod(
    allManifests,
    periodType,
    periodValue,
  );
  let totalPaid = 0;
  filtered.forEach((m) => {
    (m.waybills || []).forEach((w) => {
      totalPaid += Number(w.amountPaid) || 0;
    });
  });
  return `${filtered.length} Dispatches • ₦${totalPaid.toLocaleString()} Paid`;
}

function renderSuperManifestRow(m) {
  const totalWaybills = m.waybills ? m.waybills.length : 0;
  const totalCharged = (m.waybills || []).reduce(
    (acc, w) => acc + (Number(w.amountCharged) || 0),
    0,
  );
  const totalPaid = (m.waybills || []).reduce(
    (acc, w) => acc + (Number(w.amountPaid) || 0),
    0,
  );

  return `
    <tr class="hover:bg-surface/50 transition-colors">
      <td class="p-4 font-bold text-foreground">
        <span class="font-mono text-sm block">${m.id}</span>
        <span class="text-[11px] text-muted-foreground font-normal">${m.loadingDate || m.departureDate || ""}</span>
      </td>
      <td class="p-4 text-xs font-bold text-foreground">
        ${m.truckPlate}
        <span class="text-muted-foreground block font-normal">${m.containerSize}</span>
      </td>
      <td class="p-4 text-xs">
        <span class="font-semibold text-foreground">${m.driverName}</span>
        <span class="text-muted-foreground block text-[11px]">${m.driverPhone || "0800 000 0000"}</span>
      </td>
      <td class="p-4 text-xs font-semibold">
        ${totalWaybills} Consignments
        <span class="text-emerald-600 dark:text-emerald-400 block text-[11px]">Paid: ₦${totalPaid.toLocaleString()} / ₦${totalCharged.toLocaleString()}</span>
      </td>
      <td class="p-4">
        <select onchange="updateManifestStatus('${m.id}', this.value)" class="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-border bg-surface cursor-pointer">
          <option value="Loading" ${m.status === "Loading" ? "selected" : ""}>Loading</option>
          <option value="In Transit" ${m.status === "In Transit" ? "selected" : ""}>In Transit</option>
          <option value="Arrived D-Line PHC" ${m.status === "Arrived D-Line PHC" ? "selected" : ""}>Arrived in PHC</option>
          <option value="Offloading" ${m.status === "Offloading" ? "selected" : ""}>Offloading</option>
          <option value="Offloaded" ${m.status === "Offloaded" ? "selected" : ""}>Offloaded</option>
        </select>
      </td>
      <td class="p-4 text-right space-x-1.5">
        <button type="button" onclick="openFullscreenViewSheet('${m.id}')" class="px-2.5 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:opacity-90 cursor-pointer shadow-xs">View Sheet</button>
        <button type="button" onclick="openFullscreenCreateEditManifest('${m.id}')" class="px-2.5 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-surface cursor-pointer">Edit</button>
        <button type="button" onclick="deleteSuperManifest('${m.id}')" class="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer">Delete</button>
      </td>
    </tr>
  `;
}

function updateManifestStatus(id, newStatus) {
  const manifests = AppStore.getManifests().map((m) =>
    m.id === id ? { ...m, status: newStatus } : m,
  );
  AppStore.saveManifests(manifests);
  AppStore.logAudit("Updated status to " + newStatus, id);
  renderSuperManifests();
}

function deleteSuperManifest(id) {
  if (confirm("Delete Manifest " + id + "?")) {
    const manifests = AppStore.getManifests().filter((m) => m.id !== id);
    AppStore.saveManifests(manifests);
    AppStore.logAudit("Deleted manifest", id);
    renderSuperManifests();
  }
}

// -----------------------------------------------------------------------------
// FULL-SCREEN VIEW SHEET (READ-ONLY / QUICK TOGGLES)
// -----------------------------------------------------------------------------
function openFullscreenViewSheet(id) {
  activeManifestId = id;
  const m = AppStore.getManifestById(id);
  if (!m) return;

  const sheet = document.getElementById("fullscreen-manifest-sheet");
  if (!sheet) return;

  document.getElementById("fs-manifest-title").textContent =
    `${m.id} — Loading & Delivery Manifest`;

  const statusBadge = document.getElementById("fs-manifest-status-badge");
  if (statusBadge) {
    statusBadge.textContent = m.status;
    statusBadge.className = `px-3 py-1 rounded-full text-xs font-bold border ${getStatusClass(m.status)}`;
  }

  // Heading Cards without driver photo requirement
  const headingGrid = document.getElementById("fs-manifest-heading-grid");
  if (headingGrid) {
    headingGrid.innerHTML = `
      <div class="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
        <div class="flex items-center gap-2.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" y1="2" y2="6"></line><line x1="8" y1="2" y2="6"></line><line x1="3" x2="21" y1="10" y2="10"></line></svg>
          <span>Truck Schedule</span>
        </div>
        <div class="space-y-2 text-xs">
          <div class="flex justify-between py-1 border-b border-border/50">
            <span class="text-muted-foreground">Truck Loading Date:</span>
            <strong class="text-foreground font-semibold">${m.loadingDate || m.departureDate || "Today, 06:00 AM"}</strong>
          </div>
          ${
            m.offloadingDate
              ? `
          <div class="flex justify-between py-1 border-b border-border/50">
            <span class="text-muted-foreground">Truck Offloading Date:</span>
            <strong class="text-foreground font-semibold">${m.offloadingDate}</strong>
          </div>`
              : ""
          }
          <div class="flex justify-between py-1">
            <span class="text-muted-foreground">Transit Route:</span>
            <span class="text-foreground font-medium text-right">${m.route || "Lagos (Alaba) ↔ PHC (D-Line)"}</span>
          </div>
        </div>
      </div>

      <div class="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
        <div class="flex items-center gap-2.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"></path><path d="M15 18H9"></path><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"></path><circle cx="17" cy="18" r="2"></circle><circle cx="7" cy="18" r="2"></circle></svg>
          <span>Truck & Container</span>
        </div>
        <div class="space-y-2 text-xs">
          <div class="flex justify-between py-1 border-b border-border/50">
            <span class="text-muted-foreground">Truck Plate Number:</span>
            <strong class="text-primary font-bold text-sm tracking-wider uppercase">${m.truckPlate}</strong>
          </div>
          <div class="flex justify-between py-1">
            <span class="text-muted-foreground">Container Type:</span>
            <span class="text-foreground font-semibold">${m.containerSize}</span>
          </div>
        </div>
      </div>

      <!-- Driver Card -->
      <div class="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            <span>Assigned Driver</span>
          </div>
        </div>
        
        <div class="flex items-center gap-3.5 pt-1">
          <div class="h-12 w-12 rounded-2xl bg-gradient-brand text-white flex items-center justify-center font-bold text-lg shadow-glow shrink-0 font-poppins">
            ${(m.driverName || "N A")
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div class="min-w-0">
            <h4 class="font-bold text-sm text-foreground truncate">${m.driverName}</h4>
            <a href="tel:${m.driverPhone}" class="text-xs text-primary font-semibold hover:underline flex items-center gap-1 mt-0.5">
              <span>📞 ${m.driverPhone}</span>
            </a>
            <span class="text-[11px] text-muted-foreground block mt-0.5">Interstate Heavy Haulage Driver</span>
          </div>
        </div>
      </div>
    `;
  }

  renderFullscreenWaybillsTable(m);
  sheet.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function renderFullscreenWaybillsTable(m) {
  const tbody = document.getElementById("fs-manifest-table-body");
  if (!tbody) return;

  const waybills = m.waybills || [];
  document.getElementById("fs-waybill-count").textContent = waybills.length;

  if (waybills.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7" class="p-8 text-center text-muted-foreground text-xs">No waybill consignments loaded on this manifest.</td></tr>';
    renderFullscreenSummary(0, 0, 0);
    return;
  }

  let totalCharged = 0;
  let totalPaid = 0;
  let totalBalance = 0;

  tbody.innerHTML = waybills
    .map((w, idx) => {
      const charged = Number(w.amountCharged) || 0;
      const paid = Number(w.amountPaid) || 0;
      const balance = Math.max(0, charged - paid);
      const isPaid = paid >= charged;

      totalCharged += charged;
      totalPaid += paid;
      totalBalance += balance;

      return `
      <tr class="hover:bg-surface/60 transition-colors ${idx % 2 === 0 ? "bg-card" : "bg-surface/20"}">
        <td class="p-4 align-top">
          <strong class="font-bold text-foreground text-sm block">${w.receiverName}</strong>
          <a href="tel:${w.receiverPhone}" class="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1 mt-0.5">
            📞 ${w.receiverPhone}
          </a>
          <span class="text-[11px] text-muted-foreground block mt-0.5 truncate max-w-xs">📍 ${w.destination || "Port Harcourt Depot"}</span>
        </td>

        <td class="p-4 align-top">
          <span class="inline-block font-bold text-foreground bg-surface border border-border px-3 py-1 rounded-xl text-xs shadow-xs">
            ${w.itemQuantity}
          </span>
        </td>

        <td class="p-4 align-top">
          <p class="font-semibold text-foreground text-xs sm:text-sm leading-snug">${w.itemNameDescription}</p>
          <span class="text-[11px] text-muted-foreground font-mono mt-1 block">Waybill Ref: ${w.id}</span>
        </td>

        <td class="p-4 align-top">
          <span class="font-extrabold text-foreground text-sm font-poppins">₦${charged.toLocaleString()}</span>
        </td>

        <td class="p-4 align-top space-y-2">
          <div class="flex items-center gap-2">
            <button
              type="button"
              onclick="toggleWaybillPaid('${m.id}', '${w.id}')"
              class="px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${isPaid ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800" : paid > 0 ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300" : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-300"}"
            >
              ${isPaid ? "✓ Paid in Full" : paid > 0 ? "⏳ Partial Payment" : "✕ Not Paid"}
            </button>
          </div>
          
          <div class="flex items-center gap-1.5 pt-0.5">
            <span class="text-[11px] text-muted-foreground font-semibold">Paid: ₦</span>
            <input
              type="number"
              min="0"
              max="${charged}"
              value="${paid}"
              onchange="updateWaybillAmountPaid('${m.id}', '${w.id}', this.value)"
              class="w-24 px-2 py-1 rounded-lg border border-border bg-surface text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div class="text-[11px] font-medium text-muted-foreground">
            Bal: <strong class="${balance > 0 ? "text-red-600 dark:text-red-400 font-bold" : "text-emerald-600 dark:text-emerald-400 font-bold"}">₦${balance.toLocaleString()}</strong>
          </div>

          <div class="flex items-center gap-1.5 pt-1 border-t border-border/50">
            <span class="text-[10px] text-muted-foreground font-semibold uppercase">Method:</span>
            <select
              onchange="updateWaybillPaymentMethod('${m.id}', '${w.id}', this.value)"
              class="px-2 py-0.5 rounded-lg border border-border bg-surface text-[11px] font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="POS Terminal" ${w.paymentMethod === "POS Terminal" ? "selected" : ""}>POS Terminal</option>
              <option value="Bank Transfer" ${(w.paymentMethod || "Bank Transfer") === "Bank Transfer" ? "selected" : ""}>Bank Transfer</option>
            </select>
          </div>
        </td>

        <td class="p-4 align-top text-center">
          <button
            type="button"
            onclick="toggleWaybillReachedOut('${m.id}', '${w.id}')"
            class="px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${w.reachedOut ? "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700" : "bg-surface text-muted-foreground border border-border hover:bg-muted hover:text-foreground"}"
          >
            ${w.reachedOut ? "✓ Contacted" : "⏳ Pending Call"}
          </button>
        </td>

        <td class="p-4 align-top text-center">
          <button
            type="button"
            onclick="toggleWaybillGoodsReceived('${m.id}', '${w.id}')"
            class="px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${w.goodsReceived ? "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700" : "bg-surface text-muted-foreground border border-border hover:bg-muted hover:text-foreground"}"
          >
            ${w.goodsReceived ? "✓ Received" : "📦 In Transit"}
          </button>
        </td>
      </tr>
    `;
    })
    .join("");

  renderFullscreenSummary(totalCharged, totalPaid, totalBalance);
}

function renderFullscreenSummary(totalCharged, totalPaid, totalBalance) {
  const summaryEl = document.getElementById("fs-manifest-summary-section");
  if (!summaryEl) return;

  const collectionPercent =
    totalCharged > 0 ? Math.round((totalPaid / totalCharged) * 100) : 100;

  summaryEl.innerHTML = `
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
      <div class="space-y-2">
        <span class="text-xs font-bold uppercase tracking-wider text-muted-foreground">Manifest Financial Summary</span>
        <h4 class="text-lg sm:text-xl font-bold font-poppins text-foreground">Consolidated Cargo Settlement</h4>
        <div class="flex items-center gap-3 pt-1">
          <div class="w-48 bg-border rounded-full h-2.5 overflow-hidden">
            <div class="bg-emerald-600 h-2.5 rounded-full" style="width: ${collectionPercent}%"></div>
          </div>
          <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400">${collectionPercent}% Collected</span>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
        <div class="p-4 rounded-2xl bg-card border border-border">
          <span class="text-xs text-muted-foreground block font-medium">Total Amount Charged</span>
          <strong class="text-xl sm:text-2xl font-extrabold font-poppins text-foreground mt-1 block">₦${totalCharged.toLocaleString()}</strong>
        </div>

        <div class="p-4 rounded-2xl bg-card border border-emerald-300 dark:border-emerald-800 dark:bg-emerald-950/30">
          <span class="text-xs text-emerald-700 dark:text-emerald-300 block font-medium">Total Amount Paid</span>
          <strong class="text-xl sm:text-2xl font-extrabold font-poppins text-emerald-600 dark:text-emerald-400 mt-1 block">₦${totalPaid.toLocaleString()}</strong>
        </div>

        <div class="p-4 rounded-2xl bg-card border border-red-300 dark:border-red-800 dark:bg-red-950/30">
          <span class="text-xs text-red-700 dark:text-red-300 block font-medium">Total Balance Remaining</span>
          <strong class="text-xl sm:text-2xl font-extrabold font-poppins text-red-600 dark:text-red-400 mt-1 block">₦${totalBalance.toLocaleString()}</strong>
        </div>
      </div>
    </div>
  `;
}

function toggleWaybillPaid(manifestId, waybillId) {
  const m = AppStore.getManifestById(manifestId);
  const w = (m?.waybills || []).find((x) => x.id === waybillId);
  if (!w) return;

  const newIsPaid = !w.isPaid;
  const newAmountPaid = newIsPaid ? Number(w.amountCharged || 0) : 0;

  const updatedM = AppStore.updateWaybillInManifest(manifestId, waybillId, {
    isPaid: newIsPaid,
    amountPaid: newAmountPaid,
    balance: newIsPaid ? 0 : Number(w.amountCharged || 0),
  });

  if (updatedM) {
    renderFullscreenWaybillsTable(updatedM);
    renderSuperManifests();
  }
}

function updateWaybillAmountPaid(manifestId, waybillId, val) {
  const amount = Math.max(0, Number(val) || 0);
  const m = AppStore.getManifestById(manifestId);
  const w = (m?.waybills || []).find((x) => x.id === waybillId);
  if (!w) return;

  const charged = Number(w.amountCharged || 0);
  const updatedPaid = Math.min(amount, charged);
  const balance = Math.max(0, charged - updatedPaid);

  const updatedM = AppStore.updateWaybillInManifest(manifestId, waybillId, {
    amountPaid: updatedPaid,
    balance,
    isPaid: updatedPaid >= charged,
  });

  if (updatedM) {
    renderFullscreenWaybillsTable(updatedM);
    renderSuperManifests();
  }
}

function updateWaybillPaymentMethod(manifestId, waybillId, method) {
  const m = AppStore.getManifestById(manifestId);
  const w = (m?.waybills || []).find((x) => x.id === waybillId);
  if (!w) return;

  const updatedM = AppStore.updateWaybillInManifest(manifestId, waybillId, {
    paymentMethod: method,
  });

  if (updatedM) {
    AppStore.logAudit(
      `Changed payment method for ${waybillId} to ${method}`,
      manifestId,
    );
  }
}

function toggleWaybillReachedOut(manifestId, waybillId) {
  const m = AppStore.getManifestById(manifestId);
  const w = (m?.waybills || []).find((x) => x.id === waybillId);
  if (!w) return;

  const updatedM = AppStore.updateWaybillInManifest(manifestId, waybillId, {
    reachedOut: !w.reachedOut,
  });

  if (updatedM) {
    renderFullscreenWaybillsTable(updatedM);
  }
}

function toggleWaybillGoodsReceived(manifestId, waybillId) {
  const m = AppStore.getManifestById(manifestId);
  const w = (m?.waybills || []).find((x) => x.id === waybillId);
  if (!w) return;

  const updatedM = AppStore.updateWaybillInManifest(manifestId, waybillId, {
    goodsReceived: !w.goodsReceived,
  });

  if (updatedM) {
    renderFullscreenWaybillsTable(updatedM);
  }
}

function closeFullscreenViewSheet() {
  const sheet = document.getElementById("fullscreen-manifest-sheet");
  if (sheet) sheet.classList.add("hidden");
  document.body.style.overflow = "";
}

// -----------------------------------------------------------------------------
// FULL-SCREEN CREATE / EDIT MANIFEST BUILDER (SUPER ADMIN)
// -----------------------------------------------------------------------------
function populateRegisteredDriversDropdown() {
  const select = document.getElementById("form-mnf-quick-driver");
  if (!select) return;
  const drivers = AppStore.getDrivers();
  select.innerHTML =
    '<option value="">-- Choose Registered Truck Driver --</option>' +
    drivers
      .map((d) => `<option value="${d.id}">${d.name} (${d.vehicle})</option>`)
      .join("");
}

function openFullscreenCreateEditManifest(manifestId = null) {
  currentEditingManifestId = manifestId;
  const sheet = document.getElementById("fullscreen-create-manifest-sheet");
  if (!sheet) return;

  populateRegisteredDriversDropdown();

  const titleEl = document.getElementById("fs-create-title");
  const idInput = document.getElementById("form-mnf-id");
  const plateInput = document.getElementById("form-mnf-plate");
  const containerInput = document.getElementById("form-mnf-container");
  const driverInput = document.getElementById("form-mnf-driver");
  const driverPhoneInput = document.getElementById("form-mnf-driver-phone");
  const loadingInput = document.getElementById("form-mnf-loading-date");
  const offloadingInput = document.getElementById("form-mnf-offloading-date");
  const statusInput = document.getElementById("form-mnf-status");
  const quickDriverSelect = document.getElementById("form-mnf-quick-driver");

  if (quickDriverSelect) quickDriverSelect.value = "";

  if (manifestId) {
    const m = AppStore.getManifestById(manifestId);
    if (!m) return;
    if (titleEl) titleEl.textContent = `Edit Truck Manifest — ${m.id}`;
    if (idInput) idInput.value = m.id;
    if (plateInput) plateInput.value = m.truckPlate || "";
    if (containerInput)
      containerInput.value = m.containerSize || "40-ft High-Cube Container";
    if (driverInput) driverInput.value = m.driverName || "";
    if (driverPhoneInput) driverPhoneInput.value = m.driverPhone || "";
    if (loadingInput)
      loadingInput.value = m.loadingDate || m.departureDate || "";
    if (offloadingInput) offloadingInput.value = m.offloadingDate || "";
    if (statusInput) statusInput.value = m.status || "Loading";

    editingWaybillsList = JSON.parse(JSON.stringify(m.waybills || []));
  } else {
    const existing = AppStore.getManifests();
    const numbers = existing.map((m) => {
      const match = m.id.match(/\d+$/);
      return match ? parseInt(match[0], 10) : 0;
    });
    const nextNum = (numbers.length > 0 ? Math.max(...numbers) + 1 : 45)
      .toString()
      .padStart(3, "0");

    if (titleEl) titleEl.textContent = "Create New Truck Loading Manifest";
    if (idInput) idInput.value = `MNF-2026-${nextNum}`;
    if (plateInput) plateInput.value = "";
    if (containerInput) containerInput.value = "40-ft High-Cube Container";
    if (driverInput) driverInput.value = "";
    if (driverPhoneInput) driverPhoneInput.value = "";
    if (loadingInput)
      loadingInput.value =
        new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }) + ", 06:00 AM";
    if (offloadingInput) offloadingInput.value = "";
    if (statusInput) statusInput.value = "Loading";

    editingWaybillsList = [
      {
        id: "MZ-2026-" + Math.floor(100 + Math.random() * 900),
        receiverName: "",
        receiverPhone: "",
        itemQuantity: "1 Cartons",
        itemNameDescription: "",
        destination: "Port Harcourt Depot",
        amountCharged: 0,
        amountPaid: 0,
        balance: 0,
        isPaid: true,
        reachedOut: false,
        goodsReceived: false,
      },
    ];
  }

  renderEditingWaybillsTable();
  sheet.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function renderEditingWaybillsTable() {
  const tbody = document.getElementById("fs-create-waybills-tbody");
  if (!tbody) return;

  if (editingWaybillsList.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="p-8 text-center text-muted-foreground text-xs">No consignment items added yet. Click "+ Add Consignment Waybill" to start.</td></tr>';
  } else {
    tbody.innerHTML = editingWaybillsList
      .map((w, index) => {
        const charged = Number(w.amountCharged) || 0;
        const paid = Number(w.amountPaid) || 0;
        const balance = Math.max(0, charged - paid);

        return `
        <tr class="hover:bg-surface/60 transition-colors">
          <!-- 1. Receiver Name & Phone -->
          <td class="p-3 align-top space-y-1.5">
            <input
              type="text"
              placeholder="Receiver Name *"
              value="${w.receiverName || ""}"
              oninput="updateEditingWaybillField(${index}, 'receiverName', this.value)"
              class="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              type="tel"
              placeholder="Phone: 0803 111 2233"
              value="${w.receiverPhone || ""}"
              oninput="updateEditingWaybillField(${index}, 'receiverPhone', this.value)"
              class="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </td>

          <!-- 2. Item Quantity -->
          <td class="p-3 align-top">
            <input
              type="text"
              placeholder="e.g. 18 Cartons"
              value="${w.itemQuantity || ""}"
              oninput="updateEditingWaybillField(${index}, 'itemQuantity', this.value)"
              class="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </td>

          <!-- 3. Item Description -->
          <td class="p-3 align-top">
            <textarea
              rows="2"
              placeholder="Detailed goods description"
              oninput="updateEditingWaybillField(${index}, 'itemNameDescription', this.value)"
              class="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >${w.itemNameDescription || ""}</textarea>
          </td>

          <!-- 4. Amount Charged -->
          <td class="p-3 align-top">
            <div class="flex items-center gap-1">
              <span class="text-xs font-semibold text-muted-foreground">₦</span>
              <input
                type="number"
                min="0"
                placeholder="0"
                value="${w.amountCharged !== undefined ? w.amountCharged : 0}"
                oninput="updateEditingWaybillCharged(${index}, this.value)"
                class="w-28 px-2.5 py-1.5 rounded-lg border border-border bg-surface text-xs font-extrabold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </td>

          <!-- 5. Payment (Paid / Amount / Balance) -->
          <td class="p-3 align-top space-y-1.5">
            <div class="flex items-center gap-1.5">
              <span class="text-[11px] text-muted-foreground font-semibold">Paid: ₦</span>
              <input
                type="number"
                min="0"
                placeholder="0"
                value="${w.amountPaid !== undefined ? w.amountPaid : 0}"
                oninput="updateEditingWaybillPaid(${index}, this.value)"
                class="w-24 px-2 py-1 rounded-lg border border-border bg-surface text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div id="bal-row-${index}" class="text-[11px] font-medium text-muted-foreground">
              Bal: <strong class="${balance > 0 ? "text-red-600 dark:text-red-400 font-bold" : "text-emerald-600 dark:text-emerald-400 font-bold"}">₦${balance.toLocaleString()}</strong>
            </div>
            <div class="flex items-center gap-1 pt-1 border-t border-border/50">
              <span class="text-[10px] text-muted-foreground font-semibold uppercase">Method:</span>
              <select
                onchange="updateEditingWaybillPaymentMethod(${index}, this.value)"
                class="w-full px-2 py-0.5 rounded-lg border border-border bg-surface text-[11px] font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="POS Terminal" ${w.paymentMethod === "POS Terminal" ? "selected" : ""}>POS Terminal</option>
                <option value="Bank Transfer" ${(w.paymentMethod || "Bank Transfer") === "Bank Transfer" ? "selected" : ""}>Bank Transfer</option>
              </select>
            </div>
          </td>

          <!-- 6. Action: Delete Row -->
          <td class="p-3 align-top text-right">
            <button
              type="button"
              onclick="removeEditingWaybillRow(${index})"
              class="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer inline-flex items-center gap-1 transition-colors"
              title="Delete Waybill Row"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
              <span>Delete</span>
            </button>
          </td>
        </tr>
      `;
      })
      .join("");
  }

  renderEditingWaybillsSummary();
}

function renderEditingWaybillsSummary() {
  let totalCharged = 0;
  let totalPaid = 0;
  let totalBalance = 0;

  editingWaybillsList.forEach((w) => {
    const charged = Number(w.amountCharged) || 0;
    const paid = Number(w.amountPaid) || 0;
    const balance = Math.max(0, charged - paid);
    totalCharged += charged;
    totalPaid += paid;
    totalBalance += balance;
  });

  const summaryCharged = document.getElementById("fs-create-sum-charged");
  const summaryPaid = document.getElementById("fs-create-sum-paid");
  const summaryBalance = document.getElementById("fs-create-sum-balance");
  if (summaryCharged)
    summaryCharged.textContent = `₦${totalCharged.toLocaleString()}`;
  if (summaryPaid) summaryPaid.textContent = `₦${totalPaid.toLocaleString()}`;
  if (summaryBalance)
    summaryBalance.textContent = `₦${totalBalance.toLocaleString()}`;
}

function addNewEditingWaybillRow() {
  const newWaybill = {
    id: "MZ-2026-" + Math.floor(100 + Math.random() * 900),
    receiverName: "",
    receiverPhone: "",
    itemQuantity: "1 Cartons",
    itemNameDescription: "",
    destination: "Port Harcourt Depot",
    amountCharged: 0,
    amountPaid: 0,
    balance: 0,
    isPaid: true,
    paymentMethod: "Bank Transfer",
    reachedOut: false,
    goodsReceived: false,
  };
  editingWaybillsList.push(newWaybill);
  renderEditingWaybillsTable();
}

function removeEditingWaybillRow(index) {
  editingWaybillsList.splice(index, 1);
  renderEditingWaybillsTable();
}

function updateEditingWaybillField(index, field, value) {
  if (editingWaybillsList[index]) {
    editingWaybillsList[index][field] = value;
  }
}

function updateEditingWaybillPaymentMethod(index, method) {
  if (editingWaybillsList[index]) {
    editingWaybillsList[index].paymentMethod = method;
  }
}

function updateEditingWaybillCharged(index, val) {
  const charged = Math.max(0, Number(val) || 0);
  if (editingWaybillsList[index]) {
    editingWaybillsList[index].amountCharged = charged;
    const paid = Number(editingWaybillsList[index].amountPaid) || 0;
    editingWaybillsList[index].balance = Math.max(0, charged - paid);
    editingWaybillsList[index].isPaid = paid >= charged;
    renderEditingWaybillsSummary();
    const balEl = document.getElementById(`bal-row-${index}`);
    if (balEl) {
      balEl.innerHTML = `Bal: <strong class="${editingWaybillsList[index].balance > 0 ? "text-red-600 dark:text-red-400 font-bold" : "text-emerald-600 dark:text-emerald-400 font-bold"}">₦${editingWaybillsList[index].balance.toLocaleString()}</strong>`;
    }
  }
}

function updateEditingWaybillPaid(index, val) {
  const paid = Math.max(0, Number(val) || 0);
  if (editingWaybillsList[index]) {
    const charged = Number(editingWaybillsList[index].amountCharged) || 0;
    editingWaybillsList[index].amountPaid = paid;
    editingWaybillsList[index].balance = Math.max(0, charged - paid);
    editingWaybillsList[index].isPaid = paid >= charged;
    renderEditingWaybillsSummary();
    const balEl = document.getElementById(`bal-row-${index}`);
    if (balEl) {
      balEl.innerHTML = `Bal: <strong class="${editingWaybillsList[index].balance > 0 ? "text-red-600 dark:text-red-400 font-bold" : "text-emerald-600 dark:text-emerald-400 font-bold"}">₦${editingWaybillsList[index].balance.toLocaleString()}</strong>`;
    }
  }
}

function toggleEditingWaybillFlag(index, flag) {
  if (editingWaybillsList[index]) {
    editingWaybillsList[index][flag] = !editingWaybillsList[index][flag];
    renderEditingWaybillsTable();
  }
}

function saveFullscreenManifest() {
  const id = document.getElementById("form-mnf-id")?.value.trim();
  const plate = document.getElementById("form-mnf-plate")?.value.trim();
  const container = document.getElementById("form-mnf-container")?.value;
  const driver = document.getElementById("form-mnf-driver")?.value.trim();
  const driverPhone = document
    .getElementById("form-mnf-driver-phone")
    ?.value.trim();
  const loading = document
    .getElementById("form-mnf-loading-date")
    ?.value.trim();
  const offloading = document
    .getElementById("form-mnf-offloading-date")
    ?.value.trim();
  const status = document.getElementById("form-mnf-status")?.value || "Loading";

  if (!id || !plate || !driver) {
    alert("Please fill out Manifest ID, Truck Plate, and Driver Name.");
    return;
  }

  // Ensure each consignment has an ID
  const cleanedWaybills = editingWaybillsList.map((w, idx) => ({
    ...w,
    id: w.id || "MZ-2026-" + (100 + idx),
  }));

  let manifests = AppStore.getManifests();

  if (currentEditingManifestId) {
    const idx = manifests.findIndex((m) => m.id === currentEditingManifestId);
    if (idx !== -1) {
      manifests[idx] = {
        ...manifests[idx],
        id,
        truckPlate: plate,
        containerSize: container,
        driverName: driver,
        driverPhone: driverPhone || "0800 000 0000",
        loadingDate: loading,
        offloadingDate: offloading,
        status,
        waybills: cleanedWaybills,
      };
      AppStore.logAudit("Updated complete manifest & consignments", id);
    }
  } else {
    const newM = {
      id,
      truckPlate: plate,
      containerSize: container,
      driverName: driver,
      driverPhone: driverPhone || "0800 000 0000",
      loadingDate: loading,
      offloadingDate: offloading,
      status,
      totalWeight: container.includes("40") ? "24.5 Tons" : "15.0 Tons",
      waybills: cleanedWaybills,
    };
    manifests = [newM, ...manifests];
    AppStore.logAudit("Created new full manifest & consignments", id);
  }

  AppStore.saveManifests(manifests);
  closeFullscreenCreateEdit();
  renderSuperManifests();
}

function closeFullscreenCreateEdit() {
  const sheet = document.getElementById("fullscreen-create-manifest-sheet");
  if (sheet) sheet.classList.add("hidden");
  document.body.style.overflow = "";
}

// -----------------------------------------------------------------------------
// INITIALIZATION
// -----------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  renderSuperManifests();

  document
    .getElementById("btn-close-fullscreen-sheet")
    ?.addEventListener("click", closeFullscreenViewSheet);
  document
    .getElementById("btn-close-create-sheet")
    ?.addEventListener("click", closeFullscreenCreateEdit);
  document
    .getElementById("btn-cancel-create-manifest")
    ?.addEventListener("click", closeFullscreenCreateEdit);

  document
    .getElementById("btn-open-create-manifest")
    ?.addEventListener("click", () => {
      openFullscreenCreateEditManifest(null);
    });

  document
    .getElementById("form-mnf-quick-driver")
    ?.addEventListener("change", (e) => {
      const driverId = e.target.value;
      if (!driverId) return;
      const driver = AppStore.getDrivers().find((d) => d.id === driverId);
      if (!driver) return;

      const driverInput = document.getElementById("form-mnf-driver");
      const driverPhoneInput = document.getElementById("form-mnf-driver-phone");
      const plateInput = document.getElementById("form-mnf-plate");
      const containerInput = document.getElementById("form-mnf-container");

      if (driverInput) driverInput.value = driver.name;
      if (driverPhoneInput) driverPhoneInput.value = driver.phone;

      if (driver.vehicle) {
        const plateMatch = driver.vehicle.match(/^([^\(]+)/);
        if (plateMatch && plateInput) plateInput.value = plateMatch[1].trim();

        if (containerInput) {
          if (driver.vehicle.includes("20-ft")) {
            containerInput.value = "20-ft Standard Container";
          } else if (driver.vehicle.includes("Flatbed")) {
            containerInput.value = "40-ft Flatbed Trailer";
          } else if (driver.vehicle.includes("Lowbed")) {
            containerInput.value = "Tri-Axle Lowbed Hauler";
          } else {
            containerInput.value = "40-ft High-Cube Container";
          }
        }
      }
    });

  document
    .getElementById("btn-add-waybill-row")
    ?.addEventListener("click", addNewEditingWaybillRow);
  document
    .getElementById("btn-save-fullscreen-manifest")
    ?.addEventListener("click", saveFullscreenManifest);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeFullscreenViewSheet();
      closeFullscreenCreateEdit();
    }
  });
});

window.openFullscreenViewSheet = openFullscreenViewSheet;
window.closeFullscreenViewSheet = closeFullscreenViewSheet;
window.openFullscreenCreateEditManifest = openFullscreenCreateEditManifest;
window.closeFullscreenCreateEdit = closeFullscreenCreateEdit;
window.saveFullscreenManifest = saveFullscreenManifest;
window.addNewEditingWaybillRow = addNewEditingWaybillRow;
window.removeEditingWaybillRow = removeEditingWaybillRow;
window.updateEditingWaybillField = updateEditingWaybillField;
window.updateEditingWaybillCharged = updateEditingWaybillCharged;
window.updateEditingWaybillPaid = updateEditingWaybillPaid;
window.updateEditingWaybillPaymentMethod = updateEditingWaybillPaymentMethod;
window.toggleWaybillPaid = toggleWaybillPaid;
window.updateWaybillAmountPaid = updateWaybillAmountPaid;
window.updateWaybillPaymentMethod = updateWaybillPaymentMethod;
window.toggleWaybillReachedOut = toggleWaybillReachedOut;
window.toggleWaybillGoodsReceived = toggleWaybillGoodsReceived;

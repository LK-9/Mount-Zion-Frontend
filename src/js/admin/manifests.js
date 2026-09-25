// Staff Admin Manifests Viewer & Full-Screen Sheet Engine

let activeManifestId = null;

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

let staffManifestPeriodType = "all";
let staffManifestPeriodValue = "";

function renderStaffManifests() {
  const tbody = document.getElementById("manifests-table-body");
  if (!tbody) return;

  const searchInput = document.getElementById("manifests-search-input");
  const filterSelect = document.getElementById("manifests-status-filter");

  const term = (searchInput?.value || "").toLowerCase().trim();
  const filter = filterSelect?.value || "ALL";

  const allManifests = AppStore.getManifests();
  const allPeriods = AppStore.getAvailablePeriods(allManifests);

  if (
    staffManifestPeriodType === "day" &&
    !staffManifestPeriodValue &&
    allPeriods.days.length > 0
  ) {
    staffManifestPeriodValue = allPeriods.days[0].key;
  } else if (
    staffManifestPeriodType === "week" &&
    !staffManifestPeriodValue &&
    allPeriods.weeks.length > 0
  ) {
    staffManifestPeriodValue = allPeriods.weeks[0].key;
  } else if (
    staffManifestPeriodType === "month" &&
    !staffManifestPeriodValue &&
    allPeriods.months.length > 0
  ) {
    staffManifestPeriodValue = allPeriods.months[0].key;
  } else if (
    staffManifestPeriodType === "year" &&
    !staffManifestPeriodValue &&
    allPeriods.years.length > 0
  ) {
    staffManifestPeriodValue = allPeriods.years[0].key;
  }

  // Render Period Toolbar
  DateUtils.renderPeriodToolbar({
    containerId: "staff-manifests-period-toolbar",
    periodType: staffManifestPeriodType,
    periodValue: staffManifestPeriodValue,
    availablePeriods: allPeriods,
    countsSummary: `${AppStore.filterByPeriod(allManifests, staffManifestPeriodType, staffManifestPeriodValue).length} Dispatches`,
    onChange: (newType, newVal) => {
      staffManifestPeriodType = newType;
      staffManifestPeriodValue = newVal;
      renderStaffManifests();
    },
  });

  // Filter by period first
  let manifests = AppStore.filterByPeriod(
    allManifests,
    staffManifestPeriodType,
    staffManifestPeriodValue,
  );

  // Update badge count
  const badgeEl = document.getElementById("badge-manifests-count");
  if (badgeEl)
    badgeEl.textContent = allManifests.filter(
      (m) => m.status !== "Offloaded" && m.status !== "Offloaded & Closed",
    ).length;

  if (filter !== "ALL")
    manifests = manifests.filter((m) => m.status === filter);
  if (term) {
    manifests = manifests.filter(
      (m) =>
        (m.id && m.id.toLowerCase().includes(term)) ||
        (m.truckPlate && m.truckPlate.toLowerCase().includes(term)) ||
        (m.driverName && m.driverName.toLowerCase().includes(term)) ||
        (m.containerSize && m.containerSize.toLowerCase().includes(term)) ||
        (m.route && m.route.toLowerCase().includes(term)) ||
        (m.waybills &&
          m.waybills.some(
            (w) =>
              (w.receiverName && w.receiverName.toLowerCase().includes(term)) ||
              (w.receiverPhone &&
                w.receiverPhone.toLowerCase().includes(term)) ||
              (w.itemNameDescription &&
                w.itemNameDescription.toLowerCase().includes(term)) ||
              (w.destination && w.destination.toLowerCase().includes(term)) ||
              (w.id && w.id.toLowerCase().includes(term)),
          )),
    );
  }

  if (manifests.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="p-8 text-center text-muted-foreground text-xs">No manifests matching period & search filter.</td></tr>';
    return;
  }

  // Render with Date Group Headers
  if (staffManifestPeriodType === "all" || !staffManifestPeriodValue) {
    const groups = AppStore.groupItemsByPeriod(
      manifests,
      staffManifestPeriodType === "year" ? "month" : "day",
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
        const rows = g.items.map((m) => renderStaffManifestRow(m)).join("");
        return header + rows;
      })
      .join("");
  } else if (
    staffManifestPeriodType === "month" ||
    staffManifestPeriodType === "week"
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
        const rows = g.items.map((m) => renderStaffManifestRow(m)).join("");
        return header + rows;
      })
      .join("");
  } else {
    tbody.innerHTML = manifests.map((m) => renderStaffManifestRow(m)).join("");
  }
}

function renderStaffManifestRow(m) {
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
        <span class="text-muted-foreground block font-normal">${m.containerSize || "40-ft Container"}</span>
      </td>
      <td class="p-4 text-xs">
        <span class="font-semibold text-foreground">${m.driverName}</span>
        <span class="text-muted-foreground block text-[11px]">${m.driverPhone || "N/A"}</span>
      </td>
      <td class="p-4 text-xs font-semibold">
        ${totalWaybills} Waybills
        <span class="text-emerald-600 dark:text-emerald-400 block text-[11px]">Paid: ₦${totalPaid.toLocaleString()} / ₦${totalCharged.toLocaleString()}</span>
      </td>
      <td class="p-4">
        <span class="px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusClass(m.status)}">${m.status}</span>
      </td>
      <td class="p-4 text-right">
        <button type="button" onclick="openFullscreenManifest('${m.id}')" class="px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-semibold shadow-sm hover:opacity-95 transition-opacity cursor-pointer">
          View Sheet →
        </button>
      </td>
    </tr>
  `;
}

function openFullscreenManifest(id) {
  activeManifestId = id;
  const m = AppStore.getManifestById(id);
  if (!m) return;

  const sheet = document.getElementById("fullscreen-manifest-sheet");
  if (!sheet) return;

  const titleEl = document.getElementById("fs-manifest-title");
  if (titleEl) titleEl.textContent = `${m.id} — Loading & Delivery Manifest`;

  const statusBadge = document.getElementById("fs-manifest-status-badge");
  if (statusBadge) {
    statusBadge.textContent = m.status;
    statusBadge.className = `px-3 py-1 rounded-full text-xs font-bold border ${getStatusClass(m.status)}`;
  }

  // Render Heading Cards (Loading Date, Offloading Date, Truck Plate, Driver Name, Driver Phone)
  const headingGrid = document.getElementById("fs-manifest-heading-grid");
  if (headingGrid) {
    headingGrid.innerHTML = `
      <!-- Card 1: Truck & Container Schedule -->
      <div class="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3">
        <div class="flex items-center gap-2.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" x2="16" y1="2" y2="6"></line><line x1="8" x2="8" y1="2" y2="6"></line><line x1="3" x2="21" y1="10" y2="10"></line></svg>
          <span>Truck Schedule</span>
        </div>
        <div class="space-y-2 text-xs">
          <div class="flex justify-between py-1 border-b border-border/50">
            <span class="text-muted-foreground">Truck Loading Date:</span>
            <strong class="text-foreground font-semibold">${m.loadingDate || m.departureDate || "Today, 06:00 AM"}</strong>
          </div>
          <div class="flex justify-between py-1 border-b border-border/50">
            <span class="text-muted-foreground">Truck Offloading Date:</span>
            <strong class="text-foreground font-semibold">${m.offloadingDate || "Tomorrow, 03:00 PM (Est.)"}</strong>
          </div>
          <div class="flex justify-between py-1">
            <span class="text-muted-foreground">Transit Route:</span>
            <span class="text-foreground font-medium text-right">${m.route || "Lagos (Alaba) ↔ PHC (D-Line)"}</span>
          </div>
        </div>
      </div>

      <!-- Card 2: Vehicle & Container Specs -->
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
            <span class="text-foreground font-semibold">${m.containerSize || "40-ft Container"}</span>
          </div>
        </div>
      </div>

      <!-- Card 3: Assigned Driver Profile -->
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
              <span>📞 ${m.driverPhone || "N/A"}</span>
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
  const waybillCountEl = document.getElementById("fs-waybill-count");
  if (waybillCountEl) waybillCountEl.textContent = waybills.length;

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
        <!-- 1. Receiver Name -->
        <td class="p-4 align-top">
          <strong class="font-bold text-foreground text-sm block">${w.receiverName}</strong>
          <a href="tel:${w.receiverPhone}" class="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1 mt-0.5">
            📞 ${w.receiverPhone}
          </a>
          <span class="text-[11px] text-muted-foreground block mt-0.5 truncate max-w-xs">📍 ${w.destination || "Port Harcourt Depot"}</span>
        </td>

        <!-- 2. Item Quantity -->
        <td class="p-4 align-top">
          <span class="inline-block font-bold text-foreground bg-surface border border-border px-3 py-1 rounded-xl text-xs shadow-xs">
            ${w.itemQuantity}
          </span>
        </td>

        <!-- 3. Item Name & Description -->
        <td class="p-4 align-top">
          <p class="font-semibold text-foreground text-xs sm:text-sm leading-snug">${w.itemNameDescription}</p>
          <span class="text-[11px] text-muted-foreground font-mono mt-1 block">Waybill Ref: ${w.id}</span>
        </td>

        <!-- 4. Amount Charged -->
        <td class="p-4 align-top">
          <span class="font-extrabold text-foreground text-sm font-poppins">₦${charged.toLocaleString()}</span>
        </td>

        <!-- 5. Paid / Not Paid & Payment Amount Input & Balance & Payment Method -->
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

        <!-- 6. Reached Out Toggle -->
        <td class="p-4 align-top text-center">
          <button
            type="button"
            onclick="toggleWaybillReachedOut('${m.id}', '${w.id}')"
            class="px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${w.reachedOut ? "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700" : "bg-surface text-muted-foreground border border-border hover:bg-muted hover:text-foreground"}"
          >
            ${w.reachedOut ? "✓ Contacted" : "⏳ Pending Call"}
          </button>
        </td>

        <!-- 7. Goods Received Toggle -->
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

        <div class="p-4 rounded-2xl bg-card border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30">
          <span class="text-xs text-emerald-700 dark:text-emerald-300 block font-medium">Total Amount Paid</span>
          <strong class="text-xl sm:text-2xl font-extrabold font-poppins text-emerald-600 dark:text-emerald-400 mt-1 block">₦${totalPaid.toLocaleString()}</strong>
        </div>

        <div class="p-4 rounded-2xl bg-card border border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/30">
          <span class="text-xs text-red-700 dark:text-red-300 block font-medium">Total Balance Remaining</span>
          <strong class="text-xl sm:text-2xl font-extrabold font-poppins text-red-600 dark:text-red-400 mt-1 block">₦${totalBalance.toLocaleString()}</strong>
        </div>
      </div>
    </div>
  `;
}

// Interactive Toggle Handlers
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
    renderStaffManifests();
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
    renderStaffManifests();
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
    renderFullscreenWaybillsTable(updatedM);
    renderStaffManifests();
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
    renderStaffManifests();
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
    renderStaffManifests();
  }
}

function closeFullscreenSheet() {
  const sheet = document.getElementById("fullscreen-manifest-sheet");
  if (sheet) sheet.classList.add("hidden");
  document.body.style.overflow = "";
}

// Initializer
document.addEventListener("DOMContentLoaded", () => {
  // Update staff logged-in badge
  const activeStaff = AppStore.getActiveStaff();
  const staffNameEl = document.getElementById("logged-staff-name");
  if (staffNameEl && activeStaff) {
    const roleTag = activeStaff.role
      ? ` <span class="text-xs font-normal text-muted-foreground">(${activeStaff.role})</span>`
      : "";
    staffNameEl.innerHTML = `${activeStaff.name}${roleTag}`;
  }

  renderStaffManifests();

  document
    .getElementById("manifests-search-input")
    ?.addEventListener("input", renderStaffManifests);
  document
    .getElementById("manifests-status-filter")
    ?.addEventListener("change", renderStaffManifests);
  document
    .getElementById("btn-close-fullscreen-sheet")
    ?.addEventListener("click", closeFullscreenSheet);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeFullscreenSheet();
  });
});

window.openFullscreenManifest = openFullscreenManifest;
window.closeFullscreenSheet = closeFullscreenSheet;
window.toggleWaybillPaid = toggleWaybillPaid;
window.updateWaybillAmountPaid = updateWaybillAmountPaid;
window.updateWaybillPaymentMethod = updateWaybillPaymentMethod;
window.toggleWaybillReachedOut = toggleWaybillReachedOut;
window.toggleWaybillGoodsReceived = toggleWaybillGoodsReceived;

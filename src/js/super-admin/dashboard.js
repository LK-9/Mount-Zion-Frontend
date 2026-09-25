// Super Admin Executive Dashboard

let currentPeriodType = "day";
let currentPeriodValue = DateUtils.getDayKey(new Date());

function initSuperDashboard() {
  const allManifests = AppStore.getManifests();
  const allPeriods = AppStore.getAvailablePeriods(allManifests);

  // Default day to today if exists, or latest available day
  if (
    currentPeriodType === "day" &&
    !currentPeriodValue &&
    allPeriods.days.length > 0
  ) {
    const todayKey = DateUtils.getDayKey(new Date());
    const hasToday = (allPeriods.days || []).some((d) => d.key === todayKey);
    currentPeriodValue = hasToday ? todayKey : allPeriods.days[0].key;
  } else if (
    currentPeriodType === "week" &&
    !currentPeriodValue &&
    allPeriods.weeks.length > 0
  ) {
    const thisWeekKey = DateUtils.getWeekKey(new Date());
    const hasThisWeek = (allPeriods.weeks || []).some(
      (w) => w.key === thisWeekKey,
    );
    currentPeriodValue = hasThisWeek ? thisWeekKey : allPeriods.weeks[0].key;
  }

  // Sidebar badges
  const manifestBadge = document.getElementById("super-badge-manifests");
  if (manifestBadge) manifestBadge.textContent = allManifests.length;

  const driversBadge = document.getElementById("super-badge-drivers");
  if (driversBadge) {
    const totalDrivers =
      AppStore.getDrivers().length + AppStore.getPHCDrivers().length;
    driversBadge.textContent = totalDrivers;
  }

  const staffBadge = document.getElementById("super-badge-staff");
  if (staffBadge) {
    staffBadge.textContent = AppStore.getStaff().length;
  }

  updateSuperDashboard();
}

function getPeriodCountsSummary(manifests, periodType, periodValue) {
  const filtered = AppStore.filterByPeriod(manifests, periodType, periodValue);
  if (periodType === "day") {
    const label = periodValue
      ? DateUtils.formatDayFull(periodValue)
      : "All Days";
    return `${filtered.length} Dispatches • ${label}`;
  }
  if (periodType === "week") {
    const label = periodValue ? DateUtils.formatWeek(periodValue) : "All Weeks";
    return `${filtered.length} Dispatches • ${label}`;
  }
  if (periodType === "month") {
    const label = periodValue
      ? DateUtils.formatMonth(periodValue)
      : "All Months";
    return `${filtered.length} Dispatches • ${label}`;
  }
  if (periodType === "year") {
    const label = periodValue
      ? "Year " + DateUtils.formatYear(periodValue)
      : "All Years";
    return `${filtered.length} Dispatches • ${label}`;
  }
  return `${manifests.length} Total Dispatches`;
}

function updateSuperDashboard() {
  const allManifests = AppStore.getManifests();
  const allPeriods = AppStore.getAvailablePeriods(allManifests);

  // Re-render Period Toolbar so the active tab (Monthly, Yearly, Day, All) and dropdown stay in sync
  DateUtils.renderPeriodToolbar({
    containerId: "super-dash-period-toolbar",
    periodType: currentPeriodType,
    periodValue: currentPeriodValue,
    availablePeriods: allPeriods,
    countsSummary: getPeriodCountsSummary(
      allManifests,
      currentPeriodType,
      currentPeriodValue,
    ),
    onChange: (newType, newVal) => {
      currentPeriodType = newType;
      currentPeriodValue = newVal;
      updateSuperDashboard();
    },
  });

  // Period Metrics
  const metrics = AppStore.getFinancialMetrics(
    currentPeriodType,
    currentPeriodValue,
  );
  const thisMonthMetrics = AppStore.getFinancialMetrics(
    "month",
    DateUtils.getMonthKey(new Date()),
  );

  // 1. Live Header Badge
  const liveText = document.getElementById("super-dash-live-text");
  if (liveText) {
    if (currentPeriodType === "day") {
      liveText.textContent = `${currentPeriodValue ? DateUtils.formatDay(currentPeriodValue) : "All Days"}: ₦${metrics.totalPaid.toLocaleString()}`;
    } else if (currentPeriodType === "week") {
      liveText.textContent = `${currentPeriodValue ? DateUtils.formatWeekShort(currentPeriodValue) : "All Weeks"}: ₦${metrics.totalPaid.toLocaleString()}`;
    } else if (currentPeriodType === "month") {
      liveText.textContent = `${currentPeriodValue ? DateUtils.formatMonth(currentPeriodValue) : "All Months"}: ₦${metrics.totalPaid.toLocaleString()}`;
    } else if (currentPeriodType === "year") {
      liveText.textContent = `${currentPeriodValue ? "Year " + currentPeriodValue : "All Years"}: ₦${metrics.totalPaid.toLocaleString()}`;
    } else {
      liveText.textContent = `All-Time Invoiced: ₦${metrics.totalBilling.toLocaleString()}`;
    }
  }

  // 2. KPI Card 1 (Period Revenue)
  const kpiTitle = document.getElementById("kpi-dash-period-title");
  const kpiTag = document.getElementById("kpi-dash-period-tag");
  const kpiRev = document.getElementById("kpi-dash-period-rev");
  const kpiSub = document.getElementById("kpi-dash-period-sub");

  if (kpiTitle) {
    kpiTitle.textContent =
      currentPeriodType === "day"
        ? "💰 DAY REVENUE"
        : currentPeriodType === "week"
          ? "💰 WEEK REVENUE"
          : currentPeriodType === "month"
            ? "💰 MONTH REVENUE"
            : currentPeriodType === "year"
              ? "💰 ANNUAL REVENUE"
              : "💰 TOTAL REVENUE";
  }
  if (kpiTag) {
    kpiTag.textContent =
      currentPeriodType === "day" && DateUtils.isToday(currentPeriodValue)
        ? "Today"
        : currentPeriodType === "week" &&
            DateUtils.isThisWeek(currentPeriodValue)
          ? "This Week"
          : `${metrics.totalWaybills} Waybills`;
  }
  if (kpiRev) {
    kpiRev.textContent = `₦${metrics.totalPaid.toLocaleString()}`;
  }
  if (kpiSub) {
    kpiSub.textContent = `${metrics.totalWaybills} waybills across ${metrics.totalManifests} trailer manifests`;
  }

  // 3. KPI Card 2 (Monthly Revenue)
  const kpiMonthRev = document.getElementById("kpi-dash-month-rev");
  const kpiMonthSub = document.getElementById("kpi-dash-month-sub");
  if (kpiMonthRev) {
    kpiMonthRev.textContent = `₦${thisMonthMetrics.totalPaid.toLocaleString()}`;
  }
  if (kpiMonthSub) {
    kpiMonthSub.textContent = `${thisMonthMetrics.totalManifests} container dispatches in ${DateUtils.formatMonth(new Date())}`;
  }

  // 4. KPI Card 3 (Active Manifests in Period)
  const manifestCountEl = document.getElementById("super-dash-manifests");
  const manifestTagEl = document.getElementById("super-dash-manifest-tag");
  const periodManifests = AppStore.filterByPeriod(
    allManifests,
    currentPeriodType,
    currentPeriodValue,
  );
  const activeCount = periodManifests.filter(
    (m) => m.status !== "Offloaded" && m.status !== "Offloaded & Closed",
  ).length;

  if (manifestCountEl) manifestCountEl.textContent = periodManifests.length;
  if (manifestTagEl) {
    manifestTagEl.textContent = `${activeCount} Active / In Transit`;
  }

  // 5. KPI Card 4 (Unpaid Balances in Period)
  const unpaidEl = document.getElementById("kpi-dash-unpaid");
  const unpaidTagEl = document.getElementById("super-dash-unpaid-tag");
  if (unpaidEl) {
    unpaidEl.textContent = `₦${metrics.totalBalance.toLocaleString()}`;
  }
  if (unpaidTagEl) {
    unpaidTagEl.textContent =
      metrics.totalBalance > 0 ? "Pending Collection" : "Fully Settled";
  }

  // Render Roll-up Breakdown Section
  renderRollupBreakdown(periodManifests, currentPeriodType, currentPeriodValue);
}

function renderRollupBreakdown(manifests, periodType, periodValue) {
  const titleEl = document.getElementById("super-dash-rollup-title");
  const subtitleEl = document.getElementById("super-dash-rollup-subtitle");
  const badgeEl = document.getElementById("super-dash-rollup-badge");
  const thead = document.getElementById("super-dash-rollup-thead");
  const tbody = document.getElementById("super-dash-rollup-tbody");

  if (!thead || !tbody) return;

  if (periodType === "week") {
    const isSpecificWeek = Boolean(periodValue);
    const weekLabel = isSpecificWeek
      ? DateUtils.formatWeek(periodValue)
      : "All Weeks";
    if (titleEl)
      titleEl.textContent = isSpecificWeek
        ? `📆 Weekly: Day-by-Day Audit (${weekLabel})`
        : `📆 Weekly: All Weeks Consolidated Breakdown`;
    if (subtitleEl)
      subtitleEl.textContent = isSpecificWeek
        ? `Daily dispatches, collections, and net profit margins for ${weekLabel}.`
        : `Consolidated weekly dispatches, collected revenue, and estimated margin.`;
    if (badgeEl) badgeEl.textContent = `Weekly Audit`;

    thead.innerHTML = `
      <tr>
        <th class="p-4 font-semibold">${isSpecificWeek ? "Dispatch Day" : "Operating Week"}</th>
        <th class="p-4 font-semibold">Trailers Dispatched</th>
        <th class="p-4 font-semibold">Waybills Loaded</th>
        <th class="p-4 font-semibold">Total Invoiced</th>
        <th class="p-4 font-semibold">Revenue Collected</th>
        <th class="p-4 font-semibold">Pending Balance</th>
        <th class="p-4 font-semibold text-right">Net Margin</th>
      </tr>
    `;

    const groups = AppStore.groupItemsByPeriod(
      manifests,
      isSpecificWeek ? "day" : "week",
    );
    if (groups.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-muted-foreground text-xs">No dispatches found for ${weekLabel}.</td></tr>`;
      return;
    }

    let sumBilling = 0;
    let sumPaid = 0;
    let sumBalance = 0;
    let sumWaybills = 0;

    const rowsHtml = groups
      .map((g) => {
        let groupBilling = 0;
        let groupPaid = 0;
        let groupWaybills = 0;

        g.items.forEach((m) => {
          (m.waybills || []).forEach((w) => {
            groupBilling += Number(w.amountCharged) || 0;
            groupPaid += Number(w.amountPaid) || 0;
            groupWaybills += 1;
          });
        });

        const groupBalance = Math.max(0, groupBilling - groupPaid);
        const estMargin =
          groupPaid > 0
            ? (((groupPaid - groupPaid * 0.45) / groupPaid) * 100).toFixed(0)
            : "0";

        sumBilling += groupBilling;
        sumPaid += groupPaid;
        sumBalance += groupBalance;
        sumWaybills += groupWaybills;

        return `
        <tr class="hover:bg-surface/50 transition-colors">
          <td class="p-4 font-bold text-foreground text-xs">
            ${isSpecificWeek ? g.title : "📆 " + g.title}
          </td>
          <td class="p-4 text-xs font-semibold text-foreground">
            ${g.items.length} ${g.items.length === 1 ? "Trailer" : "Trailers"}
            <span class="text-muted-foreground block font-normal text-[11px]">${g.items.map((m) => m.truckPlate).join(", ")}</span>
          </td>
          <td class="p-4 text-xs font-semibold text-foreground">${groupWaybills} Waybills</td>
          <td class="p-4 text-xs font-bold text-foreground">₦${groupBilling.toLocaleString()}</td>
          <td class="p-4 text-xs font-bold text-emerald-600 dark:text-emerald-400">₦${groupPaid.toLocaleString()}</td>
          <td class="p-4 text-xs font-semibold ${groupBalance > 0 ? "text-red-600 dark:text-red-400 font-bold" : "text-muted-foreground"}">₦${groupBalance.toLocaleString()}</td>
          <td class="p-4 text-right">
            <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">~${estMargin}%</span>
          </td>
        </tr>
      `;
      })
      .join("");

    const footerHtml = `
      <tr class="bg-surface font-bold text-xs border-t-2 border-border">
        <td class="p-4 text-foreground">${isSpecificWeek ? "WEEK TOTAL" : "GRAND TOTAL"}</td>
        <td class="p-4 text-foreground">${manifests.length} Trailers</td>
        <td class="p-4 text-foreground">${sumWaybills} Waybills</td>
        <td class="p-4 text-foreground">₦${sumBilling.toLocaleString()}</td>
        <td class="p-4 text-emerald-600 dark:text-emerald-400">₦${sumPaid.toLocaleString()}</td>
        <td class="p-4 ${sumBalance > 0 ? "text-red-600 dark:text-red-400" : "text-foreground"}">₦${sumBalance.toLocaleString()}</td>
        <td class="p-4 text-right text-emerald-600 dark:text-emerald-400 font-extrabold">~55% Margin</td>
      </tr>
    `;

    tbody.innerHTML = rowsHtml + footerHtml;
  } else if (periodType === "month") {
    const isSpecificMonth = Boolean(periodValue);
    const monthLabel = isSpecificMonth
      ? DateUtils.formatMonth(periodValue)
      : "All Months";
    if (titleEl)
      titleEl.textContent = isSpecificMonth
        ? `🗓️ Monthly: Day-by-Day Audit (${monthLabel})`
        : `🗓️ Monthly: All Months Consolidated Breakdown`;
    if (subtitleEl)
      subtitleEl.textContent = isSpecificMonth
        ? `Daily dispatches, collections, and net profit margins for ${monthLabel}.`
        : `Consolidated calendar month dispatches, collected revenue, and estimated margin.`;
    if (badgeEl) badgeEl.textContent = `Monthly Audit`;

    thead.innerHTML = `
      <tr>
        <th class="p-4 font-semibold">${isSpecificMonth ? "Dispatch Day" : "Calendar Month"}</th>
        <th class="p-4 font-semibold">Trailers Dispatched</th>
        <th class="p-4 font-semibold">Waybills Loaded</th>
        <th class="p-4 font-semibold">Total Invoiced</th>
        <th class="p-4 font-semibold">Revenue Collected</th>
        <th class="p-4 font-semibold">Pending Balance</th>
        <th class="p-4 font-semibold text-right">Net Margin</th>
      </tr>
    `;

    const groups = AppStore.groupItemsByPeriod(
      manifests,
      isSpecificMonth ? "day" : "month",
    );
    if (groups.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-muted-foreground text-xs">No dispatches found for ${monthLabel}.</td></tr>`;
      return;
    }

    let sumBilling = 0;
    let sumPaid = 0;
    let sumBalance = 0;
    let sumWaybills = 0;

    const rowsHtml = groups
      .map((g) => {
        let groupBilling = 0;
        let groupPaid = 0;
        let groupWaybills = 0;

        g.items.forEach((m) => {
          (m.waybills || []).forEach((w) => {
            groupBilling += Number(w.amountCharged) || 0;
            groupPaid += Number(w.amountPaid) || 0;
            groupWaybills += 1;
          });
        });

        const groupBalance = Math.max(0, groupBilling - groupPaid);
        const estMargin =
          groupPaid > 0
            ? (((groupPaid - groupPaid * 0.45) / groupPaid) * 100).toFixed(0)
            : "0";

        sumBilling += groupBilling;
        sumPaid += groupPaid;
        sumBalance += groupBalance;
        sumWaybills += groupWaybills;

        return `
        <tr class="hover:bg-surface/50 transition-colors">
          <td class="p-4 font-bold text-foreground text-xs">
            ${isSpecificMonth ? g.title : "🗓️ " + g.title}
          </td>
          <td class="p-4 text-xs font-semibold text-foreground">
            ${g.items.length} ${g.items.length === 1 ? "Trailer" : "Trailers"}
            <span class="text-muted-foreground block font-normal text-[11px]">${g.items.map((m) => m.truckPlate).join(", ")}</span>
          </td>
          <td class="p-4 text-xs font-semibold text-foreground">${groupWaybills} Waybills</td>
          <td class="p-4 text-xs font-bold text-foreground">₦${groupBilling.toLocaleString()}</td>
          <td class="p-4 text-xs font-bold text-emerald-600 dark:text-emerald-400">₦${groupPaid.toLocaleString()}</td>
          <td class="p-4 text-xs font-semibold ${groupBalance > 0 ? "text-red-600 dark:text-red-400 font-bold" : "text-muted-foreground"}">₦${groupBalance.toLocaleString()}</td>
          <td class="p-4 text-right">
            <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">~${estMargin}%</span>
          </td>
        </tr>
      `;
      })
      .join("");

    const footerHtml = `
      <tr class="bg-surface font-bold text-xs border-t-2 border-border">
        <td class="p-4 text-foreground">${isSpecificMonth ? "MONTH TOTAL" : "GRAND TOTAL"}</td>
        <td class="p-4 text-foreground">${manifests.length} Trailers</td>
        <td class="p-4 text-foreground">${sumWaybills} Waybills</td>
        <td class="p-4 text-foreground">₦${sumBilling.toLocaleString()}</td>
        <td class="p-4 text-emerald-600 dark:text-emerald-400">₦${sumPaid.toLocaleString()}</td>
        <td class="p-4 ${sumBalance > 0 ? "text-red-600 dark:text-red-400" : "text-foreground"}">₦${sumBalance.toLocaleString()}</td>
        <td class="p-4 text-right text-emerald-600 dark:text-emerald-400 font-extrabold">~55% Margin</td>
      </tr>
    `;

    tbody.innerHTML = rowsHtml + footerHtml;
  } else if (periodType === "year") {
    const isSpecificYear = Boolean(periodValue);
    const yearLabel = isSpecificYear
      ? "Year " + DateUtils.formatYear(periodValue)
      : "All Years";
    if (titleEl)
      titleEl.textContent = isSpecificYear
        ? `📊 Yearly: Month-by-Month Roll-up (${yearLabel})`
        : `📊 Yearly: Multi-Year Consolidated Ledger`;
    if (subtitleEl)
      subtitleEl.textContent = isSpecificYear
        ? `Consolidated monthly capacity, billing volume, and profit breakdown for ${yearLabel}.`
        : `Consolidated annual capacity, billing volume, and operating margin across all years.`;
    if (badgeEl) badgeEl.textContent = `Annual Audit`;

    thead.innerHTML = `
      <tr>
        <th class="p-4 font-semibold">${isSpecificYear ? "Calendar Month" : "Operating Year"}</th>
        <th class="p-4 font-semibold">Trailers Dispatched</th>
        <th class="p-4 font-semibold">Total Waybills</th>
        <th class="p-4 font-semibold">Gross Billing</th>
        <th class="p-4 font-semibold">Collected Revenue</th>
        <th class="p-4 font-semibold">Est. Expenses & Tolls</th>
        <th class="p-4 font-semibold text-right">Net Operating Profit</th>
      </tr>
    `;

    const groups = AppStore.groupItemsByPeriod(
      manifests,
      isSpecificYear ? "month" : "year",
    );
    if (groups.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-muted-foreground text-xs">No dispatches found for ${yearLabel}.</td></tr>`;
      return;
    }

    let sumBilling = 0;
    let sumPaid = 0;
    let sumExpenses = 0;
    let sumProfit = 0;
    let sumWaybills = 0;

    const rowsHtml = groups
      .map((g) => {
        let groupBilling = 0;
        let groupPaid = 0;
        let groupWaybills = 0;

        g.items.forEach((m) => {
          (m.waybills || []).forEach((w) => {
            groupBilling += Number(w.amountCharged) || 0;
            groupPaid += Number(w.amountPaid) || 0;
            groupWaybills += 1;
          });
        });

        const expenses = Math.round(groupPaid * 0.45);
        const profit = Math.max(0, groupPaid - expenses);

        sumBilling += groupBilling;
        sumPaid += groupPaid;
        sumExpenses += expenses;
        sumProfit += profit;
        sumWaybills += groupWaybills;

        return `
        <tr class="hover:bg-surface/50 transition-colors">
          <td class="p-4 font-bold text-foreground text-xs">
            ${isSpecificYear ? "🗓️ " + g.title : "📊 " + g.title}
          </td>
          <td class="p-4 text-xs font-semibold text-foreground">${g.items.length} Dispatches</td>
          <td class="p-4 text-xs font-semibold text-foreground">${groupWaybills} Waybills</td>
          <td class="p-4 text-xs font-bold text-foreground">₦${groupBilling.toLocaleString()}</td>
          <td class="p-4 text-xs font-bold text-emerald-600 dark:text-emerald-400">₦${groupPaid.toLocaleString()}</td>
          <td class="p-4 text-xs text-muted-foreground">₦${expenses.toLocaleString()}</td>
          <td class="p-4 text-right font-extrabold text-xs text-emerald-600 dark:text-emerald-400">
            ₦${profit.toLocaleString()}
          </td>
        </tr>
      `;
      })
      .join("");

    const footerHtml = `
      <tr class="bg-surface font-bold text-xs border-t-2 border-border">
        <td class="p-4 text-foreground">${isSpecificYear ? "YEAR TOTAL" : "ALL YEARS TOTAL"}</td>
        <td class="p-4 text-foreground">${manifests.length} Dispatches</td>
        <td class="p-4 text-foreground">${sumWaybills} Waybills</td>
        <td class="p-4 text-foreground">₦${sumBilling.toLocaleString()}</td>
        <td class="p-4 text-emerald-600 dark:text-emerald-400">₦${sumPaid.toLocaleString()}</td>
        <td class="p-4 text-muted-foreground">₦${sumExpenses.toLocaleString()}</td>
        <td class="p-4 text-right text-emerald-600 dark:text-emerald-400 font-extrabold">₦${sumProfit.toLocaleString()}</td>
      </tr>
    `;

    tbody.innerHTML = rowsHtml + footerHtml;
  } else {
    // Day-to-Day or All
    const dayLabel = periodValue
      ? DateUtils.formatDayFull(periodValue)
      : "All Day-to-Day Dispatches";
    if (titleEl) titleEl.textContent = `📅 Day-to-Day Dispatches (${dayLabel})`;
    if (subtitleEl)
      subtitleEl.textContent = `Container manifests, assigned drivers, and waybill collection status.`;
    if (badgeEl) badgeEl.textContent = `Daily Breakdown`;

    thead.innerHTML = `
      <tr>
        <th class="p-4 font-semibold">Manifest ID</th>
        <th class="p-4 font-semibold">Truck & Trailer Size</th>
        <th class="p-4 font-semibold">Assigned Driver</th>
        <th class="p-4 font-semibold">Loading Date</th>
        <th class="p-4 font-semibold">Consignments Loaded</th>
        <th class="p-4 font-semibold">Status</th>
        <th class="p-4 font-semibold text-right">Collections</th>
      </tr>
    `;

    if (manifests.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-muted-foreground text-xs">No dispatches found for ${dayLabel}.</td></tr>`;
      return;
    }

    // If "all" or multiple days, render with date group headers
    if (!periodValue || periodType === "all") {
      const groups = AppStore.groupItemsByPeriod(manifests, "day");
      tbody.innerHTML = groups
        .map((g) => {
          const header = DateUtils.renderDateGroupHeader(g, 7);
          const rows = g.items.map((m) => renderManifestRow(m)).join("");
          return header + rows;
        })
        .join("");
    } else {
      tbody.innerHTML = manifests.map((m) => renderManifestRow(m)).join("");
    }
  }
}

function renderManifestRow(m) {
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
      <td class="p-4 font-bold text-foreground text-xs">
        <a href="super-admin-manifests.html" class="text-primary hover:underline font-mono">${m.id}</a>
      </td>
      <td class="p-4 text-xs font-bold text-foreground">
        ${m.truckPlate}
        <span class="text-muted-foreground block font-normal text-[11px]">${m.containerSize || "40-ft Container"}</span>
      </td>
      <td class="p-4 text-xs">
        <span class="font-semibold text-foreground">${m.driverName}</span>
        <span class="text-muted-foreground block text-[11px]">${m.driverPhone || "N/A"}</span>
      </td>
      <td class="p-4 text-xs font-medium text-muted-foreground">
        ${m.loadingDate || m.departureDate || "06:00 AM"}
      </td>
      <td class="p-4 text-xs font-semibold text-foreground">
        ${totalWaybills} Waybills
      </td>
      <td class="p-4">
        <span class="px-2.5 py-0.5 rounded-full text-xs font-bold ${
          m.status === "Offloaded"
            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
            : m.status === "In Transit"
              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
              : m.status === "Offloading"
                ? "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300"
                : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
        }">${m.status}</span>
      </td>
      <td class="p-4 text-right text-xs font-bold text-emerald-600 dark:text-emerald-400">
        ₦${totalPaid.toLocaleString()}
        <span class="text-muted-foreground block font-normal text-[10px]">of ₦${totalCharged.toLocaleString()}</span>
      </td>
    </tr>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  initSuperDashboard();
});

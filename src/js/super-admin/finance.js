// Super Admin Finance & Payments Engine

let financePeriodType = "month";
let financePeriodValue = DateUtils.getMonthKey(new Date());

function initSuperFinance() {
  renderSuperFinance();
  setupFinanceFilters();
}

function renderSuperFinance() {
  const allFinance = AppStore.getFinance();
  const allPeriods = AppStore.getAvailablePeriods(allFinance);
  if (
    financePeriodType === "day" &&
    !financePeriodValue &&
    allPeriods.days.length > 0
  ) {
    financePeriodValue = allPeriods.days[0].key;
  } else if (
    financePeriodType === "week" &&
    !financePeriodValue &&
    allPeriods.weeks.length > 0
  ) {
    financePeriodValue = allPeriods.weeks[0].key;
  } else if (
    financePeriodType === "month" &&
    !financePeriodValue &&
    allPeriods.months.length > 0
  ) {
    financePeriodValue = allPeriods.months[0].key;
  } else if (
    financePeriodType === "year" &&
    !financePeriodValue &&
    allPeriods.years.length > 0
  ) {
    financePeriodValue = allPeriods.years[0].key;
  }

  const filteredTxs = AppStore.filterByPeriod(
    allFinance,
    financePeriodType,
    financePeriodValue,
  );
  const metrics = AppStore.getFinancialMetrics(
    financePeriodType,
    financePeriodValue,
  );

  // Render Period Toolbar
  DateUtils.renderPeriodToolbar({
    containerId: "finance-period-toolbar",
    periodType: financePeriodType,
    periodValue: financePeriodValue,
    availablePeriods: allPeriods,
    countsSummary: `${filteredTxs.length} Transactions`,
    onChange: (newType, newVal) => {
      financePeriodType = newType;
      financePeriodValue = newVal;
      renderSuperFinance();
    },
  });

  // Update Summary KPI Cards
  const billEl =
    document.getElementById("fin-kpi-billing") ||
    document.getElementById("stat-finance-billing");
  const paidEl =
    document.getElementById("fin-kpi-paid") ||
    document.getElementById("stat-finance-paid");
  const expEl =
    document.getElementById("fin-kpi-expenses") ||
    document.getElementById("stat-finance-expenses");
  const tollsEl =
    document.getElementById("fin-kpi-tolls") ||
    document.getElementById("stat-finance-tolls");
  const profitEl =
    document.getElementById("fin-kpi-profit") ||
    document.getElementById("stat-finance-profit");
  const marginEl =
    document.getElementById("fin-kpi-margin") ||
    document.getElementById("stat-finance-margin");
  const headingEl = document.getElementById("finance-table-heading");

  if (billEl) billEl.textContent = `₦${metrics.totalBilling.toLocaleString()}`;
  if (paidEl)
    paidEl.textContent = `Paid: ₦${metrics.totalPaid.toLocaleString()}`;
  if (expEl)
    expEl.textContent = `₦${metrics.estimatedExpenses.toLocaleString()}`;
  if (tollsEl) {
    tollsEl.textContent = `${metrics.totalManifests} trailers • ${metrics.totalWaybills} waybills`;
  }
  if (profitEl) profitEl.textContent = `₦${metrics.netProfit.toLocaleString()}`;
  if (marginEl) marginEl.textContent = `Margin: ~${metrics.profitMargin}%`;

  if (headingEl) {
    let label = "All Customer Payment Transactions";
    if (financePeriodType === "day") {
      label = financePeriodValue
        ? `📅 Transactions on ${DateUtils.formatDayFull(financePeriodValue)}`
        : "📅 All Day-by-Day Transactions";
    } else if (financePeriodType === "week") {
      label = financePeriodValue
        ? `📆 Weekly: ${DateUtils.formatWeek(financePeriodValue)}`
        : "📆 All Weekly Transactions";
    } else if (financePeriodType === "month") {
      label = financePeriodValue
        ? `🗓️ Monthly: ${DateUtils.formatMonth(financePeriodValue)}`
        : "🗓️ All Monthly Transactions";
    } else if (financePeriodType === "year") {
      label = financePeriodValue
        ? `📊 Yearly: Year ${DateUtils.formatYear(financePeriodValue)}`
        : "📊 All Yearly Transactions";
    }
    headingEl.textContent = label;
  }

  const tbody = document.getElementById("finance-transactions-table");
  if (!tbody) return;

  if (filteredTxs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-muted-foreground text-xs">No payment transactions found for this period.</td></tr>`;
    return;
  }

  // Render Table with Date Group Headers
  if (financePeriodType === "all" || !financePeriodValue) {
    const groups = AppStore.groupItemsByPeriod(
      filteredTxs,
      financePeriodType === "year" ? "month" : "day",
    );
    tbody.innerHTML = groups
      .map((g) => {
        const subtotal = g.items.reduce((acc, t) => {
          const amt =
            typeof t.amount === "number"
              ? t.amount
              : parseInt(String(t.amount || 0).replace(/[^0-9]/g, ""), 10) || 0;
          return acc + amt;
        }, 0);
        const header = DateUtils.renderDateGroupHeader(
          g,
          6,
          `Subtotal: ₦${subtotal.toLocaleString()}`,
        );
        const rows = g.items.map((t) => renderTransactionRow(t)).join("");
        return header + rows;
      })
      .join("");
  } else if (financePeriodType === "month" || financePeriodType === "week") {
    // Within month or week, group by day
    const groups = AppStore.groupItemsByPeriod(filteredTxs, "day");
    tbody.innerHTML = groups
      .map((g) => {
        const subtotal = g.items.reduce((acc, t) => {
          const amt =
            typeof t.amount === "number"
              ? t.amount
              : parseInt(String(t.amount || 0).replace(/[^0-9]/g, ""), 10) || 0;
          return acc + amt;
        }, 0);
        const header = DateUtils.renderDateGroupHeader(
          g,
          6,
          `Daily Total: ₦${subtotal.toLocaleString()}`,
        );
        const rows = g.items.map((t) => renderTransactionRow(t)).join("");
        return header + rows;
      })
      .join("");
  } else {
    // Single Day or Year
    tbody.innerHTML = filteredTxs.map((t) => renderTransactionRow(t)).join("");
  }
}

function getFinanceCountsSummary(allTxs, periodType, periodValue) {
  const filtered = AppStore.filterByPeriod(allTxs, periodType, periodValue);
  const totalAmt = filtered.reduce((acc, t) => {
    const amt =
      typeof t.amount === "number"
        ? t.amount
        : parseInt(String(t.amount || 0).replace(/[^0-9]/g, ""), 10) || 0;
    return acc + amt;
  }, 0);

  return `${filtered.length} Txs • ₦${totalAmt.toLocaleString()}`;
}

function renderTransactionRow(t) {
  const amtNum =
    typeof t.amount === "number"
      ? t.amount
      : parseInt(String(t.amount || 0).replace(/[^0-9]/g, ""), 10) || 0;
  const isPos = t.method === "POS Terminal";

  return `
    <tr class="hover:bg-surface/50 transition-colors">
      <td class="p-4 font-bold text-foreground text-xs">
        <span class="font-mono text-sm">${t.id}</span>
        <span class="text-muted-foreground block font-normal text-[11px]">Waybill: <strong class="text-foreground">${t.waybillId}</strong></span>
      </td>
      <td class="p-4 text-xs font-semibold text-foreground">
        ${t.customer}
        <span class="text-muted-foreground block font-normal text-[11px]">${t.date}</span>
      </td>
      <td class="p-4 text-xs">
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-surface font-medium text-[11px]">
          ${isPos ? "💳 POS Terminal" : "🏦 Bank Transfer"}
        </span>
      </td>
      <td class="p-4 text-xs font-bold text-foreground">
        ₦${amtNum.toLocaleString()}
      </td>
      <td class="p-4">
        <span class="px-2.5 py-0.5 rounded-full text-xs font-bold ${
          t.status === "Paid"
            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
        }">${t.status}</span>
      </td>
      <td class="p-4 text-right">
        <button type="button" onclick="alert('Printing Official Invoice Receipt for ' + '${t.customer}' + ' (₦' + '${amtNum.toLocaleString()}' + ')')" class="px-2.5 py-1 rounded-lg border border-border text-xs font-semibold hover:bg-surface cursor-pointer shadow-xs">Print Receipt</button>
      </td>
    </tr>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  renderSuperFinance();

  document
    .getElementById("btn-open-record-payment")
    ?.addEventListener("click", () => {
      document
        .getElementById("modal-record-payment")
        ?.classList.remove("hidden");
    });

  document
    .getElementById("form-record-payment")
    ?.addEventListener("submit", (e) => {
      e.preventDefault();
      const waybillId = document
        .getElementById("payment-input-waybill")
        .value.trim();
      const customer = document
        .getElementById("payment-input-customer")
        .value.trim();
      const amountVal = document
        .getElementById("payment-input-amount")
        .value.trim();
      const method = document.getElementById("payment-input-method").value;

      const current = AppStore.getFinance();
      const rawAmt = parseInt(amountVal.replace(/[^0-9]/g, ""), 10) || 0;
      const now = new Date();

      const newTx = {
        id: "TX-" + Math.floor(100 + Math.random() * 900),
        waybillId,
        customer,
        method: method.includes("Cash") ? "POS Terminal" : method,
        amount: rawAmt,
        status: "Paid",
        date:
          "Today, " +
          now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isoDate: now.toISOString(),
      };

      AppStore.saveFinance([newTx, ...current]);
      AppStore.logAudit(
        "Recorded customer payment ₦" + rawAmt.toLocaleString(),
        waybillId,
      );
      document.getElementById("form-record-payment").reset();
      document.getElementById("modal-record-payment")?.classList.add("hidden");
      renderSuperFinance();
    });

  document.querySelectorAll(".btn-close-modal").forEach((b) =>
    b.addEventListener("click", () => {
      document
        .querySelectorAll('[id^="modal-"]')
        .forEach((m) => m.classList.add("hidden"));
    }),
  );
});

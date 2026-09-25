// Staff Admin Quotes Manager

let staffQuotesPeriodType = "all";
let staffQuotesPeriodValue = "";

function renderStaffQuotes() {
  const tbody = document.getElementById("quotes-table-body");
  if (!tbody) return;

  const searchInput = document.getElementById("quotes-search-input");
  const filterSelect = document.getElementById("quotes-status-filter");

  const term = (searchInput?.value || "").toLowerCase().trim();
  const filter = filterSelect?.value || "ALL";

  const allQuotes = AppStore.getQuotes();
  const allPeriods = AppStore.getAvailablePeriods(allQuotes);

  if (
    staffQuotesPeriodType === "day" &&
    !staffQuotesPeriodValue &&
    allPeriods.days.length > 0
  ) {
    staffQuotesPeriodValue = allPeriods.days[0].key;
  } else if (
    staffQuotesPeriodType === "week" &&
    !staffQuotesPeriodValue &&
    allPeriods.weeks.length > 0
  ) {
    staffQuotesPeriodValue = allPeriods.weeks[0].key;
  } else if (
    staffQuotesPeriodType === "month" &&
    !staffQuotesPeriodValue &&
    allPeriods.months.length > 0
  ) {
    staffQuotesPeriodValue = allPeriods.months[0].key;
  } else if (
    staffQuotesPeriodType === "year" &&
    !staffQuotesPeriodValue &&
    allPeriods.years.length > 0
  ) {
    staffQuotesPeriodValue = allPeriods.years[0].key;
  }

  // Render Period Toolbar
  DateUtils.renderPeriodToolbar({
    containerId: "staff-quotes-period-toolbar",
    periodType: staffQuotesPeriodType,
    periodValue: staffQuotesPeriodValue,
    availablePeriods: allPeriods,
    countsSummary: `${AppStore.filterByPeriod(allQuotes, staffQuotesPeriodType, staffQuotesPeriodValue).length} Quote Requests`,
    onChange: (newType, newVal) => {
      staffQuotesPeriodType = newType;
      staffQuotesPeriodValue = newVal;
      renderStaffQuotes();
    },
  });

  let quotes = AppStore.filterByPeriod(
    allQuotes,
    staffQuotesPeriodType,
    staffQuotesPeriodValue,
  );

  if (filter !== "ALL") quotes = quotes.filter((q) => q.status === filter);
  if (term) {
    quotes = quotes.filter(
      (q) =>
        (q.name && q.name.toLowerCase().includes(term)) ||
        (q.phone && q.phone.toLowerCase().includes(term)) ||
        (q.cargo && q.cargo.toLowerCase().includes(term)) ||
        (q.notes && q.notes.toLowerCase().includes(term)),
    );
  }

  if (quotes.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="5" class="p-8 text-center text-muted-foreground text-xs">No quote requests matching period & search filter.</td></tr>';
    return;
  }

  // Render with Date Group Headers
  if (staffQuotesPeriodType === "all" || !staffQuotesPeriodValue) {
    const groups = AppStore.groupItemsByPeriod(
      quotes,
      staffQuotesPeriodType === "year" ? "month" : "day",
    );
    tbody.innerHTML = groups
      .map((g) => {
        const header = DateUtils.renderDateGroupHeader(g, 5);
        const rows = g.items.map((q) => renderQuoteRow(q)).join("");
        return header + rows;
      })
      .join("");
  } else if (
    staffQuotesPeriodType === "month" ||
    staffQuotesPeriodType === "week"
  ) {
    const groups = AppStore.groupItemsByPeriod(quotes, "day");
    tbody.innerHTML = groups
      .map((g) => {
        const header = DateUtils.renderDateGroupHeader(g, 5);
        const rows = g.items.map((q) => renderQuoteRow(q)).join("");
        return header + rows;
      })
      .join("");
  } else {
    tbody.innerHTML = quotes.map((q) => renderQuoteRow(q)).join("");
  }
}

function renderQuoteRow(q) {
  const d = AppStore.getItemDate(q);
  const formattedDate = DateUtils.formatDay(d);

  return `
    <tr class="hover:bg-surface/50 transition-colors">
      <td class="p-4 font-bold text-foreground text-xs">
        ${q.name}
        <span class="text-xs text-muted-foreground block font-normal">${q.phone}</span>
      </td>
      <td class="p-4 text-xs font-semibold text-foreground">
        ${q.cargo}
        <span class="text-muted-foreground block font-normal text-[11px]">${q.pickup || "Alaba Base"} → ${q.dropoff || "PHC Base"}</span>
      </td>
      <td class="p-4 text-xs text-muted-foreground font-medium">
        ${formattedDate}
      </td>
      <td class="p-4">
        <select onchange="updateStaffQuoteStatus('${q.id}', this.value)" class="text-xs font-semibold px-2 py-1 rounded-lg border border-border bg-surface text-foreground cursor-pointer">
          <option value="New" ${q.status === "New" ? "selected" : ""}>New</option>
          <option value="Contacted" ${q.status === "Contacted" ? "selected" : ""}>Contacted</option>
          <option value="Converted" ${q.status === "Converted" ? "selected" : ""}>Converted</option>
          <option value="Archived" ${q.status === "Archived" ? "selected" : ""}>Archived</option>
        </select>
      </td>
      <td class="p-4 text-right space-x-2">
        <button type="button" onclick="showQuoteModal('${q.id}')" class="px-2.5 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-surface cursor-pointer shadow-xs">Details</button>
        <button type="button" onclick="deleteStaffQuote('${q.id}')" class="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer">Delete</button>
      </td>
    </tr>
  `;
}

function updateStaffQuoteStatus(id, newStatus) {
  const quotes = AppStore.getQuotes().map((q) =>
    q.id === id ? { ...q, status: newStatus } : q,
  );
  AppStore.saveQuotes(quotes);
}

function deleteStaffQuote(id) {
  if (confirm("Delete quote request?")) {
    const quotes = AppStore.getQuotes().filter((q) => q.id !== id);
    AppStore.saveQuotes(quotes);
    renderStaffQuotes();
  }
}

function showQuoteModal(id) {
  const q = AppStore.getQuotes().find((x) => x.id === id);
  if (!q) return;

  const content = document.getElementById("quote-detail-content");
  if (content) {
    content.innerHTML = `
      <div class="p-4 bg-surface rounded-2xl border border-border space-y-2 text-xs">
        <div><strong>Sender:</strong> ${q.name}</div>
        <div><strong>Phone:</strong> <a href="tel:${q.phone}" class="text-primary font-bold">${q.phone}</a></div>
        <div><strong>Route:</strong> ${q.pickup || "Alaba Base"} ➔ ${q.dropoff || "PHC Base"}</div>
        <div><strong>Cargo:</strong> ${q.cargo} (${q.weight || "Standard"})</div>
        <div><strong>Request Date:</strong> ${DateUtils.formatDayFull(AppStore.getItemDate(q))}</div>
        ${q.notes ? `<div><strong>Special Notes:</strong> ${q.notes}</div>` : ""}
      </div>
      <div class="pt-2 flex gap-2">
        <a href="https://wa.me/${q.phone.replace(/[^0-9]/g, "")}" target="_blank" class="flex-1 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs text-center">Chat WhatsApp</a>
        <a href="tel:${q.phone}" class="flex-1 py-2 rounded-xl bg-primary text-white font-bold text-xs text-center">Call Sender</a>
      </div>
    `;
  }
  document.getElementById("modal-quote-details")?.classList.remove("hidden");
}

document.addEventListener("DOMContentLoaded", () => {
  renderStaffQuotes();
  document
    .getElementById("quotes-search-input")
    ?.addEventListener("input", renderStaffQuotes);
  document
    .getElementById("quotes-status-filter")
    ?.addEventListener("change", renderStaffQuotes);
  document.querySelectorAll(".btn-close-modal").forEach((b) =>
    b.addEventListener("click", () => {
      document
        .querySelectorAll('[id^="modal-"]')
        .forEach((m) => m.classList.add("hidden"));
    }),
  );
});

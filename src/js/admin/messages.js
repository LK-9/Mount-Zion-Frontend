// Staff Admin Messages Inbox

let staffMessagesPeriodType = "all";
let staffMessagesPeriodValue = "";

function renderStaffMessages() {
  const tbody = document.getElementById("messages-table-body");
  if (!tbody) return;

  const searchInput = document.getElementById("messages-search-input");
  const filterSelect = document.getElementById("messages-status-filter");

  const term = (searchInput?.value || "").toLowerCase().trim();
  const filter = filterSelect?.value || "ALL";

  const allMessages = AppStore.getMessages();
  const allPeriods = AppStore.getAvailablePeriods(allMessages);

  if (
    staffMessagesPeriodType === "day" &&
    !staffMessagesPeriodValue &&
    allPeriods.days.length > 0
  ) {
    staffMessagesPeriodValue = allPeriods.days[0].key;
  } else if (
    staffMessagesPeriodType === "week" &&
    !staffMessagesPeriodValue &&
    allPeriods.weeks.length > 0
  ) {
    staffMessagesPeriodValue = allPeriods.weeks[0].key;
  } else if (
    staffMessagesPeriodType === "month" &&
    !staffMessagesPeriodValue &&
    allPeriods.months.length > 0
  ) {
    staffMessagesPeriodValue = allPeriods.months[0].key;
  } else if (
    staffMessagesPeriodType === "year" &&
    !staffMessagesPeriodValue &&
    allPeriods.years.length > 0
  ) {
    staffMessagesPeriodValue = allPeriods.years[0].key;
  }

  // Render Period Toolbar
  DateUtils.renderPeriodToolbar({
    containerId: "staff-messages-period-toolbar",
    periodType: staffMessagesPeriodType,
    periodValue: staffMessagesPeriodValue,
    availablePeriods: allPeriods,
    countsSummary: `${AppStore.filterByPeriod(allMessages, staffMessagesPeriodType, staffMessagesPeriodValue).length} Inquiries`,
    onChange: (newType, newVal) => {
      staffMessagesPeriodType = newType;
      staffMessagesPeriodValue = newVal;
      renderStaffMessages();
    },
  });

  let messages = AppStore.filterByPeriod(
    allMessages,
    staffMessagesPeriodType,
    staffMessagesPeriodValue,
  );

  if (filter !== "ALL") messages = messages.filter((m) => m.status === filter);
  if (term) {
    messages = messages.filter(
      (m) =>
        (m.name && m.name.toLowerCase().includes(term)) ||
        (m.subject && m.subject.toLowerCase().includes(term)) ||
        (m.message && m.message.toLowerCase().includes(term)) ||
        (m.email && m.email.toLowerCase().includes(term)) ||
        (m.phone && m.phone.toLowerCase().includes(term)),
    );
  }

  if (messages.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="5" class="p-8 text-center text-muted-foreground text-xs">No inquiries matching period & search filter.</td></tr>';
    return;
  }

  // Render with Date Group Headers
  if (staffMessagesPeriodType === "all" || !staffMessagesPeriodValue) {
    const groups = AppStore.groupItemsByPeriod(
      messages,
      staffMessagesPeriodType === "year" ? "month" : "day",
    );
    tbody.innerHTML = groups
      .map((g) => {
        const header = DateUtils.renderDateGroupHeader(g, 5);
        const rows = g.items.map((m) => renderMessageRow(m)).join("");
        return header + rows;
      })
      .join("");
  } else if (
    staffMessagesPeriodType === "month" ||
    staffMessagesPeriodType === "week"
  ) {
    const groups = AppStore.groupItemsByPeriod(messages, "day");
    tbody.innerHTML = groups
      .map((g) => {
        const header = DateUtils.renderDateGroupHeader(g, 5);
        const rows = g.items.map((m) => renderMessageRow(m)).join("");
        return header + rows;
      })
      .join("");
  } else {
    tbody.innerHTML = messages.map((m) => renderMessageRow(m)).join("");
  }
}

function renderMessageRow(m) {
  const d = AppStore.getItemDate(m);
  const formattedDate = DateUtils.formatDay(d);

  return `
    <tr class="hover:bg-surface/50 transition-colors">
      <td class="p-4 font-bold text-foreground text-xs">
        ${m.name}
        <span class="text-muted-foreground block font-normal text-[11px]">${m.phone || m.email || "No contact"}</span>
      </td>
      <td class="p-4 text-xs font-semibold text-foreground">
        ${m.subject}
        <span class="text-muted-foreground block font-normal text-[11px] line-clamp-1">${m.message}</span>
      </td>
      <td class="p-4 text-xs text-muted-foreground font-medium">
        ${formattedDate}
      </td>
      <td class="p-4">
        <span class="px-2.5 py-0.5 rounded-full text-xs font-bold ${
          m.status === "Unread"
            ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
            : "bg-surface border border-border text-muted-foreground"
        }">${m.status}</span>
      </td>
      <td class="p-4 text-right space-x-2">
        <button type="button" onclick="showStaffMessageModal('${m.id}')" class="px-2.5 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-surface cursor-pointer shadow-xs">Read</button>
        <button type="button" onclick="deleteStaffMessage('${m.id}')" class="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer">Delete</button>
      </td>
    </tr>
  `;
}

function deleteStaffMessage(id) {
  if (confirm("Delete inquiry message?")) {
    const messages = AppStore.getMessages().filter((m) => m.id !== id);
    AppStore.saveMessages(messages);
    renderStaffMessages();
  }
}

function showStaffMessageModal(id) {
  const m = AppStore.getMessages().find((x) => x.id === id);
  if (!m) return;

  // Mark as read
  if (m.status === "Unread") {
    m.status = "Read";
    const all = AppStore.getMessages().map((item) =>
      item.id === id ? { ...item, status: "Read" } : item,
    );
    AppStore.saveMessages(all);
    renderStaffMessages();
  }

  const content = document.getElementById("message-detail-content");
  if (content) {
    content.innerHTML = `
      <div class="p-4 bg-surface rounded-2xl border border-border space-y-2 text-xs">
        <div><strong>Sender:</strong> ${m.name}</div>
        <div><strong>Email:</strong> ${m.email || "N/A"}</div>
        <div><strong>Phone:</strong> ${m.phone ? `<a href="tel:${m.phone}" class="text-primary font-bold">${m.phone}</a>` : "N/A"}</div>
        <div><strong>Subject:</strong> ${m.subject}</div>
        <div><strong>Received Date:</strong> ${DateUtils.formatDayFull(AppStore.getItemDate(m))}</div>
      </div>
      <div>
        <label class="font-bold text-xs block text-muted-foreground mb-1.5">Inquiry Message Content:</label>
        <p class="p-4 bg-surface border border-border rounded-xl text-xs whitespace-pre-wrap leading-relaxed text-foreground">${m.message}</p>
      </div>
    `;
  }
  document.getElementById("modal-message-details")?.classList.remove("hidden");
}

document.addEventListener("DOMContentLoaded", () => {
  renderStaffMessages();
  document
    .getElementById("messages-search-input")
    ?.addEventListener("input", renderStaffMessages);
  document
    .getElementById("messages-status-filter")
    ?.addEventListener("change", renderStaffMessages);
  document.querySelectorAll(".btn-close-modal").forEach((b) =>
    b.addEventListener("click", () => {
      document
        .querySelectorAll('[id^="modal-"]')
        .forEach((m) => m.classList.add("hidden"));
    }),
  );
});

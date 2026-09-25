// Staff Admin Dashboard

let staffDashPeriodType = "day";
let staffDashPeriodValue = DateUtils.getDayKey(new Date());

function renderStaffDashboard() {
  const allManifests = AppStore.getManifests();
  const allQuotes = AppStore.getQuotes();
  const allMessages = AppStore.getMessages();
  const allPeriods = AppStore.getAvailablePeriods(allManifests);

  if (
    staffDashPeriodType === "day" &&
    !staffDashPeriodValue &&
    allPeriods.days.length > 0
  ) {
    staffDashPeriodValue = allPeriods.days[0].key;
  } else if (
    staffDashPeriodType === "week" &&
    !staffDashPeriodValue &&
    allPeriods.weeks.length > 0
  ) {
    staffDashPeriodValue = allPeriods.weeks[0].key;
  } else if (
    staffDashPeriodType === "month" &&
    !staffDashPeriodValue &&
    allPeriods.months.length > 0
  ) {
    staffDashPeriodValue = allPeriods.months[0].key;
  } else if (
    staffDashPeriodType === "year" &&
    !staffDashPeriodValue &&
    allPeriods.years.length > 0
  ) {
    staffDashPeriodValue = allPeriods.years[0].key;
  }

  // Active staff user display
  const activeStaff = AppStore.getActiveStaff();
  const staffNameEl = document.getElementById("logged-staff-name");
  if (staffNameEl && activeStaff) {
    const roleTag = activeStaff.role
      ? ` <span class="text-xs font-normal text-muted-foreground">(${activeStaff.role})</span>`
      : "";
    staffNameEl.innerHTML = `${activeStaff.name}${roleTag}`;
  }

  // Render Period Toolbar
  DateUtils.renderPeriodToolbar({
    containerId: "staff-dash-period-toolbar",
    periodType: staffDashPeriodType,
    periodValue: staffDashPeriodValue,
    availablePeriods: allPeriods,
    countsSummary: `${AppStore.filterByPeriod(allManifests, staffDashPeriodType, staffDashPeriodValue).length} Dispatches`,
    onChange: (newType, newVal) => {
      staffDashPeriodType = newType;
      staffDashPeriodValue = newVal;
      renderStaffDashboard();
    },
  });

  // Filter items by period
  const periodManifests = AppStore.filterByPeriod(
    allManifests,
    staffDashPeriodType,
    staffDashPeriodValue,
  );
  const periodQuotes = AppStore.filterByPeriod(
    allQuotes,
    staffDashPeriodType,
    staffDashPeriodValue,
  );
  const periodMessages = AppStore.filterByPeriod(
    allMessages,
    staffDashPeriodType,
    staffDashPeriodValue,
  );

  // Period revenue
  let periodRevenue = 0;
  periodManifests.forEach((m) => {
    (m.waybills || []).forEach((w) => {
      periodRevenue += Number(w.amountPaid) || 0;
    });
  });

  const revEl = document.getElementById("dash-today-revenue");
  if (revEl) {
    revEl.textContent = `₦${periodRevenue.toLocaleString()}`;
  }

  const activeM = periodManifests.filter(
    (m) => m.status !== "Offloaded" && m.status !== "Offloaded & Closed",
  ).length;
  const newQ = periodQuotes.filter((q) => q.status === "New").length;
  const unreadMsg = periodMessages.filter((m) => m.status === "Unread").length;

  const mEl = document.getElementById("dash-active-manifests");
  if (mEl) mEl.textContent = periodManifests.length;
  const qEl = document.getElementById("dash-total-quotes");
  if (qEl) qEl.textContent = periodQuotes.length;
  const qNew = document.getElementById("dash-new-quotes");
  if (qNew)
    qNew.textContent = `${newQ} new requests (${activeM} active dispatches)`;
  const msgEl = document.getElementById("dash-total-messages");
  if (msgEl) msgEl.textContent = periodMessages.length;
  const msgUnread = document.getElementById("dash-unread-messages");
  if (msgUnread) msgUnread.textContent = `${unreadMsg} unread in period →`;

  const recentM = document.getElementById("dash-recent-manifests");
  if (recentM) {
    if (periodManifests.length === 0) {
      recentM.innerHTML = `<p class="text-xs text-muted-foreground py-4 text-center">No manifests recorded for this period.</p>`;
    } else {
      recentM.innerHTML = periodManifests
        .slice(0, 5)
        .map((m) => {
          const totalPaid = (m.waybills || []).reduce(
            (acc, w) => acc + (Number(w.amountPaid) || 0),
            0,
          );

          return `
          <div class="py-3 flex items-center justify-between gap-3 first:pt-0 border-b border-border/50 last:border-0">
            <div>
              <p class="text-sm font-semibold text-foreground">${m.id} (${m.truckPlate})</p>
              <p class="text-xs text-muted-foreground">${m.loadingDate || m.departureDate || ""} • ${m.containerSize} • ${m.waybills ? m.waybills.length : 0} Waybills • ₦${totalPaid.toLocaleString()} Paid</p>
            </div>
            <span class="text-xs font-bold px-2.5 py-1 rounded-full border bg-surface">${m.status}</span>
          </div>
        `;
        })
        .join("");
    }
  }

  const recentQ = document.getElementById("dash-recent-quotes");
  if (recentQ) {
    if (periodQuotes.length === 0) {
      recentQ.innerHTML = `<p class="text-xs text-muted-foreground py-4 text-center">No quote requests recorded for this period.</p>`;
    } else {
      recentQ.innerHTML = periodQuotes
        .slice(0, 5)
        .map(
          (q) => `
        <div class="py-3 flex items-center justify-between gap-3 first:pt-0 border-b border-border/50 last:border-0">
          <div>
            <p class="text-sm font-semibold text-foreground">${q.name}</p>
            <p class="text-xs text-muted-foreground">${q.cargo} • ${DateUtils.formatDay(AppStore.getItemDate(q))}</p>
          </div>
          <span class="text-xs font-bold px-2.5 py-1 rounded-full border bg-surface">${q.status}</span>
        </div>
      `,
        )
        .join("");
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderStaffDashboard();
});

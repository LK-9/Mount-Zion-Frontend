// Mount Zion — Shared Local Storage & Reactive Data Store

const STORAGE_KEYS = {
  quotes: "mzhl-admin-quotes",
  manifests: "mzhl-admin-manifests",
  shipments: "mzhl-admin-shipments",
  messages: "mzhl-admin-messages",
  auth: "mzhl-admin-auth",
  superAuth: "mzhl-super-auth",
  drivers: "mzhl-super-drivers",
  phcDrivers: "mzhl-super-phc-drivers",
  staff: "mzhl-super-staff",
  finance: "mzhl-super-finance",
  audit: "mzhl-super-audit",
  activeStaffUser: "mzhl-active-staff-user",
  pricing: "mzhl-super-pricing",
};

const DateUtils = {
  parseDate(val) {
    if (!val) return new Date();
    if (val instanceof Date) return val;
    if (typeof val === "number") return new Date(val);
    if (typeof val === "string") {
      const v = val.trim();
      if (v.toLowerCase().startsWith("today")) return new Date();
      if (v.toLowerCase().startsWith("yesterday")) {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return d;
      }
      if (v.toLowerCase().startsWith("tomorrow")) {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d;
      }
      if (v.toLowerCase().includes("days ago")) {
        const match = v.match(/(\d+)\s*days?\s*ago/i);
        const days = match ? parseInt(match[1], 10) : 3;
        const d = new Date();
        d.setDate(d.getDate() - days);
        return d;
      }
      const dMatch = v.match(/(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})/);
      if (dMatch) {
        const months = {
          jan: 0,
          feb: 1,
          mar: 2,
          apr: 3,
          may: 4,
          jun: 5,
          jul: 6,
          aug: 7,
          sep: 8,
          oct: 9,
          nov: 10,
          dec: 11,
        };
        const day = parseInt(dMatch[1], 10);
        const monKey = dMatch[2].toLowerCase().slice(0, 3);
        const mon = months[monKey] !== undefined ? months[monKey] : 0;
        const year = parseInt(dMatch[3], 10);
        return new Date(year, mon, day);
      }
      const parsed = new Date(v);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  },

  getDayKey(val) {
    const d = this.parseDate(val);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  },

  getWeekKey(val) {
    const d = this.parseDate(val);
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
    return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
  },

  getWeekRange(val) {
    const d = this.parseDate(val);
    const day = d.getDay();
    const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return { start: monday, end: sunday };
  },

  getMonthKey(val) {
    const d = this.parseDate(val);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  },

  getYearKey(val) {
    const d = this.parseDate(val);
    return String(d.getFullYear());
  },

  formatDay(val) {
    const d = this.parseDate(val);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  },

  formatDayFull(val) {
    const d = this.parseDate(val);
    return d.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  },

  formatWeek(val) {
    const d = this.parseDate(val);
    const weekKey = this.getWeekKey(d);
    const range = this.getWeekRange(d);
    const startStr = range.start.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });
    const endStr = range.end.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const weekNum = weekKey.split("-W")[1];
    return `Week ${parseInt(weekNum, 10)} (${startStr} – ${endStr})`;
  },

  formatWeekShort(val) {
    const d = this.parseDate(val);
    const weekKey = this.getWeekKey(d);
    const range = this.getWeekRange(d);
    const startStr = range.start.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });
    const endStr = range.end.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });
    const weekNum = weekKey.split("-W")[1];
    return `Wk ${parseInt(weekNum, 10)} (${startStr}–${endStr})`;
  },

  formatMonth(val) {
    const d = this.parseDate(val);
    return d.toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
    });
  },

  formatYear(val) {
    const d = this.parseDate(val);
    return String(d.getFullYear());
  },

  isToday(val) {
    return this.getDayKey(val) === this.getDayKey(new Date());
  },

  isThisWeek(val) {
    return this.getWeekKey(val) === this.getWeekKey(new Date());
  },

  isYesterday(val) {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return this.getDayKey(val) === this.getDayKey(d);
  },

  renderPeriodToolbar(options) {
    const {
      containerId,
      periodType = "all",
      periodValue = "",
      availablePeriods = { days: [], weeks: [], months: [], years: [] },
      onChange,
      countsSummary = "",
    } = options;

    const container =
      typeof containerId === "string"
        ? document.getElementById(containerId)
        : containerId;
    if (!container) return;

    const tabs = [
      { type: "all", label: "All Records" },
      { type: "day", label: "📅 Day-to-Day" },
      { type: "week", label: "📆 Weekly" },
      { type: "month", label: "🗓️ Monthly" },
      { type: "year", label: "📊 Yearly" },
    ];

    let selectorHtml = "";
    if (periodType === "day") {
      selectorHtml = `
        <div class="flex items-center gap-2">
          <label class="text-[11px] font-bold text-muted-foreground whitespace-nowrap">Filter Day:</label>
          <select id="period-sub-select" class="px-3 py-1.5 rounded-xl border border-border bg-surface text-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer">
            <option value="" ${!periodValue ? "selected" : ""}>All Days (Grouped)</option>
            ${(availablePeriods.days || [])
              .map(
                (d) =>
                  `<option value="${d.key}" ${periodValue === d.key ? "selected" : ""}>${d.label}${d.key === this.getDayKey(new Date()) ? " (Today)" : ""}</option>`,
              )
              .join("")}
          </select>
        </div>
      `;
    } else if (periodType === "week") {
      selectorHtml = `
        <div class="flex items-center gap-2">
          <label class="text-[11px] font-bold text-muted-foreground whitespace-nowrap">Filter Week:</label>
          <select id="period-sub-select" class="px-3 py-1.5 rounded-xl border border-border bg-surface text-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer">
            <option value="" ${!periodValue ? "selected" : ""}>All Weeks (Grouped)</option>
            ${(availablePeriods.weeks || [])
              .map(
                (w) =>
                  `<option value="${w.key}" ${periodValue === w.key ? "selected" : ""}>${w.label}${w.key === this.getWeekKey(new Date()) ? " (This Week)" : ""}</option>`,
              )
              .join("")}
          </select>
        </div>
      `;
    } else if (periodType === "month") {
      selectorHtml = `
        <div class="flex items-center gap-2">
          <label class="text-[11px] font-bold text-muted-foreground whitespace-nowrap">Filter Month:</label>
          <select id="period-sub-select" class="px-3 py-1.5 rounded-xl border border-border bg-surface text-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer">
            <option value="" ${!periodValue ? "selected" : ""}>All Months (Grouped)</option>
            ${(availablePeriods.months || [])
              .map(
                (m) =>
                  `<option value="${m.key}" ${periodValue === m.key ? "selected" : ""}>${m.label}</option>`,
              )
              .join("")}
          </select>
        </div>
      `;
    } else if (periodType === "year") {
      selectorHtml = `
        <div class="flex items-center gap-2">
          <label class="text-[11px] font-bold text-muted-foreground whitespace-nowrap">Filter Year:</label>
          <select id="period-sub-select" class="px-3 py-1.5 rounded-xl border border-border bg-surface text-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer">
            <option value="" ${!periodValue ? "selected" : ""}>All Years (Grouped)</option>
            ${(availablePeriods.years || [])
              .map(
                (y) =>
                  `<option value="${y.key}" ${periodValue === y.key ? "selected" : ""}>Year ${y.label}</option>`,
              )
              .join("")}
          </select>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-3 bg-card p-2.5 sm:p-3.5 rounded-2xl border border-border shadow-xs">
        <div class="flex flex-wrap items-center gap-1 sm:gap-1.5 p-1 bg-surface rounded-xl border border-border text-xs font-semibold">
          ${tabs
            .map((t) => {
              const isActive = periodType === t.type;
              return `
              <button type="button" data-period="${t.type}" class="period-tab-btn px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                isActive
                  ? "bg-primary text-white shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/50"
              }">
                ${t.label}
              </button>
            `;
            })
            .join("")}
        </div>

        <div class="flex flex-wrap items-center gap-3">
          ${selectorHtml}
          ${
            countsSummary
              ? `<span class="text-xs font-semibold text-muted-foreground px-2.5 py-1 bg-surface rounded-lg border border-border">${countsSummary}</span>`
              : ""
          }
        </div>
      </div>
    `;

    container.querySelectorAll(".period-tab-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const targetType = btn.getAttribute("data-period");
        let targetVal = "";
        if (targetType === "day") {
          const todayKey = DateUtils.getDayKey(new Date());
          const hasToday = (availablePeriods.days || []).some(
            (d) => d.key === todayKey,
          );
          if (hasToday) {
            targetVal = todayKey;
          } else if (availablePeriods.days?.length > 0) {
            targetVal = availablePeriods.days[0].key;
          }
        } else if (targetType === "week") {
          const thisWeekKey = DateUtils.getWeekKey(new Date());
          const hasWeek = (availablePeriods.weeks || []).some(
            (w) => w.key === thisWeekKey,
          );
          if (hasWeek) {
            targetVal = thisWeekKey;
          } else if (availablePeriods.weeks?.length > 0) {
            targetVal = availablePeriods.weeks[0].key;
          }
        } else if (targetType === "month") {
          const thisMonthKey = DateUtils.getMonthKey(new Date());
          const hasMonth = (availablePeriods.months || []).some(
            (m) => m.key === thisMonthKey,
          );
          if (hasMonth) {
            targetVal = thisMonthKey;
          } else if (availablePeriods.months?.length > 0) {
            targetVal = availablePeriods.months[0].key;
          }
        } else if (targetType === "year") {
          const thisYearKey = DateUtils.getYearKey(new Date());
          const hasYear = (availablePeriods.years || []).some(
            (y) => y.key === thisYearKey,
          );
          if (hasYear) {
            targetVal = thisYearKey;
          } else if (availablePeriods.years?.length > 0) {
            targetVal = availablePeriods.years[0].key;
          }
        }
        if (typeof onChange === "function") onChange(targetType, targetVal);
      });
    });

    const subSelect = container.querySelector("#period-sub-select");
    if (subSelect) {
      subSelect.addEventListener("change", (e) => {
        if (typeof onChange === "function")
          onChange(periodType, e.target.value);
      });
    }
  },

  renderDateGroupHeader(group, colSpan = 6, extraMetrics = "") {
    return `
      <tr class="bg-surface/90 border-y-2 border-border/80">
        <td colspan="${colSpan}" class="px-4 py-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center justify-center h-6 w-6 rounded-lg bg-primary/10 text-primary text-xs font-bold">
                ${group.periodType === "year" ? "📊" : group.periodType === "month" ? "🗓️" : group.periodType === "week" ? "📆" : "📅"}
              </span>
              <span class="font-bold text-xs sm:text-sm text-foreground tracking-tight">${group.title}</span>
            </div>
            <div class="flex items-center gap-2">
              ${extraMetrics ? `<span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400">${extraMetrics}</span>` : ""}
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-card border border-border text-muted-foreground shadow-xs">
                ${group.items.length} ${group.items.length === 1 ? "Record" : "Records"}
              </span>
            </div>
          </div>
        </td>
      </tr>
    `;
  },

  renderPeriodBanner(title, subtitle = "", badgeText = "") {
    return `
      <div class="p-3.5 sm:p-4 rounded-2xl bg-linear-to-r from-primary/10 via-card to-card border border-primary/20 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-lg shrink-0">
            📅
          </div>
          <div>
            <h3 class="font-bold text-sm sm:text-base text-foreground font-poppins">${title}</h3>
            ${subtitle ? `<p class="text-xs text-muted-foreground">${subtitle}</p>` : ""}
          </div>
        </div>
        ${badgeText ? `<span class="px-3 py-1 rounded-full text-xs font-bold bg-primary text-white shadow-xs">${badgeText}</span>` : ""}
      </div>
    `;
  },
};

window.DateUtils = DateUtils;

const defaultManifests = [
  {
    id: "MNF-2026-045",
    truckPlate: "APP-712-XY",
    driverName: "Baridua Kobani",
    driverPhone: "0803 444 8811",
    loadingDate: "09 Sep 2026, 11:30 AM",
    offloadingDate: "",
    containerSize: "40-ft Container",
    route: "Lagos (Alaba Base) → Port Harcourt (D-Line Base)",
    departureDate: "Today, 11:30 AM",
    status: "Loading",
    totalWeight: "21.4 Tons",
    isoDate: "2026-09-09T11:30:00.000Z",
    waybills: [
      {
        id: "MZ-2026-903",
        receiverName: "Okey & Sons Power Systems",
        receiverPhone: "0803 444 5511",
        itemQuantity: "15 Bundles",
        itemNameDescription: "Heavy-Duty Solar Inverter DC Wiring & Busbars",
        amountCharged: 95000,
        amountPaid: 95000,
        balance: 0,
        isPaid: true,
        paymentMethod: "Bank Transfer",
        reachedOut: true,
        goodsReceived: false,
        destination: "Mile 1 Market, Port Harcourt",
      },
      {
        id: "MZ-2026-904",
        receiverName: "Lady B Beauty & Cosmetics",
        receiverPhone: "0806 333 7788",
        itemQuantity: "30 Cartons",
        itemNameDescription: "Body Care Lotions, Hair Creams & Salon Equipment",
        amountCharged: 85000,
        amountPaid: 50000,
        balance: 35000,
        isPaid: false,
        paymentMethod: "POS Terminal",
        reachedOut: false,
        goodsReceived: false,
        destination: "Garrison Junction, Port Harcourt",
      },
    ],
  },
  {
    id: "MNF-2026-044",
    truckPlate: "KJA-910-LA",
    driverName: "Malam Musa Danladi",
    driverPhone: "0802 762 6893",
    loadingDate: "09 Sep 2026, 06:00 AM",
    offloadingDate: "",
    containerSize: "40-ft Container",
    route: "Lagos (Alaba Base) → Port Harcourt (D-Line Base)",
    departureDate: "Today, 06:00 AM",
    status: "Loading",
    totalWeight: "19.8 Tons",
    isoDate: "2026-09-09T06:00:00.000Z",
    waybills: [
      {
        id: "MZ-2026-901",
        receiverName: "Ken Motors Auto Spares",
        receiverPhone: "0803 999 1100",
        itemQuantity: "14 Crates",
        itemNameDescription:
          "Heavy Commercial Truck Shock Absorbers & Brake Lining",
        amountCharged: 110000,
        amountPaid: 110000,
        balance: 0,
        isPaid: true,
        paymentMethod: "Bank Transfer",
        reachedOut: true,
        goodsReceived: false,
        destination: "Trans-Amadi Industrial Layout, Port Harcourt",
      },
      {
        id: "MZ-2026-902",
        receiverName: "Divine Grace Boutique",
        receiverPhone: "0807 555 4433",
        itemQuantity: "22 Cartons",
        itemNameDescription: "Ladies Fashion Wears, Bags & Cosmetics Sets",
        amountCharged: 65000,
        amountPaid: 40000,
        balance: 25000,
        isPaid: false,
        paymentMethod: "POS Terminal",
        reachedOut: true,
        goodsReceived: false,
        destination: "Mile 1 Market, Port Harcourt",
      },
    ],
  },
  {
    id: "MNF-2026-043B",
    truckPlate: "KJA-482-XY",
    driverName: "Malam Musa Danladi",
    driverPhone: "0802 762 6893",
    loadingDate: "08 Sep 2026, 06:30 AM",
    offloadingDate: "",
    containerSize: "40-ft Container",
    route: "Lagos (Alaba Base) → Port Harcourt (D-Line Base)",
    departureDate: "Yesterday, 06:30 AM",
    status: "In Transit",
    totalWeight: "23.6 Tons",
    isoDate: "2026-09-08T06:30:00.000Z",
    waybills: [
      {
        id: "MZ-2026-891",
        receiverName: "Eastern Marine Supply",
        receiverPhone: "0803 111 8844",
        itemQuantity: "12 Crates",
        itemNameDescription: "Commercial Outboard Marine Engines & Propellers",
        amountCharged: 160000,
        amountPaid: 160000,
        balance: 0,
        isPaid: true,
        paymentMethod: "Bank Transfer",
        reachedOut: true,
        goodsReceived: false,
        destination: "Marine Base, Port Harcourt",
      },
      {
        id: "MZ-2026-892",
        receiverName: "Mama Joy Wholesale Provisions",
        receiverPhone: "0805 777 3322",
        itemQuantity: "45 Cartons",
        itemNameDescription: "Beverages, Cooking Spices & Confectioneries",
        amountCharged: 130000,
        amountPaid: 130000,
        balance: 0,
        isPaid: true,
        paymentMethod: "POS Terminal",
        reachedOut: true,
        goodsReceived: false,
        destination: "Oil Mill Market, Port Harcourt",
      },
    ],
  },
  {
    id: "MNF-2026-043A",
    truckPlate: "LSR-291-ZZ",
    driverName: "Godwin Uche",
    driverPhone: "0803 502 7619",
    loadingDate: "07 Sep 2026, 06:00 AM",
    offloadingDate: "08 Sep 2026, 05:00 PM",
    containerSize: "20-ft Container",
    route: "Lagos (Alaba Base) → Port Harcourt (D-Line Base)",
    departureDate: "07 Sep 2026, 06:00 AM",
    status: "Arrived D-Line PHC",
    totalWeight: "13.9 Tons",
    isoDate: "2026-09-07T06:00:00.000Z",
    waybills: [
      {
        id: "MZ-2026-871",
        receiverName: "Top-Rank Electricals",
        receiverPhone: "0802 888 4400",
        itemQuantity: "28 Cartons",
        itemNameDescription: "Circuit Breakers, Distribution Panels & Conduits",
        amountCharged: 115000,
        amountPaid: 115000,
        balance: 0,
        isPaid: true,
        paymentMethod: "Bank Transfer",
        reachedOut: true,
        goodsReceived: false,
        destination: "Ikwerre Road, Port Harcourt",
      },
      {
        id: "MZ-2026-872",
        receiverName: "D-Line Auto Tech Workshop",
        receiverPhone: "0809 333 1199",
        itemQuantity: "10 Crates",
        itemNameDescription: "Clutch Pressure Plates & Gear Components",
        amountCharged: 85000,
        amountPaid: 60000,
        balance: 25000,
        isPaid: false,
        paymentMethod: "POS Terminal",
        reachedOut: true,
        goodsReceived: false,
        destination: "D-Line Base, Port Harcourt",
      },
    ],
  },
  {
    id: "MNF-2026-043",
    truckPlate: "LSR-291-ZZ",
    driverName: "Godwin Uche",
    driverPhone: "0803 502 7619",
    loadingDate: "05 Sep 2026, 07:00 AM",
    offloadingDate: "06 Sep 2026, 04:00 PM",
    containerSize: "20-ft Container",
    route: "Lagos (Alaba Base) → Port Harcourt (D-Line Base)",
    departureDate: "05 Sep 2026, 07:00 AM",
    status: "Offloaded",
    totalWeight: "14.2 Tons",
    isoDate: "2026-09-05T07:00:00.000Z",
    waybills: [
      {
        id: "MZ-2026-104",
        receiverName: "Chinedu Eze Trading Store",
        receiverPhone: "0805 444 5566",
        itemQuantity: "8 Crates",
        itemNameDescription:
          "Heavy-Duty Truck Brake Drums & Suspension Leaf Springs",
        amountCharged: 55000,
        amountPaid: 55000,
        balance: 0,
        isPaid: true,
        paymentMethod: "POS Terminal",
        reachedOut: true,
        goodsReceived: true,
        destination: "Aba Road, Port Harcourt",
      },
      {
        id: "MZ-2026-105",
        receiverName: "Blessed Hair & Cosmetics Plaza",
        receiverPhone: "0809 111 0022",
        itemQuantity: "25 Cartons",
        itemNameDescription:
          "Beauty Care Products, Hair Extensions & Salon Equipment",
        amountCharged: 45000,
        amountPaid: 20000,
        balance: 25000,
        isPaid: false,
        paymentMethod: "Bank Transfer",
        reachedOut: true,
        goodsReceived: true,
        destination: "D-Line Depot, Port Harcourt",
      },
    ],
  },
  {
    id: "MNF-2026-042",
    truckPlate: "KJA-482-XY",
    driverName: "Malam Musa Danladi",
    driverPhone: "0802 762 6893",
    loadingDate: "04 Sep 2026, 06:00 AM",
    offloadingDate: "05 Sep 2026, 03:30 PM",
    containerSize: "40-ft Container",
    route: "Lagos (Alaba Base) → Port Harcourt (D-Line Base)",
    departureDate: "04 Sep 2026, 06:00 AM",
    status: "Offloaded",
    totalWeight: "24.5 Tons",
    isoDate: "2026-09-04T06:00:00.000Z",
    waybills: [
      {
        id: "MZ-2026-881",
        receiverName: "Adaeze Okoro",
        receiverPhone: "0803 111 2233",
        itemQuantity: "18 Cartons",
        itemNameDescription:
          "Electronics (LED Smart TVs, Soundbars & Adapters)",
        amountCharged: 75000,
        amountPaid: 75000,
        balance: 0,
        isPaid: true,
        paymentMethod: "Bank Transfer",
        reachedOut: true,
        goodsReceived: true,
        destination: "Trans-Amadi, Port Harcourt",
      },
      {
        id: "MZ-2026-882",
        receiverName: "Chidi Auto Works (Engr. Chidi)",
        receiverPhone: "0805 222 3344",
        itemQuantity: "12 Crates",
        itemNameDescription:
          "Automotive Engine Blocks, Gearboxes & Brake Assemblies",
        amountCharged: 145000,
        amountPaid: 100000,
        balance: 45000,
        isPaid: false,
        paymentMethod: "POS Terminal",
        reachedOut: true,
        goodsReceived: true,
        destination: "Ikwerre Road, Port Harcourt",
      },
      {
        id: "MZ-2026-883",
        receiverName: "Emeka & Sons Industrial Ltd",
        receiverPhone: "0802 999 8877",
        itemQuantity: "30 Sacks",
        itemNameDescription:
          "Copper Wiring, Switchgears & Electrical Conduit Fittings",
        amountCharged: 95000,
        amountPaid: 95000,
        balance: 0,
        isPaid: true,
        paymentMethod: "Bank Transfer",
        reachedOut: true,
        goodsReceived: true,
        destination: "Mile 1 Market, Port Harcourt",
      },
    ],
  },
  {
    id: "MNF-2026-040",
    truckPlate: "RUM-893-AA",
    driverName: "Chukwudi Nweke",
    driverPhone: "0706 718 7157",
    loadingDate: "01 Sep 2026, 06:00 AM",
    offloadingDate: "02 Sep 2026, 04:00 PM",
    containerSize: "40-ft Container",
    route: "Lagos (Alaba Base) → Port Harcourt (D-Line Base)",
    departureDate: "01 Sep 2026, 06:00 AM",
    status: "Offloaded",
    totalWeight: "26.0 Tons",
    isoDate: "2026-09-01T06:00:00.000Z",
    waybills: [
      {
        id: "MZ-2026-552",
        receiverName: "Chukwudi N. (Building Solutions)",
        receiverPhone: "0706 718 7157",
        itemQuantity: "50 Sacks",
        itemNameDescription:
          "Industrial Fasteners, Galvanized Roofing Screws & Anchor Bolts",
        amountCharged: 180000,
        amountPaid: 180000,
        balance: 0,
        isPaid: true,
        paymentMethod: "Bank Transfer",
        reachedOut: true,
        goodsReceived: true,
        destination: "D-Line Base Depot, Port Harcourt",
      },
      {
        id: "MZ-2026-553",
        receiverName: "Prestige African Lace Fabrics",
        receiverPhone: "0803 555 9911",
        itemQuantity: "30 Bales",
        itemNameDescription: "Premium Swiss & Voile Lace Textiles",
        amountCharged: 140000,
        amountPaid: 140000,
        balance: 0,
        isPaid: true,
        paymentMethod: "Bank Transfer",
        reachedOut: true,
        goodsReceived: true,
        destination: "Mile 1 Market, Port Harcourt",
      },
    ],
  },
  {
    id: "MNF-2026-038",
    truckPlate: "KJA-482-XY",
    driverName: "Malam Musa Danladi",
    driverPhone: "0802 762 6893",
    loadingDate: "28 Aug 2026, 06:00 AM",
    offloadingDate: "29 Aug 2026, 05:00 PM",
    containerSize: "40-ft Container",
    route: "Lagos (Alaba Base) → Port Harcourt (D-Line Base)",
    departureDate: "28 Aug 2026, 06:00 AM",
    status: "Offloaded",
    totalWeight: "25.2 Tons",
    isoDate: "2026-08-28T06:00:00.000Z",
    waybills: [
      {
        id: "MZ-2026-381",
        receiverName: "Rivers Solar & Energy Ltd",
        receiverPhone: "0803 777 9900",
        itemQuantity: "16 Pallets",
        itemNameDescription:
          "550W Tier-1 Mono Solar Panels & 5KVA Hybrid Inverters",
        amountCharged: 240000,
        amountPaid: 240000,
        balance: 0,
        isPaid: true,
        paymentMethod: "Bank Transfer",
        reachedOut: true,
        goodsReceived: true,
        destination: "GRA Phase 2, Port Harcourt",
      },
      {
        id: "MZ-2026-382",
        receiverName: "Noble Pharma Depot",
        receiverPhone: "0802 333 4455",
        itemQuantity: "35 Cartons",
        itemNameDescription:
          "Over-The-Counter Healthcare Packaging & Essential Medicines",
        amountCharged: 125000,
        amountPaid: 125000,
        balance: 0,
        isPaid: true,
        paymentMethod: "POS Terminal",
        reachedOut: true,
        goodsReceived: true,
        destination: "D-Line Depot, Port Harcourt",
      },
    ],
  },
  {
    id: "MNF-2026-036",
    truckPlate: "RUM-893-AA",
    driverName: "Chukwudi Nweke",
    driverPhone: "0706 718 7157",
    loadingDate: "20 Aug 2026, 07:00 AM",
    offloadingDate: "21 Aug 2026, 05:30 PM",
    containerSize: "40-ft Container",
    route: "Lagos (Alaba Base) → Port Harcourt (D-Line Base)",
    departureDate: "20 Aug 2026, 07:00 AM",
    status: "Offloaded",
    totalWeight: "22.8 Tons",
    isoDate: "2026-08-20T07:00:00.000Z",
    waybills: [
      {
        id: "MZ-2026-361",
        receiverName: "Niger Delta Hardware Corp",
        receiverPhone: "0803 444 8822",
        itemQuantity: "50 Sacks",
        itemNameDescription:
          "Heavy Construction Fasteners & Steel Threaded Rods",
        amountCharged: 220000,
        amountPaid: 220000,
        balance: 0,
        isPaid: true,
        paymentMethod: "Bank Transfer",
        reachedOut: true,
        goodsReceived: true,
        destination: "Trans-Amadi, Port Harcourt",
      },
      {
        id: "MZ-2026-362",
        receiverName: "Atlantic Diagnostic Lab Supplies",
        receiverPhone: "0805 111 6677",
        itemQuantity: "40 Cartons",
        itemNameDescription:
          "Laboratory Test Strips & Clinical Diagnostics Consumables",
        amountCharged: 150000,
        amountPaid: 150000,
        balance: 0,
        isPaid: true,
        paymentMethod: "POS Terminal",
        reachedOut: true,
        goodsReceived: true,
        destination: "D-Line Base, Port Harcourt",
      },
    ],
  },
  {
    id: "MNF-2026-035",
    truckPlate: "LSR-291-ZZ",
    driverName: "Godwin Uche",
    driverPhone: "0803 502 7619",
    loadingDate: "15 Aug 2026, 07:00 AM",
    offloadingDate: "16 Aug 2026, 06:00 PM",
    containerSize: "20-ft Container",
    route: "Lagos (Alaba Base) → Port Harcourt (D-Line Base)",
    departureDate: "15 Aug 2026, 07:00 AM",
    status: "Offloaded",
    totalWeight: "13.8 Tons",
    isoDate: "2026-08-15T07:00:00.000Z",
    waybills: [
      {
        id: "MZ-2026-351",
        receiverName: "Gold Crest Electricals",
        receiverPhone: "0805 111 8899",
        itemQuantity: "40 Bundles",
        itemNameDescription: "Armoured Copper Cables & Distribution Panels",
        amountCharged: 195000,
        amountPaid: 195000,
        balance: 0,
        isPaid: true,
        paymentMethod: "Bank Transfer",
        reachedOut: true,
        goodsReceived: true,
        destination: "Aba Road, Port Harcourt",
      },
    ],
  },
  {
    id: "MNF-2026-029",
    truckPlate: "KJA-910-LA",
    driverName: "Malam Musa Danladi",
    driverPhone: "0802 762 6893",
    loadingDate: "22 Jul 2026, 06:00 AM",
    offloadingDate: "23 Jul 2026, 04:30 PM",
    containerSize: "40-ft Container",
    route: "Lagos (Alaba Base) → Port Harcourt (D-Line Base)",
    departureDate: "22 Jul 2026, 06:00 AM",
    status: "Offloaded",
    totalWeight: "26.5 Tons",
    isoDate: "2026-07-22T06:00:00.000Z",
    waybills: [
      {
        id: "MZ-2026-291",
        receiverName: "Delta Power Systems",
        receiverPhone: "0803 666 4411",
        itemQuantity: "12 Pallets",
        itemNameDescription: "Deep Cycle 200Ah Inverter Tubular Batteries",
        amountCharged: 290000,
        amountPaid: 290000,
        balance: 0,
        isPaid: true,
        paymentMethod: "Bank Transfer",
        reachedOut: true,
        goodsReceived: true,
        destination: "Trans-Amadi, Port Harcourt",
      },
      {
        id: "MZ-2026-292",
        receiverName: "PharmaPlus Healthcare Clinics",
        receiverPhone: "0802 999 1133",
        itemQuantity: "25 Cartons",
        itemNameDescription: "Medical Reagents, Sterile Gloves & Syringes",
        amountCharged: 135000,
        amountPaid: 135000,
        balance: 0,
        isPaid: true,
        paymentMethod: "Bank Transfer",
        reachedOut: true,
        goodsReceived: true,
        destination: "GRA Phase 2, Port Harcourt",
      },
    ],
  },
  {
    id: "MNF-2026-024",
    truckPlate: "LSR-291-ZZ",
    driverName: "Godwin Uche",
    driverPhone: "0803 502 7619",
    loadingDate: "14 Jun 2026, 06:00 AM",
    offloadingDate: "15 Jun 2026, 05:00 PM",
    containerSize: "20-ft Container",
    route: "Lagos (Alaba Base) → Port Harcourt (D-Line Base)",
    departureDate: "14 Jun 2026, 06:00 AM",
    status: "Offloaded",
    totalWeight: "14.5 Tons",
    isoDate: "2026-06-14T06:00:00.000Z",
    waybills: [
      {
        id: "MZ-2026-241",
        receiverName: "Golden Gate Electronics",
        receiverPhone: "0805 777 8899",
        itemQuantity: "20 Cartons",
        itemNameDescription: "Solar Hybrid Inverters (3.5KVA & 5KVA)",
        amountCharged: 185000,
        amountPaid: 185000,
        balance: 0,
        isPaid: true,
        paymentMethod: "Bank Transfer",
        reachedOut: true,
        goodsReceived: true,
        destination: "Mile 1 Market, Port Harcourt",
      },
    ],
  },
  {
    id: "MNF-2025-018",
    truckPlate: "RUM-893-AA",
    driverName: "Chukwudi Nweke",
    driverPhone: "0706 718 7157",
    loadingDate: "12 Nov 2025, 06:00 AM",
    offloadingDate: "13 Nov 2025, 04:00 PM",
    containerSize: "40-ft Container",
    route: "Lagos (Alaba Base) → Port Harcourt (D-Line Base)",
    departureDate: "12 Nov 2025, 06:00 AM",
    status: "Offloaded",
    totalWeight: "27.0 Tons",
    isoDate: "2025-11-12T06:00:00.000Z",
    waybills: [
      {
        id: "MZ-2025-181",
        receiverName: "Heritage Hardware Wholesale",
        receiverPhone: "0803 888 2211",
        itemQuantity: "60 Sacks",
        itemNameDescription:
          "Heavy Construction Fasteners & Steel Reinforcement Fittings",
        amountCharged: 210000,
        amountPaid: 210000,
        balance: 0,
        isPaid: true,
        paymentMethod: "Bank Transfer",
        reachedOut: true,
        goodsReceived: true,
        destination: "D-Line Base Depot, Port Harcourt",
      },
    ],
  },
  {
    id: "MNF-2025-012",
    truckPlate: "KJA-482-XY",
    driverName: "Malam Musa Danladi",
    driverPhone: "0802 762 6893",
    loadingDate: "05 Oct 2025, 06:00 AM",
    offloadingDate: "06 Oct 2025, 05:00 PM",
    containerSize: "40-ft Container",
    route: "Lagos (Alaba Base) → Port Harcourt (D-Line Base)",
    departureDate: "05 Oct 2025, 06:00 AM",
    status: "Offloaded",
    totalWeight: "25.0 Tons",
    isoDate: "2025-10-05T06:00:00.000Z",
    waybills: [
      {
        id: "MZ-2025-121",
        receiverName: "Rivers Agro-Allied Chemicals",
        receiverPhone: "0803 777 1144",
        itemQuantity: "40 Drums",
        itemNameDescription:
          "Industrial Water Treatment & Agricultural Formulations",
        amountCharged: 260000,
        amountPaid: 260000,
        balance: 0,
        isPaid: true,
        paymentMethod: "Bank Transfer",
        reachedOut: true,
        goodsReceived: true,
        destination: "Trans-Amadi, Port Harcourt",
      },
      {
        id: "MZ-2025-122",
        receiverName: "Chibuzor Auto Spares",
        receiverPhone: "0802 555 8833",
        itemQuantity: "15 Crates",
        itemNameDescription:
          "Commercial Truck Aluminium Radiators & Oil Coolers",
        amountCharged: 145000,
        amountPaid: 145000,
        balance: 0,
        isPaid: true,
        paymentMethod: "POS Terminal",
        reachedOut: true,
        goodsReceived: true,
        destination: "Mile 1 Market, Port Harcourt",
      },
    ],
  },
];

const defaultQuotes = [
  {
    id: "Q-9813F",
    name: "Okey & Sons Power Systems",
    phone: "+234 803 444 5511",
    pickup: "Alaba Base (Alaba Int'l Mkt, Ojo)",
    dropoff: "Mile 1 Market, Port Harcourt",
    cargo: "15 Bundles Solar Inverter DC Wiring & Busbars",
    weight: "heavy",
    loadingDate: "2026-09-09",
    notes: "Urgent shipment for commercial solar installation.",
    status: "New",
    createdAt: "2026-09-09T10:15:00.000Z",
    isoDate: "2026-09-09T10:15:00.000Z",
  },
  {
    id: "Q-9812A",
    name: "Adaeze Okoro",
    phone: "+234 803 111 2233",
    pickup: "Alaba Base (Alaba Int'l Mkt, Ojo)",
    dropoff: "PHC Base (29 Kaduna St, D-Line)",
    cargo: "18 Cartons Electronics (LED TVs & Soundbars)",
    weight: "medium",
    loadingDate: "2026-09-09",
    notes: "Needs arrival before Saturday market.",
    status: "New",
    createdAt: "2026-09-09T08:30:00.000Z",
    isoDate: "2026-09-09T08:30:00.000Z",
  },
  {
    id: "Q-9801G",
    name: "Eastern Marine Supply Ltd",
    phone: "+234 803 111 8844",
    pickup: "Lagos Port Terminal Warehouse",
    dropoff: "Marine Base Depot, Port Harcourt",
    cargo: "12 Crates Commercial Outboard Marine Engine Units",
    weight: "heavy",
    loadingDate: "2026-09-08",
    notes: "Heavy lift machinery, secure with high-tensile strapping.",
    status: "Contacted",
    createdAt: "2026-09-08T07:45:00.000Z",
    isoDate: "2026-09-08T07:45:00.000Z",
  },
  {
    id: "Q-9705H",
    name: "Top-Rank Electricals",
    phone: "+234 802 888 4400",
    pickup: "Alaba Base (Alaba Int'l Mkt, Ojo)",
    dropoff: "Ikwerre Road, Port Harcourt",
    cargo: "28 Cartons Circuit Breakers & Switchboards",
    weight: "medium",
    loadingDate: "2026-09-07",
    notes: "Standard loading at Alaba base.",
    status: "Converted",
    createdAt: "2026-09-07T08:00:00.000Z",
    isoDate: "2026-09-07T08:00:00.000Z",
  },
  {
    id: "Q-4412B",
    name: "Chief Kingsley Okafor",
    phone: "+234 805 444 5566",
    pickup: "Custom Lagos Warehouse Pickup",
    dropoff: "Doorstep Delivery in Port Harcourt",
    cargo: "40 Cartons Plumbing Materials",
    weight: "large",
    loadingDate: "2026-09-05",
    notes: "Forklift required for loading at warehouse.",
    status: "Contacted",
    createdAt: "2026-09-05T09:15:00.000Z",
    isoDate: "2026-09-05T09:15:00.000Z",
  },
  {
    id: "Q-3890J",
    name: "Prestige African Lace Fabrics",
    phone: "+234 803 555 9911",
    pickup: "Alaba Base (Alaba Int'l Mkt, Ojo)",
    dropoff: "Mile 1 Market, Port Harcourt",
    cargo: "30 Bales Premium Swiss & Voile Lace",
    weight: "medium",
    loadingDate: "2026-09-01",
    notes: "Direct shop delivery in Mile 1.",
    status: "Converted",
    createdAt: "2026-09-01T08:00:00.000Z",
    isoDate: "2026-09-01T08:00:00.000Z",
  },
  {
    id: "Q-3108C",
    name: "Dr. Uchechukwu Amadi",
    phone: "+234 802 888 7766",
    pickup: "Alaba Base (Alaba Int'l Mkt, Ojo)",
    dropoff: "PHC Base (29 Kaduna St, D-Line)",
    cargo: "8 Pallets Solar Batteries & Inverters",
    weight: "large",
    loadingDate: "2026-08-28",
    notes: "Sensitive electronic cargo, fragile handling required.",
    status: "Converted",
    createdAt: "2026-08-28T11:00:00.000Z",
    isoDate: "2026-08-28T11:00:00.000Z",
  },
  {
    id: "Q-1508D",
    name: "Madam Ngozi Fabrics",
    phone: "+234 809 333 2211",
    pickup: "Alaba Base (Alaba Int'l Mkt, Ojo)",
    dropoff: "Mile 1 Market, Port Harcourt",
    cargo: "25 Bale High-Grade Lace & Textiles",
    weight: "medium",
    loadingDate: "2026-08-15",
    notes: "Direct shop delivery in Mile 1.",
    status: "Converted",
    createdAt: "2026-08-15T14:20:00.000Z",
    isoDate: "2026-08-15T14:20:00.000Z",
  },
  {
    id: "Q-2207K",
    name: "Delta Power Systems Ltd",
    phone: "+234 803 666 4411",
    pickup: "Alaba Base (Alaba Int'l Mkt, Ojo)",
    dropoff: "Trans-Amadi, Port Harcourt",
    cargo: "12 Pallets Tubular Inverter Batteries",
    weight: "heavy",
    loadingDate: "2026-07-22",
    notes: "Heavy palletized goods.",
    status: "Converted",
    createdAt: "2026-07-22T09:00:00.000Z",
    isoDate: "2026-07-22T09:00:00.000Z",
  },
  {
    id: "Q-2025E",
    name: "Premier Tools Ltd",
    phone: "+234 803 444 9988",
    pickup: "Lagos Warehouse Pickup",
    dropoff: "Trans-Amadi, Port Harcourt",
    cargo: "50 Sacks Construction Fixings",
    weight: "heavy",
    loadingDate: "2025-11-12",
    notes: "Annual consignment contract.",
    status: "Converted",
    createdAt: "2025-11-12T10:00:00.000Z",
    isoDate: "2025-11-12T10:00:00.000Z",
  },
];

const defaultMessages = [
  {
    id: "M-1030D",
    name: "Engr. Nnamdi Chinedu",
    email: "nnamdi@delta-solar.ng",
    phone: "+234 803 555 2200",
    subject: "Full 40ft Container Booking for Solar Project",
    message:
      "We have 400 units of Tier-1 580W solar panels arriving at Lagos port next week. Can we schedule a dedicated 40ft container dispatch directly to Trans-Amadi Port Harcourt?",
    status: "Unread",
    createdAt: "2026-09-09T09:15:00.000Z",
    isoDate: "2026-09-09T09:15:00.000Z",
  },
  {
    id: "M-1029C",
    name: "Tunde Akin",
    email: "tunde@example.com",
    phone: "+234 806 222 1100",
    subject: "Bulk weekly merchant consignments",
    message:
      "We move 15–20 cartons of auto spares weekly from Alaba to Port Harcourt. Can we set up a corporate merchant account with scheduled manifest allocations?",
    status: "Unread",
    createdAt: "2026-09-09T07:45:00.000Z",
    isoDate: "2026-09-09T07:45:00.000Z",
  },
  {
    id: "M-1028Y",
    name: "Captain Douglas Peters",
    email: "douglas@easternmarine.ng",
    phone: "+234 803 111 8844",
    subject: "Marine Engine Dispatch Verification",
    message:
      "Confirming that our 12 outboard engine units have departed Lagos on trailer KJA-482-XY. Kindly notify us immediately the truck touches D-Line Base.",
    status: "Read",
    createdAt: "2026-09-08T08:30:00.000Z",
    isoDate: "2026-09-08T08:30:00.000Z",
  },
  {
    id: "M-1028B",
    name: "Grace Hart",
    email: "grace.hart@riversenergy.com",
    phone: "+234 803 777 9900",
    subject: "Solar Equipment Offloading in D-Line",
    message:
      "Confirming that our 16 pallets of solar panels were offloaded safely without any damage. Excellent handling, thank you team Mount Zion.",
    status: "Read",
    createdAt: "2026-09-05T16:30:00.000Z",
    isoDate: "2026-09-05T16:30:00.000Z",
  },
  {
    id: "M-1027X",
    name: "Chief Emeka Nzeribe",
    email: "emeka@nzeribeindustries.com",
    phone: "+234 802 999 8877",
    subject: "Industrial Copper Cable Delivery Confirmation",
    message:
      "Our 30 sacks of heavy copper cables and switchgears were received in perfect condition at Mile 1. Excellent service.",
    status: "Read",
    createdAt: "2026-09-04T17:00:00.000Z",
    isoDate: "2026-09-04T17:00:00.000Z",
  },
  {
    id: "M-0828A",
    name: "Barrister Ibe",
    email: "ibe@legaladvisors.ng",
    phone: "+234 802 123 4567",
    subject: "Corporate Waybill Agreement Inquiry",
    message:
      "Seeking a formal haulage transit contract for moving electrical sub-station hardware monthly between Lagos and Rivers State.",
    status: "Read",
    createdAt: "2026-08-28T09:10:00.000Z",
    isoDate: "2026-08-28T09:10:00.000Z",
  },
  {
    id: "M-0820W",
    name: "Dr. Kenneth Odili",
    email: "k.odili@atlanticdiagnostics.ng",
    phone: "+234 805 111 6677",
    subject: "Pharma Cold-Chain Consignments",
    message:
      "Inquiring about temperature-controlled cargo containers for our quarterly medical laboratory diagnostic reagent consignments to Rivers State hospitals.",
    status: "Read",
    createdAt: "2026-08-20T11:00:00.000Z",
    isoDate: "2026-08-20T11:00:00.000Z",
  },
  {
    id: "M-0722U",
    name: "High Chief Tamuno Briggs",
    email: "t.briggs@riversgroup.com",
    phone: "+234 803 666 4411",
    subject: "Quarterly Haulage Logistics Review",
    message:
      "Mount Zion has handled our heavy battery shipments with zero damage throughout Q2. We intend to increase our trailer allocation for Q3.",
    status: "Read",
    createdAt: "2026-07-22T14:30:00.000Z",
    isoDate: "2026-07-22T14:30:00.000Z",
  },
  {
    id: "M-2025Z",
    name: "Chukwuma Obi",
    email: "obi.industrial@yahoo.com",
    phone: "+234 805 678 9012",
    subject: "Port Harcourt Depot Warehouse Expansion",
    message:
      "Great service on our shipments during Q4. We look forward to doubling our container booking capacity for the coming business year.",
    status: "Read",
    createdAt: "2025-11-12T15:00:00.000Z",
    isoDate: "2025-11-12T15:00:00.000Z",
  },
];

const defaultDrivers = [
  {
    id: "DRV-01",
    name: "Malam Musa Danladi",
    phone: "0802 762 6893",
    vehicle: "KJA-482-XY (40-ft Container)",
    rating: "4.9/5.0 (24 trips)",
    photo: "",
  },
  {
    id: "DRV-02",
    name: "Godwin Uche",
    phone: "0803 502 7619",
    vehicle: "LSR-291-ZZ (20-ft Container)",
    rating: "4.8/5.0 (18 trips)",
    photo: "",
  },
  {
    id: "DRV-03",
    name: "Chukwudi Nweke",
    phone: "0706 718 7157",
    vehicle: "RUM-893-AA (40-ft Container)",
    rating: "5.0/5.0 (31 trips)",
    photo: "",
  },
  {
    id: "DRV-04",
    name: "Baridua Kobani",
    phone: "0803 444 8811",
    vehicle: "APP-712-XY (40-ft Container)",
    rating: "4.9/5.0 (15 trips)",
    photo: "",
  },
];

const defaultPHCDrivers = [
  {
    id: "PHD-01",
    name: "Baridua Kobani",
    phone: "0803 444 8811",
    vehicle: "Rivers Canter Truck (Rivers - 382-PHC)",
    zone: "Trans-Amadi & Industrial Area",
    guarantor: "Chief B. Kobani (Verified)",
    status: "Active / Available",
    joinedDate: "12 Jan 2026",
    photo: "",
  },
  {
    id: "PHD-02",
    name: "Ikechi Wosu",
    phone: "0805 777 2200",
    vehicle: "Hiace Cargo Van (Rivers - 104-DLINE)",
    zone: "Mile 1 Market & Town Dispatch",
    guarantor: "Dr. Wosu (Verified)",
    status: "On Local Delivery",
    joinedDate: "04 Feb 2026",
    photo: "",
  },
  {
    id: "PHD-03",
    name: "Tamuno Kalio",
    phone: "0802 888 3399",
    vehicle: "10-Tonne Flatbed (Rivers - 591-GRA)",
    zone: "Aba Road & Port Depot",
    guarantor: "Engr. Kalio (Verified)",
    status: "Active / Available",
    joinedDate: "20 Feb 2026",
    photo: "",
  },
];

const defaultStaff = [
  {
    id: "STF-01",
    name: "Alhaji Bashir M.",
    email: "bashir@mountzion.com",
    phone: "0802 111 0099",
    password: "0802 111 0099",
    role: "Executive Director",
    status: "Active",
    photo: "",
  },
  {
    id: "STF-02",
    name: "Tamuno Briggs",
    email: "tamuno@mountzion.com",
    phone: "0809 555 7788",
    password: "0809 555 7788",
    role: "PHC Depot Manager",
    status: "Active",
    photo: "",
  },
  {
    id: "STF-03",
    name: "Emeka Okafor",
    email: "emeka@mountzion.com",
    phone: "0803 222 1144",
    password: "0803 222 1144",
    role: "Lagos Base Officer",
    status: "Active",
    photo: "",
  },
  {
    id: "STF-04",
    name: "Folake Adeyemi",
    email: "folake@mountzion.com",
    phone: "0808 666 9900",
    password: "0808 666 9900",
    role: "Operations Supervisor",
    status: "Active",
    photo: "",
  },
];

const defaultTransactions = [
  {
    id: "TX-908",
    waybillId: "MZ-2026-903",
    customer: "Okey & Sons Power Systems",
    method: "Bank Transfer",
    amount: 95000,
    status: "Paid",
    date: "09 Sep 2026, 12:00 PM",
    isoDate: "2026-09-09T12:00:00.000Z",
  },
  {
    id: "TX-906",
    waybillId: "MZ-2026-901",
    customer: "Ken Motors Auto Spares",
    method: "Bank Transfer",
    amount: 110000,
    status: "Paid",
    date: "09 Sep 2026, 09:30 AM",
    isoDate: "2026-09-09T09:30:00.000Z",
  },
  {
    id: "TX-907",
    waybillId: "MZ-2026-902",
    customer: "Divine Grace Boutique",
    method: "POS Terminal",
    amount: 40000,
    status: "Partial",
    date: "09 Sep 2026, 11:15 AM",
    isoDate: "2026-09-09T11:15:00.000Z",
  },
  {
    id: "TX-891",
    waybillId: "MZ-2026-891",
    customer: "Eastern Marine Supply",
    method: "Bank Transfer",
    amount: 160000,
    status: "Paid",
    date: "08 Sep 2026, 08:30 AM",
    isoDate: "2026-09-08T08:30:00.000Z",
  },
  {
    id: "TX-892",
    waybillId: "MZ-2026-892",
    customer: "Mama Joy Wholesale Provisions",
    method: "POS Terminal",
    amount: 130000,
    status: "Paid",
    date: "08 Sep 2026, 10:15 AM",
    isoDate: "2026-09-08T10:15:00.000Z",
  },
  {
    id: "TX-871",
    waybillId: "MZ-2026-871",
    customer: "Top-Rank Electricals",
    method: "Bank Transfer",
    amount: 115000,
    status: "Paid",
    date: "07 Sep 2026, 09:00 AM",
    isoDate: "2026-09-07T09:00:00.000Z",
  },
  {
    id: "TX-872",
    waybillId: "MZ-2026-872",
    customer: "D-Line Auto Tech Workshop",
    method: "POS Terminal",
    amount: 60000,
    status: "Partial",
    date: "07 Sep 2026, 11:30 AM",
    isoDate: "2026-09-07T11:30:00.000Z",
  },
  {
    id: "TX-904",
    waybillId: "MZ-2026-104",
    customer: "Chinedu Eze",
    method: "POS Terminal",
    amount: 55000,
    status: "Paid",
    date: "05 Sep 2026, 01:20 PM",
    isoDate: "2026-09-05T13:20:00.000Z",
  },
  {
    id: "TX-905",
    waybillId: "MZ-2026-105",
    customer: "Blessed Hair & Beauty",
    method: "Bank Transfer",
    amount: 20000,
    status: "Partial",
    date: "05 Sep 2026, 02:10 PM",
    isoDate: "2026-09-05T14:10:00.000Z",
  },
  {
    id: "TX-901",
    waybillId: "MZ-2026-881",
    customer: "Adaeze Okoro",
    method: "Bank Transfer",
    amount: 75000,
    status: "Paid",
    date: "04 Sep 2026, 09:15 AM",
    isoDate: "2026-09-04T09:15:00.000Z",
  },
  {
    id: "TX-902",
    waybillId: "MZ-2026-882",
    customer: "Chidi Auto Works",
    method: "POS Terminal",
    amount: 100000,
    status: "Paid",
    date: "04 Sep 2026, 10:30 AM",
    isoDate: "2026-09-04T10:30:00.000Z",
  },
  {
    id: "TX-903",
    waybillId: "MZ-2026-883",
    customer: "Emeka & Sons Ltd",
    method: "Bank Transfer",
    amount: 95000,
    status: "Paid",
    date: "04 Sep 2026, 11:45 AM",
    isoDate: "2026-09-04T11:45:00.000Z",
  },
  {
    id: "TX-890",
    waybillId: "MZ-2026-552",
    customer: "Chukwudi N. (Building Solutions)",
    method: "Bank Transfer",
    amount: 180000,
    status: "Paid",
    date: "01 Sep 2026, 08:30 AM",
    isoDate: "2026-09-01T08:30:00.000Z",
  },
  {
    id: "TX-889",
    waybillId: "MZ-2026-553",
    customer: "Prestige African Lace Fabrics",
    method: "Bank Transfer",
    amount: 140000,
    status: "Paid",
    date: "01 Sep 2026, 10:45 AM",
    isoDate: "2026-09-01T10:45:00.000Z",
  },
  {
    id: "TX-850",
    waybillId: "MZ-2026-381",
    customer: "Rivers Solar & Energy Ltd",
    method: "Bank Transfer",
    amount: 240000,
    status: "Paid",
    date: "28 Aug 2026, 10:00 AM",
    isoDate: "2026-08-28T10:00:00.000Z",
  },
  {
    id: "TX-851",
    waybillId: "MZ-2026-382",
    customer: "Noble Pharma Depot",
    method: "POS Terminal",
    amount: 125000,
    status: "Paid",
    date: "28 Aug 2026, 02:40 PM",
    isoDate: "2026-08-28T14:40:00.000Z",
  },
  {
    id: "TX-840",
    waybillId: "MZ-2026-361",
    customer: "Niger Delta Hardware Corp",
    method: "Bank Transfer",
    amount: 220000,
    status: "Paid",
    date: "20 Aug 2026, 09:30 AM",
    isoDate: "2026-08-20T09:30:00.000Z",
  },
  {
    id: "TX-841",
    waybillId: "MZ-2026-362",
    customer: "Atlantic Diagnostic Lab Supplies",
    method: "POS Terminal",
    amount: 150000,
    status: "Paid",
    date: "20 Aug 2026, 01:15 PM",
    isoDate: "2026-08-20T13:15:00.000Z",
  },
  {
    id: "TX-820",
    waybillId: "MZ-2026-351",
    customer: "Gold Crest Electricals",
    method: "Bank Transfer",
    amount: 195000,
    status: "Paid",
    date: "15 Aug 2026, 11:20 AM",
    isoDate: "2026-08-15T11:20:00.000Z",
  },
  {
    id: "TX-810",
    waybillId: "MZ-2026-291",
    customer: "Delta Power Systems",
    method: "Bank Transfer",
    amount: 290000,
    status: "Paid",
    date: "22 Jul 2026, 08:45 AM",
    isoDate: "2026-07-22T08:45:00.000Z",
  },
  {
    id: "TX-811",
    waybillId: "MZ-2026-292",
    customer: "PharmaPlus Healthcare Clinics",
    method: "Bank Transfer",
    amount: 135000,
    status: "Paid",
    date: "22 Jul 2026, 11:00 AM",
    isoDate: "2026-07-22T11:00:00.000Z",
  },
  {
    id: "TX-780",
    waybillId: "MZ-2026-241",
    customer: "Golden Gate Electronics",
    method: "Bank Transfer",
    amount: 185000,
    status: "Paid",
    date: "14 Jun 2026, 09:30 AM",
    isoDate: "2026-06-14T09:30:00.000Z",
  },
  {
    id: "TX-710",
    waybillId: "MZ-2025-181",
    customer: "Heritage Hardware Wholesale",
    method: "Bank Transfer",
    amount: 210000,
    status: "Paid",
    date: "12 Nov 2025, 09:00 AM",
    isoDate: "2025-11-12T09:00:00.000Z",
  },
  {
    id: "TX-620",
    waybillId: "MZ-2025-121",
    customer: "Rivers Agro-Allied Chemicals",
    method: "Bank Transfer",
    amount: 260000,
    status: "Paid",
    date: "05 Oct 2025, 09:00 AM",
    isoDate: "2025-10-05T09:00:00.000Z",
  },
  {
    id: "TX-621",
    waybillId: "MZ-2025-122",
    customer: "Chibuzor Auto Spares",
    method: "POS Terminal",
    amount: 145000,
    status: "Paid",
    date: "05 Oct 2025, 11:30 AM",
    isoDate: "2025-10-05T11:30:00.000Z",
  },
];

const defaultAuditLogs = [
  {
    timestamp: "Today, 11:45 AM",
    user: "Super Admin",
    action: "Assigned 40-ft container to driver",
    target: "MNF-2026-045 (Plate APP-712-XY)",
  },
  {
    timestamp: "Today, 09:35 AM",
    user: "Emeka Okafor",
    action: "Logged payment receipt",
    target: "MZ-2026-901 (₦110,000)",
  },
  {
    timestamp: "Yesterday, 08:30 AM",
    user: "Super Admin",
    action: "Dispatched 40-ft container",
    target: "MNF-2026-043B (Plate KJA-482-XY)",
  },
  {
    timestamp: "07 Sep 2026, 05:00 PM",
    user: "Tamuno Briggs",
    action: "Arrived at D-Line Depot",
    target: "MNF-2026-043A (Plate LSR-291-ZZ)",
  },
  {
    timestamp: "05 Sep 2026, 09:15 AM",
    user: "Folake Adeyemi",
    action: "Verified Bank Transfer",
    target: "MZ-2026-881 (₦75,000)",
  },
  {
    timestamp: "04 Sep 2026, 06:00 AM",
    user: "Super Admin",
    action: "Dispatched 40-ft container",
    target: "MNF-2026-042 (Plate KJA-482-XY)",
  },
  {
    timestamp: "01 Sep 2026, 08:30 AM",
    user: "Emeka Okafor",
    action: "Recorded waybill collection",
    target: "MZ-2026-552 (₦180,000)",
  },
  {
    timestamp: "28 Aug 2026, 10:00 AM",
    user: "Super Admin",
    action: "Cleared 40-ft container delivery",
    target: "MNF-2026-038 (Plate KJA-482-XY)",
  },
];

const defaultPricing = {
  smallWrap: 2500,
  mediumWrap: 4500,
  bigWrap: 7500,
  smallCarton: 3500,
  mediumCarton: 5500,
  bigCarton: 9000,
  batteryRates: {
    "12v-100ah": 12000,
    "12v-200ah": 16000,
    "24v-100ah": 16000,
    "24v-200ah": 20000,
    "48v-100ah": 22000,
    "48v-200ah": 28000,
    "48v-300ah": 36000,
  },
  inverterRates: {
    "1kva-12v": 8500,
    "2.5kva-24v": 12500,
    "3.5kva-24v": 15000,
    "5kva-48v": 19500,
    "7.5kva-48v": 26000,
    "10kva-48v": 34000,
    "15kva-3p": 48000,
  },
  solarPanelRates: {
    "50w-80w": 3500,
    "100w-120w": 4500,
    "150w-180w": 6000,
    "200w-250w": 7500,
    "300w-330w": 9500,
    "350w-380w": 11000,
    "400w-420w": 13000,
    "450w-480w": 14500,
    "500w-530w": 15500,
    "550w-580w": 16500,
    "600w-630w": 18500,
    "650w-700w": 21500,
    "700w-750w": 25000,
    "box-2pcs": 28000,
    "pack-4pcs": 52000,
    "pack-6pcs": 75000,
    "pack-8pcs": 96000,
    "crate-10-12pcs": 120000,
    "pallet-15-20pcs": 165000,
    "pallet-30-36pcs": 245000,
    "pallet-60pcs-double": 460000,
    "150w-200w": 6500,
    "300w-350w": 10500,
    "400w-450w": 13500,
    "550w-600w": 16500,
    "pallet-30pcs": 245000,
  },
};

function initAllStores(forceReset = false) {
  const existingM = localStorage.getItem(STORAGE_KEYS.manifests);
  let parsedM = [];
  try {
    parsedM = JSON.parse(existingM || "[]");
  } catch (e) {
    parsedM = [];
  }
  if (forceReset || !existingM || parsedM.length < defaultManifests.length) {
    localStorage.setItem(
      STORAGE_KEYS.manifests,
      JSON.stringify(defaultManifests),
    );
  }

  const existingQ = localStorage.getItem(STORAGE_KEYS.quotes);
  let parsedQ = [];
  try {
    parsedQ = JSON.parse(existingQ || "[]");
  } catch (e) {
    parsedQ = [];
  }
  if (forceReset || !existingQ || parsedQ.length < defaultQuotes.length) {
    localStorage.setItem(STORAGE_KEYS.quotes, JSON.stringify(defaultQuotes));
  }

  const existingMsg = localStorage.getItem(STORAGE_KEYS.messages);
  let parsedMsg = [];
  try {
    parsedMsg = JSON.parse(existingMsg || "[]");
  } catch (e) {
    parsedMsg = [];
  }
  if (forceReset || !existingMsg || parsedMsg.length < defaultMessages.length) {
    localStorage.setItem(
      STORAGE_KEYS.messages,
      JSON.stringify(defaultMessages),
    );
  }

  const existingFin = localStorage.getItem(STORAGE_KEYS.finance);
  let parsedFin = [];
  try {
    parsedFin = JSON.parse(existingFin || "[]");
  } catch (e) {
    parsedFin = [];
  }
  if (
    forceReset ||
    !existingFin ||
    parsedFin.length < defaultTransactions.length
  ) {
    localStorage.setItem(
      STORAGE_KEYS.finance,
      JSON.stringify(defaultTransactions),
    );
  }

  const existingAudit = localStorage.getItem(STORAGE_KEYS.audit);
  let parsedAudit = [];
  try {
    parsedAudit = JSON.parse(existingAudit || "[]");
  } catch (e) {
    parsedAudit = [];
  }
  if (
    forceReset ||
    !existingAudit ||
    parsedAudit.length < defaultAuditLogs.length
  ) {
    localStorage.setItem(STORAGE_KEYS.audit, JSON.stringify(defaultAuditLogs));
  }

  if (forceReset || !localStorage.getItem(STORAGE_KEYS.drivers))
    localStorage.setItem(STORAGE_KEYS.drivers, JSON.stringify(defaultDrivers));
  if (forceReset || !localStorage.getItem(STORAGE_KEYS.phcDrivers))
    localStorage.setItem(
      STORAGE_KEYS.phcDrivers,
      JSON.stringify(defaultPHCDrivers),
    );
  if (forceReset || !localStorage.getItem(STORAGE_KEYS.staff))
    localStorage.setItem(STORAGE_KEYS.staff, JSON.stringify(defaultStaff));
  if (forceReset || !localStorage.getItem(STORAGE_KEYS.pricing))
    localStorage.setItem(STORAGE_KEYS.pricing, JSON.stringify(defaultPricing));
  if (!localStorage.getItem(STORAGE_KEYS.activeStaffUser))
    localStorage.setItem(
      STORAGE_KEYS.activeStaffUser,
      JSON.stringify({ name: "Tamuno Briggs", role: "Port Harcourt" }),
    );
  if (!localStorage.getItem(STORAGE_KEYS.auth))
    localStorage.setItem(STORAGE_KEYS.auth, "1");
  if (!localStorage.getItem(STORAGE_KEYS.superAuth))
    localStorage.setItem(STORAGE_KEYS.superAuth, "1");
}

const AppStore = {
  init() {
    initAllStores();
  },

  getItemDate(item) {
    if (!item) return new Date();
    return (
      item.isoDate ||
      item.loadingDate ||
      item.createdAt ||
      item.date ||
      item.departureDate ||
      new Date()
    );
  },

  filterByPeriod(items, periodType = "all", periodValue = "") {
    if (!Array.isArray(items)) return [];
    if (!periodType || periodType === "all") return items;

    return items.filter((item) => {
      const itemDate = this.getItemDate(item);
      if (periodType === "day") {
        if (!periodValue) return true;
        return DateUtils.getDayKey(itemDate) === periodValue;
      }
      if (periodType === "week") {
        if (!periodValue) return true;
        return DateUtils.getWeekKey(itemDate) === periodValue;
      }
      if (periodType === "month") {
        if (!periodValue) return true;
        return DateUtils.getMonthKey(itemDate) === periodValue;
      }
      if (periodType === "year") {
        if (!periodValue) return true;
        return DateUtils.getYearKey(itemDate) === periodValue;
      }
      return true;
    });
  },

  getAvailablePeriods(items) {
    if (!Array.isArray(items))
      return { days: [], weeks: [], months: [], years: [] };
    const dayMap = new Map();
    const weekMap = new Map();
    const monthMap = new Map();
    const yearMap = new Map();

    items.forEach((item) => {
      const d = this.getItemDate(item);
      const dayKey = DateUtils.getDayKey(d);
      const weekKey = DateUtils.getWeekKey(d);
      const monthKey = DateUtils.getMonthKey(d);
      const yearKey = DateUtils.getYearKey(d);

      if (!dayMap.has(dayKey)) {
        dayMap.set(dayKey, {
          key: dayKey,
          label: DateUtils.formatDayFull(d),
          rawDate: DateUtils.parseDate(d),
        });
      }
      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, {
          key: weekKey,
          label: DateUtils.formatWeek(d),
          rawDate: DateUtils.parseDate(d),
        });
      }
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {
          key: monthKey,
          label: DateUtils.formatMonth(d),
          rawDate: DateUtils.parseDate(d),
        });
      }
      if (!yearMap.has(yearKey)) {
        yearMap.set(yearKey, {
          key: yearKey,
          label: DateUtils.formatYear(d),
          rawDate: DateUtils.parseDate(d),
        });
      }
    });

    const sortByDateDesc = (a, b) => b.rawDate - a.rawDate;

    return {
      days: Array.from(dayMap.values()).sort(sortByDateDesc),
      weeks: Array.from(weekMap.values()).sort(sortByDateDesc),
      months: Array.from(monthMap.values()).sort(sortByDateDesc),
      years: Array.from(yearMap.values()).sort(sortByDateDesc),
    };
  },

  groupItemsByPeriod(items, periodType = "day") {
    if (!Array.isArray(items)) return [];
    const groupsMap = new Map();

    items.forEach((item) => {
      const d = this.getItemDate(item);
      let key = "";
      let title = "";

      if (periodType === "month") {
        key = DateUtils.getMonthKey(d);
        title = DateUtils.formatMonth(d);
      } else if (periodType === "year") {
        key = DateUtils.getYearKey(d);
        title = "Year " + DateUtils.formatYear(d);
      } else if (periodType === "week") {
        key = DateUtils.getWeekKey(d);
        let tag = "";
        if (DateUtils.isThisWeek(d)) tag = " (This Week)";
        title = DateUtils.formatWeek(d) + tag;
      } else {
        key = DateUtils.getDayKey(d);
        let tag = "";
        if (DateUtils.isToday(d)) tag = " (Today)";
        else if (DateUtils.isYesterday(d)) tag = " (Yesterday)";
        title = DateUtils.formatDayFull(d) + tag;
      }

      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          key,
          title,
          periodType,
          items: [],
          rawDate: DateUtils.parseDate(d),
        });
      }
      groupsMap.get(key).items.push(item);
    });

    return Array.from(groupsMap.values()).sort((a, b) => b.rawDate - a.rawDate);
  },

  getManifests() {
    this.init();
    let manifests = [];
    try {
      manifests = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.manifests) || "[]",
      );
    } catch (e) {
      manifests = [];
    }
    if (!Array.isArray(manifests) || manifests.length === 0) {
      manifests = JSON.parse(JSON.stringify(defaultManifests));
      this.saveManifests(manifests);
    }
    // Normalize manifests and waybills
    manifests = manifests.map((m) => {
      if (m.containerSize && m.containerSize.includes("40")) {
        m.containerSize = "40-ft Container";
      } else if (m.containerSize && m.containerSize.includes("20")) {
        m.containerSize = "20-ft Container";
      } else if (!m.containerSize) {
        m.containerSize = "40-ft Container";
      }
      if (
        m.status === "Loading at Alaba Base" ||
        m.status === "Loading at Base"
      ) {
        m.status = "Loading";
      }
      if (
        m.status === "Offloaded & Closed" ||
        m.status === "Offloaded and Closed"
      ) {
        m.status = "Offloaded";
      }
      delete m.vendor;
      if (Array.isArray(m.waybills)) {
        m.waybills = m.waybills.map((w) => {
          const charged = Number(w.amountCharged) || 0;
          const paid = Number(w.amountPaid) || 0;
          const balance = Math.max(0, charged - paid);
          let method = w.paymentMethod || "Bank Transfer";
          if (method.toLowerCase().includes("cash")) {
            method = "POS Terminal";
          }
          return {
            ...w,
            amountCharged: charged,
            amountPaid: paid,
            balance,
            isPaid: paid >= charged,
            paymentMethod: method,
            reachedOut: Boolean(w.reachedOut),
            goodsReceived: Boolean(w.goodsReceived),
          };
        });
      }
      return m;
    });
    return manifests;
  },
  saveManifests(data) {
    localStorage.setItem(STORAGE_KEYS.manifests, JSON.stringify(data));
  },

  getManifestById(id) {
    return this.getManifests().find((m) => m.id === id);
  },

  updateWaybillInManifest(manifestId, waybillId, updates) {
    const manifests = this.getManifests();
    const manifest = manifests.find((m) => m.id === manifestId);
    if (!manifest || !manifest.waybills) return null;

    const waybill = manifest.waybills.find((w) => w.id === waybillId);
    if (!waybill) return null;

    Object.assign(waybill, updates);

    if (
      typeof waybill.amountCharged === "number" &&
      typeof waybill.amountPaid === "number"
    ) {
      waybill.balance = Math.max(0, waybill.amountCharged - waybill.amountPaid);
      waybill.isPaid = waybill.amountPaid >= waybill.amountCharged;
    }

    this.saveManifests(manifests);
    this.logAudit(
      `Updated waybill ${waybillId}`,
      `${manifestId} (Paid: ₦${(waybill.amountPaid || 0).toLocaleString()}, Bal: ₦${(waybill.balance || 0).toLocaleString()})`,
    );
    return manifest;
  },

  getDailyRevenue() {
    this.init();
    const manifests = this.filterByPeriod(this.getManifests(), "day");
    let total = 0;
    manifests.forEach((m) => {
      if (m.waybills) {
        m.waybills.forEach((w) => {
          total += Number(w.amountPaid) || 0;
        });
      }
    });
    return total;
  },

  getFinancialMetrics(periodType = "all", periodValue = "") {
    this.init();
    const manifests = this.filterByPeriod(
      this.getManifests(),
      periodType,
      periodValue,
    );
    const financeTxs = this.filterByPeriod(
      this.getFinance(),
      periodType,
      periodValue,
    );

    let totalBilling = 0;
    let totalPaid = 0;
    let totalWaybills = 0;
    let bankTransferTotal = 0;
    let posTotal = 0;

    manifests.forEach((m) => {
      if (Array.isArray(m.waybills)) {
        m.waybills.forEach((w) => {
          const charged = Number(w.amountCharged) || 0;
          const paid = Number(w.amountPaid) || 0;
          totalBilling += charged;
          totalPaid += paid;
          totalWaybills += 1;

          if (w.paymentMethod === "POS Terminal") posTotal += paid;
          else bankTransferTotal += paid;
        });
      }
    });

    const totalTxAmount = financeTxs.reduce((acc, t) => {
      const amt =
        typeof t.amount === "number"
          ? t.amount
          : parseInt(String(t.amount || 0).replace(/[^0-9]/g, ""), 10) || 0;
      return acc + amt;
    }, 0);

    const effectivePaid = Math.max(totalPaid, totalTxAmount);
    const totalBalance = Math.max(0, totalBilling - effectivePaid);
    const estimatedExpenses = Math.round(effectivePaid * 0.45);
    const netProfit = Math.max(0, effectivePaid - estimatedExpenses);
    const profitMargin =
      effectivePaid > 0
        ? ((netProfit / effectivePaid) * 100).toFixed(1)
        : "0.0";

    return {
      periodType,
      periodValue,
      totalManifests: manifests.length,
      totalWaybills,
      totalBilling,
      totalPaid: effectivePaid,
      totalBalance,
      estimatedExpenses,
      netProfit,
      profitMargin,
      bankTransferTotal,
      posTotal,
      transactionsCount: financeTxs.length,
    };
  },

  getActiveStaff() {
    this.init();
    return JSON.parse(
      localStorage.getItem(STORAGE_KEYS.activeStaffUser) ||
        '{"name":"Tamuno Briggs","role":"Port Harcourt"}',
    );
  },

  setActiveStaff(staffObj) {
    localStorage.setItem(
      STORAGE_KEYS.activeStaffUser,
      JSON.stringify(staffObj),
    );
  },

  getQuotes() {
    this.init();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.quotes) || "[]");
  },
  saveQuotes(data) {
    localStorage.setItem(STORAGE_KEYS.quotes, JSON.stringify(data));
  },
  getMessages() {
    this.init();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.messages) || "[]");
  },
  saveMessages(data) {
    localStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(data));
  },
  getDrivers() {
    this.init();
    const drivers = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.drivers) || "[]",
    );
    return drivers.map((d) => {
      delete d.license;
      delete d.docs;
      return d;
    });
  },
  saveDrivers(data) {
    localStorage.setItem(STORAGE_KEYS.drivers, JSON.stringify(data));
  },
  getPHCDrivers() {
    this.init();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.phcDrivers) || "[]");
  },
  savePHCDrivers(data) {
    localStorage.setItem(STORAGE_KEYS.phcDrivers, JSON.stringify(data));
  },
  getStaff() {
    this.init();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.staff) || "[]");
  },
  getFinance() {
    this.init();
    const txs = JSON.parse(localStorage.getItem(STORAGE_KEYS.finance) || "[]");
    return txs.map((t) => {
      if (t.method && t.method.toLowerCase().includes("cash")) {
        t.method = "POS Terminal";
      }
      return t;
    });
  },
  saveFinance(data) {
    localStorage.setItem(STORAGE_KEYS.finance, JSON.stringify(data));
  },
  getAudit() {
    this.init();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.audit) || "[]");
  },

  getPricing() {
    this.init();
    const saved = localStorage.getItem(STORAGE_KEYS.pricing);
    if (!saved) return { ...defaultPricing };
    try {
      const parsed = JSON.parse(saved);
      return {
        ...defaultPricing,
        ...parsed,
        batteryRates: {
          ...defaultPricing.batteryRates,
          ...(parsed.batteryRates || {}),
        },
        inverterRates: {
          ...defaultPricing.inverterRates,
          ...(parsed.inverterRates || {}),
        },
        solarPanelRates: {
          ...defaultPricing.solarPanelRates,
          ...(parsed.solarPanelRates || {}),
        },
      };
    } catch (e) {
      return { ...defaultPricing };
    }
  },

  savePricing(data) {
    localStorage.setItem(STORAGE_KEYS.pricing, JSON.stringify(data));
    this.logAudit(
      "Updated System & Delivery Pricing",
      "Base wraps, cartons, solar panels, batteries & inverter rates",
    );
  },

  logAudit(action, target) {
    const logs = this.getAudit();
    const activeStaff = this.getActiveStaff();
    const newLog = {
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      user: activeStaff
        ? activeStaff.name || activeStaff.role || "Super Admin"
        : "Super Admin",
      action,
      target,
    };
    localStorage.setItem(STORAGE_KEYS.audit, JSON.stringify([newLog, ...logs]));
  },
};

window.AppStore = AppStore;
AppStore.init();

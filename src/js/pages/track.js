// Mount Zion — Live Waybill & Manifest Tracker
document.addEventListener("DOMContentLoaded", () => {
  const trackForm =
    document.getElementById("tracking-form") ||
    document.getElementById("track-form");
  const trackInput =
    document.getElementById("tracking-input") ||
    document.getElementById("track-input");
  const trackResult =
    document.getElementById("tracking-results") ||
    document.getElementById("track-result-container");

  function executeTracking(queryCode) {
    if (!queryCode || !trackResult) return;
    const code = queryCode.trim().toUpperCase();
    if (trackInput) trackInput.value = code;

    const manifests =
      typeof AppStore !== "undefined" && AppStore.getManifests
        ? AppStore.getManifests()
        : [];

    let matchedManifest = null;
    let matchedWaybill = null;

    manifests.forEach((m) => {
      if (m.id && m.id.toUpperCase() === code) {
        matchedManifest = m;
      }
      (m.waybills || []).forEach((w) => {
        if (w.id && w.id.toUpperCase() === code) {
          matchedWaybill = w;
          matchedManifest = m;
        }
      });
    });

    if (matchedManifest) {
      renderTrackingResult(matchedManifest, matchedWaybill, code);
    } else {
      trackResult.innerHTML = `
        <div class="p-6 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-center space-y-2">
          <h4 class="font-bold text-red-700 dark:text-red-300">Tracking ID Not Found</h4>
          <p class="text-xs text-muted-foreground">We could not find waybill or manifest matching "<strong>${code}</strong>". Please verify your Waybill ID (e.g. MZ-2026-881, MNF-2026-042) or contact our Lagos base hotline.</p>
        </div>
      `;
      trackResult.classList.remove("hidden");
    }

    try {
      trackResult.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (e) {}
  }

  if (trackForm && trackInput) {
    trackForm.addEventListener("submit", (e) => {
      e.preventDefault();
      executeTracking(trackInput.value);
    });
  }

  // Attach event handlers to sample quick track buttons
  document.querySelectorAll(".sample-track-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const sampleId = btn.dataset.id || btn.getAttribute("data-id");
      if (sampleId) {
        executeTracking(sampleId);
      }
    });
  });

  // Check URL parameters for direct deep-linking (e.g. track.html?waybill=MZ-2026-881)
  try {
    const params = new URLSearchParams(window.location.search);
    const initialWaybill = params.get("waybill") || params.get("id");
    if (initialWaybill) {
      executeTracking(initialWaybill);
    }
  } catch (err) {}

  function renderTrackingResult(m, w, query) {
    trackResult.innerHTML = `
      <div class="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-md space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <span class="text-xs font-bold uppercase text-primary tracking-wider">${w ? "Consolidated Waybill Package" : "Truck Manifest Dispatch"}</span>
            <h3 class="text-xl font-bold font-poppins text-foreground mt-0.5">${query}</h3>
          </div>
          <span class="px-3.5 py-1 rounded-full text-xs font-bold bg-primary text-white">${m.status}</span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-surface p-4 rounded-2xl border border-border">
          <div><strong class="text-muted-foreground block">Assigned Truck:</strong> <span class="font-bold text-foreground">${m.truckPlate}</span></div>
          <div><strong class="text-muted-foreground block">Container Spec:</strong> <span>${m.containerSize}</span></div>
          <div><strong class="text-muted-foreground block">Driver:</strong> <span>${m.driverName || "Assigned Driver"} (${m.driverPhone || "N/A"})</span></div>
          <div><strong class="text-muted-foreground block">Departure:</strong> <span>${m.departureDate || m.loadingDate || "Scheduled"}</span></div>
        </div>

        ${
          w
            ? `
          <div class="p-4 rounded-2xl border border-border space-y-1 text-xs">
            <div><strong>Shipper / Consignee:</strong> ${w.customer || "Commercial Merchant"}</div>
            <div><strong>Cargo Manifested:</strong> ${w.items || "General Cargo"} (${w.weight || "Standard Weight"})</div>
            <div><strong>PHC Dropoff Base:</strong> ${w.destination || "Port Harcourt (D-Line Depot)"}</div>
          </div>
        `
            : ""
        }

        <div class="space-y-3 pt-2">
          <h4 class="font-bold text-sm text-foreground">Route Checkpoints</h4>
          <div class="space-y-2 border-l-2 border-primary/40 ml-2 pl-4 text-xs">
            <div class="relative"><span class="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-emerald-600"></span><strong>Lagos (Alaba Base):</strong> Goods consolidated and container sealed</div>
            <div class="relative"><span class="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full ${m.status === "In Transit" || (m.status && m.status.includes("PHC")) || m.status === "Offloading" || m.status === "Offloaded" ? "bg-emerald-600" : "bg-muted-foreground"}"></span><strong>Ore – Benin Highway:</strong> Transit route checkpoint</div>
            <div class="relative"><span class="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full ${m.status && (m.status.includes("PHC") || m.status === "Offloading" || m.status === "Offloaded") ? "bg-emerald-600" : "bg-muted-foreground"}"></span><strong>Port Harcourt (D-Line Depot):</strong> Offloading and collection</div>
          </div>
        </div>
      </div>
    `;
    trackResult.classList.remove("hidden");
  }
});

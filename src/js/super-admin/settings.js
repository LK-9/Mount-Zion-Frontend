// Super Admin Delivery Pricing Parameters & Settings
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-system-settings');
  if (!form) return;

  const smallWrapInput = document.getElementById('rate-small-wrap');
  const mediumWrapInput = document.getElementById('rate-medium-wrap');
  const bigWrapInput = document.getElementById('rate-big-wrap');
  const smallCartonInput = document.getElementById('rate-small-carton');
  const mediumCartonInput = document.getElementById('rate-medium-carton');
  const bigCartonInput = document.getElementById('rate-big-carton');

  const batterySelect = document.getElementById('battery-rating-select');
  const batteryRateInput = document.getElementById('rate-lithium-battery');
  const displayBatteryCost = document.getElementById('display-battery-cost');

  const inverterSelect = document.getElementById('inverter-rating-select');
  const inverterRateInput = document.getElementById('rate-inverter');
  const displayInverterCost = document.getElementById('display-inverter-cost');

  const solarPanelSelect = document.getElementById('solar-panel-rating-select');
  const solarPanelRateInput = document.getElementById('rate-solar-panel');
  const displaySolarPanelCost = document.getElementById('display-solar-panel-cost');

  // Load current pricing
  let pricing = AppStore.getPricing();

  // Populate base inputs
  if (smallWrapInput && pricing.smallWrap !== undefined) smallWrapInput.value = pricing.smallWrap;
  if (mediumWrapInput && pricing.mediumWrap !== undefined) mediumWrapInput.value = pricing.mediumWrap;
  if (bigWrapInput && pricing.bigWrap !== undefined) bigWrapInput.value = pricing.bigWrap;
  if (smallCartonInput && pricing.smallCarton !== undefined) smallCartonInput.value = pricing.smallCarton;
  if (mediumCartonInput && pricing.mediumCarton !== undefined) mediumCartonInput.value = pricing.mediumCarton;
  if (bigCartonInput && pricing.bigCarton !== undefined) bigCartonInput.value = pricing.bigCarton;

  // Battery rating handler
  function syncBatteryRating() {
    if (!batterySelect || !batteryRateInput) return;
    const selectedKey = batterySelect.value;
    const currentRate = (pricing.batteryRates && pricing.batteryRates[selectedKey] !== undefined)
      ? pricing.batteryRates[selectedKey]
      : (Number(batteryRateInput.value) || 22000);
    batteryRateInput.value = currentRate;
    if (displayBatteryCost) {
      displayBatteryCost.textContent = `₦${Number(currentRate).toLocaleString()}`;
    }
  }

  // Inverter rating handler
  function syncInverterRating() {
    if (!inverterSelect || !inverterRateInput) return;
    const selectedKey = inverterSelect.value;
    const currentRate = (pricing.inverterRates && pricing.inverterRates[selectedKey] !== undefined)
      ? pricing.inverterRates[selectedKey]
      : (Number(inverterRateInput.value) || 19500);
    inverterRateInput.value = currentRate;
    if (displayInverterCost) {
      displayInverterCost.textContent = `₦${Number(currentRate).toLocaleString()}`;
    }
  }

  // Solar Panel rating handler
  function syncSolarPanelRating() {
    if (!solarPanelSelect || !solarPanelRateInput) return;
    const selectedKey = solarPanelSelect.value;
    const currentRate = (pricing.solarPanelRates && pricing.solarPanelRates[selectedKey] !== undefined)
      ? pricing.solarPanelRates[selectedKey]
      : (Number(solarPanelRateInput.value) || 16000);
    solarPanelRateInput.value = currentRate;
    if (displaySolarPanelCost) {
      displaySolarPanelCost.textContent = `₦${Number(currentRate).toLocaleString()}`;
    }
  }

  // Initial sync
  syncBatteryRating();
  syncInverterRating();
  syncSolarPanelRating();

  // Event Listeners for Battery
  batterySelect?.addEventListener('change', () => {
    syncBatteryRating();
  });

  batteryRateInput?.addEventListener('input', () => {
    const val = Number(batteryRateInput.value) || 0;
    if (!pricing.batteryRates) pricing.batteryRates = {};
    pricing.batteryRates[batterySelect.value] = val;
    if (displayBatteryCost) {
      displayBatteryCost.textContent = `₦${val.toLocaleString()}`;
    }
  });

  // Event Listeners for Inverter
  inverterSelect?.addEventListener('change', () => {
    syncInverterRating();
  });

  inverterRateInput?.addEventListener('input', () => {
    const val = Number(inverterRateInput.value) || 0;
    if (!pricing.inverterRates) pricing.inverterRates = {};
    pricing.inverterRates[inverterSelect.value] = val;
    if (displayInverterCost) {
      displayInverterCost.textContent = `₦${val.toLocaleString()}`;
    }
  });

  // Event Listeners for Solar Panels
  solarPanelSelect?.addEventListener('change', () => {
    syncSolarPanelRating();
  });

  solarPanelRateInput?.addEventListener('input', () => {
    const val = Number(solarPanelRateInput.value) || 0;
    if (!pricing.solarPanelRates) pricing.solarPanelRates = {};
    pricing.solarPanelRates[solarPanelSelect.value] = val;
    if (displaySolarPanelCost) {
      displaySolarPanelCost.textContent = `₦${val.toLocaleString()}`;
    }
  });

  // Save Settings
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    pricing.smallWrap = Number(smallWrapInput?.value) || 2500;
    pricing.mediumWrap = Number(mediumWrapInput?.value) || 4500;
    pricing.bigWrap = Number(bigWrapInput?.value) || 7500;
    pricing.smallCarton = Number(smallCartonInput?.value) || 3500;
    pricing.mediumCarton = Number(mediumCartonInput?.value) || 5500;
    pricing.bigCarton = Number(bigCartonInput?.value) || 9000;

    if (!pricing.batteryRates) pricing.batteryRates = {};
    if (batterySelect && batteryRateInput) {
      pricing.batteryRates[batterySelect.value] = Number(batteryRateInput.value) || 22000;
    }

    if (!pricing.inverterRates) pricing.inverterRates = {};
    if (inverterSelect && inverterRateInput) {
      pricing.inverterRates[inverterSelect.value] = Number(inverterRateInput.value) || 19500;
    }

    if (!pricing.solarPanelRates) pricing.solarPanelRates = {};
    if (solarPanelSelect && solarPanelRateInput) {
      pricing.solarPanelRates[solarPanelSelect.value] = Number(solarPanelRateInput.value) || 16000;
    }

    AppStore.savePricing(pricing);

    // Provide visual feedback
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      const originalHtml = submitBtn.innerHTML;
      submitBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>Saved Successfully!</span>
      `;
      submitBtn.classList.add('bg-emerald-600');
      setTimeout(() => {
        submitBtn.innerHTML = originalHtml;
        submitBtn.classList.remove('bg-emerald-600');
      }, 2500);
    }
  });
});

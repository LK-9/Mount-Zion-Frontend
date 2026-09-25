// Mount Zion — Interactive Cargo Waybill Quote Calculator (Alaba Loading Base -> Port Harcourt Base)
function initQuoteCalculator() {
  let currentStep = 1;
  const totalSteps = 4;

  const stepElements = document.querySelectorAll('.quote-step-content');
  const stepIndicators = document.querySelectorAll('.step-indicator');
  const prevBtn = document.getElementById('quote-prev-btn');
  const nextBtn = document.getElementById('quote-next-btn');
  const submitBtn = document.getElementById('quote-submit-btn');
  const quoteForm = document.getElementById('quote-form');
  const priceDisplay = document.getElementById('indicative-price-display');
  const summaryContent = document.getElementById('quote-summary-content');
  const successModal = document.getElementById('quote-success-modal');
  const modalCloseBtn = document.getElementById('quote-modal-close');

  // Set default loading date to tomorrow if empty
  const loadingDateInput = document.getElementById('quote-loading-date');
  if (loadingDateInput && !loadingDateInput.value) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    loadingDateInput.value = tomorrow.toISOString().split('T')[0];
  }

  function getFormData() {
    return {
      category: document.getElementById('quote-cargo-category')?.value || 'General Commercial Goods',
      quantity: document.getElementById('quote-quantity')?.value.trim() || '1 consignment / package',
      description: document.getElementById('quote-description')?.value.trim() || 'General Commercial Cargo',
      origin: "Alaba Loading Base (Alaba Int'l Mkt, Ojo, Lagos)",
      destination: 'Port Harcourt Base (No. 29 Kaduna Street, D-Line)',
      specialNotes: document.getElementById('quote-special-notes')?.value.trim() || 'Standard freight handling',
      loadingDate: document.getElementById('quote-loading-date')?.value || 'Next Available Departure',
      senderName: document.getElementById('quote-sender-name')?.value.trim() || 'Registered Shipper',
      senderPhone: document.getElementById('quote-sender-phone')?.value.trim() || '0802 000 0000',
      receiverName: document.getElementById('quote-receiver-name')?.value.trim() || 'Port Harcourt Consignee',
      receiverPhone: document.getElementById('quote-receiver-phone')?.value.trim() || 'Same as Sender'
    };
  }

  function calculatePriceRange(data) {
    let min = 25000;
    let max = 55000;

    const qtyText = (data.quantity || '').toLowerCase();
    const qtyNum = parseInt(qtyText.replace(/[^0-9]/g, ''), 10) || 1;

    if (qtyText.includes('carton') || qtyText.includes('box') || qtyText.includes('package') || qtyText.includes('item') || qtyText.includes('consignment')) {
      min = Math.max(15000, qtyNum * 2500);
      max = Math.max(35000, qtyNum * 4500);
    } else if (qtyText.includes('sack') || qtyText.includes('bag')) {
      min = Math.max(20000, qtyNum * 3000);
      max = Math.max(45000, qtyNum * 5000);
    } else if (qtyText.includes('drum') || qtyText.includes('barrel') || qtyText.includes('pallet')) {
      min = Math.max(35000, qtyNum * 15000);
      max = Math.max(75000, qtyNum * 25000);
    } else {
      min = Math.max(25000, qtyNum * 3500);
      max = Math.max(55000, qtyNum * 6500);
    }

    if ((data.category || '').includes('Electronics')) {
      min = Math.round(min * 1.2);
      max = Math.round(max * 1.25);
    } else if ((data.category || '').includes('Solar') || (data.category || '').includes('Battery') || (data.category || '').includes('Inverter')) {
      min = Math.max(16000, qtyNum * 14000);
      max = Math.max(38000, qtyNum * 22000);
    }

    return {
      minFormatted: '₦' + min.toLocaleString(),
      maxFormatted: '₦' + max.toLocaleString(),
      rawMin: min,
      rawMax: max
    };
  }

  function renderSummary() {
    const data = getFormData();
    const prices = calculatePriceRange(data);

    if (priceDisplay) {
      priceDisplay.textContent = `${prices.minFormatted} – ${prices.maxFormatted}`;
    }

    if (summaryContent) {
      summaryContent.innerHTML = `
        <div class="rounded-2xl border border-border bg-surface p-5 space-y-3.5 text-xs">
          <div class="flex items-start justify-between border-b border-border pb-2.5">
            <div>
              <span class="text-muted-foreground block text-[11px]">Cargo Consignment</span>
              <strong class="text-foreground text-sm font-poppins">${data.quantity} • ${data.category}</strong>
              <p class="text-muted-foreground text-[11px] mt-0.5">${data.description}</p>
            </div>
            <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">Lagos → Port Harcourt</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <span class="text-muted-foreground block text-[11px]">Lagos Loading Point</span>
              <strong class="text-foreground font-semibold">📍 Alaba Loading Base (Alaba Int'l Mkt, Ojo)</strong>
            </div>
            <div>
              <span class="text-muted-foreground block text-[11px]">Port Harcourt Delivery Base</span>
              <strong class="text-foreground font-semibold">🏁 Port Harcourt Base (29 Kaduna St, D-Line)</strong>
            </div>
          </div>

          <div class="pt-2 border-t border-border">
            <span class="text-muted-foreground block text-[11px]">Special Instructions</span>
            <strong class="text-foreground">${data.specialNotes}</strong>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
            <div>
              <span class="text-muted-foreground block text-[11px]">Sender</span>
              <strong class="text-foreground">${data.senderName} (${data.senderPhone})</strong>
            </div>
            <div>
              <span class="text-muted-foreground block text-[11px]">Receiver (Port Harcourt)</span>
              <strong class="text-foreground">${data.receiverName} (${data.receiverPhone})</strong>
            </div>
          </div>

          <div class="pt-2 border-t border-border flex items-center justify-between">
            <span class="text-muted-foreground">Target Loading Date at Alaba:</span>
            <strong class="text-primary font-bold">${data.loadingDate}</strong>
          </div>
        </div>
      `;
    }
  }

  function updateStepsUI() {
    const contents = document.querySelectorAll('.quote-step-content');
    contents.forEach((el, index) => {
      if (index + 1 === currentStep) {
        el.classList.remove('hidden');
        el.style.display = 'block';
      } else {
        el.classList.add('hidden');
        el.style.display = 'none';
      }
    });

    const indicators = document.querySelectorAll('.step-indicator');
    indicators.forEach((ind, index) => {
      const circle = ind.querySelector('.step-circle');
      const text = ind.querySelector('span');
      const stepNum = index + 1;

      if (stepNum === currentStep) {
        if (circle) {
          circle.className = 'step-circle h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold mx-auto bg-gradient-brand text-white shadow-glow';
          circle.textContent = stepNum;
        }
        if (text) text.className = 'text-[11px] font-bold block text-foreground';
      } else if (stepNum < currentStep) {
        if (circle) {
          circle.className = 'step-circle h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold mx-auto bg-emerald-600 text-white';
          circle.textContent = '✓';
        }
        if (text) text.className = 'text-[11px] font-medium block text-emerald-600 dark:text-emerald-400';
      } else {
        if (circle) {
          circle.className = 'step-circle h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold mx-auto border border-border text-muted-foreground';
          circle.textContent = stepNum;
        }
        if (text) text.className = 'text-[11px] font-normal block text-muted-foreground';
      }
    });

    if (prevBtn) {
      if (currentStep === 1) {
        prevBtn.classList.add('invisible');
        prevBtn.style.visibility = 'hidden';
      } else {
        prevBtn.classList.remove('invisible');
        prevBtn.style.visibility = 'visible';
      }
    }

    if (nextBtn && submitBtn) {
      if (currentStep === totalSteps) {
        nextBtn.classList.add('hidden');
        nextBtn.style.display = 'none';
        submitBtn.classList.remove('hidden');
        submitBtn.style.display = 'inline-flex';
        renderSummary();
      } else {
        nextBtn.classList.remove('hidden');
        nextBtn.style.display = 'inline-flex';
        submitBtn.classList.add('hidden');
        submitBtn.style.display = 'none';
      }
    }
  }

  // Allow clicking on any step indicator header directly
  stepIndicators.forEach((ind, index) => {
    ind.style.cursor = 'pointer';
    ind.addEventListener('click', () => {
      currentStep = index + 1;
      updateStepsUI();
    });
  });

  // Next Step button
  if (nextBtn) {
    nextBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();

      // If quantity is empty on step 1, provide standard default
      const qtyInput = document.getElementById('quote-quantity');
      if (currentStep === 1 && qtyInput && !qtyInput.value.trim()) {
        qtyInput.value = '1 Standard Consignment';
      }

      // If sender name/phone are empty on step 3, provide standard defaults
      if (currentStep === 3) {
        const nameInput = document.getElementById('quote-sender-name');
        const phoneInput = document.getElementById('quote-sender-phone');
        if (nameInput && !nameInput.value.trim()) nameInput.value = 'Prospective Shipper';
        if (phoneInput && !phoneInput.value.trim()) phoneInput.value = '0802 762 6893';
      }

      if (currentStep < totalSteps) {
        currentStep++;
        updateStepsUI();
        try {
          const formEl = document.getElementById('quote-form');
          if (formEl) formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (err) {}
      }
    };
  }

  // Previous Step button
  if (prevBtn) {
    prevBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (currentStep > 1) {
        currentStep--;
        updateStepsUI();
      }
    };
  }

  // Form Submit Handler
  if (quoteForm) {
    quoteForm.onsubmit = (e) => {
      e.preventDefault();
      const data = getFormData();
      const prices = calculatePriceRange(data);
      const quoteId = 'MZ-Q' + Math.floor(1000 + Math.random() * 9000);

      const newQuote = {
        id: quoteId,
        name: data.senderName,
        phone: data.senderPhone,
        pickup: 'Alaba Base (Lagos)',
        dropoff: 'Port Harcourt Base (D-Line)',
        cargo: `${data.quantity} — ${data.category}`,
        description: data.description,
        loadingDate: data.loadingDate,
        notes: data.specialNotes,
        estimatedFee: `${prices.minFormatted} – ${prices.maxFormatted}`,
        status: 'New',
        createdAt: new Date().toISOString()
      };

      if (typeof AppStore !== 'undefined') {
        const quotes = AppStore.getQuotes();
        AppStore.saveQuotes([newQuote, ...quotes]);
        if (AppStore.logAudit) {
          AppStore.logAudit('New online waybill quote request submitted', `${quoteId} (${data.senderName})`);
        }
      }

      // Update and display Success Modal
      if (successModal) {
        const titleEl = successModal.querySelector('h3');
        const descEl = successModal.querySelector('p');
        if (titleEl) titleEl.textContent = `Quote Request Submitted! (#${quoteId})`;
        if (descEl) {
          descEl.innerHTML = `Your quote reference is <strong class="text-foreground">${quoteId}</strong>.<br />Estimated fee: <strong class="text-emerald-600">${prices.minFormatted} – ${prices.maxFormatted}</strong>.<br />Our Lagos dispatch team at Alaba Base will call or WhatsApp you at <strong>${data.senderPhone}</strong> to confirm your drop-off.`;
        }
        successModal.classList.remove('hidden');
        successModal.style.display = 'flex';
      }

      quoteForm.reset();
      currentStep = 1;
      updateStepsUI();
    };
  }

  // Close modal
  if (modalCloseBtn && successModal) {
    modalCloseBtn.onclick = () => {
      successModal.classList.add('hidden');
      successModal.style.display = 'none';
    };
  }

  // Initial step setup
  updateStepsUI();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initQuoteCalculator);
} else {
  initQuoteCalculator();
}

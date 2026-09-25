// Mount Zion — Home Page Interactive Logic
document.addEventListener('DOMContentLoaded', () => {
  const calcBtn = document.getElementById('calc-estimate-btn');
  const itemsInput = document.getElementById('home-calc-items');
  const weightSelect = document.getElementById('home-calc-weight');
  const resultDisplay = document.getElementById('home-calc-result');

  if (calcBtn && itemsInput && weightSelect && resultDisplay) {
    calcBtn.addEventListener('click', () => {
      const count = parseInt(itemsInput.value, 10) || 1;
      const weight = weightSelect.value;
      let baseRate = 3500;
      if (weight === 'heavy') baseRate = 6000;
      if (weight === 'bulk') baseRate = 4500;
      const total = Math.max(15000, count * baseRate);
      resultDisplay.textContent = 'Estimated Waybill Fee: ₦' + total.toLocaleString();
      resultDisplay.classList.remove('hidden');
    });
  }
});

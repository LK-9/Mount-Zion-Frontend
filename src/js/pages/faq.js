// Mount Zion — FAQ Interactive Accordion Logic

document.addEventListener('DOMContentLoaded', () => {
  const faqItems = document.querySelectorAll('.faq-item');

  // Accordion Dropdown Click Handler
  faqItems.forEach((item) => {
    const trigger = item.querySelector('.faq-trigger');
    const answer = item.querySelector('.faq-answer');
    const icon = item.querySelector('.faq-icon');

    if (trigger && answer) {
      trigger.addEventListener('click', () => {
        const isCurrentlyOpen = !answer.classList.contains('hidden');

        // Toggle current item
        if (isCurrentlyOpen) {
          answer.classList.add('hidden');
          if (icon) icon.classList.remove('rotate-180');
          trigger.setAttribute('aria-expanded', 'false');
        } else {
          answer.classList.remove('hidden');
          if (icon) icon.classList.add('rotate-180');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
    }
  });
});

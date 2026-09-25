// Mount Zion — Contact & Interactive Terminal Maps
document.addEventListener("DOMContentLoaded", () => {
  const contactForm =
    document.getElementById("contact-form") ||
    document.getElementById("public-contact-form");
  const successAlert = document.getElementById("contact-success-alert");

  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("contact-name")?.value || "Guest";
      const email = document.getElementById("contact-email")?.value || "";
      const phone = document.getElementById("contact-phone")?.value || "";
      const subject =
        document.getElementById("contact-subject")?.value || "General Inquiry";
      const message = document.getElementById("contact-message")?.value || "";

      const newMsg = {
        id: "M-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
        name,
        email,
        phone,
        subject,
        message,
        status: "Unread",
        createdAt: new Date().toISOString(),
      };

      if (typeof AppStore !== "undefined" && AppStore.getMessages) {
        const messages = AppStore.getMessages();
        AppStore.saveMessages([newMsg, ...messages]);
      }

      if (successAlert) {
        successAlert.classList.remove("hidden");
        successAlert.scrollIntoView({ behavior: "smooth", block: "nearest" });
      } else {
        alert(
          "Thank you, " +
            name +
            "! Your message has been sent to our dispatch managers. We will get back to you promptly.",
        );
      }

      contactForm.reset();
    });
  }

  // Interactive Base Map Switcher
  const tabPhc = document.getElementById("map-tab-phc");
  const tabLagos = document.getElementById("map-tab-lagos");
  const locTitle = document.getElementById("base-location-title");
  const locAddress = document.getElementById("base-location-address");
  const mapIframe = document.getElementById("base-map-iframe");

  if (tabPhc && tabLagos) {
    const setActiveTab = (activeTab, inactiveTab) => {
      activeTab.className =
        "px-3.5 py-1.5 rounded-md font-semibold bg-primary text-primary-foreground shadow-sm cursor-pointer transition-all";
      inactiveTab.className =
        "px-3.5 py-1.5 rounded-md font-semibold bg-transparent text-muted-foreground hover:text-foreground cursor-pointer transition-all";
    };

    tabPhc.addEventListener("click", () => {
      setActiveTab(tabPhc, tabLagos);
      if (locTitle)
        locTitle.textContent = "Port Harcourt Offloading Base (D-Line)";
      if (locAddress)
        locAddress.textContent =
          "No. 29 Kaduna Street, D-Line, Port Harcourt, Rivers State.";
      if (mapIframe)
        mapIframe.src =
          "https://maps.google.com/maps?q=29+Kaduna+Street+D-line+Port+Harcourt&t=&z=15&ie=UTF8&iwloc=&output=embed";
    });

    tabLagos.addEventListener("click", () => {
      setActiveTab(tabLagos, tabPhc);
      if (locTitle)
        locTitle.textContent = "Lagos Loading Base (Alaba International)";
      if (locAddress)
        locAddress.textContent =
          "34, Remi Street, By Ukpor Street, Behind St. Patrick Catholic Church, Alaba Int'l Mkt., Ojo, Lagos.";
      if (mapIframe)
        mapIframe.src =
          "https://maps.google.com/maps?q=34+Remi+Street+Alaba+International+Market+Ojo+Lagos&t=&z=15&ie=UTF8&iwloc=&output=embed";
    });
  }
});

(() => {
  "use strict";

  // Publisher gate: retain the verified record here, but turn a store control
  // into a link only after the matching storefront is actually public.
  const STOREFRONTS = Object.freeze({
    ios: Object.freeze({
      ascAppId: "6819098586",
      href: "https://apps.apple.com/app/id6819098586",
      publisherApproved: false,
    }),
    android: Object.freeze({
      href: "",
      publisherApproved: false,
    }),
  });

  function applyStorefrontGates() {
    document.querySelectorAll("[data-store-link]").forEach((control) => {
      const storefront = STOREFRONTS[control.dataset.storeLink];
      if (!storefront || !storefront.publisherApproved || !storefront.href) return;
      control.href = storefront.href;
      control.removeAttribute("aria-disabled");
      control.removeAttribute("tabindex");
      control.classList.remove("is-disabled");
      const label = control.querySelector("small");
      if (label) label.textContent = "Available now";
    });
  }

  // The landing page intentionally has no mode-selecting URL contract. A
  // generic app link only opens the installed game after an explicit tap.
  // Legacy #daily fragments remain inert rather than promising a retired mode.
  applyStorefrontGates();
})();

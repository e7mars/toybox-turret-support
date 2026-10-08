(() => {
  "use strict";

  // Publisher gate: keep the verified record here, but only turn a store control
  // into a link after the matching storefront is actually public.
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

  // Mirrors the native Daily Toybox contract: version 1 and UTC calendar years
  // 2000–2099 only. The date is formatted for players below; the ID stays in URLs.
  const DAILY_ID = /^v1-(20\d{2})-(\d{2})-(\d{2})$/;
  const DAILY_DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  function dailyDetails(value) {
    const match = DAILY_ID.exec(value || "");
    if (!match) return null;
    const [, rawYear, rawMonth, rawDay] = match;
    const year = Number(rawYear);
    const month = Number(rawMonth);
    const day = Number(rawDay);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) return null;
    return { id: value, date };
  }

  function dailyDetailsFromFragment() {
    const fragment = window.location.hash.slice(1);
    if (!fragment.startsWith("daily=")) return null;
    return dailyDetails(fragment.slice("daily=".length));
  }

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

  function hydrateDailyLink() {
    const daily = dailyDetailsFromFragment();
    if (!daily) return;
    const card = document.querySelector("[data-daily-card]");
    const date = document.querySelector("[data-daily-date]");
    const open = document.querySelector("[data-daily-open]");
    const copy = document.querySelector("[data-copy-daily]");
    const status = document.querySelector("[data-daily-status]");
    if (!card || !date || !open || !copy || !status) return;

    date.textContent = DAILY_DATE_FORMAT.format(daily.date);
    open.href = `toybox-turret://daily/${daily.id}`;
    card.hidden = false;

    copy.addEventListener("click", async () => {
      const publicUrl = `${window.location.origin}${window.location.pathname}#daily=${daily.id}`;
      try {
        await navigator.clipboard.writeText(publicUrl);
        status.textContent = "Daily link copied.";
      } catch {
        status.textContent = "Copy this page address to share the daily link.";
      }
    });
  }

  applyStorefrontGates();
  hydrateDailyLink();
})();

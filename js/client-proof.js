(async () => {
  const section = document.querySelector("[data-client-proof]");
  const container = section?.querySelector("[data-client-logos]");
  const status = section?.querySelector("[data-client-proof-status]");
  if (!section || !container) return;

  const isLocalPreview = ["", "localhost", "127.0.0.1"].includes(window.location.hostname);
  const isReviewPreview = isLocalPreview && (
    window.location.port === "8765"
    || new URLSearchParams(window.location.search).has("client_logo_review")
  );
  const approvedLogos = Array.isArray(window.HYBRIDAG_CLIENT_LOGOS)
    ? window.HYBRIDAG_CLIENT_LOGOS.filter(
        (logo) => logo?.approved === true && logo?.name && logo?.src,
      )
    : [];

  let logos = approvedLogos;
  let isReviewSet = false;

  if (isReviewPreview) {
    try {
      const response = await fetch("content/review-assets/client-logos.json", { cache: "no-store" });
      if (response.ok) {
        const reviewData = await response.json();
        const reviewLogos = Array.isArray(reviewData.logos)
          ? reviewData.logos.filter((logo) => logo?.name && logo?.src)
          : [];
        if (reviewLogos.length) {
          logos = reviewLogos;
          isReviewSet = true;
        }
      }
    } catch {
      // The review manifest is deliberately absent from production releases.
    }
  }

  if (!logos.length && !isReviewPreview) return;

  if (logos.length) {
    logos.forEach((logo) => {
      const website = logo.url || logo.official_site;
      const item = document.createElement(website ? "a" : "div");
      item.className = "client-proof__logo";
      if (logo.mode === "original") item.classList.add("client-proof__logo--original");
      if (logo.surface === "dark") item.classList.add("client-proof__logo--dark");
      if (logo.treatment === "reverse") item.classList.add("client-proof__logo--reverse");
      if (website) {
        item.href = website;
        item.target = "_blank";
        item.rel = "noopener noreferrer";
        item.setAttribute("aria-label", `Visit ${logo.name} website (opens in a new tab)`);
      }

      const image = document.createElement("img");
      image.src = logo.src;
      image.alt = logo.name;
      image.loading = "lazy";
      image.decoding = "async";
      item.append(image);
      container.append(item);
    });
  } else {
    container.classList.add("client-proof__logos--preview");
    container.setAttribute("aria-label", "Client logo layout preview. Approved logos pending.");
    for (let index = 1; index <= 10; index += 1) {
      const item = document.createElement("div");
      item.className = "client-proof__logo client-proof__logo--placeholder";
      item.setAttribute("aria-hidden", "true");
      item.innerHTML = `<span>Client logo</span><small>${String(index).padStart(2, "0")}</small>`;
      container.append(item);
    }
  }

  if (isReviewSet && status) {
    status.textContent = "Preview set. Client approval pending.";
    status.hidden = false;
  }
  section.hidden = false;
})();

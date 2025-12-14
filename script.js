// UX essenziale: menu mobile, reveal on scroll, form -> mailto, anno footer
(() => {
  // Year
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // Mobile menu
  const menuBtn = document.getElementById("menuBtn");
  const mobileMenu = document.getElementById("mobileMenu");

  function setMenu(open) {
    if (!mobileMenu || !menuBtn) return;
    mobileMenu.hidden = !open;
    menuBtn.setAttribute("aria-expanded", String(open));
  }

  menuBtn?.addEventListener("click", () => {
    if (!mobileMenu) return;
    setMenu(mobileMenu.hidden);
  });

  // Close menu when clicking a link
  mobileMenu?.addEventListener("click", (e) => {
    const target = e.target;
    if (target && target.tagName === "A") setMenu(false);
  });

  // Close on ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setMenu(false);
  });

  // Reveal on scroll
  const items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    items.forEach((el) => io.observe(el));
  } else {
    items.forEach((el) => el.classList.add("is-visible"));
  }

  // Form -> mailto
  const form = document.getElementById("quoteForm");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    const name = String(fd.get("name") || "").trim();
    const phone = String(fd.get("phone") || "").trim();
    const message = String(fd.get("message") || "").trim();

    const subject = encodeURIComponent("Richiesta preventivo - CICO Rent");
    const body = encodeURIComponent(
      `Nome: ${name}\n` +
      `Telefono: ${phone}\n\n` +
      `Richiesta:\n${message}\n\n` +
      `---\n` +
      `Pacchetti da 49 € IVA inclusa (in base a disponibilità e condizioni).\n` +
      `Inviato dal sito CICO Rent.\n`
    );

    window.location.href = `mailto:info@cicorent.it?subject=${subject}&body=${body}`;
  });
})();

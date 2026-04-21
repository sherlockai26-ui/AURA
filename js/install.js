// PWA install helper. Expone Aura.install.prompt() para el botón "Crear acceso directo".
(function () {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("./sw.js")
        .catch(() => { /* no-op: offline cache es best-effort */ });
    });
  }

  let deferredPrompt = null;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.querySelectorAll("[data-install-available]").forEach((el) => {
      el.hidden = false;
      el.classList.remove("hidden");
    });
    showBannerIfAppropriate();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    document.querySelectorAll("[data-install-available]").forEach((el) => {
      el.hidden = true;
      el.classList.add("hidden");
    });
    hideBanner();
    showInstructions("¡Listo! AURA se añadió a tu pantalla de inicio.");
  });

  function isStandalone() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    );
  }

  function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  }

  function showInstructions(text) {
    const hint = document.getElementById("install-hint");
    if (hint) hint.textContent = text;
    toast(text);
  }

  function manualInstructions() {
    if (isIOS()) {
      return "En iPhone: toca el botón Compartir (↑) en Safari y elige «Añadir a pantalla de inicio».";
    }
    if (/Android/i.test(navigator.userAgent)) {
      return "En Android: toca el menú (⋮) del navegador y elige «Añadir a pantalla de inicio» o «Instalar app».";
    }
    return "En PC: busca el icono de instalar en la barra de direcciones (⊕) o usa el menú del navegador.";
  }

  async function promptInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      try {
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome !== "accepted") {
          showInstructions("Cuando quieras, vuelve a intentarlo aquí.");
        }
      } catch (_) { /* ignore */ }
      deferredPrompt = null;
      hideBanner();
      return;
    }
    showInstructions(manualInstructions());
  }

  function showBannerIfAppropriate() {
    if (isStandalone()) return;
    if (sessionStorage.getItem("aura:install-dismissed")) return;
    const banner = document.getElementById("install-banner");
    if (banner) banner.classList.remove("hidden");
  }

  function hideBanner() {
    const banner = document.getElementById("install-banner");
    if (banner) banner.classList.add("hidden");
  }

  function toast(msg) {
    const root = document.getElementById("toast-root") || document.body;
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    root.appendChild(t);
    setTimeout(() => t.remove(), 2800);
  }

  function bind() {
    document.querySelectorAll("#install-btn, #install-btn-settings, #install-btn-inline").forEach((b) => {
      if (!b) return;
      b.addEventListener("click", (e) => {
        e.preventDefault();
        promptInstall();
      });
    });
    const dismiss = document.getElementById("install-dismiss");
    if (dismiss) {
      dismiss.addEventListener("click", () => {
        sessionStorage.setItem("aura:install-dismissed", "1");
        hideBanner();
      });
    }
    // iOS no dispara beforeinstallprompt; mostramos pista manual igualmente.
    if (isIOS() && !isStandalone()) {
      showBannerIfAppropriate();
    }
  }

  window.AuraInstall = { prompt: promptInstall, isStandalone, isIOS, manualInstructions };
  window.AuraToast = toast;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }
})();

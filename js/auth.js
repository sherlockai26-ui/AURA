// Flujo de splash -> login -> registro en index.html
(function () {
  const splash = document.getElementById("splash");
  const viewLogin = document.getElementById("view-login");
  const viewRegister = document.getElementById("view-register");
  const loginForm = document.getElementById("login-form");
  const loginError = document.getElementById("login-error");

  function showView(el) {
    [viewLogin, viewRegister].forEach((v) => v && v.classList.add("hidden"));
    if (el) el.classList.remove("hidden");
  }

  function hideSplash() {
    if (!splash) return;
    splash.classList.add("hide");
    setTimeout(() => splash.remove(), 520);
  }

  // Si ya hay sesión activa, saltamos directo al app.
  if (window.AuraStore && AuraStore.isAuthed()) {
    location.replace("./app.html");
    return;
  }

  // Splash mínimo (mejora UX: siempre al menos 900ms)
  const start = Date.now();
  window.addEventListener("load", () => {
    const minWait = 900;
    const elapsed = Date.now() - start;
    setTimeout(() => {
      hideSplash();
      showView(viewLogin);
    }, Math.max(0, minWait - elapsed));
  });

  // Toggle password visibility
  document.querySelectorAll("[data-toggle-pass]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = btn.parentElement.querySelector("input");
      if (!input) return;
      input.type = input.type === "password" ? "text" : "password";
      btn.textContent = input.type === "password" ? "◌" : "◉";
    });
  });

  // Login
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    loginError.textContent = "";
    const id = document.getElementById("login-id").value.trim();
    const pass = document.getElementById("login-pass").value;
    if (!id || !pass) {
      loginError.textContent = "Escribe tu correo/nickname y contraseña.";
      return;
    }
    try {
      AuraStore.login(id, pass);
      location.assign("./app.html");
    } catch (err) {
      loginError.textContent = err.message;
    }
  });

  // Navigate to register
  document.getElementById("go-register").addEventListener("click", () => {
    showView(viewRegister);
    goStep(1);
  });
  document.getElementById("back-to-login").addEventListener("click", () => showView(viewLogin));

  // ---- Register wizard -----------------------------------------------
  const steps = document.querySelectorAll(".reg-step");
  const stepIndicator = document.getElementById("reg-step");
  let currentStep = 1;
  let generatedOtps = { 1: "", 2: "" };

  function goStep(n) {
    currentStep = n;
    stepIndicator.textContent = n;
    steps.forEach((s) => {
      s.classList.toggle("hidden", Number(s.dataset.step) !== n);
    });
    if (n === 3) sendOtps();
  }

  function sendOtps() {
    // En producción: llamada a /otp/send con teléfonos del paso 2.
    const m1Phone = document.getElementById("reg-m1-phone").value.trim();
    const m2Phone = document.getElementById("reg-m2-phone").value.trim();
    document.getElementById("otp-phone-1").textContent = maskPhone(m1Phone);
    document.getElementById("otp-phone-2").textContent = maskPhone(m2Phone);
    generatedOtps[1] = randOtp();
    generatedOtps[2] = randOtp();
    // Hint solo para demo local. Quitar al conectar backend real.
    document.getElementById("otp-demo-hint").textContent =
      "(demo) códigos: " + generatedOtps[1] + " y " + generatedOtps[2];
  }

  function randOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  function maskPhone(p) {
    if (!p) return "—";
    return p.slice(0, 3) + " ••• " + p.slice(-2);
  }

  function collectOtp(idx) {
    return Array.from(document.querySelectorAll(`[data-otp="${idx}"] input`))
      .map((i) => i.value.trim())
      .join("");
  }

  // OTP auto-advance
  document.querySelectorAll(".otp").forEach((otp) => {
    const inputs = otp.querySelectorAll("input");
    inputs.forEach((input, idx) => {
      input.addEventListener("input", () => {
        if (input.value.length === 1 && idx < inputs.length - 1) inputs[idx + 1].focus();
      });
      input.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !input.value && idx > 0) inputs[idx - 1].focus();
      });
    });
  });

  document.querySelectorAll("[data-next]").forEach((btn) => {
    btn.addEventListener("click", () => {
      try {
        if (currentStep === 1) validateStep1();
        if (currentStep === 2) validateStep2();
        if (currentStep === 3) {
          validateStep3();
          commitRegistration();
        }
        goStep(currentStep + 1);
      } catch (err) {
        window.AuraToast ? AuraToast(err.message) : alert(err.message);
      }
    });
  });
  document.querySelectorAll("[data-prev]").forEach((btn) => {
    btn.addEventListener("click", () => goStep(Math.max(1, currentStep - 1)));
  });

  function validateStep1() {
    const email = document.getElementById("reg-couple-email").value.trim();
    const handle = document.getElementById("reg-couple-handle").value.trim();
    const pass = document.getElementById("reg-couple-pass").value;
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Correo compartido inválido.");
    if (!/^[a-zA-Z0-9_.]{3,24}$/.test(handle)) throw new Error("NickName: 3–24 letras/números.");
    if (pass.length < 8) throw new Error("Contraseña mínima de 8 caracteres.");
  }

  function validateStep2() {
    const n1 = document.getElementById("reg-m1-name").value.trim();
    const p1 = document.getElementById("reg-m1-phone").value.trim();
    const n2 = document.getElementById("reg-m2-name").value.trim();
    const p2 = document.getElementById("reg-m2-phone").value.trim();
    if (!n1 || !n2) throw new Error("Faltan nombres de los integrantes.");
    if (p1.replace(/\D/g, "").length < 8 || p2.replace(/\D/g, "").length < 8)
      throw new Error("Teléfonos inválidos.");
    if (p1 === p2) throw new Error("Los dos teléfonos no pueden ser iguales.");
  }

  function validateStep3() {
    const a = collectOtp(1);
    const b = collectOtp(2);
    if (a !== generatedOtps[1] || b !== generatedOtps[2]) {
      throw new Error("Alguno de los códigos SMS no coincide. Revísalos.");
    }
  }

  function commitRegistration() {
    AuraStore.registerCouple({
      email: document.getElementById("reg-couple-email").value,
      handle: document.getElementById("reg-couple-handle").value,
      password: document.getElementById("reg-couple-pass").value,
      m1: {
        name: document.getElementById("reg-m1-name").value.trim(),
        phone: document.getElementById("reg-m1-phone").value.trim()
      },
      m2: {
        name: document.getElementById("reg-m2-name").value.trim(),
        phone: document.getElementById("reg-m2-phone").value.trim()
      }
    });
  }

  document.getElementById("reg-finish").addEventListener("click", () => {
    location.assign("./app.html");
  });
})();

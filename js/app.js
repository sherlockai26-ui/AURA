// Controlador del app shell (feed / chat / perfil / ajustes)
(function () {
  if (!AuraStore.isAuthed()) {
    location.replace("./index.html");
    return;
  }

  const state = {
    view: "feed",
    chatMode: "couple", // 'couple' | 'group' | 'direct'
    openConversation: null
  };

  function $(sel, el) { return (el || document).querySelector(sel); }
  function $$(sel, el) { return Array.from((el || document).querySelectorAll(sel)); }

  function initials(name) {
    return (name || "?")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join("");
  }

  function renderAvatars() {
    const me = AuraStore.me();
    const partner = AuraStore.partner();
    if (me) $("#avatar-me").textContent = initials(me.name);
    if (me) $("#profile-av-1").textContent = initials(me.name);
    if (partner) $("#profile-av-2").textContent = initials(partner.name);
  }

  function setView(name) {
    state.view = name;
    $$(".view").forEach((v) => v.classList.add("hidden"));
    const el = document.getElementById("view-" + name);
    if (el) el.classList.remove("hidden");
    $$(".tabbar button").forEach((b) => b.classList.toggle("active", b.dataset.view === name));
    if (name === "feed") renderFeed();
    if (name === "chat") renderChatList();
    if (name === "profile") renderProfile();
    if (name === "settings") renderSettings();
    if (location.hash !== "#" + name) history.replaceState(null, "", "#" + name);
  }

  // Tab navigation
  $$(".tabbar button").forEach((b) => {
    b.addEventListener("click", () => setView(b.dataset.view));
  });

  // Logout
  $("#logout-btn").addEventListener("click", doLogout);
  $("#logout-btn-2")?.addEventListener("click", doLogout);
  function doLogout() {
    AuraStore.logout();
    location.assign("./index.html");
  }

  // ------- FEED --------------------------------------------------------
  function renderFeed() {
    const list = $("#feed-list");
    const data = AuraStore.get();
    if (!data.posts.length) {
      list.innerHTML = `
        <div class="card">
          <p class="muted" style="margin:0;">Aún no hay publicaciones. Compartan el primer momento de su espacio público.</p>
        </div>`;
      return;
    }
    const members = Object.fromEntries(data.members.map((m) => [m.id, m]));
    list.innerHTML = data.posts.map((p) => {
      const author = members[p.authorId] || { name: "—" };
      return `
        <article class="card post" data-post="${p.id}">
          <div class="post-head">
            <div class="avatar">${initials(author.name)}</div>
            <div class="who">${escapeHtml(author.name)} <span class="small muted">· @${escapeHtml(data.couple.handle)}</span></div>
            <div class="when">${timeAgo(p.ts)}</div>
          </div>
          <div class="post-body">${escapeHtml(p.text)}</div>
          <div class="post-actions">
            <button class="pill ${p.liked ? "purple" : ""}" data-like="${p.id}">
              ${p.liked ? "♥" : "♡"} <span>${p.likes}</span>
            </button>
            <button class="pill accent" data-comment="${p.id}">💬 Comentar</button>
            <button class="pill" data-share="${p.id}">✦ Compartir</button>
          </div>
        </article>`;
    }).join("");

    list.querySelectorAll("[data-like]").forEach((b) =>
      b.addEventListener("click", () => { AuraStore.toggleLike(b.dataset.like); renderFeed(); })
    );
    list.querySelectorAll("[data-share]").forEach((b) =>
      b.addEventListener("click", () => toast("Enlace copiado (demo)"))
    );
    list.querySelectorAll("[data-comment]").forEach((b) =>
      b.addEventListener("click", () => toast("Comentarios: próximamente"))
    );
  }

  $("#post-btn").addEventListener("click", () => {
    const text = $("#post-text").value.trim();
    if (!text) return;
    AuraStore.addPost(text);
    $("#post-text").value = "";
    renderFeed();
    toast("Publicado en su feed de pareja");
  });

  // ------- CHAT --------------------------------------------------------
  $$(".mode-switch button").forEach((b) => {
    b.addEventListener("click", () => {
      state.chatMode = b.dataset.mode;
      state.openConversation = null;
      $$(".mode-switch button").forEach((x) => x.classList.toggle("active", x === b));
      renderChatList();
    });
  });

  function renderChatList() {
    const data = AuraStore.get();
    const me = AuraStore.me();
    const partner = AuraStore.partner();
    const list = $("#chat-list");
    const card = $("#chat-list-card");
    const win = $("#chat-window");

    card.classList.remove("hidden");
    win.classList.add("hidden");

    if (state.chatMode === "couple") {
      // Un único chat "de pareja" (los dos integrantes)
      const last = lastMsg(data.chats.couple);
      list.innerHTML = convItem({
        id: "couple",
        title: "Nuestro chat",
        subtitle: `${me?.name || ""} · ${partner?.name || ""}`,
        preview: last?.text || "Empiecen a conversar...",
        time: last ? timeAgo(last.ts) : ""
      });
    } else if (state.chatMode === "group") {
      const last = lastMsg(data.chats.group);
      list.innerHTML = convItem({
        id: "group",
        title: "Grupo de 4",
        subtitle: "Las 2 parejas juntas",
        preview: last?.text || "Invita a la otra pareja para empezar.",
        time: last ? timeAgo(last.ts) : ""
      });
    } else {
      // Mensajes individuales (con los 3 integrantes: tu pareja + los 2 de la otra pareja)
      const peers = [
        { id: "partner", name: partner?.name || "Mi pareja", sub: "Tu pareja" },
        { id: "ext1", name: "Integrante A", sub: "Otra pareja" },
        { id: "ext2", name: "Integrante B", sub: "Otra pareja" }
      ];
      list.innerHTML = peers.map((p) => {
        const msgs = data.chats.direct[p.id] || [];
        const last = lastMsg(msgs);
        return convItem({
          id: p.id, title: p.name, subtitle: p.sub,
          preview: last?.text || "Di hola 👋",
          time: last ? timeAgo(last.ts) : ""
        });
      }).join("");
    }

    list.querySelectorAll("[data-open-conv]").forEach((el) => {
      el.addEventListener("click", () => openConversation(el.dataset.openConv));
    });
  }

  function convItem({ id, title, subtitle, preview, time }) {
    return `
      <div class="item" data-open-conv="${id}">
        <div class="avatar">${initials(title)}</div>
        <div>
          <div class="name">${escapeHtml(title)}</div>
          <div class="preview">${escapeHtml(preview)}</div>
          <div class="small muted">${escapeHtml(subtitle)}</div>
        </div>
        <div class="time">${time}</div>
      </div>`;
  }

  function openConversation(id) {
    state.openConversation = id;
    const me = AuraStore.me();
    const partner = AuraStore.partner();
    const win = $("#chat-window");
    const head = {
      name: state.chatMode === "couple" ? "Nuestro chat"
          : state.chatMode === "group" ? "Grupo de 4"
          : id === "partner" ? partner?.name : id === "ext1" ? "Integrante A" : "Integrante B",
      sub: state.chatMode === "couple"
          ? `${me?.name} · ${partner?.name}`
          : state.chatMode === "group"
          ? "Las 2 parejas"
          : "Mensaje directo"
    };
    $("#chat-peer-name").textContent = head.name;
    $("#chat-peer-sub").textContent = head.sub;
    $("#chat-peer-avatar").textContent = initials(head.name);
    $("#chat-list-card").classList.add("hidden");
    win.classList.remove("hidden");
    renderMessages();
  }

  $("#chat-back").addEventListener("click", () => {
    state.openConversation = null;
    renderChatList();
  });

  function renderMessages() {
    const me = AuraStore.me();
    const msgs = AuraStore.getMessages(state.chatMode, state.openConversation);
    const box = $("#chat-msgs");
    if (!msgs.length) {
      box.innerHTML = `<div class="small muted" style="text-align:center; margin-top:20px;">Aún no hay mensajes. Envía el primero.</div>`;
      return;
    }
    box.innerHTML = msgs.map((m) => {
      const mine = m.authorId === me.id;
      return `
        <div class="msg ${mine ? "me" : ""}">
          ${!mine ? `<div class="who">${escapeHtml(m.authorName || "—")}</div>` : ""}
          <div>${escapeHtml(m.text)}</div>
        </div>`;
    }).join("");
    box.scrollTop = box.scrollHeight;
  }

  $("#chat-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = $("#chat-input");
    const text = input.value.trim();
    if (!text) return;
    const me = AuraStore.me();
    AuraStore.pushMessage(state.chatMode, state.openConversation, {
      id: "msg" + Date.now().toString(36),
      authorId: me.id,
      authorName: me.name,
      text,
      ts: Date.now()
    });
    input.value = "";
    renderMessages();
  });

  function lastMsg(arr) { return arr && arr.length ? arr[arr.length - 1] : null; }

  // ------- PROFILE -----------------------------------------------------
  function renderProfile() {
    const data = AuraStore.get();
    const me = AuraStore.me();
    const partner = AuraStore.partner();

    $("#profile-name").textContent = `${me?.name || "—"} & ${partner?.name || "—"}`;
    $("#profile-handle").textContent = "@" + (data.couple.handle || "");
    $("#profile-since").textContent = `Juntos en AURA desde ${data.couple.since || "hoy"}`;
    $("#profile-bio").value = data.couple.bio || "";

    $("#space-me-name").textContent = me?.name || "Tú";
    $("#space-me-bio").textContent = me?.bio || "Personaliza tu espacio privado.";
    $("#space-partner-name").textContent = partner?.name || "Tu pareja";
    $("#space-partner-bio").textContent = partner?.bio || "Espacio privado de tu pareja.";
  }

  $("#save-bio").addEventListener("click", () => {
    const text = $("#profile-bio").value;
    // Cambio "importante" → en producción se pide OTP a ambos teléfonos.
    const needConfirm = confirm(
      "Cambios en el perfil público requieren confirmación por SMS de ambos integrantes.\n\n¿Simular confirmación ahora? (OK = sí)"
    );
    if (!needConfirm) return;
    AuraStore.setBio("couple", text);
    toast("Biografía de pareja actualizada");
    renderProfile();
  });

  $$("[data-edit-space]").forEach((b) => {
    b.addEventListener("click", () => {
      const scope = b.dataset.editSpace;
      const current = scope === "me" ? (AuraStore.me()?.bio || "") : (AuraStore.partner()?.bio || "");
      const next = prompt("Describe tu espacio:", current);
      if (next == null) return;
      AuraStore.setBio(scope, next);
      renderProfile();
      toast("Espacio actualizado");
    });
  });

  // ------- SETTINGS ----------------------------------------------------
  function renderSettings() {
    const me = AuraStore.me();
    $("#who-am-i").textContent = me ? `${me.name} (@${me.handle})` : "—";
    $("#install-hint").textContent = window.AuraInstall?.isStandalone()
      ? "Ya estás usando AURA como app instalada."
      : window.AuraInstall?.manualInstructions() || "";
  }

  $("#switch-member").addEventListener("click", () => {
    const data = AuraStore.get();
    const other = data.members.find((m) => m.id !== data.session.activeMemberId);
    if (!other) return;
    const pass = prompt(`Confirma la contraseña compartida para cambiar a ${other.name}:`);
    if (!pass) return;
    if (pass !== data.couple.password) { toast("Contraseña incorrecta"); return; }
    AuraStore.setActiveMember(other.id);
    renderAvatars();
    renderProfile();
    renderSettings();
    toast("Ahora estás como " + other.name);
  });

  // ------- Utils -------------------------------------------------------
  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function timeAgo(ts) {
    const diff = (Date.now() - ts) / 1000;
    if (diff < 60) return "ahora";
    if (diff < 3600) return Math.floor(diff / 60) + " min";
    if (diff < 86400) return Math.floor(diff / 3600) + " h";
    const d = new Date(ts);
    return d.toLocaleDateString();
  }

  function toast(msg) { (window.AuraToast || alert)(msg); }

  // Initial render
  renderAvatars();
  const initial = (location.hash || "#feed").slice(1);
  setView(["feed", "chat", "profile", "settings"].includes(initial) ? initial : "feed");
})();

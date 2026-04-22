// Capa de almacenamiento local. En producción se reemplaza por API + BD.
// Se deja aquí para que el prototipo funcione end-to-end sin backend.
(function () {
  const KEY = "aura:v1";

  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function write(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function seed() {
    return {
      couple: null,
      members: [],
      session: null,
      posts: [],
      chats: {
        couple: [],
        group: [],
        direct: {}
      }
    };
  }

  const Store = {
    get() {
      return read() || seed();
    },
    set(next) {
      write(next);
    },
    reset() {
      localStorage.removeItem(KEY);
    },
    update(fn) {
      const curr = this.get();
      fn(curr);
      this.set(curr);
      return curr;
    },
    // ---- Auth helpers -------------------------------------------------
    login(identifier, password) {
      const data = this.get();
      if (!data.couple) throw new Error("No hay cuenta registrada todavía.");
      const byEmail = data.couple.email.toLowerCase() === identifier.toLowerCase();
      const byCoupleHandle = data.couple.handle.toLowerCase() === identifier.toLowerCase();
      const byMember = data.members.find(
        (m) => m.handle && m.handle.toLowerCase() === identifier.toLowerCase()
      );
      if (!byEmail && !byCoupleHandle && !byMember) {
        throw new Error("No encontramos esa cuenta o nickname.");
      }
      if (data.couple.password !== password) {
        throw new Error("Contraseña incorrecta.");
      }
      const activeMember = byMember || data.members[0];
      data.session = { activeMemberId: activeMember.id, ts: Date.now() };
      this.set(data);
      return data.session;
    },
    logout() {
      this.update((d) => { d.session = null; });
    },
    isAuthed() {
      const d = this.get();
      return !!(d.session && d.couple && d.members.length);
    },
    me() {
      const d = this.get();
      if (!d.session) return null;
      return d.members.find((m) => m.id === d.session.activeMemberId) || null;
    },
    partner() {
      const d = this.get();
      if (!d.session) return null;
      return d.members.find((m) => m.id !== d.session.activeMemberId) || null;
    },
    setActiveMember(id) {
      this.update((d) => {
        if (d.session) d.session.activeMemberId = id;
      });
    },
    // ---- Register -----------------------------------------------------
    registerCouple(payload) {
      const data = this.get();
      data.couple = {
        email: payload.email.trim().toLowerCase(),
        handle: payload.handle.trim(),
        password: payload.password,
        createdAt: Date.now(),
        bio: "",
        since: new Date().toISOString().slice(0, 10)
      };
      data.members = [
        { id: "m1", name: payload.m1.name, phone: payload.m1.phone, handle: slugify(payload.m1.name), bio: "" },
        { id: "m2", name: payload.m2.name, phone: payload.m2.phone, handle: slugify(payload.m2.name), bio: "" }
      ];
      data.session = { activeMemberId: "m1", ts: Date.now() };
      this.set(data);
    },
    // ---- Feed ---------------------------------------------------------
    addPost(text) {
      const me = this.me();
      if (!me) throw new Error("Sin sesión.");
      this.update((d) => {
        d.posts.unshift({
          id: "p" + Date.now().toString(36),
          authorId: me.id,
          text,
          ts: Date.now(),
          likes: 0,
          liked: false
        });
      });
    },
    toggleLike(postId) {
      this.update((d) => {
        const p = d.posts.find((x) => x.id === postId);
        if (!p) return;
        p.liked = !p.liked;
        p.likes += p.liked ? 1 : -1;
      });
    },
    // ---- Chat ---------------------------------------------------------
    pushMessage(mode, conversationId, msg) {
      this.update((d) => {
        if (mode === "couple") d.chats.couple.push(msg);
        else if (mode === "group") d.chats.group.push(msg);
        else {
          if (!d.chats.direct[conversationId]) d.chats.direct[conversationId] = [];
          d.chats.direct[conversationId].push(msg);
        }
      });
    },
    getMessages(mode, conversationId) {
      const d = this.get();
      if (mode === "couple") return d.chats.couple;
      if (mode === "group") return d.chats.group;
      return d.chats.direct[conversationId] || [];
    },
    // ---- Profile ------------------------------------------------------
    setBio(scope, bio) {
      this.update((d) => {
        if (scope === "couple") d.couple.bio = bio;
        else if (scope === "me") {
          const m = d.members.find((x) => x.id === d.session.activeMemberId);
          if (m) m.bio = bio;
        } else if (scope === "partner") {
          const m = d.members.find((x) => x.id !== d.session.activeMemberId);
          if (m) m.bio = bio;
        }
      });
    }
  };

  function slugify(s) {
    return (s || "")
      .toString()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 20) || ("user" + Math.floor(Math.random() * 1000));
  }

  window.AuraStore = Store;
  window.AuraUtil = { slugify };
})();

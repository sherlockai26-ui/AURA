import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setToken, clearToken } from './api.js';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // ── Core auth ──────────────────────────────────────────────────
      session: null,       // { id, email, handle } from backend JWT payload
      pendingWho: null,
      onboardingCompletado: false,

      // ── Legacy profile cache (never creates users locally) ─────────
      accounts: {},

      // ── Sparks ──────────────────────────────────────────────────────
      sparks: 50,
      dailyFreeSpark: true,

      // ── Misc UI state ───────────────────────────────────────────────
      activeMatch: null,
      dailyLikesRemaining: 5,

      citaDoble: {
        isSearching:      false,
        sessionId:        null,
        participants:     [],
        timeRemaining:    600,
        freeEntriesToday: 1,
      },

      registrationData: {
        modalidad: null,
        nombreNido: '',
        email: '',
        password: '',
        miembros: [],
        terminosAceptados: false,
        kycVerificado: false,
        _step: 1,
        _account: null,
        _p1: null,
        _p2: null,
      },

      notifications: [],
      unreadCount() { return get().notifications.filter((n) => !n.read).length; },

      // ── Setters ────────────────────────────────────────────────────
      setSession(sessionData) { set({ session: sessionData }); },

      logout() {
        clearToken();
        set({ session: null, pendingWho: null });
      },

      // ── Backend-only auth ───────────────────────────────────────────
      login() {
        throw new Error('El inicio de sesión local está deshabilitado. Usa el backend real.');
      },

      finalizeIdentity(email, identity) {
        const acc = get().accounts[email];
        set({ session: { id: acc?.id || 'local', email, handle: acc?.handle || email }, pendingWho: null });
      },

      clearPendingWho() { set({ pendingWho: null }); },

      register() {
        throw new Error('El registro local está deshabilitado. Usa el backend real.');
      },

      // ── Registration wizard state ──────────────────────────────────
      setRegistrationData(data) { set((s) => ({ registrationData: { ...s.registrationData, ...data } })); },
      resetRegistrationData() {
        set({
          registrationData: {
            modalidad: null, nombreNido: '', email: '', password: '',
            miembros: [], terminosAceptados: false, kycVerificado: false,
            _step: 1, _account: null, _p1: null, _p2: null,
          },
        });
      },

      // ── Duo management ─────────────────────────────────────────────
      leaveDuo(email, memberIndex) {
        set((s) => {
          const acc = s.accounts[email];
          if (!acc) return {};
          const remaining = acc.members.filter((_, i) => i !== memberIndex).map((m) => ({ ...m, isAdmin: true }));
          return { accounts: { ...s.accounts, [email]: { ...acc, members: remaining, pendingPartner: true, deletionVotes: [] } } };
        });
      },

      invitePartner(email, partnerData) {
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        set((s) => {
          const acc = s.accounts[email];
          if (!acc) return {};
          return { accounts: { ...s.accounts, [email]: { ...acc, pendingInvite: { ...partnerData, otp, ts: Date.now() } } } };
        });
        return otp;
      },

      acceptInvite(email, memberData) {
        set((s) => {
          const acc = s.accounts[email];
          if (!acc || !acc.pendingInvite) return {};
          const newMember = {
            name: memberData.name || acc.pendingInvite.name,
            handle: slugify(memberData.name || acc.pendingInvite.name),
            phone: memberData.phone || acc.pendingInvite.phone,
            verified: true, isAdmin: false, photo: null,
          };
          return {
            accounts: { ...s.accounts, [email]: { ...acc, members: [...acc.members, newMember], pendingPartner: false, pendingInvite: null } },
            session: { id: acc.id || 'local', email, handle: acc.handle },
          };
        });
      },

      voteDeletion(email, memberHandle) {
        const acc = get().accounts[email];
        if (!acc) return false;
        const already = (acc.deletionVotes || []).includes(memberHandle);
        if (already) return false;
        const nextVotes = [...(acc.deletionVotes || []), memberHandle];
        const allVoted = nextVotes.length >= acc.members.length;
        if (allVoted) {
          set((s) => { const next = { ...s.accounts }; delete next[email]; return { accounts: next, session: null }; });
          return 'deleted';
        }
        set((s) => ({ accounts: { ...s.accounts, [email]: { ...acc, deletionVotes: nextVotes } } }));
        return 'voted';
      },

      cancelDeletionVote(email, memberHandle) {
        set((s) => {
          const acc = s.accounts[email];
          if (!acc) return {};
          return { accounts: { ...s.accounts, [email]: { ...acc, deletionVotes: (acc.deletionVotes || []).filter((h) => h !== memberHandle) } } };
        });
      },

      deleteAccount(email) {
        set((s) => { const next = { ...s.accounts }; delete next[email]; return { accounts: next, session: null }; });
      },

      // ── Photo / Bio helpers (local only) ───────────────────────────
      updatePhoto(email, target, dataUrl) {
        set((s) => {
          const acc = s.accounts[email];
          if (!acc) return {};
          if (target === 'duo') return { accounts: { ...s.accounts, [email]: { ...acc, duoPhoto: dataUrl } } };
          const idx = target === 'member0' ? 0 : 1;
          const members = acc.members.map((m, i) => (i === idx ? { ...m, photo: dataUrl } : m));
          return { accounts: { ...s.accounts, [email]: { ...acc, members } } };
        });
      },

      updateBio(email, bio) {
        set((s) => {
          const acc = s.accounts[email];
          if (!acc) return {};
          return { accounts: { ...s.accounts, [email]: { ...acc, bio } } };
        });
      },

      // ── Sparks ─────────────────────────────────────────────────────
      setSparks(n) { set({ sparks: n }); },

      spendSpark(amount = 1) {
        const { sparks, dailyFreeSpark } = get();
        if (dailyFreeSpark && amount === 1) { set({ dailyFreeSpark: false }); return true; }
        if (sparks < amount) return false;
        set({ sparks: sparks - amount });
        return true;
      },
      addSparks(amount)   { set({ sparks: get().sparks + amount }); },
      addChispas(amount)  { set({ sparks: get().sparks + amount }); },
      deductChispas(amount) {
        if (get().sparks < amount) return false;
        set({ sparks: get().sparks - amount });
        return true;
      },
      getSaldoChispas() { return get().sparks; },

      // ── Notifications ──────────────────────────────────────────────
      markAsRead(id) {
        set((s) => ({ notifications: s.notifications.map((n) => n.id === id ? { ...n, read: true } : n) }));
      },
      markAllAsRead() {
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
      },
      addNotification(notification) {
        set((s) => ({ notifications: [notification, ...s.notifications] }));
      },

      // ── Match ──────────────────────────────────────────────────────
      setActiveMatch(match) { set({ activeMatch: match }); },
      clearActiveMatch()    { set({ activeMatch: null }); },
      decrementLikes()      { set((s) => ({ dailyLikesRemaining: Math.max(0, s.dailyLikesRemaining - 1) })); },
      resetDailyLikes()     { set({ dailyLikesRemaining: 5 }); },

      // ── Cita Doble ─────────────────────────────────────────────────
      startSearch()   { set((s) => ({ citaDoble: { ...s.citaDoble, isSearching: true } })); },
      cancelSearch()  { set((s) => ({ citaDoble: { ...s.citaDoble, isSearching: false } })); },
      joinSession(sessionId, participants) {
        set((s) => ({ citaDoble: { ...s.citaDoble, isSearching: false, sessionId, participants, timeRemaining: 600 } }));
      },
      leaveSession() {
        set((s) => ({ citaDoble: { ...s.citaDoble, sessionId: null, participants: [], timeRemaining: 600 } }));
      },
      extendTime(seconds, cost) {
        if (!get().spendSpark(cost)) return false;
        set((s) => ({ citaDoble: { ...s.citaDoble, timeRemaining: s.citaDoble.timeRemaining + seconds } }));
        return true;
      },
      decrementFreeEntry() {
        set((s) => ({ citaDoble: { ...s.citaDoble, freeEntriesToday: Math.max(0, s.citaDoble.freeEntriesToday - 1) } }));
      },

      completeOnboarding() { set({ onboardingCompletado: true }); },

      // ── Helpers para compatibilidad ────────────────────────────────
      findByIdentifier(identifier) {
        const s = String(identifier || '').trim().toLowerCase();
        if (!s) return null;
        const accs = Object.values(get().accounts);
        const byEmail  = accs.find((a) => a.email === s);
        if (byEmail) return { account: byEmail, memberIndex: 0 };
        const byHandle = accs.find((a) => a.handle?.toLowerCase() === s);
        if (byHandle) return { account: byHandle, memberIndex: 0 };
        for (const a of accs) {
          const idx = (a.members || []).findIndex((m) => m.handle?.toLowerCase() === s);
          if (idx >= 0) return { account: a, memberIndex: idx };
        }
        return null;
      },

      currentAccount() {
        const s = get().session;
        return s ? (get().accounts[s.email] || null) : null;
      },

      currentMember() {
        const acc = get().currentAccount();
        const s   = get().session;
        if (!acc || !s) return null;
        return acc.members?.[0] || null;
      },

      viewerHandle() {
        const s = get().session;
        return s?.handle || '';
      },

      generateOtp(key) {
        const code = String(Math.floor(100000 + Math.random() * 900000));
        set((s) => ({ _otps: { ...(s._otps || {}), [key]: code } }));
        return code;
      },

      verifyOtp(key, code) {
        const stored = (get()._otps || {})[key];
        if (!stored || stored !== String(code).trim()) return false;
        set((s) => { const next = { ...(s._otps || {}) }; delete next[key]; return { _otps: next }; });
        return true;
      },
    }),
    {
      name: 'aura-v4',
      version: 5,
      migrate(persisted) {
        const state = persisted || {};
        const sessionId = String(state.session?.id || '');
        const localSession = sessionId === 'demo' || sessionId.startsWith('local-');
        return {
          ...state,
          session: localSession ? null : state.session,
          pendingWho: null,
          accounts: {},
          notifications: [],
          activeMatch: null,
          citaDoble: {
            ...(state.citaDoble || {}),
            isSearching: false,
            sessionId: null,
            participants: [],
          },
        };
      },
      partialize: (s) => ({
        accounts: s.accounts,
        session: s.session,
        onboardingCompletado: s.onboardingCompletado,
        sparks: s.sparks,
        dailyFreeSpark: s.dailyFreeSpark,
        activeMatch: s.activeMatch,
        dailyLikesRemaining: s.dailyLikesRemaining,
        citaDoble: s.citaDoble,
        registrationData: s.registrationData,
        notifications: s.notifications,
      }),
    }
  )
);

function slugify(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 20) || 'user';
}

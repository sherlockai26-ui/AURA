import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase.js';

/*
 * AccountRecord
 * {
 *   email, handle, password, mode: 'single'|'duo',
 *   members: [{ name, handle, phone, verified, isAdmin, photo }],
 *   duoPhoto: null|string,
 *   bio: string,
 *   deletionVotes: string[],  // member handles que votaron eliminar
 *   pendingPartner: boolean,  // un miembro salió, admin esperando nuevo integrante
 *   pendingInvite: null|{ name, phone, otp, ts },
 *   createdAt: number
 * }
 *
 * Session
 * { email, identity: 'member0'|'member1'|'duo', ts }
 *
 * Nota multi-dispositivo: localStorage es propio de cada dispositivo/navegador,
 * por lo que dos dispositivos distintos tienen sus propios datos sin conflicto.
 * Dos tabs del mismo navegador compartirían store (limitación del mock local).
 * En producción: backend + JWT por dispositivo resuelve esto nativamente.
 */

export const useAuthStore = create(
  persist(
    (set, get) => ({
      accounts: {},
      session: null,
      pendingWho: null,   // { email } — transient, no persisted
      _otps: {},          // { key: code } — transient, no persisted
      user: null,         // Firebase User object — transient, no persisted
      onboardingCompletado: false,
      sparks: 50,
      dailyFreeSpark: true,

      /* ── Match ───────────────────────────────────────────────────── */
      activeMatch: null,          // { matchId, otherUserId, otherNickname, chatExpiresAt, videoCallMinutesLeft, daysLeft, giftVideoUsed }
      dailyLikesRemaining: 5,

      /* ── Cita Doble ──────────────────────────────────────────────── */
      citaDoble: {
        isSearching:      false,
        sessionId:        null,
        participants:     [],     // [{ id, type, label, handle, color, emoji }]
        timeRemaining:    600,    // 10 min en segundos
        freeEntriesToday: 1,
      },

      registrationData: {
        modalidad: null,        // 'singular' | 'duo'
        nombreNido: '',
        email: '',
        password: '',
        miembros: [],           // [{ apodo, edad, genero, name, phone }]
        terminosAceptados: false,
        kycVerificado: false,
        // Estado interno para restaurar el formulario al volver del KYC
        _step: 1,
        _account: null,
        _p1: null,
        _p2: null,
      },

      /* ── Queries ─────────────────────────────────────────────────── */

      findByIdentifier(identifier) {
        const s = String(identifier || '').trim().toLowerCase();
        if (!s) return null;
        const accs = Object.values(get().accounts);
        const byEmail  = accs.find((a) => a.email === s);
        if (byEmail) return { account: byEmail, memberIndex: 0 };
        const byHandle = accs.find((a) => a.handle.toLowerCase() === s);
        if (byHandle) return { account: byHandle, memberIndex: 0 };
        for (const a of accs) {
          const idx = a.members.findIndex((m) => m.handle.toLowerCase() === s);
          if (idx >= 0) return { account: a, memberIndex: idx };
        }
        return null;
      },

      currentAccount() {
        const s = get().session;
        return s ? (get().accounts[s.email] || null) : null;
      },

      currentMember() {
        const acc  = get().currentAccount();
        const s    = get().session;
        if (!acc || !s) return null;
        if (s.identity === 'member0') return acc.members[0] || null;
        if (s.identity === 'member1') return acc.members[1] || null;
        return null; // 'duo' identity — no individual member
      },

      viewerHandle() {
        const acc = get().currentAccount();
        const s   = get().session;
        if (!acc || !s) return '';
        if (s.identity === 'duo')     return acc.handle;
        if (s.identity === 'member0') return acc.members[0]?.handle || acc.handle;
        if (s.identity === 'member1') return acc.members[1]?.handle || acc.handle;
        return acc.handle;
      },

      /* ── OTP helpers ─────────────────────────────────────────────── */

      generateOtp(key) {
        const code = String(Math.floor(100000 + Math.random() * 900000));
        set((s) => ({ _otps: { ...s._otps, [key]: code } }));
        return code;
      },

      verifyOtp(key, code) {
        const stored = get()._otps[key];
        if (!stored || stored !== String(code).trim()) return false;
        set((s) => {
          const next = { ...s._otps };
          delete next[key];
          return { _otps: next };
        });
        return true;
      },

      /* ── Auth ────────────────────────────────────────────────────── */

      /* ── Cita Doble methods ──────────────────────────────────────── */
      startSearch() {
        set((s) => ({ citaDoble: { ...s.citaDoble, isSearching: true } }));
      },
      cancelSearch() {
        set((s) => ({ citaDoble: { ...s.citaDoble, isSearching: false } }));
      },
      joinSession(sessionId, participants) {
        set((s) => ({
          citaDoble: { ...s.citaDoble, isSearching: false, sessionId, participants, timeRemaining: 600 },
        }));
      },
      leaveSession() {
        set((s) => ({
          citaDoble: { ...s.citaDoble, sessionId: null, participants: [], timeRemaining: 600 },
        }));
      },
      extendTime(seconds, cost) {
        if (!get().spendSpark(cost)) return false;
        set((s) => ({
          citaDoble: { ...s.citaDoble, timeRemaining: s.citaDoble.timeRemaining + seconds },
        }));
        return true;
      },
      decrementFreeEntry() {
        set((s) => ({
          citaDoble: {
            ...s.citaDoble,
            freeEntriesToday: Math.max(0, s.citaDoble.freeEntriesToday - 1),
          },
        }));
      },

      setActiveMatch(match) {
        set({ activeMatch: match });
      },
      clearActiveMatch() {
        set({ activeMatch: null });
      },
      decrementLikes() {
        set((s) => ({ dailyLikesRemaining: Math.max(0, s.dailyLikesRemaining - 1) }));
      },
      resetDailyLikes() {
        set({ dailyLikesRemaining: 5 });
      },

      setRegistrationData(data) {
        set((s) => ({ registrationData: { ...s.registrationData, ...data } }));
      },

      resetRegistrationData() {
        set({
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
        });
      },

      login(identifier, password) {
        // Cuenta de demostración
        if (
          identifier.trim().toLowerCase() === 'test@aura.com' &&
          password === 'Test123!'
        ) {
          set({ session: { email: 'test@aura.com', identity: 'member0', ts: Date.now() } });
          return { needsWho: false };
        }
        const hit = get().findByIdentifier(identifier);
        if (!hit) throw new Error('No encontramos esa cuenta o nickname.');
        if (hit.account.password !== password) throw new Error('Contraseña incorrecta.');
        if (hit.account.mode === 'duo') {
          set({ pendingWho: { email: hit.account.email } });
          return { needsWho: true };
        }
        set({ session: { email: hit.account.email, identity: 'member0', ts: Date.now() } });
        return { needsWho: false };
      },

      finalizeIdentity(email, identity) {
        set({ session: { email, identity, ts: Date.now() }, pendingWho: null });
      },

      clearPendingWho() {
        set({ pendingWho: null });
      },

      logout() {
        set({ session: null, pendingWho: null });
      },

      /* ── Registration ────────────────────────────────────────────── */

      register(payload) {
        const email = payload.email.trim().toLowerCase();
        if (get().accounts[email]) throw new Error('Ya existe una cuenta con este correo.');
        const members = payload.members.map((m, i) => ({
          name: m.name.trim(),
          handle: (m.handle || slugify(m.name) || `${slugify(payload.handle)}-${i + 1}`).toLowerCase(),
          phone: m.phone.trim(),
          verified: true,
          isAdmin: i === 0,
          photo: null,
        }));
        const account = {
          email,
          handle: payload.handle.trim(),
          password: payload.password,
          mode: payload.mode,
          members,
          duoPhoto: null,
          bio: '',
          deletionVotes: [],
          pendingPartner: false,
          pendingInvite: null,
          createdAt: Date.now(),
        };
        set((s) => ({
          accounts: { ...s.accounts, [email]: account },
          session: { email, identity: 'member0', ts: Date.now() },
        }));
        return account;
      },

      /* ── Duo management ─────────────────────────────────────────── */

      // Miembro abandona el Duo. Requiere OTP previo (verificado fuera).
      leaveDuo(email, memberIndex) {
        set((s) => {
          const acc = s.accounts[email];
          if (!acc) return {};
          const remaining = acc.members.filter((_, i) => i !== memberIndex).map((m) => ({
            ...m,
            isAdmin: true,
          }));
          return {
            accounts: {
              ...s.accounts,
              [email]: { ...acc, members: remaining, pendingPartner: true, deletionVotes: [] },
            },
          };
        });
      },

      // Admin invita a un nuevo integrante.
      invitePartner(email, partnerData) {
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        set((s) => {
          const acc = s.accounts[email];
          if (!acc) return {};
          return {
            accounts: {
              ...s.accounts,
              [email]: { ...acc, pendingInvite: { ...partnerData, otp, ts: Date.now() } },
            },
          };
        });
        return otp; // devolver para mostrar en demo
      },

      // Nuevo integrante acepta la invitación (OTP verificado externamente).
      acceptInvite(email, memberData) {
        set((s) => {
          const acc = s.accounts[email];
          if (!acc || !acc.pendingInvite) return {};
          const newMember = {
            name: memberData.name || acc.pendingInvite.name,
            handle: slugify(memberData.name || acc.pendingInvite.name),
            phone: memberData.phone || acc.pendingInvite.phone,
            verified: true,
            isAdmin: false,
            photo: null,
          };
          const updatedAccount = {
            ...acc,
            members: [...acc.members, newMember],
            pendingPartner: false,
            pendingInvite: null,
          };
          return {
            accounts: { ...s.accounts, [email]: updatedAccount },
            session: { email, identity: 'member1', ts: Date.now() },
          };
        });
      },

      // Votar eliminar cuenta. Si ambos miembros votaron → se elimina.
      voteDeletion(email, memberHandle) {
        const acc = get().accounts[email];
        if (!acc) return false;
        const already = acc.deletionVotes.includes(memberHandle);
        if (already) return false;
        const nextVotes = [...acc.deletionVotes, memberHandle];
        const allVoted = nextVotes.length >= acc.members.length;
        if (allVoted) {
          set((s) => {
            const next = { ...s.accounts };
            delete next[email];
            return { accounts: next, session: null };
          });
          return 'deleted';
        }
        set((s) => ({
          accounts: {
            ...s.accounts,
            [email]: { ...acc, deletionVotes: nextVotes },
          },
        }));
        return 'voted';
      },

      cancelDeletionVote(email, memberHandle) {
        set((s) => {
          const acc = s.accounts[email];
          if (!acc) return {};
          return {
            accounts: {
              ...s.accounts,
              [email]: { ...acc, deletionVotes: acc.deletionVotes.filter((h) => h !== memberHandle) },
            },
          };
        });
      },

      // Eliminar cuenta directamente (Single o admin único).
      deleteAccount(email) {
        set((s) => {
          const next = { ...s.accounts };
          delete next[email];
          return { accounts: next, session: null };
        });
      },

      /* ── Profile / Photos ────────────────────────────────────────── */

      updatePhoto(email, target, dataUrl) {
        set((s) => {
          const acc = s.accounts[email];
          if (!acc) return {};
          if (target === 'duo') {
            return { accounts: { ...s.accounts, [email]: { ...acc, duoPhoto: dataUrl } } };
          }
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

      /* ── Chispas ─────────────────────────────────────────────────── */

      spendSpark(amount = 1) {
        const { sparks, dailyFreeSpark } = get();
        if (dailyFreeSpark && amount === 1) { set({ dailyFreeSpark: false }); return true; }
        if (sparks < amount) return false;
        set({ sparks: sparks - amount });
        return true;
      },
      addSparks(amount) { set({ sparks: get().sparks + amount }); },
      completeOnboarding() { set({ onboardingCompletado: true }); },

      setUser(firebaseUser) { set({ user: firebaseUser }); },
    }),
    {
      name: 'aura-v3',
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
      }),
    }
  )
);

onAuthStateChanged(auth, (firebaseUser) => {
  useAuthStore.getState().setUser(firebaseUser);
});

function slugify(s) {
  return String(s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 20) || 'user';
}

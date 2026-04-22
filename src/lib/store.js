import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Mock store: accounts + session + Chispas. En producción el "DB de accounts"
// vive en el backend; aquí lo mantenemos en localStorage solo para demo.
//
// AccountRecord:
//   {
//     email: string,
//     handle: string,
//     password: string,
//     mode: 'single' | 'duo',
//     members: Array<{ name, phone, handle, verified }>,
//     createdAt: number,
//     bio?: string
//   }
//
// Session:
//   { email: string, activeMemberIndex: number, ts: number }

export const useAuthStore = create(
  persist(
    (set, get) => ({
      accounts: {},
      session: null,
      sparks: 50,
      dailyFreeSpark: true,

      // ---- queries --------------------------------------------------
      findByIdentifier(identifier) {
        const s = String(identifier || '').trim().toLowerCase();
        if (!s) return null;
        const accs = Object.values(get().accounts);
        const byEmail = accs.find((a) => a.email === s);
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
        return s ? get().accounts[s.email] || null : null;
      },

      currentMember() {
        const acc = get().currentAccount();
        const s = get().session;
        if (!acc || !s) return null;
        return acc.members[s.activeMemberIndex] || null;
      },

      // ---- auth / lifecycle -----------------------------------------
      register(payload) {
        const email = payload.email.trim().toLowerCase();
        if (get().accounts[email]) {
          throw new Error('Ya existe una cuenta con este correo.');
        }
        const members = payload.members.map((m, i) => ({
          name: m.name.trim(),
          phone: m.phone.trim(),
          handle: (m.handle || slugify(m.name) || `${payload.handle}-${i + 1}`).toLowerCase(),
          verified: true,
        }));
        const account = {
          email,
          handle: payload.handle.trim(),
          password: payload.password,
          mode: payload.mode, // 'single' | 'duo'
          members,
          createdAt: Date.now(),
          bio: '',
        };
        set((state) => ({
          accounts: { ...state.accounts, [email]: account },
          session: { email, activeMemberIndex: 0, ts: Date.now() },
        }));
        return account;
      },

      login(identifier, password) {
        const hit = get().findByIdentifier(identifier);
        if (!hit) throw new Error('No encontramos esa cuenta o nickname.');
        if (hit.account.password !== password) throw new Error('Contraseña incorrecta.');
        set({
          session: {
            email: hit.account.email,
            activeMemberIndex: hit.memberIndex,
            ts: Date.now(),
          },
        });
        return hit.account;
      },

      logout() {
        set({ session: null });
      },

      deleteAccount() {
        const s = get().session;
        if (!s) return;
        set((state) => {
          const next = { ...state.accounts };
          delete next[s.email];
          return { accounts: next, session: null };
        });
      },

      setActiveMember(index) {
        set((state) => ({
          session: state.session ? { ...state.session, activeMemberIndex: index } : null,
        }));
      },

      // ---- Chispas --------------------------------------------------
      spendSpark(amount = 1) {
        const { sparks, dailyFreeSpark } = get();
        if (dailyFreeSpark && amount === 1) {
          set({ dailyFreeSpark: false });
          return true;
        }
        if (sparks < amount) return false;
        set({ sparks: sparks - amount });
        return true;
      },
      addSparks(amount) {
        set({ sparks: get().sparks + amount });
      },
    }),
    {
      name: 'aura-auth-v2',
      version: 2,
      partialize: (s) => ({
        accounts: s.accounts,
        session: s.session,
        sparks: s.sparks,
        dailyFreeSpark: s.dailyFreeSpark,
      }),
    }
  )
);

function slugify(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 20);
}

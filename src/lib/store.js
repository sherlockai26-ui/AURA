import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Auth + Chispas (moneda virtual). Mock local; reemplazar por API real.
export const useAuthStore = create(
  persist(
    (set, get) => ({
      isAuthed: false,
      identifier: null, // email o nickname con el que entró
      session: null,
      sparks: 50, // Chispas iniciales de cortesía
      dailyFreeSpark: true,
      login(identifier) {
        // En producción: validar contra API + 2FA. Aquí simulamos éxito.
        set({
          isAuthed: true,
          identifier,
          session: { ts: Date.now() },
        });
      },
      logout() {
        set({ isAuthed: false, identifier: null, session: null });
      },
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
      name: 'aura-auth',
      partialize: (s) => ({
        isAuthed: s.isAuthed,
        identifier: s.identifier,
        session: s.session,
        sparks: s.sparks,
        dailyFreeSpark: s.dailyFreeSpark,
      }),
    }
  )
);

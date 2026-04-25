import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import BrandLogo from '../components/BrandLogo.jsx';
import Particles from '../components/Particles.jsx';
import { useAuthStore } from '../lib/store.js';
import { auth } from '../lib/firebase.js';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export default function Login() {
  const navigate    = useNavigate();
  const login       = useAuthStore((s) => s.login);
  const session     = useAuthStore((s) => s.session);
  const pendingWho  = useAuthStore((s) => s.pendingWho);

  useEffect(() => { if (session)    navigate('/feed',          { replace: true }); }, [session, navigate]);
  useEffect(() => { if (pendingWho) navigate('/who-is-here',   { replace: true }); }, [pendingWho, navigate]);

  const [identifier,   setIdentifier]   = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState('');
  const [submitting,   setSubmitting]   = useState(false);

  function validate() {
    if (!identifier.trim()) return 'Escribe tu correo o NickName.';
    if (identifier.includes('@') && !EMAIL_RE.test(identifier.trim())) return 'Correo inválido.';
    if (password.length < 6) return 'Contraseña mínima de 6 caracteres.';
    return '';
  }

  async function onSubmit(e) {
    e.preventDefault();
    const v = validate();
    if (v) { setError(v); return; }
    setError('');
    setSubmitting(true);
    try {
      if (EMAIL_RE.test(identifier.trim())) {
        await signInWithEmailAndPassword(auth, identifier.trim(), password).catch(() => null);
      }
      const { needsWho } = login(identifier.trim(), password);
      if (!needsWho) navigate('/feed', { replace: true });
      // Si needsWho=true, el useEffect de pendingWho redirige a /who-is-here
    } catch (err) {
      setError(err.message || 'No pudimos iniciarte sesión.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-[100dvh] bg-aura-bg text-white">
      <Particles />
      <main className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[480px] flex-col px-6 py-8">

        <header className="flex flex-col items-center pt-6 pb-2">
          <BrandLogo size={108} />
          <h1 className="mt-4 font-light text-white" style={{ fontSize: 32, letterSpacing: 4 }}>AURA</h1>
          <p className="mt-1 text-aura-text-2" style={{ fontSize: 12, letterSpacing: 2 }}>Tu espacio sagrado</p>
        </header>

        <form onSubmit={onSubmit} noValidate className="mt-8 flex-1 flex flex-col">
          <label htmlFor="login-id" className="sr-only">Correo electrónico o NickName</label>
          <input
            id="login-id"
            type="text"
            inputMode="email"
            autoComplete="username"
            placeholder="Correo electrónico o NickName"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full rounded-card bg-aura-surface px-4 py-4 text-white placeholder-aura-text-2 outline-none border border-transparent transition focus:border-aura-purple focus:shadow-glow-purple"
          />

          <div className="relative mt-4">
            <label htmlFor="login-pass" className="sr-only">Contraseña</label>
            <input
              id="login-pass"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-card bg-aura-surface px-4 py-4 pr-12 text-white placeholder-aura-text-2 outline-none border border-transparent transition focus:border-aura-purple focus:shadow-glow-purple"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-aura-cyan p-2"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => navigate('/recuperar')}
            className="mt-1 self-end text-aura-cyan hover:underline bg-transparent border-none p-0 cursor-pointer"
            style={{ fontSize: 12 }}
          >
            ¿Olvidaste tu contraseña?
          </button>

          {error && (
            <p role="alert" className="mt-3 text-aura-error text-center" style={{ fontSize: 12 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-pill bg-aura-cyan py-4 font-semibold uppercase text-aura-bg tracking-wider shadow-glow-cyan transition active:scale-[.99] disabled:opacity-60 hover:opacity-90"
          >
            {submitting ? 'Entrando…' : 'Iniciar sesión'}
          </button>

          <div className="my-5 flex items-center gap-3 text-aura-text-2">
            <span className="h-px flex-1 bg-aura-text-2/40" />
            <span style={{ fontSize: 12 }}>O</span>
            <span className="h-px flex-1 bg-aura-text-2/40" />
          </div>

          <button
            type="button"
            onClick={() => navigate('/registro')}
            className="w-full rounded-pill border-[1.5px] border-aura-purple bg-transparent py-4 font-semibold uppercase tracking-wider text-white transition hover:shadow-glow-purple active:scale-[.99]"
          >
            Registrarse
          </button>
        </form>

        <footer className="mt-6 flex flex-col items-center gap-2 pb-2">
          <p className="text-center text-aura-text-2" style={{ fontSize: 10 }}>
            Al entrar, aceptas nuestros{' '}
            <button type="button" onClick={() => navigate('/terminos')} className="text-aura-text-2 hover:underline bg-transparent border-none p-0 cursor-pointer" style={{ fontSize: 10 }}>Términos</button> y{' '}
            <button type="button" onClick={() => navigate('/privacidad')} className="text-aura-text-2 hover:underline bg-transparent border-none p-0 cursor-pointer" style={{ fontSize: 10 }}>Política de Privacidad</button>.
          </p>
          <p className="flex items-center gap-1 text-aura-cyan" style={{ fontSize: 10 }}>
            <span aria-hidden>🔒</span> Conexión segura E2E
          </p>
        </footer>
      </main>
    </div>
  );
}

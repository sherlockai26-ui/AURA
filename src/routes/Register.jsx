import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import BrandLogo from '../components/BrandLogo.jsx';
import Particles from '../components/Particles.jsx';
import { useAuthStore } from '../lib/store.js';
import { auth, db } from '../lib/firebase.js';

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const HANDLE_RE = /^[a-zA-Z0-9_.]{3,24}$/;

export default function Register() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const register              = useAuthStore((s) => s.register);
  const session               = useAuthStore((s) => s.session);
  const registrationData      = useAuthStore((s) => s.registrationData);
  const setRegistrationData   = useAuthStore((s) => s.setRegistrationData);
  const resetRegistrationData = useAuthStore((s) => s.resetRegistrationData);
  const kycVerificado         = registrationData.kycVerificado;

  useEffect(() => {
    if (session) navigate('/feed', { replace: true });
  }, [session, navigate]);

  const [step, setStep] = useState(1);
  const [mode, setMode] = useState(null); // 'single' | 'duo'
  const [account, setAccount] = useState({ email: '', handle: '', password: '', showPass: false });
  const [p1, setP1] = useState({ name: '', phone: '', apodo: '', edad: '', genero: '' });
  const [p2, setP2] = useState({ name: '', phone: '', apodo: '', edad: '', genero: '' });
  const [termsChecked, setTermsChecked] = useState(false);
  const [otpValues, setOtpValues] = useState({ 1: ['', '', '', '', '', ''], 2: ['', '', '', '', '', ''] });
  const [generatedOtps, setGeneratedOtps] = useState({ 1: '', 2: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Restaurar estado del formulario al volver desde VerifyKYC
  useEffect(() => {
    if (location.state?.fromKYC) {
      const rd = registrationData;
      if (rd.modalidad) setMode(rd.modalidad === 'singular' ? 'single' : rd.modalidad);
      if (rd._account)  setAccount(rd._account);
      if (rd._p1)       setP1(rd._p1);
      if (rd._p2)       setP2(rd._p2);
      if (rd._step)     setStep(rd._step);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const totalSteps = 4;
  const isDuo = mode === 'duo';

  function go(n) { setError(''); setStep(n); }

  function validateStep1() {
    if (!mode) return 'Elige un modo para continuar.';
    return '';
  }
  function validateStep2() {
    if (!EMAIL_RE.test(account.email.trim())) return 'Correo inválido.';
    if (!HANDLE_RE.test(account.handle.trim())) return 'NickName: 3–24 letras/números.';
    if (account.password.length < 8) return 'Contraseña mínima de 8 caracteres.';
    return '';
  }
  function validateStep3() {
    if (!p1.name.trim()) return 'Escribe tu nombre.';
    if (digitsOf(p1.phone) < 8) return 'Teléfono inválido.';
    if (isDuo) {
      if (!p2.name.trim()) return 'Escribe el nombre de tu pareja.';
      if (digitsOf(p2.phone) < 8) return 'Teléfono de tu pareja inválido.';
      if (p1.phone.trim() === p2.phone.trim()) return 'Los teléfonos no pueden ser iguales.';
    }
    if (!termsChecked) return isDuo
      ? 'Confirma que ambos son mayores de 18 años.'
      : 'Confirma que eres mayor de 18 años.';
    if (!kycVerificado) return 'Debes verificar tu edad con INE o Pasaporte antes de continuar.';
    return '';
  }

  function goToKYC() {
    // Persistir estado antes de navegar para restaurarlo al volver
    setRegistrationData({
      modalidad:  mode === 'single' ? 'singular' : mode,
      nombreNido: account.handle,
      email:      account.email,
      password:   account.password,
      miembros:   isDuo
        ? [
            { apodo: p1.apodo, edad: p1.edad, genero: p1.genero, name: p1.name, phone: p1.phone },
            { apodo: p2.apodo, edad: p2.edad, genero: p2.genero, name: p2.name, phone: p2.phone },
          ]
        : [{ apodo: p1.apodo, edad: p1.edad, genero: p1.genero, name: p1.name, phone: p1.phone }],
      terminosAceptados: termsChecked,
      _step:    step,
      _account: account,
      _p1:      p1,
      _p2:      p2,
    });
    navigate('/verificacion');
  }
  function validateStep4() {
    const code1 = otpValues[1].join('');
    if (code1.length !== 6 || code1 !== generatedOtps[1]) {
      return isDuo ? 'El código del primer teléfono no coincide.' : 'El código no coincide.';
    }
    if (isDuo) {
      const code2 = otpValues[2].join('');
      if (code2.length !== 6 || code2 !== generatedOtps[2]) {
        return 'El código del segundo teléfono no coincide.';
      }
    }
    return '';
  }

  function onNext() {
    const v =
      step === 1 ? validateStep1() :
      step === 2 ? validateStep2() :
      step === 3 ? validateStep3() :
      validateStep4();
    if (v) { setError(v); return; }

    if (step === 3) {
      // Generar OTPs al entrar al paso 4
      const codes = { 1: randomOtp(), 2: isDuo ? randomOtp() : '' };
      setGeneratedOtps(codes);
      setOtpValues({ 1: ['', '', '', '', '', ''], 2: ['', '', '', '', '', ''] });
    }

    if (step === totalSteps) return onSubmit();
    go(step + 1);
  }

  async function onSubmit() {
    setSubmitting(true);
    try {
      register({
        mode,
        email: account.email,
        handle: account.handle,
        password: account.password,
        members: isDuo
          ? [
              { name: p1.name, phone: p1.phone, handle: p1.apodo },
              { name: p2.name, phone: p2.phone, handle: p2.apodo },
            ]
          : [{ name: p1.name, phone: p1.phone, handle: p1.apodo }],
      });
      const email = account.email.trim().toLowerCase();
      const fbResult = await createUserWithEmailAndPassword(auth, email, account.password).catch(() => null);
      if (fbResult?.user) {
        const { uid } = fbResult.user;
        await setDoc(doc(db, 'users', uid), { uid, email, createdAt: serverTimestamp() }).catch(() => null);
      }
      resetRegistrationData();
      navigate('/feed', { replace: true });
    } catch (err) {
      setError(err.message || 'No pudimos crear tu cuenta.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-[100dvh] bg-aura-bg text-white">
      <Particles />

      <main className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[480px] flex-col px-6 py-8">
        <header className="flex flex-col items-center">
          <BrandLogo size={72} />
          <h1 className="mt-3 font-light" style={{ fontSize: 26, letterSpacing: 4 }}>
            REGISTRO
          </h1>
          <p className="text-aura-text-2" style={{ fontSize: 12 }}>
            Paso {step} de {totalSteps} · {mode ? (isDuo ? 'Modo Duo' : 'Modo Single') : '—'}
          </p>
          <StepProgress step={step} total={totalSteps} />
        </header>

        <div className="mt-4 flex-1">
          {step === 1 && <StepMode mode={mode} setMode={setMode} />}
          {step === 2 && <StepAccount value={account} onChange={setAccount} />}
          {step === 3 && (
            <StepPeople
              isDuo={isDuo}
              p1={p1} setP1={setP1}
              p2={p2} setP2={setP2}
              termsChecked={termsChecked}
              onTermsChange={setTermsChecked}
              kycVerificado={kycVerificado}
              onVerifyKYC={goToKYC}
            />
          )}
          {step === 4 && (
            <StepVerify
              isDuo={isDuo}
              phones={{ 1: p1.phone, 2: p2.phone }}
              values={otpValues}
              onChange={setOtpValues}
              codes={generatedOtps}
            />
          )}

          {error && (
            <p role="alert" className="mt-4 text-center text-aura-error" style={{ fontSize: 13 }}>
              {error}
            </p>
          )}
        </div>

        <div className="mt-4 flex gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={() => go(step - 1)}
              className="flex-1 rounded-pill border border-white/15 py-4 font-semibold uppercase tracking-wider text-aura-text-2 transition hover:text-white"
            >
              Atrás
            </button>
          )}
          <button
            type="button"
            onClick={onNext}
            disabled={submitting}
            className="flex-[2] rounded-pill bg-aura-cyan py-4 font-semibold uppercase tracking-wider text-aura-bg shadow-glow-cyan transition active:scale-[.99] disabled:opacity-60 hover:opacity-90"
          >
            {step === totalSteps ? (submitting ? 'Creando…' : 'Crear cuenta') : 'Continuar'}
          </button>
        </div>

        <p className="mt-5 text-center text-aura-text-2" style={{ fontSize: 12 }}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-aura-cyan hover:underline">
            Inicia sesión
          </Link>
        </p>
      </main>
    </div>
  );
}

/* ================================================================== */
/* Steps                                                              */
/* ================================================================== */

function StepMode({ mode, setMode }) {
  return (
    <section className="mt-2 flex flex-col gap-3" aria-label="Elige modo de cuenta">
      <p className="text-center text-aura-text-2" style={{ fontSize: 13 }}>
        ¿Cómo vas a usar AURA? Podrás cambiarlo más adelante solo creando una nueva cuenta.
      </p>

      <ModeCard
        active={mode === 'single'}
        onClick={() => setMode('single')}
        title="Single"
        subtitle="Un perfil. Tu ritmo, tu espacio."
        body="Ideal si exploras sola/o. Una identidad, un correo, un teléfono."
        icon="◐"
      />
      <ModeCard
        active={mode === 'duo'}
        onClick={() => setMode('duo')}
        title="Duo"
        subtitle="Una cuenta, dos personas."
        body="Perfil unificado con subperfiles individuales. Feed compartido, espacios privados. Doble verificación SMS."
        icon="∞"
      />
    </section>
  );
}

function ModeCard({ active, onClick, title, subtitle, body, icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-start gap-3 rounded-card border p-4 text-left transition ${
        active
          ? 'border-aura-purple bg-aura-surface shadow-glow-purple'
          : 'border-white/10 bg-aura-surface hover:border-white/30'
      }`}
      aria-pressed={active}
    >
      <span
        className="grid h-12 w-12 shrink-0 place-items-center rounded-full border text-aura-purple"
        style={{ borderColor: active ? '#9D4EDD' : 'rgba(255,255,255,0.1)', fontSize: 22 }}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold">{title}</h3>
          {active && <span className="text-xs text-aura-cyan">Seleccionado</span>}
        </div>
        <p className="mt-0.5 text-sm text-white/90">{subtitle}</p>
        <p className="mt-1 text-xs text-aura-text-2">{body}</p>
      </div>
    </button>
  );
}

function StepAccount({ value, onChange }) {
  return (
    <section className="mt-2 flex flex-col gap-3" aria-label="Datos de la cuenta">
      <p className="text-center text-aura-text-2" style={{ fontSize: 13 }}>
        Este correo identifica a tu cuenta. El modo queda asociado al correo registrado.
      </p>

      <Input
        label="Correo electrónico"
        value={value.email}
        onChange={(v) => onChange({ ...value, email: v })}
        type="email"
        autoComplete="email"
      />
      <Input
        label="NickName público"
        value={value.handle}
        onChange={(v) => onChange({ ...value, handle: v })}
        autoComplete="username"
      />
      <PasswordInput
        label="Contraseña"
        value={value.password}
        onChange={(v) => onChange({ ...value, password: v })}
        show={value.showPass}
        onToggle={() => onChange({ ...value, showPass: !value.showPass })}
      />
    </section>
  );
}

function StepPeople({ isDuo, p1, setP1, p2, setP2, termsChecked, onTermsChange, kycVerificado, onVerifyKYC }) {
  return (
    <section className="mt-2 flex flex-col gap-5">
      <PersonBlock title={isDuo ? 'Persona 1' : 'Tus datos'} value={p1} onChange={setP1} />
      {isDuo && <PersonBlock title="Persona 2" value={p2} onChange={setP2} />}

      <p className="text-center text-aura-text-2" style={{ fontSize: 12 }}>
        <span className="text-aura-cyan" aria-hidden>🔒</span>{' '}
        Las fotos con rostro solo serán visibles para Matches confirmados.
      </p>

      {/* Checkbox de edad */}
      <label className="flex cursor-pointer items-start gap-3 rounded-card border border-white/10 bg-aura-surface p-3">
        <input
          type="checkbox"
          checked={termsChecked}
          onChange={(e) => onTermsChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-aura-cyan"
        />
        <span className="text-xs text-aura-text-2">
          {isDuo
            ? 'Ambos somos mayores de 18 años y aceptamos los términos de AURA.'
            : 'Soy mayor de 18 años y acepto los términos de AURA.'}
        </span>
      </label>

      {/* Verificación KYC */}
      <div className="rounded-card border border-aura-purple/40 bg-aura-surface p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-aura-cyan" style={{ fontSize: 16 }}>🛡️</span>
          <p className="text-sm font-semibold text-white">Verificación de edad</p>
        </div>
        <p className="mb-3 text-xs text-aura-text-2">
          Requerida para continuar. Escanea tu INE o Pasaporte.
        </p>
        {kycVerificado ? (
          <div className="flex items-center gap-2 text-sm text-aura-cyan">
            <span>✓</span>
            <span className="font-medium">Edad verificada correctamente</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={onVerifyKYC}
            className="w-full rounded-pill border border-aura-purple bg-transparent py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:shadow-glow-purple active:scale-[.99]"
          >
            Verificar Edad con INE/Pasaporte
          </button>
        )}
      </div>

      <p className="text-center text-aura-text-2" style={{ fontSize: 12 }}>
        Verificaremos {isDuo ? 'ambos teléfonos' : 'tu teléfono'} por SMS en el siguiente paso.
      </p>
    </section>
  );
}

function PersonBlock({ title, value, onChange }) {
  return (
    <div className="rounded-card bg-aura-surface p-4">
      <h3 className="mb-3 text-sm font-semibold tracking-wider text-white/90">{title}</h3>
      <div className="flex flex-col gap-3">
        <Input
          label="Nombre"
          value={value.name}
          onChange={(v) => onChange({ ...value, name: v })}
        />
        <Input
          label="Apodo (opcional)"
          value={value.apodo}
          onChange={(v) => onChange({ ...value, apodo: v })}
        />
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            placeholder="Edad (18–99)"
            value={value.edad}
            maxLength={2}
            onChange={(e) => {
              const n = e.target.value.replace(/\D/g, '').slice(0, 2);
              onChange({ ...value, edad: n });
            }}
            className="w-28 rounded-card bg-aura-bg px-4 py-4 text-white placeholder-aura-text-2 outline-none border border-transparent transition focus:border-aura-purple focus:shadow-glow-purple"
          />
          <select
            value={value.genero}
            onChange={(e) => onChange({ ...value, genero: e.target.value })}
            className="min-w-0 flex-1 rounded-card bg-aura-bg px-4 py-4 text-white outline-none border border-transparent transition focus:border-aura-purple appearance-none"
            style={{ color: value.genero ? '#fff' : '#B0B0B0' }}
          >
            <option value="" style={{ color: '#B0B0B0' }}>Género/Identidad (opc.)</option>
            <option value="hombre">Hombre</option>
            <option value="mujer">Mujer</option>
            <option value="no-binario">No binario</option>
            <option value="prefiero-no-decir">Prefiero no decir</option>
          </select>
        </div>
        <Input
          label="Teléfono móvil"
          value={value.phone}
          onChange={(v) => onChange({ ...value, phone: v })}
          type="tel"
          inputMode="tel"
        />
      </div>
    </div>
  );
}

function StepVerify({ isDuo, phones, values, onChange, codes }) {
  return (
    <section className="mt-2 flex flex-col gap-5" aria-label="Verificación SMS">
      <p className="text-center text-aura-text-2" style={{ fontSize: 13 }}>
        {isDuo
          ? 'Enviamos un código a cada teléfono. Ambos deben coincidir para continuar.'
          : 'Enviamos un código a tu teléfono. Es obligatorio para continuar.'}
      </p>

      <OtpBlock
        label={`Código enviado a ${maskPhone(phones[1])}`}
        value={values[1]}
        onChange={(arr) => onChange({ ...values, 1: arr })}
      />
      {isDuo && (
        <OtpBlock
          label={`Código enviado a ${maskPhone(phones[2])}`}
          value={values[2]}
          onChange={(arr) => onChange({ ...values, 2: arr })}
        />
      )}

      <div className="rounded-card border border-white/10 bg-aura-surface/70 p-3 text-center" style={{ fontSize: 11 }}>
        <span className="text-aura-text-2">Modo demo · códigos: </span>
        <span className="font-mono text-aura-cyan">{codes[1]}</span>
        {isDuo && (
          <>
            <span className="text-aura-text-2"> y </span>
            <span className="font-mono text-aura-cyan">{codes[2]}</span>
          </>
        )}
      </div>
    </section>
  );
}

function OtpBlock({ label, value, onChange }) {
  const refs = useRef([]);
  return (
    <div>
      <p className="mb-2 text-center text-xs text-aura-text-2">{label}</p>
      <div className="flex justify-center gap-2">
        {value.map((v, i) => (
          <input
            key={i}
            ref={(el) => (refs.current[i] = el)}
            inputMode="numeric"
            maxLength={1}
            value={v}
            onChange={(e) => {
              const ch = e.target.value.replace(/\D/g, '').slice(0, 1);
              const next = [...value];
              next[i] = ch;
              onChange(next);
              if (ch && i < value.length - 1) refs.current[i + 1]?.focus();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && !value[i] && i > 0) {
                refs.current[i - 1]?.focus();
              }
            }}
            className="h-14 w-12 rounded-card bg-aura-surface text-center text-xl text-white outline-none border border-white/10 focus:border-aura-purple focus:shadow-glow-purple"
          />
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/* Shared inputs                                                      */
/* ================================================================== */

function Input({ label, value, onChange, type = 'text', inputMode, autoComplete }) {
  return (
    <input
      type={type}
      inputMode={inputMode}
      autoComplete={autoComplete}
      placeholder={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-card bg-aura-surface px-4 py-4 text-white placeholder-aura-text-2 outline-none border border-transparent transition focus:border-aura-purple focus:shadow-glow-purple"
    />
  );
}

function PasswordInput({ label, value, onChange, show, onToggle }) {
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        placeholder={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="new-password"
        className="w-full rounded-card bg-aura-surface px-4 py-4 pr-12 text-white placeholder-aura-text-2 outline-none border border-transparent transition focus:border-aura-purple focus:shadow-glow-purple"
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-aura-cyan p-2"
      >
        {show ? '🙈' : '👁️'}
      </button>
    </div>
  );
}

function StepProgress({ step, total }) {
  const items = useMemo(() => Array.from({ length: total }, (_, i) => i + 1), [total]);
  return (
    <div className="mt-4 flex w-full max-w-[240px] gap-1.5">
      {items.map((i) => (
        <span
          key={i}
          className={`h-1 flex-1 rounded-full transition ${
            i <= step ? 'bg-aura-cyan shadow-glow-cyan' : 'bg-white/10'
          }`}
        />
      ))}
    </div>
  );
}

/* ================================================================== */
/* Utils                                                              */
/* ================================================================== */

function digitsOf(s) { return String(s || '').replace(/\D/g, '').length; }
function maskPhone(p) {
  if (!p) return '—';
  const d = String(p).replace(/\s+/g, '');
  return d.slice(0, 3) + ' ••• ' + d.slice(-2);
}
function randomOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

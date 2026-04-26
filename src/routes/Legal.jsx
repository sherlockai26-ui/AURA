import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TODAY = '26/04/2026';

const TERMINOS = [
  { heading: true,  text: `Última actualización: ${TODAY}` },
  { heading: true,  text: '1. Aceptación de los términos' },
  { heading: false, text: 'Al acceder y utilizar Aura, aceptas quedar vinculado por estos términos y condiciones. Si no estás de acuerdo, no uses la plataforma.' },
  { heading: true,  text: '2. Descripción del servicio' },
  { heading: false, text: 'Aura es una red social privada para parejas adultas que desean explorar conexiones de forma segura y consensuada.' },
  { heading: true,  text: '3. Elegibilidad' },
  { heading: false, text: 'Debes ser mayor de 18 años para usar esta plataforma. La verificación de edad es obligatoria. Al registrarte, confirmas que cumples este requisito.' },
  { heading: true,  text: '4. Conducta de los usuarios' },
  { heading: false, text: 'Los usuarios deben tratar a los demás con respeto mutuo. Está prohibido publicar contenido ilegal, acoso o difusión no consentida de información o imágenes privadas.' },
  { heading: true,  text: '5. Privacidad y seguridad' },
  { heading: false, text: 'Aura implementa cifrado extremo a extremo en sus comunicaciones. Las capturas de pantalla están bloqueadas dentro de la app. Los rostros están prohibidos en contenido público del perfil.' },
  { heading: true,  text: '6. Limitación de responsabilidad' },
  { heading: false, text: 'Aura no se hace responsable de las interacciones entre usuarios fuera de la plataforma ni del contenido generado por los mismos.' },
  { heading: true,  text: '7. Contacto' },
  { heading: false, text: 'Para consultas legales: soporte@auraco-necci.com' },
];

const PRIVACIDAD = [
  { heading: true,  text: `Última actualización: ${TODAY}` },
  { heading: true,  text: '1. Información que recopilamos' },
  { heading: false, text: 'Recopilamos: email, nombre de usuario, edad, fotos de perfil y preferencias de conexión para ofrecer el servicio.' },
  { heading: true,  text: '2. Uso de la información' },
  { heading: false, text: 'Utilizamos tu información para conectar usuarios afines, mejorar la experiencia en la plataforma y garantizar la seguridad de todos los usuarios.' },
  { heading: true,  text: '3. Compartir información' },
  { heading: false, text: 'No vendemos tus datos a terceros. Tu información solo se comparte con los matches que aceptes explícitamente.' },
  { heading: true,  text: '4. Seguridad de los datos' },
  { heading: false, text: 'Aplicamos cifrado de extremo a extremo, almacenamiento seguro en servidores protegidos y acceso restringido a los datos personales.' },
  { heading: true,  text: '5. Derechos del usuario' },
  { heading: false, text: 'Puedes acceder, rectificar o solicitar la eliminación de tu información en cualquier momento desde la configuración de tu cuenta.' },
  { heading: true,  text: '6. Cookies y tecnologías similares' },
  { heading: false, text: 'Utilizamos tecnologías de almacenamiento local (como localStorage) para mantener tu sesión activa y guardar preferencias.' },
  { heading: true,  text: '7. Cambios a esta política' },
  { heading: false, text: 'Notificaremos cualquier cambio relevante mediante un aviso en la aplicación. El uso continuado implica la aceptación de los cambios.' },
  { heading: true,  text: '8. Contacto' },
  { heading: false, text: 'Para consultas de privacidad: soporte@auraconecta.com' },
];

export default function Legal() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('terminos');
  const content = tab === 'terminos' ? TERMINOS : PRIVACIDAD;

  return (
    <div className="mx-auto max-w-[480px] px-4 py-6 text-white" style={{ background: '#0B0C10', minHeight: '100dvh' }}>
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-aura-text-2 hover:text-white text-xl"
        >
          ‹
        </button>
        <h1 className="text-xl font-semibold">Legal</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 mb-5">
        {[['terminos', 'Términos'], ['privacidad', 'Privacidad']].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex-1 py-2.5 text-sm font-semibold transition ${
              tab === key
                ? 'border-b-2 border-aura-cyan text-aura-cyan'
                : 'text-aura-text-2 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Contenido scrollable */}
      <div className="overflow-y-auto pb-8" style={{ maxHeight: 'calc(100dvh - 200px)', padding: '0 4px' }}>
        {content.map((item, i) => (
          <p
            key={i}
            className={`mb-3 text-sm leading-relaxed ${
              item.heading ? 'font-semibold text-white mt-4' : 'text-[#B0B0B0]'
            }`}
          >
            {item.text}
          </p>
        ))}
      </div>
    </div>
  );
}

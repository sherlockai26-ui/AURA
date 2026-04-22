import { useEffect, useState } from 'react';

/**
 * Best-effort anti-captura. En navegadores web NO existe una API que prohíba
 * tomar capturas; lo único que podemos hacer:
 *  - Detectar cuando la pestaña pierde foco (un screenshot suele cambiar visibilidad
 *    en Android/iOS por un instante muy breve, no garantizado).
 *  - Detectar si hay screen sharing activo en la pestaña actual.
 *  - Aplicar overlays/watermarks que ensucien la captura con el handle del usuario.
 *
 * Devuelve { hide } para enmascarar contenido sensible cuando hay sospecha.
 */
export default function useCaptureGuard() {
  const [hide, setHide] = useState(false);

  useEffect(() => {
    function onVisibility() {
      // Si la pestaña va a oculto, mostramos overlay al regresar por unos ms.
      if (document.visibilityState === 'hidden') {
        setHide(true);
        setTimeout(() => setHide(false), 600);
      }
    }
    function onBlur() { setHide(true); }
    function onFocus() { setHide(false); }

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);

    // Detección de screen sharing (Chrome/Edge desktop).
    let stopShareCheck = null;
    if (navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices) {
      // Sin pedir permisos: se puede inferir solo a través de getDisplayMedia activo
      // por eventos del propio sitio. Aquí dejamos hook abierto para integrarlo
      // cuando la app inicie videochat (Destello).
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      if (stopShareCheck) stopShareCheck();
    };
  }, []);

  return { hide };
}

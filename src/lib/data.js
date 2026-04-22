// Datos mock del feed. En producción vienen de API paginada (scroll infinito).

const handles = [
  '@LunaSecreta', '@DuetoNoctambulo', '@HiloDePlata', '@VeranoEterno',
  '@CieloDeOpalo', '@RitualPrivado', '@BrasaYSeda', '@EclipseEnDuo',
  '@AguaDeLuna', '@PielDeAmbar', '@AlbaYCarmesi', '@FuegoSuave',
];

// Genera un post sintético determinista por índice para evitar warnings de hidratación.
function makePost(i) {
  const handle = handles[i % handles.length];
  const ts = ['hace 5 min', 'hace 1 h', 'hace 3 h', 'hace 8 h', 'ayer'][i % 5];
  const captions = [
    'Una noche tranquila, una copa, una conversación que enciende todo. ✨ #Conexión #Nido',
    'Se nos quemó la cena. Bailamos en la cocina. No nos importó. #Nosotros',
    'Abrimos el #ÁlbumPrivado de la escapada. Solo siluetas, solo recuerdos. 🔒',
    'Probamos el modo Destello por primera vez. Risas y nervios. Lo recomendamos. ⚡',
    'Domingo lento. Lectura en voz alta. Ese plan también es lujo. #RitualPropio',
  ];
  const caption = captions[i % captions.length];
  return {
    id: 'p' + i,
    handle,
    timestamp: ts,
    isPrivate: i % 3 === 0,
    sparks: 50 + ((i * 23) % 400),
    comments: 1 + ((i * 7) % 40),
    caption,
    mediaSeed: i,
  };
}

export function getInitialPosts(n = 6) {
  return Array.from({ length: n }, (_, i) => makePost(i));
}

export function getMorePosts(offset, n = 4) {
  return Array.from({ length: n }, (_, i) => makePost(offset + i));
}

// Stories: dos colecciones (Tu Círculo / Explorar)
export const storiesCircle = handles.slice(0, 7).map((h, i) => ({
  id: 'sc' + i,
  handle: h,
  unseen: i % 2 === 0,
  seed: i + 1,
}));

export const storiesExplore = handles.slice(4, 12).map((h, i) => ({
  id: 'se' + i,
  handle: h.replace('@', '@x.'),
  unseen: true,
  seed: i + 30,
}));

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

// Perfiles mock para Zona de Match (Single)
export const mockSingles = [
  {
    id: 's1', apodo: '@LunaEterna', edad: 27, genero: 'mujer', online: true,
    bio: 'Amante del jazz y el café a medianoche. Busco conexión real, sin prisa.',
    tags: ['Jazz', 'Literatura', 'Café', 'Viajes'],
    seed: 101,
  },
  {
    id: 's2', apodo: '@VolcanCalmo', edad: 31, genero: 'hombre', online: false,
    bio: 'Chef aficionado, ciclista de fines de semana y coleccionista de vinilos raros.',
    tags: ['Cocina', 'Ciclismo', 'Música', 'Arte'],
    seed: 102,
  },
  {
    id: 's3', apodo: '@MarDeNoche', edad: 25, genero: 'mujer', online: true,
    bio: 'Psicóloga de día, lectora compulsiva de noche. Me gustan las conversaciones de fondo.',
    tags: ['Psicología', 'Lectura', 'Filosofía', 'Yoga'],
    seed: 103,
  },
  {
    id: 's4', apodo: '@CieloInfinito', edad: 29, genero: 'no-binario', online: true,
    bio: 'Diseñador gráfico y viajero de bajo presupuesto. He dormido en 14 países.',
    tags: ['Diseño', 'Viajes', 'Fotografía', 'Mochila'],
    seed: 104,
  },
  {
    id: 's5', apodo: '@BrasaRoja', edad: 33, genero: 'hombre', online: false,
    bio: 'Padre de un perro enorme. Trabajo en tecnología pero vivo afuera del mundo digital.',
    tags: ['Tech', 'Naturaleza', 'Perros', 'Senderismo'],
    seed: 105,
  },
  {
    id: 's6', apodo: '@EspejoRoto', edad: 24, genero: 'mujer', online: true,
    bio: 'Actriz de teatro experimental. Busco alguien que no le tema a la profundidad.',
    tags: ['Teatro', 'Poesía', 'Cine', 'Improvisación'],
    seed: 106,
  },
  {
    id: 's7', apodo: '@VientoSur', edad: 36, genero: 'hombre', online: false,
    bio: 'Médico de urgencias. En mi tiempo libre: surf, tablas y silencio.',
    tags: ['Medicina', 'Surf', 'Oceano', 'Meditación'],
    seed: 107,
  },
  {
    id: 's8', apodo: '@FlorDeRoca', edad: 28, genero: 'mujer', online: true,
    bio: 'Bióloga marina con pasión por los hongos y la fermentación artesanal.',
    tags: ['Ciencia', 'Naturaleza', 'Gastronomía', 'DIY'],
    seed: 108,
  },
  {
    id: 's9', apodo: '@EcoDelValle', edad: 30, genero: 'hombre', online: true,
    bio: 'Músico independiente. Compongo por las noches y enseño guitarra por las mañanas.',
    tags: ['Música', 'Guitarra', 'Composición', 'Enseñanza'],
    seed: 109,
  },
  {
    id: 's10', apodo: '@NieblaAzul', edad: 26, genero: 'mujer', online: false,
    bio: 'Arquitecta de espacios y emociones. Creo que el hogar más importante es la persona.',
    tags: ['Arquitectura', 'Diseño', 'Minimalismo', 'Arte'],
    seed: 110,
  },
];

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

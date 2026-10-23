// ============================================
// Maps rival team names from Supabase to their
// corresponding crest image in /public/equipos/
// ============================================

/**
 * Mapping of normalised rival names → image filenames
 * Keys are lowercase, trimmed versions of common rival names.
 * Values are the filenames inside /public/equipos/.
 */
const RIVAL_MAP: Record<string, string> = {
  // Exact or partial matches
  'alemán': 'aleman.png',
  'aleman': 'aleman.png',
  'club alemán': 'aleman.png',
  'club aleman': 'aleman.png',
  'andes talleres': 'andestalleres.png',
  'banco nación': 'banconacion.png',
  'banco nacion': 'banconacion.png',
  'cementista': 'cementista.png',
  'circulo policial': 'circulopolicial.png',
  'círculo policial': 'circulopolicial.png',
  'cuc': 'cuc.png',
  'club universitario de córdoba': 'cuc.png',
  'club universitario de cordoba': 'cuc.png',
  'don bosco': 'donbosco.png',
  'don orione': 'donorione.png',
  'godoy cruz': 'godoycruz.png',
  'independiente rivadavia': 'independienterivadavia.png',
  'independiente': 'independienterivadavia.png',
  'jockey': 'jockey.png',
  'jockey club': 'jockey.png',
  'la colonia vistalba': 'lacoloniavistalba.png',
  'colonia vistalba': 'lacoloniavistalba.png',
  'regatas': 'regatas.png',
  'club regatas': 'regatas.png',
  'san martín': 'sanmartin.png',
  'san martin': 'sanmartin.png',
  'universidad maza': 'universidadmaza.png',
  'umaza': 'universidadmaza.png',
  'villa hipódromo': 'villahipodromo.png',
  'villa hipodromo': 'villahipodromo.png',
};

/**
 * Returns the public path to the rival team's crest image.
 * Falls back to null if no match is found.
 */
export function getRivalShieldPath(rivalName: string): string | null {
  const normalised = rivalName.trim().toLowerCase();

  // 1. Direct match
  if (RIVAL_MAP[normalised]) {
    return `/equipos/${RIVAL_MAP[normalised]}`;
  }

  // 2. Partial / fuzzy match — check if any key is contained in the rival name
  for (const [key, filename] of Object.entries(RIVAL_MAP)) {
    if (normalised.includes(key) || key.includes(normalised)) {
      return `/equipos/${filename}`;
    }
  }

  return null;
}

/**
 * Maps competition / tournament name to its logo in /public/torneos/.
 * Currently only the FSP logo is available.
 */
const TOURNAMENT_MAP: Record<string, string> = {
  'fsp': 'FSP.png',
  'fsp masculino': 'FSP.png',
  'serie a': 'FSP.png',
  'formativas': 'FSP.png',
  'categorías formativas': 'FSP.png',
  'categorias formativas': 'FSP.png',
  'futsal primera': 'FSP.png',
  'primera división': 'FSP.png',
  'primera division': 'FSP.png',
  'liga mendocina': 'FSP.png',
  'liga mendocina de futsal': 'FSP.png',
  'torneo apertura': 'FSP.png',
  'torneo clausura': 'FSP.png',
};

export function getTournamentLogoPath(competitionName: string): string | null {
  const normalised = competitionName.trim().toLowerCase();

  if (TOURNAMENT_MAP[normalised]) {
    return `/torneos/${TOURNAMENT_MAP[normalised]}`;
  }

  for (const [key, filename] of Object.entries(TOURNAMENT_MAP)) {
    if (normalised.includes(key) || key.includes(normalised)) {
      return `/torneos/${filename}`;
    }
  }

  // Fallback: always show FSP if no specific match (since it's the only tournament)
  return '/torneos/FSP.png';
}

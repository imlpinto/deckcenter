/**
 * Cartas curadas para mostrar en el home cuando la plataforma aún no tiene
 * suficiente data de actividad propia.
 *
 * Actúan como placeholder de "tendencias del mes" hasta que existan
 * >= 8 cartas con actividad real en la plataforma (vistas o compras).
 *
 * Usa IDs de pokemontcg.io — formato: {set_id}-{card_number}
 * Para buscar IDs: https://api.pokemontcg.io/v2/cards?q=name:pikachu*
 *
 * Mantén al menos 16 IDs como pool de respaldo: si alguna
 * falla al cargar, el sistema toma la siguiente hasta completar 8.
 */
export const CURATED_CARD_IDS: string[] = [
  // ── Pool principal — sets recientes 2023–2025 ──────────────────────
  'sv8pt5-161',   // Umbreon ex SIR — Prismatic Evolutions (2025)
  'sv3pt5-193',   // Charizard ex SIR — Pokémon 151 (2023)
  'sv4pt5-8',     // Pikachu ex — Paldean Fates (2024)
  'sv3-225',      // Gardevoir ex SIR — Obsidian Flames (2023)
  'sv6-178',      // Iono SIR — Twilight Masquerade (2024)
  'sv7-191',      // Terapagos ex SIR — Stellar Crown (2024)
  'sv5-191',      // Miriam SIR — Paldea Evolved (2023)
  'sv4-186',      // Arven SIR — Paradox Rift (2023)
  // ── Respaldo extra (se usan si alguno del pool falla) ──────────────
  'sv1-198',      // Miriam SIR — Scarlet & Violet Base (2023)
  'sv2-235',      // Iono SIR — Paldea Evolved (2023)
  'sv3pt5-91',    // Charizard ex — Paldean Fates (2024)
  'sv6-129',      // Ogerpon ex SIR — Twilight Masquerade (2024)
  'sv8pt5-86',    // Sylveon ex SIR — Prismatic Evolutions (2025)
  'sv8pt5-131',   // Espeon ex SIR — Prismatic Evolutions (2025)
  'swsh12pt5-160',// Charizard VSTAR Rainbow — Crown Zenith (2023)
  'swsh12pt5-183',// Pikachu VMAX Rainbow — Crown Zenith (2023)
]

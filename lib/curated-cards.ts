/**
 * Cartas curadas para mostrar en el home cuando la plataforma aún no tiene
 * suficiente data de vistas propias (< 4 cartas únicas vistas).
 *
 * Cada entrada usa el ID de TCGdex (visible en la URL: /carta/{id}).
 * Cuando quieras cambiar una carta, reemplaza el id por el que aparece
 * en la URL del detalle de esa carta en Deckcenter.
 *
 * Una vez la plataforma acumule datos reales esta lista se ignora
 * automáticamente y se muestran las cartas más vistas por la comunidad.
 */
export const CURATED_CARD_IDS: string[] = [
  // ── Edita esta lista con los IDs que prefieras ──
  'sv06-130',
  'me02.5-256',
  'sv10-136',
  'me01-173',
  'sv10-224',
  'sv10.5w-080',
  'sv06-165',
  'me01-160',
  
]

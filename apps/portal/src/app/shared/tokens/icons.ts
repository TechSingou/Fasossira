/**
 * FASOSSIRA — Catalogue d'icônes SVG (Lucide Icons)
 *
 * Fichier : apps/web/src/app/shared/tokens/icons.ts
 *
 * Usage :
 *   import { ICONS } from '@shared/tokens/icons';
 *   // dans le template :
 *   <fas-nav-icon [path]="ICONS.dashboard" />
 *
 * Principe :
 *   - Chaque valeur est le contenu SVG interne (le <path> ou groupe)
 *   - viewBox toujours "0 0 24 24", stroke="currentColor",
 *     stroke-width="2", stroke-linecap="round", stroke-linejoin="round"
 *   - Aucun emoji, aucun unicode — uniquement SVG
 */
export const ICONS = {

  /* ── Navigation ──────────────────────────────────────── */
  dashboard: `
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>`,

  clock: `
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12,6 12,12 16,14"/>`,

  calendar: `
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>`,

  map: `
    <polygon points="3,6 9,3 15,6 21,3 21,18 15,21 9,18 3,21"/>
    <line x1="9" y1="3" x2="9" y2="18"/>
    <line x1="15" y1="6" x2="15" y2="21"/>`,

  bus: `
    <rect x="1" y="3" width="15" height="13"/>
    <polygon points="16,8 20,8 23,11 23,16 16,16 16,8"/>
    <circle cx="5.5" cy="18.5" r="2.5"/>
    <circle cx="18.5" cy="18.5" r="2.5"/>`,

  ticket: `
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>
    <line x1="9" y1="9" x2="9.01" y2="9"/>
    <line x1="15" y1="9" x2="15.01" y2="9"/>
    <line x1="9" y1="15" x2="9.01" y2="15"/>
    <line x1="15" y1="15" x2="15.01" y2="15"/>`,

  users: `
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>`,

  building: `
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9,22 9,12 15,12 15,22"/>`,

  settings: `
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.07 4.93A10 10 0 0 0 4.93 19.07m14.14 0A10 10 0 0 0 4.93 4.93"/>`,

  /* ── Actions ─────────────────────────────────────────── */
  plus: `
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>`,

  logout: `
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16,17 21,12 16,7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>`,

  menu: `
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="18" x2="21" y2="18"/>`,

  bell: `
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>`,

  refresh: `
    <polyline points="23,4 23,10 17,10"/>
    <path d="M20.49 15a9 9 0 1 1-.93-8.07"/>`,

  print: `
    <polyline points="6,9 6,2 18,2 18,9"/>
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
    <rect x="6" y="14" width="12" height="8"/>`,

  check: `
    <polyline points="20 6 9 17 4 12"/>`,

  chevronRight: `
    <polyline points="9,18 15,12 9,6"/>`,

  chevronDown: `
    <polyline points="6,9 12,15 18,9"/>`,

  home: `
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>`,

  /* ── Super Admin ─────────────────────────────────────── */
  globe: `
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>`,

  creditCard: `
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>`,

  layers: `
    <polygon points="12,2 2,7 12,12 22,7"/>
    <polyline points="2,17 12,22 22,17"/>
    <polyline points="2,12 12,17 22,12"/>`,

  /* ── Agent ───────────────────────────────────────────── */
  smartphone: `
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
    <line x1="12" y1="18" x2="12.01" y2="18"/>`,

  clipboardList: `
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    <line x1="9" y1="12" x2="15" y2="12"/>
    <line x1="9" y1="16" x2="13" y2="16"/>`,

  /* ── Status / états ──────────────────────────────────── */
  warning: `
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>`,

  info: `
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>`,

  /* ── KPI / Analytics ─────────────────────────────────── */
  trendingUp: `
    <polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/>
    <polyline points="17,6 23,6 23,12"/>`,

  dollarSign: `
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>`,

  activity: `
    <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>`,


  /* ── Ajouts portal ────────────────────────────────── */
  arrowRight: `<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/>`,

  chevronLeft: `<polyline points="15 18 9 12 15 6"/>`,

  printer: `<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>`,

} as const;

/**
 * PATCH — fleet-list.component.ts
 *
 * Fichier : apps/web/src/app/features/admin/fleet/fleet-list.component.ts
 *
 * Remplacer UNIQUEMENT la méthode addBusBtnTitle() (lignes 362–366) :
 *
 * AVANT (invalide) :
 *   protected addBusBtnTitle(): string {
 *     return this.quotasStore.canAddBus()
 *       ? 'Ajouter un bus'
 *       : `Limite atteinte (${this.quotasStore.busUsage()?.used}/${this.quotasStore.busUsage()?.limit})`;
 *   }
 *
 * APRÈS (correct) :
 *   Le store expose busesQuota() → { current, max, remaining, limitReached, planName }
 *   Il n'y a pas de busUsage(). Utiliser busesQuota().current et busesQuota().max.
 */

// ── Méthode corrigée à substituer dans la classe FleetListComponent ──────────

protected addBusBtnTitle(): string {
  if (this.quotasStore.canAddBus()) return 'Ajouter un bus';
  const q = this.quotasStore.busesQuota();
  return `Limite atteinte (${q.current}/${q.max}) — passez à un plan supérieur`;
}

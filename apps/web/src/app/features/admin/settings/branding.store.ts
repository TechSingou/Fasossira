// apps/web/src/app/features/admin/settings/branding.store.ts
import { inject } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { BrandingService, BrandingSettings, UpdateBrandingDto } from './branding.service';

interface BrandingState {
  settings: BrandingSettings | null;
  loading: boolean;
  saving: boolean;
  uploadingLogo: boolean;
  error: string | null;
  successMessage: string | null;
  /** companyId du dernier chargement — détecte un changement de tenant */
  loadedForCompanyId: string | null;
}

const initialState: BrandingState = {
  settings: null,
  loading: false,
  saving: false,
  uploadingLogo: false,
  error: null,
  successMessage: null,
  loadedForCompanyId: null,
};

export const BrandingStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  withComputed((store) => ({
    primaryColor:   computed(() => store.settings()?.primaryColor   ?? '#0B3D91'),
    secondaryColor: computed(() => store.settings()?.secondaryColor ?? '#E63B2E'),
    displayName:    computed(() => store.settings()?.companyDisplayName ?? ''),
    logoUrl:        computed(() => store.settings()?.logoUrl ?? null),
    hasLogo:        computed(() => !!store.settings()?.logoUrl),
  })),

  withMethods((store, svc = inject(BrandingService)) => ({

    /**
     * Charge les settings depuis l'API.
     * @param companyId — Passé depuis le composant (lu dans AuthStore).
     *   Permet de détecter un changement de tenant et forcer le rechargement.
     *   Si null/undefined, recharge toujours (comportement sûr par défaut).
     */
    async loadSettings(companyId?: string | null): Promise<void> {
      // ✅ Recharge si : jamais chargé, changement de tenant, ou après une erreur
      const alreadyLoaded =
        store.settings() !== null &&
        store.error() === null &&
        (companyId == null || store.loadedForCompanyId() === companyId);

      if (alreadyLoaded) return;

      patchState(store, { loading: true, error: null });
      try {
        const settings = await firstValueFrom(svc.getSettings());
        patchState(store, {
          settings,
          loadedForCompanyId: companyId ?? settings.companyId,
        });
      } catch (e: any) {
        patchState(store, { error: e?.error?.message ?? 'Erreur de chargement' });
      } finally {
        patchState(store, { loading: false });
      }
    },

    /**
     * Sauvegarde uniquement les champs du formulaire (UpdateBrandingDto).
     * Types stricts — jamais d'envoi de id/companyId/updatedAt vers l'API.
     */
    async saveSettings(dto: UpdateBrandingDto): Promise<boolean> {
      patchState(store, { saving: true, error: null, successMessage: null });
      try {
        const settings = await firstValueFrom(svc.updateSettings(dto));
        patchState(store, { settings, successMessage: 'Paramètres sauvegardés avec succès' });
        return true;
      } catch (e: any) {
        patchState(store, { error: e?.error?.message ?? 'Erreur lors de la sauvegarde' });
        return false;
      } finally {
        patchState(store, { saving: false });
      }
    },

    async uploadLogo(file: File): Promise<boolean> {
      patchState(store, { uploadingLogo: true, error: null, successMessage: null });
      try {
        const settings = await firstValueFrom(svc.uploadLogo(file));
        patchState(store, { settings, successMessage: 'Logo mis à jour avec succès' });
        return true;
      } catch (e: any) {
        patchState(store, { error: e?.error?.message ?? "Erreur lors de l'upload" });
        return false;
      } finally {
        patchState(store, { uploadingLogo: false });
      }
    },

    async deleteLogo(): Promise<void> {
      patchState(store, { saving: true, error: null });
      try {
        const settings = await firstValueFrom(svc.deleteLogo());
        patchState(store, { settings, successMessage: 'Logo supprimé' });
      } catch (e: any) {
        patchState(store, { error: e?.error?.message ?? 'Erreur' });
      } finally {
        patchState(store, { saving: false });
      }
    },

    clearMessages(): void {
      patchState(store, { successMessage: null, error: null });
    },

    /**
     * Réinitialise tout le store.
     * ✅ Appelé au logout pour éviter la fuite de données cross-tenant.
     */
    reset(): void {
      patchState(store, initialState);
    },
  })),
);

export interface UtmParams {
  lead_source: string;
  campaign?: string;
  ad?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

const STORAGE_KEY = 'credzo_utm_attribution';

/**
 * Extracts UTM and attribution parameters from the current URL query string
 * and persists them in sessionStorage for the duration of the user session.
 */
export function captureUtmParams(): UtmParams {
  if (typeof window === 'undefined') {
    return { lead_source: 'website' };
  }

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get('utm_source');
    const utmMedium = urlParams.get('utm_medium');
    const utmCampaign = urlParams.get('utm_campaign');
    const utmContent = urlParams.get('utm_content');
    const utmTerm = urlParams.get('utm_term');
    const ad = urlParams.get('ad');
    const campaign = urlParams.get('campaign');
    const source = urlParams.get('source');

    // Only overwrite stored params if current URL contains new attribution params
    if (utmSource || utmCampaign || source || ad) {
      const captured: UtmParams = {
        lead_source: utmSource || source || 'website',
        campaign: utmCampaign || campaign || undefined,
        ad: ad || undefined,
        utm_source: utmSource || undefined,
        utm_medium: utmMedium || undefined,
        utm_campaign: utmCampaign || campaign || undefined,
        utm_content: utmContent || undefined,
        utm_term: utmTerm || undefined,
      };

      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(captured));
      return captured;
    }

    return getStoredUtmParams();
  } catch (error) {
    console.warn('[Credzo Finance] Failed to capture UTM parameters:', error);
    return { lead_source: 'website' };
  }
}

/**
 * Retrieves stored UTM parameters from sessionStorage.
 * Falls back to default 'website' source if no marketing parameters exist.
 */
export function getStoredUtmParams(): UtmParams {
  if (typeof window === 'undefined') {
    return { lead_source: 'website' };
  }

  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as UtmParams;
    }
  } catch (error) {
    console.warn('[Credzo Finance] Failed to read stored UTM parameters:', error);
  }

  return { lead_source: 'website' };
}

/**
 * Clears stored UTM parameters from sessionStorage.
 */
export function clearStoredUtmParams(): void {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore sessionStorage errors
    }
  }
}

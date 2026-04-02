/** Google Maps JS API key (browser). */
export function getMapsApiKey(): string | undefined {
  const a = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY?.trim();
  const b = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  return a || b || undefined;
}

/** Load Maps JS API with Places library (shared by map + calendar pickers). */
export function loadGoogleMapsApi(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("no window"));
      return;
    }
    const key = getMapsApiKey();
    if (!key) {
      reject(new Error("Missing NEXT_PUBLIC_GOOGLE_MAPS_KEY"));
      return;
    }

    const hasPlaces = () =>
      Boolean(
        (window as unknown as { google?: { maps?: { places?: unknown } } }).google?.maps?.places,
      );

    if ((window as unknown as { google?: { maps?: { Map?: unknown } } }).google?.maps?.Map && hasPlaces()) {
      resolve();
      return;
    }

    const existing = document.querySelector(
      'script[src*="maps.googleapis.com/maps/api/js"]',
    ) as HTMLScriptElement | null;
    if (existing && !existing.src.includes("libraries=places")) {
      existing.remove();
    } else if (existing) {
      const wait = () => {
        if (
          (window as unknown as { google?: { maps?: { Map?: unknown } } }).google?.maps?.Map &&
          hasPlaces()
        ) {
          resolve();
        } else {
          setTimeout(wait, 50);
        }
      };
      wait();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
}

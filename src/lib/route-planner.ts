/** Place portion of "Place - time" titles from the calendar (matches map geocoding). */
export function routeQueryFromTitle(title: string): string {
  const place = title.split(" - ")[0]?.trim() || title;
  return place.trim();
}

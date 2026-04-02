/** Shape returned by FastAPI `GET /discover/{group_id}`. */
export type DiscoverRecommendation = {
  id: string;
  name: string;
  category: string;
  formatted_address?: string | null;
  lat: number;
  lng: number;
  score: number;
};

export type DiscoverResponse = {
  recommendations: DiscoverRecommendation[];
};

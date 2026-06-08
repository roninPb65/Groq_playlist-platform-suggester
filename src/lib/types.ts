// Shared types for the whole app.

export interface QuizAnswers {
  genres: string[];
  mood: string;
  energy: number; // 1 (calm) .. 5 (high energy)
  place: string; // e.g. "Chandigarh, India"
  year: string; // e.g. "2012"
  ageThen: string; // e.g. "16"
  languages: string; // e.g. "Punjabi, Hindi, English"
  market?: string; // ISO 3166-1 alpha-2, e.g. "IN" — biases Spotify catalog
  count: number; // desired number of tracks
}

// What the model returns for each suggestion.
export interface SongSuggestion {
  artist: string;
  title: string;
  year: number | null;
  reason: string;
  confidence: "high" | "medium" | "low";
}

// A suggestion after we try to resolve it against the Spotify catalog.
export interface ResolvedTrack {
  suggested: SongSuggestion;
  matched: boolean;
  uri?: string;
  spotifyUrl?: string;
  name?: string;
  artist?: string;
  albumImage?: string;
  releaseYear?: number;
}

export interface GenerateResponse {
  playlistName: string;
  playlistUrl: string;
  matchedCount: number;
  suggestedCount: number;
  tracks: ResolvedTrack[];
}

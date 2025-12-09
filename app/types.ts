// app/types.ts

export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path?: string;
  vote_average: number;
  release_date?: string;
  video?: string;
  isFanUpload?: boolean;
  userMoviePayload?: UserMovie;
}

export interface MovieDetail extends Movie {
  runtime?: number;
  genres?: { id: number; name: string }[];
  videos?: {
    results: {
      id: string;
      key: string;
      name: string;
      site: string;
      type: string;
    }[];
  };
}

export interface UserMovie {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  posterUri?: string | null;
  trailerUrl?: string;
  genre?: string;
  year?: string;
  actors?: string[];
  createdAt: number;
}

export type RootStackParamList = {
  Tabs: undefined;
  Details: {
    movieId?: number;
    userMovie?: UserMovie;
    playTrailerKey?: string;
    returnAction?: any;
    autoFavorite?: boolean;
  };
  Notifications?: undefined;
  AddMovie?: undefined;
};

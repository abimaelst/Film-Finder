const TMDB_API_KEY = '4d124bc44556e07fcb899d2948d365a2'; // Replace with your actual API key
const OMDB_API_KEY = 'd8452679'; // Replace with your actual API key
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';
const OMDB_BASE_URL = 'https://www.omdbapi.com/';

export async function fetchTrendingMovies(timeWindow = 'week') {
  try {
    const response = await fetch(`${TMDB_BASE_URL}/trending/movie/${timeWindow}?api_key=${TMDB_API_KEY}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.status_message || 'Failed to fetch trending movies');
    }

    return data.results.map(movie => formatTMDBMovie(movie));
  } catch (error) {
    console.error('Error fetching trending movies:', error);
    throw error;
  }
}

/**
 * Searches for movies based on query string
 * @param {string} query - Search term
 * @returns {Promise<Array>} - Array of movie objects matching search
 */
export async function searchMovies(query) {
  if (!query || query.trim() === '') {
    return [];
  }

  try {
    const response = await fetch(`${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.status_message || 'Failed to search movies');
    }

    return data.results.map(movie => formatTMDBMovie(movie));
  } catch (error) {
    console.error('Error searching movies:', error);
    throw error;
  }
}

export async function fetchMovieDetails(movieId) {
  try {
    const tmdbResponse = await fetch(`${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&append_to_response=credits,videos,similar`);
    const tmdbData = await tmdbResponse.json();

    if (!tmdbResponse.ok) {
      throw new Error(tmdbData.status_message || 'Failed to fetch movie details');
    }

    // Fetch additional details from OMDB using IMDB ID
    let omdbData = null;
    if (tmdbData.imdb_id) {
      const omdbResponse = await fetch(`${OMDB_BASE_URL}?apikey=${OMDB_API_KEY}&i=${tmdbData.imdb_id}`);
      omdbData = await omdbResponse.json();

      if (omdbData.Response === 'False') {
        console.warn('OMDB data not available:', omdbData.Error);
        omdbData = null;
      }
    }

    return formatDetailedMovie(tmdbData, omdbData);
  } catch (error) {
    console.error('Error fetching movie details:', error);
    throw error;
  }
}

export async function fetchMoviesByGenre(genreIds, options = {}) {
  try {
    const { page = 1, sortBy = 'popularity.desc', year = '', minRating = '' } = options;

    const genreParam = Array.isArray(genreIds) ? genreIds.join(',') : genreIds;

    let url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreParam}&page=${page}&sort_by=${sortBy}`;

    if (year) {
      url += `&primary_release_year=${year}`;
    }

    if (minRating) {
      url += `&vote_average.gte=${minRating}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.status_message || 'Failed to fetch movies by genre');
    }

    return {
      movies: data.results.map(movie => formatTMDBMovie(movie)),
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results
    };
  } catch (error) {
    console.error('Error fetching movies by genre:', error);
    throw error;
  }
}

export async function fetchGenres() {
  try {
    const response = await fetch(`${TMDB_BASE_URL}/genre/movie/list?api_key=${TMDB_API_KEY}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.status_message || 'Failed to fetch genres');
    }

    return data.genres;
  } catch (error) {
    console.error('Error fetching genres:', error);
    throw error;
  }
}

export async function fetchRandomMovie(filters = {}) {
  try {
    const { genreIds = '', minRating = '', year = '' } = filters;

    const maxPage = 20; // Limiting to 20 for better performance
    const randomPage = Math.floor(Math.random() * maxPage) + 1;

    let url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&page=${randomPage}&sort_by=popularity.desc`;

    if (genreIds) {
      url += `&with_genres=${genreIds}`;
    }

    if (minRating) {
      url += `&vote_average.gte=${minRating}`;
    }

    if (year) {
      url += `&primary_release_year=${year}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.status_message || 'Failed to fetch random movie');
    }

    if (data.results.length === 0) {
      throw new Error('No movies found with the specified filters');
    }

    const randomIndex = Math.floor(Math.random() * data.results.length);
    return formatTMDBMovie(data.results[randomIndex]);
  } catch (error) {
    console.error('Error fetching random movie:', error);
    throw error;
  }
}

function formatTMDBMovie(movie) {
  return {
    id: movie.id,
    title: movie.title,
    posterPath: movie.poster_path ? `${TMDB_IMAGE_BASE_URL}w342${movie.poster_path}` : null,
    backdropPath: movie.backdrop_path ? `${TMDB_IMAGE_BASE_URL}w1280${movie.backdrop_path}` : null,
    releaseDate: movie.release_date,
    releaseYear: movie.release_date ? movie.release_date.split('-')[0] : 'Unknown',
    overview: movie.overview,
    voteAverage: movie.vote_average,
    voteCount: movie.vote_count,
    genreIds: movie.genre_ids || [],
    popularity: movie.popularity
  };
}

/**
 * Formats detailed movie data combining TMDB and OMDB data
 * @param {Object} tmdbData - TMDB detailed movie object
 * @param {Object} omdbData - OMDB movie object
 * @returns {Object} - Combined and formatted movie details object
 */
function formatDetailedMovie(tmdbData, omdbData) {
  const trailer = tmdbData.videos && tmdbData.videos.results.length > 0
    ? tmdbData.videos.results.find(video => video.type === 'Trailer' && video.site === 'YouTube')
    : null;

  const cast = tmdbData.credits?.cast
    ? tmdbData.credits.cast.slice(0, 10).map(person => ({
      id: person.id,
      name: person.name,
      character: person.character,
      profilePath: person.profile_path
        ? `${TMDB_IMAGE_BASE_URL}w185${person.profile_path}`
        : null
    }))
    : [];

  const similarMovies = tmdbData.similar?.results
    ? tmdbData.similar.results.slice(0, 8).map(movie => formatTMDBMovie(movie))
    : [];

  const genres = tmdbData.genres?.map(genre => genre.name) || [];

  const details = {
    id: tmdbData.id,
    imdbId: tmdbData.imdb_id,
    title: tmdbData.title,
    originalTitle: tmdbData.original_title,
    tagline: tmdbData.tagline,
    overview: tmdbData.overview,
    posterPath: tmdbData.poster_path ? `${TMDB_IMAGE_BASE_URL}w500${tmdbData.poster_path}` : null,
    backdropPath: tmdbData.backdrop_path ? `${TMDB_IMAGE_BASE_URL}original${tmdbData.backdrop_path}` : null,
    releaseDate: tmdbData.release_date,
    releaseYear: tmdbData.release_date ? tmdbData.release_date.split('-')[0] : 'Unknown',
    runtime: tmdbData.runtime,
    status: tmdbData.status,
    budget: tmdbData.budget,
    revenue: tmdbData.revenue,
    genres: genres,
    voteAverage: tmdbData.vote_average,
    voteCount: tmdbData.vote_count,
    popularity: tmdbData.popularity,
    productionCompanies: tmdbData.production_companies?.map(company => company.name) || [],
    productionCountries: tmdbData.production_countries?.map(country => country.name) || [],
    spokenLanguages: tmdbData.spoken_languages?.map(language => language.english_name) || [],
    trailer: trailer
      ? {
        key: trailer.key,
        name: trailer.name,
        site: trailer.site,
        url: `https://www.youtube.com/embed/${trailer.key}`
      }
      : null,
    cast: cast,
    similarMovies: similarMovies,

    director: 'Unknown',
    writer: 'Unknown',
    actors: 'Unknown',
    rated: 'Unknown',
    imdbRating: 'N/A',
    metascore: 'N/A',
    rottenTomatoesRating: 'N/A',
  };

  // Add OMDB data if available
  if (omdbData && omdbData.Response === 'True') {
    details.director = omdbData.Director || details.director;
    details.writer = omdbData.Writer || details.writer;
    details.actors = omdbData.Actors || details.actors;
    details.rated = omdbData.Rated || details.rated;
    details.imdbRating = omdbData.imdbRating || details.imdbRating;
    details.metascore = omdbData.Metascore || details.metascore;
    details.awards = omdbData.Awards || 'N/A';

    // Extract Rotten Tomatoes rating if available
    if (omdbData.Ratings && Array.isArray(omdbData.Ratings)) {
      const rtRating = omdbData.Ratings.find(rating => rating.Source === 'Rotten Tomatoes');
      if (rtRating) {
        details.rottenTomatoesRating = rtRating.Value;
      }
    }
  }

  return details;
}
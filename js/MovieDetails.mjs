/**
 * MovieDetails.mjs - Handles displaying detailed movie information
 * 
 * This module is responsible for rendering the detailed movie page,
 * including the movie information, trailer, cast, and similar movies.
 */

import { fetchMovieDetails } from './movieData.mjs';
import { addToWatchlist, removeFromWatchlist, isInWatchlist, markAsWatched, isWatched } from './WatchlistManager.mjs';
import { addToRecentlyViewed, setupSearchFunctionality } from './utils.mjs';

/**
 * Loads and renders movie details for a given movie ID
 * @param {string} movieId - TMDB movie ID
 */
export async function loadMovieDetails(movieId) {
  const detailsContainer = document.getElementById('movie-details-container');
  const loadingSpinner = document.getElementById('loading-spinner');

  try {
    // Set up search functionality in the header
    setupSearchFunctionality();

    const movie = await fetchMovieDetails(movieId);

    // Add to recently viewed
    addToRecentlyViewed(movie);

    // Render movie details
    renderMovieDetails(movie);

    // Render trailer if available
    renderTrailer(movie.trailer);

    // Render cast
    renderCast(movie.cast);

    // Render similar movies
    renderSimilarMovies(movie.similarMovies);

    // Hide loading spinner
    loadingSpinner.classList.add('hidden');
  } catch (error) {
    console.error('Error loading movie details:', error);
    detailsContainer.innerHTML = `
            <div class="error-message">
                <p>Failed to load movie details. Please try again later.</p>
                <p>Error: ${error.message}</p>
                <a href="../index.html" class="cta-button">Return to Home</a>
            </div>
        `;
    loadingSpinner.classList.add('hidden');
  }
}

/**
 * Renders the main movie details section
 * @param {Object} movie - Movie details object
 */
function renderMovieDetails(movie) {
  const detailsContainer = document.getElementById('movie-details-container');
  const inWatchlist = isInWatchlist(movie.id);
  const watched = isWatched(movie.id);

  // Update page title
  document.title = `${movie.title} (${movie.releaseYear}) - FilmFinder`;

  // Format runtime from minutes to hours and minutes
  const hours = Math.floor(movie.runtime / 60);
  const minutes = movie.runtime % 60;
  const formattedRuntime = hours > 0
    ? `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`
    : `${minutes}m`;

  // Format genres as comma-separated list
  const genresList = movie.genres.join(', ');

  detailsContainer.innerHTML = `
        <div class="movie-backdrop" style="background-image: url('${movie.backdropPath || ''}')">
            <div class="backdrop-overlay"></div>
        </div>
        
        <div class="movie-content">
            <div class="movie-poster">
                <img src="${movie.posterPath || '../assets/images/placeholder.jpg'}" alt="${movie.title} Poster">
                
                <div class="movie-actions">
                    ${inWatchlist
      ? `<button id="remove-watchlist" class="action-button remove-button">Remove from Watchlist</button>`
      : `<button id="add-watchlist" class="action-button add-button">Add to Watchlist</button>`
    }
                    
                    ${inWatchlist
      ? (watched
        ? `<button id="mark-unwatched" class="action-button">Mark as Unwatched</button>`
        : `<button id="mark-watched" class="action-button">Mark as Watched</button>`)
      : ''
    }
                </div>
            </div>
            
            <div class="movie-info">
                <h1>${movie.title} <span class="year">(${movie.releaseYear})</span></h1>
                
                ${movie.tagline ? `<p class="tagline">${movie.tagline}</p>` : ''}
                
                <div class="movie-meta">
                    <span class="rated">${movie.rated}</span>
                    <span class="runtime">${formattedRuntime}</span>
                    <span class="genres">${genresList}</span>
                    <span class="release-date">${new Date(movie.releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                
                <div class="ratings">
                    <div class="rating tmdb">
                        <span class="score">${movie.voteAverage.toFixed(1)}</span>
                        <span class="source">TMDB</span>
                    </div>
                    
                    ${movie.imdbRating !== 'N/A' ? `
                        <div class="rating imdb">
                            <span class="score">${movie.imdbRating}</span>
                            <span class="source">IMDb</span>
                        </div>
                    ` : ''}
                    
                    ${movie.metascore !== 'N/A' ? `
                        <div class="rating metacritic">
                            <span class="score">${movie.metascore}</span>
                            <span class="source">Metacritic</span>
                        </div>
                    ` : ''}
                    
                    ${movie.rottenTomatoesRating !== 'N/A' ? `
                        <div class="rating rotten-tomatoes">
                            <span class="score">${movie.rottenTomatoesRating}</span>
                            <span class="source">Rotten Tomatoes</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="overview">
                    <h3>Overview</h3>
                    <p>${movie.overview}</p>
                </div>
                
                <div class="movie-details">
                    <div class="detail-item">
                        <span class="label">Director:</span>
                        <span class="value">${movie.director}</span>
                    </div>
                    
                    <div class="detail-item">
                        <span class="label">Writer:</span>
                        <span class="value">${movie.writer}</span>
                    </div>
                    
                    <div class="detail-item">
                        <span class="label">Stars:</span>
                        <span class="value">${movie.actors}</span>
                    </div>
                    
                    ${movie.awards && movie.awards !== 'N/A' ? `
                        <div class="detail-item">
                            <span class="label">Awards:</span>
                            <span class="value">${movie.awards}</span>
                        </div>
                    ` : ''}
                    
                    ${movie.budget > 0 ? `
                        <div class="detail-item">
                            <span class="label">Budget:</span>
                            <span class="value">$${movie.budget.toLocaleString()}</span>
                        </div>
                    ` : ''}
                    
                    ${movie.revenue > 0 ? `
                        <div class="detail-item">
                            <span class="label">Box Office:</span>
                            <span class="value">$${movie.revenue.toLocaleString()}</span>
                        </div>
                    ` : ''}
                    
                    ${movie.productionCompanies.length > 0 ? `
                        <div class="detail-item">
                            <span class="label">Production:</span>
                            <span class="value">${movie.productionCompanies.join(', ')}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;

  // Add event listeners for watchlist buttons
  if (inWatchlist) {
    document.getElementById('remove-watchlist').addEventListener('click', () => {
      removeFromWatchlist(movie.id);
      renderMovieDetails(movie); // Re-render to update buttons
    });

    if (watched) {
      document.getElementById('mark-unwatched').addEventListener('click', () => {
        markAsWatched(movie.id, false);
        renderMovieDetails(movie); // Re-render to update buttons
      });
    } else {
      document.getElementById('mark-watched').addEventListener('click', () => {
        markAsWatched(movie.id, true);
        renderMovieDetails(movie); // Re-render to update buttons
      });
    }
  } else {
    document.getElementById('add-watchlist').addEventListener('click', () => {
      addToWatchlist({
        id: movie.id,
        title: movie.title,
        posterPath: movie.posterPath,
        releaseYear: movie.releaseYear,
        voteAverage: movie.voteAverage,
        addedAt: new Date().toISOString(),
        watched: false
      });
      renderMovieDetails(movie); // Re-render to update buttons
    });
  }
}

/**
 * Renders the movie trailer section
 * @param {Object|null} trailer - Trailer object or null if no trailer
 */
function renderTrailer(trailer) {
  const trailerContainer = document.getElementById('trailer-container');

  if (trailer) {
    trailerContainer.innerHTML = `
            <div class="trailer-wrapper">
                <iframe 
                    src="${trailer.url}" 
                    title="Movie Trailer" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen
                ></iframe>
            </div>
        `;
  } else {
    trailerContainer.innerHTML = `
            <p class="no-trailer-message">No trailer available for this movie.</p>
        `;
  }
}

/**
 * Renders the cast section
 * @param {Array} cast - Array of cast member objects
 */
function renderCast(cast) {
  const castList = document.getElementById('cast-list');

  if (cast && cast.length > 0) {
    castList.innerHTML = cast.map(person => `
            <div class="cast-card">
                <div class="cast-image">
                    <img src="${person.profilePath || '../assets/images/placeholder.jpg'}" alt="${person.name}">
                </div>
                <div class="cast-info">
                    <h4 class="cast-name">${person.name}</h4>
                    <p class="cast-character">${person.character}</p>
                </div>
            </div>
        `).join('');
  } else {
    castList.innerHTML = `<p class="no-cast-message">No cast information available.</p>`;
  }
}

/**
 * Renders the similar movies section
 * @param {Array} similarMovies - Array of similar movie objects
 */
function renderSimilarMovies(similarMovies) {
  const similarMoviesContainer = document.getElementById('similar-movies');

  if (similarMovies && similarMovies.length > 0) {
    similarMoviesContainer.innerHTML = similarMovies.map(movie => `
            <div class="movie-card">
                <a href="../movie_pages/index.html?id=${movie.id}">
                    <div class="movie-poster">
                        <img src="${movie.posterPath || '../assets/images/placeholder.jpg'}" alt="${movie.title} Poster">
                        <div class="movie-rating">${movie.voteAverage.toFixed(1)}</div>
                    </div>
                    <div class="movie-info">
                        <h3 class="movie-title">${movie.title}</h3>
                        <p class="movie-year">${movie.releaseYear}</p>
                    </div>
                </a>
            </div>
        `).join('');
  } else {
    similarMoviesContainer.innerHTML = `<p class="no-similar-message">No similar movies found.</p>`;
  }
}
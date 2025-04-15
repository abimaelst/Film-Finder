/**
 * MovieList.mjs - Handles rendering lists of movies and search functionality
 * 
 * This module is responsible for rendering movie lists, search results,
 * and managing the homepage functionality.
 */

import {
  fetchTrendingMovies,
  searchMovies,
  fetchGenres,
  fetchMoviesByGenre,
  fetchRandomMovie
} from './movieData.mjs';
import { getRecentlyViewed, setupSearchFunctionality } from './utils.mjs';

// State for filtered movie section
let currentPage = 1;
let totalPages = 1;
let currentGenres = [];
let currentFilters = {};

/**
* Initializes the home page functionality
*/
export async function initHome() {
  try {
    // Set up search functionality
    setupSearchFunctionality();

    // Load trending movies
    await loadTrendingMovies();

    // Load genre buttons
    await loadGenreButtons();

    // Load recently viewed movies
    loadRecentlyViewedMovies();

    // Set up surprise me button
    setupSurpriseMe();

    // Set up filter controls
    setupFilterControls();
  } catch (error) {
    console.error('Error initializing home page:', error);
    showErrorMessage('Failed to load movies. Please try again later.');
  }
}

/**
* Loads trending movies into the trending section
*/
async function loadTrendingMovies() {
  const trendingContainer = document.getElementById('trending-movies');

  try {
    const movies = await fetchTrendingMovies();

    if (movies.length === 0) {
      trendingContainer.innerHTML = '<p class="no-results">No trending movies available.</p>';
      return;
    }

    renderMovieGrid(movies, trendingContainer);
  } catch (error) {
    console.error('Error loading trending movies:', error);
    trendingContainer.innerHTML = '<p class="error-message">Failed to load trending movies.</p>';
  }
}

/**
* Loads genre buttons for filtering
*/
async function loadGenreButtons() {
  const genreContainer = document.getElementById('genre-filters');

  try {
    const genres = await fetchGenres();

    if (genres.length === 0) {
      genreContainer.innerHTML = '<p class="no-results">No genres available.</p>';
      return;
    }

    genreContainer.innerHTML = genres.map(genre => `
          <button class="genre-button" data-genre-id="${genre.id}">${genre.name}</button>
      `).join('');

    // Add event listeners to genre buttons
    const genreButtons = document.querySelectorAll('.genre-button');
    genreButtons.forEach(button => {
      button.addEventListener('click', () => {
        const genreId = button.getAttribute('data-genre-id');

        // Toggle active class
        button.classList.toggle('active');

        // Update current genres
        if (button.classList.contains('active')) {
          currentGenres.push(genreId);
        } else {
          currentGenres = currentGenres.filter(id => id !== genreId);
        }

        // Reset to page 1 when changing filters
        currentPage = 1;

        // Load movies with selected genres
        if (currentGenres.length > 0) {
          loadMoviesByGenre();
        } else {
          // Hide filtered section if no genres selected
          const filteredSection = document.querySelector('.filtered-movies-section');
          filteredSection.classList.add('hidden');
        }
      });
    });
  } catch (error) {
    console.error('Error loading genres:', error);
    genreContainer.innerHTML = '<p class="error-message">Failed to load genres.</p>';
  }
}

/**
* Loads recently viewed movies
*/
function loadRecentlyViewedMovies() {
  const recentlyViewedContainer = document.getElementById('recently-viewed');
  const recentlyViewedSection = document.querySelector('.recently-viewed-section');

  const recentMovies = getRecentlyViewed();

  if (recentMovies.length === 0) {
    recentlyViewedSection.classList.add('hidden');
    return;
  }

  recentlyViewedSection.classList.remove('hidden');
  renderMovieCarousel(recentMovies, recentlyViewedContainer);
}

/**
* Sets up the surprise me button functionality
*/
function setupSurpriseMe() {
  const surpriseButton = document.getElementById('surprise-me-button');
  const surpriseResult = document.getElementById('surprise-result');

  surpriseButton.addEventListener('click', async () => {
    surpriseButton.disabled = true;
    surpriseButton.textContent = 'Finding a movie...';
    surpriseResult.classList.add('hidden');

    try {
      // Get filters from the filter controls
      const yearFilter = document.getElementById('year-filter');
      const ratingFilter = document.getElementById('rating-filter');

      const filters = {
        year: yearFilter.value,
        minRating: ratingFilter.value,
        genreIds: currentGenres.length > 0 ? currentGenres.join(',') : ''
      };

      const movie = await fetchRandomMovie(filters);

      surpriseResult.innerHTML = `
              <div class="surprise-movie">
                  <div class="movie-poster">
                      <a href="movie_pages/index.html?id=${movie.id}">
                          <img src="${movie.posterPath || 'assets/images/placeholder.jpg'}" alt="${movie.title} Poster">
                      </a>
                  </div>
                  <div class="movie-info">
                      <h3>${movie.title} (${movie.releaseYear})</h3>
                      <p class="movie-rating">Rating: ${movie.voteAverage.toFixed(1)}/10</p>
                      <p class="movie-overview">${movie.overview}</p>
                      <a href="movie_pages/index.html?id=${movie.id}" class="cta-button">View Details</a>
                  </div>
              </div>
          `;
      surpriseResult.classList.remove('hidden');
    } catch (error) {
      console.error('Error finding random movie:', error);
      surpriseResult.innerHTML = `
              <p class="error-message">
                  Failed to find a random movie. ${error.message}
                  <br>
                  Please try again or adjust your filters.
              </p>
          `;
      surpriseResult.classList.remove('hidden');
    } finally {
      surpriseButton.disabled = false;
      surpriseButton.textContent = 'Surprise Me!';
    }
  });
}

/**
* Sets up the filter controls
*/
function setupFilterControls() {
  // Populate year filter with last 100 years
  const yearFilter = document.getElementById('year-filter');
  const currentYear = new Date().getFullYear();

  for (let year = currentYear; year >= currentYear - 100; year--) {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    yearFilter.appendChild(option);
  }

  // Add event listeners to filter controls
  const filterControls = document.querySelectorAll('#year-filter, #rating-filter, #sort-by');
  filterControls.forEach(control => {
    control.addEventListener('change', () => {
      // Only apply filters if genres are selected
      if (currentGenres.length > 0) {
        currentPage = 1; // Reset to page 1 when changing filters
        loadMoviesByGenre();
      }
    });
  });

  // Set up pagination controls
  const prevPageButton = document.getElementById('prev-page');
  const nextPageButton = document.getElementById('next-page');

  prevPageButton.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      loadMoviesByGenre();
    }
  });

  nextPageButton.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      loadMoviesByGenre();
    }
  });
}

/**
* Loads movies filtered by selected genres and other filters
*/
async function loadMoviesByGenre() {
  if (currentGenres.length === 0) return;

  const filteredMoviesContainer = document.getElementById('filtered-movies');
  const filteredSection = document.querySelector('.filtered-movies-section');
  const sectionTitle = document.getElementById('filtered-section-title');
  const pageIndicator = document.getElementById('page-indicator');
  const prevPageButton = document.getElementById('prev-page');
  const nextPageButton = document.getElementById('next-page');

  // Show loading state
  filteredSection.classList.remove('hidden');
  filteredMoviesContainer.innerHTML = '<div class="loading-spinner"></div>';

  try {
    // Get filter values
    const yearFilter = document.getElementById('year-filter').value;
    const ratingFilter = document.getElementById('rating-filter').value;
    const sortBy = document.getElementById('sort-by').value;

    // Map sort values to API parameters
    const sortMapping = {
      'popularity': 'popularity.desc',
      'rating': 'vote_average.desc',
      'year': 'primary_release_date.desc'
    };

    const options = {
      page: currentPage,
      sortBy: sortMapping[sortBy] || 'popularity.desc',
      year: yearFilter,
      minRating: ratingFilter
    };

    // Update current filters for reference
    currentFilters = options;

    const result = await fetchMoviesByGenre(currentGenres, options);

    totalPages = result.totalPages;

    // Update section title based on selected genres
    if (currentGenres.length === 1) {
      // Find the genre name for the selected ID
      const genreButton = document.querySelector(`.genre-button[data-genre-id="${currentGenres[0]}"]`);
      sectionTitle.textContent = genreButton ? `${genreButton.textContent} Movies` : 'Movies';
    } else {
      sectionTitle.textContent = 'Filtered Movies';
    }

    // Update pagination controls
    pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
    prevPageButton.disabled = currentPage <= 1;
    nextPageButton.disabled = currentPage >= totalPages;

    if (result.movies.length === 0) {
      filteredMoviesContainer.innerHTML = '<p class="no-results">No movies found matching your filters.</p>';
      return;
    }

    renderMovieGrid(result.movies, filteredMoviesContainer);
  } catch (error) {
    console.error('Error loading filtered movies:', error);
    filteredMoviesContainer.innerHTML = '<p class="error-message">Failed to load movies. Please try again later.</p>';
  }
}

/**
* Renders movies in a grid layout
* @param {Array} movies - Array of movie objects
* @param {HTMLElement} container - Container element to render into
*/
function renderMovieGrid(movies, container) {
  container.innerHTML = movies.map(movie => `
      <div class="movie-card">
          <a href="movie_pages/index.html?id=${movie.id}">
              <div class="movie-poster">
                  <img src="${movie.posterPath || 'assets/images/placeholder.jpg'}" alt="${movie.title} Poster">
                  <div class="movie-rating">${movie.voteAverage.toFixed(1)}</div>
              </div>
              <div class="movie-info">
                  <h3 class="movie-title">${movie.title}</h3>
                  <p class="movie-year">${movie.releaseYear}</p>
              </div>
          </a>
      </div>
  `).join('');
}

/**
* Renders movies in a horizontal carousel
* @param {Array} movies - Array of movie objects
* @param {HTMLElement} container - Container element to render into
*/
function renderMovieCarousel(movies, container) {
  container.innerHTML = movies.map(movie => `
      <div class="carousel-item">
          <a href="movie_pages/index.html?id=${movie.id}">
              <div class="movie-poster">
                  <img src="${movie.posterPath || 'assets/images/placeholder.jpg'}" alt="${movie.title} Poster">
                  <div class="movie-rating">${movie.voteAverage.toFixed(1)}</div>
              </div>
              <div class="movie-info">
                  <h3 class="movie-title">${movie.title}</h3>
                  <p class="movie-year">${movie.releaseYear}</p>
              </div>
          </a>
      </div>
  `).join('');
}

/**
* Shows an error message on the page
* @param {string} message - Error message to display
*/
function showErrorMessage(message) {
  const mainElement = document.querySelector('main');
  const errorDiv = document.createElement('div');
  errorDiv.className = 'global-error';
  errorDiv.textContent = message;

  mainElement.prepend(errorDiv);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    errorDiv.remove();
  }, 5000);
}
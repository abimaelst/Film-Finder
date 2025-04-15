import { setupSearchFunctionality } from './utils.mjs';

const WATCHLIST_STORAGE_KEY = 'filmfinder-watchlist';

export function initWatchlist() {
  try {
    setupSearchFunctionality();

    loadWatchlist();

    setupFilterButtons();
  } catch (error) {
    console.error('Error initializing watchlist:', error);
    showErrorMessage('Failed to load watchlist. Please try again later.');
  }
}

function setupFilterButtons() {
  const allButton = document.getElementById('show-all');
  const unwatchedButton = document.getElementById('show-unwatched');
  const watchedButton = document.getElementById('show-watched');

  const buttons = [allButton, unwatchedButton, watchedButton];

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      buttons.forEach(btn => btn.classList.remove('active'));

      button.classList.add('active');

      applyWatchlistFilter(button.id);
    });
  });
}

function applyWatchlistFilter(filterId) {
  const watchlist = getWatchlist();
  let filteredList;

  switch (filterId) {
    case 'show-unwatched':
      filteredList = watchlist.filter(movie => !movie.watched);
      break;
    case 'show-watched':
      filteredList = watchlist.filter(movie => movie.watched);
      break;
    default:
      filteredList = watchlist;
  }

  renderWatchlist(filteredList);
}

function loadWatchlist() {
  const watchlist = getWatchlist();
  renderWatchlist(watchlist);
}

function renderWatchlist(watchlist) {
  const watchlistContainer = document.getElementById('watchlist-movies');
  const emptyWatchlistMessage = document.getElementById('empty-watchlist');

  if (watchlist.length === 0) {
    watchlistContainer.innerHTML = '';
    emptyWatchlistMessage.classList.remove('hidden');
    return;
  }

  emptyWatchlistMessage.classList.add('hidden');

  const sortedWatchlist = [...watchlist].sort((a, b) => {
    return new Date(b.addedAt) - new Date(a.addedAt);
  });

  watchlistContainer.innerHTML = sortedWatchlist.map(movie => `
        <div class="watchlist-item ${movie.watched ? 'watched' : ''}">
            <div class="watchlist-poster">
                <a href="../movie_pages/index.html?id=${movie.id}">
                    <img src="${movie.posterPath || '../assets/images/placeholder.jpg'}" alt="${movie.title} Poster">
                    ${movie.watched ? '<div class="watched-badge">Watched</div>' : ''}
                </a>
            </div>
            <div class="watchlist-info">
                <h3 class="watchlist-title">
                    <a href="../movie_pages/index.html?id=${movie.id}">${movie.title}</a>
                </h3>
                <p class="watchlist-year">${movie.releaseYear}</p>
                <p class="watchlist-rating">Rating: ${movie.voteAverage.toFixed(1)}/10</p>
                <p class="watchlist-added">Added: ${formatDate(movie.addedAt)}</p>
                <div class="watchlist-actions">
                    <button class="toggle-watched-btn" data-movie-id="${movie.id}">
                        ${movie.watched ? 'Mark as Unwatched' : 'Mark as Watched'}
                    </button>
                    <button class="remove-watchlist-btn" data-movie-id="${movie.id}">
                        Remove from Watchlist
                    </button>
                </div>
            </div>
        </div>
    `).join('');

  addWatchlistButtonListeners();
}

function addWatchlistButtonListeners() {
  const toggleWatchedButtons = document.querySelectorAll('.toggle-watched-btn');
  toggleWatchedButtons.forEach(button => {
    button.addEventListener('click', () => {
      const movieId = button.getAttribute('data-movie-id');
      const isCurrentlyWatched = button.textContent.trim() === 'Mark as Unwatched';

      markAsWatched(movieId, !isCurrentlyWatched);
      loadWatchlist();
    });
  });

  const removeButtons = document.querySelectorAll('.remove-watchlist-btn');
  removeButtons.forEach(button => {
    button.addEventListener('click', () => {
      const movieId = button.getAttribute('data-movie-id');

      if (confirm('Are you sure you want to remove this movie from your watchlist?')) {
        removeFromWatchlist(movieId);
        loadWatchlist();
      }
    });
  });
}

export function getWatchlist() {
  try {
    const watchlistJson = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    return watchlistJson ? JSON.parse(watchlistJson) : [];
  } catch (error) {
    console.error('Error getting watchlist from local storage:', error);
    return [];
  }
}

function saveWatchlist(watchlist) {
  try {
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(watchlist));
  } catch (error) {
    console.error('Error saving watchlist to local storage:', error);
  }
}

export function addToWatchlist(movie) {
  try {
    const watchlist = getWatchlist();

    // Check if movie is already in watchlist
    if (isInWatchlist(movie.id)) {
      return false;
    }

    watchlist.push({
      id: movie.id,
      title: movie.title,
      posterPath: movie.posterPath,
      releaseYear: movie.releaseYear,
      voteAverage: movie.voteAverage,
      addedAt: new Date().toISOString(),
      watched: false
    });

    saveWatchlist(watchlist);
    return true;
  } catch (error) {
    console.error('Error adding movie to watchlist:', error);
    return false;
  }
}

export function removeFromWatchlist(movieId) {
  try {
    let watchlist = getWatchlist();

    // Filter out the movie with the given ID
    watchlist = watchlist.filter(movie => movie.id.toString() !== movieId.toString());

    saveWatchlist(watchlist);
    return true;
  } catch (error) {
    console.error('Error removing movie from watchlist:', error);
    return false;
  }
}

export function isInWatchlist(movieId) {
  try {
    const watchlist = getWatchlist();
    return watchlist.some(movie => movie.id.toString() === movieId.toString());
  } catch (error) {
    console.error('Error checking if movie is in watchlist:', error);
    return false;
  }
}

export function markAsWatched(movieId, watched) {
  try {
    const watchlist = getWatchlist();

    const movieIndex = watchlist.findIndex(movie => movie.id.toString() === movieId.toString());

    if (movieIndex === -1) {
      return false;
    }

    watchlist[movieIndex].watched = watched;

    saveWatchlist(watchlist);
    return true;
  } catch (error) {
    console.error('Error marking movie as watched:', error);
    return false;
  }
}

/**
 * Checks if a movie is marked as watched
 * @param {string} movieId - ID of the movie to check
 * @returns {boolean} - Whether the movie is marked as watched
 */
export function isWatched(movieId) {
  try {
    const watchlist = getWatchlist();
    const movie = watchlist.find(movie => movie.id.toString() === movieId.toString());
    return movie ? movie.watched : false;
  } catch (error) {
    console.error('Error checking if movie is watched:', error);
    return false;
  }
}

function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Unknown date';
  }
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

  setTimeout(() => {
    errorDiv.remove();
  }, 5000);
}
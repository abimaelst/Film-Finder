import { searchMovies } from './MovieData.mjs';

const RECENTLY_VIEWED_STORAGE_KEY = 'filmfinder-recently-viewed';
const MAX_RECENTLY_VIEWED = 10;

export function getRecentlyViewed() {
  try {
    const recentlyViewedJson = localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY);
    return recentlyViewedJson ? JSON.parse(recentlyViewedJson) : [];
  } catch (error) {
    console.error('Error getting recently viewed from local storage:', error);
    return [];
  }
}

export function addToRecentlyViewed(movie) {
  try {
    if (!movie || !movie.id) return;

    let recentlyViewed = getRecentlyViewed();

    recentlyViewed = recentlyViewed.filter(item => item.id.toString() !== movie.id.toString());

    recentlyViewed.unshift({
      id: movie.id,
      title: movie.title,
      posterPath: movie.posterPath,
      releaseYear: movie.releaseYear,
      voteAverage: movie.voteAverage
    });

    if (recentlyViewed.length > MAX_RECENTLY_VIEWED) {
      recentlyViewed = recentlyViewed.slice(0, MAX_RECENTLY_VIEWED);
    }

    localStorage.setItem(RECENTLY_VIEWED_STORAGE_KEY, JSON.stringify(recentlyViewed));
  } catch (error) {
    console.error('Error adding to recently viewed:', error);
  }
}

export function setupSearchFunctionality() {
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const searchSuggestions = document.getElementById('search-suggestions');

  let searchTimeout = null;

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim();

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (query.length < 2) {
      searchSuggestions.innerHTML = '';
      searchSuggestions.classList.add('hidden');
      return;
    }

    searchTimeout = setTimeout(async () => {
      try {
        const results = await searchMovies(query);

        if (results.length === 0) {
          searchSuggestions.innerHTML = '<p class="no-results">No movies found</p>';
        } else {
          const limitedResults = results.slice(0, 5);

          searchSuggestions.innerHTML = limitedResults.map(movie => `
                        <div class="search-suggestion" data-movie-id="${movie.id}">
                            <div class="suggestion-poster">
                                <img src="${movie.posterPath || 'assets/images/placeholder.jpg'}" alt="${movie.title}">
                            </div>
                            <div class="suggestion-info">
                                <h4>${movie.title}</h4>
                                <p>${movie.releaseYear}</p>
                            </div>
                        </div>
                    `).join('');

          const suggestionElements = document.querySelectorAll('.search-suggestion');
          suggestionElements.forEach(element => {
            element.addEventListener('click', () => {
              const movieId = element.getAttribute('data-movie-id');
              navigateToMovieDetails(movieId);
            });
          });
        }

        searchSuggestions.classList.remove('hidden');
      } catch (error) {
        console.error('Error searching movies:', error);
        searchSuggestions.innerHTML = '<p class="error-message">Error searching. Please try again.</p>';
        searchSuggestions.classList.remove('hidden');
      }
    }, 300);
  });

  document.addEventListener('click', event => {
    if (!searchForm.contains(event.target)) {
      searchSuggestions.classList.add('hidden');
    }
  });

  searchForm.addEventListener('submit', event => {
    event.preventDefault();
    const query = searchInput.value.trim();

    if (query.length >= 2) {
      navigateToSearchResults(query);
    }
  });
}

function navigateToMovieDetails(movieId) {
  const basePath = location.pathname.includes('/movie_pages/') || location.pathname.includes('/watchlist/')
    ? '../movie_pages/'
    : 'movie_pages/';

  window.location.href = `${basePath}index.html?id=${movieId}`;
}

function navigateToSearchResults(query) {
  const searchSuggestions = document.getElementById('search-suggestions');
  searchSuggestions.classList.add('hidden');

  searchMovies(query)
    .then(results => {
      if (results.length > 0) {
        navigateToMovieDetails(results[0].id);
      } else {
        alert('No movies found matching your search. Please try a different query.');
      }
    })
    .catch(error => {
      console.error('Error searching movies:', error);
      alert('Error searching for movies. Please try again later.');
    });
}

export function getUrlParams() {
  const params = {};
  const queryString = window.location.search.substring(1);
  const pairs = queryString.split('&');

  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key && value) {
      params[decodeURIComponent(key)] = decodeURIComponent(value);
    }
  }

  return params;
}

export function formatNumber(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function createElement(tag, attributes = {}, children = []) {
  const element = document.createElement(tag);

  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'textContent') {
      element.textContent = value;
    } else {
      element.setAttribute(key, value);
    }
  }

  if (Array.isArray(children)) {
    for (const child of children) {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else if (child instanceof Node) {
        element.appendChild(child);
      }
    }
  } else if (typeof children === 'string') {
    element.textContent = children;
  }

  return element;
}
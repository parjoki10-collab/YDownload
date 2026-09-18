const API_KEY = "c107fdc3c6ce730867033ed4d867a1fc";

const API = "https://api.themoviedb.org/3";

const POSTER = "https://image.tmdb.org/t/p/w500";

const BACKDROP = "https://image.tmdb.org/t/p/original";

const homePage = document.getElementById("homePage");

const searchPage = document.getElementById("searchPage");

const detailPage = document.getElementById("detailPage");

const loading = document.getElementById("loading");

function showLoading() {

  loading.classList.remove("hidden");

}

function hideLoading() {

  loading.classList.add("hidden");

}

async function api(url) {

  const response = await fetch(url);

  if (!response.ok) {

    throw new Error("TMDB API Error");

  }

  return response.json();

}

/* =========================

   HOME

========================= */

async function loadHome() {

  try {

    showLoading();

    const trending = await api(

      `${API}/trending/movie/week?api_key=${API_KEY}&language=en-US`

    );

    const popularMovies = await api(

      `${API}/movie/popular?api_key=${API_KEY}&language=en-US&page=1`

    );

    const popularTV = await api(

      `${API}/tv/popular?api_key=${API_KEY}&language=en-US&page=1`

    );

    renderMovies(

      trending.results,

      "trendingMovies",

      "movie"

    );

    renderMovies(

      popularMovies.results,

      "popularMovies",

      "movie"

    );

    renderMovies(

      popularTV.results,

      "popularTV",

      "tv"

    );

  } catch (error) {

    console.error(error);

  } finally {

    hideLoading();

  }

}

/* =========================

   MOVIE CARD

========================= */

function renderMovies(items, elementId, type) {

  const container = document.getElementById(elementId);

  container.innerHTML = "";

  items.forEach(item => {

    if (!item.poster_path) return;

    const title = item.title || item.name;

    const date = item.release_date || item.first_air_date || "";

    const year = date

      ? date.substring(0, 4)

      : "N/A";

    const card = document.createElement("div");

    card.className = "card";

    card.innerHTML = `

      <div class="poster-wrapper">

        <img

          class="poster"

          src="${POSTER}${item.poster_path}"

          alt="${title}"

          loading="lazy"

        >

        <div class="rating">

          ⭐ ${item.vote_average?.toFixed(1) || "N/A"}

        </div>

      </div>

      <div class="card-title">

        ${title}

      </div>

      <div class="card-info">

        ${year} • ${type === "tv" ? "TV Series" : "Movie"}

      </div>

    `;

    card.onclick = () => {

      openDetail(item.id, type);

    };

    container.appendChild(card);

  });

}

/* =========================

   DETAIL

========================= */

async function openDetail(id, type) {

  try {

    showLoading();

    homePage.classList.add("hidden");

    searchPage.classList.add("hidden");

    detailPage.classList.remove("hidden");

    const data = await api(

      `${API}/${type}/${id}?api_key=${API_KEY}&language=en-US&append_to_response=credits,reviews`

    );

    renderDetail(data, type);

    window.scrollTo({

      top: 0,

      behavior: "smooth"

    });

  } catch (error) {

    console.error(error);

  } finally {

    hideLoading();

  }

}

/* =========================

   DETAIL UI

========================= */

function renderDetail(data, type) {

  const title = data.title || data.name;

  const date = data.release_date ||

               data.first_air_date ||

               "";

  const year = date

    ? date.substring(0, 4)

    : "N/A";

  const genres = data.genres

    ?.map(g => g.name)

    .join(", ") || "N/A";

  const cast = data.credits?.cast?.slice(0, 8) || [];

  const reviews = data.reviews?.results?.slice(0, 3) || [];

  let html = `

    <div class="detail">

      ${

        data.backdrop_path

        ? `<img

            class="backdrop"

            src="${BACKDROP}${data.backdrop_path}"

            alt="${title}"

          >`

        : ""

      }

      <div class="detail-overlay"></div>

      <div class="detail-body">

        ${

          data.poster_path

          ? `<img

              class="detail-poster"

              src="${POSTER}${data.poster_path}"

              alt="${title}"

            >`

          : ""

        }

        <div class="detail-info">

          <h1 class="detail-title">

            ${title}

          </h1>

          <div class="meta">

            ${year}

            • ⭐ ${data.vote_average?.toFixed(1) || "N/A"}

            • ${genres}

          </div>

          <p class="overview">

            ${data.overview || "No overview available."}

          </p>

  `;

  /* CAST */

  if (cast.length) {

    html += `

      <div class="cast">

        <h3>Cast</h3>

        <div class="cast-list">

    `;

    cast.forEach(person => {

      if (!person.profile_path) return;

      html += `

        <div class="cast-card">

          <img

            src="${POSTER}${person.profile_path}"

            alt="${person.name}"

            loading="lazy"

          >

          <div class="cast-name">

            ${person.name}

          </div>

        </div>

      `;

    });

    html += `

        </div>

      </div>

    `;

  }

  /* TV SEASON */

  if (type === "tv" && data.seasons) {

    html += `

      <div class="seasons">

        <h3>Seasons</h3>

        <select

          class="season-select"

          id="seasonSelect"

          data-tv-id="${data.id}"

        >

    `;

    data.seasons.forEach(season => {

      if (season.season_number === 0) return;

      html += `

        <option value="${season.season_number}">

          Season ${season.season_number}

        </option>

      `;

    });

    html += `

        </select>

        <div id="episodes" class="episodes"></div>

      </div>

    `;

  }

  /* REVIEWS */

  if (reviews.length) {

    html += `

      <div class="reviews">

        <h3>Reviews</h3>

    `;

    reviews.forEach(review => {

      const content =

        review.content?.length > 500

        ? review.content.substring(0, 500) + "..."

        : review.content;

      html += `

        <div class="review">

          <strong>

            ${review.author}

          </strong>

          <p>

            ${content}

          </p>

        </div>

      `;

    });

    html += `

      </div>

    `;

  }

  html += `

        </div>

      </div>

    </div>

  `;

  document.getElementById("detailContent").innerHTML = html;

  /* LOAD FIRST SEASON */

  if (type === "tv" && data.seasons?.length) {

    const select = document.getElementById("seasonSelect");

    select.addEventListener("change", () => {

      loadEpisodes(

        data.id,

        select.value

      );

    });

    loadEpisodes(

      data.id,

      select.value

    );

  }

}

/* =========================

   TV EPISODES

========================= */

async function loadEpisodes(tvId, season) {

  try {

    const data = await api(

      `${API}/tv/${tvId}/season/${season}?api_key=${API_KEY}&language=en-US`

    );

    const container =

      document.getElementById("episodes");

    container.innerHTML = "";

    data.episodes.forEach(ep => {

      const div = document.createElement("div");

      div.className = "episode";

      div.innerHTML = `

        <strong>

          E${ep.episode_number}

        </strong>

        <br>

        ${ep.name}

        <br>

        <small>

          ⭐ ${ep.vote_average?.toFixed(1) || "N/A"}

        </small>

      `;

      container.appendChild(div);

    });

  } catch (error) {

    console.error(error);

  }

}

/* =========================

   SEARCH

========================= */

async function searchMovies() {

  const query =

    document.getElementById("searchInput").value.trim();

  if (!query) return;

  try {

    showLoading();

    homePage.classList.add("hidden");

    detailPage.classList.add("hidden");

    searchPage.classList.remove("hidden");

    document.getElementById("searchTitle").textContent =

      `Search: ${query}`;

    const data = await api(

      `${API}/search/multi?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=1`

    );

    const results =

      data.results.filter(

        item =>

          item.media_type === "movie" ||

          item.media_type === "tv"

      );

    const container =

      document.getElementById("searchResults");

    container.innerHTML = "";

    results.forEach(item => {

      if (!item.poster_path) return;

      const type =

        item.media_type === "tv"

        ? "tv"

        : "movie";

      renderSingleSearchCard(

        item,

        type,

        container

      );

    });

  } catch (error) {

    console.error(error);

  } finally {

    hideLoading();

  }

}

function renderSingleSearchCard(item, type, container) {

  const title =

    item.title || item.name;

  const date =

    item.release_date ||

    item.first_air_date ||

    "";

  const year =

    date ? date.substring(0, 4) : "N/A";

  const card =

    document.createElement("div");

  card.className = "card";

  card.innerHTML = `

    <div class="poster-wrapper">

      <img

        class="poster"

        src="${POSTER}${item.poster_path}"

        alt="${title}"

        loading="lazy"

      >

      <div class="rating">

        ⭐ ${item.vote_average?.toFixed(1) || "N/A"}

      </div>

    </div>

    <div class="card-title">

      ${title}

    </div>

    <div class="card-info">

      ${year} • ${type === "tv" ? "TV Series" : "Movie"}

    </div>

  `;

  card.onclick = () =>

    openDetail(item.id, type);

  container.appendChild(card);

}

/* =========================

   SEARCH EVENTS

========================= */

document

  .getElementById("searchBtn")

  .addEventListener(

    "click",

    searchMovies

  );

document

  .getElementById("searchInput")

  .addEventListener(

    "keydown",

    event => {

      if (event.key === "Enter") {

        searchMovies();

      }

    }

  );

/* =========================

   START

========================= */

loadHome();

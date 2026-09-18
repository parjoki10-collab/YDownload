const API_KEY = "c107fdc3c6ce730867033ed4d867a1fc";

const API = "https://api.themoviedb.org/3";

const POSTER = "https://image.tmdb.org/t/p/w500";

const BACKDROP = "https://image.tmdb.org/t/p/original";

const DOWNLOAD_BASE = "http://a.111477.xyz";

/*
  AUTHORIZED MEDIA URLS
  Add only direct media URLs that you own or are authorized to stream.

  Examples:
  "movie:12345": "https://your-server.example/video.mp4",
  "tv:1399:s1:e1": "https://your-server.example/s01e01.mp4"

  If an entry is missing, the Watch button will show a message instead
  of attempting to guess a file URL from a directory listing.
*/
const MEDIA_URLS = {
  // "movie:12345": "https://your-server.example/video.mp4",
  // "tv:1399:s1:e1": "https://your-server.example/s01e01.mp4"
};

function getMediaUrl(type, data, seasonNumber = null, episodeNumber = null) {
  if (type === "movie") {
    return MEDIA_URLS[`movie:${data.id}`] || "";
  }
  if (seasonNumber !== null && episodeNumber !== null) {
    return MEDIA_URLS[`tv:${data.id}:s${seasonNumber}:e${episodeNumber}`] || "";
  }
  return "";
}

function makeWatchUrl(title, mediaUrl) {
  if (!mediaUrl) return "";
  return `watch.html?title=${encodeURIComponent(title)}&file=${encodeURIComponent(mediaUrl)}`;
}

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

   DOWNLOAD URL

========================= */

function makeMovieDownloadUrl(data) {

  const title = data.title || "";

  const year = data.release_date

    ? data.release_date.substring(0, 4)

    : "";

  /*

    TMDB:

    Batman: Bad Blood

    Folder:

    Batman - Bad Blood (2016)

  */

  const folderTitle = title

    .replace(/:/g, " -")

    .replace(/\s+-\s+/g, " - ")

    .trim();

  const folderName = `${folderTitle} (${year})`;

  return `${DOWNLOAD_BASE}/movies/${encodeURIComponent(folderName)}/`;

}

function makeTVDownloadUrl(data, seasonNumber) {

  const title = data.name || "";

  return `${DOWNLOAD_BASE}/tvs/${encodeURIComponent(title)}/Season%20${seasonNumber}/`;

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

    const date =

      item.release_date ||

      item.first_air_date ||

      "";

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

  const date =

    data.release_date ||

    data.first_air_date ||

    "";

  const year = date

    ? date.substring(0, 4)

    : "N/A";

  const genres = data.genres

    ?.map(g => g.name)

    .join(", ") || "N/A";

  const cast =

    data.credits?.cast?.slice(0, 8) || [];

  const reviews =

    data.reviews?.results?.slice(0, 3) || [];

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

          <!-- WATCH -->

          <div class="download-box">

            <a

              id="watchButton"

              href="${makeWatchUrl(title, getMediaUrl(type, data)) || "#"}"

              class="download-btn"

              ${!getMediaUrl(type, data) ? 'aria-disabled="true"' : ""}

            >

              ▶️ Watch

            </a>

          </div>

  `;

  /* =========================

     CAST

  ========================= */

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

  /* =========================

     TV SEASONS

  ========================= */

  if (type === "tv" && data.seasons) {

    const validSeasons =

      data.seasons.filter(

        season => season.season_number > 0

      );

    html += `

      <div class="seasons">

        <h3>Seasons</h3>

        <select

          class="season-select"

          id="seasonSelect"

          data-tv-id="${data.id}"

        >

    `;

    validSeasons.forEach(season => {

      html += `

        <option value="${season.season_number}">

          Season ${season.season_number}

        </option>

      `;

    });

    html += `

        </select>

        <div

          id="episodes"

          class="episodes"

        ></div>

      </div>

    `;

  }

  /* =========================

     REVIEWS

  ========================= */

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

  /* =========================

     TV SEASON EVENTS

  ========================= */

  if (type === "tv" && data.seasons) {

    const select =

      document.getElementById("seasonSelect");

    const watchButton =

      document.getElementById("watchButton");

    if (select) {

      select.addEventListener(

        "change",

        () => {

          const seasonNumber =

            select.value;

          /*

            Keep Watch button generic. Episode-level media URLs
            can be configured in MEDIA_URLS.
          */

          if (watchButton) {
            const mediaUrl = getMediaUrl(
              "tv",
              data,
              Number(seasonNumber),
              1
            );

            watchButton.href = makeWatchUrl(
              data.name || "",
              mediaUrl
            ) || "#";

            watchButton.setAttribute(
              "aria-disabled",
              mediaUrl ? "false" : "true"
            );
          }

          /*

            Load episodes

          */

          loadEpisodes(

            data.id,

            seasonNumber

          );

        }

      );

      /*

        Load default season

      */

      loadEpisodes(

        data.id,

        select.value

      );

    }

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

    if (!container) return;

    container.innerHTML = "";

    data.episodes.forEach(ep => {

      const div =

        document.createElement("div");

      div.className = "episode";

      const mediaUrl = getMediaUrl(
        "tv",
        { id: tvId },
        Number(season),
        Number(ep.episode_number)
      );

      div.innerHTML = `

        <strong>

          E${ep.episode_number}

        </strong>

        <br>

        ${ep.name}

        <br>

        <small>

          ⭐ ${

            ep.vote_average?.toFixed(1) || "N/A"

          }

        </small>

        <br><br>

        ${
          mediaUrl
            ? `<a class="episode-watch"
                 href="${makeWatchUrl(ep.name, mediaUrl)}">
                 ▶ Watch
               </a>`
            : ""
        }

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

    document

      .getElementById("searchInput")

      .value

      .trim();

  if (!query) return;

  try {

    showLoading();

    homePage.classList.add("hidden");

    detailPage.classList.add("hidden");

    searchPage.classList.remove("hidden");

    document.getElementById(

      "searchTitle"

    ).textContent =

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

/* =========================

   SEARCH CARD

========================= */

function renderSingleSearchCard(

  item,

  type,

  container

) {

  const title =

    item.title || item.name;

  const date =

    item.release_date ||

    item.first_air_date ||

    "";

  const year =

    date

    ? date.substring(0, 4)

    : "N/A";

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

        ⭐ ${

          item.vote_average?.toFixed(1) || "N/A"

        }

      </div>

    </div>

    <div class="card-title">

      ${title}

    </div>

    <div class="card-info">

      ${year} • ${

        type === "tv"

        ? "TV Series"

        : "Movie"

      }

    </div>

  `;

  card.onclick = () =>

    openDetail(

      item.id,

      type

    );

  container.appendChild(card);

}

/* =========================

   SEARCH BUTTON

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
document

  .getElementById("closeSearch")

  .addEventListener("click", () => {

    searchPage.classList.add("hidden");

    detailPage.classList.add("hidden");

    homePage.classList.remove("hidden");

    document.getElementById("searchInput").value = "";

    window.scrollTo({

      top: 0,

      behavior: "smooth"

    });

  });
/* =========================

   START

========================= */

loadHome();

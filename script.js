const API_KEY = "c107fdc3c6ce730867033ed4d867a1fc";

const API = "https://api.themoviedb.org/3";

const POSTER = "https://image.tmdb.org/t/p/w500";

const BACKDROP = "https://image.tmdb.org/t/p/original";

const DOWNLOAD_BASE = "http://a.111477.xyz";

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

    const [trending, popularMovies, popularTV, popularWeek] = await Promise.all([
      api(`${API}/trending/movie/week?api_key=${API_KEY}&language=en-US`),
      api(`${API}/movie/popular?api_key=${API_KEY}&language=en-US&page=1`),
      api(`${API}/tv/popular?api_key=${API_KEY}&language=en-US&page=1`),
      api(`${API}/trending/all/week?api_key=${API_KEY}&language=en-US`)
    ]);

    renderMovies(trending.results || [], "trendingMovies", "movie");
    renderMovies(popularMovies.results || [], "popularMovies", "movie");
    renderMovies(popularTV.results || [], "popularTV", "tv");

    const mixed = (popularWeek.results || [])
      .filter(item => item.media_type === "movie" || item.media_type === "tv")
      .slice(0, 12);

    renderMovies(mixed, "popularWeek", "mixed");
    setupFeatured((trending.results || [])[0], "movie");
  } catch (error) {
    console.error(error);
    showHomeError();
  } finally {
    hideLoading();
  }
}

/* =========================

   MOVIE CARD

========================= */

function renderMovies(items, elementId, type) {
  const container = document.getElementById(elementId);
  if (!container) return;

  container.innerHTML = "";

  if (!items || !items.length) {
    container.innerHTML = `<div class="empty-state">No content available right now.</div>`;
    return;
  }

  items.forEach(item => {
    if (!item.poster_path) return;

    const title = item.title || item.name || "Untitled";
    const date = item.release_date || item.first_air_date || "";
    const year = date ? date.substring(0, 4) : "N/A";
    const itemType =
      type === "mixed"
        ? (item.media_type === "tv" ? "tv" : "movie")
        : type;

    const card = document.createElement("div");
    card.className = "card";

    const safeTitle = escapeHtml(title);

    card.innerHTML = `
      <div class="poster-wrapper">
        <img
          class="poster"
          src="${POSTER}${item.poster_path}"
          alt="${safeTitle}"
          loading="lazy"
        >
        <div class="rating">
          ⭐ ${item.vote_average?.toFixed(1) || "N/A"}
        </div>
      </div>
      <div class="card-title">${safeTitle}</div>
      <div class="card-info">
        ${year} • ${itemType === "tv" ? "TV Series" : "Movie"}
      </div>
    `;

    card.onclick = () => openDetail(item.id, itemType);
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

          <!-- DOWNLOAD -->

          <div class="download-box">

            <a

              id="downloadButton"

              href="${

                type === "movie"

                ? makeMovieDownloadUrl(data)

                : makeTVDownloadUrl(

                    data,

                    data.seasons?.find(

                      s => s.season_number > 0

                    )?.season_number || 1

                  )

              }"

              target="_blank"

              rel="noopener"

              class="download-btn"

            >

              ⬇️ Download

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

    const downloadButton =

      document.getElementById("downloadButton");

    if (select) {

      select.addEventListener(

        "change",

        () => {

          const seasonNumber =

            select.value;

          /*

            Update Download URL

          */

          downloadButton.href =

            makeTVDownloadUrl(

              data,

              seasonNumber

            );

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

    if (!results.length) {
      container.innerHTML = `
        <div class="empty-state">
          No results found for "<strong>${escapeHtml(query)}</strong>".
        </div>
      `;
    } else {
      results.forEach(item => {
        if (!item.poster_path) return;

        const type =
          item.media_type === "tv"
            ? "tv"
            : "movie";

        renderSingleSearchCard(item, type, container);
      });
    }

    setActiveNav("search");

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
    setActiveNav("home");

    window.scrollTo({

      top: 0,

      behavior: "smooth"

    });

  });
/* =========================
   LAUNCH UI
========================= */

const GENRE_IDS = {
  action: 28,
  comedy: 35,
  horror: 27,
  scifi: 878,
  animation: 16,
  drama: 18
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showHomeError() {
  ["trendingMovies", "popularMovies", "popularTV", "popularWeek"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.innerHTML = `
        <div class="empty-state error-state">
          Unable to load content. Please try again.
        </div>
      `;
    }
  });
}

function setupFeatured(item, type = "movie") {
  const card = document.getElementById("featuredCard");
  const backdrop = document.getElementById("featuredBackdrop");
  const title = document.getElementById("featuredTitle");
  const meta = document.getElementById("featuredMeta");
  const button = document.getElementById("featuredBtn");

  if (!card || !backdrop || !title || !meta || !button || !item) return;

  const name = item.title || item.name || "Featured";
  const date = item.release_date || item.first_air_date || "";
  const year = date ? date.substring(0, 4) : "N/A";
  const score = item.vote_average?.toFixed(1) || "N/A";
  const media = type === "tv" ? "TV Series" : "Movie";

  title.textContent = name;
  meta.textContent = `${year} • ⭐ ${score} • ${media}`;

  if (item.backdrop_path) {
    backdrop.style.backgroundImage = `url("${BACKDROP}${item.backdrop_path}")`;
  }

  const open = () => openDetail(item.id, type);
  card.onclick = open;
  button.onclick = event => {
    event.stopPropagation();
    open();
  };
}

async function loadGenre(genreKey) {
  if (genreKey === "all") {
    resetGenreSections();
    await loadHome();
    return;
  }

  const genreId = GENRE_IDS[genreKey];
  if (!genreId) return;

  try {
    showLoading();

    const data = await api(
      `${API}/discover/movie?api_key=${API_KEY}&language=en-US&sort_by=popularity.desc&with_genres=${genreId}&page=1`
    );

    renderMovies(data.results || [], "trendingMovies", "movie");

    const title = document.querySelector("#trendingMovies")
      ?.closest(".section")
      ?.querySelector("h2");

    if (title) {
      title.textContent =
        `${genreKey.charAt(0).toUpperCase() + genreKey.slice(1)} Movies`;
    }

    ["popularMovies", "popularTV", "popularWeek"].forEach(id => {
      document.getElementById(id)?.closest(".section")?.classList.add("genre-hidden");
    });
  } catch (error) {
    console.error(error);
    const target = document.getElementById("trendingMovies");
    if (target) {
      target.innerHTML = `<div class="empty-state error-state">Unable to load this genre.</div>`;
    }
  } finally {
    hideLoading();
  }
}

function resetGenreSections() {
  document.querySelectorAll(".genre-hidden").forEach(section => {
    section.classList.remove("genre-hidden");
  });

  const title = document.querySelector("#trendingMovies")
    ?.closest(".section")
    ?.querySelector("h2");

  if (title) title.textContent = "Trending Movies";
}

function setActiveNav(name) {
  document.querySelectorAll("[data-nav]").forEach(button => {
    button.classList.toggle("active", button.dataset.nav === name);
  });
}

function setupLaunchUI() {
  document.querySelectorAll(".genre-chip").forEach(button => {
    button.addEventListener("click", async () => {
      document.querySelectorAll(".genre-chip").forEach(b => b.classList.remove("active"));
      button.classList.add("active");
      await loadGenre(button.dataset.genre);
    });
  });

  document.querySelectorAll("[data-see-all]").forEach(button => {
    button.addEventListener("click", event => {
      event.preventDefault();
      const target = document.getElementById(button.dataset.seeAll);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  document.querySelectorAll("[data-nav]").forEach(button => {
    button.addEventListener("click", () => {
      const nav = button.dataset.nav;
      setActiveNav(nav);

      if (nav === "home") {
        homePage.classList.remove("hidden");
        searchPage.classList.add("hidden");
        detailPage.classList.add("hidden");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      if (nav === "movies") {
        homePage.classList.remove("hidden");
        searchPage.classList.add("hidden");
        detailPage.classList.add("hidden");
        document.getElementById("trendingMovies")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      if (nav === "tv") {
        homePage.classList.remove("hidden");
        searchPage.classList.add("hidden");
        detailPage.classList.add("hidden");
        document.getElementById("popularTV")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      if (nav === "search") {
        homePage.classList.add("hidden");
        detailPage.classList.add("hidden");
        searchPage.classList.remove("hidden");
        document.getElementById("searchInput")?.focus();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", setupLaunchUI);

/* =========================

   START

========================= */

loadHome();

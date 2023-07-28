let currentPage = 1;
const baseURL = "https://api.artic.edu/api/v1/artworks/search?params=";
const frames = document.querySelectorAll(".frame:not(.center)");
const didactics = document.querySelectorAll(".didactic");
const input = document.getElementById("input");
const dialog = document.getElementById("bigImage");
const next = document.getElementById("more");
const prev = document.getElementById("back");
const closeBtn = document.getElementById("closeModal");
const courtesy = {headers: {"AIC-User-Agent": "art-search (hutchison.music@gmail.com)"}}

async function getOne(url) {
  await fetch(url, courtesy)
    .then((response) => response.json())
    .then(async (data) => {
      console.log(data.data.id);
      let exhibitList = data.data.exhibition_history 
        ? data.data.exhibition_history
          .split("\n\n")
          .map((each) => `<li>${each}</li>`)
        : ""
      let src =
        data.config.iiif_url +
        "/" +
        data.data.image_id +
        "/full/843,/0/default.jpg";
      dialog.innerHTML = `
      <button id="closeModal">Close</button>
      <article>
      <h2>${data.data.title}</h2>
      <img src="${src}" alt="${data.data.thumbnail.alt_text}"/>
      <h2 id="artist">${data.data.artist_display.split("\n")[0]}</h2>
      <p><em>${data.data.artist_display.split("\n").length > 1 && data.data.artist_display.split("\n")[1]}</em></p>
      <h3>${data.data.title}</h3>
      <p>${data.data.medium_display}</p>
      <p>${data.data.date_display}</p>
      <p>${data.data.place_of_origin}</p>
      <h2>Exhibition History:</h2>
      <ul>
      ${exhibitList && exhibitList.join("")}
      </ul>
      </article>
      <h2>Articles:</h2>`;
      await getArticles(data.data);
      dialog.showModal();
      document.getElementById("closeModal").addEventListener("click", ()=>{
        dialog.close();
    })
      document.getElementById("artist").addEventListener("click", (e) => {
        input.value = e.target.textContent;
        const qArr = e.target.textContent.split(" ");
        const query = {
          limit: 24,
          page: 1,
          fields: ["title", "image_id", "artist_display", "api_link", "id"],
          term: {
            is_public_domain: true,
          },
          q: input.value,
        };
        getImages(baseURL + encodeURIComponent(JSON.stringify(query)));
        dialog.close();
      });
    });
}

async function getImages(url) {
  await fetch(url, courtesy)
    .then((response) => response.json())
    .then((data) => {
      data.pagination.current_page > 1
        ? (prev.style.display = "inline-block")
        : (prev.style.display = "none");
      data.pagination.current_page < data.pagination.total_pages
        ? (next.style.display = "inline-block")
        : (next.style.display = "none");
      document.getElementById(
        "results"
      ).innerHTML = `<p>${data.pagination.total} images...</p><p>Page ${data.pagination.current_page} of ${data.pagination.total_pages}</p>`;
      for (let i = 0; i < data.data.length; i++) {
        let imgURL =
          data.config.iiif_url +
          "/" +
          data.data[i]["image_id"] +
          "/full/400,/0/default.jpg";
        frames[
          i
        ].style.background = `center / cover url("${imgURL}") no-repeat`;
        didactics[i].innerHTML = `
        <p>${data.data[i].title.split(",")[0]}</p>
        <p><em>${data.data[i]["artist_display"].split("\n")[0]}</em></p>`;
        didactics[i].setAttribute("data-fullsize", data.data[i]["api_link"]);
      }
    });
}

async function getArticles(data) {
  const query = {
    limit: 3,
    page: 1,
    fields: ["title", "copy", "updated_at", "id"],
    query: {
      query_string: {
        query: `(${data.title}) AND (${data.artist_display.split("\n")[0]})`,
      },
    },
  };
  let base = "https://api.artic.edu/api/v1/articles/search?params=";
  await fetch(base + encodeURIComponent(JSON.stringify(query)), courtesy)
    .then((response) => response.json())
    .then((data) => {
      for (let each of data.data) {
        let link =
          "https://www.artic.edu/articles/" +
          each.id +
          "/" +
          each.title.replace(/\W/, "-").toLowerCase();
        dialog.innerHTML += `
        <h3 class="articleTitle"><a href="${link}" target="_blank">${each.title}</a></h3>
        <div class="articleCopy">
          <p>${each.copy.substring(0, 250) + "..."}</p>
        </div>`;
      }
    });
}

getImages(
  baseURL +
    encodeURIComponent(
      JSON.stringify({
        limit: 24,
        page: currentPage,
        fields: ["title", "image_id", "artist_display", "api_link"],
        term: {
          is_public_domain: true,
        },
      })
    )
);

input.addEventListener("input", (e) => {
  currentPage = 1;
  const query = {
    limit: 24,
    page: currentPage,
    fields: ["title", "image_id", "artist_display", "api_link"],
    term: {
      is_public_domain: true,
    },
    q: input.value,
  };
  getImages(baseURL + encodeURIComponent(JSON.stringify(query)));
});
for (const d of didactics) {
  d.addEventListener("click", (e) => {
    let target;
    switch (true) {
      case e.target.tagName == "EM":
        target = e.target.parentNode.parentNode;
        break;
      case e.target.tagName == "P":
        target = e.target.parentNode;
        break;
      default:
        target = e.target;
    }
    getOne(target.getAttribute("data-fullsize"));
  });
}
next.addEventListener("click", (e) => {
  currentPage++;
  const query = {
    limit: 24,
    page: currentPage,
    fields: ["title", "image_id", "artist_display", "api_link", "id"],
    term: {
      is_public_domain: true,
    },
    q: input.value,
  };
  getImages(baseURL + encodeURIComponent(JSON.stringify(query)));
});
prev.addEventListener("click", (e) => {
  currentPage--;
  const query = {
    limit: 24,
    page: currentPage,
    fields: ["title", "image_id", "artist_display", "api_link", "id"],
    term: {
      is_public_domain: true,
    },
    q: input.value,
  };
  getImages(baseURL + encodeURIComponent(JSON.stringify(query)));
});


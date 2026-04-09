const searchInput = document.getElementById("searchInput");
const categorySelect = document.getElementById("categorySelect");
const minPriceInput = document.getElementById("minPrice");
const maxPriceInput = document.getElementById("maxPrice");
const searchBtn = document.getElementById("searchBtn");
const resetBtn = document.getElementById("resetBtn");
const resultsBody = document.getElementById("resultsBody");
const message = document.getElementById("message");

async function loadCategories() {
  const res = await fetch("/categories");
  const categories = await res.json();

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
}

function renderResults(items) {
  resultsBody.innerHTML = "";

  if (items.length === 0) {
    message.textContent = "No results found";
    return;
  }

  message.textContent = "";

  items.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.id}</td>
      <td>${item.name}</td>
      <td>${item.category}</td>
      <td>₹${item.price}</td>
    `;
    resultsBody.appendChild(row);
  });
}

async function fetchResults() {
  const q = searchInput.value.trim();
  const category = categorySelect.value;
  const minPrice = minPriceInput.value.trim();
  const maxPrice = maxPriceInput.value.trim();

  if (
    minPrice !== "" &&
    maxPrice !== "" &&
    Number(minPrice) > Number(maxPrice)
  ) {
    resultsBody.innerHTML = "";
    message.textContent = "Invalid price range: minPrice cannot be greater than maxPrice";
    return;
  }

  const params = new URLSearchParams();

  if (q) params.append("q", q);
  if (category) params.append("category", category);
  if (minPrice) params.append("minPrice", minPrice);
  if (maxPrice) params.append("maxPrice", maxPrice);

  const url = params.toString() ? `/search?${params.toString()}` : "/search";

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      resultsBody.innerHTML = "";
      message.textContent = data.message || "Something went wrong";
      return;
    }

    renderResults(data);
  } catch (error) {
    resultsBody.innerHTML = "";
    message.textContent = "Failed to fetch results";
  }
}

function resetFilters() {
  searchInput.value = "";
  categorySelect.value = "";
  minPriceInput.value = "";
  maxPriceInput.value = "";
  message.textContent = "";
  fetchResults();
}

searchBtn.addEventListener("click", fetchResults);
resetBtn.addEventListener("click", resetFilters);

window.addEventListener("DOMContentLoaded", async () => {
  await loadCategories();
  await fetchResults();
});
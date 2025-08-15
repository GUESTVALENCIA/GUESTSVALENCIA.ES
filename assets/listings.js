// assets/listings.js
async function loadListings() {
  try {
    const res = await fetch('/assets/listings.json');
    const data = await res.json();
    return data;
  } catch (e) {
    return [];
  }
}

async function mountHomeListings() {
  const grid = document.querySelector('#listings-grid');
  if (!grid) return;
  const data = await loadListings();
  grid.innerHTML = '';
  data.forEach(item => {
    const a = document.createElement('a');
    a.className = 'listing-card';
    a.href = `/alojamientos/${item.id}.html`;
    a.innerHTML = `
      <div class="listing-card-image"><img src="${item.img}" alt="${item.title}"></div>
      <h3>${item.title}</h3>
      <p>${item.guests} huéspedes · ${item.beds} dormitorio · ${item.baths} baño</p>
      <div class="price"><strong>€${item.price}</strong> / noche</div>
    `;
    grid.appendChild(a);
  });
}

async function mountAlojamientosPage() {
  const grid = document.querySelector('#alojamientos-grid');
  if (!grid) return;
  const data = await loadListings();
  grid.innerHTML = '';
  data.forEach(item => {
    const a = document.createElement('a');
    a.className = 'listing-card';
    a.href = `/alojamientos/${item.id}.html`;
    a.innerHTML = `
      <div class="listing-card-image"><img src="${item.img}" alt="${item.title}"></div>
      <h3>${item.title}</h3>
      <p>${item.guests} huéspedes · ${item.beds} dormitorio · ${item.baths} baño</p>
      <div class="price"><strong>€${item.price}</strong> / noche</div>
    `;
    grid.appendChild(a);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  mountHomeListings();
  mountAlojamientosPage();
});

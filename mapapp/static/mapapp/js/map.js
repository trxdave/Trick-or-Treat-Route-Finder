// maps.js - moved from template, expects window.ROUTE_CONFIG to be set by the template

// CSRF helper (reads Django cookie)
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const c = cookies[i].trim();
      if (c.startsWith(name + '=')) { cookieValue = decodeURIComponent(c.substring(name.length + 1)); break; }
    }
  }
  return cookieValue;
}
const csrftoken = getCookie('csrftoken');

// Config (set in template)
const cfg = window.ROUTE_CONFIG || {};
const HOUSES_URL = cfg.HOUSES_JSON_URL || '/api/houses/';
const ADD_URL = cfg.ADD_HOUSE_URL || '/add/';
const DELETE_TEMPLATE = cfg.DELETE_HOUSE_TEMPLATE || '/api/houses/0/delete/';
const UPDATE_TEMPLATE = cfg.UPDATE_HOUSE_TEMPLATE || '/api/houses/0/update/';

// Initialize map
const map = L.map('map').setView([51.505, -0.09], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

const markers = {}; // store marker by id

function makeMarkerPopupHtml(house) {
  const name = house.name ? `<strong>${house.name}</strong><br>` : '';
  const addr = house.address ? `${house.address}<br>` : '';
  return `${name}${addr}${house.status || ''}<br>
    <button class="edit-house" data-id="${house.id}" style="margin-top:8px">Edit</button>
    <button class="delete-house" data-id="${house.id}" style="margin-left:6px">Delete</button>`;
}

function makePopupFormHtml({id=null, lat='', lng='', name='', address='', status='giving'}) {
  const statusOptions = `
    <option value="giving" ${status==='giving' ? 'selected':''}>Giving Out Candy</option>
    <option value="out" ${status==='out' ? 'selected':''}>Out of Candy</option>
    <option value="none" ${status==='none' ? 'selected':''}>Not Participating</option>`;
  const dataIdAttr = id ? `data-id="${id}"` : '';
  return `
    <div class="popup-form" ${dataIdAttr}>
      <label style="font-weight:600">Name</label><br>
      <input class="popup-name" type="text" value="${(name||'').replace(/"/g,'&quot;')}" style="width:100%"><br>
      <label style="font-weight:600">Address</label><br>
      <input class="popup-address" type="text" value="${(address||'').replace(/"/g,'&quot;')}" style="width:100%"><br>
      <label style="font-weight:600">Status</label><br>
      <select class="popup-status">${statusOptions}</select>
      <input class="popup-lat" type="hidden" value="${lat}">
      <input class="popup-lng" type="hidden" value="${lng}">
      <div style="margin-top:8px">
        <button class="save-new" type="button">Save</button>
        <button class="cancel-popup" type="button" style="margin-left:6px">Cancel</button>
      </div>
    </div>
  `;
}

function addMarkerToMap(house) {
  if (!house.latitude || !house.longitude) return;
  const id = house.id;
  const lat = parseFloat(house.latitude);
  const lng = parseFloat(house.longitude);
  if (markers[id]) {
    markers[id].setLatLng([lat, lng]);
    markers[id].bindPopup(makeMarkerPopupHtml(house));
    return;
  }
  const m = L.marker([lat, lng]).addTo(map);
  m.bindPopup(makeMarkerPopupHtml(house));
  markers[id] = m;
}

// load houses
function loadHouses() {
  fetch(HOUSES_URL)
    .then(r => r.json())
    .then(arr => {
      // clear then add
      Object.values(markers).forEach(m => map.removeLayer(m));
      for (const k in markers) delete markers[k];
      arr.forEach(addMarkerToMap);
    })
    .catch(e => console.warn('Could not load houses', e));
}
loadHouses();

// click map -> open add popup
map.on('click', function(e) {
  const lat = e.latlng.lat.toFixed(6);
  const lng = e.latlng.lng.toFixed(6);
  L.popup()
    .setLatLng([lat, lng])
    .setContent(makePopupFormHtml({ lat, lng }))
    .openOn(map);
});

// global delegated click handler
document.addEventListener('click', function(ev) {
  const t = ev.target;

  if (t.matches('.cancel-popup')) {
    map.closePopup();
    return;
  }

  if (t.matches('.save-new')) {
    const popupEl = t.closest('.leaflet-popup-content') || t.closest('.popup-form');
    const name = popupEl.querySelector('.popup-name').value.trim();
    const address = popupEl.querySelector('.popup-address').value.trim();
    const status = popupEl.querySelector('.popup-status').value;
    const lat = popupEl.querySelector('.popup-lat').value;
    const lng = popupEl.querySelector('.popup-lng').value;

    const fd = new FormData();
    fd.append('name', name);
    fd.append('address', address);
    fd.append('status', status);
    fd.append('latitude', lat);
    fd.append('longitude', lng);

    fetch(ADD_URL, { method: 'POST', headers: { 'X-CSRFToken': csrftoken }, body: fd })
      .then(() => loadHouses())
      .then(() => map.closePopup())
      .catch(err => { console.error('Add error', err); alert('Add failed'); });
    return;
  }

  if (t.matches('.edit-house')) {
    const id = t.dataset.id;
    fetch(HOUSES_URL)
      .then(r => r.json())
      .then(arr => {
        const h = arr.find(x => String(x.id) === String(id));
        if (!h) { alert('House not found'); return; }
        const lat = h.latitude || 51.505;
        const lng = h.longitude || -0.09;
        L.popup()
          .setLatLng([lat, lng])
          .setContent(makePopupFormHtml({ id: h.id, lat: h.latitude, lng: h.longitude, name: h.name, address: h.address, status: h.status }))
          .openOn(map);
      });
    return;
  }

  if (t.matches('.delete-house')) {
    const id = t.dataset.id;
    if (!confirm('Delete this house?')) return;
    const url = DELETE_TEMPLATE.replace('/0/', `/${id}/`);
    fetch(url, { method: 'POST', headers: { 'X-CSRFToken': csrftoken, 'Accept': 'application/json' } })
      .then(r => r.json())
      .then(js => {
        if (js && js.ok) { if (markers[id]) { map.removeLayer(markers[id]); delete markers[id]; } map.closePopup(); }
        else alert('Delete failed');
      })
      .catch(err => { console.error('Delete error', err); alert('Delete failed'); });
    return;
  }
});

// save edit (detect popup with data-id)
document.addEventListener('click', function(ev) {
  const t = ev.target;
  if (!t.matches('.save-new')) return;
  const popupContent = t.closest('.leaflet-popup-content');
  if (!popupContent) return;
  const formRoot = popupContent.querySelector('.popup-form');
  if (!formRoot) return;
  const id = formRoot.getAttribute('data-id');
  if (!id) return;

  const name = formRoot.querySelector('.popup-name').value.trim();
  const address = formRoot.querySelector('.popup-address').value.trim();
  const status = formRoot.querySelector('.popup-status').value;
  const lat = formRoot.querySelector('.popup-lat').value;
  const lng = formRoot.querySelector('.popup-lng').value;

  const fd = new FormData();
  fd.append('name', name);
  fd.append('address', address);
  fd.append('status', status);
  fd.append('latitude', lat);
  fd.append('longitude', lng);

  const url = UPDATE_TEMPLATE.replace('/0/', `/${id}/`);
  fetch(url, { method: 'POST', headers: { 'X-CSRFToken': csrftoken }, body: fd })
    .then(r => r.json())
    .then(js => {
      if (js && js.ok) return loadHouses();
      throw new Error('Update failed');
    })
    .then(() => map.closePopup())
    .catch(err => { console.error('Update error', err); alert('Update failed'); });
});
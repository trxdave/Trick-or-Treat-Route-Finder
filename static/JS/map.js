document.addEventListener('DOMContentLoaded', function () {
  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      document.cookie.split(';').forEach(c => {
        const t = c.trim();
        if (t.startsWith(name + '=')) cookieValue = decodeURIComponent(t.substring(name.length + 1));
      });
    }
    return cookieValue;
  }
  const csrftoken = getCookie('csrftoken');
  const cfg = window.ROUTE_CONFIG || {};
  const HOUSES_URL = cfg.HOUSES_JSON_URL || '/api/houses/';
  const ADD_URL = cfg.ADD_HOUSE_URL || '/add/';
  const DELETE_TEMPLATE = cfg.DELETE_HOUSE_TEMPLATE || '/api/houses/0/delete/';
  const UPDATE_TEMPLATE = cfg.UPDATE_HOUSE_TEMPLATE || '/api/houses/0/update/';

  // small non-blocking UI message helper (uses existing theme colors)
  function showMapMessage(text, level='info') {
    const el = document.createElement('div');
    el.textContent = text;
    el.style.position = 'fixed';
    el.style.top = '12px';
    el.style.right = '12px';
    el.style.zIndex = 99999;
    el.style.padding = '8px 12px';
    el.style.borderRadius = '6px';
    el.style.fontWeight = '700';
    el.style.color = '#111';
    el.style.background = level === 'success' ? 'rgba(255,197,87,0.98)' : (level === 'danger' ? 'rgba(220,60,60,0.95)' : 'rgba(60,60,60,0.95)');
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  const mapEl = document.getElementById('map');
  if (!mapEl) return console.warn('map element not found');

  const map = L.map('map').setView([51.505, -0.09], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

  const markers = {};

  function makePopupHtml(h) {
    const name = h.name ? `<strong>${h.name}</strong><br>` : '';
    const addr = h.address ? `${h.address}<br>` : '';
    return `${name}${addr}${h.status || ''}<br><button class="delete-house" data-id="${h.id}">Delete</button>`;
  }

  function addMarker(h) {
    if (!h.latitude || !h.longitude) return;
    const id = String(h.id);
    const lat = parseFloat(h.latitude), lng = parseFloat(h.longitude);
    if (markers[id]) {
      markers[id].setLatLng([lat, lng]).bindPopup(makePopupHtml(h));
      return;
    }
    const m = L.marker([lat, lng]).addTo(map);
    m.bindPopup(makePopupHtml(h));
    markers[id] = m;
  }

  function loadHouses() {
    fetch(HOUSES_URL, { credentials: 'same-origin' })
      .then(r => {
        if (!r.ok) throw new Error('Failed to load houses: ' + r.status);
        return r.json();
      })
      .then(arr => {
        Object.values(markers).forEach(m => map.removeLayer(m));
        for (const k in markers) delete markers[k];
        arr.forEach(addMarker);
      })
      .catch(err => console.error('Could not load houses', err));
  }
  loadHouses();

  map.on('click', function (e) {
    const lat = e.latlng.lat.toFixed(6);
    const lng = e.latlng.lng.toFixed(6);
    const formHtml = `
      <div class="popup-form">
        <input id="popup-name" placeholder="Name"><br>
        <input id="popup-addr" placeholder="Address"><br>
        <select id="popup-status">
          <option value="giving">Giving Out Candy</option>
          <option value="out">Out of Candy</option>
          <option value="none">Not Participating</option>
        </select><br>
        <button id="popup-save">Save</button>
        <button id="popup-cancel">Cancel</button>
      </div>`;
    L.popup().setLatLng([lat, lng]).setContent(formHtml).openOn(map);
  });

  document.addEventListener('click', function (ev) {
    const t = ev.target;
    if (!t) return;
    if (t.id === 'popup-cancel') { map.closePopup(); return; }

    if (t.id === 'popup-save') {
      const popup = document.querySelector('.leaflet-popup-content');
      if (!popup) return;
      const name = popup.querySelector('#popup-name').value || '';
      const address = popup.querySelector('#popup-addr').value || '';
      const status = popup.querySelector('#popup-status').value || 'giving';
      // read lat/lng from open popup
      const lat = (map._popup && map._popup._latlng) ? map._popup._latlng.lat.toFixed(6) : null;
      const lng = (map._popup && map._popup._latlng) ? map._popup._latlng.lng.toFixed(6) : null;
      const fd = new FormData();
      fd.append('name', name);
      fd.append('address', address);
      fd.append('status', status);
      fd.append('latitude', lat);
      fd.append('longitude', lng);

      fetch(ADD_URL, {
        method: 'POST',
        headers: {
          'X-CSRFToken': csrftoken,
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        },
        credentials: 'same-origin',
        body: fd
      })
      .then(async r => {
        if (!r.ok) {
          const text = await r.text().catch(()=> 'no body');
          console.error('Add failed', r.status, text);
          showMapMessage('Save failed', 'danger');
          return null;
        }

        // If server returns JSON, parse it. If not, accept the 2xx as success
        const ct = (r.headers.get('content-type') || '').toLowerCase();
        if (ct.includes('application/json')) {
          try {
            return await r.json();
          } catch (err) {
            console.warn('Failed to parse JSON response from add:', err);
            return { ok: true };
          }
        } else {
          // non-json response (HTML/text) — read for logging and treat as success
          const txt = await r.text().catch(()=> '');
          console.info('Add returned non-JSON response:', txt);
          return { ok: true, __raw: txt };
        }
      })
      .then(js => {
        if (!js) return; // error already handled above

        // if server returned created house object, add marker directly
        if (js.id || js.latitude || js.longitude) {
          addMarker(js);
        } else {
          // otherwise refresh the list from server to pick up the new house
          loadHouses();
        }

        showMapMessage('Saved', 'success');
        map.closePopup();
      })
      .catch(err => {
        console.error('Add failed', err);
        showMapMessage('Network error while saving', 'danger');
      });
      return;
    }

    if (t.matches('.delete-house')) {
      const id = t.dataset.id;
      if (!confirm('Delete this house?')) return;
      const url = DELETE_TEMPLATE.replace('/0/', `/${id}/`);
      fetch(url, {
        method: 'POST',
        headers: { 'X-CSRFToken': csrftoken, 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' },
        credentials: 'same-origin'
      })
      .then(async r => {
        if (!r.ok) {
          const text = await r.text().catch(()=> 'no body');
          console.error('Delete failed', r.status, text);
          showMapMessage('Delete failed', 'danger');
          return null;
        }
        return r.json().catch(()=> ({ ok: true }));
      })
      .then(js => {
        if (!js) return;
        if (js && js.ok) {
          if (markers[id]) { map.removeLayer(markers[id]); delete markers[id]; }
          map.closePopup();
          showMapMessage('Deleted', 'success');
        } else {
          showMapMessage('Delete failed', 'danger');
        }
      })
      .catch(err => { console.error('Delete error', err); showMapMessage('Delete failed', 'danger'); });
    }
  });
});
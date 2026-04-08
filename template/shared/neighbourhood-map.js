(function () {
  function initNeighbourhoodMaps() {
    if (!window.L) return;

    document.querySelectorAll('.real-neighbourhood-map').forEach((mapEl) => {
      const shell = mapEl.closest('.neighbourhood-map-shell');
      const data = shell ? shell.querySelectorAll('.map-marker-data a[data-lat][data-lng]') : [];
      const points = Array.from(data)
        .map((item) => ({
          lat: Number(item.dataset.lat),
          lng: Number(item.dataset.lng),
          label: item.dataset.label || item.textContent.trim(),
          tone: item.dataset.tone || 'tone-1',
          url: item.getAttribute('href') || '#'
        }))
        .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));

      if (!points.length) return;

      const fallback = mapEl.querySelector('.map-fallback');
      if (fallback) fallback.remove();

      const map = window.L.map(mapEl, {
        scrollWheelZoom: false,
        zoomControl: true,
        attributionControl: true
      });

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      const bounds = [];

      points.forEach((point) => {
        const marker = window.L.marker([point.lat, point.lng], {
          icon: window.L.divIcon({
            className: `real-map-pin ${point.tone}`,
            html: `<span class="real-map-pin-dot"></span><span class="real-map-pin-label">${escapeHtml(point.label)}</span>`,
            iconSize: [44, 44],
            iconAnchor: [22, 22]
          })
        }).addTo(map);

        marker.bindPopup(`<a href="${escapeAttribute(point.url)}">${escapeHtml(point.label)}</a>`);
        marker.on('click', () => {
          window.location.href = point.url;
        });
        bounds.push([point.lat, point.lng]);
      });

      map.fitBounds(bounds, { padding: [42, 42], maxZoom: 13 });
      setTimeout(() => map.invalidateSize(), 80);
    });
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/"/g, '&quot;');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNeighbourhoodMaps);
  } else {
    initNeighbourhoodMaps();
  }
})();

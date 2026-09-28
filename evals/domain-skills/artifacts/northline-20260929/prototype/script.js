const harbors = {
  north: { name: 'North Pier', windowStart: '06:00', windowEnd: '09:30', wind: '8–11 kn NW', swell: '0.6 m', tide: '08:42', returnBy: '10:15', status: 'Favorable', index: '01 / 03' },
  outer: { name: 'Outer Point', windowStart: '07:15', windowEnd: '09:00', wind: '12–16 kn W', swell: '1.1 m', tide: '08:36', returnBy: '09:45', status: 'Caution', index: '02 / 03' },
  south: { name: 'South Reach', windowStart: '06:30', windowEnd: '10:30', wind: '6–9 kn N', swell: '0.4 m', tide: '08:55', returnBy: '11:15', status: 'Favorable', index: '03 / 03' }
};

const rows = [...document.querySelectorAll('.harbor-row')];
const $ = id => document.getElementById(id);
const minutesFromSix = value => {
  const [hours, minutes] = value.split(':').map(Number);
  return (hours - 6) * 60 + minutes;
};
const percentage = value => `${(minutesFromSix(value) / 360) * 100}%`;

function selectHarbor(key) {
  const harbor = harbors[key];
  if (!harbor) return;
  rows.forEach(row => {
    const selected = row.dataset.harbor === key;
    row.classList.toggle('is-selected', selected);
    row.setAttribute('aria-pressed', String(selected));
  });

  $('detail-harbor').textContent = harbor.name;
  document.querySelector('.detail-index span').textContent = harbor.index;
  $('status-value').textContent = harbor.status;
  $('detail-status').className = `detail-status ${harbor.status.toLowerCase()}`;
  $('window-value').innerHTML = `${harbor.windowStart}<span aria-hidden="true">—</span>${harbor.windowEnd}`;
  $('wind-value').textContent = harbor.wind;
  $('swell-value').textContent = harbor.swell;
  $('tide-value').textContent = harbor.tide;
  $('return-value').textContent = harbor.returnBy;
  $('legend-tide-value').textContent = harbor.tide;
  $('legend-return-value').textContent = harbor.returnBy;

  $('window-bar').style.left = percentage(harbor.windowStart);
  $('window-bar').style.width = `${((minutesFromSix(harbor.windowEnd) - minutesFromSix(harbor.windowStart)) / 360) * 100}%`;
  $('tide-line').style.left = percentage(harbor.tide);
  $('return-line').style.left = percentage(harbor.returnBy);
  $('time-diagram').setAttribute('aria-label', `Morning timeline for ${harbor.name}: best window ${harbor.windowStart} to ${harbor.windowEnd}, high tide ${harbor.tide}, return by ${harbor.returnBy}`);
  $('selection-announcement').textContent = `${harbor.name} selected. Best window ${harbor.windowStart} to ${harbor.windowEnd}; status ${harbor.status}.`;
}

rows.forEach(row => row.addEventListener('click', () => selectHarbor(row.dataset.harbor)));

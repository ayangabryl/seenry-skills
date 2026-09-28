const samples = {
  now: {
    caption: 'Sample status · 16:20', headline: 'OPEN NOW', wind: '24 km/h',
    nextLabel: 'Next predicted<br>restriction', nextTime: '17:30',
    advice: 'Cross now if your walk can finish before 17:30.'
  },
  restriction: {
    caption: 'Predicted at 17:30', headline: 'RESTRICTED', wind: '36 km/h',
    nextLabel: 'Below threshold<br>predicted', nextTime: '18:30',
    advice: 'Do not plan to cross at 17:30 in this sample. Wind is above the restriction threshold.'
  },
  easing: {
    caption: 'Predicted at 18:30', headline: 'BELOW 35', wind: '32 km/h',
    nextLabel: 'Next forecast<br>reading', nextTime: '19:00',
    advice: 'Wind is predicted to fall below the threshold. Check actual bridge status before crossing.'
  }
};
const page = document.body;
const buttons = [...document.querySelectorAll('[data-sample]')];
buttons.forEach(button => button.addEventListener('click', () => {
  const key = button.dataset.sample;
  const item = samples[key];
  page.dataset.state = key;
  document.getElementById('state-caption').textContent = item.caption;
  document.getElementById('status-title').textContent = item.headline;
  document.getElementById('wind-current').textContent = item.wind;
  document.getElementById('next-label').innerHTML = item.nextLabel;
  document.getElementById('next-time').textContent = item.nextTime;
  document.getElementById('advice-text').textContent = item.advice;
  buttons.forEach(option => option.setAttribute('aria-pressed', String(option === button)));
}));

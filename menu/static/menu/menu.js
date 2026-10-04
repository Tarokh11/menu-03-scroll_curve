(() => {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('#site-nav');
  const closeNav = () => { nav.hidden = true; toggle.setAttribute('aria-expanded', 'false'); };
  toggle.addEventListener('click', () => {
    nav.hidden = !nav.hidden;
    toggle.setAttribute('aria-expanded', String(!nav.hidden));
  });
  document.addEventListener('click', event => {
    if (!nav.hidden && !nav.contains(event.target) && !toggle.contains(event.target)) closeNav();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !nav.hidden) { closeNav(); toggle.focus(); }
  });
  const input = document.querySelector('#menu-query');
  if (!input) return;
  const buttons = [...document.querySelectorAll('[data-category]')];
  const groups = [...document.querySelectorAll('[data-group]')];
  const normalize = text => text.replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/[\u200c\u064b-\u065f]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  const params = new URLSearchParams(location.search);
  let category = params.get('category') || 'all';
  if (!buttons.some(button => button.dataset.category === category)) category = 'all';
  input.value = params.get('q') || '';
  function filter(updateUrl = true) {
    const terms = normalize(input.value).split(' ').filter(Boolean);
    let count = 0;
    groups.forEach(group => {
      let visible = 0;
      group.querySelectorAll('[data-search]').forEach(card => {
        const match = (category === 'all' || category === group.dataset.group) && terms.every(term => normalize(card.dataset.search).includes(term));
        card.hidden = !match;
        if (match) visible++;
      });
      group.hidden = !visible;
      count += visible;
    });
    buttons.forEach(button => {
      const active = category === button.dataset.category;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    document.querySelector('#no-results').hidden = count > 0;
    if (updateUrl) {
      const url = new URL(location.href);
      if (category === 'all') url.searchParams.delete('category'); else url.searchParams.set('category', category);
      if (input.value.trim()) url.searchParams.set('q', input.value.trim()); else url.searchParams.delete('q');
      history.replaceState(null, '', url);
    }
  }
  buttons.forEach(button => button.addEventListener('click', () => { category = button.dataset.category; filter(); }));
  input.addEventListener('input', () => filter());
  document.querySelector('#menu-search-form').addEventListener('submit', event => { event.preventDefault(); filter(); });
  filter(false);
})();

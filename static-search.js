import { findResults, normalizeQuery } from '/search-core.mjs';
const query = normalizeQuery(new URLSearchParams(location.search).get('q'));
const input = document.querySelector('#q');
input.value = query;
if (query) {
  document.querySelector('.search-help')?.remove();
  const section = document.createElement('section');
  section.className = 'search-results';
  section.setAttribute('aria-live', 'polite');
  section.textContent = 'Ищем статьи…';
  document.querySelector('main').append(section);
  try {
    const response = await fetch('/search-index.json');
    if (!response.ok) throw Error('Search unavailable');
    const results = findResults(await response.json(), query);
    section.textContent = '';
    const heading = document.createElement('h2');
    heading.textContent = results.length ? 'Результаты: ' + results.length : 'Ничего не найдено';
    section.append(heading);
    for (const result of results) {
      const link = document.createElement('a');
      link.href = result.href;
      const title = document.createElement('strong'); title.textContent = result.title;
      const description = document.createElement('span'); description.textContent = result.text;
      const arrow = document.createElement('b'); arrow.textContent = '→'; arrow.setAttribute('aria-hidden', 'true');
      link.append(title, description, arrow); section.append(link);
    }
    if (!results.length) {
      const message = document.createElement('p');
      message.textContent = 'Попробуйте запрос короче: тараканы, клопы, моль или безопасность.';
      section.append(message);
    }
  } catch {
    section.textContent = 'Не удалось загрузить поиск. Обновите страницу или выберите раздел в меню.';
  }
}

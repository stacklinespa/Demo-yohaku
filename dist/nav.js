const menu = document.querySelector('#carta');
const categoryNavigation = menu.querySelector('.category-nav');
const categoryToggle = categoryNavigation.querySelector('.category-toggle');
const categoryCurrent = categoryToggle.querySelector('.category-current');
const searchShortcut = categoryNavigation.querySelector('.category-search');
const searchForm = menu.querySelector('.menu-search');
const searchInput = searchForm.querySelector('input');
const searchClear = searchForm.querySelector('.search-clear');
const searchStatus = searchForm.querySelector('.search-status');
const mobileLayout = matchMedia('(max-width: 46rem)');

function searchText(text) {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('es-CL');
}

const categories = Array.from(categoryNavigation.querySelectorAll('.category-links a'), link => {
  const section = document.getElementById(link.hash.slice(1));
  const labels = [link.textContent, section.querySelector('h3').textContent];
  const groups = Array.from(section.querySelectorAll('.menu-group'), group => {
    const groupName = group.querySelector('h4')?.textContent ?? '';
    const items = Array.from(group.querySelectorAll('.menu-item'), item => ({
      item,
      index: searchText([...labels, groupName, item.firstElementChild.textContent].join(' ')),
    }));
    return { group, items };
  });
  return { link, section, groups };
});

let currentCategory;
let pending = false;

function setCategoriesOpen(open, moveFocus = false) {
  categoryNavigation.toggleAttribute('data-open', open);
  categoryToggle.setAttribute('aria-expanded', String(open));
  if (moveFocus) categoryToggle.focus({ preventScroll: true });
}

function syncCategory() {
  pending = false;
  const fold = categoryNavigation.getBoundingClientRect().bottom + 30;
  let nextCategory;

  for (const category of categories) {
    if (category.section.hidden) continue;
    nextCategory ??= category;
    if (category.section.getBoundingClientRect().top > fold) break;
    nextCategory = category;
  }
  // Near the footer, a fragment can be visible without reaching the sticky bar.
  if (scrollY > 0 && scrollY + innerHeight >= document.documentElement.scrollHeight - 2) {
    const anchoredCategory = categories.find(({ link, section }) =>
      !section.hidden && link.hash === location.hash && section.getBoundingClientRect().top > fold,
    );
    nextCategory = anchoredCategory ?? nextCategory;
  }

  if (nextCategory === currentCategory) return;

  currentCategory?.link.removeAttribute('aria-current');
  nextCategory?.link.setAttribute('aria-current', 'location');
  currentCategory = nextCategory;
  categoryCurrent.textContent = currentCategory?.link.textContent ?? 'Todas';
}

function scheduleCategorySync() {
  if (pending) return;
  pending = true;
  requestAnimationFrame(syncCategory);
}

function filterMenu() {
  const terms = searchText(searchInput.value).trim().split(/\s+/).filter(Boolean);
  let results = 0;

  for (const { link, section, groups } of categories) {
    let sectionHasResults = false;
    for (const { group, items } of groups) {
      let groupHasResults = false;
      for (const { item, index } of items) {
        const matches = terms.every(term => index.includes(term));
        item.hidden = !matches;
        if (matches) {
          results++;
          groupHasResults = true;
        }
      }
      group.hidden = !groupHasResults;
      sectionHasResults ||= groupHasResults;
    }
    section.hidden = !sectionHasResults;
    link.hidden = !sectionHasResults;
  }

  searchClear.hidden = !searchInput.value;
  categoryNavigation.hidden = results === 0;
  if (terms.length === 0) {
    searchStatus.textContent = '';
  } else if (results === 0) {
    searchStatus.textContent = 'No hay coincidencias. Prueba con otro producto o ingrediente.';
  } else {
    searchStatus.textContent = results === 1 ? '1 resultado' : results + ' resultados';
  }

  setCategoriesOpen(false);
  scheduleCategorySync();
}

categoryToggle.addEventListener('click', () => {
  setCategoriesOpen(!categoryNavigation.hasAttribute('data-open'));
});

categoryNavigation.addEventListener('click', event => {
  if (event.target.closest('.category-links a') && mobileLayout.matches) {
    setCategoriesOpen(false, true);
  }
});

categoryNavigation.addEventListener('keydown', event => {
  if (event.key === 'Escape' && categoryNavigation.hasAttribute('data-open')) {
    event.preventDefault();
    setCategoriesOpen(false, true);
  }
});

categoryNavigation.addEventListener('focusout', event => {
  if (event.relatedTarget && !categoryNavigation.contains(event.relatedTarget)) setCategoriesOpen(false);
});

document.addEventListener('click', event => {
  if (!categoryNavigation.contains(event.target) && categoryNavigation.hasAttribute('data-open')) {
    setCategoriesOpen(false);
  }
});

searchShortcut.addEventListener('click', () => {
  setCategoriesOpen(false);
  menu.scrollIntoView({ block: 'start' });
  searchInput.focus({ preventScroll: true });
});

searchForm.addEventListener('submit', event => {
  event.preventDefault();
  searchInput.blur();
});

searchInput.addEventListener('input', filterMenu);
searchClear.addEventListener('click', () => {
  searchInput.value = '';
  searchInput.focus();
  filterMenu();
});

window.addEventListener('scroll', scheduleCategorySync, { passive: true });
window.addEventListener('resize', scheduleCategorySync);
window.addEventListener('hashchange', scheduleCategorySync);
window.addEventListener('pageshow', filterMenu);
mobileLayout.addEventListener('change', () => setCategoriesOpen(false));

searchForm.hidden = false;
categoryToggle.hidden = false;
searchShortcut.hidden = false;
categoryNavigation.setAttribute('data-enhanced', '');
filterMenu();

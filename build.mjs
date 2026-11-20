import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';

const source = new URL('./src/', import.meta.url);
const output = new URL('./dist/', import.meta.url);
const { season, location, categories, promotions } = JSON.parse(
  await readFile(new URL('./carta.json', import.meta.url), 'utf8'),
);
const template = await readFile(new URL('index.template.html', source), 'utf8');
const amount = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 });
const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => entities[character]);
}

function price(value) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error('Precio inválido en carta.json: ' + value);
  }
  return '<span class="price">$' + amount.format(value) + '</span>';
}

function renderOptions(options, className) {
  const rows = options.map(({ label, price: value }) =>
    '<div><dt>' + escapeHtml(label) + '</dt><dd>' + price(value) + '</dd></div>',
  );
  return '<dl class="' + className + '">' + rows.join('') + '</dl>';
}

function renderItem(item) {
  const itemPrice = item.options
    ? renderOptions(item.options, 'item-options')
    : item.price !== undefined ? price(item.price) : '';
  const description = item.description
    ? '<p class="item-description">' + escapeHtml(item.description) + '</p>' : '';

  return '              <li class="menu-item' + (itemPrice ? '' : ' no-price') + '">'
    + '<div><p class="item-name">' + escapeHtml(item.name) + '</p>' + description
    + '</div>' + itemPrice + '</li>';
}

function renderGroup(group) {
  const heading = group.name
    ? '<div class="group-heading"><div><h4>' + escapeHtml(group.name) + '</h4>'
      + (group.note ? '<p>' + escapeHtml(group.note) + '</p>' : '') + '</div>'
      + (group.options ? renderOptions(group.options, 'group-options') : '') + '</div>'
    : '';
  const className = group.items.length === 1 ? 'menu-group single-item' : 'menu-group';

  return [
    '          <div class="' + className + '">',
    heading ? '            ' + heading : '',
    '            <ul class="menu-items">',
    ...group.items.map(renderItem),
    '            </ul>',
    '          </div>',
  ].filter(Boolean).join('\n');
}

function renderSection(category) {
  const sectionId = escapeHtml(category.id);
  const title = '<h3 id="titulo-' + sectionId + '">' + escapeHtml(category.name) + '</h3>';
  const note = category.note ? '<p class="section-note">' + escapeHtml(category.note) + '</p>' : '';
  const art = category.illustration
    ? '            <div class="section-art" aria-hidden="true"><img src="assets/'
      + escapeHtml(category.illustration) + '" alt="" loading="lazy" decoding="async"></div>'
    : '';

  return [
    '        <section class="menu-section" id="' + sectionId + '" aria-labelledby="titulo-' + sectionId + '">',
    '          <header class="section-heading">',
    '            <div>' + title + note + '</div>',
    art,
    '          </header>',
    ...category.groups.map(renderGroup),
    '        </section>',
  ].filter(Boolean).join('\n');
}

function renderPromotions() {
  if (!promotions.length) {
    return '          <p>Consulta las últimas novedades y promociones de Yohaku en Instagram.</p>';
  }

  const cards = promotions.map(promotion => {
    const details = promotion.note ? '<p class="promotion-note">' + escapeHtml(promotion.note) + '</p>' : '';
    return '            <li><h3>' + escapeHtml(promotion.title) + '</h3><p>'
      + escapeHtml(promotion.description) + '</p>' + details + '</li>';
  });
  return ['          <ul class="promotion-list">', ...cards, '          </ul>'].join('\n');
}

const ids = new Set();
for (const category of categories) {
  if (!/^[a-z][a-z0-9-]*$/.test(category.id) || ids.has(category.id)) {
    throw new Error('Identificador de categoría inválido o repetido: ' + category.id);
  }
  ids.add(category.id);
}

const map = new URL('https://www.google.com/maps/search/');
map.searchParams.set('api', '1');
map.searchParams.set('query', location.address + ', ' + location.city);

const content = {
  SEASON: escapeHtml(season),
  CATEGORY_LINKS: categories.map(({ id, tab }) =>
    '          <a href="#' + escapeHtml(id) + '">' + escapeHtml(tab) + '</a>',
  ).join('\n'),
  MENU_SECTIONS: categories.map(renderSection).join('\n'),
  PROMOTIONS: renderPromotions(),
  INSTAGRAM: escapeHtml(location.instagram),
  ADDRESS: escapeHtml(location.address),
  CITY: escapeHtml(location.city),
  MAP: escapeHtml(map.href),
  HOURS: location.hours.map(([days, times]) =>
    '          <div><dt>' + escapeHtml(days) + '</dt><dd>' + escapeHtml(times) + '</dd></div>',
  ).join('\n'),
};

const html = template.replace(/%%([A-Z_]+)%%/g, (_, key) => {
  if (!Object.hasOwn(content, key)) throw new Error('Variable de plantilla desconocida: ' + key);
  return content[key];
});

await mkdir(output, { recursive: true });
await Promise.all([
  writeFile(new URL('index.html', output), html),
  cp(new URL('styles.css', source), new URL('styles.css', output)),
  cp(new URL('nav.js', source), new URL('nav.js', output)),
  cp(new URL('assets/', source), new URL('assets/', output), { recursive: true }),
]);

const count = categories.flatMap(category => category.groups.flatMap(group => group.items)).length;
console.log('Carta generada con ' + count + ' productos en ' + categories.length + ' categorías.');

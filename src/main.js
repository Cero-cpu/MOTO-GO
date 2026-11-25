/**
 * Web pública de Motogo — punto de entrada.
 *
 * Flujo de carga "rayo":
 * 1. El HTML ya trae el contenido fijo (hero, servicios, calculadora con valores por defecto).
 * 2. Si hay datos de una visita anterior (caché), se pintan al instante.
 * 3. Se piden los datos frescos (1 sola petición) y se repinta solo lo que cambió.
 */
import './styles/site.css';
import { DEFAULT_SETTINGS } from './config.js';
import { fetchSiteData, onDataChange, readCache, writeCache } from './services/site-api.js';
import { initImageFallback, whatsappUrl } from './lib/utils.js';
import { applyContact } from './components/whatsapp-links.js';
import { initMobileMenu, initScrollSpy, initStickyHeader } from './components/menu.js';
import { createCalculator } from './components/calculator.js';
import { createCatalog } from './components/catalog.js';
import { createBikeModal } from './components/bike-modal.js';
import { renderBranches } from './components/branches.js';
import { renderOffers } from './components/offers.js';

initImageFallback();
initMobileMenu();
initStickyHeader();
initScrollSpy();
applyContact(DEFAULT_SETTINGS.contact);
document.getElementById('year').textContent = new Date().getFullYear();

const calculator = createCalculator(DEFAULT_SETTINGS.finance);
let catalog;
const modal = createBikeModal({
  getList: () => catalog.getVisible(),
  onCalculate: (price) => calculator.setPrice(price),
});
catalog = createCatalog({ onOpen: modal.open });

let current = {};

/** Pinta solo las partes cuyos datos cambiaron. */
function render(data) {
  const changed = (...keys) => keys.some((k) => JSON.stringify(data[k]) !== JSON.stringify(current[k]));

  if (changed('settings')) {
    applyContact(data.settings.contact);
    calculator.setFinance(data.settings.finance);
  }
  if (changed('branches')) renderBranches(data.branches);
  if (changed('offers')) renderOffers(data.offers);
  if (changed('bikes', 'categories', 'branches', 'settings')) {
    modal.setData(data);
    catalog.setData(data);
  }
  current = data;
}

async function refresh() {
  try {
    const data = await fetchSiteData();
    writeCache(data);
    render(data);
  } catch (error) {
    console.error(error);
    if (!current.bikes) catalog.showError(whatsappUrl('Hola Motogo, quisiera ver el catálogo de motos disponibles.'));
  }
}

const cached = readCache();
if (cached) render(cached);
refresh();

// El panel avisa al guardar → la web se pone al día sin recargar
onDataChange(refresh);

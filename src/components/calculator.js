import { $, $$, formatMoney, monthlyPayment, whatsappUrl } from '../lib/utils.js';

/**
 * Calculadora de financiamiento.
 * @param {object} initialFinance  valores con los que se pinta antes de que lleguen los datos
 * @returns {{ setFinance(finance: object): void, setPrice(price: number): void }}
 */
export function createCalculator(initialFinance) {
  const root = $('#calculadora');
  const el = {
    price: $('#input-price', root),
    down: $('#input-downpayment', root),
    priceOut: $('#display-price', root),
    priceMin: $('#display-price-min', root),
    priceMax: $('#display-price-max', root),
    percentOut: $('#display-percent', root),
    downOut: $('#display-downpayment', root),
    monthlyOut: $('#display-monthly', root),
    terms: $('#term-options', root),
    termsSummary: $('#terms-summary', root),
    apply: $('#btn-apply-loan', root),
  };

  let finance = initialFinance;
  let term = initialFinance.defaultTerm;

  function render() {
    const price = Number(el.price.value);
    const percent = Number(el.down.value);
    const down = price * (percent / 100);
    const monthly = monthlyPayment(price - down, finance.monthlyRate, term);

    el.priceOut.textContent = formatMoney(price);
    el.priceMin.textContent = formatMoney(Number(el.price.min));
    el.priceMax.textContent = formatMoney(Number(el.price.max));
    el.percentOut.textContent = percent;
    el.downOut.textContent = formatMoney(down);
    el.monthlyOut.textContent = formatMoney(monthly);

    // Parte rellena de la pista (Chrome/Safari no la pintan solos)
    for (const input of [el.price, el.down]) {
      const { min, max, value } = input;
      input.style.setProperty('--fill', `${((value - min) / (max - min || 1)) * 100}%`);
    }

    $$('[data-term]', el.terms).forEach((btn) => {
      btn.setAttribute('aria-pressed', String(Number(btn.dataset.term) === term));
    });

    el.apply.href = whatsappUrl(
      `Hola Motogo, deseo solicitar financiamiento para un vehículo de ${formatMoney(price)} con inicial de ${formatMoney(down)} a ${term} meses.`,
    );
  }

  function setFinance(next) {
    finance = next;
    const { terms } = finance;
    if (!terms.includes(term)) term = terms.includes(finance.defaultTerm) ? finance.defaultTerm : terms[0];

    Object.assign(el.price, { min: finance.price.min, max: finance.price.max, step: finance.price.step });
    Object.assign(el.down, { min: finance.downPayment.min, max: finance.downPayment.max, step: finance.downPayment.step });
    // Solo se reposicionan los deslizadores si el usuario aún no los ha tocado
    if (!el.price.dataset.touched) el.price.value = finance.price.default;
    if (!el.down.dataset.touched) el.down.value = finance.downPayment.default;

    el.termsSummary.textContent = terms.length > 1
      ? `Planes a ${terms.slice(0, -1).join(', ')} y ${terms.at(-1)} meses`
      : `Plan a ${terms[0]} meses`;
    el.terms.innerHTML = terms
      .map((t) => `<button type="button" class="chip chip--lg" data-term="${t}" aria-pressed="false">${t} meses</button>`)
      .join('');
    render();
  }

  for (const input of [el.price, el.down]) {
    input.addEventListener('input', () => {
      input.dataset.touched = 'true';
      render();
    });
  }

  el.terms.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-term]');
    if (!btn) return;
    term = Number(btn.dataset.term);
    render();
  });

  setFinance(initialFinance);

  return {
    setFinance,
    /** Pone en la calculadora el precio de una moto (amplía el rango si hace falta). */
    setPrice(price) {
      if (price > Number(el.price.max)) el.price.max = price;
      if (price < Number(el.price.min)) el.price.min = price;
      el.price.step = 1; // el precio exacto de la moto, sin redondear al paso
      el.price.value = price;
      el.price.dataset.touched = 'true';
      render();
    },
  };
}

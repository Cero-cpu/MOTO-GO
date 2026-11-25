import { $$, configureContact, whatsappUrl } from '../lib/utils.js';

/**
 * Aplica el contacto (WhatsApp/teléfono) a toda la página.
 * Cualquier <a data-wa="mensaje"> se convierte en enlace de WhatsApp con ese mensaje.
 */
export function applyContact(contact) {
  configureContact(contact);
  $$('a[data-wa]').forEach((link) => {
    link.href = whatsappUrl(link.dataset.wa);
    link.target = '_blank';
    link.rel = 'noopener';
  });
  $$('[data-phone-display]').forEach((el) => {
    el.textContent = contact.phoneDisplay;
  });
  // Mismo número para llamadas: <a data-phone-call> → tel:+1809...
  $$('a[data-phone-call]').forEach((link) => {
    link.href = `tel:+${contact.whatsapp}`;
  });
}

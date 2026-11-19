/* Public API for the future receipt-note window. No UI is rendered here. */
(() => {
  const maxCharacters = 1000;

  function configurationError() {
    return new Error('Receipt notes are not configured yet.');
  }

  async function submitReceiptNote(note, turnstileToken) {
    const config = window.receiptNoteConfig || {};
    const text = typeof note === 'string' ? note.trim() : '';

    if (!config.endpoint || !config.turnstileSiteKey) throw configurationError();
    if (!text) throw new Error('Enter a note before saving.');
    if (text.length > maxCharacters) {
      throw new Error(`Notes may be at most ${maxCharacters} characters.`);
    }
    if (!turnstileToken) throw new Error('Please complete the anti-spam check.');

    let response;
    try {
      response = await fetch(`${config.endpoint.replace(/\/$/, '')}/submit`, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: text, turnstileToken })
      });
    } catch {
      throw new Error('Could not reach the receipt service. Please try again.');
    }

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || 'Could not save this note. Please try again.');
    }
    return payload;
  }

  window.submitReceiptNote = submitReceiptNote;
  window.receiptNoteMaxCharacters = maxCharacters;
})();

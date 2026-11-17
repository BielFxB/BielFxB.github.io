(() => {
  'use strict';
  const form = document.querySelector('#guest-form');
  const input = document.querySelector('#guest-name');
  const button = form.querySelector('button');
  const list = document.querySelector('#guest-stars');
  const status = document.querySelector('#guest-status');
  const config = window.GUESTBOOK_CONFIG || {};
  let busy = false;
  let endpoint;
  try {
    const url = new URL(config.url);
    if (url.protocol !== 'https:' || !config.publishableKey || config.publishableKey.startsWith('sb_secret_')) throw Error();
    if (!config.publishableKey.startsWith('sb_publishable_')) {
      const payload = JSON.parse(atob(config.publishableKey.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.role !== 'anon') throw Error();
    }
    endpoint = url.origin + '/rest/v1/rpc/';
  } catch {
    button.disabled = true;
    input.disabled = true;
    status.textContent = 'O livro de visitas está sendo preparado. Volte em breve!';
    form.addEventListener('submit', event => event.preventDefault());
    return;
  }

  async function rpc(name, body = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(endpoint + name, {
        method: 'POST',
        headers: { apikey: config.publishableKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      const data = await response.json();
      if (!response.ok) {
        const error = new Error('guestbook-request');
        error.code = data.code;
        throw error;
      }
      return data;
    } finally {
      clearTimeout(timeout);
    }
  }

  function render(entries) {
    const nodes = entries.map(entry => {
      const node = document.createElement('div');
      node.className = 'guest-entry';
      node.append(document.createTextNode('✦ ' + entry.name + ' esteve aqui '));
      const time = document.createElement('time');
      time.dateTime = entry.created_at;
      time.textContent = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(entry.created_at));
      node.append(time);
      return node;
    });
    list.replaceChildren(...nodes);
  }

  async function load() {
    status.textContent = 'Buscando estrelas…';
    try {
      const entries = await rpc('guestbook_list');
      render(entries);
      status.textContent = entries.length ? '' : 'Seja a primeira pessoa a deixar uma estrela!';
    } catch {
      status.textContent = 'Não foi possível carregar as visitas. Você ainda pode tentar deixar sua estrela.';
    }
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    const name = input.value.trim();
    if (!name || Array.from(name).length > 32) {
      status.textContent = 'Use um nome ou apelido de 1 a 32 caracteres.';
      return;
    }
    busy = true;
    button.disabled = true;
    const label = button.textContent;
    button.textContent = 'enviando…';
    status.textContent = 'Salvando sua estrela…';
    try {
      const entries = await rpc('guestbook_sign', { visitor_name: name });
      render(entries);
      if (input.value.trim() === name) input.value = '';
      status.textContent = 'Sua estrela ficou registrada. Obrigado pela visita!';
    } catch (error) {
      status.textContent = error.code === 'PT429'
        ? 'Muitas estrelas por agora, ou esse nome já assinou hoje. Tente mais tarde.'
        : error.code === '22023'
          ? 'Use um nome válido de 1 a 32 caracteres, sem quebras de linha.'
          : 'Não foi possível confirmar o envio. Seu nome foi mantido; tente novamente em instantes.';
    } finally {
      busy = false;
      button.disabled = false;
      button.textContent = label;
    }
  });
  // A leitura inicial termina antes de habilitar envios, evitando sobrescrever a lista após salvar.
  button.disabled = true;
  load().finally(() => { button.disabled = false; });
})();

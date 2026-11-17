(() => {
  'use strict';
  const form = document.querySelector('#guest-form');
  const input = document.querySelector('#guest-name');
  const button = form.querySelector('button');
  const list = document.querySelector('#guest-stars');
  const status = document.querySelector('#guest-status');
  const own = document.querySelector('#guest-own');
  const removeButton = document.querySelector('#guest-delete');
  const config = window.GUESTBOOK_CONFIG || {};
  let busy = false;
  let ready = false;
  let mine = null;
  let token;
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

  try {
    token = localStorage.getItem('gw-guest-token');
    if (!/^[0-9a-f]{64}$/.test(token || '')) {
      token = Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('');
      localStorage.setItem('gw-guest-token', token);
    }
  } catch {
    button.disabled = true;
    input.disabled = true;
    status.textContent = 'Permita o armazenamento neste navegador para assinar e poder apagar sua estrela depois.';
    form.addEventListener('submit', event => event.preventDefault());
    return;
  }

  function controls() {
    form.hidden = Boolean(mine);
    own.hidden = !mine;
    input.disabled = button.disabled = removeButton.disabled = busy || !ready;
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
      const [entries, current] = await Promise.all([
        rpc('guestbook_list'), rpc('guestbook_mine', { visitor_token: token })
      ]);
      render(entries);
      mine = current[0] || null;
      ready = true;
      status.textContent = entries.length ? '' : 'Seja a primeira pessoa a deixar uma estrela!';
    } catch {
      ready = false;
      status.textContent = 'Não foi possível consultar sua assinatura. Recarregue a página para tentar novamente.';
    } finally {
      controls();
    }
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || !ready || mine) return;
    const name = input.value.trim();
    if (!name || Array.from(name).length > 32) {
      status.textContent = 'Use um nome ou apelido de 1 a 32 caracteres.';
      return;
    }
    busy = true;
    controls();
    const label = button.textContent;
    button.textContent = 'enviando…';
    status.textContent = 'Salvando sua estrela…';
    try {
      const entries = await rpc('guestbook_sign', { visitor_name: name, visitor_token: token });
      render(entries);
      mine = { name };
      if (input.value.trim() === name) input.value = '';
      status.textContent = 'Sua estrela ficou registrada. Obrigado pela visita!';
    } catch (error) {
      // Confere o banco também após falhas: o envio pode ter sido salvo antes de uma interrupção de rede.
      await load();
      status.textContent = error.code === 'PT409'
        ? 'Você já deixou uma estrela. Apague a atual para assinar novamente.'
        : error.code === 'PT429'
        ? 'Muitas estrelas por agora. Tente mais tarde.'
        : error.code === '22023'
          ? 'Use um nome válido de 1 a 32 caracteres, sem quebras de linha.'
          : 'Não foi possível confirmar o envio. Seu nome foi mantido; tente novamente em instantes.';
    } finally {
      busy = false;
      controls();
      button.textContent = label;
    }
  });
  removeButton.addEventListener('click', async () => {
    if (busy || !ready || !mine) return;
    busy = true;
    controls();
    status.textContent = 'Apagando sua estrela…';
    try {
      render(await rpc('guestbook_delete', { visitor_token: token }));
      mine = null;
      status.textContent = 'Sua estrela foi apagada. Você pode assinar novamente!';
    } catch {
      await load();
      status.textContent = 'Não foi possível confirmar a exclusão. Confira sua assinatura e tente novamente.';
    } finally {
      busy = false;
      controls();
    }
  });
  window.addEventListener('focus', () => { if (!busy) refresh(); });
  function refresh() {
    if (busy) return;
    busy = true;
    controls();
    load().finally(() => { busy = false; controls(); });
  }
  controls();
  refresh();
})();

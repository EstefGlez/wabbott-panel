import { renderNav } from './nav.js';
import { renderConversations, renderBusinesses, renderSettings, renderConversationDetail } from './screens.js';
import { parseHash } from '../domain/navigation.js';

const state = { currentHash: window.location.hash };

function renderAll() {
  renderNav(state);
  renderScreen(state);
}

function renderScreen(state) {
  const destination = parseHash(state.currentHash);
  const app = document.getElementById('app');
  app.innerHTML = '';

  switch (destination) {
    case 'conversaciones':
      app.appendChild(renderConversations(state));
      app.appendChild(renderConversationDetail(state));
      break;
    case 'negocios':
      app.appendChild(renderBusinesses(state));
      break;
    case 'ajustes':
      app.appendChild(renderSettings(state));
      break;
  }
}

window.addEventListener('hashchange', () => {
  state.currentHash = window.location.hash;
  renderAll();
});

renderAll();
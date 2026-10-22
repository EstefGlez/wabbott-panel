import { DESTINATIONS, parseHash, isActive } from '../domain/navigation.js';

/**
 * Renderiza la barra de navegación con enlaces nativos.
 * @param {Object} state - Estado actual { currentHash: string, isLoggedIn: boolean }
 * @returns {HTMLElement} Elemento <nav> poblado
 */
export function renderNav(state) {
  const nav = document.getElementById('nav');

  // Ocultar nav si no está logueado o está en la pantalla de login
  if (!state.isLoggedIn || parseHash(state.currentHash) === 'login') {
    nav.hidden = true;
    nav.textContent = '';
    return nav;
  }

  nav.hidden = false;
  nav.textContent = '';

  const ul = document.createElement('ul');
  ul.className = 'nav-list';
  ul.setAttribute('role', 'list');

  for (const destination of DESTINATIONS) {
    const li = document.createElement('li');
    li.className = 'nav-item';

    const a = document.createElement('a');
    a.href = `#/${destination}`;
    a.className = 'nav-link';
    a.textContent = capitalize(destination);

    if (isActive(state.currentHash, destination)) {
      a.setAttribute('aria-current', 'page');
      a.classList.add('nav-link--active');
    }

    li.appendChild(a);
    ul.appendChild(li);
  }

  nav.appendChild(ul);
  return nav;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
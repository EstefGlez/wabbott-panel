import { renderNav } from './nav.js';
import { renderConversations, renderBusinesses, renderSettingsScreen, renderConversationDetail, renderBusinessDetailScreen, renderSources } from './screens.js';
import { renderConversationRows } from './conversationList.js';
import { renderLogin, bindLoginEvents } from './login.js';
import { parseHash, getBusinessIdFromHash, isSourcesView } from '../domain/navigation.js';
import { createMockService } from '../services/mockService.js';
import { getWindowChip } from '../domain/window.js';
import { validateMessageText } from '../domain/messages.js';
import { openBusinessModal } from './businessModal.js';
import { openNumberModal } from './numberModal.js';
import { openSourceModal } from './sourceModal.js';

const service = createMockService();

const state = {
  currentHash: window.location.hash,
  conversations: [],
  filteredConversations: [],
  selectedBusinessId: null,
  selectedStatus: 'all',
  searchQuery: '',
  businessColors: {},
  // Autenticación (maqueta)
  isLoggedIn: false,
  // Detalle de conversación
  currentConversationId: null,
  currentConversation: null,
  messages: [],
  // Negocios y fuentes
  currentBusinessId: null,
  currentBusiness: null,
  businessNumbers: [],
  businessSources: [],
  // Ajustes
  notificationSettings: null,
};

async function init() {
  // Cargar conversaciones y datos de negocios
  const [conversations, businesses] = await Promise.all([
    service.listConversations(),
    service.listBusinesses(),
  ]);

  state.conversations = conversations;
  state.filteredConversations = conversations;

  // Construir mapa de colores de negocios con números
  for (const biz of businesses) {
    const numbers = await service.listNumbers(biz.id);
    state.businessColors[biz.id] = {
      name: biz.name,
      color: biz.color,
      numbers: numbers.map(n => ({ id: n.id, displayName: n.displayName, e164: n.e164 })),
    };
  }

  // Listener para cambios de filtro/búsqueda
  window.addEventListener('conversations:filter-change', () => {
    // Solo re-renderizar las filas de la lista para preservar foco en el buscador
    const rowsContainer = document.querySelector('.conversation-rows');
    if (rowsContainer) {
      const newRows = renderConversationRows(state);
      rowsContainer.replaceWith(newRows);
    } else {
      renderScreen(state);
    }
  });

  // Delegación de acciones en detalle de conversación (click)
  document.addEventListener('click', async (e) => {
    // Botón "Tomar conversación"
    const takeBtn = e.target.closest('[data-action="take-conversation"]');
    if (takeBtn && state.currentConversationId) {
      await handleTakeConversation(state.currentConversationId);
      return;
    }

    // Botón "Devolver al bot" (confirmado)
    const returnBtn = e.target.closest('[data-action="return-to-bot"]');
    if (returnBtn && state.currentConversationId) {
      await handleReturnToBot(state.currentConversationId);
      return;
    }

    // Botón "Enviar mensaje" en compositor
    const sendBtn = e.target.closest('[data-action="send-message"]');
    if (sendBtn && state.currentConversationId) {
      await handleSendMessage(state.currentConversationId);
      return;
    }
  });

  // Enter en textarea del compositor (Shift+Enter = nueva línea)
  document.addEventListener('keydown', async (e) => {
    const textarea = e.target.closest('.composer__textarea');
    if (textarea && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (state.currentConversationId) {
        await handleSendMessage(state.currentConversationId);
      }
    }
  });

  // Auto-resize textarea del compositor
  document.addEventListener('input', (e) => {
    const textarea = e.target.closest('.composer__textarea');
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  });

  // Login events: delegado en document porque el form se recrea
  document.addEventListener('submit', async (e) => {
    const form = e.target.closest('#login-form');
    if (form) {
      e.preventDefault();
      const formData = new FormData(form);
      const email = formData.get('email')?.trim() ?? '';
      const password = formData.get('password')?.trim() ?? '';

      const errorEl = document.getElementById('login-error');
      if (!email || !password) {
        if (errorEl) errorEl.hidden = false;
        return;
      }

      if (errorEl) errorEl.hidden = true;
      // Login exitoso (maqueta): cualquier credencial
      state.isLoggedIn = true;
      window.location.hash = '#/conversaciones';
    }
  });

  renderAll();
}

function renderAll() {
  renderNav(state);
  renderScreen(state);
}

function renderScreen(state) {
  const destination = parseHash(state.currentHash);
  const app = document.getElementById('app');
  app.textContent = '';

  // Si no está logueado y no es login, redirigir a login
  if (!state.isLoggedIn && destination !== 'login') {
    window.location.hash = '#/login';
    return;
  }

  // Si está logueado y va a login, redirigir a conversaciones
  if (state.isLoggedIn && destination === 'login') {
    window.location.hash = '#/conversaciones';
    return;
  }

  switch (destination) {
    case 'conversaciones':
      if (state.currentConversationId) {
        // Vista detalle de conversación
        app.appendChild(renderConversationDetail(state));
      } else {
        // Vista lista de conversaciones
        app.appendChild(renderConversations(state));
        app.appendChild(renderConversationDetail(state)); // placeholder en escritorio
      }
      break;
    case 'negocios':
      if (isSourcesView(state.currentHash)) {
        // Vista lista de fuentes
        app.appendChild(renderSources(state));
      } else {
        // Vista lista de negocios o detalle
        app.appendChild(renderBusinessDetailScreen(state));
      }
      break;
    case 'ajustes':
      app.appendChild(renderSettingsScreen(state));
      break;
    case 'login':
      app.innerHTML = renderLogin(state);
      bindLoginEvents(() => {
        state.isLoggedIn = true;
        window.location.hash = '#/conversaciones';
      });
      break;
  }
}

window.addEventListener('hashchange', async () => {
  state.currentHash = window.location.hash;
  const destination = parseHash(state.currentHash);
  const businessId = getBusinessIdFromHash(state.currentHash);
  const isSources = isSourcesView(state.currentHash);

  if (destination === 'conversaciones') {
    // Extraer conversationId del hash si es detalle
    const match = state.currentHash.match(/^#\/conversaciones\/([^/]+)$/);
    const conversationId = match ? match[1] : null;

    if (conversationId && conversationId !== state.currentConversationId) {
      // Cargar detalle de conversación
      await loadConversationDetail(conversationId);
    } else if (!conversationId && state.currentConversationId) {
      // Volver a la lista
      state.currentConversationId = null;
      state.currentConversation = null;
      state.messages = [];
    }
    // Limpiar estado de negocios al ir a conversaciones
    state.currentBusinessId = null;
    state.currentBusiness = null;
    state.businessNumbers = [];
    state.businessSources = [];
  } else if (destination === 'negocios') {
    if (businessId && businessId !== state.currentBusinessId) {
      // Cambio de negocio: cargar datos del nuevo negocio
      await loadBusinessData(businessId, isSources);
    } else if (!businessId && state.currentBusinessId) {
      // Volver a lista de negocios
      state.currentBusinessId = null;
      state.currentBusiness = null;
      state.businessNumbers = [];
      state.businessSources = [];
    } else if (businessId && isSources !== (state.businessSources.length > 0 || state.currentBusinessId)) {
      // Cambio entre detalle y fuentes del mismo negocio
      if (isSources) {
        await loadBusinessSources(businessId);
      } else {
        // Ir de fuentes a detalle: ya tenemos los datos, solo renderizar
        state.currentBusinessId = businessId;
      }
    }
  } else {
    // Otras pantallas (ajustes): limpiar todo
    state.currentConversationId = null;
    state.currentConversation = null;
    state.messages = [];
    state.currentBusinessId = null;
    state.currentBusiness = null;
    state.businessNumbers = [];
    state.businessSources = [];
  }

  renderAll();
});

async function loadConversationDetail(conversationId) {
  state.currentConversationId = conversationId;
  state.currentConversation = await service.getConversation(conversationId);
  state.messages = await service.listMessages(conversationId);
  // No renderizar aquí; hashchange disparará renderAll
}

async function loadBusinessData(businessId, loadSources = false) {
  state.currentBusinessId = businessId;
  state.currentBusiness = await service.listBusinesses().then(bizs => bizs.find(b => b.id === businessId)) || null;
  if (!state.currentBusiness) {
    // Fallback: buscar en businessColors
    const bizColor = state.businessColors[businessId];
    if (bizColor) {
      state.currentBusiness = { id: businessId, name: bizColor.name, color: bizColor.color };
    }
  }
  state.businessNumbers = await service.listNumbers(businessId);
  if (loadSources) {
    await loadBusinessSources(businessId);
  }
}

async function loadBusinessSources(businessId) {
  state.businessSources = await service.listSources(businessId);
}

// ===== Manejadores de modales de negocio =====
async function handleBusinessCreate(data) {
  // El mockService no tiene addBusiness, creamos el negocio localmente
  // Generar ID único
  const existingIds = Object.keys(state.businessColors);
  let newId = 1;
  while (existingIds.includes(`biz-${newId}`)) {
    newId++;
  }
  const newBizId = `biz-${newId}`;

  const newBiz = {
    id: newBizId,
    name: data.name,
    color: data.color,
  };

  // Agregar al estado local
  state.businessColors[newBizId] = {
    name: newBiz.name,
    color: newBiz.color,
    numbers: [],
  };

  // Recargar lista de negocios
  renderScreen(state);
}

async function handleBusinessEdit(businessId, data) {
  await service.updateBusiness(businessId, data);
  // Actualizar estado local
  if (state.businessColors[businessId]) {
    state.businessColors[businessId].name = data.name;
    state.businessColors[businessId].color = data.color;
  }
  if (state.currentBusiness && state.currentBusiness.id === businessId) {
    state.currentBusiness.name = data.name;
    state.currentBusiness.color = data.color;
  }
  renderScreen(state);
}

async function handleNumberCreate(businessId, data) {
  await service.addNumber(businessId, data);
  // Recargar números
  state.businessNumbers = await service.listNumbers(businessId);
  // Actualizar businessColors
  if (state.businessColors[businessId]) {
    state.businessColors[businessId].numbers = state.businessNumbers.map(n => ({
      id: n.id,
      displayName: n.displayName,
      e164: n.e164,
    }));
  }
  renderScreen(state);
}

async function handleNumberEdit(numberId, businessId, data) {
  await service.updateNumber(numberId, data);
  // Recargar números
  state.businessNumbers = await service.listNumbers(businessId);
  if (state.businessColors[businessId]) {
    state.businessColors[businessId].numbers = state.businessNumbers.map(n => ({
      id: n.id,
      displayName: n.displayName,
      e164: n.e164,
    }));
  }
  renderScreen(state);
}

async function handleNumberDelete(numberId, businessId) {
  await service.deleteNumber(numberId);
  // Recargar números
  state.businessNumbers = await service.listNumbers(businessId);
  if (state.businessColors[businessId]) {
    state.businessColors[businessId].numbers = state.businessNumbers.map(n => ({
      id: n.id,
      displayName: n.displayName,
      e164: n.e164,
    }));
  }
  renderScreen(state);
}

// Listeners para eventos de modales
window.addEventListener('business:create', async (e) => {
  const existingNames = Object.values(state.businessColors).map(b => b.name);
  openBusinessModal({
    existingNames,
    onSubmit: handleBusinessCreate,
  });
});

window.addEventListener('business:edit', async (e) => {
  const { businessId } = e.detail;
  const existingNames = Object.values(state.businessColors).map(b => b.name);
  openBusinessModal({
    business: { id: businessId, ...state.businessColors[businessId] },
    existingNames,
    onSubmit: (data) => handleBusinessEdit(businessId, data),
  });
});

window.addEventListener('number:create', async (e) => {
  const { businessId } = e.detail;
  openNumberModal({
    businessId,
    onSubmit: (data) => handleNumberCreate(businessId, data),
  });
});

window.addEventListener('number:edit', async (e) => {
  const { numberId, businessId } = e.detail;
  openNumberModal({
    businessId,
    number: state.businessNumbers.find(n => n.id === numberId),
    onSubmit: (data) => handleNumberEdit(numberId, businessId, data),
  });
});

window.addEventListener('number:delete', async (e) => {
  const { numberId, businessId } = e.detail;
  if (confirm('¿Eliminar este número?')) {
    await handleNumberDelete(numberId, businessId);
  }
});

// ===== Manejadores de fuentes =====
window.addEventListener('source:create', async (e) => {
  const { businessId } = e.detail;
  openSourceModal({
    businessId,
    onSubmit: (data) => handleSourceCreate(businessId, data),
  });
});

window.addEventListener('source:edit', async (e) => {
  const { sourceId, businessId } = e.detail;
  const source = state.businessSources.find(s => s.id === sourceId);
  openSourceModal({
    businessId,
    source,
    onSubmit: (data) => handleSourceEdit(sourceId, businessId, data),
  });
});

window.addEventListener('source:delete', async (e) => {
  const { sourceId, businessId } = e.detail;
  if (confirm('¿Eliminar esta fuente?')) {
    await handleSourceDelete(sourceId, businessId);
  }
});

window.addEventListener('source:toggle', async (e) => {
  const { sourceId, businessId, enabled } = e.detail;
  await handleSourceToggle(sourceId, businessId, enabled);
});

async function handleTakeConversation(conversationId) {
  const conversation = await service.takeConversation(conversationId);
  if (conversation) {
    state.currentConversation = conversation;
    // Recargar mensajes para incluir el evento de sistema
    state.messages = await service.listMessages(conversationId);
    renderScreen(state);
  }
}

async function handleReturnToBot(conversationId) {
  const conversation = await service.returnToBot(conversationId);
  if (conversation) {
    state.currentConversation = conversation;
    // Recargar mensajes para incluir el evento de sistema
    state.messages = await service.listMessages(conversationId);
    renderScreen(state);
  }
}

async function handleSendMessage(conversationId) {
  const textarea = document.querySelector('.composer__textarea');
  if (!textarea) return;

  const text = textarea.value.trim();
  const validation = validateMessageText(text);
  if (!validation.valid) {
    // Mostrar error (simple: alert por ahora)
    alert(validation.error);
    return;
  }

  textarea.value = '';
  textarea.style.height = 'auto';

  const message = await service.sendMessage(conversationId, text);
  if (message) {
    state.messages = [...state.messages, message];
    // NO actualizar lastCustomerMessageAt - ese campo solo cambia cuando el cliente escribe
    // La ventana de 24h se basa en el último mensaje del cliente, no del asesor
    renderScreen(state);
  }
}

async function handleSourceDelete(sourceId, businessId) {
  await service.deleteSource(sourceId);
  // Recargar fuentes
  state.businessSources = await service.listSources(businessId);
  renderScreen(state);
}

async function handleSourceToggle(sourceId, businessId, enabled) {
  await service.toggleSource(sourceId, enabled);
  // Recargar fuentes
  state.businessSources = await service.listSources(businessId);
  renderScreen(state);
}

async function handleSourceCreate(businessId, data) {
  await service.addSource(businessId, data);
  // Recargar fuentes
  state.businessSources = await service.listSources(businessId);
  renderScreen(state);
}

async function handleSourceEdit(sourceId, businessId, data) {
  await service.updateSource(sourceId, data);
  // Recargar fuentes
  state.businessSources = await service.listSources(businessId);
  renderScreen(state);
}

init();
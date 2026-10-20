import { formatMessageTime, groupMessagesByDate, isSystemMessage, getMessageBubbleClass } from '../domain/messages.js';
import { getWindowChip } from '../domain/window.js';
import { canSend } from '../domain/attention.js';
import { buildWhatsAppLink } from '../domain/phone.js';

/**
 * Renderiza el detalle completo de una conversación.
 * @param {Object} state - Estado actual con currentConversation, messages, businessColors
 * @returns {HTMLElement} Sección de detalle
 */
function renderConversationDetail(state) {
  const { currentConversation, messages, businessColors } = state;

  const section = document.createElement('section');
  section.id = 'conversation-detail';
  section.className = 'screen screen--detail conversation-detail';

  if (!currentConversation) {
    const placeholder = document.createElement('div');
    placeholder.className = 'conversation-detail__placeholder';
    placeholder.textContent = 'Selecciona una conversación';
    section.appendChild(placeholder);
    return section;
  }

  // Header
  section.appendChild(renderConversationHeader(currentConversation, businessColors));

  // Interruptor de atención
  section.appendChild(renderAttentionSwitch(currentConversation));

  // Banner ventana 24h
  section.appendChild(renderWindowBanner(currentConversation));

  // Temporizadores
  section.appendChild(renderTimers(currentConversation));

  // Hilo de mensajes
  section.appendChild(renderMessageThread(messages, currentConversation));

  // Compositor
  section.appendChild(renderComposer(currentConversation));

  // Panel lateral (en móvil se muestra como accordion/pestaña)
  const sidePanel = renderSidePanel(currentConversation, businessColors);
  sidePanel.id = 'side-panel';
  section.appendChild(sidePanel);

  return section;
}

/**
 * Renderiza el encabezado de la conversación.
 * @param {Object} conversation
 * @param {Object} businessColors
 * @returns {HTMLElement}
 */
function renderConversationHeader(conversation, businessColors) {
  const header = document.createElement('header');
  header.className = 'conversation-header';

  // Información principal
  const info = document.createElement('div');
  info.className = 'conversation-header__info';

  // Nombre del cliente
  const name = document.createElement('h1');
  name.className = 'conversation-header__name';
  name.textContent = conversation.customerName || 'Sin nombre';
  info.appendChild(name);

  // Teléfono + wa.me + negocio
  const meta = document.createElement('div');
  meta.className = 'conversation-header__meta';

  // Teléfono completo (no enmascarado en detalle)
  const phone = document.createElement('span');
  phone.className = 'conversation-header__phone';
  phone.textContent = conversation.customerPhone;
  meta.appendChild(phone);

  // Botón wa.me
  const waLink = buildWhatsAppLink(conversation.customerPhone);
  if (waLink) {
    const waBtn = document.createElement('a');
    waBtn.className = 'conversation-header__wa-btn';
    waBtn.href = waLink;
    waBtn.target = '_blank';
    waBtn.rel = 'noopener noreferrer';
    waBtn.setAttribute('aria-label', `Abrir chat con ${conversation.customerName || conversation.customerPhone} en WhatsApp`);
    waBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004c-1.453 0-2.883-.907-3.336-1.727-.453-.818-.694-1.617-.718-1.734-.024-.117-.167-.272-.395-.42-.23-.147-.562-.412-.87-.782-.31-.37-.578-.823-.635-1.018-.06-.195.084-.385.27-.474.207-.099.518-.245.832-.443.288-.181.57-.385.85-.702.28-.325.524-.696.58-.947.057-.25.187-.507.273-.68.04-.075.183-.15.407-.24.224-.09.536-.19.73-.19h.034c.375 0 .76.013 1.116.074.356.06.69.2 1.007.372.317.173.6.395.85.672.25.277.425.62.49.887.065.268.088.49.065.658-.023.168-.176.314-.43.48-.253.166-.604.36-.866.504-.262.145-.57.27-.91.413-.339.143-.708.262-1.048.35-.34.087-.71.143-1.09.143h-.003zm0 0" />
      </svg>
      <span>WhatsApp</span>
    `;
    meta.appendChild(waBtn);
  }

  // Negocio con badge
  const bizInfo = businessColors?.[conversation.businessId];
  if (bizInfo) {
    const biz = document.createElement('span');
    biz.className = 'conversation-header__business';
    const badge = document.createElement('span');
    badge.className = 'business-badge';
    badge.style.setProperty('--biz-color', bizInfo.color);
    badge.textContent = bizInfo.name.charAt(0);
    biz.appendChild(badge);
    biz.appendChild(document.createTextNode(` ${bizInfo.name}`));
    meta.appendChild(biz);
  }

  info.appendChild(meta);
  header.appendChild(info);

  // Acciones: toggle panel lateral (móvil) + menú
  const actions = document.createElement('div');
  actions.className = 'conversation-header__actions';

  // Botón toggle panel lateral (solo móvil)
  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.className = 'conversation-header__toggle-btn';
  toggleBtn.setAttribute('aria-label', 'Ver detalles de la conversación');
  toggleBtn.setAttribute('aria-expanded', 'false');
  toggleBtn.setAttribute('aria-controls', 'side-panel');
  toggleBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 21h16"></path><path d="M4 12h16"></path><path d="M4 3h16"></path></svg>';
  actions.appendChild(toggleBtn);

  // Menú de acciones (placeholder)
  const menuBtn = document.createElement('button');
  menuBtn.className = 'conversation-header__menu-btn';
  menuBtn.setAttribute('aria-label', 'Más acciones');
  menuBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>';
  actions.appendChild(menuBtn);
  header.appendChild(actions);

  // Manejar toggle del panel lateral en móvil
  toggleBtn.addEventListener('click', () => {
    const sidePanel = document.getElementById('side-panel');
    if (sidePanel) {
      const isOpen = sidePanel.classList.toggle('side-panel--open');
      toggleBtn.setAttribute('aria-expanded', isOpen.toString());
    }
  });

  return header;
}

/**
 * Renderiza el interruptor de atención (Tomar / Devolver al bot).
 * @param {Object} conversation
 * @returns {HTMLElement}
 */
function renderAttentionSwitch(conversation) {
  const div = document.createElement('div');
  div.className = 'attention-switch';

  const isHuman = conversation.handler === 'human';
  const isWaiting = conversation.handler === 'waiting_human';
  const isBot = conversation.handler === 'bot';

  if (isHuman) {
    // Botón "Devolver al bot" con confirmación
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn--secondary attention-switch__return';
    btn.dataset.action = 'open-return-dialog';
    btn.textContent = 'Devolver al bot';
    div.appendChild(btn);

    // Dialog de confirmación nativo
    const dialog = document.createElement('dialog');
    dialog.className = 'attention-switch__confirm-dialog';
    dialog.innerHTML = `
      <form method="dialog">
        <h2>Devolver al bot</h2>
        <p>La conversación volverá a ser atendida por el bot. ¿Confirmas?</p>
        <div class="dialog-actions">
          <button value="cancel" class="btn btn--secondary">Cancelar</button>
          <button value="confirm" class="btn btn--danger" data-action="return-to-bot">Devolver</button>
        </div>
      </form>
    `;
    div.appendChild(dialog);

    // Abrir dialog al click
    btn.addEventListener('click', () => {
      dialog.showModal();
    });

    // Manejar cierre del dialog
    dialog.addEventListener('close', () => {
      // El botón con data-action="return-to-bot" dentro del form method="dialog"
      // ya maneja la acción via delegación en app.js
    });
  } else if (isWaiting || isBot) {
    // Botón primario "Tomar conversación"
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn--primary attention-switch__take';
    btn.dataset.action = 'take-conversation';
    btn.textContent = isWaiting ? 'Tomar conversación' : 'Tomar conversación';
    div.appendChild(btn);
  }

  return div;
}

/**
 * Renderiza el banner de ventana 24h.
 * @param {Object} conversation
 * @returns {HTMLElement}
 */
function renderWindowBanner(conversation) {
  const now = new Date();
  const { label, status } = getWindowChip(conversation.lastCustomerMessageAt, now);

  const div = document.createElement('div');
  div.className = `window-banner window-banner--${status}`;

  const content = document.createElement('div');
  content.className = 'window-banner__content';

  const icon = document.createElement('span');
  icon.className = 'window-banner__icon';
  icon.setAttribute('aria-hidden', 'true');
  // Iconos según estado
  if (status === 'closed') {
    icon.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
  } else if (status === 'urgent') {
    icon.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>';
  } else if (status === 'warning') {
    icon.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
  } else {
    icon.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
  }
  content.appendChild(icon);

  const text = document.createElement('span');
  text.className = 'window-banner__text';
  text.textContent = label;
  content.appendChild(text);

  div.appendChild(content);

  // Si ventana cerrada, agregar botón wa.me
  if (status === 'closed') {
    const waLink = buildWhatsAppLink(conversation.customerPhone);
    if (waLink) {
      const waBtn = document.createElement('a');
      waBtn.className = 'btn btn--primary window-banner__wa-btn';
      waBtn.href = waLink;
      waBtn.target = '_blank';
      waBtn.rel = 'noopener noreferrer';
      waBtn.textContent = 'Abrir en WhatsApp';
      div.appendChild(waBtn);
    }
  }

  return div;
}

/**
 * Renderiza los temporizadores visibles.
 * @param {Object} conversation
 * @returns {HTMLElement}
 */
function renderTimers(conversation) {
  const timers = [];
  const now = new Date();

  // Esperando asesor
  if (conversation.waitingSince) {
    const waitingMs = now - new Date(conversation.waitingSince);
    const waitingMins = Math.floor(waitingMs / 60000);
    if (waitingMins >= 0) {
      timers.push({
        label: `Esperando asesor hace ${waitingMins} min`,
        variant: 'waiting',
      });
    }
  }

  // Sin respuesta
  if (conversation.lastUnansweredAt) {
    const unansweredMs = now - new Date(conversation.lastUnansweredAt);
    const unansweredMins = Math.floor(unansweredMs / 60000);
    if (unansweredMins >= 0) {
      timers.push({
        label: `Sin respuesta hace ${unansweredMins} min`,
        variant: 'unanswered',
      });
    }
  }

  // Vuelve al bot (solo si humano y ventana abierta)
  if (conversation.handler === 'human' && conversation.windowExpiresAt) {
    const expiresMs = new Date(conversation.windowExpiresAt) - now;
    if (expiresMs > 0) {
      const hours = Math.floor(expiresMs / 3600000);
      const mins = Math.floor((expiresMs % 3600000) / 60000);
      let label;
      if (hours > 0) {
        label = `Vuelve al bot en ${hours}h ${mins}min`;
      } else {
        label = `Vuelve al bot en ${mins}min`;
      }
      timers.push({
        label,
        variant: 'return-bot',
      });
    }
  }

  if (timers.length === 0) {
    return document.createElement('div'); // empty
  }

  const div = document.createElement('div');
  div.className = 'conversation-timers';
  div.setAttribute('role', 'status');
  div.setAttribute('aria-live', 'polite');

  for (const timer of timers) {
    const chip = document.createElement('span');
    chip.className = `timer-chip timer-chip--${timer.variant}`;
    chip.textContent = timer.label;
    div.appendChild(chip);
  }

  return div;
}

/**
 * Renderiza el hilo de mensajes.
 * @param {Object[]} messages
 * @param {Object} conversation
 * @returns {HTMLElement}
 */
function renderMessageThread(messages, conversation) {
  const div = document.createElement('div');
  div.className = 'message-thread';
  div.setAttribute('role', 'log');
  div.setAttribute('aria-live', 'polite');
  div.setAttribute('aria-label', 'Historial de mensajes');

  if (!messages || messages.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'message-thread__empty';
    empty.textContent = 'Sin mensajes';
    div.appendChild(empty);
    return div;
  }

  // Agrupar por fecha
  const groups = groupMessagesByDate(messages, new Date());

  for (const [dateLabel, groupMessages] of groups) {
    // Separador de fecha
    const separator = document.createElement('div');
    separator.className = 'message-thread__date-separator';
    separator.setAttribute('aria-hidden', 'true');
    separator.innerHTML = `<span>${dateLabel}</span>`;
    div.appendChild(separator);

    // Mensajes del grupo
    for (const message of groupMessages) {
      div.appendChild(renderMessageBubble(message, conversation));
    }
  }

  return div;
}

/**
 * Renderiza una burbuja de mensaje individual.
 * @param {Object} message
 * @param {Object} conversation
 * @returns {HTMLElement}
 */
function renderMessageBubble(message, conversation) {
  const isSystem = isSystemMessage(message);
  const bubbleClass = getMessageBubbleClass(message);

  const wrapper = document.createElement('div');
  wrapper.className = `message-wrapper ${isSystem ? 'message-wrapper--system' : ''}`;

  const bubble = document.createElement('div');
  bubble.className = `message-bubble ${bubbleClass}`;

  // Contenido del mensaje
  if (isSystem) {
    // Mensaje de sistema: texto centrado, sin burbuja tradicional
    bubble.textContent = message.body;
  } else {
    // Mensaje normal
    const text = document.createElement('div');
    text.className = 'message-bubble__text';
    text.textContent = message.body;
    bubble.appendChild(text);

    // Metadatos: hora + estado entrega
    const meta = document.createElement('div');
    meta.className = 'message-bubble__meta';

    const time = document.createElement('time');
    time.className = 'message-bubble__time';
    time.dateTime = message.createdAt;
    time.textContent = formatMessageTime(message.createdAt);
    meta.appendChild(time);

    // Estado de entrega (solo bot/human)
    if (message.deliveryStatus && (message.author === 'bot' || message.author === 'human')) {
      const status = document.createElement('span');
      status.className = `message-bubble__status message-bubble__status--${message.deliveryStatus}`;
      status.setAttribute('aria-label', `Estado: ${getDeliveryStatusLabel(message.deliveryStatus)}`);
      status.innerHTML = getDeliveryStatusIcon(message.deliveryStatus);
      meta.appendChild(status);
    }

    bubble.appendChild(meta);
  }

  wrapper.appendChild(bubble);
  return wrapper;
}

/**
 * Etiqueta legible para estado de entrega.
 * @param {string} status
 * @returns {string}
 */
function getDeliveryStatusLabel(status) {
  const labels = {
    sent: 'Enviado',
    delivered: 'Entregado',
    read: 'Leído',
  };
  return labels[status] || status;
}

/**
 * Icono SVG para estado de entrega.
 * @param {string} status
 * @returns {string}
 */
function getDeliveryStatusIcon(status) {
  switch (status) {
    case 'sent':
      return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>';
    case 'delivered':
      return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 6 12 12 6 18"></polyline><polyline points="18 18 12 12 6 6"></polyline></svg>';
    case 'read':
      return '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 11.5c.64 1.52 1.77 2.83 3.26 3.81 1.03.71 2.3 1.13 3.74 1.13s2.71-.42 3.74-1.13c1.49-.98 2.62-2.29 3.26-3.81C21.27 7.61 17 4.5 12 4.5zm0 1.5c1.38 0 2.64.56 3.54 1.46.96.95 1.57 2.21 1.57 3.54 0 1.33-.61 2.59-1.57 3.54-.9.9-2.16 1.46-3.54 1.46-1.38 0-2.64-.56-3.54-1.46-.95-.96-1.57-2.21-1.57-3.54 0-1.33.61-2.59 1.57-3.54.9-.9 2.16-1.46 3.54-1.46z"/></svg>';
    default:
      return '';
  }
}

/**
 * Renderiza el compositor de mensajes.
 * @param {Object} conversation
 * @returns {HTMLElement}
 */
function renderComposer(conversation) {
  const div = document.createElement('div');
  div.className = 'composer';

  const now = new Date();
  const { allowed, reason } = canSend(conversation.handler, getWindowChip(conversation.lastCustomerMessageAt, now).status);

  if (!allowed) {
    // Botón "Tomar conversación" si no es humano o ventana cerrada
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn--primary composer__take-btn';
    btn.dataset.action = 'take-conversation';
    btn.textContent = reason || 'Tomar conversación para responder';
    div.appendChild(btn);
    return div;
  }

  // Área de composición completa
  const form = document.createElement('form');
  form.className = 'composer__form';
  form.addEventListener('submit', (e) => e.preventDefault());

  const textarea = document.createElement('textarea');
  textarea.className = 'composer__textarea';
  textarea.placeholder = 'Escribe un mensaje... (Enter=Enviar, Shift+Enter=Nueva línea)';
  textarea.setAttribute('aria-label', 'Mensaje a enviar');
  textarea.rows = 1;
  form.appendChild(textarea);

  const actions = document.createElement('div');
  actions.className = 'composer__actions';

  const sendBtn = document.createElement('button');
  sendBtn.type = 'button';
  sendBtn.className = 'btn btn--primary composer__send-btn';
  sendBtn.dataset.action = 'send-message';
  sendBtn.textContent = 'Enviar';
  actions.appendChild(sendBtn);

  form.appendChild(actions);
  div.appendChild(form);

  return div;
}

/**
 * Renderiza el panel lateral con información de la conversación.
 * @param {Object} conversation
 * @param {Object} businessColors
 * @returns {HTMLElement}
 */
function renderSidePanel(conversation, businessColors) {
  const aside = document.createElement('aside');
  aside.className = 'side-panel';
  aside.setAttribute('role', 'complementary');
  aside.setAttribute('aria-label', 'Detalles de la conversación');

  // Nombre del cliente (editable)
  const nameSection = document.createElement('div');
  nameSection.className = 'side-panel__section';
  const nameLabel = document.createElement('label');
  nameLabel.className = 'side-panel__label';
  nameLabel.textContent = 'Nombre';
  nameLabel.setAttribute('for', 'side-panel-name');
  nameSection.appendChild(nameLabel);

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.id = 'side-panel-name';
  nameInput.className = 'side-panel__input';
  nameInput.value = conversation.customerName || '';
  nameInput.setAttribute('aria-label', 'Nombre del cliente');
  nameSection.appendChild(nameInput);
  aside.appendChild(nameSection);

  // Teléfono
  const phoneSection = document.createElement('div');
  phoneSection.className = 'side-panel__section';
  const phoneLabel = document.createElement('label');
  phoneLabel.className = 'side-panel__label';
  phoneLabel.textContent = 'Teléfono';
  phoneSection.appendChild(phoneLabel);

  const phoneValue = document.createElement('div');
  phoneValue.className = 'side-panel__value';
  phoneValue.textContent = conversation.customerPhone;
  phoneSection.appendChild(phoneValue);
  aside.appendChild(phoneSection);

  // Negocio
  const bizInfo = businessColors?.[conversation.businessId];
  if (bizInfo) {
    const bizSection = document.createElement('div');
    bizSection.className = 'side-panel__section';
    const bizLabel = document.createElement('label');
    bizLabel.className = 'side-panel__label';
    bizLabel.textContent = 'Negocio';
    bizSection.appendChild(bizLabel);

    const bizValue = document.createElement('div');
    bizValue.className = 'side-panel__value';
    const badge = document.createElement('span');
    badge.className = 'business-badge';
    badge.style.setProperty('--biz-color', bizInfo.color);
    badge.textContent = bizInfo.name.charAt(0);
    bizValue.appendChild(badge);
    bizValue.appendChild(document.createTextNode(` ${bizInfo.name}`));
    bizSection.appendChild(bizValue);
    aside.appendChild(bizSection);
  }

  // Motivo de handoff
  if (conversation.handoffReason) {
    const reasonSection = document.createElement('div');
    reasonSection.className = 'side-panel__section';
    const reasonLabel = document.createElement('label');
    reasonLabel.className = 'side-panel__label';
    reasonLabel.textContent = 'Motivo de handoff';
    reasonSection.appendChild(reasonLabel);

    const reasonValue = document.createElement('div');
    reasonValue.className = 'side-panel__value';
    reasonValue.textContent = getHandoffReasonLabel(conversation.handoffReason);
    reasonSection.appendChild(reasonValue);
    aside.appendChild(reasonSection);
  }

  // Tags
  if (conversation.tags && conversation.tags.length > 0) {
    const tagsSection = document.createElement('div');
    tagsSection.className = 'side-panel__section';
    const tagsLabel = document.createElement('label');
    tagsLabel.className = 'side-panel__label';
    tagsLabel.textContent = 'Etiquetas';
    tagsSection.appendChild(tagsLabel);

    const tagsContainer = document.createElement('div');
    tagsContainer.className = 'side-panel__tags';
    for (const tag of conversation.tags) {
      const tagEl = document.createElement('span');
      tagEl.className = 'tag-chip';
      tagEl.textContent = tag;
      tagsContainer.appendChild(tagEl);
    }
    tagsSection.appendChild(tagsContainer);
    aside.appendChild(tagsSection);
  }

  // Notas
  const notesSection = document.createElement('div');
  notesSection.className = 'side-panel__section';
  const notesLabel = document.createElement('label');
  notesLabel.className = 'side-panel__label';
  notesLabel.textContent = 'Notas';
  notesLabel.setAttribute('for', 'side-panel-notes');
  notesSection.appendChild(notesLabel);

  const notesTextarea = document.createElement('textarea');
  notesTextarea.id = 'side-panel-notes';
  notesTextarea.className = 'side-panel__textarea';
  notesTextarea.placeholder = 'Notas internas...';
  notesTextarea.value = conversation.notes || '';
  notesTextarea.setAttribute('aria-label', 'Notas internas');
  notesTextarea.rows = 3;
  notesSection.appendChild(notesTextarea);
  aside.appendChild(notesSection);

  // Resumen
  if (conversation.summary) {
    const summarySection = document.createElement('div');
    summarySection.className = 'side-panel__section';
    const summaryLabel = document.createElement('label');
    summaryLabel.className = 'side-panel__label';
    summaryLabel.textContent = 'Resumen';
    summarySection.appendChild(summaryLabel);

    const summaryValue = document.createElement('div');
    summaryValue.className = 'side-panel__value side-panel__value--summary';
    summaryValue.textContent = conversation.summary;
    summarySection.appendChild(summaryValue);
    aside.appendChild(summarySection);
  }

  return aside;
}

/**
 * Etiqueta legible para motivo de handoff.
 * @param {string} reason
 * @returns {string}
 */
function getHandoffReasonLabel(reason) {
  const labels = {
    'bot_timeout': 'Bot sin respuesta',
    'customer_request': 'Cliente pidió asesor',
    'complex_query': 'Consulta compleja',
    'escalation': 'Escalación',
    'human_intervention': 'Intervención humana',
  };
  return labels[reason] || reason;
}

export { renderConversationDetail, renderComposer, renderSidePanel };
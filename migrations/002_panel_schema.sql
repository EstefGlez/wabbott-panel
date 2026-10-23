-- =====================================================================
-- 002_panel_schema.sql
-- Esquema del panel (spec 009). ADITIVA: no borra ni renombra nada.
-- Idempotente: se puede correr más de una vez. Los rellenos de datos se hacen
-- una sola vez, registrados en schema_migrations.
--
-- PRIMERO en el proyecto de PRUEBAS de Supabase. Luego en producción.
-- Requiere haber corrido 001_hardening_bot.sql.
--
-- Qué NO hace a propósito:
--  * No pone handler='waiting_human' cuando el bot marca handoff. Eso lo hará
--    el código del bot (spec 012), de forma explícita y auditable.
--  * No quita el índice único (business_id, customer_phone) de 001. Se quita
--    cuando el bot enrute por número (spec 012).
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 0) Control de migraciones
-- ---------------------------------------------------------------------
create table if not exists schema_migrations (
  version    text primary key,
  applied_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 1) Tipos (enums) que coinciden con src/domain/contract.js
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'conversation_handler') then
    create type conversation_handler as enum ('bot', 'waiting_human', 'human');
  end if;
  if not exists (select 1 from pg_type where typname = 'handoff_reason') then
    create type handoff_reason as enum ('venta', 'envio', 'queja', 'devolucion', 'medico', 'otro');
  end if;
  if not exists (select 1 from pg_type where typname = 'message_author') then
    create type message_author as enum ('customer', 'bot', 'human', 'system');
  end if;
  if not exists (select 1 from pg_type where typname = 'message_type') then
    create type message_type as enum ('text', 'image', 'audio', 'button', 'system_event');
  end if;
  if not exists (select 1 from pg_type where typname = 'delivery_status') then
    create type delivery_status as enum ('queued', 'sent', 'delivered', 'read', 'failed');
  end if;
  if not exists (select 1 from pg_type where typname = 'source_kind') then
    create type source_kind as enum ('url', 'pdf', 'md', 'txt', 'text');
  end if;
  if not exists (select 1 from pg_type where typname = 'source_status') then
    create type source_status as enum ('ready', 'processing', 'error');
  end if;
  if not exists (select 1 from pg_type where typname = 'member_role') then
    create type member_role as enum ('owner', 'admin', 'agent');
  end if;
end
$$;

-- ---------------------------------------------------------------------
-- 2) Usuarios y pertenencia a negocios
-- ---------------------------------------------------------------------
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text not null check (char_length(full_name) between 1 and 100),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3) Negocios: color, archivado y unicidad de nombre
-- ---------------------------------------------------------------------
alter table businesses add column if not exists color text;
alter table businesses add column if not exists archived_at timestamptz;

create table if not exists business_members (
  business_id uuid not null references businesses(id) on delete restrict,
  user_id     uuid not null references profiles(id) on delete cascade,
  role        member_role not null default 'agent',
  created_at  timestamptz not null default now(),
  primary key (business_id, user_id)
);
create index if not exists idx_business_members_user on business_members (user_id);

-- ---------------------------------------------------------------------
-- 4) Números de WhatsApp (varios por negocio)
-- ---------------------------------------------------------------------
create table if not exists phone_numbers (
  id                       uuid primary key default gen_random_uuid(),
  business_id              uuid not null references businesses(id) on delete restrict,
  display_name             text not null check (char_length(display_name) between 1 and 50),
  phone_digits             text check (phone_digits ~ '^[0-9]{10,15}$'),  -- solo dígitos, sin "+"
  whatsapp_phone_number_id text not null unique,
  waba_id                  text,
  access_token_enc         text,   -- AES-256-GCM en la aplicación. Nunca en claro.
  status                   text not null default 'connected'
                           check (status in ('connected', 'disconnected')),
  archived_at              timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index if not exists idx_phone_numbers_business on phone_numbers (business_id);

-- ---------------------------------------------------------------------
-- 5) Conversaciones: atención, ventana y datos de CRM
-- ---------------------------------------------------------------------
alter table conversations add column if not exists phone_number_id uuid references phone_numbers(id) on delete restrict;
alter table conversations add column if not exists customer_name text
  check (customer_name is null or char_length(customer_name) <= 100);
alter table conversations add column if not exists handler conversation_handler not null default 'bot';
alter table conversations add column if not exists handoff_reason handoff_reason;
alter table conversations add column if not exists assigned_to uuid references profiles(id) on delete set null;
alter table conversations add column if not exists last_customer_message_at timestamptz;
alter table conversations add column if not exists last_message_at timestamptz;
alter table conversations add column if not exists waiting_since timestamptz;
alter table conversations add column if not exists last_unanswered_at timestamptz;
alter table conversations add column if not exists unread_count integer not null default 0
  check (unread_count >= 0);
alter table conversations add column if not exists tags text[] not null default '{}'
  check (cardinality(tags) <= 10);
alter table conversations add column if not exists notes text not null default ''
  check (char_length(notes) <= 5000);
alter table conversations add column if not exists summary text;

-- Una conversación por cliente y número (solo cuando ya tiene número asignado).
create unique index if not exists uq_conversations_number_phone
  on conversations (phone_number_id, customer_phone)
  where phone_number_id is not null;

create index if not exists idx_conversations_list
  on conversations (business_id, last_customer_message_at desc);
create index if not exists idx_conversations_waiting
  on conversations (waiting_since) where handler = 'waiting_human';

-- ---------------------------------------------------------------------
-- 6) Mensajes: autor, tipo, entrega y eventos de sistema
-- ---------------------------------------------------------------------
alter table messages add column if not exists author message_author;
alter table messages add column if not exists type message_type not null default 'text';
alter table messages add column if not exists delivery_status delivery_status;
alter table messages add column if not exists event_code text;
alter table messages add column if not exists sender_user_id uuid references profiles(id) on delete set null;
alter table messages add column if not exists media jsonb;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'messages_event_code_check') then
    alter table messages add constraint messages_event_code_check
      check (
        (type = 'system_event') = (event_code is not null)
        and (event_code is null or event_code in (
          'taken', 'returned_to_bot', 'returned_auto_inactivity',
          'handoff_requested', 'followup_sent', 'window_reactivated'
        ))
      );
  end if;
  if not exists (select 1 from pg_constraint where conname = 'messages_body_length_check') then
    alter table messages add constraint messages_body_length_check
      check (body is null or char_length(body) <= 4096);
  end if;
end
$$;

-- ---------------------------------------------------------------------
-- 7) Fuentes de conocimiento (reemplazan al Google Doc, spec 014)
-- ---------------------------------------------------------------------
create table if not exists knowledge_sources (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete restrict,
  kind          source_kind not null,
  title         text not null check (char_length(title) between 1 and 200),
  origin        text not null check (char_length(origin) between 1 and 2048),
  status        source_status not null default 'processing',
  enabled       boolean not null default true,
  content_text  text,
  -- Tamaño calculado por la base desde el texto guardado, no declarado por el cliente.
  char_count    integer generated always as (char_length(coalesce(content_text, ''))) stored,
  error_message text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (kind <> 'url' or origin ~* '^https?://')
);
create index if not exists idx_knowledge_sources_business on knowledge_sources (business_id);

-- ---------------------------------------------------------------------
-- 8) Avisos por correo (por usuario)
-- ---------------------------------------------------------------------
create table if not exists notification_settings (
  user_id       uuid primary key references profiles(id) on delete cascade,
  email         text not null check (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  events        text[] not null default '{}'
                check (events <@ array['waiting_human', 'unanswered_15min', 'window_closing']),
  quiet_enabled boolean not null default false,
  quiet_from    time not null default '23:00',
  quiet_to      time not null default '08:00',
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 9) Registro de webhooks (solo metadatos, sin contenido de clientes)
-- ---------------------------------------------------------------------
create table if not exists webhook_events (
  id                uuid primary key default gen_random_uuid(),
  received_at       timestamptz not null default now(),
  signature_valid   boolean not null,
  source_ip         inet,
  phone_number_id   text,
  wa_message_ids    text[],
  body_sha256       text,
  processed_at      timestamptz,
  error_code        text
);
create index if not exists idx_webhook_events_received on webhook_events (received_at);

-- ---------------------------------------------------------------------
-- 10) Auditoría (solo inserción)
-- ---------------------------------------------------------------------
create table if not exists audit_log (
  id          bigserial primary key,
  business_id uuid,
  user_id     uuid,
  action      text not null,          -- 'login.success', 'handoff.take', ...
  ip          inet,
  user_agent  text,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists idx_audit_log_created on audit_log (created_at);

-- ---------------------------------------------------------------------
-- 11) Funciones y disparadores
-- ---------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end
$$;

create or replace function audit_log_immutable()
returns trigger language plpgsql set search_path = public as $$
begin
  raise exception 'audit_log es de solo inserción';
end
$$;

-- Si el bot crea una conversación sin phone_number_id, se completa cuando el
-- negocio tiene exactamente un número activo.
create or replace function conversations_fill_phone_number()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.phone_number_id is null and new.business_id is not null then
    select p.id into new.phone_number_id
    from phone_numbers p
    where p.business_id = new.business_id
      and p.archived_at is null
      and (select count(*) from phone_numbers x
           where x.business_id = new.business_id and x.archived_at is null) = 1;
  end if;
  return new;
end
$$;

-- El bot escribe solo "direction". Aquí se completa "author".
create or replace function messages_before_insert()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.author is null then
    new.author := case new.direction
      when 'inbound' then 'customer'::message_author
      else 'bot'::message_author
    end;
  end if;
  return new;
end
$$;

-- Mantiene la conversación al día: última actividad, ventana de 24 h y no leídos.
create or replace function messages_after_insert()
returns trigger language plpgsql set search_path = public as $$
begin
  update conversations
  set last_message_at = greatest(coalesce(last_message_at, new.created_at), new.created_at),
      last_customer_message_at = case
        when new.author = 'customer'
          then greatest(coalesce(last_customer_message_at, new.created_at), new.created_at)
        else last_customer_message_at
      end,
      unread_count = case
        when new.author = 'customer' then unread_count + 1
        else unread_count
      end
  where id = new.conversation_id;
  return new;
end
$$;

drop trigger if exists trg_phone_numbers_updated on phone_numbers;
create trigger trg_phone_numbers_updated before update on phone_numbers
  for each row execute function set_updated_at();

drop trigger if exists trg_knowledge_sources_updated on knowledge_sources;
create trigger trg_knowledge_sources_updated before update on knowledge_sources
  for each row execute function set_updated_at();

drop trigger if exists trg_notification_settings_updated on notification_settings;
create trigger trg_notification_settings_updated before update on notification_settings
  for each row execute function set_updated_at();

drop trigger if exists trg_conversations_fill_phone on conversations;
create trigger trg_conversations_fill_phone before insert on conversations
  for each row execute function conversations_fill_phone_number();

drop trigger if exists trg_messages_before_insert on messages;
create trigger trg_messages_before_insert before insert on messages
  for each row execute function messages_before_insert();

drop trigger if exists trg_messages_after_insert on messages;
create trigger trg_messages_after_insert after insert on messages
  for each row execute function messages_after_insert();

drop trigger if exists trg_audit_log_no_change on audit_log;
create trigger trg_audit_log_no_change before update or delete on audit_log
  for each row execute function audit_log_immutable();

drop trigger if exists trg_audit_log_no_truncate on audit_log;
create trigger trg_audit_log_no_truncate before truncate on audit_log
  for each statement execute function audit_log_immutable();

-- ---------------------------------------------------------------------
-- 12) Rellenos de datos (UNA sola vez)
-- ---------------------------------------------------------------------
do $$
begin
  if exists (select 1 from schema_migrations where version = '002') then
    raise notice '002 ya estaba aplicada: se omiten los rellenos de datos.';
    return;
  end if;

  -- Colores distintos para los negocios existentes (paleta de business.js).
  update businesses b
  set color = (array['#1d4ed8','#15803d','#c2410c','#9d174d',
                     '#6d28d9','#0d9488','#b45309','#be123c'])[((r.rn - 1) % 8) + 1]
  from (select id, row_number() over (order by created_at, id) as rn from businesses) r
  where r.id = b.id and b.color is null;

  -- Un número por cada negocio que ya tenía whatsapp_phone_number_id.
  -- phone_digits queda vacío: la base actual no lo guarda.
  insert into phone_numbers (business_id, display_name, whatsapp_phone_number_id)
  select id, 'Principal', whatsapp_phone_number_id
  from businesses
  where whatsapp_phone_number_id is not null
  on conflict (whatsapp_phone_number_id) do nothing;

  -- Enlaza conversaciones existentes con su número (solo si el negocio tiene uno).
  update conversations c
  set phone_number_id = p.id
  from phone_numbers p
  where c.phone_number_id is null
    and p.business_id = c.business_id
    and (select count(*) from phone_numbers x where x.business_id = c.business_id) = 1;

  -- Autor de los mensajes existentes, a partir de "direction".
  update messages
  set author = case direction when 'inbound' then 'customer'::message_author
                              else 'bot'::message_author end
  where author is null;

  -- Última actividad y ventana, a partir del historial.
  update conversations c
  set last_message_at = m.last_any,
      last_customer_message_at = m.last_inbound
  from (
    select conversation_id,
           max(created_at) as last_any,
           max(created_at) filter (where direction = 'inbound') as last_inbound
    from messages
    group by conversation_id
  ) m
  where m.conversation_id = c.id;

  -- Conversaciones que el bot ya había escalado.
  update conversations
  set handler = 'waiting_human'
  where current_stage = 'handoff' and handler = 'bot';

  insert into schema_migrations (version) values ('002');
end
$$;

-- Ya con los datos rellenados:
alter table businesses alter column color set default '#1d4ed8';
alter table businesses alter column color set not null;
alter table messages alter column author set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'businesses_color_check') then
    alter table businesses add constraint businesses_color_check
      check (color in ('#1d4ed8','#15803d','#c2410c','#9d174d',
                       '#6d28d9','#0d9488','#b45309','#be123c'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'businesses_name_length_check') then
    alter table businesses add constraint businesses_name_length_check
      check (char_length(name) between 1 and 100);
  end if;
end
$$;

-- Nombre de negocio único (sin importar mayúsculas) entre los no archivados.
create unique index if not exists uq_businesses_name_lower
  on businesses (lower(name)) where archived_at is null;

-- ---------------------------------------------------------------------
-- 13) Seguridad: RLS activo, sin políticas, sin permisos públicos
-- ---------------------------------------------------------------------
alter table schema_migrations      enable row level security;
alter table profiles               enable row level security;
alter table business_members       enable row level security;
alter table phone_numbers          enable row level security;
alter table knowledge_sources      enable row level security;
alter table notification_settings  enable row level security;
alter table webhook_events         enable row level security;
alter table audit_log              enable row level security;

revoke all on table
  schema_migrations, profiles, business_members, phone_numbers,
  knowledge_sources, notification_settings, webhook_events, audit_log
from anon, authenticated;

-- audit_log: ni el servidor puede editar o borrar lo ya escrito.
revoke update, delete, truncate on table audit_log from service_role;

revoke all on function
  set_updated_at(), audit_log_immutable(), conversations_fill_phone_number(),
  messages_before_insert(), messages_after_insert()
from public, anon, authenticated;

commit;

-- =====================================================================
-- VERIFICACIÓN (correr por separado después de aplicar)
-- =====================================================================
-- 1) Debe mostrar 002:
--    select * from schema_migrations;
-- 2) Todas deben tener rowsecurity = true:
--    select tablename, rowsecurity from pg_tables where schemaname = 'public' order by 1;
-- 3) Cada negocio con su color y su número:
--    select b.name, b.color, p.display_name, p.whatsapp_phone_number_id
--    from businesses b left join phone_numbers p on p.business_id = b.id;
-- 4) Conversaciones con ventana calculada:
--    select id, handler, current_stage, last_customer_message_at, phone_number_id
--    from conversations;
-- 5) Prueba de solo inserción (debe fallar con "solo inserción"):
--    insert into audit_log (action) values ('prueba');
--    update audit_log set action = 'x' where action = 'prueba';
-- =====================================================================

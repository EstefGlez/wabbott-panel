-- =====================================================================
-- 001_hardening_bot.sql
-- Parche mínimo para la base ACTUAL del bot (spec 008).
-- No cambia columnas ni datos. El bot sigue funcionando.
--
-- ORDEN: lo ideal es desplegar antes el código de la spec 008 (maneja la
-- violación de unicidad). Mientras solo haya tráfico de pruebas se puede correr
-- antes: el único riesgo es que dos primeros mensajes simultáneos de un cliente
-- nuevo hagan fallar al bot viejo. Con clientes reales, el código va primero.
--
-- PRE-CHEQUEO: corre estas tres consultas por separado ANTES. Cada una debe
-- devolver 0 filas. Si devuelve filas, hay duplicados que limpiar primero.
--
--   select business_id, customer_phone, count(*)
--   from conversations group by 1, 2 having count(*) > 1;
--
--   select conversation_id, count(*)
--   from leads where conversation_id is not null
--   group by 1 having count(*) > 1;
--
--   select whatsapp_phone_number_id, count(*)
--   from businesses where whatsapp_phone_number_id is not null
--   group by 1 having count(*) > 1;
-- =====================================================================

begin;

-- 1) Una conversación por cliente y negocio (evita la carrera de dos mensajes
--    simultáneos). Se crea el único y luego se quita el índice no único.
create unique index if not exists uq_conversations_business_phone
  on conversations (business_id, customer_phone);
drop index if exists idx_conversations_business_phone;

-- 2) Un solo lead por conversación.
create unique index if not exists uq_leads_conversation
  on leads (conversation_id);

-- 3) Un número de WhatsApp pertenece a un solo negocio.
create unique index if not exists uq_businesses_wa_phone_number_id
  on businesses (whatsapp_phone_number_id)
  where whatsapp_phone_number_id is not null;

-- 4) media_assets tenía la misma restricción única dos veces.
alter table media_assets
  drop constraint if exists media_assets_business_key_unique;

-- 5) Índice para purgar y consultar api_logs por fecha.
create index if not exists idx_api_logs_created_at
  on api_logs (created_at);

-- 6) Función de purga de registros antiguos (retención por defecto: 30 días).
--    Solo la puede ejecutar el servidor (service_role), no la API pública.
create or replace function purge_api_logs(keep_days integer default 30)
returns bigint
language plpgsql
set search_path = public
as $$
declare
  n bigint;
begin
  if keep_days < 1 then
    raise exception 'keep_days debe ser al menos 1';
  end if;
  delete from api_logs
  where created_at < now() - make_interval(days => keep_days);
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function purge_api_logs(integer) from public, anon, authenticated;

commit;

-- =====================================================================
-- OPCIONAL (recomendado, correr por separado y solo después de revisar):
-- quita permisos de la API pública sobre las tablas actuales. El bot usa la
-- secret key (service_role) y no se ve afectado. RLS ya los bloquea; esto es
-- una segunda capa.
--
-- OJO: tu workflow keep-supabase-awake.yml hace curl a /rest/v1/ con la llave
-- anónima. Después de correr esto, ejecútalo a mano desde GitHub Actions y
-- confirma que sigue dando "Supabase respondió". Si falla, cámbialo.
--
--   revoke all on all tables in schema public from anon, authenticated;
--   alter default privileges in schema public
--     revoke all on tables from anon, authenticated;
-- =====================================================================

-- Para purgar registros de más de 30 días (correr a mano por ahora):
--   select purge_api_logs(30);

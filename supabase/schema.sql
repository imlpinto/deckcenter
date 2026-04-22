-- ============================================================
-- Deckcenter MVP - Esquema PostgreSQL para Supabase
-- ============================================================

-- Habilitar extensiones
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLA: profiles
-- Extiende auth.users de Supabase con datos del usuario
-- ============================================================
create table public.profiles (
  id            uuid references auth.users on delete cascade primary key,
  full_name     text,
  whatsapp      text,                       -- Ej: "+573001234567"
  user_type     text check (user_type in ('buyer', 'seller', 'both')) default 'buyer',
  location      text,                       -- Ciudad/región
  avatar_url    text,
  store_name    text,                       -- Solo para vendedores (nombre de tienda/apodo)
  store_slug    text unique,                -- URL amigable: /vendedor/juan-cartas
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ============================================================
-- TABLA: tcg_cards
-- Caché local de datos traídos de la Pokemon TCG API
-- ============================================================
create table public.tcg_cards (
  id                  uuid default uuid_generate_v4() primary key,
  api_id              text unique not null,     -- ID de la Pokemon TCG API (ej: "base1-4")
  name                text not null,
  image_url_sm        text,                     -- Imagen pequeña (thumbnail)
  image_url_lg        text,                     -- Imagen grande (detalle)
  set_name            text,                     -- Ej: "Base Set"
  set_id              text,                     -- Ej: "base1"
  card_number         text,                     -- Ej: "4/102"
  rarity              text,                     -- Common, Uncommon, Rare, Holo Rare, etc.
  supertype           text,                     -- Pokémon, Trainer, Energy
  subtypes            text[],                   -- Stage 1, Stage 2, Basic, etc.
  types               text[],                   -- Fire, Water, Grass, etc.
  hp                  text,
  tcgplayer_url       text,
  market_price_usd    decimal(10,2),            -- Precio de referencia en USD
  market_price_cop    decimal(12,2),            -- Precio de referencia convertido (opcional)
  last_price_update   timestamptz,
  created_at          timestamptz default now()
);

-- Índices para búsqueda rápida de cartas
create index idx_tcg_cards_name on public.tcg_cards using gin(to_tsvector('spanish', name));
create index idx_tcg_cards_set on public.tcg_cards(set_id);
create index idx_tcg_cards_api_id on public.tcg_cards(api_id);

-- ============================================================
-- TABLA: inventory
-- Relaciona vendedor con carta: stock a la venta
-- ============================================================
create table public.inventory (
  id                uuid default uuid_generate_v4() primary key,
  seller_id         uuid references public.profiles(id) on delete cascade not null,
  card_id           uuid references public.tcg_cards(id) on delete cascade not null,
  quantity          integer default 1 check (quantity >= 0),
  condition         text check (condition in ('NM', 'LP', 'MP', 'HP', 'DMG')) default 'NM',
  -- NM=Near Mint, LP=Lightly Played, MP=Moderately Played, HP=Heavily Played, DMG=Damaged
  manual_price      decimal(10,2),             -- Precio fijo definido por el vendedor
  use_market_price  boolean default false,     -- true = usar precio de TCGPlayer como referencia
  notes             text,                       -- Notas del vendedor (ej: "foil rayado")
  custom_image_url  text,                       -- Foto propia del vendedor (opcional; si null usa imagen del catálogo)
  is_active         boolean default true,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now(),
  -- Un vendedor no puede tener dos registros del mismo (carta + condición)
  unique(seller_id, card_id, condition)
);

-- Índices para búsqueda de inventario
create index idx_inventory_seller on public.inventory(seller_id);
create index idx_inventory_card on public.inventory(card_id);
create index idx_inventory_active on public.inventory(is_active, card_id);
create index idx_inventory_price on public.inventory(manual_price) where is_active = true;

-- ============================================================
-- TABLA: price_history
-- Snapshots diarios del precio de mercado por carta
-- Alimentado por /api/cron/refresh-prices en cada ejecución
-- ============================================================
create table public.price_history (
  id          uuid default uuid_generate_v4() primary key,
  card_id     uuid references public.tcg_cards(id) on delete cascade not null,
  price_usd   decimal(10,2) not null,
  source      text default 'tcgplayer',   -- 'tcgplayer' | 'cardmarket'
  recorded_at timestamptz default now()
);

create index idx_price_history_card on public.price_history(card_id, recorded_at desc);

alter table public.price_history enable row level security;

create policy "Historial de precios es público (lectura)"
  on public.price_history for select
  using (true);

create policy "Sistema puede insertar historial de precios"
  on public.price_history for insert
  with check (auth.role() = 'authenticated');

-- Migración (si la DB ya existe):
-- create table public.price_history ( ... ) -- ver arriba
-- O ejecutar directamente en Supabase SQL Editor

-- ============================================================
-- TABLA: card_views
-- Contador de vistas por carta (alimentado desde el cliente)
-- ============================================================
create table public.card_views (
  api_id         text primary key,
  view_count     integer default 1,
  last_viewed_at timestamptz default now()
);

alter table public.card_views enable row level security;

create policy "Vistas de cartas son públicas (lectura)"
  on public.card_views for select
  using (true);

-- ============================================================
-- FUNCIÓN: increment_card_view
-- Incremento atómico de vista (upsert thread-safe)
-- ============================================================
create or replace function public.increment_card_view(p_api_id text)
returns void as $$
begin
  insert into public.card_views (api_id, view_count, last_viewed_at)
  values (p_api_id, 1, now())
  on conflict (api_id) do update
    set view_count     = card_views.view_count + 1,
        last_viewed_at = now();
end;
$$ language plpgsql security definer;

-- ============================================================
-- FUNCIÓN: get_recommended_cards
-- Devuelve las cartas más populares de la plataforma.
-- Orden: más vistas → más stock. Excluye la carta actual.
-- ============================================================
create or replace function public.get_recommended_cards(
  p_exclude_api_id text,
  p_limit          int default 6
)
returns table(
  api_id           text,
  name             text,
  image_url_sm     text,
  market_price_usd numeric,
  total_stock      bigint,
  view_count       bigint
) as $$
begin
  return query
  select
    c.api_id,
    c.name,
    c.image_url_sm,
    c.market_price_usd,
    sum(i.quantity)::bigint                    as total_stock,
    coalesce(max(cv.view_count), 0)::bigint    as view_count
  from public.tcg_cards c
  join public.inventory i
    on i.card_id = c.id
   and i.is_active = true
   and i.quantity > 0
  left join public.card_views cv
    on cv.api_id = c.api_id
  where c.api_id != p_exclude_api_id
  group by c.api_id, c.name, c.image_url_sm, c.market_price_usd
  order by coalesce(max(cv.view_count), 0) desc,
           sum(i.quantity) desc
  limit p_limit;
end;
$$ language plpgsql stable security definer;

-- ============================================================
-- TABLA: tiendas_aliadas
-- Puntos de retiro físicos asociados a la plataforma
-- ============================================================
create table public.tiendas_aliadas (
  id          uuid default uuid_generate_v4() primary key,
  name        text not null,
  address     text,
  city        text,
  maps_url    text,                           -- Link a Google Maps
  manager_id  uuid references public.profiles(id) on delete set null,
  phone       text,
  whatsapp    text,
  logo_url    text,
  description text,
  is_active   boolean default true,
  created_at  timestamptz default now()
);

-- ============================================================
-- TRIGGERS: auto-crear profile y actualizar timestamps
-- ============================================================

-- Trigger: crear profile automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger: updated_at automático
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger set_inventory_updated_at
  before update on public.inventory
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table public.profiles enable row level security;
alter table public.tcg_cards enable row level security;
alter table public.inventory enable row level security;
alter table public.tiendas_aliadas enable row level security;

-- --- PROFILES ---
create policy "Profiles son públicos (lectura)"
  on public.profiles for select
  using (true);

create policy "Usuarios pueden actualizar su propio perfil"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "El trigger inserta el perfil (sistema)"
  on public.profiles for insert
  with check (auth.uid() = id);

-- --- TCG_CARDS ---
create policy "Cartas son públicas (lectura)"
  on public.tcg_cards for select
  using (true);

create policy "Usuarios autenticados pueden insertar cartas en caché"
  on public.tcg_cards for insert
  with check (auth.role() = 'authenticated');

create policy "Usuarios autenticados pueden actualizar precios"
  on public.tcg_cards for update
  using (auth.role() = 'authenticated');

-- --- INVENTORY ---
create policy "Inventario activo es público (lectura)"
  on public.inventory for select
  using (is_active = true);

create policy "Vendedores ven todo su inventario (incluyendo inactivo)"
  on public.inventory for select
  using (auth.uid() = seller_id);

create policy "Vendedores pueden crear su inventario"
  on public.inventory for insert
  with check (auth.uid() = seller_id);

create policy "Vendedores pueden actualizar solo su inventario"
  on public.inventory for update
  using (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

create policy "Vendedores pueden eliminar solo su inventario"
  on public.inventory for delete
  using (auth.uid() = seller_id);

-- --- TIENDAS_ALIADAS ---
create policy "Tiendas activas son públicas (lectura)"
  on public.tiendas_aliadas for select
  using (is_active = true);

-- ============================================================
-- VISTA ÚTIL: inventory con datos de carta y vendedor
-- ============================================================
create or replace view public.inventory_with_details as
select
  i.id,
  i.quantity,
  i.condition,
  i.manual_price,
  i.use_market_price,
  i.notes,
  i.is_active,
  i.created_at,
  i.updated_at,
  -- Carta
  c.api_id,
  c.name as card_name,
  coalesce(i.custom_image_url, c.image_url_sm) as image_url_sm,
  coalesce(i.custom_image_url, c.image_url_lg) as image_url_lg,
  c.set_name,
  c.card_number,
  c.rarity,
  c.supertype,
  c.types,
  c.market_price_usd,
  -- Precio efectivo (manual o mercado)
  case
    when i.use_market_price then c.market_price_usd
    else i.manual_price
  end as effective_price_usd,
  -- Vendedor
  p.id as seller_id,
  p.full_name as seller_name,
  p.store_name,
  p.store_slug,
  p.whatsapp as seller_whatsapp,
  p.location as seller_location
from public.inventory i
join public.tcg_cards c on c.id = i.card_id
join public.profiles p on p.id = i.seller_id
where i.is_active = true and i.quantity > 0;

-- ============================================================
-- MIGRACIÓN: agregar columna custom_image_url a inventory
-- Ejecutar en Supabase SQL Editor si la tabla ya existe
-- ============================================================
-- alter table public.inventory add column if not exists custom_image_url text;

-- ============================================================
-- STORAGE: bucket card-photos
-- Crear manualmente en Supabase > Storage > New bucket
--   Name: card-photos
--   Public: true
-- Políticas RLS (ejecutar en SQL Editor):
-- ============================================================
-- insert into storage.buckets (id, name, public) values ('card-photos', 'card-photos', true)
-- on conflict (id) do nothing;
--
-- create policy "Usuarios autenticados pueden subir fotos"
--   on storage.objects for insert
--   with check (bucket_id = 'card-photos' and auth.role() = 'authenticated');
--
-- create policy "Fotos son públicas"
--   on storage.objects for select
--   using (bucket_id = 'card-photos');
--
-- create policy "Usuarios pueden borrar sus propias fotos"
--   on storage.objects for delete
--   using (bucket_id = 'card-photos' and auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- STORAGE: bucket avatars
-- Fotos de perfil de vendedores y logos de tiendas
-- Crear en Supabase > Storage > New bucket
--   Name: avatars
--   Public: true
-- Políticas RLS (ejecutar en SQL Editor):
-- ============================================================
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
-- on conflict (id) do nothing;
--
-- create policy "Avatars son públicos (lectura)"
--   on storage.objects for select
--   using (bucket_id = 'avatars');
--
-- create policy "Usuarios autenticados pueden subir su avatar"
--   on storage.objects for insert
--   with check (bucket_id = 'avatars' and auth.role() = 'authenticated');
--
-- create policy "Usuarios pueden actualizar su avatar"
--   on storage.objects for update
--   using (bucket_id = 'avatars' and auth.role() = 'authenticated');
--
-- create policy "Usuarios pueden borrar su avatar"
--   on storage.objects for delete
--   using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

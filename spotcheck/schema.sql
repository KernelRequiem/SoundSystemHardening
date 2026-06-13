-- ═══════════════════════════════════════════════════════════════════
--  SpotCheck — Supabase PostgreSQL Schema
--  Projet : SoundSystem Hardening
--  Auth   : Supabase Auth (JWT) avec Row Level Security (RLS)
-- ═══════════════════════════════════════════════════════════════════

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "postgis";  -- Optionnel: pour requêtes géospatiales avancées

-- ───────────────────────────────────────────────────────────────────
-- TABLE: profiles (extension de auth.users)
-- ───────────────────────────────────────────────────────────────────
create table public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  email       text not null,
  role        text not null default 'viewer' check (role in ('admin', 'tech', 'viewer')),
  display_name text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Trigger: auto-créer un profil à l'inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'viewer');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────────────────────────────────────────────────────────────
-- TABLE: spots (spot principal)
-- ───────────────────────────────────────────────────────────────────
create table public.spots (
  id          uuid default uuid_generate_v4() primary key,
  name        text not null,
  lat         double precision not null,
  lng         double precision not null,
  type        text not null default 'autre'
                check (type in ('entrepot','friche','carriere','exterieur','chapiteau','autre')),
  status      text not null default 'draft'
                check (status in ('draft','active','archived')),
  notes       text,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Index géospatial (accélère les requêtes par proximité)
create index spots_geo_idx on public.spots using btree (lat, lng);

-- ───────────────────────────────────────────────────────────────────
-- TABLE: scores (critères d'évaluation par spot)
-- ───────────────────────────────────────────────────────────────────
create table public.scores (
  id          uuid default uuid_generate_v4() primary key,
  spot_id     uuid references public.spots(id) on delete cascade not null,
  acoustique  numeric(4,2) default 5.0 check (acoustique between 0 and 10),
  acces       numeric(4,2) default 5.0 check (acces between 0 and 10),
  repression  numeric(4,2) default 5.0 check (repression between 0 and 10),
  incendie    numeric(4,2) default 5.0 check (incendie between 0 and 10),
  praticite   numeric(4,2) default 5.0 check (praticite between 0 and 10),
  -- Score global calculé côté DB (optionnel — peut aussi être calculé côté client)
  global_score numeric(4,2) generated always as (
    round((acoustique*0.30 + acces*0.20 + repression*0.25 + incendie*0.15 + praticite*0.10)::numeric, 2)
  ) stored,
  updated_by  uuid references public.profiles(id) on delete set null,
  updated_at  timestamptz default now(),
  unique(spot_id)  -- Un seul enregistrement de scores par spot
);

-- ───────────────────────────────────────────────────────────────────
-- TABLE: osm_data (résultats d'analyse OSM)
-- ───────────────────────────────────────────────────────────────────
create table public.osm_data (
  id               uuid default uuid_generate_v4() primary key,
  spot_id          uuid references public.spots(id) on delete cascade not null,
  roads_nearby     text,          -- Description voies d'accès
  police_distance  numeric(6,1),  -- Distance en mètres
  fire_distance    numeric(6,1),  -- Distance caserne pompiers en mètres
  hydrant_distance numeric(6,1),  -- Distance borne incendie en mètres
  transit_stops    integer,       -- Nombre arrêts transports à <500m
  powerline_nearby boolean,       -- Ligne électrique détectée
  raw_overpass     jsonb,         -- Réponse brute Overpass API
  fetched_at       timestamptz default now(),
  unique(spot_id)
);

-- ───────────────────────────────────────────────────────────────────
-- TABLE: notes (notes historisées)
-- ───────────────────────────────────────────────────────────────────
create table public.notes (
  id         uuid default uuid_generate_v4() primary key,
  spot_id    uuid references public.spots(id) on delete cascade not null,
  content    text not null,
  author_id  uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

create index notes_spot_idx on public.notes (spot_id, created_at desc);

-- ───────────────────────────────────────────────────────────────────
-- TABLE: photos (métadonnées — fichiers dans Supabase Storage)
-- ───────────────────────────────────────────────────────────────────
create table public.photos (
  id           uuid default uuid_generate_v4() primary key,
  spot_id      uuid references public.spots(id) on delete cascade not null,
  storage_path text not null,     -- Chemin dans le bucket Supabase Storage
  caption      text,
  taken_at     timestamptz,       -- EXIF date si disponible
  uploaded_by  uuid references public.profiles(id) on delete set null,
  uploaded_at  timestamptz default now()
);

create index photos_spot_idx on public.photos (spot_id, uploaded_at desc);

-- ───────────────────────────────────────────────────────────────────
-- TABLE: reports (rapports PDF générés et archivés)
-- ───────────────────────────────────────────────────────────────────
create table public.reports (
  id            uuid default uuid_generate_v4() primary key,
  spot_id       uuid references public.spots(id) on delete set null,
  type          text default 'single' check (type in ('single','comparison')),
  storage_path  text,             -- Chemin PDF dans Supabase Storage
  generated_by  uuid references public.profiles(id) on delete set null,
  generated_at  timestamptz default now(),
  metadata      jsonb             -- { spots_compared: [...], scores_snapshot: {...} }
);

-- ───────────────────────────────────────────────────────────────────
-- TABLE: spot_history (audit trail des modifications)
-- ───────────────────────────────────────────────────────────────────
create table public.spot_history (
  id          uuid default uuid_generate_v4() primary key,
  spot_id     uuid references public.spots(id) on delete cascade not null,
  action      text not null check (action in ('created','updated','scored','osm_fetched','archived','deleted')),
  diff        jsonb,              -- { field: [old_val, new_val], ... }
  actor_id    uuid references public.profiles(id) on delete set null,
  actor_email text,               -- Dénormalisé pour conservation post-suppression
  created_at  timestamptz default now()
);

create index history_spot_idx on public.spot_history (spot_id, created_at desc);

-- ───────────────────────────────────────────────────────────────────
-- TRIGGERS: updated_at automatique
-- ───────────────────────────────────────────────────────────────────
create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger spots_updated_at before update on public.spots
  for each row execute function public.update_updated_at();

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.update_updated_at();

-- ───────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS) — Accès restreint
-- ───────────────────────────────────────────────────────────────────
-- Activation RLS sur toutes les tables
alter table public.profiles    enable row level security;
alter table public.spots       enable row level security;
alter table public.scores      enable row level security;
alter table public.osm_data    enable row level security;
alter table public.notes       enable row level security;
alter table public.photos      enable row level security;
alter table public.reports     enable row level security;
alter table public.spot_history enable row level security;

-- Helper: vérifier le rôle de l'utilisateur courant
create or replace function public.current_user_role()
returns text language sql security definer stable as $$
  select role from public.profiles where id = auth.uid()
$$;

-- Politique: seuls les utilisateurs authentifiés avec rôle admin ou tech peuvent tout lire
create policy "authenticated_read_spots" on public.spots
  for select using (auth.uid() is not null);

create policy "tech_admin_write_spots" on public.spots
  for all using (public.current_user_role() in ('admin', 'tech'));

create policy "authenticated_read_scores" on public.scores
  for select using (auth.uid() is not null);

create policy "tech_admin_write_scores" on public.scores
  for all using (public.current_user_role() in ('admin', 'tech'));

create policy "authenticated_read_osm" on public.osm_data
  for select using (auth.uid() is not null);

create policy "tech_admin_write_osm" on public.osm_data
  for all using (public.current_user_role() in ('admin', 'tech'));

create policy "authenticated_read_notes" on public.notes
  for select using (auth.uid() is not null);

create policy "auth_write_notes" on public.notes
  for insert with check (auth.uid() is not null);

create policy "own_or_admin_update_notes" on public.notes
  for update using (author_id = auth.uid() or public.current_user_role() = 'admin');

create policy "authenticated_read_photos" on public.photos
  for select using (auth.uid() is not null);

create policy "tech_admin_write_photos" on public.photos
  for all using (public.current_user_role() in ('admin', 'tech'));

create policy "authenticated_read_reports" on public.reports
  for select using (auth.uid() is not null);

create policy "authenticated_read_history" on public.spot_history
  for select using (auth.uid() is not null);

-- Profils: chacun lit le sien, admin lit tout
create policy "own_profile" on public.profiles
  for select using (id = auth.uid() or public.current_user_role() = 'admin');

create policy "admin_write_profiles" on public.profiles
  for update using (public.current_user_role() = 'admin');

-- ───────────────────────────────────────────────────────────────────
-- VUE: spots_with_scores (join pratique pour le frontend)
-- ───────────────────────────────────────────────────────────────────
create or replace view public.spots_full as
  select
    s.*,
    sc.acoustique, sc.acces, sc.repression, sc.incendie, sc.praticite,
    sc.global_score,
    p.display_name as created_by_name,
    count(distinct n.id) as notes_count,
    count(distinct ph.id) as photos_count
  from public.spots s
  left join public.scores sc     on sc.spot_id = s.id
  left join public.profiles p    on p.id = s.created_by
  left join public.notes n       on n.spot_id = s.id
  left join public.photos ph     on ph.spot_id = s.id
  group by s.id, sc.acoustique, sc.acces, sc.repression, sc.incendie,
           sc.praticite, sc.global_score, p.display_name;

-- ───────────────────────────────────────────────────────────────────
-- STORAGE: Configuration des buckets (à exécuter dans Supabase Dashboard)
-- ───────────────────────────────────────────────────────────────────
-- insert into storage.buckets (id, name, public) values ('spot-photos', 'spot-photos', false);
-- insert into storage.buckets (id, name, public) values ('spot-reports', 'spot-reports', false);
--
-- Policies Storage:
-- create policy "authenticated_read_photos" on storage.objects
--   for select using (bucket_id = 'spot-photos' and auth.role() = 'authenticated');
-- create policy "tech_upload_photos" on storage.objects
--   for insert with check (bucket_id = 'spot-photos' and auth.role() = 'authenticated');

-- ───────────────────────────────────────────────────────────────────
-- DONNÉES DE TEST (dev uniquement — supprimer en production)
-- ───────────────────────────────────────────────────────────────────
-- insert into public.spots (name, lat, lng, type, status, notes) values
--   ('Entrepôt Pantin Nord', 48.897, 2.407, 'entrepot', 'active', 'Accord verbal propriétaire (M. Thierry).'),
--   ('Friche Saint-Denis Est', 48.933, 2.365, 'friche', 'active', 'Terrain vague. Accès délicat.'),
--   ('Carrière Vincennes', 48.846, 2.432, 'carriere', 'active', 'Acoustique exceptionnelle.');

create sequence "public"."combinations_id_seq";

create table "public"."bets_records" (
    "id" bigint generated always as identity not null,
    "user_id" uuid not null,
    "combination_id" integer not null,
    "outcome_monster_name" text,
    "is_draw" boolean default false,
    "total_wealth" numeric(18,2) not null,
    "max_bet" numeric(18,2) not null,
    "bet_details" jsonb not null,
    "created_at" timestamp with time zone default now()
);


alter table "public"."bets_records" enable row level security;

create table "public"."combinations" (
    "id" integer not null default nextval('combinations_id_seq'::regclass),
    "monsters" jsonb not null,
    "created_at" timestamp with time zone default now()
);


alter table "public"."combinations" enable row level security;

create table "public"."users" (
    "id" uuid not null,
    "google_sub" text,
    "display_name" text,
    "created_at" timestamp with time zone default now()
);


alter table "public"."users" enable row level security;

alter sequence "public"."combinations_id_seq" owned by "public"."combinations"."id";

CREATE INDEX bets_records_comb_idx ON public.bets_records USING btree (combination_id);

CREATE UNIQUE INDEX bets_records_pkey ON public.bets_records USING btree (id);

CREATE INDEX bets_records_user_id_idx ON public.bets_records USING btree (user_id);

CREATE UNIQUE INDEX combinations_pkey ON public.combinations USING btree (id);

CREATE UNIQUE INDEX users_google_sub_key ON public.users USING btree (google_sub);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

alter table "public"."bets_records" add constraint "bets_records_pkey" PRIMARY KEY using index "bets_records_pkey";

alter table "public"."combinations" add constraint "combinations_pkey" PRIMARY KEY using index "combinations_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."bets_records" add constraint "bets_records_combination_id_fkey" FOREIGN KEY (combination_id) REFERENCES combinations(id) not valid;

alter table "public"."bets_records" validate constraint "bets_records_combination_id_fkey";

alter table "public"."bets_records" add constraint "bets_records_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."bets_records" validate constraint "bets_records_user_id_fkey";

alter table "public"."users" add constraint "users_google_sub_key" UNIQUE using index "users_google_sub_key";

alter table "public"."users" add constraint "users_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."users" validate constraint "users_id_fkey";

grant delete on table "public"."bets_records" to "anon";

grant insert on table "public"."bets_records" to "anon";

grant references on table "public"."bets_records" to "anon";

grant select on table "public"."bets_records" to "anon";

grant trigger on table "public"."bets_records" to "anon";

grant truncate on table "public"."bets_records" to "anon";

grant update on table "public"."bets_records" to "anon";

grant delete on table "public"."bets_records" to "authenticated";

grant insert on table "public"."bets_records" to "authenticated";

grant references on table "public"."bets_records" to "authenticated";

grant select on table "public"."bets_records" to "authenticated";

grant trigger on table "public"."bets_records" to "authenticated";

grant truncate on table "public"."bets_records" to "authenticated";

grant update on table "public"."bets_records" to "authenticated";

grant delete on table "public"."bets_records" to "service_role";

grant insert on table "public"."bets_records" to "service_role";

grant references on table "public"."bets_records" to "service_role";

grant select on table "public"."bets_records" to "service_role";

grant trigger on table "public"."bets_records" to "service_role";

grant truncate on table "public"."bets_records" to "service_role";

grant update on table "public"."bets_records" to "service_role";

grant delete on table "public"."combinations" to "anon";

grant insert on table "public"."combinations" to "anon";

grant references on table "public"."combinations" to "anon";

grant select on table "public"."combinations" to "anon";

grant trigger on table "public"."combinations" to "anon";

grant truncate on table "public"."combinations" to "anon";

grant update on table "public"."combinations" to "anon";

grant delete on table "public"."combinations" to "authenticated";

grant insert on table "public"."combinations" to "authenticated";

grant references on table "public"."combinations" to "authenticated";

grant select on table "public"."combinations" to "authenticated";

grant trigger on table "public"."combinations" to "authenticated";

grant truncate on table "public"."combinations" to "authenticated";

grant update on table "public"."combinations" to "authenticated";

grant delete on table "public"."combinations" to "service_role";

grant insert on table "public"."combinations" to "service_role";

grant references on table "public"."combinations" to "service_role";

grant select on table "public"."combinations" to "service_role";

grant trigger on table "public"."combinations" to "service_role";

grant truncate on table "public"."combinations" to "service_role";

grant update on table "public"."combinations" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";

create policy "own bets delete"
on "public"."bets_records"
as permissive
for delete
to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));


create policy "own bets insert"
on "public"."bets_records"
as permissive
for insert
to authenticated
with check ((user_id = ( SELECT auth.uid() AS uid)));


create policy "own bets read"
on "public"."bets_records"
as permissive
for select
to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));


create policy "own bets update"
on "public"."bets_records"
as permissive
for update
to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)))
with check ((user_id = ( SELECT auth.uid() AS uid)));


create policy "public read combinations"
on "public"."combinations"
as permissive
for select
to authenticated, anon
using (true);


create policy "read own profile"
on "public"."users"
as permissive
for select
to authenticated
using ((id = ( SELECT auth.uid() AS uid)));




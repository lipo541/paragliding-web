-- Create promo_codes table
create table if not exists public.promo_codes (
  id uuid not null default gen_random_uuid(),
  code text not null unique,
  discount_percentage integer not null check (discount_percentage > 0 and discount_percentage <= 100),
  description text,
  is_active boolean not null default true,
  usage_limit integer,
  usage_count integer not null default 0,
  valid_from timestamp with time zone,
  valid_until timestamp with time zone,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint promo_codes_pkey primary key (id),
  constraint promo_codes_code_check check (code ~ '^[A-Z0-9]+$'),
  constraint promo_codes_valid_dates_check check (valid_until is null or valid_from is null or valid_until > valid_from)
);

-- Create index on code for faster lookups
create index if not exists idx_promo_codes_code on public.promo_codes(code);
create index if not exists idx_promo_codes_active on public.promo_codes(is_active);

-- Enable RLS
alter table public.promo_codes enable row level security;

-- Allow public to read active promo codes (for validation on booking page)
create policy "Anyone can view active promo codes"
  on public.promo_codes
  for select
  using (is_active = true);

-- Only authenticated super admins can insert/update/delete
create policy "Super admins can manage promo codes"
  on public.promo_codes
  for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'SUPER_ADMIN'
    )
  );

-- Create updated_at trigger
create or replace function update_promo_codes_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

create trigger update_promo_codes_updated_at
  before update on public.promo_codes
  for each row
  execute function update_promo_codes_updated_at();

-- Insert some example promo codes
insert into public.promo_codes (code, discount_percentage, description, usage_limit) values
  ('SUMMER2024', 10, 'Summer Special - 10% Off', 100),
  ('WELCOME', 15, 'Welcome Bonus - 15% Off', 50),
  ('FLY20', 20, 'Flight Special - 20% Off', 30)
on conflict (code) do nothing;

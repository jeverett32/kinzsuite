-- Add optional gender metadata for adopted pets.
alter table public.pets
  add column if not exists gender text;

do $$
begin
  if not exists (
    select 1
      from pg_constraint
     where conname = 'pets_gender_check'
       and conrelid = 'public.pets'::regclass
  ) then
    alter table public.pets
      add constraint pets_gender_check
      check (gender is null or gender in ('boy', 'girl', 'unknown'));
  end if;
end $$;

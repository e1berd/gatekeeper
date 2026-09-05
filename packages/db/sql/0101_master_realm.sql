-- master realm

insert into auth.realms (slug, name, settings)
values ('master', 'master', '{}')
on conflict (slug) do nothing;

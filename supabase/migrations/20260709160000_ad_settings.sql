-- Ad monetization settings (phase 1: display slots between clips via AdSense).
-- Feature-flagged off by default; the publisher id lives in an env var, so
-- turning ads on is: set NEXT_PUBLIC_ADSENSE_CLIENT + flip ads_enabled here.
-- ad_frequency = show one ad slot per N organic clips in the feed. Kept >= 3
-- so the feed can never be spammed into a retention-killing ad wall.

alter table public.platform_settings
  add column ads_enabled boolean not null default false,
  add column ad_frequency integer not null default 6
    check (ad_frequency >= 3);

create function public.admin_set_ads(p_enabled boolean, p_frequency integer)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.current_user_is_admin() then raise exception 'not authorized'; end if;
  if p_frequency < 3 then raise exception 'ad_frequency must be at least 3'; end if;
  update public.platform_settings
    set ads_enabled = p_enabled,
        ad_frequency = p_frequency,
        updated_by = auth.uid(),
        updated_at = now()
    where id = 1;
end; $$;

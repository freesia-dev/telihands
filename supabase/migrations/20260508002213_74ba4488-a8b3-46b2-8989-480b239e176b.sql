
revoke execute on function public.has_role(uuid, app_role) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop policy if exists "media storage public read" on storage.objects;
create policy "media storage authed read" on storage.objects for select to authenticated using (bucket_id = 'media');

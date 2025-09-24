-- Audio Portfolio Supabase Setup
-- Run this SQL in your Supabase project's SQL Editor

-- Create the tracks table
create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  genre text not null,
  description text,
  tags text[],
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.tracks enable row level security;

-- Policy: Anyone can read tracks (public portfolio)
create policy "Public can read tracks" 
  on public.tracks 
  for select 
  using (true);

-- Policy: Only authenticated users can insert tracks
create policy "Authenticated users can insert tracks" 
  on public.tracks 
  for insert 
  to authenticated 
  with check (auth.role() = 'authenticated');

-- Policy: Only authenticated users can update their own tracks (optional)
create policy "Authenticated users can update tracks" 
  on public.tracks 
  for update 
  to authenticated 
  using (true);

-- Policy: Only authenticated users can delete tracks (optional)
create policy "Authenticated users can delete tracks" 
  on public.tracks 
  for delete 
  to authenticated 
  using (true);

-- Create an index for better performance when ordering by created_at
create index if not exists tracks_created_at_idx 
  on public.tracks (created_at desc);

-- Create an index for genre filtering
create index if not exists tracks_genre_idx 
  on public.tracks (genre);

-- Insert some sample data (optional)
insert into public.tracks (title, url, genre, description, tags) values
  ('Glass Garden', '/audio/glass-garden.mp3', 'Ambient', 'Soft atmospheric pads with gentle reverb, perfect for contemplative moments and background ambiance.', array['film', 'ad', 'contemplative', 'soft']),
  ('Dusty Loop', '/audio/dusty-loop.mp3', 'Lofi', 'Nostalgic lofi beat with vinyl crackle and warm analog textures.', array['lofi', 'nostalgic', 'chill', 'study']),
  ('Digital Dreams', '/audio/digital-dreams.mp3', 'Electronic', 'Uplifting electronic composition with modern synths and driving percussion.', array['upbeat', 'modern', 'commercial', 'tech']),
  ('Morning Coffee', '/audio/morning-coffee.mp3', 'Jazz', 'Smooth jazz with gentle piano and subtle bass line, perfect for cafes and relaxed settings.', array['jazz', 'cafe', 'relaxed', 'piano'])
on conflict (id) do nothing;

-- Storage setup instructions:
-- 1. Go to Storage in your Supabase dashboard
-- 2. Create a new bucket called 'audio'
-- 3. Set the bucket to 'Public' if you want direct audio file access
-- 4. Or keep it private and implement signed URLs for more security

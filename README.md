# Audio Portfolio Website

A modern, responsive web application for showcasing audio work and music compositions. Features both static hosting support and dynamic upload capabilities via Supabase.

## ✨ Features

- **🎵 Audio Portfolio**: Beautiful grid layout showcasing your tracks
- **📱 Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **🎛️ Admin Panel**: Upload and manage tracks (with Supabase)
- **🏷️ Genre Filtering**: Filter tracks by genre
- **📊 Dual Mode**: Static JSON files OR dynamic Supabase backend
- **🎨 Modern UI**: Glassmorphism design with smooth animations
- **🔒 Secure Uploads**: Row-level security with Supabase Auth

## 🚀 Quick Start

### Option A: Static Mode (No Backend Required)

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Add your audio files**:
   - Place audio files in `/public/audio/`
   - Update `/public/tracks.json` with your track metadata

3. **Run locally**:
   ```bash
   npm run dev
   ```

4. **Deploy**:
   ```bash
   npm run build
   ```
   Deploy the `dist` folder to Vercel, Netlify, or GitHub Pages.

### Option B: Dynamic Mode (with Supabase)

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Set up the database**:
   ```sql
   create table if not exists public.tracks (
     id uuid primary key default gen_random_uuid(),
     title text not null,
     url text not null,
     genre text not null,
     description text,
     tags text[],
     created_at timestamp with time zone default now()
   );

   alter table public.tracks enable row level security;

   create policy "Public can read" on public.tracks 
     for select using (true);

   create policy "Auth can insert" on public.tracks 
     for insert to authenticated with check (auth.role() = 'authenticated');
   ```

3. **Create storage bucket**:
   - Go to Storage → Create bucket named `audio`
   - Set it to **Public** for simple serving

4. **Configure environment**:
   ```bash
   cp env.example .env
   ```
   Add your Supabase URL and anon key to `.env`

5. **Create an admin user** in Supabase Auth panel

6. **Run the app**:
   ```bash
   npm install
   npm run dev
   ```

## 📁 Project Structure

```
├── public/
│   ├── audio/              # Static audio files
│   └── tracks.json         # Fallback track data
├── src/
│   ├── components/
│   │   ├── AdminPanel.jsx  # Upload interface
│   │   ├── TrackGrid.jsx   # Track listing
│   │   ├── TrackCard.jsx   # Individual track display
│   │   └── GenreFilter.jsx # Genre filtering
│   ├── lib/
│   │   └── supabase.js     # Supabase configuration
│   ├── App.jsx             # Main application
│   ├── index.css           # Styles
│   └── main.jsx            # Entry point
├── package.json
├── vite.config.js
└── README.md
```

## 🎨 Customization

### Styling
Edit `src/index.css` to customize:
- Color scheme (currently purple gradient)
- Typography
- Layout and spacing
- Responsive breakpoints

### Track Data Structure
```json
{
  "id": "unique-id",
  "title": "Track Title",
  "url": "/audio/track.mp3",
  "genre": "Genre Name",
  "description": "Optional description",
  "tags": ["tag1", "tag2"],
  "created_at": "2024-01-01T00:00:00Z"
}
```

## 🔒 Security Notes

- The Supabase anon key is safe to expose in client-side code
- Row-level security policies control data access
- Only authenticated users can upload tracks
- For production, consider adding user-specific policies

## 🚀 Deployment

### Static Hosting (Vercel/Netlify)
```bash
npm run build
# Deploy the 'dist' folder
```

### With Supabase
1. Set environment variables in your hosting platform
2. Deploy as above
3. Ensure your domain is added to Supabase Auth settings

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📝 License

MIT License - feel free to use this for your own portfolio!

---

## 🎵 Sample Data

The app includes sample track data in `public/tracks.json`. Replace with your own tracks or use the admin panel to upload dynamically.

**Need help?** Check the console for any errors, and ensure your audio files are accessible at the URLs specified in your track data.

# Deploy na Vercel

## Env publica

Configure na Vercel:

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Use somente a chave anon/public do Supabase.

Nao use chave privada ou administrativa no frontend.

## Build

```txt
Build Command: npm run build
Output Directory: dist
```

## Supabase Auth

Depois do deploy, configure no Supabase:

```txt
Authentication -> URL Configuration
```

Inclua:

```txt
https://sua-url.vercel.app/**
http://localhost:5173/**
```

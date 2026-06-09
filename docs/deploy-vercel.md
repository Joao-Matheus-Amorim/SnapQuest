# Deploy na Vercel

## Variáveis de ambiente

Configure no projeto da Vercel:

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Use somente a chave anon/public do Supabase.

Nunca use `service_role` no frontend.

## Build

A Vercel deve usar:

```txt
Build Command: npm run build
Output Directory: dist
```

O arquivo `vercel.json` já informa essa configuração.

## Supabase Auth

Depois do primeiro deploy, copie a URL da Vercel e configure no Supabase:

```txt
Authentication -> URL Configuration
```

Use:

```txt
Site URL: https://sua-url.vercel.app
Redirect URLs:
https://sua-url.vercel.app/**
http://localhost:5173/**
```

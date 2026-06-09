# Variáveis de Ambiente

## Frontend público

O MVP web usa Vite. Por isso, variáveis expostas ao navegador precisam começar com `VITE_`.

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Essas duas podem ir para o frontend porque a anon key é pública e protegida por RLS no Supabase.

## Proibido no frontend

Nunca coloque no `.env`, Vercel frontend ou código do navegador:

```txt
SUPABASE_SERVICE_ROLE_KEY
```

A service role ignora RLS e só pode existir em backend seguro.

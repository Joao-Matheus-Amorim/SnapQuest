# Supabase Edge Functions

## `gemini-transform`

Responsavel por:

- receber `photoBase64` e `target`;
- chamar Gemini usando segredo privado;
- validar e normalizar o contrato;
- devolver JSON padronizado para o app.

### Secrets necessarios

```txt
GEMINI_API_KEY=
GEMINI_MODELS=
```

### Deploy

```bash
supabase functions deploy gemini-transform
supabase secrets set GEMINI_API_KEY=... GEMINI_MODELS=gemini-3.1-flash-lite,gemini-2.5-flash
```

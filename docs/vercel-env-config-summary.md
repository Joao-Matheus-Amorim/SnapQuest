# Vercel env config

Esta branch prepara o SnapQuest para usar envs públicas da Vercel com Vite.

Mudanças:
- Vite como build leve.
- Vercel gera `dist`.
- App lê `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
- Fallback manual continua funcionando.
- `.env.example` atualizado.

Fora do escopo:
- Schema SQL.
- Storage.
- Expo.
- IA.

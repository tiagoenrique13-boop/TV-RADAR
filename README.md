# TV Radar 65 — MVP

Aplicação PWA para acompanhar preços de TVs de 65 polegadas.

## Estado do MVP
- Interface responsiva para celular.
- Catálogo inicial LG, Samsung e TCL.
- Metas de preço configuráveis.
- Registro manual de preço, frete, loja, vendedor e link.
- Ranking do menor preço **registrado**.
- Preparado para deploy automático no GitHub Pages.
- Manifesto PWA e service worker básico.

**Importante:** esta versão não coleta preços automaticamente, não envia alertas Telegram e não sincroniza dados entre familiares. Os registros ficam apenas no estado local da sessão; persistência e compartilhamento entram na próxima etapa. Não trate os preços de demonstração de conversas anteriores como preços atuais.

## Rodar localmente
Requer Node.js 20+.

```bash
npm install
npm run dev
```

## Publicar no GitHub Pages
1. Crie um repositório público chamado `tv-radar-65`.
2. Envie todo o conteúdo desta pasta para a branch `main`.
3. No GitHub, abra **Settings → Pages**.
4. Em **Build and deployment**, escolha **GitHub Actions**.
5. Acesse **Actions** e acompanhe `Deploy TV Radar 65`.
6. A URL será `https://SEU-USUARIO.github.io/tv-radar-65/`.

O workflow `.github/workflows/deploy.yml` compila e publica automaticamente a cada push em `main`.

## Acesso da família
GitHub Pages em repositório público publica o site para qualquer pessoa com o endereço. Não há login familiar nesta primeira versão. Para restringir o acesso ou sincronizar usuários, será necessário adicionar autenticação e banco de dados (por exemplo Supabase) e hospedar a camada privada em serviço compatível.

## Próximas etapas
1. Supabase: autenticação familiar e tabela de observações de preço.
2. Coletor: fontes autorizadas/API/feeds; não depender de scraping frágil.
3. Telegram: bot + `TELEGRAM_BOT_TOKEN` e `TELEGRAM_CHAT_ID` armazenados como GitHub Actions Secrets (nunca no código).
4. Rotina agendada e deduplicação de alertas.
5. Gráficos de histórico com dados coletados e origem rastreável.

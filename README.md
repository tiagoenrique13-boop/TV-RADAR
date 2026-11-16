# TV Radar 65 — versão simples

Projeto pessoal para acompanhar preços de TVs de 65 polegadas.

## O que faz
- Catálogo inicial de modelos TCL, LG e Samsung.
- Registro manual do preço, loja e link da oferta.
- Classificação conforme os preços-alvo definidos.
- Ranking dos preços que você registrou.
- Histórico local no navegador.
- Layout adaptado para celular.

## Importante
Esta versão **não consulta lojas automaticamente e não envia alertas**. Ela é propositalmente simples: você registra os preços encontrados e acompanha a evolução. Os dados ficam salvos no navegador/aparelho em que foram registrados.

Os alvos são referências iniciais editáveis no código, não garantias de preço justo. Antes de comprar, confira SKU completo, vendedor, frete, cupom, nota fiscal e histórico no Zoom/Buscapé.

## Rodar localmente
Requer Node.js 20+.

```bash
npm install
npm run dev
```

## Publicar no GitHub Pages
1. Envie o conteúdo desta pasta para a raiz do repositório `TV-RADAR`, branch `main`.
2. Em **Settings → Pages**, selecione **GitHub Actions** em Build and deployment.
3. O workflow `Deploy TV Radar` fará o build e a publicação a cada push na branch `main`.
4. O endereço será `https://tiagoenrique13-boop.github.io/TV-RADAR/`.

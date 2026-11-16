# IA na educação — Caderno de oficinas

Documento editorial da CONSED feito como site: o conteúdo vive em JSON e MDX, a prévia mostra as folhas A4 paisagem e o PDF é a impressão desse site com o Chromium.

**Título e subtítulo são provisórios.** O material de origem não trazia capa nem nome de publicação; “IA na educação — Caderno de oficinas para as redes estaduais” é o título de trabalho.

## Estado atual

- **11 páginas:** capa + 10 folhas de oficina (casos 1A/1B, perfis 2A/2B/2C, oficinas 3.1, 3.2, 4 e casos 5A/5B).
- **Formato:** A4 paisagem, 297 × 210 mm. A impressão usa 303 × 216 mm com 3 mm de sangria.
- **Identidade:** Instrument Sans (Fontsource), azul `#0b5384`, verde `#64e15e` e a paleta gráfica da CONSED.
- **Conteúdo:** transcrito do PDF `consec_origin.pdf` e conferido contra o OCR. Precisa de revisão editorial antes de publicar.
- **Marca:** a marca CONSED na capa e no rodapé é uma reconstrução vetorial provisória. Os logos oficiais e os logos dos apoiadores ainda não foram fornecidos em vetor.

## Requisitos

- Node.js 20 ou mais novo (`.nvmrc` fixa a versão)
- npm

```bash
npm install
npx playwright install chromium
```

## Ver e editar

```bash
npm run dev
```

Abra **http://127.0.0.1:5173**. `npm run visualizar` e `npm run editar` abrem o mesmo site, com atualização automática ao salvar.

A edição é em arquivos, com o agente: os textos das oficinas ficam em `content/workbook/*.json`, e a capa em `content/chapters/capa.mdx`.

## PDF

```bash
npm run build
```

Valida o documento, gera o site e imprime `output/document-digital.pdf` (A4 paisagem, sem sangria).

```bash
npm run pdf:print
```

Gera `output/document-print.pdf` (303 × 216 mm, com 3 mm de sangria). Não há marcas de corte, conversão de cor, perfil ICC nem PDF/X.

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` / `visualizar` / `editar` | Prévia em http://127.0.0.1:5173 |
| `npm run build` / `gerar-pdf` | PDF digital A4 paisagem |
| `npm run pdf:print` / `gerar-pdf-grafica` | PDF com sangria |
| `npm run validate` | Manifesto, JSONs, MDX, assets e geometria |
| `npm run check` | `validate` + TypeScript |
| `npm run test:visual` | Playwright contra o site |

## Estrutura

| Caminho | Papel |
| --- | --- |
| `content/document.json` | Ordem de leitura e metadados |
| `content/chapters/capa.mdx` | Capa (frontmatter `sheetVariant: cover`) |
| `content/workbook/*.json` | Conteúdo das 10 folhas de oficina |
| `src/layouts/WorkbookPage.tsx` | Modelos `case`, `profile`, `trajectory`, `matrix` e `process` |
| `src/content/schema.ts` | Validação do manifesto e dos modelos de oficina |
| `src/styles/tokens.css` | Página, margens, tipo, cor e espaçamento |
| `src/styles/workbook.css` | Grade, painéis, rail, mapa de empatia, matriz e rodapé |
| `src/lib/paginateDesk.ts` | Impressão das folhas; oficinas são páginas fixas |
| `scripts/build-pdf.ts` | Build e impressão em PDF |

## Modelo de conteúdo

Cada oficina é um JSON com um `variant`:

- `case`: dois campos de contexto, decisão do grupo com três perguntas e orientação.
- `profile`: mapa de empatia, formação e orientação.
- `trajectory`: três etapas × incentivar/limitar/proibir.
- `matrix`: matriz 2 × 2 e orientação.
- `process`: processo escolhido, três colunas e orientação.

O schema em `src/content/schema.ts` rejeita campos faltando, variantes desconhecidas e etapas fora do formato. O `content/document.json` é a única ordem de leitura.

## Pendências

O que ainda depende de você:

1. Confirmar o título, o subtítulo e o ano da publicação.
2. Enviar os logos vetoriais oficiais (CONSED, Vivo, Itaú, FGV, Vozes) — hoje a capa usa uma marca provisória e os apoiadores como texto.
3. Enviar os arquivos de fonte, se quiser substituir a versão Fontsource.
4. Dizer se as caixas em branco devem continuar para preenchimento à mão ou virar campos editáveis no navegador.
5. Revisar o texto transcrito do PDF de origem.

Checklist completo: [docs/ENTRADA-DE-ARQUIVOS.md](docs/ENTRADA-DE-ARQUIVOS.md). Decisões de desenho: [docs/DESIGN-NOTES.md](docs/DESIGN-NOTES.md).

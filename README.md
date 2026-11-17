# IA na educação — Caderno de oficinas

Documento editorial da CONSED feito como site: o conteúdo vive em JSON e MDX, a prévia mostra as folhas A4 paisagem e o PDF é a impressão desse site com o Chromium.

**Título e subtítulo são provisórios.** O material de origem não trazia capa nem nome de publicação; “IA na educação — Caderno de oficinas para as redes estaduais” é o título de trabalho.

## Estado atual

- **Caderno de oficinas — 10 páginas:** 10 folhas de oficina (casos 1A/1B, perfis 2A/2B/2C, oficinas 3.1, 3.2, 4 e casos 5A/5B). O caderno não tem capa.
- **Experiências das Redes de Ensino — 5 páginas:** um roteiro de conversa por convidado (Governança/Rio, Formação/Manaus, Ensino e aprendizagem/Curitiba, Gestão/São Paulo, Infraestrutura e segurança/Fortaleza). Texto transcrito do PDF da editoria, sem acréscimos.
- **Formato:** A4 paisagem, 297 × 210 mm. A impressão usa 303 × 216 mm com 3 mm de sangria.
- **A5:** os roteiros serão impressos em A5 paisagem (redução de 70,7%). Por isso usam corpo de 11,5 pt, que chega a ~8,1 pt no A5.
- **Identidade:** Instrument Sans (Fontsource), azul `#0b5384`, verde `#64e15e` e a paleta gráfica da CONSED.
- **Conteúdo:** oficinas transcritas de `consec_origin.pdf`; roteiros transcritos do PDF enviado pela editoria. Ambos precisam de revisão editorial antes de publicar.
- **Marca:** a marca CONSED no rodapé é uma reconstrução vetorial provisória. Os logos oficiais e os logos dos apoiadores ainda não foram fornecidos em vetor.

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

O seletor no topo alterna entre os dois documentos:

- **Caderno de oficinas:** http://127.0.0.1:5173/
- **Experiências das Redes de Ensino:** http://127.0.0.1:5173/?doc=experiencias

A edição é em arquivos, com o agente: os textos das oficinas ficam em `content/workbook/*.json`; os roteiros de conversa, em `content/roteiros/*.json`.

## PDF

```bash
npm run build
```

Valida o documento, gera o site e imprime `output/document-digital.pdf` (A4 paisagem, sem sangria).

```bash
npm run pdf:print
```

Gera `output/document-print.pdf` (303 × 216 mm, com 3 mm de sangria). Não há marcas de corte, conversão de cor, perfil ICC nem PDF/X.

Para os roteiros de conversa:

```bash
npm run gerar-pdf-experiencias
npm run gerar-pdf-grafica-experiencias
```

Geram `output/experiencias-digital.pdf` e `output/experiencias-print.pdf`.

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` / `visualizar` / `editar` | Prévia em http://127.0.0.1:5173 |
| `npm run build` / `gerar-pdf` | PDF digital A4 paisagem |
| `npm run pdf:print` / `gerar-pdf-grafica` | PDF com sangria |
| `npm run gerar-pdf-experiencias` | PDF digital dos roteiros |
| `npm run gerar-pdf-grafica-experiencias` | PDF dos roteiros com sangria |
| `npm run validate` | Manifestos, JSONs, MDX, assets e geometria |
| `npm run check` | `validate` + TypeScript |
| `npm run test:visual` | Playwright contra o site |

## Estrutura

| Caminho | Papel |
| --- | --- |
| `content/document.json` | Ordem de leitura e metadados do caderno de oficinas |
| `content/document-experiencias.json` | Ordem de leitura e metadados dos roteiros |
| `content/workbook/*.json` | Conteúdo das 10 folhas de oficina |
| `content/roteiros/*.json` | Conteúdo dos 5 roteiros de conversa |
| `src/layouts/WorkbookPage.tsx` | Modelos `case`, `profile`, `trajectory`, `matrix` e `process` |
| `src/layouts/RoteiroPage.tsx` | Modelo `roteiro` (uma folha por convidado) |
| `src/content/schema.ts` | Validação dos manifestos e dos modelos |
| `src/styles/tokens.css` | Página, margens, tipo, cor e espaçamento |
| `src/styles/workbook.css` | Grade, painéis, rail, mapa de empatia, matriz e rodapé |
| `src/styles/roteiro.css` | Cabeçalho, abertura e perguntas dos roteiros |
| `src/lib/paginateDesk.ts` | Impressão das folhas; oficinas e roteiros são páginas fixas |
| `scripts/build-pdf.ts` | Build e impressão em PDF |

## Modelo de conteúdo

Cada oficina é um JSON com um `variant`:

- `case`: dois campos de contexto, decisão do grupo com três perguntas e orientação.
- `profile`: mapa de empatia, formação e orientação.
- `trajectory`: três etapas × incentivar/limitar/proibir.
- `matrix`: matriz 2 × 2 e orientação.
- `process`: processo escolhido, três colunas e orientação.

Cada roteiro de conversa é um JSON com `variant: "roteiro"`:

- `number`, `axis`, `city` e `guests` (nome e cargo) montam o cabeçalho.
- `opening` é a abertura, transcrita do PDF.
- `questions` traz as perguntas numeradas; cada uma pode ter um `followUp` com o rótulo “Se não respondido anteriormente:” e itens `a)`, `b)`, `c)`.

O schema em `src/content/schema.ts` rejeita campos faltando, variantes desconhecidas e etapas fora do formato. Cada documento tem seu próprio manifesto de leitura (`content/document.json` e `content/document-experiencias.json`).

## Pendências

O que ainda depende de você:

1. Confirmar o título, o subtítulo e o ano da publicação.
2. Enviar os logos vetoriais oficiais (CONSED, Vivo, Itaú, FGV, Vozes) — hoje o rodapé usa uma marca provisória.
3. Enviar os arquivos de fonte, se quiser substituir a versão Fontsource.
4. Dizer se as caixas em branco devem continuar para preenchimento à mão ou virar campos editáveis no navegador.
5. Revisar o texto transcrito do PDF de origem.
6. Confirmar a revisão dos 5 roteiros e se a impressão em A5 deve manter o corpo de 8,1 pt (ou dividir cada roteiro em duas páginas para aumentar a letra).

Checklist completo: [docs/ENTRADA-DE-ARQUIVOS.md](docs/ENTRADA-DE-ARQUIVOS.md). Decisões de desenho: [docs/DESIGN-NOTES.md](docs/DESIGN-NOTES.md).

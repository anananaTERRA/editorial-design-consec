# Documentos editoriais da CONSED

Documentos editoriais da CONSED feitos como site: o conteúdo vive em JSON e MDX, a prévia mostra as folhas A4 e o PDF é a impressão desse site com o Chromium. O caderno de oficinas, os roteiros e o cronograma são A4 paisagem; os estudos de caso são A4 retrato. O cronograma é reduzido a fichas A5 na imposição.

**Títulos e subtítulos são provisórios.** O caderno não trazia capa nem nome de publicação; “IA na educação — Caderno de oficinas para as redes estaduais” é o título de trabalho. Os estudos de caso também não trazem capa; o título “Estudos de caso — Governança e infraestrutura” é descritivo.

## Estado atual

- **Caderno de oficinas — 10 páginas:** 10 folhas de oficina (casos 1A/1B, perfis 2A/2B/2C, oficinas 3.1, 3.2, 4 e casos 5A/5B). O caderno não tem capa.
- **Experiências das Redes de Ensino — 5 roteiros + verso:** um roteiro de conversa por convidado (Governança/Rio, Formação/Manaus, Ensino e aprendizagem/Curitiba, Gestão/São Paulo, Infraestrutura e segurança/Fortaleza) e uma página roxa de fechamento. Texto transcrito do PDF da editoria, sem acréscimos.
- **Estudos de caso — 4 páginas:** casos 1A/1B (Governança) e 5A/5B (Infraestrutura e segurança da informação), uma folha A4 retrato por caso. Texto e rodapé transcritos do PDF enviado, sem acréscimos. A folha não tem cabeçalho; a linha do encontro e o identificador do material ficam no rodapé. O PDF de origem não tem capa nem título de publicação; o documento também não inventa esses elementos.
- **Minuto a minuto — 4 fichas A5:** o cronograma dos dois dias de encontro (18 e 19 de novembro), com duas fichas por dia — manhã e tarde, divididas no almoço. Transcrito do planejamento interno da VdE. Sem capa e sem verso.
- **Formato:** caderno e roteiros em A4 paisagem (297 × 210 mm); estudos de caso em A4 retrato (210 × 297 mm). A impressão usa 3 mm de sangria: 303 × 216 mm (paisagem) e 216 × 303 mm (retrato). O cronograma é desenhado no mesmo A4 paisagem e reduzido a A5.
- **A5:** os roteiros serão impressos em A5 paisagem (redução de 70,7%). Por isso usam corpo de 11,5 pt, que chega a ~8,1 pt no A5.
- **Identidade:** Instrument Sans (Fontsource), azul `#0b5384`, verde `#64e15e` e a paleta gráfica da CONSED.
- **Conteúdo:** oficinas transcritas de `consec_origin.pdf`; roteiros e estudos de caso transcritos dos PDFs enviados pela editoria. Todos precisam de revisão editorial antes de publicar.
- **Marca:** a marca CONSED no rodapé é uma reconstrução provisória (arte oficial em PNG, extraída do deck de identidade). Nos roteiros ela aparece sozinha; nos estudos de caso, no início do rodapé. Os logos oficiais e os logos dos apoiadores ainda não foram fornecidos em vetor.

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

O seletor no topo alterna entre os quatro documentos:

- **Caderno de oficinas:** http://127.0.0.1:5173/
- **Experiências das Redes de Ensino:** http://127.0.0.1:5173/?doc=experiencias
- **Estudos de caso:** http://127.0.0.1:5173/?doc=casos
- **Minuto a minuto:** http://127.0.0.1:5173/?doc=cronograma

A edição é em arquivos, com o agente: os textos das oficinas ficam em `content/workbook/*.json`; os roteiros de conversa, em `content/roteiros/*.json`; os estudos de caso, em `content/casos/*.json`; e as fichas do cronograma, em `content/cronograma/*.json`.

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

Para os estudos de caso (A4 retrato):

```bash
npm run gerar-pdf-casos
npm run gerar-pdf-grafica-casos
```

Geram `output/casos-digital.pdf` e `output/casos-print.pdf`. O perfil de impressão tem 216 × 303 mm, com 3 mm de sangria.

Para o cronograma (`Minuto a minuto`) em fichas A5:

```bash
npm run gerar-pdf-cronograma-a5
```

Gera `output/cronograma-digital.pdf` (o desenho em A4 paisagem) e `output/cronograma-a5-frente.pdf`: **2 folhas A4 retrato** com duas fichas A5 cada, mais as cruzes de corte no meio. Corte cada folha na horizontal e ficam quatro fichas: Dia 1 manhã, Dia 1 tarde, Dia 2 manhã e Dia 2 tarde. Não há verso.

Para refazer só a imposição, sem reexportar: `npm run impor-cronograma`. O PDF do cronograma em A4 paisagem, com sangria, sai com `npm run gerar-pdf-grafica-cronograma`.

Para a impressão em A5, com duas páginas por folha A4:

```bash
npm run gerar-pdf-experiencias-a5
```

Gera `output/experiencias-a5-duplex.pdf`: **6 páginas A4 retrato** intercaladas frente/verso — f1, v1, f2, v2, f3, v3. Cada folha leva dois cards A5 paisagem empilhados.

- **Frente:** os cards com marcas de corte em cruz (horizontal e vertical) no meio da folha, a 5 mm da borda lateral, dentro da faixa branca de segurança. As marcas existem só na frente.
- **Verso:** uma arte A4 contínua, sem emenda; o padrão atravessa a linha de corte e cada card recebe um logo no centro. O roxo vai até a borda da folha, além da margem de segurança. A última folha leva um card e deixa a metade de baixo em branco.

Imprima em A4 retrato, **frente e verso**, **virando na borda longa** (long edge), a 100%, sem “ajustar à página”. Depois corte cada folha na horizontal, no meio, usando as marcas da frente.

O verso roxo é a última página do documento (`content/verso/experiencias.json`): fundo `#493975`, grafismos da Vozes em `#8146cb` e assinatura branca centralizada, sem texto. Ele já entra no site e na prévia.

Para exportar **somente as frentes**, em 3 folhas A4 com as cruzes de corte e sem o verso:

```bash
npm run gerar-pdf-experiencias-frente
```

Gera `output/experiencias-a5-frente.pdf`.

Para a impressão, `npm run gerar-verso-duplex` gera a costa A4 (`scripts/verso/duplex.html`): uma única arte cobre a folha inteira, os grafismos atravessam a linha de corte sem emenda e cada card recebe um logo no centro — assim o corte não deixa marca de divisão.

**Margem de segurança:** o conteúdo dos cards começa a 20 mm das laterais e a 11 mm do topo e da base (medidas do desenho A4, reduzidas a A5), então os 5 mm não imprimíveis da impressora ficam em branco e não cortam texto. O roxo do verso chega até a borda; para isso, é preciso uma gráfica com sangria. Na impressora de escritório, o roxo fica com uma borda branca.

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` / `visualizar` / `editar` | Prévia em http://127.0.0.1:5173 |
| `npm run build` / `gerar-pdf` | PDF digital A4 paisagem |
| `npm run pdf:print` / `gerar-pdf-grafica` | PDF com sangria |
| `npm run gerar-pdf-experiencias` | PDF digital dos roteiros |
| `npm run gerar-pdf-grafica-experiencias` | PDF dos roteiros com sangria |
| `npm run gerar-pdf-experiencias-a5` | Exporta e impõe os cards em A5 duplex, 2 por folha A4 |
| `npm run gerar-pdf-experiencias-frente` | Exporta só as frentes, 2 cards por folha A4 |
| `npm run gerar-verso-duplex` | Gera as costas A4 contínuas (dois cards e um card) |
| `npm run gerar-pdf-casos` | PDF digital dos estudos de caso, A4 retrato |
| `npm run gerar-pdf-grafica-casos` | PDF dos estudos de caso com sangria |
| `npm run gerar-pdf-cronograma` | PDF digital do cronograma, A4 paisagem |
| `npm run gerar-pdf-grafica-cronograma` | PDF do cronograma com sangria |
| `npm run gerar-pdf-cronograma-a5` | Exporta e impõe as 4 fichas A5, 2 por folha A4 |
| `npm run impor-cronograma` | Refaz só a imposição das fichas A5 |
| `npm run validate` | Manifestos, JSONs, MDX, assets e geometria |
| `npm run check` | `validate` + TypeScript |
| `npm run test:visual` | Playwright contra o site |

## Estrutura

| Caminho | Papel |
| --- | --- |
| `content/document.json` | Ordem de leitura e metadados do caderno de oficinas |
| `content/document-experiencias.json` | Ordem de leitura e metadados dos roteiros |
| `content/document-casos.json` | Ordem de leitura e metadados dos estudos de caso |
| `content/document-cronograma.json` | Ordem de leitura e metadados do cronograma |
| `content/workbook/*.json` | Conteúdo das 10 folhas de oficina |
| `content/roteiros/*.json` | Conteúdo dos 5 roteiros de conversa |
| `content/casos/*.json` | Conteúdo dos 4 estudos de caso |
| `content/cronograma/*.json` | Conteúdo das 4 fichas do cronograma |
| `src/layouts/WorkbookPage.tsx` | Modelos `case`, `profile`, `trajectory`, `matrix` e `process` |
| `src/layouts/RoteiroPage.tsx` | Modelo `roteiro` (uma folha por convidado) |
| `src/layouts/CasoPage.tsx` | Modelo `caso` (uma folha A4 retrato por caso) |
| `src/layouts/CronogramaPage.tsx` | Modelo `cronograma` (uma ficha por metade do dia) |
| `src/content/schema.ts` | Validação dos manifestos e dos modelos |
| `src/styles/tokens.css` | Página, margens, tipo, cor e espaçamento |
| `src/styles/workbook.css` | Grade, painéis, rail, mapa de empatia, matriz e rodapé |
| `src/styles/roteiro.css` | Cabeçalho, abertura e perguntas dos roteiros |
| `src/styles/caso.css` | Folha retrato, cabeçalho corrido, colunas e decisão dos casos |
| `src/styles/cronograma.css` | Cabeçalho, trilha de horários e entradas das fichas A5 |
| `src/lib/paginateDesk.ts` | Impressão das folhas; oficinas, roteiros, casos e cronograma são páginas fixas |
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

Cada estudo de caso é um JSON com `variant: "caso"`:

- O manifesto `content/document-casos.json` traz o `masthead` (`eyebrow`, `note`, `footer`) impresso em todas as folhas.
- `number`, `axis` e `title` montam a etiqueta, o eixo temático e o título da folha.
- `descriptor` é a linha de território e rede.
- `lead` é a cena de abertura, em corpo maior.
- `sections` traz o título da seção e seus parágrafos, diagramados em duas colunas.
- `decision` fecha o caso, destacado no pé do texto.

Cada ficha do cronograma é um JSON com `variant: "cronograma"`:

- `day`, `part`, `weekday` e `date` montam o cabeçalho (o dia no círculo, a parte do dia como título, a data à direita).
- `entries` traz os blocos na ordem do dia: `start`, `end`, `duration` (em minutos), `kind`, `title` e, quando houver, `label`, `method`, `subtitle`, `description`, `intro`, `items`, `paragraphs`, `host` e `note`.
- Os horários do fim e a duração aparecem juntos na trilha da esquerda; quem conduz fica à direita do título.
- As pausas e o almoço usam `kind: "pausa"` e viram faixas cinza.

O schema em `src/content/schema.ts` rejeita campos faltando, variantes desconhecidas e etapas fora do formato. Cada documento tem seu próprio manifesto de leitura (`content/document.json`, `content/document-experiencias.json`, `content/document-casos.json` e `content/document-cronograma.json`).

## Pendências

O que ainda depende de você:

1. Confirmar o título, o subtítulo e o ano da publicação.
2. Enviar os logos vetoriais oficiais (CONSED, Vivo, Itaú, FGV, Vozes) — hoje o rodapé usa uma marca provisória.
3. Enviar os arquivos de fonte, se quiser substituir a versão Fontsource.
4. Dizer se as caixas em branco devem continuar para preenchimento à mão ou virar campos editáveis no navegador.
5. Revisar o texto transcrito do PDF de origem.
6. Confirmar a revisão dos 5 roteiros e se a impressão em A5 deve manter o corpo de 8,1 pt (ou dividir cada roteiro em duas páginas para aumentar a letra).
7. Revisar os 4 estudos de caso e confirmar se o formato A4 retrato e a divisão em duas colunas atendem à leitura prevista.
8. Revisar as 4 fichas do cronograma: confirmar os horários, os responsáveis marcados como “A definir” e se a coluna de insumos precisa voltar (hoje ela não é impressa para manter a ficha legível).

Checklist completo: [docs/ENTRADA-DE-ARQUIVOS.md](docs/ENTRADA-DE-ARQUIVOS.md). Decisões de desenho: [docs/DESIGN-NOTES.md](docs/DESIGN-NOTES.md).

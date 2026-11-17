# Decisões de desenho

## Origem do material

- `consec_identidadevisual.pdf`: deck de 16 slides da CONSED, 16:9, com Instrument Sans, paleta gráfica, arcos e círculos, réguas em gradiente e rodapé com marca + número.
- `consec_cores.svg`: paleta exportada em vetor.
- `consec_origin.pdf`: 10 páginas em A3 paisagem, sem texto extraível (texto em curvas). O conteúdo foi recuperado por OCR e conferido página a página.

## Tradução para A4 paisagem

O original é A3 (420 × 300 mm). Reduzir 0,707 levaria o corpo a ~7 pt. Em vez de escalar, a diagramação foi refeita em A4 (297 × 210 mm), com:

- margens 11 mm (topo/base) e 12 mm (laterais);
- rail de 54 mm para o “Passo a passo”;
- coluna principal de 215 mm;
- corpo 8,5 pt, rail 6,9 pt, títulos de página 23 pt;
- uma folha de origem por folha A4, sem repaginar o conteúdo.

Cada oficina é uma página fixa (`data-paginate="off"`): o paginador não corta nem cria continuação. Se o texto crescer, o rail ou os painéis precisam ser ajustados no desenho, não empurrados para outra folha.

## Identidade aplicada

| Elemento | Decisão |
| --- | --- |
| Fonte | Instrument Sans (400/500/600/700), via Fontsource |
| Azul de texto | `#0b5384` |
| Verde de destaque | `#64e15e` |
| Apoio | `#008ff1`, `#3ec1d2`, `#c3e11d`, `#edd62d`, `#e5822b`, `#e5472b`, `#9150d8`, `#e441b0`, `#ff6f95` |
| Régua | gradiente verde → turquesa → azul |
| Numeração | círculos verdes com número azul nos painéis; círculos azuis no rail |
| Fundo | branco com arcos muito claros no canto direito, como nas páginas de conteúdo do deck |
| Rodapé | marca + régua em gradiente + nome do caderno + fólio |

A capa usa uma composição de arcos construída em SVG, inspirada na capa do deck. A marca CONSED é uma reconstrução provisória: o arquivo vetorial oficial ainda não foi fornecido.

## Modelos

| Origem | Modelo | Conteúdo |
| --- | --- | --- |
| p. 1 | `case` | Caso 1A — A proposta de parceria |
| p. 2 | `case` | Caso 1B — A adesão ao programa estadual |
| p. 3 | `profile` | Perfil A — Técnico(a) da secretaria |
| p. 4 | `profile` | Perfil B — Gestor(a) escolar |
| p. 5 | `profile` | Perfil C — Professor(a) |
| p. 6 | `trajectory` | Oficina 3.1 — A trajetória do estudante |
| p. 7 | `matrix` | Oficina 3.2 — A IA no trabalho do educador |
| p. 8 | `process` | Oficina 4 — A IA em um processo de gestão |
| p. 9 | `case` | Caso 5A — A planilha na conta pessoal |
| p. 10 | `case` | Caso 5B — O letramento em IA nos anos finais |

O documento **Experiências das Redes de Ensino** usa um modelo próprio:

| Origem | Modelo | Conteúdo |
| --- | --- | --- |
| PDF da editoria | `roteiro` | 5 roteiros de conversa (Rio, Manaus, Curitiba, São Paulo, Fortaleza) |

## Roteiros de conversa (A5)

O PDF da editoria (`_entrada/conteudo/experiencias-redes-ensino.pdf`) traz 5 roteiros em A4 retrato, com corpo de ~9 pt. Reduzidos a A5, ficariam com ~6,4 pt. Em vez de reproduzir o retrato, o conteúdo foi recomposto em A4 paisagem:

- uma folha por convidado, fixa, sem repaginação;
- título 30 pt, abertura 14 pt, perguntas 11,5 pt — em A5, ~21 pt, ~9,9 pt e ~8,1 pt;
- margens laterais de 20 mm (o caderno usa 12 mm) e coluna de perguntas de 175 mm, para encurtar a linha e manter digital e impressão iguais;
- cabeçalho com número e eixo à esquerda e cidade/convidados à direita; eixos longos podem ocupar duas linhas;
- duas colunas: abertura à esquerda, perguntas à direita;
- blocos “Se não respondido anteriormente:” em azul, menores, com mais espaço antes da pergunta seguinte;
- entrelinha aberta (1,46 nas perguntas) e sem hifenização, para leitura rápida em A5;
- nenhum texto novo: só o conteúdo do PDF, com os rótulos `ABERTURA` e `PERGUNTAS`;
- fundo com arcos discretos da identidade, no canto superior direito.

Páginas com menos perguntas (São Paulo) ficam com mais ar. É consequência do texto curto e do corpo grande, não de conteúdo faltando. Se a editoria preferir ocupar essa área, o caminho é dividir o roteiro em duas páginas (abertura + perguntas) ou aumentar o corpo, não encolher a fonte.

## O que é provisório

- Título, subtítulo e ausência de ano.
- Marca CONSED: raster oficial recortado do deck de identidade (`_entrada/marca/consec_identidadevisual.pdf`, imagem 184 × 184 px, fundo transparente), salvo em `src/assets/consec-marca.png` (180 × 180). Não existe vetor no material recebido. No rodapé a marca é impressa a 8 mm, o que dá ~570 dpi; o limite seguro desse arquivo é ~15 mm a 300 dpi. Para usar a marca maior que isso (capa, cartaz), pedir o vetor à CONSED. Os logos de apoio continuam em texto.
- Fontes via Fontsource; podem ser trocadas pelos arquivos licenciados.
- Campos de “Grupo / Relator(a)” e as caixas de resposta são impressos em branco; não há inputs.
- Texto transcrito por OCR; precisa de revisão editorial.

## O que não foi herdado do projeto Vozes

Nada de `vozes.css`, componentes `Vozes*`, importadores do Mapeamento, grafismos ou regras de paginação amarradas a páginas específicas. O núcleo é React + MDX + Chromium, com um modelo `workbook` novo.

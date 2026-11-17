# Editar com o agente

Você não precisa mexer em código. Peça em português, como faria para uma pessoa da equipe. O agente edita os arquivos e a prévia atualiza sozinha em http://127.0.0.1:5173.

## Exemplos de pedido

**Trocar um texto**

> Na oficina 1A, troque o subtítulo por: …

**Cortar sem mexer no desenho**

> Encurte o texto do “Passo a passo” da oficina 3.2. Não mude os painéis, os tempos nem a posição das caixas.

**Ajustar um tempo**

> A etapa “A decisão do grupo” passa a ter 25 minutos. Atualize também o tempo no painel.

**Acrescentar uma oficina**

> Crie uma oficina nova depois do caso 5B, no mesmo modelo da oficina 1A, com o título “…” e os campos “…”.

**Mudar uma pergunta**

> Na caixa “Três perguntas para testar a escolha”, troque a pergunta de equidade por: …

**Pedir uma página nova**

> Preciso de uma página de abertura para a oficina 4, com o título grande e uma citação. Use a identidade da CONSED.

**Editar um roteiro de conversa**

> No roteiro da Havila (Manaus), troque a pergunta 5 por: …

> No roteiro da Juliana (São Paulo), acrescente uma pergunta depois da 3: …

Os roteiros ficam em `content/roteiros/*.json` e abrem em http://127.0.0.1:5173/?doc=experiencias. A página roxa de fechamento é fixa e fica em `content/verso/experiencias.json`.

**Editar um estudo de caso**

> No caso 1A (Capital A), troque o trecho “…” por: …
>
> No caso 5B, o fecho da decisão passa a ser: …

Os estudos de caso ficam em `content/casos/*.json` e abrem em http://127.0.0.1:5173/?doc=casos. São folhas A4 retrato, uma por caso.

## O que o agente precisa saber

- O conteúdo das oficinas fica em `content/workbook/*.json`.
- O conteúdo dos roteiros fica em `content/roteiros/*.json`.
- O conteúdo dos estudos de caso fica em `content/casos/*.json`.
- A ordem das páginas fica em `content/document.json` (oficinas), `content/document-experiencias.json` (roteiros) e `content/document-casos.json` (estudos de caso).
- A identidade (cores, fontes, margens) fica em `src/styles/tokens.css`.
- O PDF só é gerado quando você pedir (“gerar o PDF”, “fechar a versão para a gráfica”).

## Cuidados

- Diga se o texto é **final** ou **rascunho**.
- Diga se pode cortar conteúdo ou se o tamanho precisa ser preservado.
- Se uma oficina estiver “quase cabendo”, peça o ajuste de texto antes de mexer no layout.
- O texto atual foi transcrito de PDF; revise antes de publicar.
- A marca CONSED no rodapé é provisória até o arquivo vetorial oficial chegar.

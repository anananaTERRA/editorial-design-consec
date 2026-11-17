# Editar a apresentação

A apresentação **Uso e Governança de IA nas Redes** (38 slides) não é diagramada como as oficinas, os roteiros e os casos. Ela já existe em PowerPoint e volta em PowerPoint: o arquivo original é preservado e só as páginas que você mandar mudar são reescritas.

O arquivo de trabalho fica em `_entrada/conteudo/formacao-ia.pptx`. Ele não é alterado. Cada rodada gera uma cópia em `output/formacao-ia.pptx`.

## Como pedir

Fale por página, como faria para uma pessoa da equipe:

> No slide 3, troque “Agenda da manhã” por “Agenda do primeiro dia”.

> No slide 14, o texto do passo “A decisão do grupo” passa a terminar em “quem responderá pela decisão”.

> No slide 12, o título “Como vamos trabalhar?” vira “Como as oficinas funcionam”.

> Tire o slide 11 e me diga se sobrou algum tempo errado na agenda.

Se preferir, mande o número do comentário do PowerPoint (a Vanessa deixou 15 comentários no arquivo, nos slides 1, 3, 4, 5, 6, 7, 8, 12, 13, 14, 18, 24, 27, 32 e 36).

## O que eu garanto

- Os slides que você não pediu saem **iguais**, byte a byte. O fecho de cada rodada mostra quantas partes do arquivo ficaram intactas.
- Notas do apresentador, comentários, imagens, fontes embutidas e transições continuam onde estão.
- Se um trecho que você mandou trocar não for encontrado exatamente como escrito, a rodada para e me avisa em vez de adivinhar.

## O que muda de tratamento

Trocar texto é simples e seguro. **Redesenhar** um slide é outro trabalho: um diagrama novo, um template de mesa diferente, uma página de pausa mais limpa. Nesse caso eu desenho o slide em formas nativas do PowerPoint, para o texto continuar editável, e digo antes quanto isso custa em tempo.

## Conferir

Depois de cada rodada:

- `npm run apresentacao:previa` gera um PDF e uma folha de contato com todos os slides em `output/formacao-ia/previa/`.
- `npm run apresentacao:conferir` monta o arquivo e já abre a prévia.
- `npm run apresentacao:abrir` lista o que há em cada slide: texto, formas, imagens, notas e comentários.

O slide 38 (paleta de cores) está oculto no arquivo original, então ele não aparece na prévia.

## A fonte da prévia

A prévia só mostra o desenho certo se a **Instrument Sans** estiver instalada na máquina. Cada peso do arquivo é uma família separada:

- `Instrument Sans`
- `Instrument Sans Medium`
- `Instrument Sans SemiBold`

Instale os `.ttf` (Regular, Itálico, Negrito e Negrito Itálico de cada uma) em `~/Library/Fonts`. Sem isso o LibreOffice troca tudo por uma serifa: a diagramação parece errada e não está.

Se a prévia abrir com serifa, é isso que aconteceu. O comando avisa quando não encontra a fonte.

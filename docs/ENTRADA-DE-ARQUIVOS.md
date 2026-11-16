# O que enviar e onde colocar

Coloque os arquivos em `_entrada/`. A pasta fica fora do git até a triagem.

## Status

| Item | Status | Onde está |
| --- | --- | --- |
| Manual de identidade (deck CONSED) | Recebido | `_entrada/marca/consec_identidadevisual.pdf` |
| Paleta em SVG | Recebido | `_entrada/marca/consec_cores.svg` |
| Documento de origem (10 páginas) | Recebido | `_entrada/conteudo/consec_origin.pdf` |
| Texto do original (OCR) | Recebido | `_entrada/conteudo/consec_origin-ocr.txt` |
| Logo CONSED em vetor | **Pendente** | — |
| Logos de apoio em vetor | **Pendente** | — |
| Arquivos de fonte | **Pendente (opcional)** | — |
| Título/subtítulo/ano finais | **Pendente** | — |
| Revisão do texto transcrito | **Pendente** | — |

Enquanto os logos não chegam, a capa usa uma reconstrução vetorial da marca CONSED e os apoiadores como texto. Não trate essa marca como o arquivo oficial.

## O que ainda é necessário

### 1. Marca

- Logo CONSED em SVG, AI, EPS ou PDF, com versão monocromática e versão para fundo escuro.
- Logos de Fundação Telefônica Vivo, Fundação Itaú, Itaú Social, FGV DGPE e Vozes da Educação, em vetor.
- Se existir, o manual de marca em PDF com regras de uso (o deck recebido é um template, não um manual).

### 2. Fontes

O projeto usa Instrument Sans via Fontsource (SIL OFL). Se a instituição tiver os arquivos licenciados:

- `woff2` ou `otf` de cada peso usado (400, 500, 600, 700);
- licença ou confirmação de uso em PDF e site.

### 3. Conteúdo

- Texto revisado das 10 oficinas. O PDF de origem tem o texto em curvas; a transcrição atual veio de OCR.
- Confirmar se os títulos das oficinas, tempos e enunciados estão exatos.
- Se houver casos, perfis ou etapas que não estão no PDF, enviar em DOCX ou Markdown.
- Imagens, se forem entrar nas páginas (hoje o caderno é só tipográfico).

### 4. Decisões editoriais

- Título, subtítulo e ano da publicação.
- Se as caixas em branco continuam para preenchimento à mão ou viram campos editáveis no navegador.
- Se o caderno terá página de créditos/expediente, sumário ou contracapa.
- Se a impressão será frente e verso (isso afeta a posição do fólio).
- Se a gráfica exige sangria, marcas de corte ou perfil de cor específico.

## Estrutura da pasta

```
_entrada/
  marca/
    consec_identidadevisual.pdf
    consec_cores.svg
    logo/                 (SVG, AI, EPS ou PDF; versões mono)
    apoiadores/           (logos em vetor)
  fontes/
    instrument-sans/      (woff2 ou otf + licença)
  conteudo/
    consec_origin.pdf
    consec_origin-ocr.txt
    revisao/              (DOCX ou Markdown com o texto final)
  referencias/
    capa.pdf
    miolo.pdf
```

## Depois da triagem

1. Substituir a marca provisória e os nomes dos apoiadores.
2. Trocar a fonte, se os arquivos chegarem.
3. Revisar o texto de cada JSON em `content/workbook/`.
4. Confirmar a capa e o número de páginas.
5. Gerar o PDF digital e o de sangria.

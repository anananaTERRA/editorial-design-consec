# Prévia e PDF

O documento é um site. A prévia é esse site. O PDF é a impressão dele, gerada só quando for preciso.

## Ver o documento

```bash
npm run dev
```

Abra **http://127.0.0.1:5173**. Cada seção é uma folha A4. O caderno e os roteiros são paisagem; os estudos de caso são retrato. Salvar atualiza na hora.

`npm run visualizar` e `npm run editar` abrem o mesmo site.

O seletor no topo leva aos três documentos: caderno (`/`), roteiros (`/?doc=experiencias`) e estudos de caso (`/?doc=casos`).

## PDF final

```bash
npm run build
```

Valida o documento, gera o site e grava `output/document-digital.pdf` (297 × 210 mm). Na primeira vez, pode ser necessário instalar o navegador:

```bash
npx playwright install chromium
```

Para a versão com sangria: `npm run pdf:print` → `output/document-print.pdf` (303 × 216 mm, sem marcas de corte).

## Resumo

| Objetivo | Comando | Destino |
| --- | --- | --- |
| Prévia (site) | `npm run dev` | http://127.0.0.1:5173 |
| PDF digital | `npm run build` | `output/document-digital.pdf` |
| PDF com sangria | `npm run pdf:print` | `output/document-print.pdf` |
| PDF dos casos | `npm run gerar-pdf-casos` | `output/casos-digital.pdf` (A4 retrato) |
| PDF dos casos com sangria | `npm run gerar-pdf-grafica-casos` | `output/casos-print.pdf` (216 × 303 mm) |

# Prévia e PDF

O documento é um site. A prévia é esse site. O PDF é a impressão dele, gerada só quando for preciso.

## Ver o documento

```bash
npm run dev
```

Abra **http://127.0.0.1:5173**. Cada seção é uma folha A4 paisagem. Salvar atualiza na hora.

`npm run visualizar` e `npm run editar` abrem o mesmo site.

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

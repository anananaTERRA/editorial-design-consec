# Origem da marca CONSED

`consec-marca.png` (180 × 180, RGBA) foi recortada da arte oficial que existe no
material recebido — não há vetor no projeto.

- Fonte: `_entrada/marca/consec_identidadevisual.pdf`, imagem `Image15` das páginas 6–16
  (184 × 184 px, RGBA).
- Tratamento: recorte na caixa do canal alfa e centralização num quadrado
  transparente, para a arte não ficar deslocada dentro da caixa.

Como reproduzir:

```bash
python3 - <<'PY'
from pypdf import PdfReader
from PIL import Image
r = PdfReader('_entrada/marca/consec_identidadevisual.pdf')
img = r.pages[5].images[2].image            # Image15
bbox = img.split()[3].getbbox()
art = img.crop(bbox)
side = max(art.size)
out = Image.new('RGBA', (side, side), (0, 0, 0, 0))
out.paste(art, ((side - art.width) // 2, (side - art.height) // 2))
out.save('src/assets/consec-marca.png')
PY
```

Limite de uso: ~15 mm de altura/serviço a 300 dpi (o arquivo tem 180 px).
Acima disso, pedir o vetor à CONSED e substituir este arquivo — o componente
`ConsedLogo` já consome esse caminho.

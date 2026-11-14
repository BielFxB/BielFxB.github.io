# Gabriel's World

Portfólio estático e interativo inspirado na web pessoal dos anos 2000. HTML, CSS, JavaScript e ilustrações SVG originais. Sem dependências de execução e sem imagens carregadas de sites de terceiros.

## Abrir

Abra `dist/index.html` no navegador. Para servir via HTTP, execute na pasta deste projeto:

```powershell
python -m http.server 4173 --directory dist --bind 127.0.0.1
```

Acesse http://127.0.0.1:4173. Encerre o servidor com Ctrl+C.

## Personalizar

Edite `dist/profile.js` para atualizar apresentação, experiências, formação, habilidades, links e projetos. O e-mail fica ausente enquanto não for informado. Os dados exibidos foram fornecidos pelo proprietário; não foram inventadas métricas ou experiências. DiscoFinance e Sistema de Aula de Robótica não foram destacados por ainda faltar detalhamento da contribuição individual.

## Interações

- Portal cósmico com acesso direto ao currículo.
- Cinco seções com links próprios (`#inicio`, `#sobre`, `#projetos`, `#curriculo`, `#contato`).
- Currículo com impressão e exportação para PDF pelo navegador.
- Visitante verde que anda pela tela, para ao receber foco ou hover e conversa ao clicar.
- Livro de visitas local: nomes ficam apenas no navegador atual; não há envio ou armazenamento em servidor.
- Máquina de sinais com arte generativa.
- Controle de efeitos com persistência local e respeito à preferência de movimento reduzido.
- Segredo de teclado: cima, cima, baixo, baixo, esquerda, direita, esquerda, direita, B, A.

## Validação

Verificado no Microsoft Edge com Playwright: cinco rotas em desktop e celular (390px), ausência de rolagem horizontal, currículo em PDF, contatos, diálogos, visitante, livro de visitas, persistência, renderização segura de texto e controles de movimento. O script `qa.cjs` usa Playwright da pasta de verificação `../.qa` e gera capturas locais.

## Referências de direção visual

- https://www.cameronsworld.net/ — colagem pessoal, selos e detalhes de descoberta.
- https://feelingmachine.moe/ — composição escura, tipografia e painéis de homepage.
- https://ransei.neocities.org/ — entrada cósmica com controle de efeitos.
- https://sol-net.neocities.org/projects/walk — conceito de personagem que passeia e conversa.

Código e ilustrações são próprios, sem copiar personagens, artes ou textos dessas referências.

## Publicação

Hospedagem pelo GitHub Pages no repositório `BielFxB/BielFxB.github.io`. O workflow `.github/workflows/pages.yml` valida o JavaScript e publica o conteúdo de `dist/` automaticamente a cada push na branch `main`. A origem de publicação em Settings → Pages deve ser GitHub Actions.

Endereço configurado: https://bielfxb.github.io/

Para atualizar conteúdo, edite `dist/profile.js`, faça commit e envie para `main`. Acompanhe a publicação na aba Actions do repositório. Arquivos locais de verificação e configuração do Sites são ignorados pelo Git.

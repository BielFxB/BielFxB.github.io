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
- Livro de visitas compartilhado com Supabase: nome e data ficam públicos; as três assinaturas mais recentes aparecem no site.
- Máquina de sinais com arte generativa.
- Controle de efeitos com persistência local e respeito à preferência de movimento reduzido.
- Segredo de teclado: cima, cima, baixo, baixo, esquerda, direita, esquerda, direita, B, A.

## Configurar o livro de visitas

1. Crie ou selecione um projeto no [Supabase](https://supabase.com/dashboard).
2. Abra **SQL Editor**, cole o conteúdo de `supabase/guestbook.sql` e execute. O script cria a tabela, ativa RLS e permite apenas duas funções públicas: listar as três últimas visitas e assinar com nome validado. Visitantes não têm acesso direto à tabela, nem permissão para editar ou excluir registros.
3. Em **Settings → API Keys**, copie a chave **publishable** (ou `anon` legada). Copie também a URL do projeto na área de conexão/Data API.
4. Preencha `url` e `publishableKey` em `dist/guestbook-config.js`. Esse arquivo é público por intenção; nunca use uma chave `secret` ou `service_role`.
5. Abra o site via HTTP e teste a assinatura em dois navegadores. Publique os arquivos pelo fluxo normal do GitHub Pages.

Sem configuração válida, o formulário fica desabilitado com um aviso. Não há fallback local que simule um envio bem-sucedido. Os nomes antigos em `localStorage` não são enviados ao banco automaticamente. Novas assinaturas ficam visíveis aos outros visitantes ao abrir/recarregar a página.

Proteção básica aplicada no banco: até 10 assinaturas por minuto no total e uma por nome (sem diferenciar maiúsculas) a cada 24 horas. Não exige login e não identifica pessoas; alguém pode trocar de nome. Para resistir a ataques automatizados, será necessário adicionar CAPTCHA validado em uma Edge Function. Não há CAPTCHA nesta versão.

Para moderar, use o Table Editor do Supabase e exclua entradas indesejadas. Informe aos visitantes que o nome ficará público; não peça dados sensíveis.

## Validação

A integração do livro de visitas foi verificada no Microsoft Edge com Playwright e API simulada: configuração ausente, lista vazia, envio, renderização segura de texto, data, leitura em dois contextos independentes, limite de envio, falha de rede, recuperação e ausência de rolagem horizontal em 390px. Execute `node ../.qa/guestbook-test.cjs` na pasta do projeto para repetir essa verificação local com API simulada (independente da configuração real).

Em 17/11/2026, a conexão real com Supabase também foi validada: leitura, assinatura pelo formulário, persistência após recarregar, leitura em outro contexto de navegador, bloqueio de assinatura repetida, rejeição de nome vazio e bloqueio de leitura direta da tabela. Uma assinatura pública identificada como teste foi criada para verificar o envio. A publicação dos arquivos no GitHub Pages é uma etapa separada.

Verificações anteriores do restante do site cobriram cinco rotas em desktop e celular, currículo em PDF, contatos, diálogos, visitante e controles de movimento. O script antigo `qa.cjs` ainda contém expectativas do livro local e não valida esta integração.

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

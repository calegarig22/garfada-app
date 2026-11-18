# Design system — Garfada

**Regra de ouro:** nunca escreva uma cor, fonte ou tamanho solto no código. Use o token (o nome).
Todos os tokens moram em `src/app/globals.css`.

## Direção: "Feira & boteco"
Letreiro pintado à mão, piso de ladrilho hidráulico e plaquinha de preço de feira.
Escolhida em 14/11/2026 para fugir do visual "padrão de IA" (fundo creme + serifa + vinho).
As fotos de comida são a estrela; a interface é firme e direta em volta.
**Uma ousadia só:** a plaquinha amarela. Ela é a única coisa torta e escrita à mão no app.

## Cores (classe Tailwind → uso)
| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `bg` | `#F3F5F1` branco-azulejo | `#0E1712` | fundo da tela (frio de propósito, não creme) |
| `surface` | `#FFFFFF` | `#16231B` | campos, cartões |
| `surface-sunken` | `#E6EBE4` | `#1F2E25` | blocos de aviso |
| `border` | `#D3DBD2` | `#2D3F33` | bordas de campo, divisórias leves |
| `text` | `#14201A` tinta | `#EDF2EC` | texto, linhas fortes (cabeçalho, barra de abas) |
| `text-muted` | `#55625A` | `#9DAAA1` | texto secundário |
| `primary` | `#C8321F` vermelho-tomate | `#F0604B` | botão principal, ações |
| `accent` | `#1E5A3C` verde-garrafa | `#133A27` | faixa do topo, ícones de tela vazia |
| `tag` | `#F5C431` amarelo-gema | igual | **somente** a plaquinha de nota |
| `star` | `#A77208` | `#F5C431` | estrelinhas pequenas de nota |
| `nav-active` | `#F5C431` | igual | fundo do ícone da aba ativa |
| `danger` | `#A61B12` | `#FF7A6B` | erros (sempre com a faixa à esquerda) |

Pares texto/fundo passam no contraste AA (4,5:1).

## Tipografia
- **Big Shoulders** (classe `letreiro`): títulos e nomes, sempre em CAIXA ALTA, condensada e apertada.
  Também nos botões principais.
- **Schibsted Grotesk** (`font-sans`, padrão): todo o resto.
- **Permanent Marker** (`font-marker`): pincel atômico. **Só** dentro da plaquinha.
- Escala: 11 (rótulo da aba) · 14 · 16 (texto) · 22 (botão) · 32 (título de tela vazia) · 44 (título da aba) · 68–112 (nome do app no login).

## Espaço, cantos, movimento
- Espaçamentos múltiplos de 4 px.
- Cantos pequenos: `rounded-control` (6 px) em botões e campos, `rounded-card` (10 px) em cartões.
- Campos com borda de 2 px; ao focar, a borda fica verde-garrafa.
- Botão principal tem uma "sombra dura" de 3 px embaixo (como placa) que afunda ao toque.
- Toque: tudo tocável com no mínimo **44 px** de altura.
- Quem liga "reduzir movimento" no celular não vê animações.

## Componentes
- `Plaquinha` / `NotaPlaquinha` (`src/components/plaquinha.tsx`) — a assinatura do app.
  `NotaPlaquinha nota={9}` mostra "4,5★". Usar para a nota de restaurante e de review.
- `Ladrilho` — padrão de ladrilho hidráulico em SVG; usa a cor do texto de quem o contém.
  Só na faixa verde do topo, com opacidade baixa (~9%).
- `AuthShell` — moldura de Entrar e Criar conta (faixa verde + ladrilho + plaquinha).
- `PageHeader` — título da aba em letreiro, com linha forte embaixo.
- `AppNav` — as 4 abas. Celular: barra embaixo; computador (≥1024 px): barra lateral verde
  com o nome do app e o botão "Novo lugar". A aba ativa ganha fundo amarelo-gema.
- `RestaurantCard` / `Cover` — cartão do mosaico (foto, ou placa verde com o tipo de comida).
- `BackHeader` — cabeçalho de tela interna com botão de voltar.
- `StarPicker` — escolher nota com meia estrela (10 opções por baixo).
- `PhotoPicker` — escolher até 4 fotos; comprime no próprio aparelho (WebP, máx. 1600 px).
- `ReviewPost` — avaliação em formato de post: quem, onde, fotos, nota, texto, curtir e comentar.
- `ProfileView` — perfil (o seu e o dos outros): contadores e grade de avaliações.
- `Avatar` — foto da pessoa ou a inicial num círculo verde-garrafa.
- `LikeButton` / `FollowButton` — mudam na hora (otimista) e confirmam com o servidor.
- `SaveControls` — na página do restaurante: Quero ir, Favoritar (até 4) e Listas.
- `CollectionCard` — capa de lista: 1 foto grande + 2 pequenas, nome, quantidade, cadeado se privada.
- `ProfileView` (estilo Letterboxd) — Favoritos (pôsteres 2:3), Atividade recente, Notas (barras), Listas e Avaliações.
- `EmptyState` — ícone em quadrado verde, título em letreiro e frase dizendo o que aparece ali.
- `Field` / `TextInput` / `SubmitButton` / `primaryButtonClass` / `secondaryButtonClass`
  (`src/components/form.tsx`) — campos e botões dos formulários.

## Celular e computador
- Celular é a base. A partir de 1024 px (`lg:`): barra lateral fixa de 256 px, conteúdo até 1152 px.
- Mosaico: 2 colunas no celular, 3 a partir de 768 px, 4 a partir de 1280 px.
- Entrar/Criar conta no computador: tela dividida ao meio (verde | formulário).

## Textos
- Falar do lado de quem usa: "Criar uma conta", "Entrar", nunca termos técnicos.
- Telas vazias dizem o que vai aparecer ali; nada de "Fase 3" ou jargão de desenvolvimento.
- Erros dizem o que aconteceu e como resolver.

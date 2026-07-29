# Painel de Gadgets - Ferramentas Web

Um hub publico de ferramentas web para geracao de documentos, organizacao de tarefas e criacao de provas. Desenvolvido com HTML5, CSS3 e JavaScript puro.

## Ferramentas Disponiveis

### Gerador de Recibo de Servicos
Crie recibos profissionais em PDF com suporte a PF/PJ, tabela dinamica de servicos, consulta automatica de CEP e CNPJ, salvamento de modelos e exportacao em PDF.

### Nota de Valores a Receber
Emita notas de valores com recebiveis, descontos, logo personalizado para empresas, consulta de CEP/CNPJ e exportacao em PDF.

### Checklists & Planner (NOVO)
Duas ferramentas em uma. Modo **Checklist**: crie listas com nome e itens simples (ex: "Preflight", "Checklist de Viagem") para gerar PDF com checkboxes. Modo **Planner**: monte uma semana de Domingo a Sabado com tarefas e horarios opcionais por dia. Adicao rapida de itens com nome e horario. Drag & drop para reordenar. PDFs limpos e profissionais para ambos os modos.

### Criador de Provas (NOVO)
Crie provas personalizaveis para professores e educadores. Cabecalho customizavel com instituicao, professor, disciplina, data e valor. Tipos de questoes: discursiva, verdadeiro/falso, multipla escolha, lacuna e correspondencia. Organize por secoes com instrucoes proprias. Gere PDF da prova e do gabarito separado. Templates prontos para Matematica, Portugues, Ciencias, Historia e Geografia.

### Calculadora Financeira (NOVO)
Simulacoes financeiras completas: juros compostos com tabela de evolucao mensal, juros simples, financiamento pelo sistema SAC com tabela de amortizacao, e simulador de aporte mensal com juros compostos.

### Gerador de Contrato (NOVO)
Crie contratos personalizados com 3 templates prontos: Prestacao de Servicos, Locacao e Acordo de Confidencialidade (NDA). Preencha as partes, objeto, valor, prazo e clausulas adicionais. Visualizacao em tempo real e exportacao em PDF.

### Conversor de Unidades (NOVO)
Converta entre diferentes unidades de medida: comprimento, massa, temperatura, volume, area, velocidade, tempo e armazenamento digital. Interface simples com inversao rapida entre unidades.

### Analisador de Texto (NOVO)
Analise estatisticas completas de qualquer texto: contagem de palavras, caracteres, paragrafos, frases, palavras unicas, tempo de leitura/fala, distribuicao de maiusculas/minusculas/numeros e frequencia de palavras com grafico de barras.

## Como Usar

1. Abra o arquivo `index.html` em qualquer navegador moderno
2. Clique na ferramenta desejada no painel principal
3. Preencha os campos necessarios
4. Clique em "Gerar PDF" para exportar o documento

## Tecnologias

- **HTML5** - Estrutura semantica
- **CSS3** - Design responsivo mobile-first com CSS Grid, Flexbox, variaveis CSS e Dark Mode
- **JavaScript (ES6+)** - Logica sem frameworks
- **PDFMake** - Geracao de PDFs no lado do cliente
- **LocalStorage** - Persistencia de dados no navegador
- **ViaCEP API** - Consulta automatica de enderecos por CEP
- **BrasilAPI** - Consulta automatica de dados de empresas por CNPJ

## Estrutura do Projeto

```
|-- index.html          # Painel principal / hub
|-- style.css           # Estilos compartilhados (com Dark Mode)
|-- utils.js            # Funcoes compartilhadas (mascaras, APIs, toasts, LocalStorage)
|-- recibo.html         # Gerador de Recibo
|-- recibo.js           # Logica do gerador de recibo
|-- nota.html           # Gerador de Nota de Valores
|-- nota_script.js      # Logica do gerador de nota
|-- checklist.html      # Checklists & Tarefas
|-- checklist.js        # Logica do checklist (planner, drag & drop)
|-- prova.html          # Criador de Provas
|-- prova.js            # Logica do criador de provas (questoes, gabarito, templates)
|-- calculadora.html    # Calculadora Financeira
|-- contrato.html       # Gerador de Contrato
|-- conversor.html      # Conversor de Unidades
|-- analisador.html     # Analisador de Texto
```

## Melhorias Implementadas

- **Dark Mode** - Toggle em todas as paginas com persistencia
- **Toast Notifications** - Substitui alerts por notificacoes visuais elegantes
- **Validacao Visual** - Bordas verdes/vermelhas em campos obrigatorios
- **Loading Spinners** - Feedback visual durante consultas de API
- **Atalhos de Teclado** - Ctrl+S para salvar, Ctrl+P para gerar PDF
- **CSS Variables** - Sistema de design consistente com variaveis CSS
- **Animacoes** - Fade-in, slide-in e transicoes suaves
- **Drag & Drop** - Reordenacao de itens e questoes
- **Busca e Filtros** - Dashboard com busca
- **Templates** - Provas com templates prontos por disciplina
- **2 Modos no Checklist** - Checklist PDF simples ou Planner semanal com horarios
- **Calculadora Financeira** - Juros simples, compostos, financiamento SAC e aporte mensal
- **Gerador de Contrato** - Templates de prestacao, locacao e NDA com exportacao PDF
- **Conversor de Unidades** - 8 categorias de conversao com inversao rapida
- **Analisador de Texto** - Estatisticas completas e frequencia de palavras
- **Breakpoint Tablet** - Layout adaptativo em 900px para tablets
- **Inputs Melhorados** - Campos maiores no planner e preview enriquecido do recibo

## Contribuicoes

Contribuicoes sao bem-vindas! Sinta-se a vontade para abrir issues e pull requests.

## Licenca

Projeto de uso livre para fins educacionais e comerciais.

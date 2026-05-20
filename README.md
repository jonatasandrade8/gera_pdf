# Painel de Gadgets - Ferramentas Web

Um hub publico de ferramentas web para geracao de documentos, organizacao de tarefas e criacao de provas. Desenvolvido com HTML5, CSS3 e JavaScript puro.

## Ferramentas Disponiveis

### Gerador de Recibo de Servicos
Crie recibos profissionais em PDF com suporte a PF/PJ, tabela dinamica de servicos, consulta automatica de CEP e CNPJ, salvamento de modelos e exportacao em PDF.

### Nota de Valores a Receber
Emita notas de valores com recebiveis, descontos, logo personalizado para empresas, consulta de CEP/CNPJ e exportacao em PDF.

### Checklists & Tarefas (NOVO)
Organize suas tarefas com checklists totalmente personalizaveis. Inclui visualizacao em lista, calendario mensal e visao semanal (domingo a sabado). Suporte a prioridades (alta/media/baixa), datas de vencimento, notas, drag & drop para reordenar, filtros e busca. Exporte checklists em PDF.

### Criador de Provas (NOVO)
Crie provas personalizaveis para professores e educadores. Cabecalho customizavel com instituicao, professor, disciplina, data e valor. Tipos de questoes: discursiva, verdadeiro/falso, multipla escolha, lacuna e correspondencia. Organize por secoes com instrucoes proprias. Gere PDF da prova e do gabarito separado. Templates prontos para Matematica, Portugues, Ciencias, Historia e Geografia.

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
gera_pdf-main/
|-- index.html          # Painel principal / hub
|-- style.css           # Estilos compartilhados (com Dark Mode)
|-- utils.js            # Funcoes compartilhadas (mascaras, APIs, toasts, LocalStorage)
|-- recibo.html         # Gerador de Recibo
|-- recibo.js           # Logica do gerador de recibo
|-- nota.html           # Gerador de Nota de Valores
|-- nota_script.js      # Logica do gerador de nota
|-- checklist.html      # Checklists & Tarefas
|-- checklist.js        # Logica do checklist (calendario, semanal, drag & drop)
|-- prova.html          # Criador de Provas
|-- prova.js            # Logica do criador de provas (questoes, gabarito, templates)
```

## Melhorias Implementadas

- **Dark Mode** - Toggle em todas as paginas com persistencia
- **Toast Notifications** - Substitui alerts por notificacoes visuais elegantes
- **Validacao Visual** - Bordas verdes/vermelhas em campos obrigatorios
- **Loading Spinners** - Feedback visual durante consultas de API
- **Atalhos de Teclado** - Ctrl+S para salvar, Ctrl+P para gerar PDF
- **CSS Variables** - Sistema de design consistente com variaveis CSS
- **Animacoes** - Fade-in, slide-in e transicoes suaves
- **Drag & Drop** - Reordenacao de tarefas e questoes
- **Busca e Filtros** - Dashboard com busca, checklist com filtros por status/prioridade
- **Templates** - Provas com templates prontos por disciplina

## Contribuicoes

Contribuicoes sao bem-vindas! Sinta-se a vontade para abrir issues e pull requests.

## Licenca

Projeto de uso livre para fins educacionais e comerciais.

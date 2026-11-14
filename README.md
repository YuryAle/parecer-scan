# Parecer Scan

App leve para o acionamento médico: tira foto do **pedido de parecer**, deixa nítido, lê os dados com IA, guarda em **pastas por especialidade** e monta a **planilha do plantão** pronta para colar no Google Sheets (CAMED – Escala de Parecer).

Sem propaganda, sem cadastro, sem loja de apps. Os pareceres ficam salvos **só no celular**.

## Como instalar no celular (Android)

1. Abra o link do app no **Chrome**.
2. Toque nos 3 pontinhos ⋮ → **Adicionar à tela inicial** (ou **Instalar app**).
3. Pronto: vira um ícone como qualquer aplicativo.

## Primeiro uso

Em **Ajustes**:
- Coloque seu nome (vai na coluna COLABORADOR).
- Cole a chave do Gemini ([aistudio.google.com/apikey](https://aistudio.google.com/apikey)) e toque em *Testar chave*.
- Cole as listas de **Especialidades** e **Blocos** exatamente como estão nas listas suspensas da planilha (uma por linha).

## Fluxo

1. **Escanear** → tirar foto → ajustar os cantos → *Continuar*.
2. O app aplica o filtro e a IA preenche paciente, especialidade, bloco e leito. Confira.
3. **Salvar e enviar** → escolha o WhatsApp do médico (vai em PDF ou imagem).
4. No fim do plantão: **Planilha** → *Copiar* → no Google Sheets, clique na 1ª célula vazia da coluna **DATA** e cole com **Ctrl+Shift+V**.

Ordem das colunas ao copiar (escolha em Ajustes → Modelo da planilha):
- **Acionamento Parecer** (padrão): `DATA, HORA, ESPECIALIDADE, MÉDICO, PACIENTE, BLOCO, LEITO, CIENTE, ADMINISTRADOR`
- **CAMED Escala**: `DATA, HORA, PACIENTE, HOSPITAL, BLOCO, LEITO, ESPECIALIDADE, MÉDICO, TIPO, COLABORADOR`

As listas de especialidades, blocos e médicos vêm da planilha PARECER CAMED (aba Cadastro e listas suspensas).

## Privacidade

- Fotos e dados ficam no armazenamento do próprio navegador do celular.
- Com a leitura pelo Gemini ligada, só a **parte de cima** do parecer (cabeçalho) é enviada ao Google. No plano gratuito do Gemini o Google pode usar esse conteúdo para melhorar os produtos; ativando o faturamento no projeto da chave, o uso passa a ser tratado como pago e os dados não são usados para isso.
- Há o modo **"No próprio celular"** (OCR offline), em que nada sai do aparelho.

## Técnica

- HTML + CSS + JavaScript puro, sem build. PWA (funciona offline).
- Recorte em perspectiva, filtro e PDF feitos no próprio aparelho (`js/scan.js`, `js/pdf.js`).
- IndexedDB para os pareceres (`js/db.js`).
- Publicado pelo GitHub Pages (`.github/workflows/pages.yml`) a cada push na `main`.

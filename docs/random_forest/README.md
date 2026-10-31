# Random Forest — Heart Failure (comparação com a Árvore de Decisão)

Esta pasta reúne **tudo que foi gerado** na etapa do Random Forest: notebook executado, resultados, figuras, relatório (Markdown/DOCX/PDF/HTML), parâmetros da busca e apresentação HTML. Os experimentos ficam no **mesmo banco MLflow** da etapa da árvore, o que permite comparar as duas abordagens lado a lado.

## Estrutura

```
docs/handle_forest/
├── Random_Forest_Heart_Failure_mlflow.ipynb   # notebook executado (29 células)
├── resultados/execucao_<timestamp>/
│   ├── comparacao_random_forest.csv           # one-hot x ordinal no teste
│   ├── melhores_hiperparametros_random_forest.json
│   ├── ablacao_atributos.csv
│   ├── engenharia_features.csv
│   ├── sensibilidade_n_estimators.csv
│   ├── comparacao_rf_vs_arvore.csv            # tabela consolidada (formato longo)
│   ├── comparacao_codificacao_rf_vs_arvore.csv
│   ├── comparacao_engenharia_rf_vs_arvore.csv
│   ├── comparacao_ablacao_rf_vs_arvore.csv
│   ├── variacoes_random_forest_{onehot,ordinal}.csv
│   ├── importancia_variaveis_rf_*.csv
│   ├── importancia_permutacao_rf_*.csv
│   ├── *.png (matrizes, importâncias, sensibilidade, comparação)
│   └── resultados_random_forest.zip
├── figuras/                    # cópia das figuras usadas no relatório
├── relatorio.md                # fonte do relatório
├── relatorio_formatado.docx    # relatório formatado (capa UFPI/PPGCC, Times, tabelas)
├── relatorio_formatado.docx.pdf
├── relatorio.html              # versão HTML autocontida
├── parametros.md               # documentação da grade e dos valores escolhidos
├── mlflow_runs_random_forest.csv
├── mlflow_runs_arvore_decisao.csv
├── mlruns/                     # artefatos do MLflow deste experimento
└── apresentacao/
    ├── index.html              # 9 slides (10 min) + roteiro de fala e cronômetro
    ├── estilo.css
    ├── script.js
    └── img/
```

## Como reproduzir

```bash
cd "/caminho/para/trabalho"
source .venv/bin/activate

# executa o notebook (≈ 26 min: 864 combinações × 10 folds × 300 árvores, duas codificações)
jupyter nbconvert --to notebook --execute --inplace \
  --ExecutePreprocessor.timeout=7200 \
  docs/handle_forest/Random_Forest_Heart_Failure_mlflow.ipynb
```

O notebook grava resultados em `docs/handle_forest/resultados/execucao_<timestamp>/`, figuras em `docs/handle_forest/figuras/` e runs no experimento `heart_failure_random_forest` (`mlflow.db` na raiz).

## Como comparar com a árvore

```bash
mlflow ui --backend-store-uri sqlite:///mlflow.db
```

Abra <http://127.0.0.1:5000>, selecione os experimentos `heart_failure_random_forest` (26 runs) e `heart_failure_arvore_decisao` (111 runs) e use a aba **Compare** para ver `f1_cv`, `F1_c1`, `F1_macro`, `FN`, `tempo_busca_s` e `oob_score` na mesma tabela.

## Como regerar o relatório

```bash
cd docs/handle_forest
pandoc relatorio.md -f markdown -t docx \
  --reference-doc=<referencia.docx> --resource-path=. -o relatorio_formatado.docx
libreoffice --headless --convert-to pdf relatorio_formatado.docx --outdir .
pandoc relatorio.md -s --css=../estilo_relatorio.css --embed-resources \
  --metadata title="Predição de Doença Cardíaca com Random Forest" -o relatorio.html --resource-path=.
```

A referência usada (`<referencia.docx>`) é a referência padrão do pandoc com tipografia ajustada (Times New Roman 12 pt, 1,5 linhas, página Carta, margens de 2,5 cm). Depois da conversão, as tabelas recebem largura fixa (6,5 pol), fonte de 7,5 pt e larguras de coluna proporcionais ao conteúdo — sem esse ajuste o LibreOffice quebra as tabelas em uma coluna e o documento passa de 40 páginas.

## Resultados principais

| Cenário | F1_c1 árvore | F1_c1 Random Forest | Δ |
|---|---|---|---|
| one-hot | 0,8308 | 0,8932 | +0,0624 |
| ordinal | 0,8387 | 0,8955 | +0,0568 |
| sem engenharia | 0,8387 | **0,9091** | +0,0704 |
| com engenharia | **0,8545** | 0,8558 | +0,0012 |

- Melhor modelo para triagem: Random Forest com os 11 atributos (one-hot, `class_weight=None`) — **7 falsos negativos**, 12 falsos positivos, F1_c1 0,9091.
- Melhor F1_CV: Random Forest one-hot — **0,8809** (árvore: 0,8604).
- A engenharia de features **ajudou a árvore** e **prejudicou a floresta**.
- Na ablação, a floresta venceu nos 12 cenários e é bem menos sensível à remoção de atributos.

Detalhes, tabelas e discussão completa estão em `relatorio_formatado.docx` (24 páginas) e em `apresentacao/index.html`.

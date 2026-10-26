# Heart Failure — Árvore de Decisão com MLflow

Este projeto executa a **Árvore de Decisão** na base
[Heart Failure Prediction (Kaggle)](https://www.kaggle.com/datasets/fedesoriano/heart-failure-prediction),
combinando **tratamento dos dados** e **ajuste de hiperparâmetros** para maximizar
**acurácia, precisão e F1**. Todos os resultados são registrados no **MLflow** para
apoiar a construção do relatório.

## Estrutura

```
trabalho/
├── Arvore_Decisao_Heart_Failure_mlflow.ipynb   # notebook principal
├── Testes_Hiperparametros_Heart_Failure (1).ipynb   # notebook original (intacto)
├── bases/
│   └── heart.csv
├── resultados/
│   └── execucao_<timestamp>/   # uma pasta nova por execução
│       ├── comparacao_arvore_decisao.csv
│       ├── ablacao_atributos.csv
│       ├── engenharia_features.csv
│       ├── melhores_hiperparametros_arvore.json
│       ├── variacoes_*.csv
│       ├── *.png
│       └── resultados_*.zip
├── requirements.txt
├── README.md
├── mlflow.db        # banco SQLite do MLflow (criado na execução)
└── mlruns/          # artefatos do MLflow (criado automaticamente na execução)
```

## 1. Criar o ambiente virtual

Recomendado **Python 3.12** (o ambiente do sistema tem 3.14, que costuma ter menos
wheels prontos para MLflow/scikit-learn).

```bash
cd "/caminho/para/trabalho"
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

## 2. Registrar o kernel (opcional, para o VS Code)

```bash
python -m ipykernel install --user --name heart-failure --display-name "Python (heart-failure)"
```

## 3. Executar o notebook no VS Code

1. Abra `Arvore_Decisao_Heart_Failure_mlflow.ipynb`.
2. Selecione o kernel do ambiente `.venv` (`Python (heart-failure)`).
3. Clique em **Run All**.

Ou pela linha de comando:

```bash
jupyter nbconvert --to notebook --execute --inplace \
  --ExecutePreprocessor.timeout=3600 \
  Arvore_Decisao_Heart_Failure_mlflow.ipynb
```

## 4. Visualizar os resultados no MLflow

```bash
mlflow ui --backend-store-uri sqlite:///mlflow.db
```

Abra <http://127.0.0.1:5000>. O experimento `heart_failure_arvore_decisao` reúne as runs:

- `arvore_onehot` — grade com codificação one-hot;
- `arvore_ordinal` — grade com codificação ordinal;
- `baseline_classe_majoritaria` — referência trivial;
- `ablacao_atributos` — run pai da ablação (runs filhas por atributo removido);
- `engenharia_features` — run pai da comparação com/sem engenharia de features;
- `relatorio_artefatos` — CSVs, JSON, gráficos e ZIP para o relatório.

## 5. Ablação de atributos e desbalanceamento

O notebook inclui uma seção de **ablação** que remove **um atributo por vez** (seleção de
features) e reajusta a árvore com os melhores hiperparâmetros já encontrados (sem
balanceamento). Cada cenário é registrado no MLflow como run filha de `ablacao_atributos`,
e a tabela consolidada (acurácia, precisão, recall e F1 para as duas classes, mais F1 macro) é salva em
`resultados/execucao_<timestamp>/ablacao_atributos.csv`.

A classe majoritária é a **1 (HeartDisease)**, com 55,3% dos registros; o baseline
"chutar a majoritária" tem F1 ≈ 0,71 (recall da majoritária = 1,0 e precisão da
minoritária = 0), então o modelo precisa superar essa referência.

## 6. Engenharia de features

O notebook compara o melhor modelo **sem** e **com** features clínicas derivadas
(`FC_pct_teorica`, `Chol_por_Idade`, `BP_por_Idade`, `Oldpeak_por_FC`, `Angina_x_Oldpeak`).
As razões são calculadas linha a linha (sem vazamento) e entram no pipeline numérico.
Cada cenário é uma run filha de `engenharia_features`, e a tabela é salva em
`resultados/execucao_<timestamp>/engenharia_features.csv` com métricas para as duas classes.

Cada run contém parâmetros (tratamento dos dados + hiperparâmetros), métricas de
validação cruzada e de teste (acurácia, precisão, recall, F1 e IC 95%), o modelo
treinado e artefatos (matriz de confusão, importâncias das variáveis e árvore).

## Observação metodológica

Árvores de decisão são **invariantes a transformações monotônicas** das variáveis,
portanto a padronização (`StandardScaler`) **não altera** as predições. Ela é mantida
no pipeline apenas por padronização; o tratamento que realmente influencia o modelo é
a **imputação** (dos zeros de `Cholesterol` e `RestingBP`) e a **codificação** das
variáveis categóricas. O notebook verifica essa invariância ao final.

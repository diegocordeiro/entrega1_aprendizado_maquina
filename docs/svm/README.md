# SVM — Pima Indians Diabetes

Notebook: `docs/svm/SVM_Pima_Diabetes_mlflow.ipynb`

## O que faz

Aplica **máquinas de vetores de suporte** (`SVC` do scikit-learn) à base `bases/pima-indians-diabetes.csv`, prevendo o diagnóstico de diabetes (`Outcome`: 1 = diabetes, 0 = sem diabetes). O foco do trabalho é **justificar cada transformação de preparação dos dados** e medir o seu efeito. Tudo é registrado no **MLflow** (experimento `pima_svm`).

### Eixos comparados

- **Limpeza:** zeros fisiologicamente impossíveis convertidos em ausentes em Glucose, BloodPressure, SkinThickness, Insulin e BMI — preservando `Pregnancies`, onde zero é legítimo.
- **Imputação:** mediana × média × KNN × descarte das linhas incompletas no treino.
- **Escala:** nenhuma × `StandardScaler` × `MinMaxScaler`.
- **Kernels e hiperparâmetros:** linear, RBF, polinomial e sigmoide, com `C`, `gamma`, `degree` e `class_weight` — 136 combinações por cenário, via `GridSearchCV`.
- **Protocolo de validação:** proporção treino/teste, variabilidade entre partições, reseleção por partição, estratificação e esquema de validação cruzada.
- **Engenharia de atributos:** cinco razões clínicas, medidas por retreino, neutralização, permutação e ablação individual.

## Pontos metodológicos

- **O arquivo não tem cabeçalho.** Os nomes das colunas são atribuídos no notebook; ler com o padrão do pandas perderia um registro.
- **Divisão única.** Todos os cenários de pré-processamento usam a mesma divisão 80/20 estratificada e são avaliados **sobre os mesmos 154 pacientes de teste** — conjuntos de teste diferentes não são comparáveis entre si. Por isso `descarte` não é "outra base": é a decisão de treinar apenas com linhas completas, mantendo a imputação para prever.
- **Variar a partição mede variabilidade, não escolhe a melhor.** Os números de destaque vêm do protocolo de referência (80/20, semente 42); a Fase 6 quantifica o quanto eles oscilam.

## Como executar

```bash
pip install -r requirements.txt     # scikit-learn, pandas, matplotlib, mlflow
```

Abra o notebook e, na primeira célula de código, escolha o `MODO`:

| MODO | Grade | Tempo aproximado* |
|---|---|---|
| `'smoke'` | mínima, só para testar o fluxo | < 1 min |
| `'rapida'` | reduzida, base inteira | 1–2 min |
| `'completa'` | 136 combinações, todas as repetições | 4–11 min |

\* Medido em 2 núcleos (11 min no modo completo); com mais núcleos cai proporcionalmente, pois a busca usa `n_jobs=-1`.

Para inspecionar no MLflow, na raiz do projeto:

```bash
mlflow ui --backend-store-uri sqlite:///mlflow.db
```

## Saídas

Em `docs/svm/resultados/execucao_<data>/`:

- `comparacao_preprocessamento.csv` — resultado principal (12 cenários, mesmo teste).
- `comparacao_kernels.csv`, `baseline.csv`.
- `vies_casos_completos.csv` — análise secundária de viés de seleção.
- `particao_proporcao.csv`, `particao_repeticoes.csv`, `particao_reselecao.csv`, `particao_estratificacao.csv`, `esquema_validacao.csv`.
- `engenharia_retreino.csv`, `engenharia_neutralizacao.csv`, `engenharia_ablacao_individual.csv`.
- `efeito_escala.csv`, `efeito_imputacao.csv`, `efeito_class_weight.csv`.
- Figuras `.png` e `resultados_svm.zip`.

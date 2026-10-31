# Parâmetros da busca em grade (Random Forest)

Este documento descreve os hiperparâmetros testados na **busca em grade** (`GridSearchCV`) do notebook `docs/handle_forest/Random_Forest_Heart_Failure_mlflow.ipynb`, com o significado de cada valor e os valores selecionados ao final. A grade é **a mesma usada na Árvore de Decisão** (`docs/parametros.md`), o que mantém o orçamento de busca idêntico (864 combinações por codificação).

**Siglas:** `CV` = validação cruzada; `F1` = média harmônica entre precisão e revocação; `NaN` = valor ausente; `OOB` = *out-of-bag*.

## Como ler os nomes dos parâmetros

No `Pipeline` do scikit-learn, o prefixo indica onde o parâmetro age:

- **`prep__`** → etapa de pré-processamento (`ColumnTransformer`);
- **`modelo__`** → etapa do modelo (`RandomForestClassifier`).

## Resumo

| Parâmetro | O que é | Valores testados | Escolhido (one-hot / ordinal) |
|---|---|---|---|
| `prep__num__imp__strategy` | Como preencher `NaN` nas variáveis numéricas | `median`, `mean`, `most_frequent` | `median` / `mean` |
| `modelo__criterion` | Medida de impureza usada em cada corte | `gini`, `entropy` | `entropy` / `entropy` |
| `modelo__max_depth` | Profundidade máxima de cada árvore | `3`, `5`, `7`, `None` | `None` / `7` |
| `modelo__min_samples_split` | Mínimo de amostras para dividir um nó | `2`, `5`, `10` | `2` / `5` |
| `modelo__min_samples_leaf` | Mínimo de amostras em cada folha | `1`, `3`, `5` | `5` / `1` |
| `modelo__max_features` | Atributos considerados em cada corte | `None`, `sqrt` | `sqrt` / `sqrt` |
| `modelo__class_weight` | Peso das classes | `None`, `balanced` | `balanced` / `balanced` |
| `modelo__n_estimators` | Número de árvores da floresta | `300` (fixo na busca) | `300` / `300` |

## Detalhamento

### 1. `prep__num__imp__strategy` — imputação

Define como os valores ausentes são preenchidos **dentro do pipeline** (ajustado apenas no treino de cada partição): `median` (robusta a extremos), `mean` (sensível a extremos) e `most_frequent` (moda). No conjunto de dados, `Cholesterol` tem 172 zeros convertidos em `NaN` e `RestingBP` tem 1. Ficou `median` no one-hot e `mean` no ordinal.

### 2. `modelo__criterion` — critério de divisão

- **`gini`**: impureza de Gini;
- **`entropy`**: entropia (ganho de informação).

As duas codificações escolheram **`entropy`** — diferente da árvore, em que uma delas ficou com `gini`.

### 3. `modelo__max_depth` — profundidade máxima

`3` (rasa), `5`, `7` e `None` (sem limite). Diferente da árvore (que convergiu para profundidade 3), a floresta escolheu **`None`** no one-hot e **`7`** no ordinal: como a decisão é a média de 300 árvores, árvores profundas deixam de ser um problema de sobreajuste. A profundidade média observada foi de 9,9 e 7,0, com cerca de 44 e 50 folhas por árvore.

### 4. `modelo__min_samples_split` — mínimo para dividir

`2` (mais complexo), `5` e `10` (mais regularização). Ficou `2` no one-hot e `5` no ordinal.

### 5. `modelo__min_samples_leaf` — mínimo por folha

`1`, `3` e `5`. Ficou `5` no one-hot e `1` no ordinal. O `min_samples_leaf = 5` é o principal mecanismo de regularização da floresta no one-hot, já que ali a profundidade é ilimitada.

### 6. `modelo__max_features` — atributos por corte

- **`None`**: todos os atributos (sem aleatoriedade na escolha);
- **`sqrt`**: raiz quadrada do número de atributos — padrão do Random Forest, é o que **descorrelaciona** as árvores.

As duas codificações escolheram **`sqrt`**, confirmando o papel central da seleção aleatória de atributos no ensemble.

### 7. `modelo__class_weight` — peso das classes

`None` (peso igual) ou `balanced` (peso inversamente proporcional à frequência). As duas codificações escolheram **`balanced`**, coerente com a prioridade ao recall da classe 1 (doente). Na ablação e na engenharia, `class_weight` foi fixado em `None` para isolar o efeito do atributo.

### 8. `modelo__n_estimators` — número de árvores

Fixado em **300** durante a busca, para que o número de ajustes seja o mesmo da árvore (864 combinações × 10 folds). O efeito do número de árvores foi medido à parte, com os melhores hiperparâmetros: 100, 300, 500 e 800 árvores.

## Como a grade é calculada

```
3 (imputação) × 2 (criterion) × 4 (max_depth) × 3 (min_samples_split)
× 3 (min_samples_leaf) × 2 (max_features) × 2 (class_weight)
= 864 combinações por codificação
```

Com validação cruzada **5 partições × 2 repetições = 10 partições**, isso resulta em **8.640 ajustes por codificação** e **17.280 no total** (one-hot + ordinal) — cada ajuste treinando 300 árvores. O critério de escolha foi o **F1 da classe 1** na validação cruzada.

## Custo computacional observado

| Codificação | Tempo da busca | Melhor F1_CV | OOB score |
|---|---|---|---|
| one-hot | 12,0 min | 0,8809 | 0,8583 |
| ordinal | 14,4 min | 0,8799 | 0,8583 |

O OOB score (630 dos 734 registros de treino classificados corretamente fora do bootstrap) é praticamente igual nas duas codificações e serve como validação interna independente da CV.

## Valores selecionados

| Parâmetro | one-hot | ordinal |
|---|---|---|
| Imputação | `median` | `mean` |
| `criterion` | `entropy` | `entropy` |
| `max_depth` | `None` | `7` |
| `min_samples_split` | `2` | `5` |
| `min_samples_leaf` | `5` | `1` |
| `max_features` | `sqrt` | `sqrt` |
| `class_weight` | `balanced` | `balanced` |
| `n_estimators` | `300` | `300` |

**Leitura:** a floresta converge para `entropy` + `sqrt` + `balanced` nas duas codificações, variando apenas a estratégia de regularização — profundidade limitada a 7 com folhas de 1 amostra (ordinal) ou profundidade livre com folhas de 5 amostras (one-hot). Os dois caminhos produzem desempenho equivalente (F1_CV 0,8809 × 0,8799).

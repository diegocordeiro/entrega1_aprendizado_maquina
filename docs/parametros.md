# Parâmetros da busca em grade (grid search)

Este documento descreve os hiperparâmetros testados na **busca em grade** (`GridSearchCV`) do notebook `Arvore_Decisao_Heart_Failure_mlflow.ipynb`, com o significado de cada valor e os valores selecionados ao final.

**Siglas:** `CV` = validação cruzada (*cross-validation*); `F1` = média harmônica entre precisão e revocação; `NaN` = valor ausente (*Not a Number*).

## Como ler os nomes dos parâmetros

No `Pipeline` do scikit-learn, o prefixo indica onde o parâmetro age:

- **`prep__`** → etapa de pré-processamento (`ColumnTransformer`);
- **`modelo__`** → etapa do modelo (`DecisionTreeClassifier`).

Assim, o `GridSearchCV` pode testar, na mesma busca, a estratégia de imputação e os hiperparâmetros da árvore.

## Resumo

| Parâmetro | O que é | Valores testados | Escolhido (one-hot / ordinal) |
|---|---|---|---|
| `prep__num__imp__strategy` | Como preencher valores ausentes (`NaN`) nas variáveis numéricas | `median`, `mean`, `most_frequent` | `median` / `most_frequent` |
| `modelo__criterion` | Medida de impureza usada para escolher cada corte | `gini`, `entropy` | `entropy` / `gini` |
| `modelo__max_depth` | Profundidade máxima da árvore | `3`, `5`, `7`, `None` | `3` / `3` |
| `modelo__min_samples_split` | Mínimo de amostras para **dividir** um nó | `2`, `5`, `10` | `2` / `2` |
| `modelo__min_samples_leaf` | Mínimo de amostras em cada **folha** | `1`, `3`, `5` | `1` / `1` |
| `modelo__max_features` | Número de atributos considerados em cada corte | `None`, `sqrt` | `None` / `sqrt` |
| `modelo__class_weight` | Peso dado a cada classe | `None`, `balanced` | `balanced` / `None` |

## Detalhamento

### 1. `prep__num__imp__strategy` — imputação

Define como os valores ausentes são preenchidos **dentro do pipeline** (ajustado apenas no treino de cada partição):

- **`median`**: mediana do treino — robusta a valores extremos;
- **`mean`**: média — sensível a valores extremos;
- **`most_frequent`**: valor mais frequente (moda).

No conjunto de dados, `Cholesterol` tem 172 zeros convertidos em `NaN` e `RestingBP` tem 1. A imputação escolhida foi `median` no one-hot e `most_frequent` no ordinal.

### 2. `modelo__criterion` — critério de divisão

Mede a impureza do nó e define qual corte a reduz mais:

- **`gini`**: impureza de Gini — probabilidade de classificar incorretamente uma amostra sorteada;
- **`entropy`**: entropia — o corte maximiza o **ganho de informação** (redução de entropia).

Na prática, os resultados costumam ser próximos; `entropy` tende a produzir árvores um pouco mais equilibradas. A árvore escolhida usou `entropy` no one-hot e `gini` no ordinal.

### 3. `modelo__max_depth` — profundidade máxima

Limita o número de níveis da árvore:

- **`3`**: árvore rasa (poucos cortes) → menor risco de sobreajuste, maior viés;
- **`5`** e **`7`**: árvores mais complexas;
- **`None`**: sem limite → pode crescer até separar quase tudo (maior risco de sobreajuste).

A grade selecionou **`3`** nas duas codificações — uma árvore rasa, que generaliza melhor.

### 4. `modelo__min_samples_split` — mínimo para dividir

Número mínimo de amostras em um nó para que ele possa ser dividido:

- **`2`**: permite dividir nós com apenas 2 amostras (mais complexo);
- **`5`** e **`10`**: exigem mais amostras → menos divisões, mais regularização.

A grade selecionou **`2`**, mas a profundidade 3 já limita bastante a complexidade.

### 5. `modelo__min_samples_leaf` — mínimo por folha

Número mínimo de amostras que cada folha final deve ter:

- **`1`**: permite folhas com uma única amostra (risco de decorar o treino);
- **`3`** e **`5`**: folhas maiores → árvore mais suave e estável.

A grade selecionou **`1`**, novamente compensado pela profundidade rasa.

### 6. `modelo__max_features` — atributos por corte

Quantos atributos são considerados ao procurar o melhor corte:

- **`None`**: todos os atributos;
- **`sqrt`**: raiz quadrada do número de atributos (ex.: 16 atributos → cerca de 4 por corte).

O `sqrt` introduz aleatoriedade e regularização (é o padrão em Random Forest); em uma árvore única, pode ajudar a reduzir sobreajuste. Ficou `None` no one-hot e `sqrt` no ordinal.

### 7. `modelo__class_weight` — peso das classes

Ajusta o custo dos erros de cada classe:

- **`None`**: sem peso (todas as amostras valem o mesmo);
- **`balanced`**: peso inversamente proporcional à frequência da classe — a classe minoritária passa a pesar mais, o que tende a aumentar a revocação dela.

Ficou `balanced` no one-hot e `None` no ordinal. Na ablação, o `balanced` teve **pouco efeito** porque o desbalanceamento é leve (55/45).

## Como a grade é calculada

O `GridSearchCV` testa o **produto cartesiano** dos valores:

```
3 (imputação) × 2 (criterion) × 4 (max_depth) × 3 (min_samples_split)
× 3 (min_samples_leaf) × 2 (max_features) × 2 (class_weight)
= 864 combinações por codificação
```

Com validação cruzada **5 partições × 2 repetições = 10 partições**, isso resulta em **8.640 ajustes por codificação** e **17.280 no total** (one-hot + ordinal). O critério de escolha foi o **F1 da classe 1** na validação cruzada.

## Valores selecionados

| Parâmetro | one-hot | ordinal |
|---|---|---|
| Imputação | `median` | `most_frequent` |
| `criterion` | `entropy` | `gini` |
| `max_depth` | `3` | `3` |
| `min_samples_split` | `2` | `2` |
| `min_samples_leaf` | `1` | `1` |
| `max_features` | `None` | `sqrt` |
| `class_weight` | `balanced` | `None` |

**Leitura:** as duas codificações convergiram para árvores rasas (`max_depth = 3`) e com pouca restrição de tamanho de folha (`min_samples_leaf = 1`). A principal diferença está no `criterion` (entropy × gini), no `max_features` (todos × `sqrt`) e no `class_weight` (balanced × None).

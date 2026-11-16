# Redes Neurais (MLP) — base ChEMBL multi-alvo

Notebook: `docs/redes_neurais/Redes_Neurais_ChEMBL_mlflow.ipynb`

## O que faz

Aplica **Redes Neurais** (`MLPClassifier`) à base `bases/chembl_activities.csv`, prevendo se uma molécula é **ativa** (pCHEMBL ≥ 6,5) contra cada uma das quatro proteínas-alvo (EGFR, BACE1, DRD2, HDAC1). Compara, com tudo registrado no **MLflow**:

- **Preparação de dados:** política de tipo de medida (IC50 × IC50+Ki × todos), remoção de duplicatas e SMILES inválidos, agregação por molécula (mediana do pCHEMBL), limiar de atividade e padronização.
- **Featurização do SMILES:** fingerprint de Morgan/ECFP × descritores físico-químicos RDKit × combinação.
- **Hiperparâmetros da rede:** arquitetura, ativação, `alpha` (regularização) e taxa de aprendizado.

## Como executar

1. Instale as dependências (inclui **RDKit**, novo nesta etapa):

   ```bash
   pip install -r requirements.txt
   ```

2. Abra o notebook e, na **primeira célula de código**, escolha o `MODO`:

   | MODO | O que faz | Tempo aproximado* |
   |---|---|---|
   | `'smoke'` | Amostra de 400 moléculas, grade mínima. Só para testar o fluxo. | ~1 min |
   | `'rapida'` | Base inteira, grade reduzida (4 combinações). Boa primeira passada. | ~15–40 min |
   | `'completa'` | Base inteira, grade completa (24 combinações). Resultado final. | ~2–5 h |

   \* Em um laptop; varia com o número de núcleos. A busca usa `n_jobs=-1`.

   **Sugestão:** rode primeiro em `'rapida'` para validar; depois troque para `'completa'`.

3. Rode todas as células. Os resultados vão para `docs/redes_neurais/resultados/execucao_<data>/` e as runs para o `mlflow.db` do projeto (experimento `chembl_redes_neurais`).

4. Para inspecionar no MLflow, na raiz do projeto:

   ```bash
   mlflow ui --backend-store-uri sqlite:///mlflow.db
   ```

## Saídas

- `comparacao_featurizacoes.csv` — métricas por alvo × featurização (o resultado principal).
- `melhor_por_alvo.csv`, `baseline_por_alvo.csv`.
- `sensibilidade_limiar.csv`, `efeito_escala.csv`, `politica_medida.csv` — as análises de preparação de dados.
- `limpeza_por_alvo.csv` — efeito de cada etapa de limpeza (contagens antes/depois).
- Figuras `.png` e `resultados_redes_neurais.zip`.
- `mlflow_runs_redes_neurais.csv` — todas as runs exportadas.

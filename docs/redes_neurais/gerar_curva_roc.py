"""Gera a figura da curva ROC por alvo, usando a featurizacao de referencia
(fingerprint de Morgan) e os melhores hiperparametros encontrados na busca.

Uso:  python gerar_curva_roc.py [pasta_da_execucao]
Se a pasta nao for informada, usa a execucao mais recente de
docs/redes_neurais/resultados/.
"""
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import roc_curve, roc_auc_score

from rdkit import Chem, RDLogger
RDLogger.DisableLog('rdApp.*')

SEED = 42
ALVOS = ['EGFR', 'BACE1', 'DRD2', 'HDAC1']
LIMIAR = 6.5
TIPOS = ['IC50', 'Ki']
MORGAN_BITS, MORGAN_RAIO = 2048, 2
FEAT_REF = 'morgan'

try:
    from rdkit.Chem import rdFingerprintGenerator
    _GEN = rdFingerprintGenerator.GetMorganGenerator(radius=MORGAN_RAIO, fpSize=MORGAN_BITS)
    def _morgan(mol):
        return np.asarray(_GEN.GetFingerprintAsNumPy(mol), dtype=np.float32)
except (ImportError, AttributeError):
    from rdkit.Chem import AllChem
    from rdkit import DataStructs
    def _morgan(mol):
        bv = AllChem.GetMorganFingerprintAsBitVect(mol, MORGAN_RAIO, nBits=MORGAN_BITS)
        arr = np.zeros((MORGAN_BITS,), dtype=np.float32)
        DataStructs.ConvertToNumpyArray(bv, arr)
        return arr


def raiz():
    atual = Path.cwd().resolve()
    for p in [atual, *atual.parents]:
        if (p / 'bases' / 'chembl_activities.csv').exists():
            return p
    raise FileNotFoundError('bases/chembl_activities.csv nao encontrado')


def prepara_alvo(bruto, alvo):
    d = bruto[bruto['protein'] == alvo]
    d = d[d['standard_type'].isin(TIPOS)]
    d = d[d['potential_duplicate'] != 1]
    d = d.dropna(subset=['canonical_smiles', 'pchembl_value'])
    d = d[d['canonical_smiles'].str.strip() != '']
    d = d[d['canonical_smiles'].apply(lambda s: Chem.MolFromSmiles(s) is not None)]
    g = (d.groupby('molecule_chembl_id')
           .agg(canonical_smiles=('canonical_smiles', 'first'),
                pchembl=('pchembl_value', 'median'))
           .reset_index())
    g['y'] = (g['pchembl'] >= LIMIAR).astype(int)
    return g.reset_index(drop=True)


def main():
    RAIZ = raiz()
    base_res = RAIZ / 'docs' / 'redes_neurais' / 'resultados'
    if len(sys.argv) > 1:
        pasta = Path(sys.argv[1])
    else:
        pasta = sorted(base_res.glob('execucao_*'))[-1]
    print('Pasta da execucao:', pasta)

    hp = json.loads((pasta / 'melhores_hiperparametros_mlp.json').read_text())
    bruto = pd.read_csv(RAIZ / 'bases' / 'chembl_activities.csv')

    fig, ax = plt.subplots(figsize=(7, 6))
    linhas = []
    for alvo in ALVOS:
        g = prepara_alvo(bruto, alvo)
        mols = [Chem.MolFromSmiles(s) for s in g['canonical_smiles']]
        X = np.vstack([_morgan(m) for m in mols])
        y = g['y'].values
        itr, ite = train_test_split(np.arange(len(y)), test_size=0.2,
                                    random_state=SEED, stratify=y)
        p = hp[f'{alvo}__{FEAT_REF}']
        mlp = MLPClassifier(
            hidden_layer_sizes=eval(p['hidden_layer_sizes']),
            activation=p['activation'],
            alpha=float(p['alpha']),
            learning_rate_init=float(p['learning_rate_init']),
            max_iter=300, early_stopping=True, n_iter_no_change=15,
            validation_fraction=0.1, random_state=SEED)
        pipe = Pipeline([('sc', StandardScaler()), ('mlp', mlp)])
        pipe.fit(X[itr], y[itr])
        proba = pipe.predict_proba(X[ite])[:, 1]
        fpr, tpr, _ = roc_curve(y[ite], proba)
        auc = roc_auc_score(y[ite], proba)
        ax.plot(fpr, tpr, linewidth=1.9, label=f'{alvo} (AUC = {auc:.3f})')
        linhas.append({'Alvo': alvo, 'Featurizacao': FEAT_REF, 'ROC_AUC': round(float(auc), 4)})
        print(f'[{alvo}] ROC-AUC = {auc:.4f}')

    ax.plot([0, 1], [0, 1], 'k--', linewidth=1, label='acaso (AUC = 0,500)')
    ax.set_xlabel('Taxa de falsos positivos (1 − especificidade)')
    ax.set_ylabel('Taxa de verdadeiros positivos (revocação da classe 1)')
    ax.set_title(f'Curva ROC por alvo — MLP com fingerprint de Morgan (limiar pCHEMBL ≥ {LIMIAR})')
    ax.legend(loc='lower right', fontsize=9)
    ax.grid(alpha=0.3)
    ax.set_xlim(0, 1); ax.set_ylim(0, 1.02)
    fig.tight_layout()

    destino = pasta / 'curva_roc_por_alvo.png'
    fig.savefig(destino, dpi=150, bbox_inches='tight')
    figuras = RAIZ / 'docs' / 'redes_neurais' / 'figuras'
    figuras.mkdir(parents=True, exist_ok=True)
    fig.savefig(figuras / 'curva_roc_por_alvo.png', dpi=150, bbox_inches='tight')
    pd.DataFrame(linhas).to_csv(pasta / 'curva_roc_auc.csv', index=False)
    print('Figura salva em:', destino)


if __name__ == '__main__':
    main()

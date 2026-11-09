import type { SQLiteDatabase } from 'expo-sqlite';

export const NOME_BANCO = 'compras.db';

/**
 * Cada posição é uma versão do banco. Para mudar o banco no futuro,
 * ADICIONE um novo item no fim (nunca altere os antigos).
 */
const MIGRACOES: string[] = [
  `
  CREATE TABLE mercados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cnpj TEXT UNIQUE,
    criado_em TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    nome_normalizado TEXT NOT NULL UNIQUE,
    unidade TEXT NOT NULL DEFAULT 'UN'
  );

  -- Nome que aparece na nota fiscal -> produto escolhido pelo usuário
  CREATE TABLE apelidos (
    nome_normalizado TEXT PRIMARY KEY,
    produto_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE
  );

  CREATE TABLE listas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    criada_em TEXT NOT NULL DEFAULT (datetime('now')),
    arquivada INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE itens_lista (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lista_id INTEGER NOT NULL REFERENCES listas(id) ON DELETE CASCADE,
    produto_id INTEGER NOT NULL REFERENCES produtos(id),
    quantidade REAL NOT NULL DEFAULT 1,
    comprado INTEGER NOT NULL DEFAULT 0,
    preco REAL
  );

  CREATE TABLE compras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mercado_id INTEGER NOT NULL REFERENCES mercados(id),
    data TEXT NOT NULL,
    total REAL NOT NULL,
    origem TEXT NOT NULL CHECK (origem IN ('manual', 'nfce')),
    chave_nfce TEXT UNIQUE
  );

  CREATE TABLE itens_compra (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    compra_id INTEGER NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
    produto_id INTEGER NOT NULL REFERENCES produtos(id),
    quantidade REAL NOT NULL,
    preco_unitario REAL NOT NULL,
    preco_total REAL NOT NULL
  );

  CREATE INDEX idx_itens_compra_produto ON itens_compra(produto_id);
  CREATE INDEX idx_compras_data ON compras(data);
  `,
];

export async function prepararBanco(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`PRAGMA journal_mode = 'wal'; PRAGMA foreign_keys = ON;`);
  const linha = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let versao = linha?.user_version ?? 0;

  while (versao < MIGRACOES.length) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRACOES[versao]);
      await db.execAsync(`PRAGMA user_version = ${versao + 1}`);
    });
    versao += 1;
  }
}

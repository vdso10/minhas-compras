import type { SQLiteDatabase } from 'expo-sqlite';

import type { PrecoRegistrado } from '@/lib/comparacao';
import type { CompraResumo } from '@/lib/gastos';
import { arredondar } from '@/lib/moeda';
import { capitalizar, normalizar } from '@/lib/normalizar';

// ---------- Tipos ----------

export type Mercado = { id: number; nome: string; cnpj: string | null };
export type Produto = { id: number; nome: string; unidade: string };
export type ListaResumo = { id: number; nome: string; total_itens: number; comprados: number };
export type ItemLista = {
  id: number;
  produto_id: number;
  nome: string;
  quantidade: number;
  comprado: number;
  preco: number | null;
};
export type CompraLinha = {
  id: number;
  data: string;
  total: number;
  origem: 'manual' | 'nfce';
  mercado_nome: string;
  qtd_itens: number;
};
export type ItemCompraNovo = { produtoId: number; quantidade: number; precoUnitario: number; precoTotal: number };

// ---------- Produtos ----------

export async function obterOuCriarProduto(db: SQLiteDatabase, nome: string, unidade = 'UN'): Promise<number> {
  const chave = normalizar(nome);
  if (!chave) throw new Error('Nome do produto vazio');
  const existente = await db.getFirstAsync<{ id: number }>('SELECT id FROM produtos WHERE nome_normalizado = ?', chave);
  if (existente) return existente.id;
  const r = await db.runAsync(
    'INSERT INTO produtos (nome, nome_normalizado, unidade) VALUES (?, ?, ?)',
    capitalizar(nome),
    chave,
    unidade,
  );
  return r.lastInsertRowId;
}

export function listarProdutos(db: SQLiteDatabase): Promise<Produto[]> {
  return db.getAllAsync<Produto>('SELECT id, nome, unidade FROM produtos ORDER BY nome COLLATE NOCASE');
}

export type ProdutoComPreco = Produto & { menor_preco: number; registros: number };

/** Produtos que já têm algum preço registrado (para a aba Preços). */
export function listarProdutosComPreco(db: SQLiteDatabase, busca = ''): Promise<ProdutoComPreco[]> {
  return db.getAllAsync<ProdutoComPreco>(
    `SELECT p.id, p.nome, p.unidade, MIN(ic.preco_unitario) AS menor_preco, COUNT(*) AS registros
       FROM produtos p
       JOIN itens_compra ic ON ic.produto_id = p.id
      WHERE p.nome_normalizado LIKE ?
      GROUP BY p.id
      ORDER BY p.nome COLLATE NOCASE`,
    `%${normalizar(busca)}%`,
  );
}

export async function obterProduto(db: SQLiteDatabase, id: number): Promise<Produto | null> {
  return db.getFirstAsync<Produto>('SELECT id, nome, unidade FROM produtos WHERE id = ?', id);
}

/** Histórico de preços de vários produtos (para comparação). */
export async function precosDosProdutos(db: SQLiteDatabase, ids: number[]): Promise<PrecoRegistrado[]> {
  if (ids.length === 0) return [];
  const marcadores = ids.map(() => '?').join(',');
  return db.getAllAsync<PrecoRegistrado>(
    `SELECT ic.produto_id, c.mercado_id, m.nome AS mercado_nome, ic.preco_unitario, c.data
       FROM itens_compra ic
       JOIN compras c ON c.id = ic.compra_id
       JOIN mercados m ON m.id = c.mercado_id
      WHERE ic.produto_id IN (${marcadores})
      ORDER BY c.data`,
    ...ids,
  );
}

export async function produtoPorApelido(db: SQLiteDatabase, nomeNaNota: string): Promise<Produto | null> {
  return db.getFirstAsync<Produto>(
    `SELECT p.id, p.nome, p.unidade FROM apelidos a JOIN produtos p ON p.id = a.produto_id
      WHERE a.nome_normalizado = ?`,
    normalizar(nomeNaNota),
  );
}

export async function salvarApelido(db: SQLiteDatabase, nomeNaNota: string, produtoId: number): Promise<void> {
  await db.runAsync(
    'INSERT OR REPLACE INTO apelidos (nome_normalizado, produto_id) VALUES (?, ?)',
    normalizar(nomeNaNota),
    produtoId,
  );
}

// ---------- Mercados ----------

export function listarMercados(db: SQLiteDatabase): Promise<Mercado[]> {
  return db.getAllAsync<Mercado>('SELECT id, nome, cnpj FROM mercados ORDER BY nome COLLATE NOCASE');
}

export async function criarMercado(db: SQLiteDatabase, nome: string): Promise<number> {
  const r = await db.runAsync('INSERT INTO mercados (nome) VALUES (?)', nome.trim());
  return r.lastInsertRowId;
}

export async function obterOuCriarMercadoPorCnpj(db: SQLiteDatabase, nome: string, cnpj: string | null): Promise<number> {
  if (cnpj) {
    const existente = await db.getFirstAsync<{ id: number }>('SELECT id FROM mercados WHERE cnpj = ?', cnpj);
    if (existente) return existente.id;
  }
  const r = await db.runAsync('INSERT INTO mercados (nome, cnpj) VALUES (?, ?)', nome.trim(), cnpj);
  return r.lastInsertRowId;
}

export async function renomearMercado(db: SQLiteDatabase, id: number, nome: string): Promise<void> {
  await db.runAsync('UPDATE mercados SET nome = ? WHERE id = ?', nome.trim(), id);
}

// ---------- Listas ----------

export function listarListas(db: SQLiteDatabase): Promise<ListaResumo[]> {
  return db.getAllAsync<ListaResumo>(
    `SELECT l.id, l.nome,
            COUNT(i.id) AS total_itens,
            COALESCE(SUM(i.comprado), 0) AS comprados
       FROM listas l LEFT JOIN itens_lista i ON i.lista_id = l.id
      WHERE l.arquivada = 0
      GROUP BY l.id
      ORDER BY l.id DESC`,
  );
}

export async function criarLista(db: SQLiteDatabase, nome: string): Promise<number> {
  const r = await db.runAsync('INSERT INTO listas (nome) VALUES (?)', nome.trim() || 'Minha lista');
  return r.lastInsertRowId;
}

export async function obterLista(db: SQLiteDatabase, id: number): Promise<{ id: number; nome: string } | null> {
  return db.getFirstAsync('SELECT id, nome FROM listas WHERE id = ?', id);
}

export async function renomearLista(db: SQLiteDatabase, id: number, nome: string): Promise<void> {
  await db.runAsync('UPDATE listas SET nome = ? WHERE id = ?', nome.trim(), id);
}

export async function excluirLista(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM listas WHERE id = ?', id);
}

export function itensDaLista(db: SQLiteDatabase, listaId: number): Promise<ItemLista[]> {
  return db.getAllAsync<ItemLista>(
    `SELECT i.id, i.produto_id, p.nome, i.quantidade, i.comprado, i.preco
       FROM itens_lista i JOIN produtos p ON p.id = i.produto_id
      WHERE i.lista_id = ?
      ORDER BY i.comprado, p.nome COLLATE NOCASE`,
    listaId,
  );
}

export async function adicionarItem(db: SQLiteDatabase, listaId: number, nome: string, quantidade = 1): Promise<void> {
  const produtoId = await obterOuCriarProduto(db, nome);
  const jaTem = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM itens_lista WHERE lista_id = ? AND produto_id = ?',
    listaId,
    produtoId,
  );
  if (jaTem) {
    await db.runAsync('UPDATE itens_lista SET quantidade = quantidade + ? WHERE id = ?', quantidade, jaTem.id);
  } else {
    await db.runAsync(
      'INSERT INTO itens_lista (lista_id, produto_id, quantidade) VALUES (?, ?, ?)',
      listaId,
      produtoId,
      quantidade,
    );
  }
}

export async function atualizarItem(
  db: SQLiteDatabase,
  id: number,
  dados: { quantidade?: number; comprado?: boolean; preco?: number | null },
): Promise<void> {
  if (dados.quantidade !== undefined) {
    await db.runAsync('UPDATE itens_lista SET quantidade = ? WHERE id = ?', dados.quantidade, id);
  }
  if (dados.comprado !== undefined) {
    await db.runAsync('UPDATE itens_lista SET comprado = ? WHERE id = ?', dados.comprado ? 1 : 0, id);
  }
  if (dados.preco !== undefined) {
    await db.runAsync('UPDATE itens_lista SET preco = ? WHERE id = ?', dados.preco, id);
  }
}

export async function removerItem(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM itens_lista WHERE id = ?', id);
}

/**
 * Transforma os itens marcados (com preço) numa compra e deixa a lista
 * desmarcada para ser usada de novo na próxima ida ao mercado.
 */
export async function finalizarCompraDaLista(
  db: SQLiteDatabase,
  listaId: number,
  mercadoId: number,
  data: string,
): Promise<number> {
  const itens = (await itensDaLista(db, listaId)).filter((i) => i.comprado && i.preco != null);
  if (itens.length === 0) throw new Error('Nenhum item marcado com preço.');
  let compraId = 0;
  await db.withTransactionAsync(async () => {
    compraId = await registrarCompra(db, {
      mercadoId,
      data,
      origem: 'manual',
      chave: null,
      itens: itens.map((i) => ({
        produtoId: i.produto_id,
        quantidade: i.quantidade,
        precoUnitario: i.preco!,
        precoTotal: arredondar(i.preco! * i.quantidade),
      })),
    });
    await db.runAsync('UPDATE itens_lista SET comprado = 0, preco = NULL WHERE lista_id = ?', listaId);
  });
  return compraId;
}

// ---------- Compras ----------

export async function notaJaImportada(db: SQLiteDatabase, chave: string): Promise<boolean> {
  return !!(await db.getFirstAsync('SELECT id FROM compras WHERE chave_nfce = ?', chave));
}

/** Grava a compra e seus itens. Não abre transação: quem chama decide. */
export async function registrarCompra(
  db: SQLiteDatabase,
  compra: {
    mercadoId: number;
    data: string;
    origem: 'manual' | 'nfce';
    chave: string | null;
    itens: ItemCompraNovo[];
    total?: number;
  },
): Promise<number> {
  const total = compra.total ?? arredondar(compra.itens.reduce((s, i) => s + i.precoTotal, 0));
  const r = await db.runAsync(
    'INSERT INTO compras (mercado_id, data, total, origem, chave_nfce) VALUES (?, ?, ?, ?, ?)',
    compra.mercadoId,
    compra.data,
    total,
    compra.origem,
    compra.chave,
  );
  for (const i of compra.itens) {
    await db.runAsync(
      'INSERT INTO itens_compra (compra_id, produto_id, quantidade, preco_unitario, preco_total) VALUES (?, ?, ?, ?, ?)',
      r.lastInsertRowId,
      i.produtoId,
      i.quantidade,
      i.precoUnitario,
      i.precoTotal,
    );
  }
  return r.lastInsertRowId;
}

export function listarCompras(db: SQLiteDatabase, limite = 50): Promise<CompraLinha[]> {
  return db.getAllAsync<CompraLinha>(
    `SELECT c.id, c.data, c.total, c.origem, m.nome AS mercado_nome,
            (SELECT COUNT(*) FROM itens_compra ic WHERE ic.compra_id = c.id) AS qtd_itens
       FROM compras c JOIN mercados m ON m.id = c.mercado_id
      ORDER BY c.data DESC, c.id DESC
      LIMIT ?`,
    limite,
  );
}

export function obterCompra(db: SQLiteDatabase, id: number): Promise<CompraLinha | null> {
  return db.getFirstAsync<CompraLinha>(
    `SELECT c.id, c.data, c.total, c.origem, m.nome AS mercado_nome,
            (SELECT COUNT(*) FROM itens_compra ic WHERE ic.compra_id = c.id) AS qtd_itens
       FROM compras c JOIN mercados m ON m.id = c.mercado_id
      WHERE c.id = ?`,
    id,
  );
}

export function resumoDasCompras(db: SQLiteDatabase): Promise<CompraResumo[]> {
  return db.getAllAsync<CompraResumo>('SELECT data, total FROM compras');
}

export function itensDaCompra(db: SQLiteDatabase, compraId: number) {
  return db.getAllAsync<{ id: number; nome: string; quantidade: number; preco_unitario: number; preco_total: number }>(
    `SELECT ic.id, p.nome, ic.quantidade, ic.preco_unitario, ic.preco_total
       FROM itens_compra ic JOIN produtos p ON p.id = ic.produto_id
      WHERE ic.compra_id = ?
      ORDER BY p.nome COLLATE NOCASE`,
    compraId,
  );
}

export async function excluirCompra(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM compras WHERE id = ?', id);
}

// ---------- Backup ----------

const TABELAS = ['mercados', 'produtos', 'apelidos', 'listas', 'itens_lista', 'compras', 'itens_compra'] as const;

export type Backup = { app: 'appcompras'; versao: 1; criado_em: string; dados: Record<string, Record<string, unknown>[]> };

export async function exportarTudo(db: SQLiteDatabase): Promise<Backup> {
  const dados: Backup['dados'] = {};
  for (const t of TABELAS) dados[t] = await db.getAllAsync(`SELECT * FROM ${t}`);
  return { app: 'appcompras', versao: 1, criado_em: new Date().toISOString(), dados };
}

/** Substitui todos os dados pelos do backup. */
export async function importarTudo(db: SQLiteDatabase, backup: Backup): Promise<void> {
  if (backup?.app !== 'appcompras' || !backup.dados) throw new Error('Arquivo de backup inválido.');
  await db.withTransactionAsync(async () => {
    for (const t of [...TABELAS].reverse()) await db.runAsync(`DELETE FROM ${t}`);
    for (const t of TABELAS) {
      for (const linha of backup.dados[t] ?? []) {
        // nomes de coluna vêm do arquivo: aceita só letras minúsculas e "_"
        const colunas = Object.keys(linha).filter((c) => /^[a-z_]+$/.test(c));
        if (colunas.length === 0) continue;
        await db.runAsync(
          `INSERT INTO ${t} (${colunas.join(',')}) VALUES (${colunas.map(() => '?').join(',')})`,
          ...(colunas.map((c) => linha[c]) as (string | number | null)[]),
        );
      }
    }
  });
}

import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { Transaction } from "@/server/database/prisma";

export function saveShoppingList(tx: Transaction, name: string, id?: string) {
  return id
    ? tx.shoppingList.update({ where: { id }, data: { name } })
    : tx.shoppingList.create({ data: { name, current: false } });
}

export async function selectShoppingList(tx: Transaction, id: string) {
  await tx.shoppingList.updateMany({
    where: { current: true },
    data: { current: false },
  });
  await tx.shoppingList.update({ where: { id }, data: { current: true } });
}

export function deleteShoppingList(tx: Transaction, id: string) {
  return tx.shoppingList.delete({ where: { id } });
}

export function findCurrentShoppingList(tx: Transaction) {
  return tx.shoppingList.findFirst({ where: { current: true } });
}

export function findLatestShoppingList(tx: Transaction) {
  return tx.shoppingList.findFirst({ orderBy: { createdAt: "desc" } });
}

export function addShoppingItem(
  tx: Transaction,
  data: Prisma.ShoppingItemUncheckedCreateInput,
) {
  return tx.shoppingItem.create({ data });
}

export function addShoppingItems(
  tx: Transaction,
  data: Prisma.ShoppingItemCreateManyInput[],
) {
  return tx.shoppingItem.createMany({ data });
}

export function updateShoppingItem(
  tx: Transaction,
  id: string,
  data: Prisma.ShoppingItemUpdateInput,
) {
  return tx.shoppingItem.update({ where: { id }, data });
}

export function deleteShoppingItem(tx: Transaction, id: string) {
  return tx.shoppingItem.delete({ where: { id } });
}

export function clearPurchasedItems(tx: Transaction, listId: string) {
  return tx.shoppingItem.deleteMany({ where: { listId, checked: true } });
}

/**
 * Cursor-based pagination helper.
 *
 * Pattern (PRD §11):
 *   - Fetch `take: limit + 1` rows.
 *   - If we got more than `limit`, slice off the last one and use its `id`
 *     as the next cursor.
 *   - `hasMore` is true when the over-fetch succeeded.
 *   - `total` is computed in parallel via the model's `count` method.
 *
 * The `model` shape is intentionally minimal — only the two methods we call.
 * In practice it will be a Prisma delegate (e.g. `prisma.workspace`), which
 * has both `findMany` and `count` with matching `where` argument shapes.
 */

export interface PaginationMeta {
  nextCursor: string | null;
  total: number;
  hasMore: boolean;
}

export interface CursorPaginateArgs<T> {
  model: {
    findMany: (args: any) => Promise<T[]>;
    count: (args: any) => Promise<number>;
  };
  where: Record<string, unknown>;
  limit: number;
  cursor?: string;
  orderBy: any[];
  include?: Record<string, unknown>;
  select?: Record<string, unknown>;
}

export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;

export async function paginateCursor<T extends { id: string }>(
  args: CursorPaginateArgs<T>,
): Promise<{ items: T[]; meta: PaginationMeta }> {
  const limit = Math.max(
    1,
    Math.min(MAX_PAGE_LIMIT, args.limit ?? DEFAULT_PAGE_LIMIT),
  );

  const findArgs: any = {
    where: args.where,
    orderBy: args.orderBy,
    take: limit + 1,
  };
  if (args.cursor) {
    findArgs.cursor = { id: args.cursor };
    findArgs.skip = 1; // skip the cursor row itself
  }
  if (args.include) findArgs.include = args.include;
  if (args.select) findArgs.select = args.select;

  const [rows, total] = await Promise.all([
    args.model.findMany(findArgs),
    args.model.count({ where: args.where }),
  ]);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? items[items.length - 1]!.id : null;

  return { items, meta: { nextCursor, total, hasMore } };
}

/**
 * Column decoding for raw `db.execute` results.
 *
 * Drizzle applies its column mappers only to the query builder, so a timestamp
 * read through a raw `sql` template arrives as the Postgres text form rather
 * than a `Date`. Every projection into a contract shape has to convert.
 */
export function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value)
}

export function toNullableDate(value: Date | string | null): Date | null {
  return value === null ? null : toDate(value)
}

export function monday(date = new Date()) {
  const value = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12),
  );

  value.setUTCDate(value.getUTCDate() - ((value.getUTCDay() + 6) % 7));

  return value;
}

export const isoDate = (date: Date) => date.toISOString().slice(0, 10);

export function weekDays(start: string, offset = 0) {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(`${start}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + offset * 7 + i);

    return date;
  });
}

export const databaseDate = (value: string) =>
  new Date(`${value}T00:00:00.000Z`);

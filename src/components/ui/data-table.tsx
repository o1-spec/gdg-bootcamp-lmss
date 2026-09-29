import React from "react";

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  className?: string;
  cell?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  emptyText?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyText = "No records found.",
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#E7E3DA] bg-white p-10 text-center text-xs text-[#737373]">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E7E3DA] bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-[#E7E3DA] bg-[#F7F4ED]/50">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-4 py-3 text-2xs font-semibold uppercase tracking-wider text-[#171717] ${
                    col.className || ""
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7E3DA]">
            {data.map((item) => (
              <tr
                key={keyExtractor(item)}
                className="transition-colors hover:bg-[#F7F4ED]/30"
              >
                {columns.map((col, idx) => (
                  <td
                    key={idx}
                    className={`px-4 py-3.5 text-xs text-[#171717] ${
                      col.className || ""
                    }`}
                  >
                    {col.cell
                      ? col.cell(item)
                      : col.accessorKey
                      ? String(item[col.accessorKey] ?? "")
                      : null}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

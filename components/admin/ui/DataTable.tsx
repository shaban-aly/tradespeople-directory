import type { ReactNode } from "react";

/**
 * جدول بيانات موحّد للوحة المشرف:
 * overflow-x-auto + <table> بحدود سفلية وترويسة موحّدة
 * (أول/آخر عمود حواف مضبوطة للاتجاه RTL).
 */
export function DataTable({
  headers,
  minWidth,
  children,
}: {
  headers: ReactNode[];
  minWidth?: number;
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table
        className="w-full border-collapse text-right"
        style={minWidth ? { minWidth } : undefined}
      >
        <thead>
          <tr className="border-b border-border text-base text-muted">
            {headers.map((header, index) => (
              <th
                key={index}
                className={`py-3 font-bold ${
                  index === 0
                    ? "pr-2"
                    : index === headers.length - 1
                      ? "pl-2"
                      : "px-3"
                }`}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function DataTableRow({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <tr className={`border-b border-border last:border-0 ${className}`}>
      {children}
    </tr>
  );
}

export function DataTableCell({
  edge,
  dir,
  className = "",
  children,
}: {
  edge?: "start" | "end";
  dir?: "ltr" | "rtl";
  className?: string;
  children: ReactNode;
}) {
  const padding =
    edge === "start" ? "py-3 pr-2" : edge === "end" ? "py-3 pl-2" : "py-3 px-3";
  return (
    <td dir={dir} className={`${padding} text-muted ${className}`}>
      {children}
    </td>
  );
}
"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const inr = (rupees: number) => `₹${Math.round(rupees).toLocaleString("en-IN")}`;
const compactInr = (rupees: number) =>
  rupees >= 100000
    ? `₹${(rupees / 100000).toFixed(1)}L`
    : rupees >= 1000
      ? `₹${Math.round(rupees / 1000)}k`
      : `₹${rupees}`;

interface Point {
  day: string;
  revenue: number;
  orders: number;
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: Point }[] }) {
  const p = payload?.[0]?.payload;
  if (!active || !p) return null;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-card">
      <p className="font-medium">{p.day}</p>
      <p>{inr(p.revenue)}</p>
      <p className="text-muted-foreground">
        {p.orders} {p.orders === 1 ? "order" : "orders"}
      </p>
    </div>
  );
}

/** Daily revenue, last 30 days. Single series: the panel title names it, so no legend. */
export function RevenueChart({ data }: { data: Point[] }) {
  return (
    <figure>
      <div className="h-64" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            barCategoryGap={2}
          >
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="0" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              interval={4}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            />
            <YAxis
              tickFormatter={compactInr}
              tickLine={false}
              axisLine={false}
              width={48}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.6 }} />
            <Bar
              dataKey="revenue"
              fill="var(--color-madder-700)"
              radius={[4, 4, 0, 0]}
              maxBarSize={18}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <details className="mt-3 text-xs text-muted-foreground">
        <summary className="cursor-pointer">View as table</summary>
        <table className="mt-2 w-full">
          <thead>
            <tr className="text-left">
              <th className="py-1 font-medium">Day</th>
              <th className="py-1 text-right font-medium">Orders</th>
              <th className="py-1 text-right font-medium">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.day}>
                <td className="py-0.5">{d.day}</td>
                <td className="py-0.5 text-right tabular-nums">{d.orders}</td>
                <td className="py-0.5 text-right tabular-nums">{inr(d.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

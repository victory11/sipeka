"use client";

import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function ChartCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-ink-200 bg-white p-5 shadow-xs ${className ?? ""}`}
    >
      <header className="mb-4">
        <h3 className="font-display text-sm font-bold text-ink-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-ink-400">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}

const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid #E5E7EB",
  boxShadow: "0 8px 24px -6px rgba(16,24,40,0.12)",
  fontSize: 12,
  fontFamily: "Inter, sans-serif",
};

function LegendRow({
  items,
}: {
  items: Array<{ name: string; value: number; color: string }>;
}) {
  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  return (
    <ul className="mt-3 space-y-1.5">
      {items.map((item) => (
        <li key={item.name} className="flex items-center gap-2 text-xs">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-[4px]"
            style={{ backgroundColor: item.color }}
          />
          <span className="flex-1 truncate font-medium text-ink-500">{item.name}</span>
          <span className="font-bold text-ink-800">{item.value}</span>
          <span className="w-10 text-right font-semibold text-ink-400">
            {Math.round((item.value / total) * 100)}%
          </span>
        </li>
      ))}
    </ul>
  );
}

export function GenderPieChart({
  data,
}: {
  data: Array<{ name: string; value: number }>;
}) {
  const colors: Record<string, string> = {
    "Laki-laki": "#1E40AF",
    Perempuan: "#10B981",
  };
  const items = data.map((d) => ({ ...d, color: colors[d.name] ?? "#94A3B8" }));
  return (
    <div>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={42}
              outerRadius={66}
              paddingAngle={3}
              strokeWidth={2}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={colors[d.name] ?? "#94A3B8"} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <LegendRow items={items} />
    </div>
  );
}

export function PendidikanBarChart({
  data,
}: {
  data: Array<{ name: string; value: number }>;
}) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "#6B7280" }}
            axisLine={{ stroke: "#E5E7EB" }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "#6B7280" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#F8FAFC" }} />
          <Bar dataKey="value" name="Keluhan" fill="#1E40AF" radius={[5, 5, 0, 0]} maxBarSize={34} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RuanganBarChart({
  data,
}: {
  data: Array<{ name: string; value: number }>;
}) {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "#6B7280" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={168}
            tick={{ fontSize: 10.5, fill: "#374151" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#F8FAFC" }} />
          <Bar
            dataKey="value"
            name="Keluhan"
            fill="#059669"
            radius={[0, 5, 5, 0]}
            maxBarSize={16}
          >
            {data.map((d, i) => (
              <Cell key={d.name} fill={i === 0 ? "#047857" : "#10B981"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function KategoriDonutChart({
  data,
}: {
  data: Array<{ name: string; value: number; color: string }>;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div>
      <div className="relative h-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={46}
              outerRadius={68}
              paddingAngle={2}
              strokeWidth={2}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-xl font-bold text-ink-900">{total}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">
            Keluhan
          </span>
        </div>
      </div>
      <LegendRow items={data} />
    </div>
  );
}

export function TrendLineChart({
  data,
}: {
  data: Array<{
    label: string;
    Ditinjau: number;
    "Sedang Diproses": number;
    Selesai: number;
  }>;
}) {
  const series = [
    { key: "Ditinjau", color: "#EF4444" },
    { key: "Sedang Diproses", color: "#F59E0B" },
    { key: "Selesai", color: "#10B981" },
  ] as const;
  return (
    <div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 6, right: 12, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#6B7280" }}
              axisLine={{ stroke: "#E5E7EB" }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "#6B7280" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip contentStyle={tooltipStyle} />
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={2.4}
                dot={{ r: 3, strokeWidth: 2, fill: "#fff" }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-xs font-medium text-ink-500">
            <span className="h-1 w-4 rounded-full" style={{ backgroundColor: s.color }} />
            {s.key}
          </span>
        ))}
      </div>
    </div>
  );
}

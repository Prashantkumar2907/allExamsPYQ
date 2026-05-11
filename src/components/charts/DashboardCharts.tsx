import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { CHART_COLORS, DIFFICULTY_COLORS } from '../../lib/constants';

const tooltipStyle = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: 12,
};

interface StudentTrendPoint {
  name: string;
  score: number;
  accuracy: number;
}

interface PiePoint {
  name: string;
  value: number;
}

interface AdminDailyPoint {
  date: string;
  count: number;
}

interface DifficultyPoint {
  name: string;
  count: number;
}

export function StudentTrendChart({ data }: { data: StudentTrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS[0]} stopOpacity={0.3} />
            <stop offset="100%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} axisLine={false} tickLine={false} domain={[0, 100]} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="score" stroke={CHART_COLORS[0]} fill="url(#scoreFill)" strokeWidth={2} />
        <Area type="monotone" dataKey="accuracy" stroke={CHART_COLORS[2]} fill="none" strokeWidth={1.5} strokeDasharray="4 4" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function StudentQuestionStatusChart({ data }: { data: PiePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" paddingAngle={3} strokeWidth={0}>
          {data.map((item, i) => (
            <Cell
              key={item.name}
              fill={[CHART_COLORS[0], '#d45a5a', CHART_COLORS[3]][i]}
              aria-label={`${item.name}: ${item.value}`}
            />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function AdminDailyAttemptsChart({ data }: { data: AdminDailyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="count" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function AdminDifficultyChart({ data }: { data: DifficultyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="count" paddingAngle={3} strokeWidth={0}>
          {data.map((d) => (
            <Cell
              key={d.name}
              fill={DIFFICULTY_COLORS[d.name] || CHART_COLORS[3]}
              aria-label={`${d.name}: ${d.count}`}
            />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}

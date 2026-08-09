import { useQuery } from '@tanstack/react-query'
import { api, type UsageSummary } from '../api/client'
import { CurrencyDollar, ChartBar, Cpu, TrendUp } from '@phosphor-icons/react'

export default function AnalyticsPage() {
  const { data: todayData } = useQuery({
    queryKey: ['analytics', 'today'],
    queryFn: () => api.getAnalyticsToday(),
  })

  const { data: dailyData } = useQuery({
    queryKey: ['analytics', 'daily'],
    queryFn: () => api.getAnalyticsDaily(30),
  })

  const summary: UsageSummary = todayData || {
    total_requests: 0,
    total_prompt_tokens: 0,
    total_completion_tokens: 0,
    total_cost: 0,
    by_provider: {},
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-ink">Analytics</h1>
        <p className="mb-8 text-muted">Token usage and cost breakdown across all providers.</p>

        {/* Summary Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          {[
            { icon: CurrencyDollar, label: "Today's Cost", value: `$${summary.total_cost.toFixed(4)}`, accent: 'text-[#346538]' },
            { icon: ChartBar, label: 'Requests', value: String(summary.total_requests), accent: 'text-accent-ink' },
            { icon: Cpu, label: 'Input Tokens', value: summary.total_prompt_tokens.toLocaleString(), accent: 'text-[#1F6C9F]' },
            { icon: TrendUp, label: 'Output Tokens', value: summary.total_completion_tokens.toLocaleString(), accent: 'text-[#956400]' },
          ].map(({ icon: Icon, label, value, accent }) => (
            <div key={label} className="rounded-xl hairline bg-canvas p-6">
              <div className="mb-2 flex items-center gap-2 text-muted">
                <Icon size={16} />
                <span className="text-sm">{label}</span>
              </div>
              <div className={`text-2xl font-bold ${accent}`}>{value}</div>
            </div>
          ))}
        </div>

        {/* Provider Breakdown */}
        <div className="mb-8 rounded-xl hairline bg-canvas p-6">
          <h2 className="mb-4 text-lg font-medium text-ink">Provider Breakdown (Today)</h2>
          {Object.keys(summary.by_provider).length === 0 ? (
            <p className="text-muted">No usage today. Start chatting to see analytics!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-muted">
                    <th className="py-2 text-left">Provider</th>
                    <th className="py-2 text-right">Requests</th>
                    <th className="py-2 text-right">Input Tokens</th>
                    <th className="py-2 text-right">Output Tokens</th>
                    <th className="py-2 text-right">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(summary.by_provider).map(([provider, data]) => (
                    <tr key={provider} className="border-b border-line-soft">
                      <td className="py-3 font-medium capitalize text-ink">{provider}</td>
                      <td className="py-3 text-right text-ink-2">{data.requests}</td>
                      <td className="py-3 text-right text-ink-2">{data.prompt_tokens.toLocaleString()}</td>
                      <td className="py-3 text-right text-ink-2">{data.completion_tokens.toLocaleString()}</td>
                      <td className="py-3 text-right text-[#346538]">${data.cost.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Daily Trend */}
        <div className="rounded-xl hairline bg-canvas p-6">
          <h2 className="mb-4 text-lg font-medium text-ink">Daily Trend (30 days)</h2>
          {dailyData && dailyData.length > 0 ? (
            <div className="space-y-2">
              {dailyData.slice(-14).map((day: any) => (
                <div key={day.date} className="flex items-center gap-4">
                  <span className="w-24 text-sm text-muted">{day.date}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${Math.min(100, (day.cost / 5) * 100)}%` }}
                    />
                  </div>
                  <span className="w-20 text-right text-sm text-[#346538]">${day.cost.toFixed(3)}</span>
                  <span className="w-24 text-right text-sm text-muted">{(day.tokens / 1000).toFixed(1)}K tokens</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted">No data yet. Start chatting!</p>
          )}
        </div>
      </div>
    </div>
  )
}
import { useQuery } from '@tanstack/react-query'
import { api, type UsageSummary } from '../api/client'
import { DollarSign, BarChart3, Cpu, TrendingUp } from 'lucide-react'

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
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-serif font-semibold text-warm-800 mb-2">Analytics</h1>
      <p className="text-warm-500 mb-8">Token usage and cost breakdown across all providers.</p>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-warm-200 p-6">
          <div className="flex items-center gap-2 text-warm-500 mb-2">
            <DollarSign size={16} />
            <span className="text-sm">Today's Cost</span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            ${summary.total_cost.toFixed(4)}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-warm-200 p-6">
          <div className="flex items-center gap-2 text-warm-500 mb-2">
            <BarChart3 size={16} />
            <span className="text-sm">Requests</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {summary.total_requests}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-warm-200 p-6">
          <div className="flex items-center gap-2 text-warm-500 mb-2">
            <Cpu size={16} />
            <span className="text-sm">Input Tokens</span>
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {summary.total_prompt_tokens.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-warm-200 p-6">
          <div className="flex items-center gap-2 text-warm-500 mb-2">
            <TrendingUp size={16} />
            <span className="text-sm">Output Tokens</span>
          </div>
          <div className="text-2xl font-bold text-orange-600">
            {summary.total_completion_tokens.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Provider Breakdown */}
      <div className="bg-white rounded-xl border border-warm-200 p-6 mb-8">
        <h2 className="text-lg font-medium text-warm-800 mb-4">Provider Breakdown (Today)</h2>
        {Object.keys(summary.by_provider).length === 0 ? (
          <p className="text-warm-500">No usage today. Start chatting to see analytics!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-warm-500 border-b border-warm-200">
                  <th className="text-left py-2">Provider</th>
                  <th className="text-right py-2">Requests</th>
                  <th className="text-right py-2">Input Tokens</th>
                  <th className="text-right py-2">Output Tokens</th>
                  <th className="text-right py-2">Cost</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(summary.by_provider).map(([provider, data]) => (
                  <tr key={provider} className="border-b border-warm-100">
                    <td className="py-3 font-medium capitalize text-warm-800">{provider}</td>
                    <td className="py-3 text-right text-warm-700">{data.requests}</td>
                    <td className="py-3 text-right text-warm-700">{data.prompt_tokens.toLocaleString()}</td>
                    <td className="py-3 text-right text-warm-700">{data.completion_tokens.toLocaleString()}</td>
                    <td className="py-3 text-right text-green-600">${data.cost.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Daily Trend */}
      <div className="bg-white rounded-xl border border-warm-200 p-6">
        <h2 className="text-lg font-medium text-warm-800 mb-4">Daily Trend (30 days)</h2>
        {dailyData && dailyData.length > 0 ? (
          <div className="space-y-2">
            {dailyData.slice(-14).map((day: any) => (
              <div key={day.date} className="flex items-center gap-4">
                <span className="text-sm text-warm-500 w-24">{day.date}</span>
                <div className="flex-1 bg-warm-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full"
                    style={{ width: `${Math.min(100, (day.cost / 5) * 100)}%` }}
                  />
                </div>
                <span className="text-sm text-green-600 w-20 text-right">${day.cost.toFixed(3)}</span>
                <span className="text-sm text-warm-500 w-24 text-right">{(day.tokens / 1000).toFixed(1)}K tokens</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-warm-500">No data yet. Start chatting!</p>
        )}
      </div>
    </div>
  )
}

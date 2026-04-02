'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, Users, Clock, TrendingUp, Shield } from 'lucide-react';
import Link from 'next/link';

interface PopularProduct {
  name: string;
  brand: string;
  color: string;
  count: number;
}

interface RepPerformance {
  name: string;
  count: number;
  lastActive: string;
}

interface DailyActivity {
  date: string;
  count: number;
}

interface AnalyticsData {
  totalVisualizations: number;
  thisMonth: number;
  avgProcessingTime: number;
  activeReps: number;
  popularProducts: PopularProduct[];
  repsPerformance: RepPerformance[];
  dailyActivity: DailyActivity[];
}

export default function AnalyticsPage() {
  const { profile, loading: userLoading } = useUser();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [gated, setGated] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    fetchAnalytics();
  }, [userLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchAnalytics() {
    try {
      const res = await fetch('/api/analytics');
      if (res.status === 403) {
        setGated(true);
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const json = await res.json();
      setData(json);
    } catch {
      // Network error
    } finally {
      setLoading(false);
    }
  }

  if (loading || userLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-orange border-t-transparent" />
      </div>
    );
  }

  if (gated) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center">
        <div className="mb-6 flex justify-center">
          <div className="h-16 w-16 rounded-full bg-brand-peach-light flex items-center justify-center">
            <Shield className="h-8 w-8 text-brand-orange" />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-2">Analytics Dashboard</h1>
        <p className="text-brand-brown/50 mb-6">
          Analytics is available on Business plans and above.
          Upgrade your plan to access team performance metrics, product insights, and activity trends.
        </p>
        <Link href="/settings/billing">
          <Button className="bg-brand-orange hover:bg-brand-orange/90 text-white">
            Upgrade Plan
          </Button>
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-5xl mx-auto py-12 text-center text-brand-brown/50">
        <p>Unable to load analytics data.</p>
      </div>
    );
  }

  const maxDaily = Math.max(...data.dailyActivity.map((d) => d.count), 1);
  const maxProductCount = data.popularProducts.length > 0 ? data.popularProducts[0].count : 1;

  function formatProcessingTime(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  function formatShortDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-brand-orange" />
          Analytics
        </h1>
        <p className="text-brand-brown/50">Team performance and visualization insights</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-brand-brown/50">Total Visualizations</span>
              <BarChart3 className="h-4 w-4 text-brand-orange" />
            </div>
            <p className="text-2xl font-bold text-brand-brown">
              {data.totalVisualizations.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-brand-brown/50">This Month</span>
              <TrendingUp className="h-4 w-4 text-brand-orange" />
            </div>
            <p className="text-2xl font-bold text-brand-brown">
              {data.thisMonth.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-brand-brown/50">Avg Processing</span>
              <Clock className="h-4 w-4 text-brand-orange" />
            </div>
            <p className="text-2xl font-bold text-brand-brown">
              {formatProcessingTime(data.avgProcessingTime)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-brand-brown/50">Active Reps</span>
              <Users className="h-4 w-4 text-brand-orange" />
            </div>
            <p className="text-2xl font-bold text-brand-brown">{data.activeReps}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Most Popular Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Most Popular Products</CardTitle>
          </CardHeader>
          <CardContent>
            {data.popularProducts.length === 0 ? (
              <p className="text-sm text-brand-brown/40 py-4 text-center">No data yet</p>
            ) : (
              <div className="space-y-4">
                {data.popularProducts.map((product, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <p className="text-xs text-brand-brown/40">
                          {product.brand} &middot; {product.color}
                        </p>
                      </div>
                      <Badge variant="secondary" className="ml-2 shrink-0">
                        {product.count}
                      </Badge>
                    </div>
                    <div className="w-full bg-brand-peach-light rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-brand-orange rounded-full transition-all"
                        style={{ width: `${(product.count / maxProductCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Team Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {data.repsPerformance.length === 0 ? (
              <p className="text-sm text-brand-brown/40 py-4 text-center">No data yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-peach/30">
                      <th className="text-left py-2 font-medium text-brand-brown/50">Rep</th>
                      <th className="text-right py-2 font-medium text-brand-brown/50">Visualizations</th>
                      <th className="text-right py-2 font-medium text-brand-brown/50">Last Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.repsPerformance.map((rep, i) => (
                      <tr key={i} className="border-b border-brand-peach/10 last:border-0">
                        <td className="py-2.5 font-medium">{rep.name}</td>
                        <td className="py-2.5 text-right">
                          <Badge variant="secondary">{rep.count}</Badge>
                        </td>
                        <td className="py-2.5 text-right text-brand-brown/50">
                          {formatDate(rep.lastActive)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily Activity Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Daily Activity (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-[3px] h-40">
            {data.dailyActivity.map((day) => (
              <div
                key={day.date}
                className="flex-1 group relative flex flex-col items-center justify-end h-full"
              >
                {/* Tooltip */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                  <div className="bg-brand-brown text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow">
                    {formatShortDate(day.date)}: {day.count}
                  </div>
                </div>
                <div
                  className="w-full rounded-t bg-brand-orange/80 hover:bg-brand-orange transition-colors cursor-default"
                  style={{
                    height: day.count > 0 ? `${Math.max((day.count / maxDaily) * 100, 4)}%` : '2px',
                  }}
                />
              </div>
            ))}
          </div>
          {/* X-axis labels: show every 5th day */}
          <div className="flex gap-[3px] mt-1.5">
            {data.dailyActivity.map((day, i) => (
              <div key={day.date} className="flex-1 text-center">
                {i % 5 === 0 ? (
                  <span className="text-[10px] text-brand-brown/40">
                    {formatShortDate(day.date)}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

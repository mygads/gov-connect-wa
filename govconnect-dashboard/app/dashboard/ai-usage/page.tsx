"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertCircle,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCcw,
  Cpu,
  Zap,
  Info,
} from "lucide-react"
import { useAuth } from "@/components/auth/AuthContext"
import { redirect } from "next/navigation"

interface ModelStats {
  model: string
  successRate: string
  totalCalls: number
  successCalls: number
  failedCalls: number
  avgResponseTimeMs: number
  lastUsed: string
  lastError?: string
}

interface ModelDetailStats {
  model: string
  totalCalls: number
  successCalls: number
  failedCalls: number
  successRate: number
  avgResponseTimeMs: number
  totalResponseTimeMs: number
  lastUsed: string
  lastError?: string
  errorHistory: Array<{
    timestamp: string
    error: string
  }>
}

interface AIUsageStats {
  summary: {
    totalRequests: number
    lastUpdated: string | null
    totalModels: number
    serviceStatus?: string
  }
  models: ModelStats[]
  error?: string
}

export default function AIUsagePage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<AIUsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<ModelDetailStats | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Redirect non-superadmin
  useEffect(() => {
    if (user && user.role !== 'superadmin') {
      redirect('/dashboard')
    }
  }, [user])

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/statistics/ai-usage', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch AI usage statistics')
      }

      const data = await response.json()
      setStats(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load AI usage statistics')
    } finally {
      setLoading(false)
    }
  }

  const fetchModelDetail = async (modelName: string) => {
    try {
      setLoadingDetail(true)
      
      const response = await fetch(`/api/statistics/ai-usage/${encodeURIComponent(modelName)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSelectedModel(data)
      } else {
        setSelectedModel(null)
      }
    } catch (err) {
      console.error('Failed to fetch model detail:', err)
      setSelectedModel(null)
    } finally {
      setLoadingDetail(false)
    }
  }

  const getSuccessRateColor = (rate: string) => {
    const numRate = parseInt(rate)
    if (numRate >= 90) return 'text-green-600 dark:text-green-400'
    if (numRate >= 70) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getSuccessRateBadge = (rate: string) => {
    const numRate = parseInt(rate)
    if (numRate >= 90) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    if (numRate >= 70) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date)
  }

  const formatRelativeTime = (dateString: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Baru saja'
    if (diffMins < 60) return `${diffMins} menit lalu`
    if (diffHours < 24) return `${diffHours} jam lalu`
    return `${diffDays} hari lalu`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !stats) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error Loading Data
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchStats} variant="outline" className="w-full">
              <RefreshCcw className="h-4 w-4 mr-2" />
              Coba Lagi
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isOffline = stats?.summary?.serviceStatus === 'offline' || stats?.error

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            AI Usage Log
          </h1>
          <p className="text-muted-foreground">
            Monitor penggunaan dan performa model AI
          </p>
        </div>
        <Button onClick={fetchStats} variant="outline" size="sm">
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Service Status Warning */}
      {isOffline && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">AI Service sedang offline</span>
              <span className="text-sm text-yellow-600 dark:text-yellow-500">
                - Statistik tidak tersedia saat ini
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.summary?.totalRequests?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Total permintaan AI
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Model Aktif</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.summary?.totalModels || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Model yang pernah digunakan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.summary?.lastUpdated 
                ? formatRelativeTime(stats.summary.lastUpdated)
                : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.summary?.lastUpdated 
                ? formatDate(stats.summary.lastUpdated)
                : 'Belum ada data'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Model Statistics Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Statistik Per Model
          </CardTitle>
          <CardDescription>
            Performa dan success rate untuk setiap model AI yang digunakan
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!stats?.models || stats.models.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Cpu className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada data penggunaan model</p>
              <p className="text-sm">Data akan muncul setelah AI service digunakan</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead className="text-center">Success Rate</TableHead>
                  <TableHead className="text-right">Total Calls</TableHead>
                  <TableHead className="text-right">Success</TableHead>
                  <TableHead className="text-right">Failed</TableHead>
                  <TableHead className="text-right">Avg Response</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.models.map((model) => {
                  const successRate = parseInt(model.successRate)
                  return (
                    <TableRow key={model.model}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Cpu className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm">{model.model}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Badge className={getSuccessRateBadge(model.successRate)}>
                            {model.successRate}
                          </Badge>
                          <Progress 
                            value={successRate} 
                            className="h-1.5 w-16"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {model.totalCalls.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-green-600 dark:text-green-400 font-mono flex items-center justify-end gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {model.successCalls.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-red-600 dark:text-red-400 font-mono flex items-center justify-end gap-1">
                          <XCircle className="h-3 w-3" />
                          {model.failedCalls.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {model.avgResponseTimeMs.toLocaleString()} ms
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatRelativeTime(model.lastUsed)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => fetchModelDetail(model.model)}
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Cpu className="h-5 w-5" />
                                Detail Model: {model.model}
                              </DialogTitle>
                              <DialogDescription>
                                Statistik lengkap dan riwayat error untuk model ini
                              </DialogDescription>
                            </DialogHeader>
                            
                            {loadingDetail ? (
                              <div className="space-y-4">
                                <Skeleton className="h-24 w-full" />
                                <Skeleton className="h-48 w-full" />
                              </div>
                            ) : selectedModel ? (
                              <div className="space-y-6 mt-4">
                                {/* Model Stats Summary */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Success Rate</p>
                                    <p className={`text-2xl font-bold ${getSuccessRateColor(selectedModel.successRate.toString() + '%')}`}>
                                      {selectedModel.successRate}%
                                    </p>
                                    <Progress value={selectedModel.successRate} className="h-2" />
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Avg Response Time</p>
                                    <p className="text-2xl font-bold">
                                      {selectedModel.avgResponseTimeMs.toLocaleString()} ms
                                    </p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Total Calls</p>
                                    <p className="text-xl font-semibold">{selectedModel.totalCalls.toLocaleString()}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Last Used</p>
                                    <p className="text-sm">{formatDate(selectedModel.lastUsed)}</p>
                                  </div>
                                </div>

                                {/* Success/Failed Stats */}
                                <div className="flex gap-4">
                                  <div className="flex-1 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                      <CheckCircle2 className="h-5 w-5" />
                                      <span className="font-medium">Success</span>
                                    </div>
                                    <p className="text-2xl font-bold text-green-700 dark:text-green-400 mt-1">
                                      {selectedModel.successCalls.toLocaleString()}
                                    </p>
                                  </div>
                                  <div className="flex-1 p-4 bg-red-50 dark:bg-red-950/30 rounded-lg">
                                    <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                                      <XCircle className="h-5 w-5" />
                                      <span className="font-medium">Failed</span>
                                    </div>
                                    <p className="text-2xl font-bold text-red-700 dark:text-red-400 mt-1">
                                      {selectedModel.failedCalls.toLocaleString()}
                                    </p>
                                  </div>
                                </div>

                                {/* Last Error */}
                                {selectedModel.lastError && (
                                  <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900">
                                    <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">Last Error</p>
                                    <p className="text-sm text-red-600 dark:text-red-300 font-mono break-all">
                                      {selectedModel.lastError}
                                    </p>
                                  </div>
                                )}

                                {/* Error History */}
                                {selectedModel.errorHistory && selectedModel.errorHistory.length > 0 && (
                                  <div>
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                      <AlertCircle className="h-4 w-4 text-red-500" />
                                      Riwayat Error (10 Terakhir)
                                    </h4>
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                      {selectedModel.errorHistory.map((err, idx) => (
                                        <div 
                                          key={idx} 
                                          className="p-3 bg-muted rounded-lg text-sm"
                                        >
                                          <p className="text-xs text-muted-foreground mb-1">
                                            {formatDate(err.timestamp)}
                                          </p>
                                          <p className="font-mono text-xs break-all">{err.error}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Gagal memuat detail model</p>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Performance Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Tips Performa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Model dengan Success Rate ≥90%</p>
                <p className="text-sm text-muted-foreground">
                  Diprioritaskan untuk digunakan dalam sistem
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
              <TrendingDown className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-medium">Model dengan Success Rate &lt;70%</p>
                <p className="text-sm text-muted-foreground">
                  Akan diturunkan prioritasnya atau dihindari
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

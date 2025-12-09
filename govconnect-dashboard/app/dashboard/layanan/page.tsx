"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Settings, Globe, Power, Clock, Users } from "lucide-react"
import { reservasi } from "@/lib/frontend-api"
import { useToast } from "@/hooks/use-toast"

interface Service {
  id: string
  code: string
  name: string
  description: string
  category: string
  is_active: boolean
  is_online_available: boolean
  requirements: string[]
  sop_steps: string[]
  estimated_duration: number
  daily_quota: number
  operating_hours: any
}

const categoryLabels: Record<string, string> = {
  administrasi: "Administrasi",
  perizinan: "Perizinan",
  kependudukan: "Kependudukan",
  sosial: "Sosial",
}

const categoryIcons: Record<string, string> = {
  administrasi: "📋",
  perizinan: "📝",
  kependudukan: "👤",
  sosial: "🏠",
}

export default function LayananPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const data = await reservasi.getServices()
      setServices(data.data || [])
      setError(null)
    } catch (err: any) {
      setError(err.message || "Failed to load services")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (code: string, is_active: boolean) => {
    try {
      setUpdating(code)
      // TODO: Implement toggleServiceActive in frontend-api
      throw new Error('Not implemented yet')
      setServices(services.map(s => 
        s.code === code ? { ...s, is_active } : s
      ))
      toast({ 
        title: is_active ? "Layanan diaktifkan" : "Layanan dinonaktifkan",
        description: `${code} - ${is_active ? 'Aktif' : 'Nonaktif'}`
      })
    } catch (err: any) {
      toast({ title: "Gagal update", description: err.message, variant: "destructive" })
    } finally {
      setUpdating(null)
    }
  }

  const handleToggleOnline = async (code: string, is_online_available: boolean) => {
    try {
      setUpdating(code)
      // TODO: Implement toggleServiceOnline in frontend-api
      throw new Error('Not implemented yet')
      setServices(services.map(s => 
        s.code === code ? { ...s, is_online_available } : s
      ))
      toast({ 
        title: is_online_available ? "Reservasi online diaktifkan" : "Reservasi online dinonaktifkan",
        description: `${code} - ${is_online_available ? 'Online' : 'Offline'}`
      })
    } catch (err: any) {
      toast({ title: "Gagal update", description: err.message, variant: "destructive" })
    } finally {
      setUpdating(null)
    }
  }

  const groupedServices = services.reduce((acc, service) => {
    if (!acc[service.category]) acc[service.category] = []
    acc[service.category].push(service)
    return acc
  }, {} as Record<string, Service[]>)

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Error Loading Services
          </CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchServices} variant="outline">Retry</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manajemen Layanan</h1>
          <p className="text-muted-foreground mt-2">
            Aktifkan atau nonaktifkan layanan dan reservasi online
          </p>
        </div>
        <Button onClick={fetchServices} variant="outline">Refresh</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Power className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{services.filter(s => s.is_active).length}</p>
                <p className="text-sm text-muted-foreground">Layanan Aktif</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{services.filter(s => s.is_online_available).length}</p>
                <p className="text-sm text-muted-foreground">Online Tersedia</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-2xl font-bold">{services.length}</p>
                <p className="text-sm text-muted-foreground">Total Layanan</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{services.reduce((sum, s) => sum + s.daily_quota, 0)}</p>
                <p className="text-sm text-muted-foreground">Total Kuota/Hari</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Semua</TabsTrigger>
          {Object.keys(groupedServices).map(cat => (
            <TabsTrigger key={cat} value={cat}>
              {categoryIcons[cat]} {categoryLabels[cat]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map(service => (
              <ServiceCard 
                key={service.code} 
                service={service} 
                updating={updating === service.code}
                onToggleActive={handleToggleActive}
                onToggleOnline={handleToggleOnline}
              />
            ))}
          </div>
        </TabsContent>

        {Object.entries(groupedServices).map(([category, categoryServices]) => (
          <TabsContent key={category} value={category} className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categoryServices.map(service => (
                <ServiceCard 
                  key={service.code} 
                  service={service} 
                  updating={updating === service.code}
                  onToggleActive={handleToggleActive}
                  onToggleOnline={handleToggleOnline}
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}


interface ServiceCardProps {
  service: Service
  updating: boolean
  onToggleActive: (code: string, is_active: boolean) => void
  onToggleOnline: (code: string, is_online_available: boolean) => void
}

function ServiceCard({ service, updating, onToggleActive, onToggleOnline }: ServiceCardProps) {
  return (
    <Card className={!service.is_active ? "opacity-60" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <Badge variant="outline" className="mb-2">
              {categoryIcons[service.category]} {service.code}
            </Badge>
            <CardTitle className="text-lg">{service.name}</CardTitle>
          </div>
          <div className="flex flex-col gap-2 items-end">
            {service.is_active && (
              <Badge className="bg-green-100 text-green-800">Aktif</Badge>
            )}
            {service.is_online_available && (
              <Badge className="bg-blue-100 text-blue-800">Online</Badge>
            )}
          </div>
        </div>
        <CardDescription className="line-clamp-2">{service.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{service.estimated_duration} menit</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{service.daily_quota} kuota/hari</span>
          </div>
        </div>

        <div className="space-y-3 pt-2 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Power className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Layanan Aktif</span>
            </div>
            <Switch
              checked={service.is_active}
              onCheckedChange={(checked) => onToggleActive(service.code, checked)}
              disabled={updating}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Reservasi Online</span>
            </div>
            <Switch
              checked={service.is_online_available}
              onCheckedChange={(checked) => onToggleOnline(service.code, checked)}
              disabled={updating || !service.is_active}
            />
          </div>
        </div>

        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            Lihat Persyaratan ({service.requirements.length})
          </summary>
          <ul className="mt-2 space-y-1 pl-4">
            {service.requirements.map((req, idx) => (
              <li key={idx} className="text-muted-foreground">• {req}</li>
            ))}
          </ul>
        </details>
      </CardContent>
    </Card>
  )
}

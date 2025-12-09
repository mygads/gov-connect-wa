"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, ArrowLeft, Calendar, Clock, User, Phone, MapPin, FileText, CheckCircle } from "lucide-react"
import { reservasi } from "@/lib/frontend-api"
import { useToast } from "@/hooks/use-toast"

interface Reservation {
  id: string
  reservation_id: string
  wa_user_id: string
  service: {
    id: string
    code: string
    name: string
    description: string
    requirements: string[]
    sop_steps: string[]
  }
  citizen_data: {
    nama_lengkap: string
    nik: string
    alamat: string
    no_hp: string
    [key: string]: any
  }
  reservation_date: string
  reservation_time: string
  queue_number: number
  status: string
  admin_notes: string | null
  created_at: string
  confirmed_at: string | null
  arrived_at: string | null
  completed_at: string | null
  cancelled_at: string | null
}

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Dikonfirmasi" },
  { value: "arrived", label: "Hadir" },
  { value: "completed", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" },
  { value: "no_show", label: "Tidak Hadir" },
]

export default function ReservationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [newStatus, setNewStatus] = useState("")
  const [adminNotes, setAdminNotes] = useState("")

  useEffect(() => {
    fetchReservation()
  }, [params.id])

  const fetchReservation = async () => {
    try {
      setLoading(true)
      const data = await reservasi.getById(params.id as string)
      setReservation(data.data)
      setNewStatus(data.data.status)
      setAdminNotes(data.data.admin_notes || "")
      setError(null)
    } catch (err: any) {
      setError(err.message || "Failed to load reservation")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async () => {
    if (!reservation) return
    try {
      setUpdating(true)
      await reservasi.updateStatus(reservation.id, {
        status: newStatus,
        admin_notes: adminNotes,
      })
      toast({ title: "Status berhasil diupdate" })
      fetchReservation()
    } catch (err: any) {
      toast({ title: "Gagal update status", description: err.message, variant: "destructive" })
    } finally {
      setUpdating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800"
      case "confirmed": return "bg-blue-100 text-blue-800"
      case "arrived": return "bg-purple-100 text-purple-800"
      case "completed": return "bg-green-100 text-green-800"
      case "cancelled": return "bg-red-100 text-red-800"
      case "no_show": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (error || !reservation) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {error || "Reservasi tidak ditemukan"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/reservasi">
              <Button variant="outline">Kembali ke Daftar</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/reservasi">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{reservation.reservation_id}</h1>
          <p className="text-muted-foreground">{reservation.service.name}</p>
        </div>
        <Badge className={`ml-auto ${getStatusColor(reservation.status)}`}>
          {statusOptions.find(s => s.value === reservation.status)?.label || reservation.status}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Data Warga */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Data Warga
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nama Lengkap</p>
                <p className="font-medium">{reservation.citizen_data.nama_lengkap}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">NIK</p>
                <p className="font-mono">{reservation.citizen_data.nik}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">No. HP</p>
                <p className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {reservation.citizen_data.no_hp}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">WhatsApp</p>
                <p className="font-mono text-sm">{reservation.wa_user_id}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Alamat</p>
              <p className="flex items-start gap-1">
                <MapPin className="h-4 w-4 mt-0.5" />
                {reservation.citizen_data.alamat}
              </p>
            </div>
            {/* Data tambahan per layanan */}
            {Object.entries(reservation.citizen_data)
              .filter(([key]) => !['nama_lengkap', 'nik', 'alamat', 'no_hp'].includes(key))
              .map(([key, value]) => (
                <div key={key}>
                  <p className="text-sm text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</p>
                  <p>{String(value)}</p>
                </div>
              ))}
          </CardContent>
        </Card>

        {/* Jadwal Reservasi */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Jadwal Reservasi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Tanggal</p>
                <p className="font-medium">
                  {new Date(reservation.reservation_date).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Jam</p>
                <p className="font-medium flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {reservation.reservation_time} WIB
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nomor Antrian</p>
                <Badge variant="secondary" className="font-mono text-lg">
                  #{reservation.queue_number}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dibuat</p>
                <p className="text-sm">{new Date(reservation.created_at).toLocaleString('id-ID')}</p>
              </div>
            </div>
            {reservation.confirmed_at && (
              <div className="flex items-center gap-2 text-blue-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Dikonfirmasi: {new Date(reservation.confirmed_at).toLocaleString('id-ID')}</span>
              </div>
            )}
            {reservation.arrived_at && (
              <div className="flex items-center gap-2 text-purple-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Hadir: {new Date(reservation.arrived_at).toLocaleString('id-ID')}</span>
              </div>
            )}
            {reservation.completed_at && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Selesai: {new Date(reservation.completed_at).toLocaleString('id-ID')}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Persyaratan Layanan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Persyaratan {reservation.service.name}
            </CardTitle>
            <CardDescription>{reservation.service.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {reservation.service.requirements.map((req, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-muted-foreground">{idx + 1}.</span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Update Status */}
        <Card>
          <CardHeader>
            <CardTitle>Update Status</CardTitle>
            <CardDescription>Ubah status reservasi dan tambahkan catatan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Catatan Admin</label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Tambahkan catatan..."
                className="mt-1"
                rows={3}
              />
            </div>
            <Button 
              onClick={handleUpdateStatus} 
              disabled={updating}
              className="w-full"
            >
              {updating ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

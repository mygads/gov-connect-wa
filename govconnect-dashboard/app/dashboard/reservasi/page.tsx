"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Eye, Search, Calendar, Clock, User } from "lucide-react"
import { reservasi } from "@/lib/frontend-api"
import { formatDate, formatStatus, getStatusColor } from "@/lib/utils"

interface Service {
  id: string
  code: string
  name: string
}

interface Reservation {
  id: string
  reservation_id: string
  wa_user_id: string
  service: Service
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
  created_at: string
}

const statusOptions = [
  { value: "all", label: "Semua" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Dikonfirmasi" },
  { value: "arrived", label: "Hadir" },
  { value: "completed", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" },
  { value: "no_show", label: "Tidak Hadir" },
]

export default function ReservasiListPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("")

  useEffect(() => {
    fetchReservations()
  }, [])

  const fetchReservations = async () => {
    try {
      setLoading(true)
      const data = await reservasi.getAll()
      setReservations(data.data || [])
      setError(null)
    } catch (err: any) {
      setError(err.message || "Failed to load reservations")
    } finally {
      setLoading(false)
    }
  }

  const filteredReservations = reservations.filter((rsv) => {
    const matchSearch =
      search === "" ||
      rsv.reservation_id.toLowerCase().includes(search.toLowerCase()) ||
      rsv.wa_user_id.includes(search) ||
      rsv.citizen_data.nama_lengkap?.toLowerCase().includes(search.toLowerCase()) ||
      rsv.service.name.toLowerCase().includes(search.toLowerCase())

    const matchStatus = statusFilter === "all" || rsv.status === statusFilter
    
    const matchDate = !dateFilter || rsv.reservation_date.startsWith(dateFilter)

    return matchSearch && matchStatus && matchDate
  })

  const getReservationStatusColor = (status: string) => {
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

  const formatReservationStatus = (status: string) => {
    switch (status) {
      case "pending": return "Pending"
      case "confirmed": return "Dikonfirmasi"
      case "arrived": return "Hadir"
      case "completed": return "Selesai"
      case "cancelled": return "Dibatalkan"
      case "no_show": return "Tidak Hadir"
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 mb-2" />
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
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
            <Button onClick={fetchReservations} variant="outline">Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Daftar Reservasi</h1>
          <p className="text-muted-foreground mt-2">
            Kelola reservasi kedatangan warga untuk layanan kelurahan
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/layanan">
            <Button variant="outline">Kelola Layanan</Button>
          </Link>
          <Button onClick={fetchReservations} variant="outline">Refresh</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter & Search</CardTitle>
          <div className="flex gap-4 mt-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nomor reservasi, nama, atau layanan..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-[180px]"
            />
            <div className="flex gap-2 flex-wrap">
              {statusOptions.slice(0, 4).map((opt) => (
                <Button
                  key={opt.value}
                  variant={statusFilter === opt.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredReservations.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Tidak ada data reservasi</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Reservasi</TableHead>
                    <TableHead>Nama Warga</TableHead>
                    <TableHead>Layanan</TableHead>
                    <TableHead>Tanggal & Jam</TableHead>
                    <TableHead>Antrian</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReservations.map((rsv) => (
                    <TableRow key={rsv.id}>
                      <TableCell className="font-medium font-mono">
                        {rsv.reservation_id}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{rsv.citizen_data.nama_lengkap}</div>
                            <div className="text-xs text-muted-foreground">{rsv.wa_user_id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{rsv.service.name}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div>{new Date(rsv.reservation_date).toLocaleDateString('id-ID')}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {rsv.reservation_time} WIB
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono">
                          #{rsv.queue_number}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getReservationStatusColor(rsv.status)}>
                          {formatReservationStatus(rsv.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/dashboard/reservasi/${rsv.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Detail
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="mt-4 text-sm text-muted-foreground">
            Menampilkan {filteredReservations.length} dari {reservations.length} reservasi
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

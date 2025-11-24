"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, ArrowLeft, CheckCircle, Loader2, Phone, Calendar, FileText } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { formatDate, formatStatus, getStatusColor } from "@/lib/utils"

interface Ticket {
  id: string
  ticket_id: string
  wa_user_id: string
  jenis: string
  data_json: any
  status: string
  created_at: string
  updated_at: string
}

export default function TiketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [newStatus, setNewStatus] = useState("")
  const [adminNotes, setAdminNotes] = useState("")

  useEffect(() => {
    if (params.id) {
      fetchTicketDetail(params.id as string)
    }
  }, [params.id])

  const fetchTicketDetail = async (id: string) => {
    try {
      setLoading(true)
      const data = await apiClient.getTicketById(id)
      setTicket(data)
      setNewStatus(data.status)
      setError(null)
    } catch (err: any) {
      setError(err.message || "Failed to load ticket detail")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async () => {
    if (!ticket || !newStatus) return

    try {
      setUpdating(true)
      await apiClient.updateTicketStatus(ticket.id, {
        status: newStatus,
        admin_notes: adminNotes || undefined,
      })
      
      // Refresh data
      await fetchTicketDetail(ticket.id)
      setAdminNotes("")
      setError(null)
    } catch (err: any) {
      setError(err.message || "Failed to update status")
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error Loading Data
            </CardTitle>
            <CardDescription>{error || "Ticket not found"}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => fetchTicketDetail(params.id as string)} variant="outline">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{ticket.ticket_id}</h1>
          <p className="text-sm text-muted-foreground">Detail Tiket Layanan</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Tiket</CardTitle>
              <CardDescription>Detail lengkap tiket layanan dari warga</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Nomor Tiket</Label>
                  <p className="font-mono font-semibold text-foreground">{ticket.ticket_id}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    WhatsApp
                  </Label>
                  <p className="font-mono text-foreground">{ticket.wa_user_id}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Jenis Layanan</Label>
                <Badge variant="outline" className="capitalize text-base px-3 py-1">
                  {ticket.jenis.replace(/_/g, " ")}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Data Lengkap (JSON)
                </Label>
                <pre className="text-sm text-foreground bg-muted p-4 rounded-md overflow-x-auto">
                  {JSON.stringify(ticket.data_json, null, 2)}
                </pre>
              </div>

              <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                <div className="space-y-2">
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Dibuat
                  </Label>
                  <p className="text-sm text-foreground">{formatDate(ticket.created_at)}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Diupdate
                  </Label>
                  <p className="text-sm text-foreground">{formatDate(ticket.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status Tiket</CardTitle>
              <CardDescription>Update status penanganan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Status Saat Ini</Label>
                <Badge className={`${getStatusColor(ticket.status)} text-base px-3 py-1 w-full justify-center`}>
                  {formatStatus(ticket.status)}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Ubah Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="proses">Proses</SelectItem>
                    <SelectItem value="selesai">Selesai</SelectItem>
                    <SelectItem value="ditolak">Ditolak</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Catatan Admin (Opsional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Tambahkan catatan untuk warga..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                />
              </div>

              <Button
                onClick={handleUpdateStatus}
                disabled={updating || newStatus === ticket.status}
                className="w-full"
              >
                {updating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Update Status
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

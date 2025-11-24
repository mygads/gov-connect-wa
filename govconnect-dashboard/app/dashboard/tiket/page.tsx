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
import { AlertCircle, Eye, Search } from "lucide-react"
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
}

export default function TiketListPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getTickets()
      setTickets(data.data || [])
      setError(null)
    } catch (err: any) {
      setError(err.message || "Failed to load tickets")
    } finally {
      setLoading(false)
    }
  }

  const filteredTickets = tickets.filter((ticket) => {
    const matchSearch =
      search === "" ||
      ticket.ticket_id.toLowerCase().includes(search.toLowerCase()) ||
      ticket.wa_user_id.includes(search) ||
      ticket.jenis.toLowerCase().includes(search.toLowerCase())

    const matchStatus = statusFilter === "all" || ticket.status === statusFilter

    return matchSearch && matchStatus
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
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
            <Button onClick={fetchTickets} variant="outline">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">List Tiket</h1>
          <p className="text-muted-foreground mt-2">
            Kelola semua tiket layanan dari warga
          </p>
        </div>
        <Button onClick={fetchTickets} variant="outline">
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter & Search</CardTitle>
          <div className="flex gap-4 mt-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nomor tiket, WA, atau jenis..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
              >
                Semua
              </Button>
              <Button
                variant={statusFilter === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("pending")}
              >
                Pending
              </Button>
              <Button
                variant={statusFilter === "proses" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("proses")}
              >
                Proses
              </Button>
              <Button
                variant={statusFilter === "selesai" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("selesai")}
              >
                Selesai
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Tidak ada data tiket</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Tiket</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Jenis Layanan</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-medium">
                        {ticket.ticket_id}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {ticket.wa_user_id}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {ticket.jenis.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {typeof ticket.data_json === 'object' 
                          ? JSON.stringify(ticket.data_json).substring(0, 50) + '...'
                          : ticket.data_json
                        }
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(ticket.status)}>
                          {formatStatus(ticket.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(ticket.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/dashboard/tiket/${ticket.id}`}>
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
            Menampilkan {filteredTickets.length} dari {tickets.length} tiket
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

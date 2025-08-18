import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Booking } from "@/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, FileText, Trash2, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AdminBookingTableProps {
  bookings: Booking[];
  onRefresh: () => void;
}

export default function AdminBookingTable({ bookings, onRefresh }: AdminBookingTableProps) {
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const response = await apiRequest("PATCH", `/api/admin/bookings/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Prenotazione aggiornata",
        description: "La prenotazione è stata aggiornata con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      setEditingBooking(null);
      onRefresh();
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Errore nell'aggiornamento della prenotazione.",
        variant: "destructive",
      });
    },
  });

  const deleteBookingMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/bookings/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Prenotazione cancellata",
        description: "La prenotazione è stata cancellata con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      onRefresh();
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Errore nella cancellazione della prenotazione.",
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = (bookingId: string, newStatus: string) => {
    updateBookingMutation.mutate({
      id: bookingId,
      updates: { status: newStatus },
    });
  };

  const handleGenerateContract = async (bookingId: string, bookingCode: string) => {
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/contract`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Errore nella generazione del contratto');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `Contratto-${bookingCode}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Contratto generato",
        description: "Il contratto PDF è stato scaricato con successo.",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore nella generazione del contratto PDF.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">In Attesa</Badge>;
      case 'CONFIRMED':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Confermata</Badge>;
      case 'CANCELLED':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Cancellata</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Codice</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Veicolo</TableHead>
              <TableHead>Periodo</TableHead>
              <TableHead>Totale</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead>Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className="font-mono text-sm" data-testid={`booking-code-${booking.bookingCode}`}>
                  {booking.bookingCode}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium text-gray-900">
                      {booking.customerFirstName} {booking.customerLastName}
                    </div>
                    <div className="text-sm text-gray-600">{booking.customerEmail}</div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-900">
                  {booking.vehicle.name}
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {new Date(booking.startDate).toLocaleDateString('it-IT')} - {new Date(booking.endDate).toLocaleDateString('it-IT')}
                </TableCell>
                <TableCell className="font-semibold text-gray-900">
                  €{booking.totalPrice}
                </TableCell>
                <TableCell>
                  <Select 
                    value={booking.status} 
                    onValueChange={(value) => handleStatusUpdate(booking.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">In Attesa</SelectItem>
                      <SelectItem value="CONFIRMED">Confermata</SelectItem>
                      <SelectItem value="CANCELLED">Cancellata</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setEditingBooking(booking)}
                          data-testid={`edit-booking-${booking.bookingCode}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Modifica Prenotazione {booking.bookingCode}</DialogTitle>
                        </DialogHeader>
                        {editingBooking && (
                          <EditBookingForm 
                            booking={editingBooking}
                            onSave={(updates) => updateBookingMutation.mutate({ id: editingBooking.id, updates })}
                            onCancel={() => setEditingBooking(null)}
                            isLoading={updateBookingMutation.isPending}
                          />
                        )}
                      </DialogContent>
                    </Dialog>

                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleGenerateContract(booking.id, booking.bookingCode)}
                      data-testid={`generate-contract-${booking.bookingCode}`}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>

                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        if (confirm('Sei sicuro di voler cancellare questa prenotazione?')) {
                          deleteBookingMutation.mutate(booking.id);
                        }
                      }}
                      data-testid={`delete-booking-${booking.bookingCode}`}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {bookings.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nessuna prenotazione</h3>
          <p className="text-gray-600">Non ci sono prenotazioni al momento.</p>
        </div>
      )}
    </div>
  );
}

interface EditBookingFormProps {
  booking: Booking;
  onSave: (updates: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function EditBookingForm({ booking, onSave, onCancel, isLoading }: EditBookingFormProps) {
  const [formData, setFormData] = useState({
    customerFirstName: booking.customerFirstName,
    customerLastName: booking.customerLastName,
    customerPhone: booking.customerPhone,
    customerEmail: booking.customerEmail,
    notes: booking.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Nome</Label>
          <Input 
            value={formData.customerFirstName}
            onChange={(e) => setFormData(prev => ({ ...prev, customerFirstName: e.target.value }))}
          />
        </div>
        <div>
          <Label>Cognome</Label>
          <Input 
            value={formData.customerLastName}
            onChange={(e) => setFormData(prev => ({ ...prev, customerLastName: e.target.value }))}
          />
        </div>
        <div>
          <Label>Telefono</Label>
          <Input 
            value={formData.customerPhone}
            onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
          />
        </div>
        <div>
          <Label>Email</Label>
          <Input 
            value={formData.customerEmail}
            onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
          />
        </div>
      </div>
      
      <div>
        <Label>Note</Label>
        <Input 
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annulla
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Salvando..." : "Salva"}
        </Button>
      </div>
    </form>
  );
}

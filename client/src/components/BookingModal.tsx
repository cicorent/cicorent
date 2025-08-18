import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Vehicle, QuoteResult, QuoteInput, BookingData } from "@/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { X, Check, Phone } from "lucide-react";

const bookingSchema = z.object({
  customerFirstName: z.string().min(1, "Nome richiesto"),
  customerLastName: z.string().min(1, "Cognome richiesto"),
  customerBirthDate: z.string().min(1, "Data di nascita richiesta"),
  customerPhone: z.string().min(1, "Telefono richiesto"),
  customerEmail: z.string().email("Email non valida"),
  driverLicenseNo: z.string().min(1, "Numero patente richiesto"),
  addFirstName: z.string().optional(),
  addLastName: z.string().optional(),
  addBirthDate: z.string().optional(),
  addDriverLicenseNo: z.string().optional(),
  notes: z.string().optional(),
  terms: z.boolean().refine(val => val === true, "Devi accettare i termini e condizioni"),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle;
  quote: QuoteResult | null;
  bookingData: Partial<QuoteInput>;
}

export default function BookingModal({ isOpen, onClose, vehicle, quote, bookingData }: BookingModalProps) {
  const [showAdditionalDriver, setShowAdditionalDriver] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      customerFirstName: "",
      customerLastName: "",
      customerBirthDate: "",
      customerPhone: "",
      customerEmail: "",
      driverLicenseNo: "",
      addFirstName: "",
      addLastName: "",
      addBirthDate: "",
      addDriverLicenseNo: "",
      notes: "",
      terms: false,
    },
  });

  // Check if additional driver fields should be shown
  useState(() => {
    if (bookingData.extraDriver || bookingData.extraDriverUnder25) {
      setShowAdditionalDriver(true);
    }
  });

  const bookingMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      const bookingPayload: BookingData = {
        vehicleId: vehicle.id,
        startDate: bookingData.startDate!,
        endDate: bookingData.endDate!,
        daysCount: quote?.daysCount || 1,
        packageType: bookingData.packageType!,
        kmPlan: bookingData.kmPlan!,
        coverage: bookingData.coverage!,
        extraDriver: bookingData.extraDriver || false,
        extraDriverUnder25: bookingData.extraDriverUnder25 || false,
        homeDelivery: bookingData.homeDelivery || false,
        homePickup: bookingData.homePickup || false,
        customerFirstName: data.customerFirstName,
        customerLastName: data.customerLastName,
        customerBirthDate: data.customerBirthDate,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        driverLicenseNo: data.driverLicenseNo,
        addFirstName: data.addFirstName,
        addLastName: data.addLastName,
        addBirthDate: data.addBirthDate,
        addDriverLicenseNo: data.addDriverLicenseNo,
        notes: data.notes,
      };

      const response = await apiRequest("POST", "/api/book", bookingPayload);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Prenotazione confermata!",
        description: `Codice prenotazione: ${data.booking.bookingCode}. Riceverai una chiamata da una nostra operatrice in giornata.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      onClose();
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Errore nella prenotazione",
        description: error.message || "Si è verificato un errore durante la prenotazione.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BookingFormData) => {
    if (!quote || !bookingData.startDate || !bookingData.endDate) {
      toast({
        title: "Dati mancanti",
        description: "Assicurati di aver configurato correttamente il noleggio.",
        variant: "destructive",
      });
      return;
    }
    bookingMutation.mutate(data);
  };

  if (!quote) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            Prenotazione Online
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Customer Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dati del cliente</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customerFirstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <Input data-testid="customer-first-name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerLastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cognome *</FormLabel>
                      <FormControl>
                        <Input data-testid="customer-last-name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerBirthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data di nascita *</FormLabel>
                      <FormControl>
                        <Input type="date" data-testid="customer-birth-date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefono *</FormLabel>
                      <FormControl>
                        <Input type="tel" data-testid="customer-phone" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" data-testid="customer-email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="driverLicenseNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numero patente *</FormLabel>
                      <FormControl>
                        <Input data-testid="driver-license-no" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Additional Driver Section */}
            {showAdditionalDriver && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Conducente aggiuntivo</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="addFirstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input data-testid="additional-first-name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="addLastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cognome</FormLabel>
                        <FormControl>
                          <Input data-testid="additional-last-name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="addBirthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data di nascita</FormLabel>
                        <FormControl>
                          <Input type="date" data-testid="additional-birth-date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="addDriverLicenseNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numero patente</FormLabel>
                        <FormControl>
                          <Input data-testid="additional-license-no" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note aggiuntive</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Inserisci eventuali richieste particolari..."
                      data-testid="booking-notes"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Terms and Conditions */}
            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox 
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="terms-checkbox"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm cursor-pointer">
                      Accetto i <span className="text-blue-600 hover:text-blue-700">Termini e Condizioni</span> 
                      {" "}e l'<span className="text-blue-600 hover:text-blue-700">Informativa sulla Privacy</span> *
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            {/* Price Summary and Submit */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="text-center mb-4">
                <div className="text-2xl font-bold text-blue-800 mb-1">
                  {quote.total.toFixed(2)}€
                </div>
                <div className="text-sm text-gray-600">Totale del noleggio (IVA inclusa)</div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 h-12"
                disabled={bookingMutation.isPending}
                data-testid="submit-booking-btn"
              >
                {bookingMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Prenotazione in corso...
                  </div>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Conferma Prenotazione
                  </>
                )}
              </Button>
              
              <p className="text-sm text-gray-600 text-center mt-4">
                <Phone className="w-4 h-4 inline mr-1" />
                Riceverai una chiamata da una nostra operatrice in giornata per confermare la prenotazione
              </p>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

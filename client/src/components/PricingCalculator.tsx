import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Vehicle, QuoteInput, QuoteResult } from "@/types";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface PricingCalculatorProps {
  vehicle: Vehicle;
  onQuoteUpdate: (quote: QuoteResult | null) => void;
  onBookingDataUpdate: (data: Partial<QuoteInput>) => void;
}

export default function PricingCalculator({ vehicle, onQuoteUpdate, onBookingDataUpdate }: PricingCalculatorProps) {
  const [formData, setFormData] = useState<QuoteInput>({
    vehicleId: vehicle.id,
    startDate: '',
    endDate: '',
    packageType: 'STANDARD_24H',
    kmPlan: 'KM_100',
    coverage: 'BASE',
    extraDriver: false,
    extraDriverUnder25: false,
    homeDelivery: false,
    homePickup: false,
  });

  const { data: quote, refetch: fetchQuote } = useQuery<QuoteResult>({
    queryKey: ["/api/quote", formData],
    enabled: false,
  });

  useEffect(() => {
    if (formData.startDate && formData.endDate && formData.startDate <= formData.endDate) {
      fetchQuote();
      onBookingDataUpdate(formData);
    } else {
      onQuoteUpdate(null);
    }
  }, [formData, fetchQuote, onQuoteUpdate, onBookingDataUpdate]);

  useEffect(() => {
    if (quote) {
      onQuoteUpdate(quote);
    }
  }, [quote, onQuoteUpdate]);

  const handleFormChange = (field: keyof QuoteInput, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Handle mutual exclusivity for extra drivers
      if (field === 'extraDriver' && value && prev.extraDriverUnder25) {
        newData.extraDriverUnder25 = false;
      } else if (field === 'extraDriverUnder25' && value && prev.extraDriver) {
        newData.extraDriver = false;
      }
      
      return newData;
    });
  };

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-gray-50 rounded-xl p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Configura il tuo noleggio</h3>
      
      <div className="space-y-6">
        {/* Date Range Picker */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2">Periodo di noleggio</Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                type="date"
                min={today}
                value={formData.startDate}
                onChange={(e) => handleFormChange('startDate', e.target.value)}
                data-testid="start-date-input"
              />
              <Label className="text-xs text-gray-500 mt-1">Data inizio</Label>
            </div>
            <div>
              <Input
                type="date"
                min={formData.startDate || today}
                value={formData.endDate}
                onChange={(e) => handleFormChange('endDate', e.target.value)}
                data-testid="end-date-input"
              />
              <Label className="text-xs text-gray-500 mt-1">Data fine</Label>
            </div>
          </div>
        </div>
        
        {/* Package Type */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2">Tipo di noleggio</Label>
          <Select value={formData.packageType} onValueChange={(value: any) => handleFormChange('packageType', value)}>
            <SelectTrigger data-testid="package-type-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="STANDARD_24H">Standard 24h</SelectItem>
              {vehicle.type === 'VAN' && (
                <>
                  <SelectItem value="VAN_4H">Furgone 4h</SelectItem>
                  <SelectItem value="VAN_10H">Furgone 10h</SelectItem>
                </>
              )}
              <SelectItem value="WEEKLY">Settimanale</SelectItem>
              <SelectItem value="MONTHLY">Mensile</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Coverage */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2">Copertura assicurativa</Label>
          <RadioGroup value={formData.coverage} onValueChange={(value) => handleFormChange('coverage', value)}>
            <div className="flex items-start space-x-3">
              <RadioGroupItem value="BASE" id="coverage-base" />
              <div className="flex-1">
                <Label htmlFor="coverage-base" className="font-medium text-gray-900 cursor-pointer">Base</Label>
                <p className="text-sm text-gray-600">RCA 500€ • Kasko 1000€ • Furto/Incendio 15%</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <RadioGroupItem value="PARTIAL" id="coverage-partial" />
              <div className="flex-1">
                <Label htmlFor="coverage-partial" className="font-medium text-gray-900 cursor-pointer">Parziale (+25%)</Label>
                <p className="text-sm text-gray-600">RCA 250€ • Kasko 750€ • Furto/Incendio 15%</p>
              </div>
            </div>
          </RadioGroup>
        </div>
        
        {/* KM Plan */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2">Piano chilometri</Label>
          <RadioGroup value={formData.kmPlan} onValueChange={(value) => handleFormChange('kmPlan', value)}>
            <div className="flex items-start space-x-3">
              <RadioGroupItem value="KM_100" id="km-100" />
              <div className="flex-1">
                <Label htmlFor="km-100" className="font-medium text-gray-900 cursor-pointer">100 km/giorno</Label>
                <p className="text-sm text-gray-600">Incluso nel prezzo base</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <RadioGroupItem value="KM_200" id="km-200" />
              <div className="flex-1">
                <Label htmlFor="km-200" className="font-medium text-gray-900 cursor-pointer">200 km/giorno (+5€/giorno)</Label>
                <p className="text-sm text-gray-600">Ideale per viaggi lunghi</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <RadioGroupItem value="UNLIMITED" id="km-unlimited" />
              <div className="flex-1">
                <Label htmlFor="km-unlimited" className="font-medium text-gray-900 cursor-pointer">Km illimitati (+10€/giorno)</Label>
                <p className="text-sm text-gray-600">Massima libertà di movimento</p>
              </div>
            </div>
          </RadioGroup>
        </div>
        
        {/* Extra Options */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-3">Opzioni extra</Label>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="extra-driver"
                  checked={formData.extraDriver}
                  onCheckedChange={(checked) => handleFormChange('extraDriver', checked)}
                  data-testid="extra-driver-checkbox"
                />
                <Label htmlFor="extra-driver" className="font-medium text-gray-900">Conducente aggiuntivo</Label>
              </div>
              <span className="text-sm text-gray-600">+8€/giorno</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="extra-driver-under25"
                  checked={formData.extraDriverUnder25}
                  onCheckedChange={(checked) => handleFormChange('extraDriverUnder25', checked)}
                  data-testid="extra-driver-under25-checkbox"
                />
                <Label htmlFor="extra-driver-under25" className="font-medium text-gray-900">Conducente aggiuntivo under 25</Label>
              </div>
              <span className="text-sm text-gray-600">+10€/giorno</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="home-delivery"
                  checked={formData.homeDelivery}
                  onCheckedChange={(checked) => handleFormChange('homeDelivery', checked)}
                  data-testid="home-delivery-checkbox"
                />
                <Label htmlFor="home-delivery" className="font-medium text-gray-900">Consegna a domicilio</Label>
              </div>
              <span className="text-sm text-gray-600">30€ (entro 10 km)</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="home-pickup"
                  checked={formData.homePickup}
                  onCheckedChange={(checked) => handleFormChange('homePickup', checked)}
                  data-testid="home-pickup-checkbox"
                />
                <Label htmlFor="home-pickup" className="font-medium text-gray-900">Ritiro a domicilio</Label>
              </div>
              <span className="text-sm text-gray-600">30€ (entro 10 km)</span>
            </div>
          </div>
        </div>
        
        {/* Price Breakdown */}
        {quote && (
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-3">Riepilogo prezzi</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Base ({quote.daysCount} giorni):</span>
                <span>{quote.breakdown.baseWithDiscount.toFixed(2)}€</span>
              </div>
              {quote.discountEuroShown > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Sconto multi-giorno:</span>
                  <span>-{quote.discountEuroShown}€ (-{quote.discountPctShown}%)</span>
                </div>
              )}
              {quote.breakdown.km > 0 && (
                <div className="flex justify-between">
                  <span>Chilometri extra:</span>
                  <span>{quote.breakdown.km}€</span>
                </div>
              )}
              {quote.breakdown.extra > 0 && (
                <div className="flex justify-between">
                  <span>Conducente extra:</span>
                  <span>{quote.breakdown.extra}€</span>
                </div>
              )}
              {quote.breakdown.delivery > 0 && (
                <div className="flex justify-between">
                  <span>Consegna/Ritiro:</span>
                  <span>{quote.breakdown.delivery}€</span>
                </div>
              )}
              <hr className="my-2" />
              <div className="flex justify-between font-bold text-lg">
                <span>Totale:</span>
                <span data-testid="total-price">{quote.total.toFixed(2)}€</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                IVA inclusa • Cauzione: 1.000€ • Km eccedenti: 1€/km
              </p>
            </div>
            
            {quote.discountEuroShown > 0 && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <i className="fas fa-tag text-green-600"></i>
                  <span className="text-sm font-medium text-green-800">Risparmia con il noleggio multi-giorno!</span>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  Stai risparmiando {quote.discountEuroShown}€ prenotando per più giorni.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

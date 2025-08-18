import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Vehicle } from '@shared/schema';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { PricingUtils } from '@/utils/pricing';
import { log } from 'console';

interface RentalPackage {
  id: string;
  name: string;
  description: string;
  discount: number;
  days: number;
}

const packages: RentalPackage[] = [
  { id: 'STANDARD_24H', name: 'Giornaliero', description: '24 ore', discount: 0,    days: 1 },
  { id: 'THREE_DAYS',   name: '3 Giorni',    description: 'Sconto 35%', discount: 0.35, days: 3 },
  { id: 'FIVE_DAYS',    name: '5 Giorni',    description: 'Sconto 40%', discount: 0.40, days: 5 },
  { id: 'WEEKLY',       name: 'Settimanale', description: '7 giorni, sconto 45%', discount: 0.45, days: 7 },
  { id: 'MONTHLY',      name: 'Mensile',     description: '30 giorni, sconto 50%', discount: 0.50, days: 30 },
];

// Date utility functions
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function isDateDisabled(date: Date, disabledDates: string[]): boolean {
  const dateStr = formatDate(date);
  return disabledDates.includes(dateStr) || date < new Date();
}

// Single DatePicker Component for both start and end dates
interface UnifiedDatePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onDateSelect: (date: Date, isStartDate: boolean) => void;
  disabledDates: string[];
}

function UnifiedDatePicker({ startDate, endDate, onDateSelect, disabledDates }: UnifiedDatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isSelectingStartDate, setIsSelectingStartDate] = useState(true);
  
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };
  
  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date, disabledDates)) return;
    
    if (isSelectingStartDate) {
      // If selecting start date and there's already an end date that's before this date, clear end date
      if (endDate && date >= endDate) {
        onDateSelect(date, true);
        onDateSelect(date, false); // Also set end date to same date initially
      } else {
        onDateSelect(date, true);
      }
      setIsSelectingStartDate(false);
    } else {
      // If selecting end date, ensure it's after start date
      if (startDate && date >= startDate) {
        onDateSelect(date, false);
        setIsSelectingStartDate(true); // Reset to start date selection for next time
      }
    }
  };
  
  const days = [];
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-10"></div>);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const isDisabled = isDateDisabled(date, disabledDates) || (startDate && !isSelectingStartDate && date < startDate);
    const isStartSelected = startDate && formatDate(date) === formatDate(startDate);
    const isEndSelected = endDate && formatDate(date) === formatDate(endDate);
    const isInRange = startDate && endDate && date > startDate && date < endDate;
    
    let buttonClass = `h-10 w-10 rounded-lg text-sm font-medium transition-colors `;
    
    if (isDisabled) {
      buttonClass += 'text-gray-300 cursor-not-allowed';
    } else if (isStartSelected) {
      buttonClass += 'bg-blue-600 text-white';
    } else if (isEndSelected) {
      buttonClass += 'bg-green-600 text-white';
    } else if (isInRange) {
      buttonClass += 'bg-blue-100 text-blue-800';
    } else {
      buttonClass += 'text-gray-700 hover:bg-blue-50 hover:text-blue-600';
    }
    
    days.push(
      <button
        key={day}
        onClick={() => handleDateClick(date)}
        disabled={isDisabled || false}
        className={buttonClass}
        data-testid={`date-${formatDate(date)}`}
      >
        {day}
      </button>
    );
  }
  
  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Seleziona Date</h3>
          <p className="text-sm text-gray-600">
            {isSelectingStartDate ? 'Clicca per selezionare la data di inizio' : 'Clicca per selezionare la data di fine'}
          </p>
        </div>
        <div className="text-right text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-600 rounded mr-2"></div>
              <span>Inizio</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-600 rounded mr-2"></div>
              <span>Fine</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(addDays(currentMonth, -30))}
          className="p-2 hover:bg-gray-100 rounded-lg"
          data-testid="prev-month"
        >
          <i className="fas fa-chevron-left text-gray-600"></i>
        </button>
        
        <h3 className="font-semibold text-gray-900">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        
        <button
          onClick={() => setCurrentMonth(addDays(currentMonth, 30))}
          className="p-2 hover:bg-gray-100 rounded-lg"
          data-testid="next-month"
        >
          <i className="fas fa-chevron-right text-gray-600"></i>
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'].map(day => (
          <div key={day} className="h-10 flex items-center justify-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>
      
      {startDate && endDate && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex justify-between text-sm">
            <span><strong>Dal:</strong> {startDate.toLocaleDateString('it-IT')}</span>
            <span><strong>Al:</strong> {endDate.toLocaleDateString('it-IT')}</span>
          </div>
          <div className="text-center mt-2 text-blue-700 font-semibold">
            {Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1} giorni
          </div>
        </div>
      )}
    </div>
  );
}

// Package Cards Component
interface PackageCardsProps {
  vehicle: Vehicle;
  startDate: Date | null;
  endDate: Date | null;
  selectedPackage: RentalPackage | null;
  onPackageSelect: (packageType: RentalPackage) => void;
}

function PackageCards({ vehicle, startDate, endDate, selectedPackage, onPackageSelect }: PackageCardsProps) {
  const basePrice = parseFloat(vehicle.basePriceDay);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Scontistica Applicata</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {packages.map((pkg) => {
          const isSelected = selectedPackage?.id === pkg.id;
          const price = Math.round((basePrice * (1 - pkg.discount)) / 5) * 5;
          
          return (
            <button
              disabled
              key={pkg.id}
              onClick={() => onPackageSelect(pkg)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                isSelected 
                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                  : 'border-gray-200 opacity-60'
              }`}
              data-testid={`package-${pkg.id}`}
            >
              <div className="text-sm font-semibold text-gray-900 mb-1">{pkg.name}</div>
              <div className="text-xs text-gray-600 mb-3">{pkg.description}</div>
              <div className="text-lg font-bold text-blue-600">€{(price * pkg.days).toFixed(2)}</div>
              <div className="text-xs text-gray-500">€{price.toFixed(2)}/giorno</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Options Component
interface OptionsProps {
  kmPlan: string;
  coverage: string;
  extraDriver: boolean;
  extraDriverUnder25: boolean;
  homeDelivery: boolean;
  homePickup: boolean;
  onKmPlanChange: (value: "KM_100" | "KM_200" | "UNLIMITED") => void;
  onCoverageChange: (value: "BASE" | "PARTIAL") => void;
  onExtraDriverChange: (value: boolean) => void;
  onExtraDriverUnder25Change: (value: boolean) => void;
  onHomeDeliveryChange: (value: boolean) => void;
  onHomePickupChange: (value: boolean) => void;
}

function Options({ 
  kmPlan, coverage, extraDriver, extraDriverUnder25, homeDelivery, homePickup,
  onKmPlanChange, onCoverageChange, onExtraDriverChange, onExtraDriverUnder25Change, 
  onHomeDeliveryChange, onHomePickupChange 
}: OptionsProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4">
      <h3 className="text-lg font-semibold mb-4">Opzioni Noleggio</h3>
      
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Chilometraggio</label>
          <select
            value={kmPlan}
            onChange={(e) => onKmPlanChange(e.target.value as any)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            data-testid="km-plan-select"
          >
            <option value="KM_100">100 KM / Giorno</option>
            <option value="KM_200">200 KM / Giorno</option>
            <option value="UNLIMITED">KM Illimitati</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Copertura Assicurativa</label>
          <select
            value={coverage}
            onChange={(e) => onCoverageChange(e.target.value as any)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            data-testid="coverage-select"
          >
            <option value="BASE">Base</option>
            <option value="PARTIAL">Pacchetto Meno Stress</option>
          </select>
        </div>
      </div>
      
      <div className="space-y-3">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={extraDriverUnder25}
            onChange={(e) => onExtraDriverUnder25Change(e.target.checked)}
            className="mr-2"
            data-testid="under25-checkbox"
          />
          <span>Conducente Under 25 (+€10/giorno)</span>
        </label>
        
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={extraDriver}
            onChange={(e) => onExtraDriverChange(e.target.checked)}
            className="mr-2"
            data-testid="extra-driver-checkbox"
          />
          <span>Conducente aggiuntivo (+€8/giorno)</span>
        </label>
        
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={homeDelivery}
            onChange={(e) => onHomeDeliveryChange(e.target.checked)}
            className="mr-2"
            data-testid="delivery-checkbox"
          />
          <span>Consegna a domicilio (+€30)</span>
        </label>
        
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={homePickup}
            onChange={(e) => onHomePickupChange(e.target.checked)}
            className="mr-2"
            data-testid="pickup-checkbox"
          />
          <span>Ritiro a domicilio (+€30)</span>
        </label>
      </div>
    </div>
  );
}

// Booking Summary Component
interface BookingSummaryProps {
  quote: any;
  onBookClick: () => void;
}

function BookingSummary({ quote, onBookClick }: BookingSummaryProps) {
  if (!quote) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 sticky top-4">
      <h3 className="text-lg font-semibold text-blue-900 mb-4">Riepilogo Prenotazione</h3>
      <div className="space-y-2 text-sm mb-4">
        <div className="flex justify-between">
          <span>Tariffa base ({quote.days || 0} giorni)</span>
          <span>€{quote.baseTotal || 0}</span>
        </div>
        {quote.discountEuro > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Sconto multi-giorno ({quote.discountPct || 0}%)</span>
            <span>-€{quote.discountEuro || 0}</span>
          </div>
        )}
        {(quote.extras || []).map((extra: any, index: number) => (
          <div key={index} className="flex justify-between">
            <span>{extra.name}</span>
            <span>€{extra.price}</span>
          </div>
        ))}
        <hr className="border-blue-300" />
        <div className="flex justify-between font-bold text-lg text-blue-900">
          <span>Totale</span>
          <span>€{quote.total || 0}</span>
        </div>
      </div>
      
      <button
        onClick={onBookClick}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        data-testid="book-now-button"
      >
        <i className="fas fa-calendar-check mr-2"></i>
        INVIA PRENOTAZIONE
      </button>
    </div>
  );
}

// Booking Modal Component
interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
  hasExtraDriver: boolean;
}

function BookingModal({ isOpen, onClose, onSubmit, isLoading, hasExtraDriver }: BookingModalProps) {
  const [formData, setFormData] = useState({
    customerFirstName: '',
    customerLastName: '',
    customerBirthDate: '',
    customerPhone: '',
    customerEmail: '',
    driverLicenseNo: '',
    addFirstName: '',
    addLastName: '',
    addBirthDate: '',
    addDriverLicenseNo: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Conferma Prenotazione</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              data-testid="close-modal"
            >
              &times;
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Dati Conducente Principale</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                  <input
                    type="text"
                    name="customerFirstName"
                    value={formData.customerFirstName}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    data-testid="first-name-input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cognome *</label>
                  <input
                    type="text"
                    name="customerLastName"
                    value={formData.customerLastName}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    data-testid="last-name-input"
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data di Nascita *</label>
                  <input
                    type="date"
                    name="customerBirthDate"
                    value={formData.customerBirthDate}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    data-testid="birth-date-input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Numero Patente *</label>
                  <input
                    type="text"
                    name="driverLicenseNo"
                    value={formData.driverLicenseNo}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    data-testid="license-input"
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefono *</label>
                  <input
                    type="tel"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    data-testid="phone-input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    name="customerEmail"
                    value={formData.customerEmail}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    data-testid="email-input"
                  />
                </div>
              </div>
            </div>
            
            {hasExtraDriver && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Dati Conducente Aggiuntivo</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                    <input
                      type="text"
                      name="addFirstName"
                      value={formData.addFirstName}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      data-testid="add-first-name-input"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cognome</label>
                    <input
                      type="text"
                      name="addLastName"
                      value={formData.addLastName}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      data-testid="add-last-name-input"
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data di Nascita</label>
                    <input
                      type="date"
                      name="addBirthDate"
                      value={formData.addBirthDate}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      data-testid="add-birth-date-input"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Numero Patente</label>
                    <input
                      type="text"
                      name="addDriverLicenseNo"
                      value={formData.addDriverLicenseNo}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      data-testid="add-license-input"
                    />
                  </div>
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Note aggiuntive</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                data-testid="notes-input"
              />
            </div>
            
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                data-testid="cancel-button"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                data-testid="submit-booking"
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Invio in corso...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check mr-2"></i>
                    INVIA
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function VehicleDetailPage() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedPackage, setSelectedPackage] = useState<RentalPackage | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [kmPlan, setKmPlan] = useState<"KM_100" | "KM_200" | "UNLIMITED">('KM_100');
  const [coverage, setCoverage] = useState<"BASE" | "PARTIAL">('BASE');
  const [extraDriver, setExtraDriver] = useState(false);
  const [extraDriverUnder25, setExtraDriverUnder25] = useState(false);
  const [homeDelivery, setHomeDelivery] = useState(false);
  const [homePickup, setHomePickup] = useState(false);
  const [reduction, setReduction] = useState<"NONE" | "4H" | "10H">('NONE');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [quote, setQuote] = useState<any>(null);

  const { data: vehicle } = useQuery<Vehicle>({
    queryKey: ['/api/vehicles', vehicleId],
  });

  const { data: availability } = useQuery<{ availableQuantity: number; blackoutDates: string[] }>({
    queryKey: ['/api/vehicles', vehicleId, 'availability', startDate ? formatDate(startDate) : '', endDate ? formatDate(endDate) : ''],
    enabled: !!(vehicleId && startDate && endDate),
  });

  // Get fully booked dates for this vehicle
  const { data: fullyBookedDates } = useQuery<string[]>({
    queryKey: ['/api/vehicles', vehicleId, 'fully-booked'],
    enabled: !!vehicleId,
  });

  useEffect(() => {
    if (!startDate || !endDate) return;
  
    const d = PricingUtils.daysInclusive(startDate, endDate);

    const target = packages.findLast(p => d >= p.days) ?? packages[0];
  
    if (!selectedPackage || selectedPackage.id !== target.id) {
      setSelectedPackage(target);
    }
  }, [startDate, endDate, selectedPackage]);
  

  useEffect(() => {
    if (!vehicle || !startDate || !endDate) { 
      setQuote(null); 
      return; 
    }
  
    try {
      const calc = PricingUtils.compute({
        vehicle: vehicle.slug,
        startDate,
        endDate,
        kmPlan,
        coverage,
        extraDriver,
        extraDriverUnder25,
        homeDelivery,
        homePickup,
        reduction
      });
      setQuote(calc);
    } catch (e: any) {
      console.error(e?.message ?? String(e));
    }
  }, [vehicle, startDate, endDate, kmPlan, coverage, extraDriver, extraDriverUnder25, homeDelivery, homePickup]);
  
  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const response = await apiRequest('POST', '/api/bookings', bookingData);
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Prenotazione Confermata!",
        description: `Codice prenotazione: ${data.booking.bookingCode}. Riceverai una chiamata entro oggi.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
      setShowBookingModal(false);
      // Redirect to home or confirmation page
      window.location.href = '/';
    },
    onError: (error: any) => {
      toast({
        title: "Errore Prenotazione",
        description: error.message || "Si è verificato un errore durante la prenotazione",
        variant: "destructive",
      });
    },
  });

  const handleDateSelect = (date: Date, isStartDate: boolean) => {
    if (isStartDate) {
      setStartDate(date);
      if (!endDate || date >= endDate) {
        setEndDate(addDays(date, 1)); // Set end date to next day by default
      }
    } else {
      setEndDate(date);
    }
  };

  const handleBookingSubmit = (customerData: any) => {
    if (!vehicle || !startDate || !endDate || !quote) return;
    
    // Clean customer data - remove empty strings and convert to null for optional date fields
    const cleanedCustomerData = {
      ...customerData,
      addBirthDate: customerData.addBirthDate || null,
      addFirstName: customerData.addFirstName || null,
      addLastName: customerData.addLastName || null,
      addDriverLicenseNo: customerData.addDriverLicenseNo || null,
      notes: customerData.notes || null,
    };
    
    const bookingData = {
      vehicleId: vehicle.id,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      daysCount: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
      packageType: selectedPackage?.id,
      kmPlan,
      coverage,
      extraDriver,
      extraDriverUnder25,
      homeDelivery,
      homePickup,
      ...cleanedCustomerData,
    };
    
    createBookingMutation.mutate(bookingData);
  };

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
          <p className="text-gray-600">Caricamento veicolo...</p>
        </div>
      </div>
    );
  }

  const disabledDates = [
    ...(availability?.blackoutDates || []),
    ...(fullyBookedDates || [])
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => window.history.back()}
              className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
              data-testid="back-button"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Torna alla lista
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 text-white px-3 py-2 rounded-lg font-bold text-lg">CICO</div>
              <span className="font-medium text-gray-900">Rent</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Vehicle Info */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="md:flex">
            <div className="md:w-1/2">
              {vehicle.imageUrl ? (
                <img
                  src={vehicle.imageUrl}
                  alt={vehicle.name}
                  className="w-full h-64 md:h-full object-cover"
                />
              ) : (
                <div className="w-full h-64 md:h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-50">
                  <i className={`fas fa-${vehicle.type === 'CAR' ? 'car' : 'truck'} text-8xl text-blue-400`}></i>
                </div>
              )}
            </div>
            
            <div className="md:w-1/2 p-8">
              <div className="mb-4">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {vehicle.type === 'CAR' ? 'Auto' : 'Furgone'}
                </span>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{vehicle.name}</h1>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center text-gray-600">
                  <i className="fas fa-users w-5 mr-3"></i>
                  <span>{vehicle.seats} posti</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <i className="fas fa-cog w-5 mr-3"></i>
                  <span>{vehicle.transmission === 'MANUAL' ? 'Manuale' : 'Automatico'}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <i className="fas fa-gas-pump w-5 mr-3"></i>
                  <span>{vehicle.fuelType === 'GASOLINE' ? 'Benzina' : vehicle.fuelType === 'DIESEL' ? 'Diesel' : 'Elettrica'}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <i className="fas fa-check-circle w-5 mr-3"></i>
                  <span>{vehicle.availableQuantity} disponibili</span>
                </div>
              </div>
              
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-bold text-blue-600">€{vehicle.basePriceDay}</span>
                <span className="text-gray-500">/giorno</span>
              </div>
            </div>
          </div>
        </div>

        {/* Package Cards */}
        <div className="mb-8">
          <PackageCards
            vehicle={vehicle}
            startDate={startDate}
            endDate={endDate}
            selectedPackage={selectedPackage}
            onPackageSelect={setSelectedPackage}
          />
        </div>

        {/* Main booking section */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left column */}
          <div className="space-y-6">
            {/* Date Selection */}
            <UnifiedDatePicker
              startDate={startDate}
              endDate={endDate}
              onDateSelect={handleDateSelect}
              disabledDates={disabledDates}
            />
          </div>
          
          {/* Right column - Booking Summary */}
          <div>
            {/* Options */}
            <Options
              kmPlan={kmPlan}
              coverage={coverage}
              extraDriver={extraDriver}
              extraDriverUnder25={extraDriverUnder25}
              homeDelivery={homeDelivery}
              homePickup={homePickup}
              onKmPlanChange={setKmPlan}
              onCoverageChange={setCoverage}
              onExtraDriverChange={setExtraDriver}
              onExtraDriverUnder25Change={setExtraDriverUnder25}
              onHomeDeliveryChange={setHomeDelivery}
              onHomePickupChange={setHomePickup}
            />
            {quote && (
              <BookingSummary
                quote={quote}
                onBookClick={() => setShowBookingModal(true)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        onSubmit={handleBookingSubmit}
        isLoading={createBookingMutation.isPending}
        hasExtraDriver={extraDriver}
      />
    </div>
  );
}
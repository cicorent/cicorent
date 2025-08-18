import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Booking, Vehicle, BlackoutDate } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Admin Login Component
interface AdminLoginProps {
  onLogin: (credentials: { username: string; password: string }) => void;
  isLoading: boolean;
}

function AdminLogin({ onLogin, isLoading }: AdminLoginProps) {
  const [credentials, setCredentials] = useState({ username: '', password: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(credentials);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="bg-blue-600 text-white px-3 py-2 rounded-lg font-bold text-lg">CICO</div>
            <span className="font-medium text-gray-900">Rent Admin</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Accesso Amministratore</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              data-testid="admin-username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              data-testid="admin-password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            data-testid="admin-login-btn"
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Accesso...
              </>
            ) : (
              'Accedi'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// Bookings List Component
interface BookingsListProps {
  bookings: (Booking & { vehicle: Vehicle })[];
  onStatusChange: (bookingId: string, status: 'PENDING' | 'CONFIRMED' | 'CANCELLED') => void;
}

function BookingsList({ bookings, onStatusChange }: BookingsListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'In Attesa';
      case 'CONFIRMED':
        return 'Confermata';
      case 'CANCELLED':
        return 'Annullata';
      default:
        return status;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Prenotazioni</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Codice</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Veicolo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Totale</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stato</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900">
                  {booking.bookingCode}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {booking.customerFirstName} {booking.customerLastName}
                  </div>
                  <div className="text-sm text-gray-500">{booking.customerPhone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {booking.vehicle.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {booking.startDate} - {booking.endDate}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  €{booking.totalPrice}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                    {getStatusText(booking.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    {booking.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => onStatusChange(booking.id, 'CONFIRMED')}
                          className="text-green-600 hover:text-green-900"
                          data-testid={`confirm-${booking.id}`}
                        >
                          Conferma
                        </button>
                        <button
                          onClick={() => onStatusChange(booking.id, 'CANCELLED')}
                          className="text-red-600 hover:text-red-900"
                          data-testid={`cancel-${booking.id}`}
                        >
                          Annulla
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Blackout Dates Manager Component
interface BlackoutManagerProps {
  vehicles: Vehicle[];
}

function BlackoutManager({ vehicles }: BlackoutManagerProps) {
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: blackoutDates = [] } = useQuery<BlackoutDate[]>({
    queryKey: ['/api/blackout-dates', selectedVehicle],
    enabled: !!selectedVehicle,
  });

  const addBlackoutMutation = useMutation({
    mutationFn: (data: { vehicleId: string; date: string }) => 
      apiRequest('/api/blackout-dates', 'POST', data),
    onSuccess: () => {
      toast({
        title: "Data Bloccata",
        description: "La data è stata aggiunta alle date non disponibili",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/blackout-dates'] });
      setSelectedDate('');
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeBlackoutMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/blackout-dates/${id}`, 'DELETE'),
    onSuccess: () => {
      toast({
        title: "Data Sbloccata",
        description: "La data è stata rimossa dalle date non disponibili",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/blackout-dates'] });
    },
  });

  const handleAddBlackout = () => {
    if (!selectedVehicle || !selectedDate) return;
    addBlackoutMutation.mutate({ vehicleId: selectedVehicle, date: selectedDate });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Gestione Date Non Disponibili</h2>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Veicolo</label>
          <select
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            data-testid="vehicle-select"
          >
            <option value="">Seleziona veicolo</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            data-testid="blackout-date-input"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={handleAddBlackout}
            disabled={!selectedVehicle || !selectedDate || addBlackoutMutation.isPending}
            className="w-full bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
            data-testid="add-blackout-btn"
          >
            {addBlackoutMutation.isPending ? (
              <i className="fas fa-spinner fa-spin mr-2"></i>
            ) : (
              <i className="fas fa-ban mr-2"></i>
            )}
            Blocca Data
          </button>
        </div>
      </div>

      {selectedVehicle && blackoutDates.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Date Bloccate</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {blackoutDates.map((blackout) => (
              <div key={blackout.id} className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between">
                <span className="text-sm text-red-800">{blackout.date}</span>
                <button
                  onClick={() => removeBlackoutMutation.mutate(blackout.id)}
                  className="text-red-600 hover:text-red-800"
                  data-testid={`remove-blackout-${blackout.id}`}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'bookings' | 'blackouts'>('bookings');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: (credentials: { username: string; password: string }) =>
      apiRequest('POST', '/api/admin/login', credentials),
    onSuccess: () => {
      setIsLoggedIn(true);
      toast({
        title: "Accesso Effettuato",
        description: "Benvenuto nell'area amministratore",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore di Accesso",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { data: bookings = [] } = useQuery<(Booking & { vehicle: Vehicle })[]>({
    queryKey: ['/api/admin/bookings'],
    enabled: isLoggedIn,
  });

  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ['/api/vehicles'],
    enabled: isLoggedIn,
  });

  const updateBookingMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest('PATCH', `/api/admin/bookings/${id}`, { status }),
    onSuccess: () => {
      toast({
        title: "Prenotazione Aggiornata",
        description: "Lo stato della prenotazione è stato modificato",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bookings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogin = (credentials: { username: string; password: string }) => {
    loginMutation.mutate(credentials);
  };

  const handleStatusChange = (bookingId: string, status: 'PENDING' | 'CONFIRMED' | 'CANCELLED') => {
    updateBookingMutation.mutate({ id: bookingId, status });
  };

  const handleLogout = async () => {
    try {
      await apiRequest('/api/admin/logout', 'POST');
      setIsLoggedIn(false);
      toast({
        title: "Logout Effettuato",
        description: "Arrivederci!",
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!isLoggedIn) {
    return <AdminLogin onLogin={handleLogin} isLoading={loginMutation.isPending} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 text-white px-3 py-2 rounded-lg font-bold text-lg">CICO</div>
              <span className="font-medium text-gray-900">Rent Admin</span>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.href = '/'}
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                <i className="fas fa-home mr-2"></i>
                Homepage
              </button>
              
              <button
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 transition-colors"
                data-testid="logout-btn"
              >
                <i className="fas fa-sign-out-alt mr-2"></i>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-8">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              activeTab === 'bookings'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            data-testid="bookings-tab"
          >
            <i className="fas fa-calendar-check mr-2"></i>
            Prenotazioni
          </button>
          
          <button
            onClick={() => setActiveTab('blackouts')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              activeTab === 'blackouts'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            data-testid="blackouts-tab"
          >
            <i className="fas fa-ban mr-2"></i>
            Date Non Disponibili
          </button>
        </div>

        {/* Content */}
        {activeTab === 'bookings' && (
          <BookingsList bookings={bookings} onStatusChange={handleStatusChange} />
        )}

        {activeTab === 'blackouts' && (
          <BlackoutManager vehicles={vehicles} />
        )}
      </div>
    </div>
  );
}
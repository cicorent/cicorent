import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Vehicle } from '@shared/schema';
import { useIsMobile } from '@/hooks/use-mobile';

// Phone Modal Component
interface PhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function PhoneModal({ isOpen, onClose }: PhoneModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-phone text-2xl text-blue-600"></i>
          </div>
          <h3 className="text-xl font-semibold mb-2">Chiamaci Ora</h3>
          <p className="text-gray-600 mb-6">Un nostro operatore ti assisterà per la prenotazione</p>
          <a 
            href="tel:+393287153527"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-block mb-4"
            data-testid="phone-modal-call"
          >
            <i className="fas fa-phone mr-2"></i>+39 328 715 3527
          </a>
          <button 
            onClick={onClose}
            className="block w-full text-gray-500 hover:text-gray-700 transition-colors"
            data-testid="phone-modal-close"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}

// Vehicle Card Component
interface VehicleCardProps {
  vehicle: Vehicle;
}

function VehicleCard({ vehicle }: VehicleCardProps) {
  const isMobile = useIsMobile();
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  const handleBookClick = () => {
    if (isMobile) {
      setShowPhoneModal(true);
    } else {
      // Navigate to vehicle detail page
      window.location.href = `/veicoli/${vehicle.id}`;
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <div className="aspect-video bg-gradient-to-br from-blue-50 to-white relative overflow-hidden">
          {vehicle.imageUrl ? (
            <img 
              src={vehicle.imageUrl} 
              alt={vehicle.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-50">
              <i className={`fas fa-${vehicle.type === 'CAR' ? 'car' : 'truck'} text-6xl text-blue-400`}></i>
            </div>
          )}
          <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            {vehicle.type === 'CAR' ? 'Auto' : 'Furgone'}
          </div>
        </div>
        
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-2" data-testid={`vehicle-name-${vehicle.id}`}>
            {vehicle.name}
          </h3>
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-gray-600">
              <i className="fas fa-users w-4 mr-2"></i>
              <span>{vehicle.seats} posti</span>
            </div>
            <div className="flex items-center text-gray-600">
              <i className="fas fa-cog w-4 mr-2"></i>
              <span>{vehicle.transmission === 'MANUAL' ? 'Manuale' : 'Automatico'}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <i className="fas fa-gas-pump w-4 mr-2"></i>
              <span>{vehicle.fuelType === 'GASOLINE' ? 'Benzina' : vehicle.fuelType === 'DIESEL' ? 'Diesel' : 'Elettrica'}</span>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-2xl font-bold text-blue-600">€{vehicle.basePriceDay}</span>
                <span className="text-gray-500 ml-1">/giorno</span>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Disponibili</div>
                <div className="font-semibold text-green-600">{vehicle.availableQuantity}</div>
              </div>
            </div>
            
            <button 
              onClick={handleBookClick}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              data-testid={`vehicle-book-${vehicle.id}`}
            >
              <i className="fas fa-calendar-plus mr-2"></i>
              {isMobile ? 'Chiama per Prenotare' : 'Prenota Ora'}
            </button>
          </div>
        </div>
      </div>

      <PhoneModal 
        isOpen={showPhoneModal} 
        onClose={() => setShowPhoneModal(false)} 
      />
    </>
  );
}

export default function HomePage() {
  const isMobile = useIsMobile();
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ['/api/vehicles'],
  });

  const handlePhoneClick = () => {
    if (isMobile) {
      window.location.href = 'tel:+393287153527';
    } else {
      setShowPhoneModal(true);
    }
  };

  const scrollToVehicles = () => {
    document.getElementById('vehicles')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 text-white px-3 py-2 rounded-lg font-bold text-lg">CICO</div>
            <span className="font-medium text-gray-900">Rent</span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <a href="#home" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Home</a>
            <a href="#vehicles" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Veicoli</a>
            <a href="#about" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Chi Siamo</a>
            <a href="#contact" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">Contatti</a>
          </div>

          <div className="flex items-center space-x-4">
            <button 
              onClick={handlePhoneClick}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              data-testid="header-phone-btn"
            >
              <i className="fas fa-phone mr-2"></i>
              {isMobile ? 'Chiama' : 'Chiamaci'}
            </button>
            <button className="md:hidden text-gray-600">
              <i className="fas fa-bars text-xl"></i>
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section id="home" className="cico-gradient text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-6">
                Noleggio Auto<br />
                <span className="text-blue-300">e Furgoni</span><br />
                a Roma
              </h1>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                La soluzione più conveniente per i tuoi spostamenti. 
                Veicoli moderni, prezzi competitivi e un servizio clienti d'eccellenza.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={scrollToVehicles}
                  className="bg-white text-blue-800 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-all transform hover:scale-105 shadow-lg"
                  data-testid="hero-vehicles-btn"
                >
                  <i className="fas fa-car mr-2"></i>Vedi Veicoli
                </button>
                <button 
                  onClick={handlePhoneClick}
                  className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-blue-800 transition-all"
                  data-testid="hero-phone-btn"
                >
                  <i className="fas fa-phone mr-2"></i>+39 328 715 3527
                </button>
              </div>
            </div>
            
            <div className="relative animate-fade-in">
              <img 
                src="https://images.unsplash.com/photo-1549924231-f129b911e442?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=600" 
                alt="Flotta moderna di veicoli CICO Rent" 
                className="rounded-2xl shadow-2xl w-full h-auto"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-lg animate-scale-in">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <i className="fas fa-check text-green-600"></i>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Disponibili Subito</p>
                    <p className="text-gray-600 text-sm">7 veicoli in flotta</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vehicles Section */}
      <section id="vehicles" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">La Nostra Flotta</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Scegli tra auto e furgoni moderni, sempre puliti e pronti per ogni tua esigenza
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {vehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Chi Siamo</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              CICO Rent (by FGS Gas) nasce come evoluzione naturale di un gruppo con decenni di esperienza nella distribuzione di carburanti nel Lazio e una solida competenza nel settore automotive.
              La nostra missione è offrire un noleggio trasparente, flessibile e conveniente, con processi rapidi e un’assistenza vicina alle esigenze di chi lavora e di chi viaggia.
              Scegliendo CICO Rent, conti su una gestione affidabile e su veicoli selezionati e mantenuti con cura, disponibili per il breve e medio termine. Ritiro semplice nell’area Torrino/Mezzocammino – Via Cristoforo Colombo 1778, consegna/ritiro a domicilio su richiesta e prezzi IVA inclusa.
              La tradizione di FGS Gas è garanzia di serietà: mettiamo a disposizione la nostra esperienza per far sì che ogni noleggio sia chiaro, rapido e senza sorprese.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 cico-gradient text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Contattaci</h2>
            <p className="text-xl text-blue-100">Siamo qui per aiutarti a trovare il veicolo perfetto</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="bg-blue-700 bg-opacity-50 rounded-2xl p-8">
              <div className="bg-white bg-opacity-20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-phone text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-2">Telefono</h3>
              <p className="text-blue-100 mb-4">Chiamaci per informazioni e prenotazioni</p>
              <a href="tel:+393287153527" className="text-white font-semibold hover:text-blue-200 transition-colors">
                +39 328 715 3527
              </a>
            </div>
            
            <div className="bg-blue-700 bg-opacity-50 rounded-2xl p-8">
              <div className="bg-white bg-opacity-20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-envelope text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-2">Email</h3>
              <p className="text-blue-100 mb-4">Scrivici per ricevere un preventivo</p>
              <a href="mailto:info@cicorent.it" className="text-white font-semibold hover:text-blue-200 transition-colors">
                info@cicorent.it
              </a>
            </div>
            
            <div className="bg-blue-700 bg-opacity-50 rounded-2xl p-8">
              <div className="bg-white bg-opacity-20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-map-marker-alt text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold mb-2">Indirizzo</h3>
              <p className="text-blue-100 mb-4">Vieni a trovarci presso la nostra sede</p>
              <address className="text-white font-semibold not-italic">
                Via Cristoforo Colombo 1778<br />
                00127 Roma (EUR Torrino)
              </address>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-blue-600 px-3 py-2 rounded-lg font-bold text-lg">CICO</div>
                <span className="font-medium">Rent</span>
              </div>
              <p className="text-gray-400 mb-4">
                Il tuo partner affidabile per il noleggio di auto e furgoni a Roma.
              </p>
              <p className="text-sm text-gray-500">
                FGS GAS SAS<br />
                P.IVA/CF 05855791009<br />
                VIA DI SANT ALESSANDRO 279<br />
                00131 ROMA (RM)
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Servizi</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Noleggio Auto</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Noleggio Furgoni</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Noleggio Orario</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Consegna a Domicilio</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Informazioni</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Condizioni Generali</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Coperture Assicurative</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contatti</h4>
              <div className="space-y-3 text-gray-400">
                <div className="flex items-center space-x-2">
                  <i className="fas fa-phone text-sm"></i>
                  <span>+39 328 715 3527</span>
                </div>
                <div className="flex items-center space-x-2">
                  <i className="fas fa-envelope text-sm"></i>
                  <span>info@cicorent.it</span>
                </div>
                <div className="flex items-center space-x-2">
                  <i className="fas fa-clock text-sm"></i>
                  <span>Lun-Ven 9:00-18:00</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 CICO Rent. Tutti i diritti riservati.</p>
          </div>
        </div>
      </footer>

      <PhoneModal 
        isOpen={showPhoneModal} 
        onClose={() => setShowPhoneModal(false)} 
      />
    </div>
  );
}
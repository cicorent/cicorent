import { Vehicle } from "@/types";
import { useLocation } from "wouter";

interface VehicleCardProps {
  vehicle: Vehicle;
}

export default function VehicleCard({ vehicle }: VehicleCardProps) {
  const [, setLocation] = useLocation();

  const getVehicleImage = (type: string, slug: string) => {
    if (slug === 'crafter') {
      return "https://pixabay.com/get/g23de386d57c87d30d50ee2d61b4d743df5027a7f761dc46846f7abc34a428cf5cba1446c416f309fe02aa23a3323b64a43c2d438b8bf1ee5bf5098ff3ffd50d4_1280.jpg";
    } else if (slug === 'boxer') {
      return "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=600";
    } else {
      return "https://images.unsplash.com/photo-1583121274602-3e2820c69888?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=600";
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
      <img 
        src={getVehicleImage(vehicle.type, vehicle.slug)} 
        alt={vehicle.name} 
        className="w-full h-56 object-cover rounded-t-2xl"
      />
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-bold text-gray-900">{vehicle.name}</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            vehicle.type === 'VAN' 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {vehicle.type === 'VAN' ? 'Furgone' : 'Auto'}
          </span>
        </div>
        
        <p className="text-gray-600 mb-4">
          {vehicle.type === 'VAN' ? 'Ideale per traslochi e trasporti' : 'Perfetto per spostamenti urbani'}
        </p>
        
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div className="flex items-center text-gray-600">
            <i className="fas fa-users mr-2 text-gray-400"></i>
            <span>{vehicle.quantity} unità</span>
          </div>
          <div className="flex items-center text-gray-600">
            <i className="fas fa-palette mr-2 text-gray-400"></i>
            <span>{vehicle.colorOptions.join(', ')}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-500">da</span>
            <div className="text-2xl font-bold text-blue-800">
              {vehicle.basePriceDay}€
              <span className="text-sm font-normal text-gray-600">/24h</span>
            </div>
            <span className="text-xs text-gray-500">IVA inclusa</span>
          </div>
          <button 
            onClick={() => setLocation(`/veicoli/${vehicle.slug}`)}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium"
            data-testid={`vehicle-card-book-${vehicle.slug}`}
          >
            Prenota
          </button>
        </div>
      </div>
    </div>
  );
}

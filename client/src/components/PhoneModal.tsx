import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PhoneModal({ isOpen, onClose }: PhoneModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-phone text-blue-600 text-2xl"></i>
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-900 mb-4">
            Chiamaci Ora
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center">
          <p className="text-gray-600 mb-6">
            Parla direttamente con un nostro operatore per prenotare il tuo veicolo
          </p>
          
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="text-3xl font-bold text-blue-800 mb-2">+39 328 715 3527</div>
            <div className="text-sm text-gray-600">Lun-Ven 9:00-18:00 • Sab 9:00-13:00</div>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors"
              data-testid="phone-modal-close"
            >
              Chiudi
            </button>
            <a 
              href="tel:+393287153527" 
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium"
              data-testid="phone-modal-call"
            >
              <i className="fas fa-phone mr-2"></i>Chiama
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

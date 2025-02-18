
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface IndexProps {
  onClose: () => void;
}

const Index: React.FC<IndexProps> = ({ onClose }) => {
  const { toast } = useToast();

  const showInfo = () => {
    toast({
      title: "Estás en la página principal",
      description: "Esta es la ruta 'index' de la aplicación",
    });
  };

  return (
    <div className="h-screen w-screen overflow-hidden">
      <button 
        onClick={onClose}
        className="absolute top-3 left-3 z-30 p-2 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 text-white/80 hover:bg-black/40 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="flex flex-col items-center justify-center h-full p-4">
        <h1 className="text-2xl font-bold mb-4">Página Principal</h1>
        <p className="text-gray-600 mb-4">Ruta actual: /index</p>
        <button
          onClick={showInfo}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Mostrar Información
        </button>
      </div>
    </div>
  );
};

export default Index;

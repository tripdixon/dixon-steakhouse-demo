import React from 'react';
import { Utensils } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-burgundy text-cream py-6 px-4 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Utensils size={28} className="text-gold" />
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold">Dixon Steakhouse</h1>
            <p className="text-xs md:text-sm">Reservation Management</p>
          </div>
        </div>
        <div className="hidden md:block">
          <p className="text-sm italic">Est. 2025</p>
        </div>
      </div>
    </header>
  );
};

export default Header;
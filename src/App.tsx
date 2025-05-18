import React from 'react';
import Header from './components/Header';
import ReservationTable from './components/ReservationTable';

function App() {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Header />
      
      <main className="flex-grow p-4 md:p-8">
        <div className="container mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-serif text-charcoal">Reservation Dashboard</h2>
            <p className="text-charcoal/80">Manage your restaurant reservations</p>
          </div>
          
          <ReservationTable />
        </div>
      </main>
      
      <footer className="bg-charcoal text-cream py-4 px-8 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} Dixon Steakhouse. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
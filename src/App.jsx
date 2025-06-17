// App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import BillingSystem from './Component/BillingSystem';
import Navbar from './Component/Navbar';
import Sales from './Component/Sales';
import Transaction from './Component/Transaction';
import Reports from './Component/Reports';

const App = () => {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<BillingSystem />} />
        <Route path='/sales' element={<Sales />} />
        <Route path='/transactions' element={<Transaction />} />
        <Route path='/Reports' element={<Reports />} />
      </Routes>
    </>
  );
};

export default App;

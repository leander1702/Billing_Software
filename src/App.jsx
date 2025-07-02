// App.jsx
import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import BillingSystem from './Component/BillingSystem';
import Navbar from './Component/Navbar';
import Sales from './Component/Sales';
import Transaction from './Component/Transaction';
import Reports from './Component/Reports';
import UserLogin from './Component/UserLogin';
import { ToastContainer } from 'react-toastify';
import Header from './Component/Header';

const App = () => {
  const location = useLocation();
  return (
    <>
      {/* {location.pathname !== '/login' && <Header />} */}
      {location.pathname !== '/login' && <Navbar />}
      <ToastContainer />
      <Routes>
        <Route path='/login' element={<UserLogin />} />
        <Route path="/" element={<BillingSystem />} />
        <Route path='/sales' element={<Sales />} />
        <Route path='/transactions' element={<Transaction />} />
        <Route path='/Reports' element={<Reports />} />
      </Routes>
    </>
  );
};

export default App;

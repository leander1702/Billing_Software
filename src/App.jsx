// App.jsx
import React, { useRef, useState } from 'react'; // Import useRef and useState
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

  // Create refs for all shortcut actions
  const focusProductSearchRef = useRef(null);
  const focusProductCodeRef = useRef(null);
  const focusQuantityRef = useRef(null);
  const triggerAddProductRef = useRef(null);
  const focusCustomerNameRef = useRef(null);
  const focusPhoneNumberRef = useRef(null);
  const triggerHoldRef = useRef(null);
  const triggerPrintRef = useRef(null);
  const triggerPaymentRef = useRef(null);

  return (
    <>
      {location.pathname !== '/login' && <Header />}
      <ToastContainer />
      <Routes>
        <Route path='/login' element={<UserLogin />} />
        {/* Pass all refs to BillingSystem */}
        <Route
          path="/"
          element={
            <BillingSystem
              onFocusProductSearch={focusProductSearchRef}
              onFocusProductCode={focusProductCodeRef}
              onFocusQuantity={focusQuantityRef}
              onTriggerAddProduct={triggerAddProductRef}
              onFocusCustomerName={focusCustomerNameRef}
              onFocusPhoneNumber={focusPhoneNumberRef}
              onTriggerHold={triggerHoldRef}
              onTriggerPrint={triggerPrintRef}
              onTriggerPayment={triggerPaymentRef}
            />
          }
        />
        <Route path='/sales' element={<Sales />} />
        <Route path='/transactions' element={<Transaction />} />
        <Route path='/Reports' element={<Reports />} />
      </Routes>
      {/* Pass all refs to Navbar */}
      {/* {location.pathname !== '/login' && (
        <Navbar
          onFocusProductSearch={focusProductSearchRef}
          onFocusProductCode={focusProductCodeRef}
          onFocusQuantity={focusQuantityRef}
          onTriggerAddProduct={triggerAddProductRef}
          onFocusCustomerName={focusCustomerNameRef}
          onFocusPhoneNumber={focusPhoneNumberRef}
          onTriggerHold={triggerHoldRef}
          onTriggerPrint={triggerPrintRef}
          onTriggerPayment={triggerPaymentRef}
        />
      )} */}
    </>
  );
};

export default App;

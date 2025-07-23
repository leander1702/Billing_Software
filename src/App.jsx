import React, { useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
import BillingSystem from './Component/BillingSystem';
import Navbar from './Component/Navbar';
import Sales from './Component/Sales';
import Transaction from './Component/Transaction';
import Reports from './Component/Reports';
import UserLogin from './Component/UserLogin';
import { ToastContainer } from 'react-toastify';
import Header from './Component/Header';
import AuthWrapper from './Component/AuthWrapper';

const App = () => {
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
      {/* <ToastContainer /> */}
      <Routes>
        <Route path='/login' element={<UserLogin />} />
        
        <Route path="/" element={
          <AuthWrapper>
            <>
              <Header />
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
            </>
          </AuthWrapper>
        } />
        
        <Route path='/sales' element={
          <AuthWrapper>
            <>
              <Header />
              <Sales />
            </>
          </AuthWrapper>
        } />
        
        <Route path='/transactions' element={
          <AuthWrapper>
            <>
              <Header />
              <Transaction />
            </>
          </AuthWrapper>
        } />
        
        <Route path='/Reports' element={
          <AuthWrapper>
            <>
              <Header />
              <Reports />
            </>
          </AuthWrapper>
        } />


        {/* <Navbar
                onFocusProductSearch={focusProductSearchRef}
                onFocusProductCode={focusProductCodeRef}
                onFocusQuantity={focusQuantityRef}
                onTriggerAddProduct={triggerAddProductRef}
                onFocusCustomerName={focusCustomerNameRef}
                onFocusPhoneNumber={focusPhoneNumberRef}
                onTriggerHold={triggerHoldRef}
                onTriggerPrint={triggerPrintRef}
                onTriggerPayment={triggerPaymentRef}
              /> */}
      </Routes>
    </>
  );
};

export default App;
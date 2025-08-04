import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../src/assets/ATS LOGO BLUE.svg';
import bill from '../../src/assets/IMG1.svg';
import Api from '../services/api';

const UserLogin = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Check for existing login on component mount
  useEffect(() => {
    const userData = localStorage.getItem('loggedInUser');
    if (userData) {
      const parsedData = JSON.parse(userData);
      // Check if login is still valid (optional: you could add expiration check here)
      navigate("/");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!phoneNumber || !password) {
      setError('Please enter both phone number and password.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await Api.get("/credentials/users");
      const usersData = res.data;

      const foundUser = usersData.find(
        (user) => user.contactNumber === phoneNumber && user.password === password
      );

      if (foundUser) {
        const userData = {
          cashierId: foundUser.cashierId,
          cashierName: foundUser.cashierName,
          counterNum: foundUser.counterNum,
          contactNumber: foundUser.contactNumber,
          role: foundUser.role,
          permissions: foundUser.permissions,
          rememberMe,
          loginTime: new Date().getTime()
        };

        localStorage.setItem('loggedInUser', JSON.stringify(userData));
        navigate("/");
      } else {
        setError("Invalid phone number or password");
      }
    } catch (err) {
      console.error(err);
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-50 p-4 sm:p-6 lg:p-6 overflow-hidden">
      <div className="flex w-full max-w-5xl rounded-2xl overflow-hidden shadow-xl bg-white min-h-[550px]">
        {/* Left side branding */}
        <div className="flex-1 flex items-center justify-center p-8 bg-white">
          <div className="w-full max-w-md">
            {/* Company header */}
            <div className="flex items-center justify-center lg:justify-start mb-8">
              <img src={logo} alt="Company Logo" className="h-8 w-8" />
              <div className="ml-3">
                <h2 className="text-sm font-bold text-gray-800">Billing Software</h2>
                <p className="text-xs text-gray-500">Counter Login Portal</p>
              </div>
            </div>

            {/* Heading */}
            <div className="mb-6 text-center lg:text-left">
              <h1 className="text-xl font-semibold text-gray-800 mb-1">Sign in to your counter</h1>
              <p className="text-sm text-gray-500">Bill customer purchases at your counter.</p>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200 flex items-start" role="alert">
                <svg className="h-5 w-5 text-red-500 mt-0.5 mr-3" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold text-red-800">Authentication failed:</h3>
                  <p className="text-xs text-red-600 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Login form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Phone Number */}
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  placeholder="Enter your phone number"
                  className="block w-full pl-3 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="block w-full pl-3 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Remember Me */}
              {/* <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 text-sm text-gray-700">Remember me</label>
              </div> */}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center items-center gap-x-2 py-3 px-4 text-white text-base font-medium bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 rounded-lg shadow-sm transition-all duration-200 ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <span className="text-white">
                      <i className="bi bi-box-arrow-in-right"></i>
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-blue-600 to-blue-700 p-12 relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute -top-16 -left-16 w-60 h-60 rounded-full bg-white opacity-5"></div>
            <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-white opacity-5"></div>
          </div>
          <div className="relative z-10 max-w-md text-white text-center">
            <div className="flex justify-center items-center h-full">
              <div className="relative flex flex-col items-center">
                <div
                  className="absolute -top-1 -left-0 transform -translate-y-1/2"
                  style={{
                    clipPath: 'polygon(50% 5%, 95% 25%, 95% 75%, 50% 95%, 5% 75%, 5% 25%)',
                    border: '2px solid #fff',
                    backgroundColor: '#fff',
                    width: '60px',
                    height: '65px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  }}
                >
                  <img src={logo} alt="ATS Logo" className="h-8 w-8" />
                </div>
                <img src={bill} alt="Billing Illustration" className="w-[85%] max-w-sm " />
              </div>
            </div>
            <h1 className="text-4xl text-start font-semibold leading-tight pl-8">Welcome</h1>
            <p className="text-2xl text-start font-light mb-8 pl-8">to your billing companion</p>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20 shadow-inner">
              <p className="text-lg font-semibold mb-2">We handle the numbers,</p>
              <p className="text-sm opacity-80">so you can focus on what truly matters - your customers.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserLogin;
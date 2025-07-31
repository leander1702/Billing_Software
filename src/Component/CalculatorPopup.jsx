import { useState, useEffect } from 'react';
import { FaEquals, FaBackspace } from 'react-icons/fa';

const CalculatorPopup = ({ onClose, onCalculate }) => {
    const [input, setInput] = useState('0');
    const [previousInput, setPreviousInput] = useState(null);
    const [operation, setOperation] = useState(null);
    const [darkMode, setDarkMode] = useState(false);
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [memory, setMemory] = useState(0);

    // Keyboard support
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key >= '0' && e.key <= '9') handleNumberClick(parseInt(e.key));
            else if (e.key === '.') handleDecimalClick();
            else if (e.key === '+') handleOperationClick('+');
            else if (e.key === '-') handleOperationClick('-');
            else if (e.key === '*') handleOperationClick('*');
            else if (e.key === '/') handleOperationClick('/');
            else if (e.key === 'Enter' || e.key === '=') calculateResult();
            else if (e.key === 'Escape') clearAll();
            else if (e.key === 'Backspace') handleBackspace();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [input, previousInput, operation]);


    const handleNumberClick = (number) => {
        if (input === '0' || (operation && previousInput === input)) {
            setInput(number.toString());
        } else {
            setInput(input + number.toString());
        }
    };

    const handleOperationClick = (op) => {
        if (input === '0' && !previousInput) return;

        if (previousInput && operation) {
            calculateResult();
        }

        setPreviousInput(input);
        setOperation(op);
    };

    const calculateResult = () => {
        if (!previousInput || !operation) return;

        const prev = parseFloat(previousInput);
        const current = parseFloat(input);
        let result = 0;
        let operationSymbol = '';

        switch (operation) {
            case '+':
                result = prev + current;
                operationSymbol = '+';
                break;
            case '-':
                result = prev - current;
                operationSymbol = '-';
                break;
            case '*':
                result = prev * current;
                operationSymbol = '×';
                break;
            case '/':
                result = prev / current;
                operationSymbol = '÷';
                break;
            case '^':
                result = Math.pow(prev, current);
                operationSymbol = '^';
                break;
            case '√':
                result = Math.pow(prev, 1 / current);
                operationSymbol = '√';
                break;
            case '%':
                result = (prev * current) / 100;
                operationSymbol = '%';
                break;
            default:
                return;
        }

        const calculationString = `${previousInput} ${operationSymbol} ${input} = ${result}`;
        setHistory([...history.slice(-4), calculationString]);

        setInput(result.toString());
        setPreviousInput(null);
        setOperation(null);
    };

    const handleSpecialOperation = (op) => {
        const current = parseFloat(input);
        let result = 0;

        switch (op) {
            case 'sqrt':
                result = Math.sqrt(current);
                break;
            case 'square':
                result = Math.pow(current, 2);
                break;
            case 'inverse':
                result = 1 / current;
                break;
            case 'negate':
                result = current * -1;
                break;
            default:
                return;
        }

        setInput(result.toString());
    };

    const clearAll = () => {
        setInput('0');
        setPreviousInput(null);
        setOperation(null);
    };

    const handleDecimalClick = () => {
        if (!input.includes('.')) {
            setInput(input + '.');
        }
    };

    const handleBackspace = () => {
        if (input.length === 1) {
            setInput('0');
        } else {
            setInput(input.slice(0, -1));
        }
    };

    const handleMemoryOperation = (op) => {
        const current = parseFloat(input);

        switch (op) {
            case 'M+':
                setMemory(memory + current);
                break;
            case 'M-':
                setMemory(memory - current);
                break;
            case 'MR':
                setInput(memory.toString());
                break;
            case 'MC':
                setMemory(0);
                break;
            default:
                return;
        }
    };


    return (
        <div className={`fixed inset-0 flex items-center justify-center z-50 ${darkMode ? 'bg-gray-900' : 'bg-black bg-opacity-50'}`}>
            <div className={`rounded-2xl shadow-2xl w-80 overflow-hidden ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
                {/* Header */}
                <div className={`flex justify-between items-center p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="flex items-center space-x-2">
                    </div>
                    <h3 className="text-lg font-medium">Scientific Calculator</h3>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full text-sm "
                    >
                        ✕
                    </button>
                </div>

                {/* Display */}
                <div className={`p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    {showHistory && (
                        <div className={`mb-2 p-2 rounded text-sm h-20 overflow-y-auto ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                            {history.map((item, index) => (
                                <div key={index} className="mb-1 opacity-70">{item}</div>
                            ))}
                        </div>
                    )}
                    <div className={`p-3 rounded-lg text-right ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                        <div className="text-sm opacity-70 h-5">
                            {previousInput && `${previousInput} ${operation}`}
                        </div>
                        <div className="text-3xl font-mono truncate">{input}</div>
                    </div>
                </div>

                {/* Keypad */}
                <div className="grid grid-cols-5 gap-2 p-4">
                    {/* Memory Functions */}
                    <button onClick={() => handleMemoryOperation('MC')} className={`p-2 rounded-lg ${darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-100 hover:bg-gray-200'}`}>
                        MC
                    </button>
                    <button onClick={() => handleMemoryOperation('MR')} className={`p-2 rounded-lg ${darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-100 hover:bg-gray-200'}`}>
                        MR
                    </button>
                    <button onClick={() => handleMemoryOperation('M+')} className={`p-2 rounded-lg ${darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-100 hover:bg-gray-200'}`}>
                        M+
                    </button>
                    <button onClick={() => handleMemoryOperation('M-')} className={`p-2 rounded-lg ${darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-100 hover:bg-gray-200'}`}>
                        M-
                    </button>
                    <button onClick={clearAll} className={`p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white`}>
                        AC
                    </button>

                    {/* Special Functions */}
                    <button onClick={() => handleSpecialOperation('sqrt')} className={`p-2 rounded-lg ${darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-100 hover:bg-gray-200'}`}>
                        √
                    </button>
                    <button onClick={() => handleSpecialOperation('square')} className={`p-2 rounded-lg ${darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-100 hover:bg-gray-200'}`}>
                        x²
                    </button>
                    <button onClick={() => handleSpecialOperation('inverse')} className={`p-2 rounded-lg ${darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-100 hover:bg-gray-200'}`}>
                        1/x
                    </button>
                    <button onClick={() => handleSpecialOperation('negate')} className={`p-2 rounded-lg ${darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-100 hover:bg-gray-200'}`}>
                        +/-
                    </button>
                    <button onClick={handleBackspace} className={`p-2 rounded-lg ${darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-100 hover:bg-gray-200'}`}>
                        <FaBackspace className="mx-auto" />
                    </button>

                    {[7, 8, 9].map(num => (
                        <button
                            key={num}
                            onClick={() => handleNumberClick(num)}
                            className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                        >
                            {num}
                        </button>
                    ))}
                    <button onClick={() => handleOperationClick('/')} className={`p-2 rounded-lg ${darkMode ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-500 hover:bg-blue-600'} text-white`}>
                        /
                    </button>
                    <button onClick={() => handleOperationClick('%')} className={`p-2 rounded-lg ${darkMode ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-500 hover:bg-blue-600'} text-white`}>
                        %
                    </button>

                    {[4, 5, 6].map(num => (
                        <button
                            key={num}
                            onClick={() => handleNumberClick(num)}
                            className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                        >
                            {num}
                        </button>
                    ))}
                    <button onClick={() => handleOperationClick('*')} className={`p-2 rounded-lg ${darkMode ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-500 hover:bg-blue-600'} text-white`}>
                        ×
                    </button>
                    <button onClick={() => handleOperationClick('^')} className={`p-2 rounded-lg ${darkMode ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-500 hover:bg-blue-600'} text-white`}>
                        ^
                    </button>

                    {[1, 2, 3].map(num => (
                        <button
                            key={num}
                            onClick={() => handleNumberClick(num)}
                            className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                        >
                            {num}
                        </button>
                    ))}
                    <button onClick={() => handleOperationClick('+')} className={`p-2 rounded-lg ${darkMode ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-500 hover:bg-blue-600'} text-white`}>
                        +
                    </button>
                    <button onClick={() => handleOperationClick('-')} className={`p-2 rounded-lg ${darkMode ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-500 hover:bg-blue-600'} text-white`}>
                        -
                    </button>

                    {/* Bottom row */}
                    <button
                        onClick={() => handleNumberClick(0)}
                        className={`col-span-2 p-3 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                    >
                        0
                    </button>
                    <button onClick={handleDecimalClick} className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>
                        .
                    </button>
                    <button onClick={onClose} className={`rounded-lg text-sm bg-gray-500 hover:bg-gray-600 text-white`}>
                        Cancel
                    </button>
                    <button onClick={calculateResult} className={`p-2 rounded-lg bg-green-500 hover:bg-green-600 text-white`}>
                        <FaEquals className="mx-auto h-5 w-5" />
                    </button>                   
                </div>
            </div>
        </div>
    );
};

export default CalculatorPopup;
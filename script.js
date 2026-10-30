// Calculator State
let currentOperand = '0';
let previousOperand = null;
let currentOperator = null;
let expressionHistory = '';
let resetInputOnNextDigit = false;
let toastTimeout = null;
let calculationHistory = [];
let currentBase = 10; // 10 (DEC) or 2 (BIN)

try {
  const saved = localStorage.getItem('calc_history');
  if (saved) calculationHistory = JSON.parse(saved);
} catch (e) {
  calculationHistory = [];
}

// DOM Elements
const currentDisplay = document.getElementById('current');
const historyDisplay = document.getElementById('history');
const toastElement = document.getElementById('toast');
const keypad = document.querySelector('.keypad');
const calcCard = document.querySelector('.calculator-card');
const baseIndicator = document.getElementById('base-indicator');
const secondaryDisplay = document.getElementById('secondary-display');
const modeTabs = document.querySelectorAll('.mode-tab');
const historyPanel = document.getElementById('history-panel');
const historyToggleBtn = document.getElementById('history-toggle');
const historyCountBadge = document.getElementById('history-count');
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history-btn');
const closeHistoryBtn = document.getElementById('close-history-btn');

/**
 * Format decimal number for clean display (handles floating point artifacts)
 */
function formatNumber(num) {
  if (isNaN(num)) return 'Error';
  if (!isFinite(num)) return 'Cannot divide by 0';

  const precision = 10;
  const factor = Math.pow(10, precision);
  const rounded = Math.round((num + Number.EPSILON) * factor) / factor;

  const str = rounded.toString();
  if (str.length > 12) {
    return rounded.toExponential(6);
  }
  return str;
}

/**
 * Parse a Base 2 (binary) string into a JavaScript number
 */
function parseBase2(str) {
  if (!str || str === 'Cannot divide by 0' || str === 'Error') return NaN;
  const isNeg = str.startsWith('-');
  let clean = isNeg ? str.slice(1) : str;
  if (clean.endsWith('.')) clean = clean.slice(0, -1);
  if (!clean) return 0;

  const parts = clean.split('.');
  let intVal = parseInt(parts[0] || '0', 2);
  if (isNaN(intVal)) return NaN;

  if (parts.length > 1 && parts[1]) {
    let fracVal = 0;
    const fracStr = parts[1];
    for (let i = 0; i < fracStr.length; i++) {
      if (fracStr[i] === '1') {
        fracVal += Math.pow(2, -(i + 1));
      }
    }
    intVal += fracVal;
  }

  return isNeg ? -intVal : intVal;
}

/**
 * Format a JavaScript number into a Base 2 (binary) string
 */
function numberToBase2(num) {
  if (isNaN(num)) return 'Error';
  if (!isFinite(num)) return 'Cannot divide by 0';

  const isNeg = num < 0;
  const abs = Math.abs(num);
  let intPart = Math.floor(abs);
  let fracPart = abs - intPart;

  let binInt = intPart.toString(2);
  fracPart = Math.round(fracPart * 1e10) / 1e10;

  if (fracPart === 0) {
    return (isNeg ? '-' : '') + binInt;
  }

  let binFrac = '';
  let limit = 8; // Max 8 binary fractional digits
  while (fracPart > 0 && limit-- > 0) {
    fracPart *= 2;
    if (fracPart >= 1) {
      binFrac += '1';
      fracPart -= 1;
    } else {
      binFrac += '0';
    }
    fracPart = Math.round(fracPart * 1e10) / 1e10;
  }

  binFrac = binFrac.replace(/0+$/, '');
  return (isNeg ? '-' : '') + binInt + (binFrac ? '.' + binFrac : '');
}

/**
 * Parse string according to specific base
 */
function parseNumberInBase(str, base = currentBase) {
  if (base === 2) {
    return parseBase2(str);
  }
  return parseFloat(str);
}

/**
 * Format number according to specific base
 */
function formatNumberInBase(num, base = currentBase) {
  if (isNaN(num)) return 'Error';
  if (!isFinite(num)) return 'Cannot divide by 0';

  if (base === 2) {
    return numberToBase2(num);
  }
  return formatNumber(num);
}

/**
 * Generate preview of value in the other base
 */
function getSecondaryConversion(operand, base = currentBase) {
  if (operand === 'Cannot divide by 0' || operand === 'Error') return '';

  if (base === 10) {
    const num = parseFloat(operand);
    if (isNaN(num)) return '';
    return `BIN: ${numberToBase2(num)}`;
  } else {
    const num = parseBase2(operand);
    if (isNaN(num)) return '';
    return `DEC: ${formatNumber(num)}`;
  }
}

/**
 * Switch calculator base between Base 10 (DEC) and Base 2 (BIN)
 */
function setBase(newBase, convertCurrent = true) {
  if (newBase === currentBase) return;

  if (convertCurrent && currentOperand !== 'Cannot divide by 0' && currentOperand !== 'Error') {
    if (newBase === 2) {
      // Switching DEC -> BIN
      const val = parseFloat(currentOperand);
      if (!isNaN(val)) currentOperand = numberToBase2(val);

      if (previousOperand !== null) {
        const prevVal = parseFloat(previousOperand);
        if (!isNaN(prevVal)) {
          previousOperand = numberToBase2(prevVal);
          const symbol = currentOperator === '/' ? '÷' : (currentOperator === '-' ? '−' : '+');
          expressionHistory = `${previousOperand} ${symbol}`;
        }
      }
    } else {
      // Switching BIN -> DEC
      const val = parseBase2(currentOperand);
      if (!isNaN(val)) currentOperand = formatNumber(val);

      if (previousOperand !== null) {
        const prevVal = parseBase2(previousOperand);
        if (!isNaN(prevVal)) {
          previousOperand = formatNumber(prevVal);
          const symbol = currentOperator === '/' ? '÷' : (currentOperator === '-' ? '−' : '+');
          expressionHistory = `${previousOperand} ${symbol}`;
        }
      }
    }
  }

  currentBase = newBase;

  // Update tabs
  modeTabs.forEach((tab) => {
    const isTarget = parseInt(tab.dataset.base, 10) === currentBase;
    tab.classList.toggle('active', isTarget);
    tab.setAttribute('aria-checked', isTarget ? 'true' : 'false');
  });

  // Toggle mode class on calculator card
  if (calcCard) {
    calcCard.classList.toggle('mode-base2', currentBase === 2);
  }

  updateDisplay();
  showToast(currentBase === 2 ? 'Switched to Base 2 (Binary)' : 'Switched to Base 10 (Decimal)');
}

/**
 * Update UI display
 */
function updateDisplay() {
  currentDisplay.textContent = currentOperand;

  // Dynamic font sizing for long numbers
  const len = currentOperand.length;
  if (len > 15) {
    currentDisplay.style.fontSize = '1.35rem';
  } else if (len > 11) {
    currentDisplay.style.fontSize = '1.65rem';
  } else if (len > 8) {
    currentDisplay.style.fontSize = '1.95rem';
  } else {
    currentDisplay.style.fontSize = '2.35rem';
  }

  // Update history display
  if (expressionHistory) {
    historyDisplay.textContent = expressionHistory;
  } else {
    historyDisplay.innerHTML = '&nbsp;';
  }

  // Update base indicator badge
  if (baseIndicator) {
    baseIndicator.textContent = currentBase === 2 ? 'BIN' : 'DEC';
  }

  // Update secondary base conversion preview
  if (secondaryDisplay) {
    secondaryDisplay.textContent = getSecondaryConversion(currentOperand, currentBase);
  }

  // Highlight active operator button
  document.querySelectorAll('.btn-operator').forEach((btn) => {
    if (currentOperator && btn.dataset.operator === currentOperator) {
      btn.classList.add('active-op');
    } else {
      btn.classList.remove('active-op');
    }
  });
}

/**
 * Show toast message
 */
function showToast(message) {
  if (toastTimeout) clearTimeout(toastTimeout);
  toastElement.textContent = message;
  toastElement.classList.add('show');
  toastTimeout = setTimeout(() => {
    toastElement.classList.remove('show');
  }, 2200);
}

/**
 * Handle number / decimal input
 */
function appendNumber(digit) {
  // If in Base 2, only '0', '1', and '.' are allowed
  if (currentBase === 2 && digit !== '0' && digit !== '1' && digit !== '.') {
    showToast('Only 0 and 1 are valid in Base 2');
    return;
  }

  if (currentOperand === 'Cannot divide by 0' || currentOperand === 'Error') {
    clearAll();
  }

  if (resetInputOnNextDigit) {
    if (previousOperand === null) {
      expressionHistory = '';
    }
    currentOperand = digit === '.' ? '0.' : digit;
    resetInputOnNextDigit = false;
    updateDisplay();
    return;
  }

  if (digit === '.') {
    if (currentOperand.includes('.')) return;
    currentOperand += '.';
  } else {
    if (currentOperand === '0') {
      currentOperand = digit;
    } else {
      const maxLen = currentBase === 2 ? 20 : 14;
      if (currentOperand.replace(/[^0-9]/g, '').length >= maxLen) return;
      currentOperand += digit;
    }
  }

  updateDisplay();
}

/**
 * Perform single calculation
 */
function compute(a, b, op, base = currentBase) {
  const numA = parseNumberInBase(a, base);
  const numB = parseNumberInBase(b, base);

  if (isNaN(numA) || isNaN(numB)) return 'Error';

  switch (op) {
    case '+':
      return formatNumberInBase(numA + numB, base);
    case '-':
      return formatNumberInBase(numA - numB, base);
    case '/':
      if (numB === 0) return 'Cannot divide by 0';
      return formatNumberInBase(numA / numB, base);
    default:
      return b;
  }
}

/**
 * Select Operator (+, -, /)
 */
function chooseOperator(op) {
  if (currentOperand === 'Cannot divide by 0' || currentOperand === 'Error') {
    return;
  }

  const symbol = op === '/' ? '÷' : (op === '-' ? '−' : '+');

  if (previousOperand !== null && !resetInputOnNextDigit) {
    // Chain intermediate operation
    const result = compute(previousOperand, currentOperand, currentOperator, currentBase);
    if (result === 'Cannot divide by 0' || result === 'Error') {
      currentOperand = result;
      previousOperand = null;
      currentOperator = null;
      expressionHistory = '';
      resetInputOnNextDigit = true;
      updateDisplay();
      return;
    }
    previousOperand = result;
    currentOperand = result;
  } else {
    previousOperand = currentOperand;
  }

  currentOperator = op;
  expressionHistory = `${previousOperand} ${symbol}`;
  resetInputOnNextDigit = true;
  updateDisplay();
}

/**
 * Evaluate equals (=)
 */
function evaluate() {
  if (!currentOperator || previousOperand === null) return;

  const result = compute(previousOperand, currentOperand, currentOperator, currentBase);
  const opSymbol = currentOperator === '/' ? '÷' : (currentOperator === '-' ? '−' : '+');
  const fullExpr = `${previousOperand} ${opSymbol} ${currentOperand}`;

  expressionHistory = `${fullExpr} =`;
  currentOperand = result.toString();
  previousOperand = null;
  currentOperator = null;
  resetInputOnNextDigit = true;

  if (result !== 'Cannot divide by 0' && result !== 'Error') {
    addHistoryRecord(fullExpr, currentOperand, currentBase);
  }

  updateDisplay();
}

/**
 * Clear All (AC)
 */
function clearAll() {
  currentOperand = '0';
  previousOperand = null;
  currentOperator = null;
  expressionHistory = '';
  resetInputOnNextDigit = false;
  updateDisplay();
}

/**
 * Delete / Backspace (⌫)
 */
function backspace() {
  if (resetInputOnNextDigit || currentOperand === 'Cannot divide by 0' || currentOperand === 'Error') {
    clearAll();
    return;
  }

  if (currentOperand.length <= 1 || (currentOperand.length === 2 && currentOperand.startsWith('-'))) {
    currentOperand = '0';
  } else {
    currentOperand = currentOperand.slice(0, -1);
  }
  updateDisplay();
}

/**
 * Toggle sign (±)
 */
function toggleSign() {
  if (currentOperand === '0' || currentOperand === 'Cannot divide by 0' || currentOperand === 'Error') {
    return;
  }
  if (currentOperand.startsWith('-')) {
    currentOperand = currentOperand.slice(1);
  } else {
    currentOperand = '-' + currentOperand;
  }
  updateDisplay();
}

// Mode Selector Click Handling
modeTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const base = parseInt(tab.dataset.base, 10);
    setBase(base);
  });
});

// Keypad Button Click Handling
keypad.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;

  const num = btn.dataset.number;
  const action = btn.dataset.action;
  const operator = btn.dataset.operator;

  if (num !== undefined) {
    appendNumber(num);
  } else if (operator) {
    chooseOperator(operator);
  } else if (action === 'equals') {
    evaluate();
  } else if (action === 'clear') {
    clearAll();
  } else if (action === 'delete') {
    backspace();
  } else if (action === 'negate') {
    toggleSign();
  }
});

/**
 * Helper to trigger button animation on keyboard press
 */
function flashButton(selector) {
  const btn = document.querySelector(selector);
  if (btn) {
    btn.classList.add('pressed');
    setTimeout(() => btn.classList.remove('pressed'), 120);
  }
}

/**
 * Render history panel list
 */
function renderHistory() {
  if (historyCountBadge) {
    historyCountBadge.textContent = calculationHistory.length;
    historyCountBadge.style.display = calculationHistory.length > 0 ? 'inline-block' : 'none';
  }

  if (!historyList) return;

  if (calculationHistory.length === 0) {
    historyList.innerHTML = `
      <div class="history-empty">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <p>No calculations yet</p>
        <span>Completed calculations will appear here</span>
      </div>
    `;
    return;
  }

  historyList.innerHTML = calculationHistory
    .map((item, index) => {
      const baseLabel = item.base === 2 ? 'BIN' : 'DEC';
      const baseClass = item.base === 2 ? 'bin' : 'dec';
      return `
      <div class="history-item" data-index="${index}" role="button" tabindex="0" title="Click to recall ${item.result} (${baseLabel})">
        <div class="history-item-top">
          <span class="history-base-tag ${baseClass}">${baseLabel}</span>
          <div class="history-item-expr">${item.expression} =</div>
        </div>
        <div class="history-item-result">${item.result}</div>
      </div>
    `;
    })
    .join('');
}

/**
 * Add an item to calculation history
 */
function addHistoryRecord(expression, result, base = currentBase) {
  calculationHistory.unshift({ expression, result, base, timestamp: Date.now() });
  if (calculationHistory.length > 50) calculationHistory.pop();

  try {
    localStorage.setItem('calc_history', JSON.stringify(calculationHistory));
  } catch (e) {}

  renderHistory();
}

/**
 * Clear calculation history
 */
function clearHistory() {
  calculationHistory = [];
  try {
    localStorage.removeItem('calc_history');
  } catch (e) {}
  renderHistory();
  showToast('History cleared');
}

/**
 * Toggle history panel visibility
 */
function toggleHistoryPanel(show) {
  if (!historyPanel) return;
  const isOpen = historyPanel.classList.contains('open');
  const shouldOpen = show !== undefined ? show : !isOpen;

  if (shouldOpen) {
    historyPanel.classList.add('open');
    historyPanel.setAttribute('aria-hidden', 'false');
  } else {
    historyPanel.classList.remove('open');
    historyPanel.setAttribute('aria-hidden', 'true');
  }
}

/**
 * Recall result from history
 */
function recallHistoryItem(index) {
  const item = calculationHistory[index];
  if (!item) return;

  const itemBase = item.base || 10;
  if (currentBase !== itemBase) {
    setBase(itemBase, false);
  }

  currentOperand = item.result;
  previousOperand = null;
  currentOperator = null;
  expressionHistory = '';
  resetInputOnNextDigit = true;
  updateDisplay();
  toggleHistoryPanel(false);
  showToast(`Recalled ${item.result} (${itemBase === 2 ? 'BIN' : 'DEC'})`);
}

// History Event Listeners
if (historyToggleBtn) {
  historyToggleBtn.addEventListener('click', () => toggleHistoryPanel());
}
if (closeHistoryBtn) {
  closeHistoryBtn.addEventListener('click', () => toggleHistoryPanel(false));
}
if (clearHistoryBtn) {
  clearHistoryBtn.addEventListener('click', clearHistory);
}
if (historyList) {
  historyList.addEventListener('click', (e) => {
    const item = e.target.closest('.history-item');
    if (!item) return;
    const index = parseInt(item.dataset.index, 10);
    recallHistoryItem(index);
  });
  historyList.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const item = e.target.closest('.history-item');
      if (!item) return;
      e.preventDefault();
      const index = parseInt(item.dataset.index, 10);
      recallHistoryItem(index);
    }
  });
}

// Keyboard Support
window.addEventListener('keydown', (e) => {
  // Toggle Base Mode with 'b' or 'B'
  if ((e.key === 'b' || e.key === 'B') && !e.metaKey && !e.ctrlKey) {
    e.preventDefault();
    setBase(currentBase === 10 ? 2 : 10);
    return;
  }

  // Toggle History with 'h' or 'H'
  if ((e.key === 'h' || e.key === 'H') && !e.metaKey && !e.ctrlKey) {
    e.preventDefault();
    toggleHistoryPanel();
    return;
  }

  // Close history panel on Escape if open
  if (e.key === 'Escape' && historyPanel && historyPanel.classList.contains('open')) {
    e.preventDefault();
    toggleHistoryPanel(false);
    return;
  }

  // Intercept multiplication attempt (* or x or X)
  if (e.key === '*' || e.key === 'x' || e.key === 'X') {
    e.preventDefault();
    showToast('Multiplication is disabled');
    return;
  }

  // Check digits in Base 2 mode
  if (currentBase === 2 && /^[2-9]$/.test(e.key)) {
    e.preventDefault();
    showToast('Digits 2–9 are disabled in Base 2');
    return;
  }

  // Allowed numbers
  if (/^[0-9]$/.test(e.key)) {
    e.preventDefault();
    appendNumber(e.key);
    flashButton(`button[data-number="${e.key}"]`);
    return;
  }

  // Decimal point
  if (e.key === '.' || e.key === ',') {
    e.preventDefault();
    appendNumber('.');
    flashButton(`button[data-number="."]`);
    return;
  }

  // Allowed operators: + - /
  if (e.key === '+') {
    e.preventDefault();
    chooseOperator('+');
    flashButton(`button[data-operator="+"]`);
    return;
  }
  if (e.key === '-') {
    e.preventDefault();
    chooseOperator('-');
    flashButton(`button[data-operator="-"]`);
    return;
  }
  if (e.key === '/') {
    e.preventDefault();
    chooseOperator('/');
    flashButton(`button[data-operator="/"]`);
    return;
  }

  // Equals / Enter
  if (e.key === 'Enter' || e.key === '=') {
    e.preventDefault();
    evaluate();
    flashButton(`button[data-action="equals"]`);
    return;
  }

  // Backspace
  if (e.key === 'Backspace') {
    e.preventDefault();
    backspace();
    flashButton(`button[data-action="delete"]`);
    return;
  }

  // Clear (Escape or Delete or c / C)
  if (e.key === 'Escape' || e.key === 'Delete' || e.key.toLowerCase() === 'c') {
    e.preventDefault();
    clearAll();
    flashButton(`button[data-action="clear"]`);
    return;
  }
});

// Initial display and history setup
updateDisplay();
renderHistory();

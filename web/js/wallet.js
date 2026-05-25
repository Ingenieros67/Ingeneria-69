/* ========================================
   UniT-Coin Wallet - ECDSA Key Management & Transactions
   ======================================== */

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
  loadWalletFromStorage();
  setupEventListeners();
  if (document.getElementById('balanceDisplay')) {
    updateBalance();
    // Auto-update balance every 5 seconds
    setInterval(updateBalance, 5000);
  }
});

// ========== EVENT LISTENERS ==========
function setupEventListeners() {
  const generateBtn = document.getElementById('generateKeyBtn');
  const exportBtn = document.getElementById('exportKeyBtn');
  const importBtn = document.getElementById('importBtn');
  const sendBtn = document.getElementById('sendBtn');
  const clearBtn = document.getElementById('clearWalletBtn');

  if (generateBtn) generateBtn.addEventListener('click', generateNewKeys);
  if (exportBtn) exportBtn.addEventListener('click', exportKeys);
  if (importBtn) importBtn.addEventListener('click', () => document.getElementById('importFile').click());
  if (sendBtn) sendBtn.addEventListener('click', sendTransaction);
  if (clearBtn) clearBtn.addEventListener('click', clearWallet);

  // Import file handler
  const importFile = document.getElementById('importFile');
  if (importFile) {
    importFile.addEventListener('change', handleFileImport);
  }
}

// ========== KEY GENERATION ==========
function generateNewKeys() {
  try {
    // Use elliptic.js library for ECDSA
    const ec = new elliptic.ec('secp256k1');
    const keyPair = ec.genKeyPair();

    // Extract public and private keys
    const privateKey = keyPair.getPrivate('hex');
    const publicKey = keyPair.getPublic('hex');
    const address = generateAddress(publicKey);

    // Store in localStorage
    localStorage.setItem('unitcoin_privateKey', privateKey);
    localStorage.setItem('unitcoin_publicKey', publicKey);
    localStorage.setItem('unitcoin_address', address);

    // Update UI
    displayKeys(publicKey, address);
    showAlert('success', '✅ Nuevas llaves generadas exitosamente');
    updateBalance();
  } catch (error) {
    console.error('Error generating keys:', error);
    showAlert('error', '❌ Error al generar llaves: ' + error.message);
  }
}

// ========== ADDRESS GENERATION ==========
function generateAddress(publicKey) {
  // Simple address: hash of public key (first 40 chars)
  // In production, use proper hashing (SHA-256 + RIPEMD-160)
  const hash = CryptoJS.SHA256(publicKey).toString();
  return '0x' + hash.substring(0, 40);
}

// ========== DISPLAY KEYS ==========
function displayKeys(publicKey, address) {
  const publicKeyDisplay = document.getElementById('publicKeyDisplay');
  const addressDisplay = document.getElementById('addressDisplay');
  const keysSection = document.getElementById('keysSection');

  if (publicKeyDisplay) {
    publicKeyDisplay.textContent = publicKey;
    publicKeyDisplay.parentElement.parentElement.classList.remove('hidden');
  }

  if (addressDisplay) {
    addressDisplay.textContent = address;
    addressDisplay.parentElement.parentElement.classList.remove('hidden');
  }

  if (keysSection) {
    keysSection.classList.remove('hidden');
  }

  // Show action buttons
  const buttonGroup = document.getElementById('keyActionButtons');
  if (buttonGroup) buttonGroup.classList.remove('hidden');
}

// ========== LOAD WALLET FROM STORAGE ==========
function loadWalletFromStorage() {
  const publicKey = localStorage.getItem('unitcoin_publicKey');
  const address = localStorage.getItem('unitcoin_address');

  if (publicKey && address) {
    displayKeys(publicKey, address);
  }
}

// ========== EXPORT KEYS ==========
function exportKeys() {
  const privateKey = localStorage.getItem('unitcoin_privateKey');
  const publicKey = localStorage.getItem('unitcoin_publicKey');
  const address = localStorage.getItem('unitcoin_address');

  if (!privateKey) {
    showAlert('warning', '⚠️ No hay llaves para exportar');
    return;
  }

  // Warn user about security
  const confirmed = confirm(
    '⚠️ ADVERTENCIA DE SEGURIDAD:\n\n' +
    'Estás a punto de exportar tu clave privada.\n' +
    'Guárdala en un lugar seguro.\n' +
    '¡NUNCA compartas tu clave privada con nadie!\n\n' +
    '¿Estás seguro de continuar?'
  );

  if (!confirmed) return;

  const walletData = {
    privateKey,
    publicKey,
    address,
    exportedAt: new Date().toISOString(),
  };

  // Create JSON file and download
  const dataStr = JSON.stringify(walletData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `unitcoin-wallet-backup-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);

  showAlert('success', '✅ Cartera exportada correctamente');
}

// ========== IMPORT KEYS ==========
function handleFileImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const walletData = JSON.parse(e.target.result);
      const { privateKey, publicKey, address } = walletData;

      if (!privateKey || !publicKey || !address) {
        throw new Error('Archivo de cartera inválido: faltan campos requeridos');
      }

      // Verify keys are valid (basic check)
      if (!/^[a-f0-9]+$/.test(privateKey) || !/^[a-f0-9]+$/.test(publicKey)) {
        throw new Error('Formato de clave inválido');
      }

      // Store in localStorage
      localStorage.setItem('unitcoin_privateKey', privateKey);
      localStorage.setItem('unitcoin_publicKey', publicKey);
      localStorage.setItem('unitcoin_address', address);

      displayKeys(publicKey, address);
      showAlert('success', '✅ Cartera importada correctamente');
      updateBalance();
    } catch (error) {
      console.error('Error importing wallet:', error);
      showAlert('error', '❌ Error al importar cartera: ' + error.message);
    }
  };
  reader.readAsText(file);

  // Reset file input
  event.target.value = '';
}

// ========== FETCH BALANCE ==========
async function updateBalance() {
  const address = localStorage.getItem('unitcoin_address');
  const balanceDisplay = document.getElementById('balanceDisplay');

  if (!address || !balanceDisplay) return;

  try {
    const response = await fetch(`${API_BASE_URL}/balance/${address}`);
    const data = await response.json();

    if (response.ok) {
      balanceDisplay.textContent = parseFloat(data.balance).toFixed(2) + ' UniT-Coins';
      balanceDisplay.parentElement.classList.remove('hidden');
    } else {
      throw new Error(data.error || 'Error fetching balance');
    }
  } catch (error) {
    console.error('Error fetching balance:', error);
    balanceDisplay.textContent = 'Error al cargar saldo';
    balanceDisplay.classList.add('text-muted');
  }
}

// ========== SEND TRANSACTION ==========
async function sendTransaction() {
  const privateKey = localStorage.getItem('unitcoin_privateKey');
  const publicKey = localStorage.getItem('unitcoin_publicKey');
  const address = localStorage.getItem('unitcoin_address');

  if (!privateKey || !address) {
    showAlert('warning', '⚠️ Primero genera o importa una cartera');
    return;
  }

  const recipientAddress = document.getElementById('recipientAddress').value.trim();
  const amount = parseFloat(document.getElementById('amount').value);

  if (!recipientAddress) {
    showAlert('error', '❌ Por favor ingresa la dirección del destinatario');
    return;
  }

  if (isNaN(amount) || amount <= 0) {
    showAlert('error', '❌ Por favor ingresa un monto válido');
    return;
  }

  if (recipientAddress === address) {
    showAlert('error', '❌ No puedes enviar a tu propia dirección');
    return;
  }

  try {
    // Create transaction object
    const timestamp = Math.floor(Date.now() / 1000);
    const transactionData = {
      sender: address,
      receiver: recipientAddress,
      amount: amount,
      timestamp: timestamp,
      nonce: Math.floor(Math.random() * 1000000),
    };

    // Sign transaction with private key
    const signature = signTransaction(transactionData, privateKey);

    // Build final transaction
    const transaction = {
      sender: address,
      receiver: recipientAddress,
      amount: amount,
      timestamp: timestamp,
      nonce: transactionData.nonce,
      publicKey: publicKey,
      signature: signature,
    };

    // Show loading state
    const sendBtn = document.getElementById('sendBtn');
    sendBtn.disabled = true;
    sendBtn.textContent = 'Enviando...';

    // Send to node API
    const response = await fetch(`${API_BASE_URL}/tx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transaction),
    });

    const result = await response.json();

    if (response.ok) {
      showAlert('success', '✅ Transacción enviada exitosamente. ID: ' + result.txId);
      // Clear form
      document.getElementById('recipientAddress').value = '';
      document.getElementById('amount').value = '';
      // Update balance
      setTimeout(updateBalance, 2000);
    } else {
      throw new Error(result.error || 'Error sending transaction');
    }
  } catch (error) {
    console.error('Error sending transaction:', error);
    showAlert('error', '❌ Error al enviar transacción: ' + error.message);
  } finally {
    const sendBtn = document.getElementById('sendBtn');
    sendBtn.disabled = false;
    sendBtn.textContent = 'Enviar Transacción';
  }
}

// ========== SIGN TRANSACTION ==========
function signTransaction(transactionData, privateKey) {
  try {
    // Serialize transaction data
    const txString = JSON.stringify(transactionData);
    const txHash = CryptoJS.SHA256(txString).toString();

    // Sign using elliptic.js
    const ec = new elliptic.ec('secp256k1');
    const keyPair = ec.keyFromPrivate(privateKey, 'hex');
    const signature = keyPair.sign(txHash);

    // Convert signature to hex string
    const sig = signature.toDER('hex');
    return sig;
  } catch (error) {
    console.error('Error signing transaction:', error);
    throw new Error('Error al firmar transacción: ' + error.message);
  }
}

// ========== CLEAR WALLET ==========
function clearWallet() {
  const confirmed = confirm(
    '⚠️ ADVERTENCIA:\n\n' +
    '¿Estás seguro de eliminar tu cartera?\n' +
    'Esta acción no se puede deshacer.\n' +
    'Asegúrate de haber hecho backup primero.\n\n' +
    '¿Continuar?'
  );

  if (!confirmed) return;

  localStorage.removeItem('unitcoin_privateKey');
  localStorage.removeItem('unitcoin_publicKey');
  localStorage.removeItem('unitcoin_address');

  // Reset UI
  const publicKeySection = document.getElementById('publicKeyDisplay')?.parentElement?.parentElement;
  const addressSection = document.getElementById('addressDisplay')?.parentElement?.parentElement;
  const balanceSection = document.getElementById('balanceDisplay')?.parentElement;
  const keysSection = document.getElementById('keysSection');
  const buttonGroup = document.getElementById('keyActionButtons');

  if (publicKeySection) publicKeySection.classList.add('hidden');
  if (addressSection) addressSection.classList.add('hidden');
  if (balanceSection) balanceSection.classList.add('hidden');
  if (keysSection) keysSection.classList.add('hidden');
  if (buttonGroup) buttonGroup.classList.add('hidden');
  
  document.getElementById('recipientAddress').value = '';
  document.getElementById('amount').value = '';

  showAlert('success', '✅ Cartera eliminada');
}

// ========== UTILITY: SHOW ALERT ==========
function showAlert(type, message) {
  const alertContainer = document.getElementById('alertContainer');
  if (!alertContainer) return;

  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.textContent = message;

  alertContainer.appendChild(alert);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    alert.style.opacity = '0';
    alert.style.transition = 'opacity 0.3s ease';
    setTimeout(() => alert.remove(), 300);
  }, 5000);
}

// ========== COPY TO CLIPBOARD ==========
function copyToClipboard(elementId) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const text = element.textContent;
  navigator.clipboard.writeText(text).then(() => {
    showAlert('success', '✅ Copiado al portapapeles');
  });
}

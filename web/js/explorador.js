/* ========================================
   UniT-Coin Block Explorer
   ======================================== */

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// State
let allBlocks = [];
let allTransactions = [];

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadBlocks();
  // Auto-refresh blocks every 10 seconds
  setInterval(loadBlocks, 10000);
});

// ========== EVENT LISTENERS ==========
function setupEventListeners() {
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const refreshBtn = document.getElementById('refreshBtn');

  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') searchBlocks();
    });
  }

  if (searchBtn) searchBtn.addEventListener('click', searchBlocks);
  if (refreshBtn) refreshBtn.addEventListener('click', loadBlocks);
}

// ========== LOAD BLOCKS ==========
async function loadBlocks() {
  try {
    showLoadingState(true);
    const response = await fetch(`${API_BASE_URL}/blocks?limit=10`);
    const data = await response.json();

    if (response.ok) {
      allBlocks = data.blocks || [];
      allTransactions = data.transactions || [];
      renderBlocksTable(allBlocks);
      showAlert('success', '✅ Bloques cargados');
    } else {
      throw new Error(data.error || 'Error fetching blocks');
    }
  } catch (error) {
    console.error('Error loading blocks:', error);
    showAlert('error', '❌ Error al cargar bloques: ' + error.message);
    showEmptyState();
  } finally {
    showLoadingState(false);
  }
}

// ========== RENDER BLOCKS TABLE ==========
function renderBlocksTable(blocks) {
  const tbody = document.getElementById('blocksTableBody');
  if (!tbody) return;

  if (blocks.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted">No hay bloques disponibles</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = blocks.map((block) => `
    <tr onclick="showBlockDetail('${block.hash}')">
      <td>
        <strong>#${block.number}</strong>
      </td>
      <td class="hash-cell">
        <code>${truncateHash(block.hash)}</code>
        <button class="copy-btn" onclick="copyToClipboard('${block.hash}', event)">📋</button>
      </td>
      <td>${new Date(block.timestamp * 1000).toLocaleString()}</td>
      <td><span class="badge">${block.transactions.length} tx</span></td>
      <td><code>${truncateHash(block.miner)}</code></td>
      <td>
        <span class="difficulty-badge" title="Difficulty">⛏️ ${block.difficulty}</span>
      </td>
    </tr>
  `).join('');
}

// ========== SEARCH BLOCKS ==========
function searchBlocks() {
  const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();

  if (!searchTerm) {
    renderBlocksTable(allBlocks);
    return;
  }

  const filtered = allBlocks.filter((block) => {
    const hashMatch = block.hash.toLowerCase().includes(searchTerm);
    const minerMatch = block.miner.toLowerCase().includes(searchTerm);
    const numberMatch = block.number.toString().includes(searchTerm);
    return hashMatch || minerMatch || numberMatch;
  });

  if (filtered.length === 0) {
    showAlert('warning', '⚠️ No se encontraron bloques con esos criterios');
  }

  renderBlocksTable(filtered);
}

// ========== SHOW BLOCK DETAIL ==========
async function showBlockDetail(blockHash) {
  try {
    showLoadingState(true);
    const response = await fetch(`${API_BASE_URL}/block/${blockHash}`);
    const block = await response.json();

    if (response.ok) {
      renderBlockDetailModal(block);
    } else {
      throw new Error(block.error || 'Error fetching block detail');
    }
  } catch (error) {
    console.error('Error loading block detail:', error);
    showAlert('error', '❌ Error al cargar detalle del bloque: ' + error.message);
  } finally {
    showLoadingState(false);
  }
}

// ========== RENDER BLOCK DETAIL MODAL ==========
function renderBlockDetailModal(block) {
  const modal = document.getElementById('blockDetailModal');
  const modalContent = document.getElementById('blockDetailContent');

  if (!modal || !modalContent) return;

  const transactionsHTML = block.transactions.length > 0
    ? block.transactions.map((tx) => `
      <div class="transaction-item">
        <div class="flex-between">
          <strong>${tx.sender} → ${tx.receiver}</strong>
          <span class="amount-badge">${tx.amount} UniT-Coins</span>
        </div>
        <div class="text-muted" style="font-size: 0.9rem;">
          <code>${tx.signature}</code>
        </div>
      </div>
    `).join('')
    : '<p class="text-muted">No hay transacciones en este bloque</p>';

  modalContent.innerHTML = `
    <div class="card">
      <h2>Detalle del Bloque #${block.number}</h2>

      <div class="block-detail-grid">
        <div class="detail-item">
          <label>Hash:</label>
          <code class="detail-value">${block.hash}</code>
          <button class="copy-btn" onclick="copyToClipboard('${block.hash}', event)">📋</button>
        </div>

        <div class="detail-item">
          <label>Hash Anterior:</label>
          <code class="detail-value">${block.previousHash || 'N/A (Bloque Génesis)'}</code>
        </div>

        <div class="detail-item">
          <label>Timestamp:</label>
          <p>${new Date(block.timestamp * 1000).toLocaleString()}</p>
        </div>

        <div class="detail-item">
          <label>Minero:</label>
          <code class="detail-value">${block.miner}</code>
        </div>

        <div class="detail-item">
          <label>Dificultad:</label>
          <p>${block.difficulty}</p>
        </div>

        <div class="detail-item">
          <label>Nonce:</label>
          <p>${block.nonce}</p>
        </div>

        <div class="detail-item">
          <label>Merkle Root:</label>
          <code class="detail-value">${block.merkleRoot || 'N/A'}</code>
        </div>

        <div class="detail-item">
          <label>Transacciones:</label>
          <p>${block.transactions.length}</p>
        </div>
      </div>

      <hr style="margin: 1.5rem 0; border: none; border-top: 1px solid var(--border-color);">

      <h3>Transacciones en este bloque</h3>
      <div class="transactions-container">
        ${transactionsHTML}
      </div>

      <button class="btn btn-secondary btn-block mt-2" onclick="closeBlockDetailModal()">Cerrar</button>
    </div>
  `;

  modal.classList.remove('hidden');
}

// ========== CLOSE MODAL ==========
function closeBlockDetailModal() {
  const modal = document.getElementById('blockDetailModal');
  if (modal) modal.classList.add('hidden');
}

// ========== UTILITY: TRUNCATE HASH ==========
function truncateHash(hash, length = 16) {
  if (typeof hash !== 'string') return 'N/A';
  return hash.substring(0, length) + '...' + hash.substring(hash.length - 8);
}

// ========== UTILITY: SHOW LOADING STATE ==========
function showLoadingState(isLoading) {
  const tbody = document.getElementById('blocksTableBody');
  if (!tbody) return;

  if (isLoading) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center">
          <div class="loading">⏳ Cargando bloques...</div>
        </td>
      </tr>
    `;
  }
}

// ========== UTILITY: SHOW EMPTY STATE ==========
function showEmptyState() {
  const tbody = document.getElementById('blocksTableBody');
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="6" class="text-center text-muted">
        No se pudieron cargar los bloques. Verifica que el nodo esté ejecutándose.
      </td>
    </tr>
  `;
}

// ========== UTILITY: SHOW ALERT ==========
function showAlert(type, message) {
  const alertContainer = document.getElementById('alertContainer');
  if (!alertContainer) return;

  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.textContent = message;

  alertContainer.appendChild(alert);

  setTimeout(() => {
    alert.style.opacity = '0';
    alert.style.transition = 'opacity 0.3s ease';
    setTimeout(() => alert.remove(), 300);
  }, 5000);
}

// ========== UTILITY: COPY TO CLIPBOARD ==========
function copyToClipboard(text, event) {
  if (event) event.stopPropagation();
  navigator.clipboard.writeText(text).then(() => {
    showAlert('success', '✅ Copiado al portapapeles');
  });
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
  const modal = document.getElementById('blockDetailModal');
  if (modal && e.target === modal) {
    closeBlockDetailModal();
  }
});

// ===== PowerRanks Web Editor - Enhanced JavaScript =====

// State Management
const state = {
    payload: {},
    serverPermissions: [],
    ranks: [],
    players: [],
    currentSection: 'dashboard',
    ws: null,
    wsConnected: false
};

// Utility Functions
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);
const createElement = (html) => {
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    return template.content.firstChild;
};

// WebSocket Functions
const WebSocketManager = {
    connect(url) {
        if (state.ws) {
            state.ws.close();
        }
        
        try {
            state.ws = new WebSocket(url);
            
            state.ws.onopen = () => {
                state.wsConnected = true;
                this.updateStatus('connected', 'Connected to server');
                Toast.show('Connected to WebSocket server!');
            };
            
            state.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'data') {
                        // Handle real-time data updates
                        console.log('Received data update:', data);
                    }
                } catch (e) {
                    console.log('Received:', event.data);
                }
            };
            
            state.ws.onclose = () => {
                state.wsConnected = false;
                this.updateStatus('disconnected', 'Disconnected');
            };
            
            state.ws.onerror = (error) => {
                state.wsConnected = false;
                this.updateStatus('disconnected', 'Connection error');
                Toast.show('WebSocket connection failed', 'error');
            };
        } catch (e) {
            Toast.show('Failed to connect: ' + e.message, 'error');
        }
    },
    
    disconnect() {
        if (state.ws) {
            state.ws.close();
            state.ws = null;
        }
        state.wsConnected = false;
        this.updateStatus('disconnected', 'Disconnected');
    },
    
    send(data) {
        if (state.ws && state.wsConnected) {
            state.ws.send(JSON.stringify(data));
        }
    },
    
    updateStatus(status, text) {
        const statusEl = $('#wsStatus');
        const statusText = $('#wsStatusText');
        const statusDot = statusEl.querySelector('.status-dot');
        
        statusEl.style.display = 'flex';
        statusEl.className = 'ws-status ' + status;
        statusText.textContent = text;
        
        if (status === 'connected') {
            statusDot.style.background = 'var(--success)';
        } else {
            statusDot.style.background = 'var(--error)';
        }
    }
};

// Helper Functions
function hexColor(color) {
    if (!color) return '#6366f1';
    if (color.startsWith('#')) return color;
    return '#6366f1';
}

function formatPlaytime(seconds) {
    if (!seconds) return '0h 0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
}

function asPermissions(value) {
    if (!Array.isArray(value)) return [];
    return value.map(p => {
        if (!p || typeof p !== 'object') return null;
        const name = String(p.name || '').trim();
        if (!name) return null;
        return { name, value: p.value === true || p.value === 'true' };
    }).filter(Boolean);
}

function asArray(value) {
    if (!Array.isArray(value)) return [];
    return value.map(x => String(x)).filter(x => String(x).trim());
}

function normalizeBase(v) {
    return (v || '').toString().trim().replace(/\/+$/, '') + '/';
}

// Toast Notifications
const Toast = {
    container: null,
    
    init() {
        this.container = $('#toastContainer');
    },
    
    show(message, type = 'success') {
        const toast = createElement(`
            <div class="toast ${type}">
                <div class="toast-icon">
                    ${this.getIcon(type)}
                </div>
                <span class="toast-message">${message}</span>
            </div>
        `);
        
        this.container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'toastSlide 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },
    
    getIcon(type) {
        const icons = {
            success: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M16.667 5L7.5 14.167L3.333 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
            error: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M16.667 3.333L3.333 16.667M3.333 3.333L16.667 16.667" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
            warning: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 6.667V10M10 13.333V13.342M18.333 10C18.333 14.602 14.602 18.333 10 18.333C5.398 18.333 1.667 14.602 1.667 10C1.667 5.398 5.398 1.667 10 1.667C14.602 1.667 18.333 5.398 18.333 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        };
        return icons[type] || icons.success;
    }
};

// Modal System
const Modal = {
    overlay: null,
    content: null,
    title: null,
    body: null,
    footer: null,
    
    init() {
        this.overlay = $('#modalOverlay');
        this.content = $('#modalContent');
        this.title = $('#modalTitle');
        this.body = $('#modalBody');
        this.footer = $('#modalFooter');
        
        $('#modalClose').addEventListener('click', () => this.close());
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });
    },
    
    open(title, content, footer = '') {
        this.title.textContent = title;
        this.body.innerHTML = content;
        this.footer.innerHTML = footer;
        this.overlay.classList.add('active');
    },
    
    close() {
        this.overlay.classList.remove('active');
    }
};

// Navigation
function initNavigation() {
    $$('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const section = item.dataset.section;
            switchSection(section);
        });
    });
}

function switchSection(sectionName) {
    state.currentSection = sectionName;
    
    // Update nav items
    $$('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.section === sectionName);
    });
    
    // Update sections
    $$('.section').forEach(sec => {
        sec.classList.toggle('active', sec.id === `section-${sectionName}`);
    });
    
    // Update page title
    const titles = {
        dashboard: 'Dashboard',
        ranks: 'Ranks Management',
        players: 'Players Management',
        permissions: 'Permissions',
        settings: 'Settings'
    };
    $('#pageTitle').textContent = titles[sectionName] || sectionName;
    
    // Refresh data when switching sections
    if (sectionName === 'ranks') renderRanks();
    if (sectionName === 'players') renderPlayers();
    if (sectionName === 'permissions') renderPermissions();
    if (sectionName === 'dashboard') updateStats();
}

// Stats Management
function updateStats() {
    $('#statRanks').textContent = state.ranks.length;
    $('#statPlayers').textContent = state.players.length;
    $('#statPermissions').textContent = state.serverPermissions.length;
    
    const jsonSize = JSON.stringify(state.payload).length / 1024;
    $('#statSize').textContent = jsonSize.toFixed(1) + ' KB';
}

// Render Functions
function renderRanks(filter = '') {
    const container = $('#ranksContainer');
    container.innerHTML = '';
    
    const filteredRanks = state.ranks.filter(rank => 
        rank.name.toLowerCase().includes(filter.toLowerCase())
    );
    
    if (filteredRanks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No ranks found. Click "Add Rank" to create one.</p>
            </div>
        `;
        return;
    }
    
    filteredRanks.forEach((rank, index) => {
        const card = createRankCard(rank, index);
        container.appendChild(card);
    });
}

function createRankCard(rank, index) {
    const card = createElement(`
        <div class="rank-card" data-index="${index}">
            <div class="rank-card-header">
                <div class="rank-card-title">
                    <div class="rank-badge">${rank.name.charAt(0).toUpperCase()}</div>
                    <div>
                        <div class="rank-name">${rank.name}</div>
                        <div class="rank-weight">Weight: ${rank.weight}</div>
                    </div>
                </div>
                <button class="btn-icon btn-delete-rank" title="Delete rank">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M13.5 4.5L4.5 13.5M4.5 4.5L13.5 13.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                </button>
            </div>
            <div class="rank-card-body">
                <div class="rank-field-row">
                    <div class="rank-field">
                        <label>Name</label>
                        <input type="text" class="rank-name-input" value="${rank.name}" />
                    </div>
                    <div class="rank-field">
                        <label>Weight</label>
                        <input type="number" class="rank-weight-input" value="${rank.weight}" />
                    </div>
                </div>
                <div class="rank-field-row">
                    <div class="rank-field">
                        <label>Chat Prefix</label>
                        <input type="text" class="rank-prefix-input" value="${rank.chatPrefix}" />
                    </div>
                    <div class="rank-field">
                        <label>Chat Suffix</label>
                        <input type="text" class="rank-suffix-input" value="${rank.chatSuffix}" />
                    </div>
                </div>
                <div class="rank-field">
                    <label>Name Color</label>
                    <div class="color-picker-wrapper">
                        <input type="color" class="rank-name-color-picker" value="${hexColor(rank.chatNamecolor)}" />
                        <input type="text" class="rank-name-color-input" value="${rank.chatNamecolor}" />
                    </div>
                </div>
                <div class="rank-field">
                    <label>Default Rank</label>
                    <label class="toggle-switch">
                        <input type="checkbox" class="rank-default-input" ${rank.isDefault ? 'checked' : ''} />
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                <div class="rank-permissions">
                    <div class="rank-permissions-header">
                        <h4>Permissions (${rank.permissions.length})</h4>
                        <button class="btn btn-primary btn-add-perm" style="padding: 6px 12px; font-size: 12px;">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M7 3V11M3 7H11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                            </svg>
                            Add
                        </button>
                    </div>
                    <div class="perm-list-container"></div>
                </div>
            </div>
        </div>
    `);
    
    // Render permissions
    const permContainer = card.querySelector('.perm-list-container');
    rank.permissions.forEach((perm, permIndex) => {
        permContainer.appendChild(createPermItem(index, permIndex, perm));
    });
    
    // Event listeners
    setupRankCardEvents(card, index);
    
    return card;
}

function createPermItem(rankIndex, permIndex, perm) {
    const item = createElement(`
        <div class="perm-item" data-rank-index="${rankIndex}" data-perm-index="${permIndex}">
            <input type="text" class="perm-node-input" value="${perm.name}" list="permList" placeholder="Permission node" />
            <select class="perm-value-select">
                <option value="true" ${perm.value ? 'selected' : ''}>ALLOW</option>
                <option value="false" ${!perm.value ? 'selected' : ''}>DENY</option>
            </select>
            <button class="btn-icon btn-remove-perm">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
            </button>
        </div>
    `);
    
    const nodeInput = item.querySelector('.perm-node-input');
    const valueSelect = item.querySelector('.perm-value-select');
    const removeBtn = item.querySelector('.btn-remove-perm');
    
    nodeInput.addEventListener('input', (e) => {
        state.ranks[rankIndex].permissions[permIndex].name = e.target.value.trim();
        syncStateFromInputs();
    });
    
    valueSelect.addEventListener('change', (e) => {
        state.ranks[rankIndex].permissions[permIndex].value = e.target.value === 'true';
    });
    
    removeBtn.addEventListener('click', () => {
        state.ranks[rankIndex].permissions.splice(permIndex, 1);
        syncStateFromInputs();
        renderRanks($('#rankSearch').value);
    });
    
    return item;
}

function setupRankCardEvents(card, index) {
    const rank = state.ranks[index];
    
    card.querySelector('.btn-delete-rank').addEventListener('click', () => {
        if (confirm(`Delete rank "${rank.name}"?`)) {
            state.ranks.splice(index, 1);
            syncStateFromInputs();
            renderRanks();
            updateStats();
            Toast.show('Rank deleted successfully');
        }
    });
    
    card.querySelector('.btn-add-perm').addEventListener('click', () => {
        state.ranks[index].permissions.push({ name: '', value: true });
        syncStateFromInputs();
        renderRanks($('#rankSearch').value);
    });
    
    // Input event listeners
    const inputs = {
        '.rank-name-input': (v) => { rank.name = v; },
        '.rank-weight-input': (v) => { rank.weight = Number(v) || 0; },
        '.rank-prefix-input': (v) => { rank.chatPrefix = v; },
        '.rank-suffix-input': (v) => { rank.chatSuffix = v; },
        '.rank-name-color-input': (v) => { rank.chatNamecolor = v; },
        '.rank-default-input': (v) => { rank.isDefault = v; }
    };
    
    Object.entries(inputs).forEach(([selector, setter]) => {
        const input = card.querySelector(selector);
        if (input) {
            input.addEventListener('input', (e) => {
                setter(e.target.type === 'checkbox' ? e.target.checked : e.target.value);
                syncStateFromInputs();
            });
        }
    });
    
    // Color picker sync
    const nameColorPicker = card.querySelector('.rank-name-color-picker');
    const nameColorInput = card.querySelector('.rank-name-color-input');
    if (nameColorPicker && nameColorInput) {
        nameColorPicker.addEventListener('input', (e) => {
            nameColorInput.value = e.target.value;
            rank.chatNamecolor = e.target.value;
        });
        nameColorInput.addEventListener('input', (e) => {
            if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                nameColorPicker.value = e.target.value;
            }
            rank.chatNamecolor = e.target.value;
        });
    }
}

function renderPlayers(filter = '') {
    const container = $('#playersContainer');
    container.innerHTML = '';
    
    const filteredPlayers = state.players.filter(player =>
        player.name.toLowerCase().includes(filter.toLowerCase()) ||
        player.uuid.toLowerCase().includes(filter.toLowerCase()) ||
        (player.nickname && player.nickname.toLowerCase().includes(filter.toLowerCase()))
    );
    
    if (filteredPlayers.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No players found. Click "Add Player" to create one.</p>
            </div>
        `;
        return;
    }
    
    filteredPlayers.forEach((player, index) => {
        const card = createPlayerCard(player, index);
        container.appendChild(card);
    });
}

function createPlayerCard(player, index) {
    const card = createElement(`
        <div class="player-card" data-index="${index}">
            <div class="player-avatar">${player.name.charAt(0).toUpperCase()}</div>
            <div class="player-info">
                <div class="player-name">${player.name}</div>
                <div class="player-uuid">${player.uuid}</div>
                <div class="player-meta">
                    <div class="player-meta-item">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <circle cx="7" cy="3.5" r="2" stroke="currentColor" stroke-width="1.5"/>
                            <path d="M11.5 11.5C11.5 9.5 9.5 8.5 7 8.5C4.5 8.5 2.5 9.5 2.5 11.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                        ${player.nickname || 'No nickname'}
                    </div>
                    <div class="player-meta-item">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.5"/>
                            <path d="M7 3V7L9.5 9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                        </svg>
                        ${formatPlaytime(player.playtime)}
                    </div>
                </div>
            </div>
            <div class="player-actions">
                <button class="btn btn-secondary btn-edit-player">Edit</button>
                <button class="btn-icon btn-delete-player">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M13.5 4.5L4.5 13.5M4.5 4.5L13.5 13.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                </button>
            </div>
        </div>
    `);
    
    setupPlayerCardEvents(card, index);
    return card;
}

function setupPlayerCardEvents(card, index) {
    const player = state.players[index];
    
    card.querySelector('.btn-delete-player').addEventListener('click', () => {
        if (confirm(`Remove player "${player.name}"?`)) {
            state.players.splice(index, 1);
            syncStateFromInputs();
            renderPlayers();
            updateStats();
            Toast.show('Player removed successfully');
        }
    });
    
    card.querySelector('.btn-edit-player').addEventListener('click', () => {
        openPlayerEditor(index);
    });
}

function openPlayerEditor(index) {
    const player = state.players[index];
    
    Modal.open(
        'Edit Player',
        `
            <div style="display: flex; flex-direction: column; gap: 16px;">
                <div>
                    <label style="display: block; margin-bottom: 6px; font-size: 13px; color: var(--text-secondary);">UUID</label>
                    <input type="text" id="editPlayerUuid" value="${player.uuid}" readonly style="width: 100%; padding: 10px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-muted);" />
                </div>
                <div>
                    <label style="display: block; margin-bottom: 6px; font-size: 13px; color: var(--text-secondary);">Name</label>
                    <input type="text" id="editPlayerName" value="${player.name}" style="width: 100%; padding: 10px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary);" />
                </div>
                <div>
                    <label style="display: block; margin-bottom: 6px; font-size: 13px; color: var(--text-secondary);">Nickname</label>
                    <input type="text" id="editPlayerNick" value="${player.nickname || ''}" style="width: 100%; padding: 10px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary);" />
                </div>
                <div>
                    <label style="display: block; margin-bottom: 6px; font-size: 13px; color: var(--text-secondary);">Playtime (seconds)</label>
                    <input type="number" id="editPlayerPlaytime" value="${player.playtime || 0}" style="width: 100%; padding: 10px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary);" />
                </div>
                <div>
                    <label style="display: block; margin-bottom: 6px; font-size: 13px; color: var(--text-secondary);">Ranks (comma-separated)</label>
                    <input type="text" id="editPlayerRanks" value="${player.ranks.map(r => r.name).join(',')}" style="width: 100%; padding: 10px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary);" />
                </div>
                <div>
                    <label style="display: block; margin-bottom: 6px; font-size: 13px; color: var(--text-secondary);">User Tags (comma-separated)</label>
                    <input type="text" id="editPlayerTags" value="${player.usertags.join(',')}" style="width: 100%; padding: 10px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-primary);" />
                </div>
            </div>
        `,
        `
            <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
            <button class="btn btn-primary" id="savePlayerEdit">Save Changes</button>
        `
    );
    
    $('#savePlayerEdit').addEventListener('click', () => {
        player.name = $('#editPlayerName').value;
        player.nickname = $('#editPlayerNick').value;
        player.playtime = Number($('#editPlayerPlaytime').value) || 0;
        player.ranks = $('#editPlayerRanks').value.split(',').map(x => ({ name: x.trim() })).filter(r => r.name);
        player.usertags = $('#editPlayerTags').value.split(',').map(x => x.trim()).filter(Boolean);
        
        syncStateFromInputs();
        renderPlayers();
        Modal.close();
        Toast.show('Player updated successfully');
    });
}

function renderPermissions() {
    const permTags = $('#permTags');
    const serverPerms = $('#serverPerms');
    
    permTags.innerHTML = '';
    serverPerms.innerHTML = '';
    
    const allPerms = [...new Set([
        ...state.serverPermissions,
        ...state.ranks.flatMap(r => r.permissions.map(p => p.name))
    ])].sort();
    
    const q = $('#permSearch').value.toLowerCase();
    const filtered = allPerms.filter(p => p.toLowerCase().includes(q));
    
    filtered.forEach(perm => {
        const tag = createElement(`
            <span class="perm-tag" data-perm="${perm}">${perm}</span>
        `);
        tag.addEventListener('click', () => {
            navigator.clipboard.writeText(perm);
            Toast.show(`Copied: ${perm}`);
        });
        permTags.appendChild(tag);
    });
}

function syncStateFromInputs() {
    // Collect all permissions from ranks
    const allPerms = state.ranks.flatMap(r => r.permissions.map(p => p.name).filter(Boolean));
    state.serverPermissions = [...new Set([...state.serverPermissions, ...allPerms])];

    updateStats();
    renderPermissions();
}

// Data Loading & Export
async function loadFromFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            $('#jsonInput').value = text;
            applyJson(true);
            Toast.show('File loaded successfully!');
        } catch (error) {
            Toast.show('Failed to read file: ' + error.message, 'error');
        }
    });
    
    input.click();
}

async function loadFromClipboard() {
    try {
        const text = await navigator.clipboard.readText();
        $('#jsonInput').value = text;
        applyJson(true);
        Toast.show('Clipboard data loaded!');
    } catch (e) {
        Toast.show('Clipboard access failed. Paste manually.', 'error');
    }
}

function applyJson(showMessage = false) {
    try {
        const raw = $('#jsonInput').value.trim();
        const payload = JSON.parse(raw);
        
        if (!payload || typeof payload !== 'object') {
            throw new Error('Invalid JSON structure');
        }
        
        state.payload = payload;
        const server = (payload.serverdata && typeof payload.serverdata === 'object') ? payload.serverdata : {};
        state.serverPermissions = [...(server.serverPermissions || [])];
        state.ranks = parseRanks(payload.rankdata || {});
        state.players = parsePlayers(payload.playerdata || {});
        
        renderAll();
        
        if (showMessage) {
            Toast.show('JSON applied successfully!');
        }
    } catch (e) {
        Toast.show(`Invalid JSON: ${e.message}`, 'error');
    }
}

function parseRanks(rankMap) {
    const out = [];
    for (const [key, rank] of Object.entries(rankMap || {})) {
        if (!rank || typeof rank !== 'object') continue;
        out.push({
            name: String(rank.name || key || 'rank').trim(),
            isDefault: rank.isDefault === true || rank.isDefault === 'true',
            chatPrefix: String(rank.chatPrefix || ''),
            chatSuffix: String(rank.chatSuffix || ''),
            chatNamecolor: String(rank.chatNamecolor || ''),
            weight: Number(rank.weight || 0),
            permissions: asPermissions(rank.permissions)
        });
    }
    return out;
}

function parsePlayers(playerMap) {
    const out = [];
    for (const [uuid, player] of Object.entries(playerMap || {})) {
        if (!player || typeof player !== 'object') continue;
        out.push({
            uuid: String(uuid || player.uuid || '').trim(),
            name: String(player.name || ''),
            nickname: String(player.nickname || ''),
            playtime: Number(player.playtime || 0),
            permissions: Array.isArray(player.permissions) ? player.permissions : [],
            ranks: parsePlayerRanks(player.ranks),
            usertags: Array.isArray(player.usertags) ? player.usertags.map(String).filter(x => x.trim()) : []
        });
    }
    return out;
}

function parsePlayerRanks(value) {
    if (!value) return [];
    if (Array.isArray(value)) {
        return value.map(r => {
            if (!r) return null;
            if (typeof r === 'string') return { name: r.trim() };
            if (typeof r === 'object' && typeof r.name === 'string') return { name: r.name, tags: r.tags || {} };
            return null;
        }).filter(Boolean);
    }
    if (typeof value === 'string') {
        return value.split(',').map(x => x.trim()).filter(Boolean).map(name => ({ name }));
    }
    return [];
}

function exportPayload() {
    const rankdata = {};

    state.ranks.forEach(rank => {
        const key = (rank.name || 'rank').trim();
        if (!key) return;

        rankdata[key] = {
            isDefault: !!rank.isDefault,
            permissions: [...new Set(rank.permissions.map(p => ({
                name: (p.name || '').trim(),
                value: !!p.value
            })).filter(p => p.name))],
            chatPrefix: rank.chatPrefix || '',
            chatSuffix: rank.chatSuffix || '',
            chatNamecolor: rank.chatNamecolor || '',
            weight: Number(rank.weight || 0)
        };
    });
    
    const playerdata = {};
    state.players.forEach(player => {
        if (!player.uuid) return;
        playerdata[player.uuid] = {
            name: player.name || '',
            nickname: player.nickname || '',
            playtime: Number(player.playtime || 0),
            permissions: player.permissions || [],
            ranks: player.ranks || [],
            usertags: player.usertags || []
        };
    });
    
    const serverPermissions = [...new Set([
        ...state.serverPermissions,
        ...state.ranks.flatMap(r => r.permissions.map(p => p.name).filter(Boolean))
    ])];
    
    return JSON.stringify({
        serverdata: {
            powerranksVersion: (state.payload.serverdata && state.payload.serverdata.powerranksVersion) || '',
            serverPermissions
        },
        rankdata,
        playerdata,
        usertags: state.payload.usertags || {}
    }, null, 2);
}

function copyJson() {
    const payload = exportPayload();
    $('#jsonInput').value = payload;
    
    navigator.clipboard.writeText(payload)
        .then(() => Toast.show('JSON copied to clipboard!'))
        .catch(() => Toast.show('Copy failed. Select text manually.', 'error'));
}

function downloadJson() {
    const payload = exportPayload();
    $('#jsonInput').value = payload;
    
    const blob = new Blob([payload], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `powerranks-export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
    
    Toast.show('JSON downloaded!');
}

function saveToFile() {
    const payload = exportPayload();
    $('#jsonInput').value = payload;
    
    const blob = new Blob([payload], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `powerranks-edit-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
    
    Toast.show('File saved! Load it with /webeditor load <filename>');
}

function mergeExternalPerms() {
    const lines = ($('#extraPerms').value || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
    
    if (lines.length === 0) {
        Toast.show('No permission nodes found', 'error');
        return;
    }
    
    state.serverPermissions = [...new Set([...state.serverPermissions, ...lines])];
    renderPermissions();
    syncStateFromInputs();
    Toast.show(`Merged ${lines.length} permissions`);
}

function renderAll() {
    renderRanks();
    renderPlayers();
    renderPermissions();
    updateStats();
}

// Add new rank/player
function addRank() {
    state.ranks.push({
        name: `rank-${state.ranks.length + 1}`,
        isDefault: false,
        chatPrefix: '',
        chatSuffix: '',
        chatNamecolor: '',
        weight: 0,
        permissions: []
    });
    renderRanks();
    updateStats();
    switchSection('ranks');
    Toast.show('New rank created');
}

function addPlayer() {
    const uuid = `player-${Date.now()}`;
    state.players.push({
        uuid,
        name: 'NewPlayer',
        nickname: '',
        playtime: 0,
        permissions: [],
        ranks: [],
        usertags: []
    });
    renderPlayers();
    updateStats();
    switchSection('players');
    Toast.show('New player created');
}

// Initialize
function init() {
    Toast.init();
    Modal.init();
    initNavigation();

    // Button event listeners
    $('#btnConnectWS').addEventListener('click', () => {
        const wsUrl = $('#wsServer').value.trim();
        if (wsUrl) {
            WebSocketManager.connect(wsUrl);
        } else {
            Toast.show('Please enter WebSocket server URL', 'error');
        }
    });
    $('#btnLoadKey').addEventListener('click', loadFromFile);
    $('#btnLoadClipboard').addEventListener('click', loadFromClipboard);
    $('#btnApplyJSON').addEventListener('click', () => applyJson(true));
    $('#btnCopy').addEventListener('click', copyJson);
    $('#btnDownload').addEventListener('click', downloadJson);
    $('#btnUpload').addEventListener('click', saveToFile);
    $('#btnMergePerms').addEventListener('click', mergeExternalPerms);
    
    // Quick actions
    $('#btnQuickAddRank').addEventListener('click', addRank);
    $('#btnQuickAddPlayer').addEventListener('click', addPlayer);
    $('#btnLoadData').addEventListener('click', () => switchSection('dashboard'));
    $('#btnExportData').addEventListener('click', () => switchSection('settings'));
    
    // Add buttons
    $('#btnAddRank').addEventListener('click', addRank);
    $('#btnAddPlayer').addEventListener('click', addPlayer);
    
    // Search
    $('#rankSearch').addEventListener('input', (e) => renderRanks(e.target.value));
    $('#playerSearch').addEventListener('input', (e) => renderPlayers(e.target.value));
    $('#permSearch').addEventListener('input', renderPermissions);
    
    // Initialize datalist
    const permList = document.createElement('datalist');
    permList.id = 'permList';
    document.body.appendChild(permList);
    
    Toast.show('PowerRanks Web Editor loaded!');
}

document.addEventListener('DOMContentLoaded', init);

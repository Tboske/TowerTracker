function parseGameData(data) {
    const lines = data.trim().split('\n');
    const entry = {};
    lines.forEach(line => {
        // Split on first whitespace (space or tab)
        const match = line.match(/^(.+?)\s+(.+)$/);
        if (match) entry[match[1].trim()] = match[2].trim();
    });
    const now = new Date();
    entry.ID = parseInt(localStorage.getItem('towerTrackerLastNumber') || '0', 10) + 1;
    entry['Entry Date'] = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
    localStorage.setItem('towerTrackerLastNumber', entry.ID);

    // Parse game time (format: 6h 13m 24s)
    let totalHours = 0;
    if (entry['Game Time']) {
        let timeStr = entry['Game Time'];
        let hours = 0, minutes = 0, seconds = 0;
        let hMatch = timeStr.match(/(\d+)h/);
        let mMatch = timeStr.match(/(\d+)m/);
        let sMatch = timeStr.match(/(\d+)s/);
        if (hMatch) hours = parseInt(hMatch[1], 10);
        if (mMatch) minutes = parseInt(mMatch[1], 10);
        if (sMatch) seconds = parseInt(sMatch[1], 10);
        totalHours = hours + (minutes / 60) + (seconds / 3600);
    }

    // Calculate Coins Earned Rate (Coins/hour)
    if (entry['Coins Earned'] && totalHours > 0) {
        let coinsStr = entry['Coins Earned'];
        let coins = parseFloat(coinsStr.replace(/[^\d\.]/g, ''));
        if (coinsStr.includes('B')) coins *= 1e9;
        else if (coinsStr.includes('M')) coins *= 1e6;
        else if (coinsStr.includes('K')) coins *= 1e3;

        let coinsPerHour = coins / totalHours;
        if (coinsPerHour >= 1e9) entry['Coins Earned Rate'] = (coinsPerHour / 1e9).toFixed(2) + 'B/h';
        else if (coinsPerHour >= 1e6) entry['Coins Earned Rate'] = (coinsPerHour / 1e6).toFixed(2) + 'M/h';
        else if (coinsPerHour >= 1e3) entry['Coins Earned Rate'] = (coinsPerHour / 1e3).toFixed(2) + 'K/h';
        else entry['Coins Earned Rate'] = coinsPerHour.toFixed(2) + '/h';
    } else {
        entry['Coins Earned Rate'] = 'N/A';
    }

    // Calculate Cells Earned Rate (Cells/hour)
    if (entry['Cells Earned'] && totalHours > 0) {
        let cells = parseFloat(entry['Cells Earned'].toString().replace(/[^\d\.]/g, ''));
        let cellsPerHour = cells / totalHours;
        entry['Cells Earned Rate'] = cellsPerHour.toFixed(2) + '/h';
    } else {
        entry['Cells Earned Rate'] = 'N/A';
    }

    // Calculate Reroll Shards Earned Rate (Reroll Shards/hour)
    if (entry['Reroll Shards Earned'] && totalHours > 0) {
        let shardsStr = entry['Reroll Shards Earned'];
        let shards = parseFloat(shardsStr.replace(/[^\d\.]/g, ''));
        if (shardsStr.includes('K')) shards *= 1e3;
        let shardsPerHour = shards / totalHours;
        if (shardsPerHour >= 1e3) entry['Reroll Shards Earned Rate'] = (shardsPerHour / 1e3).toFixed(2) + 'K/h';
        else entry['Reroll Shards Earned Rate'] = shardsPerHour.toFixed(2) + '/h';
    } else {
        entry['Reroll Shards Earned Rate'] = 'N/A';
    }

    return entry;
}

function saveEntry(entry) {
    const entries = JSON.parse(localStorage.getItem('towerTrackerEntries') || '[]');
    if (!entry.ID) {
        entry.ID = parseInt(localStorage.getItem('towerTrackerLastNumber') || '0', 10) + 1;
        localStorage.setItem('towerTrackerLastNumber', entry.ID);
    }
    if (!entry['Entry Date']) {
        const now = new Date();
        entry['Entry Date'] = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
    }
    entries.push(entry);
    localStorage.setItem('towerTrackerEntries', JSON.stringify(entries));
}

function getAllKeys(entries) {
    const keysSet = entries.reduce((set, entry) => {
        Object.keys(entry).forEach(k => set.add(k));
        return set;
    }, new Set());
    const keys = Array.from(keysSet).filter(k => k !== 'ID' && k !== 'Entry Date' && k !== '_averages');
    return ['ID', 'Entry Date', ...keys, '_averages'];
}

// Define fields for each category
const CATEGORY_FIELDS = {
    "Battle Report": [
        "ID", "Entry Date", "Game Time", "Real Time", "Wave", "Coins Earned", "Coins Earned Rate",
        "Cash Earned", "Cash Earning Rate", "Interest Earned", "Gem Blocks Tapped",
        "Cells Earned", "Cells Earned Rate", "Reroll Shards Earned", "Reroll Shards Earned Rate"
    ],
    "Coins": [
        "ID", "Entry Date", "Coins Earned", "Coins Earned Rate", "Coins from Death Wave",
        "Coins from Golden Tower", "Coins from Blackhole", "Coins from Spotlight", "Coins from Orbs",
        "Coins from Coin Upgrade", "Coins from Coin Bonuses", "Golden bot coins earned",
        "Coins Stolen", "Coins Fetched"
    ],
    "Combat": [
        "Damage Dealt Rate", "Damage Taken", "Damage Taken Wall", "Damage Taken While Berserked",
        "Damage Gain From Berserk", "Death Defy", "Lifesteal", "Damage Dealt", "Projectiles Damage",
        "Projectiles Count", "Thorn Damage", "Orb Damage", "Land Mine Damage", "Land Mines Spawned",
        "Rend Armor Damage", "Death Ray Damage", "Smart Missile Damage"
    ],
    "Utility": [
        "Interest Earned", "Gem Blocks Tapped", "Cells Earned", "Cells Earned Rate",
        "Reroll Shards Earned", "Reroll Shards Earned Rate", "Rare Modules", "Inner Land Mine Damage",
        "Chain Lightning Damage", "Death Wave Damage", "Swamp Damage", "Black Hole Damage",
        "Orb Hits", "Waves Skipped", "Recovery Packages"
    ],
    "Enemies Destroyed": [
        "Destroyed by Orbs", "Destroyed by Thorns", "Destroyed by Death ray", "Destroyed by Land Mine",
        "Total Enemies", "Basic", "Fast", "Tank", "Ranged", "Boss", "Protector", "Total Elites",
        "Vampires", "Rays", "Scatters", "Saboteurs", "Commanders", "Overcharges"
    ],
    "Bots": [
        "Flame bot damage", "Thunder bot stuns", "Golden bot coins earned", "Coins Stolen"
    ],
    "Guardian": [
        "ID", "Entry Date", "Damage", "Bounty Coins", "Guardian catches", "Coins Fetched", "Gems",
        "Medals", "Reroll Shards", "Reroll Shards Earned Rate", "Cannon Shards", "Armor Shards",
        "Generator Shards", "Core Shards", "Common Modules", "Rare Modules"
    ]
};

function getCategoryKeys(category) {
    const categoryFields = CATEGORY_FIELDS[category];
    return ['ID', 'Entry Date', ...categoryFields.filter(k => k !== 'ID' && k !== 'Entry Date')];
}

// Table/column visibility
function getVisibleTables() {
    const stored = localStorage.getItem('towerTrackerVisibleTables');
    if (stored) return JSON.parse(stored);
    return Object.keys(CATEGORY_FIELDS).reduce((obj, cat) => { obj[cat] = true; return obj; }, {});
}
function setVisibleTables(obj) {
    localStorage.setItem('towerTrackerVisibleTables', JSON.stringify(obj));
}
function getVisibleColumns(table) {
    const stored = localStorage.getItem('towerTrackerVisibleColumns');
    if (stored) {
        const obj = JSON.parse(stored);
        return obj[table] || getCategoryKeys(table);
    }
    return getCategoryKeys(table);
}
function setVisibleColumns(table, columns) {
    let obj = {};
    const stored = localStorage.getItem('towerTrackerVisibleColumns');
    if (stored) obj = JSON.parse(stored);
    obj[table] = columns;
    localStorage.setItem('towerTrackerVisibleColumns', JSON.stringify(obj));
}

// Settings panel
function showSettings() {
    const tables = Object.keys(CATEGORY_FIELDS);
    const visibleTables = getVisibleTables();
    let settingsDiv = document.getElementById('settingsPanel');
    let overlay = document.getElementById('settingsOverlay');

    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'settingsOverlay';
        document.body.appendChild(overlay);
    }
    overlay.style.display = 'block';

    if (!settingsDiv) {
        settingsDiv = document.createElement('div');
        settingsDiv.id = 'settingsPanel';
        document.body.appendChild(settingsDiv);
    }

    let html = `
        <div class="settings-content">
            <strong>Show/Hide Tables & Columns</strong>
            ${tables.map(table => {
                const columns = getCategoryKeys(table);
                const visibleCols = getVisibleColumns(table);
                return `
                <div class="settings-table-group">
                    <label class="settings-table-title">
                        <input type="checkbox" class="table-toggle" data-table="${table}" ${visibleTables[table] ? 'checked' : ''}>
                        ${table}
                    </label>
                    <div class="settings-columns-list">
                        ${columns.map(col => `
                            <label>
                                <input type="checkbox" class="col-toggle" data-table="${table}" value="${col}" ${visibleCols.includes(col) ? 'checked' : ''}>
                                ${col}
                            </label>
                        `).join('')}
                    </div>
                </div>`;
            }).join('')}
        </div>
        <div class="settings-actions">
            <button id="settingsApplyBtn" style="background:#4f8cff;color:#fff;border:none;padding:0.5rem 1.2rem;border-radius:6px;cursor:pointer;">Apply</button>
            <button id="settingsCancelBtn" style="background:#31343e;color:#fff;border:none;padding:0.5rem 1.2rem;border-radius:6px;cursor:pointer;">Cancel</button>
        </div>
    `;
    settingsDiv.innerHTML = html;
    settingsDiv.style.display = 'flex';

    document.getElementById('settingsCancelBtn').onclick = () => {
        settingsDiv.style.display = 'none';
        overlay.style.display = 'none';
    };

    document.getElementById('settingsApplyBtn').onclick = () => {
        // Tables
        const tableToggles = settingsDiv.querySelectorAll('.table-toggle');
        let newVisibleTables = {};
        tableToggles.forEach(cb => {
            newVisibleTables[cb.dataset.table] = cb.checked;
        });
        setVisibleTables(newVisibleTables);

        // Columns
        let newVisibleColumns = {};
        tables.forEach(table => {
            const colToggles = settingsDiv.querySelectorAll(`.col-toggle[data-table="${table}"]`);
            newVisibleColumns[table] = Array.from(colToggles).filter(cb => cb.checked).map(cb => cb.value);
        });
        localStorage.setItem('towerTrackerVisibleColumns', JSON.stringify(newVisibleColumns));

        showAllCategoryTables();
        settingsDiv.style.display = 'none';
        overlay.style.display = 'none';
    };

    overlay.onclick = function () {
        settingsDiv.style.display = 'none';
        overlay.style.display = 'none';
    };
}

// Table rendering
function showCategoryTable(category, entries, sortKey = null, asc = true) {
    const visibleTables = getVisibleTables();
    if (!visibleTables[category]) return '';
    const keys = getVisibleColumns(category);
    if (keys.length === 0) return '';

    let sortedEntries = [...entries];
    if (sortKey && keys.includes(sortKey)) {
        sortedEntries.sort((a, b) => {
            let va = a[sortKey] || '';
            let vb = b[sortKey] || '';
            let na = parseFloat(va.replace(/[^\d\.\-]/g, ''));
            let nb = parseFloat(vb.replace(/[^\d\.\-]/g, ''));
            if (!isNaN(na) && !isNaN(nb)) return asc ? na - nb : nb - na;
            if (va < vb) return asc ? -1 : 1;
            if (va > vb) return asc ? 1 : -1;
            return 0;
        });
    }

    return `<section class="category-table">
        <h2>${category}</h2>
        <table>
            <thead>
                <tr>
                    <th class="delete-col"></th>
                    ${keys.map(k => `<th onclick="orderByCategoryColumn('${category}','${k}')" style="cursor:pointer;">${k}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                ${sortedEntries.map((entry, idx) => `<tr>
                    <td class="delete-col">
                        <button onclick="deleteEntry(${idx})" title="Delete" class="delete-btn">&#10060;</button>
                    </td>
                    ${keys.map(k => `<td>${entry[k] || ''}</td>`).join('')}
                </tr>`).join('')}
            </tbody>
        </table>
    </section>`;
}

function showAllCategoryTables() {
    const entries = JSON.parse(localStorage.getItem('towerTrackerEntries') || '[]');
    const container = document.getElementById('entriesTablesContainer');
    if (!container) {
        const div = document.createElement('div');
        div.id = 'entriesTablesContainer';
        document.querySelector('main').appendChild(div);
    }
    const target = document.getElementById('entriesTablesContainer');
    target.innerHTML = Object.keys(CATEGORY_FIELDS)
        .map(cat => showCategoryTable(cat, entries))
        .join('');
}

let currentSort = { key: null, asc: true };

window.orderByCategoryColumn = function(category, key) {
    // Save sort state per category if needed
    showAllCategoryTables(); // Re-render with new sort (implement state if you want persistent sorting)
};

function deleteEntry(index) {
    const entries = JSON.parse(localStorage.getItem('towerTrackerEntries') || '[]');
    entries.splice(index, 1);
    localStorage.setItem('towerTrackerEntries', JSON.stringify(entries));
    showAllCategoryTables();
}

document.getElementById('settingsBtn').onclick = showSettings;

window.addEventListener('DOMContentLoaded', () => {
    showAllCategoryTables();
});

document.getElementById('pasteClipboardBtn').addEventListener('click', async () => {
    try {
        const text = await navigator.clipboard.readText();
        if (text.trim().length > 0) {
            const entry = parseGameData(text);
            saveEntry(entry);
            showAllCategoryTables();
            alert('Parsed successfully!');
        } else {
            alert('Parse failed!');
        }
    } catch (err) {
        alert('Failed to read clipboard!');
    }
});

document.getElementById('manualParseBtn').onclick = function() {
    const text = document.getElementById('manualInput').value;
    if (text.trim().length > 0) {
        const entry = parseGameData(text);
        saveEntry(entry);
        showAllCategoryTables();
        alert('Parsed successfully!');
        document.getElementById('manualInput').value = '';
    } else {
        alert('Parse failed!');
    }
};

document.getElementById('helpBtn').onclick = function() {
    alert(
        "TowerTracker Help:\n\n" +
        "- Click 'Paste & Parse Clipboard' to import and save your game stats from the clipboard.\n" +
        "- Use the gear button to show/hide tables and columns.\n" +
        "- Click the red X to delete an entry.\n" +
        "- Click column headers to sort.\n" +
        "- Your data is saved locally in your browser."
    );
};

document.getElementById('pasteClipboardBtn').disabled = true;

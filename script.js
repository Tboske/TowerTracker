function parseGameData(data) {
    const lines = data.trim().split('\n');
    const entry = {};
    lines.forEach(line => {
        const match = line.match(/^\s*(.+?)\s{2,}(.+)$/);
        if (match) {
            entry[match[1]] = match[2];
        }
    });
    entry._timestamp = new Date().toLocaleString(); // Add timestamp for each entry
    return entry;
}

function saveEntry(entry) {
    const entries = JSON.parse(localStorage.getItem('towerTrackerEntries') || '[]');
    entries.push(entry);
    localStorage.setItem('towerTrackerEntries', JSON.stringify(entries));
}

function calculateAverages(entries) {
    // Track more fields: Wave, Coins Earned, Cash Earned, Damage Dealt, Cells Earned, Medals
    let waveSum = 0, coinsSum = 0, cashSum = 0, damageSum = 0, cellsSum = 0, medalsSum = 0, count = 0;
    entries.forEach(e => {
        if (e['Wave']) {
            waveSum += parseInt(e['Wave'], 10);
            count++;
        }
        if (e['Coins Earned']) {
            let coins = e['Coins Earned'].replace(/[^\d\.]/g, '');
            if (e['Coins Earned'].includes('B')) coins = parseFloat(coins) * 1e9;
            else coins = parseFloat(coins);
            coinsSum += coins;
        }
        if (e['Cash Earned']) {
            let cash = e['Cash Earned'].replace(/[^\d\.]/g, '');
            if (e['Cash Earned'].includes('M')) cash = parseFloat(cash) * 1e6;
            else cash = parseFloat(cash);
            cashSum += cash;
        }
        if (e['Damage Dealt']) {
            let dmg = e['Damage Dealt'].replace(/[^\d\.]/g, '');
            if (e['Damage Dealt'].includes('S')) dmg = parseFloat(dmg) * 1e18;
            else if (e['Damage Dealt'].includes('Q')) dmg = parseFloat(dmg) * 1e15;
            else if (e['Damage Dealt'].includes('T')) dmg = parseFloat(dmg) * 1e12;
            else if (e['Damage Dealt'].includes('B')) dmg = parseFloat(dmg) * 1e9;
            else dmg = parseFloat(dmg);
            damageSum += dmg;
        }
        if (e['Cells Earned']) {
            cellsSum += parseInt(e['Cells Earned'], 10);
        }
        if (e['Medals']) {
            medalsSum += parseInt(e['Medals'], 10);
        }
    });
    return {
        avgWave: count ? (waveSum / count).toFixed(2) : 'N/A',
        avgCoins: count ? (coinsSum / count).toFixed(2) : 'N/A',
        avgCash: count ? (cashSum / count).toFixed(2) : 'N/A',
        avgDamage: count ? (damageSum / count).toFixed(2) : 'N/A',
        avgCells: count ? (cellsSum / count).toFixed(2) : 'N/A',
        avgMedals: count ? (medalsSum / count).toFixed(2) : 'N/A'
    };
}

function getAllKeys(entries) {
    return Array.from(
        entries.reduce((set, entry) => {
            Object.keys(entry).forEach(k => set.add(k));
            return set;
        }, new Set())
    );
}

function showAverages() {
    const entries = JSON.parse(localStorage.getItem('towerTrackerEntries') || '[]');
    const avg = calculateAverages(entries);
    let avgDiv = document.getElementById('averages');
    if (!avgDiv) {
        avgDiv = document.createElement('div');
        avgDiv.id = 'averages';
        avgDiv.style.margin = '2rem auto';
        avgDiv.style.maxWidth = '400px';
        avgDiv.style.background = '#23262f';
        avgDiv.style.color = '#e4e6eb';
        avgDiv.style.padding = '1rem';
        avgDiv.style.borderRadius = '8px';
        document.querySelector('main').appendChild(avgDiv);
    }
    avgDiv.innerHTML = `<strong>Averages:</strong><br>
        Wave: ${avg.avgWave}<br>
        Coins Earned: ${avg.avgCoins}<br>
        Cash Earned: ${avg.avgCash}<br>
        Damage Dealt: ${avg.avgDamage}<br>
        Cells Earned: ${avg.avgCells}<br>
        Medals: ${avg.avgMedals}`;
}

let currentSort = { key: null, asc: true };

function showEntries(selectedKeys = null, sortKey = null, asc = true) {
    const entries = JSON.parse(localStorage.getItem('towerTrackerEntries') || '[]');
    let tableDiv = document.getElementById('entriesTable');
    if (!tableDiv) {
        tableDiv = document.createElement('div');
        tableDiv.id = 'entriesTable';
        tableDiv.style.margin = '2rem auto';
        tableDiv.style.maxWidth = '400px';
        tableDiv.style.overflowX = 'auto';
        document.querySelector('main').appendChild(tableDiv);
    }
    if (entries.length === 0) {
        tableDiv.innerHTML = "<strong>No entries yet.</strong>";
        return;
    }
    const allKeys = getAllKeys(entries);
    if (!selectedKeys) {
        const saved = JSON.parse(localStorage.getItem('towerTrackerSelectedColumns') || 'null');
        if (saved) selectedKeys = saved;
        else selectedKeys = allKeys;
    }

    // Sort entries if sortKey is provided
    let sortedEntries = [...entries];
    if (sortKey) {
        sortedEntries.sort((a, b) => {
            let va = a[sortKey] || '';
            let vb = b[sortKey] || '';
            // Try to compare as numbers if possible
            let na = parseFloat(va.replace(/[^\d\.\-]/g, ''));
            let nb = parseFloat(vb.replace(/[^\d\.\-]/g, ''));
            if (!isNaN(na) && !isNaN(nb)) {
                return asc ? na - nb : nb - na;
            }
            // Otherwise compare as strings
            if (va < vb) return asc ? -1 : 1;
            if (va > vb) return asc ? 1 : -1;
            return 0;
        });
    }

    let html = `<table style="width:100%;background:#23262f;color:#e4e6eb;border-radius:8px;border-collapse:collapse;">
        <thead>
            <tr>
                <th style="width:32px; padding:2px 0; border-bottom:1px solid #31343e;"></th>
                ${selectedKeys.map(k => {
                    let arrow = '';
                    if (currentSort.key === k) arrow = currentSort.asc ? ' ▲' : ' ▼';
                    return `<th style="padding:4px; border-bottom:1px solid #31343e; cursor:pointer;" onclick="orderByColumn('${k}')">${k}${arrow}</th>`;
                }).join('')}
            </tr>
        </thead>
        <tbody>
        ${sortedEntries.map((entry, idx) => `<tr>
            <td style="width:32px; padding:2px 0; border-bottom:1px solid #31343e; text-align:center;">
                <button onclick="deleteEntry(${idx})" title="Delete" style="background:none;border:none;cursor:pointer;font-size:0.9em;color:#d9534f;line-height:1;">
                    &#10060;
                </button>
            </td>
            ${selectedKeys.map(k => `<td style="padding:4px;border-bottom:1px solid #31343e;">${entry[k] || ''}</td>`).join('')}
        </tr>`).join('')}
        </tbody>
    </table>`;
    tableDiv.innerHTML = html;
}

// Add this function globally
window.orderByColumn = function(key) {
    // Toggle sort direction if same column, otherwise default to ascending
    if (currentSort.key === key) {
        currentSort.asc = !currentSort.asc;
    } else {
        currentSort.key = key;
        currentSort.asc = true;
    }
    // Use selected columns from localStorage or all
    const entries = JSON.parse(localStorage.getItem('towerTrackerEntries') || '[]');
    const allKeys = getAllKeys(entries);
    let selectedKeys = JSON.parse(localStorage.getItem('towerTrackerSelectedColumns') || 'null');
    if (!selectedKeys) selectedKeys = allKeys;
    showEntries(selectedKeys, currentSort.key, currentSort.asc);
};

function deleteEntry(index) {
    const entries = JSON.parse(localStorage.getItem('towerTrackerEntries') || '[]');
    entries.splice(index, 1);
    localStorage.setItem('towerTrackerEntries', JSON.stringify(entries));
    showAverages();
    const allKeys = getAllKeys(entries);
    showEntries(allKeys, currentSort.key, currentSort.asc);
}

function showColumnSelector() {
    const entries = JSON.parse(localStorage.getItem('towerTrackerEntries') || '[]');
    const allKeys = getAllKeys(entries);
    // Load selection from localStorage or default
    let selectedKeys = JSON.parse(localStorage.getItem('towerTrackerSelectedColumns') || 'null');
    if (!selectedKeys) {
        selectedKeys = allKeys.filter(k => k !== 'Real Time'); // Default Real Time to false
    }
    let selectorDiv = document.getElementById('columnSelector');
    if (!selectorDiv) {
        selectorDiv = document.createElement('div');
        selectorDiv.id = 'columnSelector';
        selectorDiv.style.position = 'fixed';
        selectorDiv.style.top = '50%';
        selectorDiv.style.left = '50%';
        selectorDiv.style.transform = 'translate(-50%, -50%)';
        selectorDiv.style.background = '#23262f';
        selectorDiv.style.color = '#e4e6eb';
        selectorDiv.style.padding = '1rem';
        selectorDiv.style.borderRadius = '12px';
        selectorDiv.style.boxShadow = '0 2px 12px rgba(0,0,0,0.25)';
        selectorDiv.style.zIndex = '1000';
        selectorDiv.style.maxWidth = '90vw';
        selectorDiv.style.maxHeight = '80vh';
        selectorDiv.style.overflowY = 'auto';
        selectorDiv.style.display = 'flex';
        selectorDiv.style.flexDirection = 'column';
        selectorDiv.style.alignItems = 'stretch';

        // Overlay for click outside
        let overlay = document.createElement('div');
        overlay.id = 'columnSelectorOverlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.zIndex = '999';
        overlay.style.background = 'rgba(0,0,0,0.2)';
        document.body.appendChild(overlay);

        overlay.onclick = () => {
            selectorDiv.remove();
            overlay.remove();
        };

        document.body.appendChild(selectorDiv);
    }

    selectorDiv.innerHTML = `
        <strong>Select columns to display:</strong>
        <form id="columnsForm" style="margin:1rem 0;flex:1;overflow-y:auto;">
            ${allKeys.map(k => `<label style="display:block;margin-bottom:4px;">
                <input type="checkbox" name="col" value="${k}" ${selectedKeys.includes(k) ? 'checked' : ''}> ${k}
            </label>`).join('')}
        </form>
        <div style="display:flex;justify-content:flex-end;gap:1rem;">
            <button type="submit" form="columnsForm" style="background:#4f8cff;color:#fff;border:none;padding:0.5rem 1rem;border-radius:6px;cursor:pointer;">Apply</button>
            <button type="button" id="closeSelectorBtn" style="background:#31343e;color:#fff;border:none;padding:0.5rem 1rem;border-radius:6px;cursor:pointer;">Cancel</button>
        </div>
    `;

    document.getElementById('closeSelectorBtn').onclick = () => {
        selectorDiv.remove();
        const overlay = document.getElementById('columnSelectorOverlay');
        if (overlay) overlay.remove();
    };

    document.getElementById('columnsForm').onsubmit = function(e) {
        e.preventDefault();
        const selected = Array.from(this.elements['col'])
            .filter(cb => cb.checked)
            .map(cb => cb.value);
        // Save selection to localStorage
        localStorage.setItem('towerTrackerSelectedColumns', JSON.stringify(selected));
        showEntries(selected);
        selectorDiv.remove();
        const overlay = document.getElementById('columnSelectorOverlay');
        if (overlay) overlay.remove();
    };
}

function addColumnSelectorButton() {
    let btn = document.getElementById('columnSelectorBtn');
    if (!btn) {
        btn = document.createElement('button');
        btn.id = 'columnSelectorBtn';
        btn.textContent = 'Select Columns';
        btn.style.margin = '1rem auto';
        btn.style.display = 'block';
        btn.style.maxWidth = '400px';
        btn.style.background = '#4f8cff';
        btn.style.color = '#fff';
        btn.style.border = 'none';
        btn.style.borderRadius = '6px';
        btn.style.padding = '0.75rem';
        btn.style.fontSize = '1.1rem';
        btn.style.cursor = 'pointer';
        document.querySelector('main').appendChild(btn);
    }
    btn.onclick = showColumnSelector;
}

document.getElementById('pasteClipboardBtn').addEventListener('click', async () => {
    try {
        const text = await navigator.clipboard.readText();
        document.getElementById('gameDataInput').value = text;
    } catch (err) {
        alert('Failed to read clipboard!');
    }
});

document.getElementById('parseBtn').addEventListener('click', () => {
    const input = document.getElementById('gameDataInput');
    const data = input.value;
    const lines = data.trim().split('\n');
    const validLines = lines.filter(line => line.match(/^\s*\S.+?\s{2,}.+/));
    if (validLines.length > 5) {
        const entry = parseGameData(data);
        saveEntry(entry);
        showAverages();
        showEntries();
        alert('Parsed successfully!');
    } else {
        alert('Parse failed!');
    }
    input.value = '';
});

// Show averages, entries, and add column selector button on page load
window.addEventListener('DOMContentLoaded', () => {
    showAverages();
    // Show all columns by default on page load
    const entries = JSON.parse(localStorage.getItem('towerTrackerEntries') || '[]');
    const allKeys = getAllKeys(entries);
    showEntries(allKeys);
    addColumnSelectorButton();
});

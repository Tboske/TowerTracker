function parseGameData(data) {
    const lines = data.trim().split('\n');
    const entry = {};
    lines.forEach(line => {
        const match = line.match(/^\s*(.+?)\s{2,}(.+)$/);
        if (match) entry[match[1]] = match[2];
    });
    const now = new Date();
    entry.ID = parseInt(localStorage.getItem('towerTrackerLastNumber') || '0', 10) + 1;
    entry['Entry Date'] = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
    localStorage.setItem('towerTrackerLastNumber', entry.ID);
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

function calculateAverages(entries) {
    let waveSum = 0, coinsSum = 0, cashSum = 0, damageSum = 0, cellsSum = 0, medalsSum = 0, count = 0;
    entries.forEach(e => {
        if (e['Wave']) {
            waveSum += parseInt(e['Wave'], 10);
            count++;
        }
        if (e['Coins Earned']) {
            let coins = e['Coins Earned'].replace(/[^\d\.]/g, '');
            coins = e['Coins Earned'].includes('B') ? parseFloat(coins) * 1e9 : parseFloat(coins);
            coinsSum += coins;
        }
        if (e['Cash Earned']) {
            let cash = e['Cash Earned'].replace(/[^\d\.]/g, '');
            cash = e['Cash Earned'].includes('M') ? parseFloat(cash) * 1e6 : parseFloat(cash);
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
        if (e['Cells Earned']) cellsSum += parseInt(e['Cells Earned'], 10);
        if (e['Medals']) medalsSum += parseInt(e['Medals'], 10);
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
    const keysSet = entries.reduce((set, entry) => {
        Object.keys(entry).forEach(k => set.add(k));
        return set;
    }, new Set());
    const keys = Array.from(keysSet).filter(k => k !== 'ID' && k !== 'Entry Date' && k !== '_averages');
    return ['ID', 'Entry Date', ...keys, '_averages'];
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
        selectedKeys = saved || allKeys;
    }
    selectedKeys = ['ID', 'Entry Date', ...selectedKeys.filter(k => k !== 'ID' && k !== 'Entry Date')];

    let sortedEntries = [...entries];
    if (sortKey) {
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

    const averages = calculateAverages(entries);

    let html = `<table style="width:100%;background:#23262f;color:#e4e6eb;border-radius:8px;border-collapse:collapse;">
        <thead>
            <tr>
                <th style="width:32px; padding:2px 0; border-bottom:1px solid #31343e;"></th>
                ${selectedKeys.map(k => {
                    let arrow = currentSort.key === k ? (currentSort.asc ? ' ▲' : ' ▼') : '';
                    let label = k === '_averages' ? 'Averages' : k;
                    return `<th style="padding:4px; border-bottom:1px solid #31343e; cursor:pointer;" onclick="orderByColumn('${k}')">${label}${arrow}</th>`;
                }).join('')}
            </tr>
        </thead>
        <tbody>
        ${sortedEntries.map((entry, idx) => `<tr>
            <td style="width:32px; padding:2px 0; border-bottom:1px solid #31343e; text-align:center;">
                <button onclick="deleteEntry(${idx})" title="Delete" class="delete-btn">&#10060;</button>
            </td>
            ${selectedKeys.map(k => {
                if (k === '_averages') {
                    return `<td style="padding:4px;border-bottom:1px solid #31343e;">
                        Wave: ${averages.avgWave}<br>
                        Coins: ${averages.avgCoins}<br>
                        Cash: ${averages.avgCash}<br>
                        Damage: ${averages.avgDamage}<br>
                        Cells: ${averages.avgCells}<br>
                        Medals: ${averages.avgMedals}
                    </td>`;
                }
                return `<td style="padding:4px;border-bottom:1px solid #31343e;">${entry[k] || ''}</td>`;
            }).join('')}
        </tr>`).join('')}
        </tbody>
    </table>`;
    tableDiv.innerHTML = html;
}

window.orderByColumn = function(key) {
    if (currentSort.key === key) {
        currentSort.asc = !currentSort.asc;
    } else {
        currentSort.key = key;
        currentSort.asc = true;
    }
    const entries = JSON.parse(localStorage.getItem('towerTrackerEntries') || '[]');
    const allKeys = getAllKeys(entries);
    let selectedKeys = JSON.parse(localStorage.getItem('towerTrackerSelectedColumns') || 'null') || allKeys;
    showEntries(selectedKeys, currentSort.key, currentSort.asc);
};

function deleteEntry(index) {
    const entries = JSON.parse(localStorage.getItem('towerTrackerEntries') || '[]');
    entries.splice(index, 1);
    localStorage.setItem('towerTrackerEntries', JSON.stringify(entries));
    const allKeys = getAllKeys(entries);
    showEntries(allKeys, currentSort.key, currentSort.asc);
}

function showColumnSelector() {
    const entries = JSON.parse(localStorage.getItem('towerTrackerEntries') || '[]');
    const allKeys = getAllKeys(entries);
    let selectedKeys = JSON.parse(localStorage.getItem('towerTrackerSelectedColumns') || 'null');
    if (!selectedKeys) selectedKeys = allKeys.filter(k => k !== 'Real Time');

    // Build checkboxes
    const form = document.getElementById('columnsForm');
    form.innerHTML = allKeys.map(k => `
        <label>
            <input type="checkbox" name="col" value="${k}" ${selectedKeys.includes(k) ? 'checked' : ''}> ${k === '_averages' ? 'Averages' : k}
        </label>
    `).join('');

    // Show submenu and overlay
    document.getElementById('columnSelector').style.display = 'flex';
    document.getElementById('columnSelectorOverlay').style.display = 'block';

    // Cancel button
    document.getElementById('closeSelectorBtn').onclick = () => {
        document.getElementById('columnSelector').style.display = 'none';
        document.getElementById('columnSelectorOverlay').style.display = 'none';
    };

    // Apply button
    form.onsubmit = function(e) {
        e.preventDefault();
        const selected = Array.from(form.elements['col'])
            .filter(cb => cb.checked)
            .map(cb => cb.value);
        localStorage.setItem('towerTrackerSelectedColumns', JSON.stringify(selected));
        showEntries(selected);
        document.getElementById('columnSelector').style.display = 'none';
        document.getElementById('columnSelectorOverlay').style.display = 'none';
    };

    // Overlay click closes submenu
    document.getElementById('columnSelectorOverlay').onclick = () => {
        document.getElementById('columnSelector').style.display = 'none';
        document.getElementById('columnSelectorOverlay').style.display = 'none';
    };
}

document.getElementById('columnSelectorBtn').onclick = showColumnSelector;

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
        showEntries();
        alert('Parsed successfully!');
    } else {
        alert('Parse failed!');
    }
    input.value = '';
});

window.addEventListener('DOMContentLoaded', () => {
    const entries = JSON.parse(localStorage.getItem('towerTrackerEntries') || '[]');
    const allKeys = getAllKeys(entries);
    showEntries(allKeys);
    addColumnSelectorButton();
});

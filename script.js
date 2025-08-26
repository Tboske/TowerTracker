// Update CATEGORY_FIELDS to only use /hour keys for rates
const CATEGORY_FIELDS = {
    "Battle Report": [
        "ID", "Entry Date", "Game Time", "Real Time", "Wave", "Coins Earned", "Coins/hour",
        "Cash Earned", "Cash/hour", "Interest Earned", "Gem Blocks Tapped",
        "Cells Earned", "Cells/hour", "Reroll Shards Earned", "Reroll Shards/hour"
    ],
    "Coins": [
        "ID", "Entry Date", "Coins Earned", "Coins/hour", "Coins from Death Wave",
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
        "Interest Earned", "Gem Blocks Tapped", "Cells Earned", "Cells/hour",
        "Reroll Shards Earned", "Reroll Shards/hour", "Rare Modules", "Inner Land Mine Damage",
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
        "Medals", "Reroll Shards", "Reroll Shards/hour", "Cannon Shards", "Armor Shards",
        "Generator Shards", "Core Shards", "Common Modules", "Rare Modules"
    ]
};

function getCategoryKeys(category) {
    const categoryFields = CATEGORY_FIELDS[category];
    return ['ID', 'Entry Date', ...categoryFields.filter(k => k !== 'ID' && k !== 'Entry Date')];
}

// Always show all tables and columns
function getVisibleTables() {
    return Object.keys(CATEGORY_FIELDS).reduce((obj, cat) => { obj[cat] = true; return obj; }, {});
}
function getVisibleColumns(table) {
    return getCategoryKeys(table);
}

// Table rendering
function showCombinedTable(entries) {
    // Sort entries by most recent (highest ID) first
    const sortedEntries = [...entries].sort((a, b) => (b.ID || 0) - (a.ID || 0));
    if (!sortedEntries.length) return '';

    // Gather all visible keys per category, skipping ID and Entry Date for categories
    const visibleTables = getVisibleTables();
    const categories = Object.keys(CATEGORY_FIELDS).filter(cat => visibleTables[cat]);
    let allKeys = [];
    let sectionRows = [];
    categories.forEach(category => {
        const keys = getVisibleColumns(category).filter(k => k !== 'ID' && k !== 'Entry Date');
        if (!keys.length) return;
        sectionRows.push({ label: category, index: allKeys.length });
        allKeys = allKeys.concat(keys);
    });

    // Table HTML (no "All Data" and no "Field" header)
    let html = `<section class="category-table">
        <div style="overflow-x:auto;">
        <table>
            <thead>
                <tr>
                    <th style="min-width:160px;position:sticky;left:0;top:0;z-index:3;background:var(--card-bg);"></th>
                    ${sortedEntries.map((entry, idx) =>
                        `<th style="min-width:80px;position:sticky;top:0;z-index:2;background:var(--card-bg);">
                            <div><strong>#</strong>${entry.ID || idx + 1}</div>
                            <div style="font-size:0.9em;color:var(--text-muted);">${entry['Entry Date'] || ''}</div>
                            <button onclick="deleteEntry(${entries.indexOf(entry)})" title="Delete" class="delete-btn">&#10060;</button>
                        </th>`
                    ).join('')}
                </tr>
            </thead>
            <tbody>
                ${allKeys.map((key, i) => {
                    // Insert section row if needed
                    const section = sectionRows.find(s => s.index === i);
                    let sectionHtml = '';
                    if (section) {
                        sectionHtml = `<tr class="section-row">
                            <td colspan="${sortedEntries.length + 1}" style="background:var(--accent);color:#fff;font-weight:bold;text-align:left;position:sticky;left:0;top:0;z-index:20;">
                                ${section.label}
                            </td>
                        </tr>`;
                    }
                    return sectionHtml + `<tr>
                        <td style="position:sticky;left:0;z-index:1;background:var(--card-bg);"><strong>${key}</strong></td>
                        ${sortedEntries.map(entry => `<td>${entry[key] || ''}</td>`).join('')}
                    </tr>`;
                }).join('')}
            </tbody>
        </table>
        </div>
    </section>`;
    return html;
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
    target.innerHTML = showCombinedTable(entries);
}

function deleteEntry(index) {
    const entries = JSON.parse(localStorage.getItem('towerTrackerEntries') || '[]');
    entries.splice(index, 1);
    localStorage.setItem('towerTrackerEntries', JSON.stringify(entries));
    showAllCategoryTables();
}

function saveEntry(entry) {
    const entries = JSON.parse(localStorage.getItem('towerTrackerEntries') || '[]');
    entries.push(entry);
    localStorage.setItem('towerTrackerEntries', JSON.stringify(entries));
}

window.addEventListener('DOMContentLoaded', () => {
    showAllCategoryTables();
});

document.getElementById('pasteClipboardBtn').addEventListener('click', async () => {
    try {
        const text = await navigator.clipboard.readText();
        if (text.trim().length > 0) {
            // Use the parsing function from parsing.js
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
        // Use the parsing function from parsing.js
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
        "- Paste your data in the input box and click 'Parse Input' to add manually.\n" +
        "- Click the red X to delete an entry.\n" +
        "- Your data is saved locally in your browser."
    );
};
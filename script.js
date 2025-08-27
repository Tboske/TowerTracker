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
        "Damage Taken", "Damage Taken Wall", "Damage Taken While Berserked",
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
        "ID", "Entry Date", "Damage", "Guardian catches", "Coins Fetched", "Gems",
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
        <div class="table-scroll-x">
        <table>
            <thead>
                <tr>
                    <th class="sticky-col"></th>
                    ${sortedEntries.map((entry, idx) =>
                        `<th class="sticky-header">
                            <div class="entry-id">#${entry.ID || idx + 1}</div>
                            <div class="entry-date">${entry['Entry Date'] || ''}</div>
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
                            <td colspan="${sortedEntries.length + 1}">${section.label}</td>
                        </tr>`;
                    }
                    return sectionHtml + `<tr>
                        <td class="sticky-col"><strong>${key}</strong></td>
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
    if (!entries.length) {
        target.innerHTML = `<div class="no-entries-msg">Feed me some Tower Stats</div>`;
    } else {
        target.innerHTML = showCombinedTable(entries);
    }
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
            const entry = parseGameData(text);

            // Require all of these keys for valid input
            const requiredKeys = ["Tier", "Wave", "Game Time", "Coins Earned", "Cells Earned"];
            const hasAllRequired = requiredKeys.every(k => Object.keys(entry).includes(k));

            if (hasAllRequired) {
                saveEntry(entry);
                showAllCategoryTables();
                alert('Parsed successfully!');
            } else {
                alert('Parse failed! Missing required game data (Tier, Wave, Game Time, Coins Earned, Cells Earned).');
            }
        } else {
            alert('Parse failed! Clipboard was empty.');
        }
    } catch (err) {
        alert('Failed to read clipboard!');
    }
});

// Show/hide the help overlay using the HTML in index.html
document.getElementById('helpBtn').onclick = function() {
    document.querySelector('.help-overlay').style.display = 'flex';
};
document.querySelector('.close-help-btn').onclick = function() {
    document.querySelector('.help-overlay').style.display = 'none';
};
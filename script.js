// Update CATEGORY_FIELDS to only use /hour keys for rates
const CATEGORY_FIELDS = {
    "Battle Report": [
        "Game Time", "Real Time", "Wave", "Coins Earned", "Coins/hour",
        "Cash Earned", "Cash/hour", "Interest Earned", "Gem Blocks Tapped",
        "Cells Earned", "Cells/hour", "Reroll Shards Earned", "Reroll Shards/hour"
    ],
    "Coins": [
        "Coins Earned", "Coins/hour", "Coins from Death Wave",
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
        "Damage", "Guardian catches", "Coins Fetched", "Gems",
        "Medals", "Reroll Shards", "Reroll Shards/hour", "Cannon Shards", "Armor Shards",
        "Generator Shards", "Core Shards", "Common Modules", "Rare Modules"
    ]
};

// Utility functions
function getCategoryKeys(category) {
    const categoryFields = CATEGORY_FIELDS[category];
    if (category === "Battle Report") {
        return categoryFields;
    }
    return categoryFields;
}
function getVisibleTables() {
    return Object.keys(CATEGORY_FIELDS).reduce((obj, cat) => { obj[cat] = true; return obj; }, {});
}
function getVisibleColumns(table) {
    return getCategoryKeys(table);
}

// Table rendering
function showCombinedTable(entries) {
    if (!entries.length) return '';
    const sortedEntries = [...entries].sort((a, b) => (b.ID || 0) - (a.ID || 0));
    const visibleTables = getVisibleTables();
    const categories = Object.keys(CATEGORY_FIELDS).filter(cat => visibleTables[cat]);
    let allKeys = [];
    let sectionRows = [];
    categories.forEach(category => {
        const keys = getVisibleColumns(category).filter(k => {
            if (category === "Battle Report") return true;
            return k !== 'ID' && k !== 'Entry Date';
        });
        if (!keys.length) return;
        sectionRows.push({ label: category, index: allKeys.length });
        allKeys = allKeys.concat(keys);
    });

    // Table HTML
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

// Entry management
function getEntries() {
    return JSON.parse(localStorage.getItem('towerTrackerEntries') || '[]');
}
function setEntries(entries) {
    localStorage.setItem('towerTrackerEntries', JSON.stringify(entries));
}
function saveEntry(entry) {
    const entries = getEntries();
    entries.push(entry);
    setEntries(entries);
}
function deleteEntry(index) {
    const entries = getEntries();
    entries.splice(index, 1);
    setEntries(entries);
    showAllCategoryTables();
}

// Main rendering
function showAllCategoryTables() {
    const entries = getEntries();
    let container = document.getElementById('entriesTablesContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'entriesTablesContainer';
        document.querySelector('main').appendChild(container);
    }
    container.innerHTML = entries.length
        ? showCombinedTable(entries)
        : `<div class="no-entries-msg">Feed me some Tower Stats</div>`;
}

// Clipboard parsing
async function handlePasteClipboard() {
    try {
        const text = await navigator.clipboard.readText();
        if (text.trim().length > 0) {
            const entry = parseGameData(text);
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
}

// Help overlay
function showHelpOverlay() {
    document.querySelector('.help-overlay').style.display = 'flex';
}
function hideHelpOverlay() {
    document.querySelector('.help-overlay').style.display = 'none';
}

// Initialization
window.addEventListener('DOMContentLoaded', () => {
    showAllCategoryTables();
    document.getElementById('pasteClipboardBtn').addEventListener('click', handlePasteClipboard);
    document.getElementById('helpBtn').onclick = showHelpOverlay;
    document.querySelector('.close-help-btn').onclick = hideHelpOverlay;
});
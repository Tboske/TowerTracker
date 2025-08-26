function parseGameData(data) {
    const entry = {};
    // Split into lines and filter out empty lines
    const lines = data.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);

    lines.forEach(line => {
        // Try splitting on tab first
        let match = line.match(/^(.+?)\t(.+)$/);
        // If not matched, try splitting on two or more spaces
        if (!match) match = line.match(/^(.+?)\s{2,}(.+)$/);
        // If not matched, try splitting on single colon
        if (!match) match = line.match(/^(.+?):\s*(.+)$/);
        // If not matched, try splitting on single space (last resort)
        if (!match) match = line.match(/^(.+?)\s+(.+)$/);
        if (match) {
            let key = match[1].trim();
            let value = match[2].trim();
            // Unify all rate keys to /hour
            if (key === "Coins Earned Rate" || key === "Coins/hour") key = "Coins/hour";
            if (key === "Cash Earning Rate" || key === "Cash/hour") key = "Cash/hour";
            if (key === "Cells Earned Rate" || key === "Cells/hour") key = "Cells/hour";
            if (key === "Reroll Shards Earned Rate" || key === "Reroll Shards/hour") key = "Reroll Shards/hour";
            entry[key] = value;
        }
    });

    // Add ID and Entry Date
    const now = new Date();
    entry.ID = parseInt(localStorage.getItem('towerTrackerLastNumber') || '0', 10) + 1;
    entry['Entry Date'] = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
    localStorage.setItem('towerTrackerLastNumber', entry.ID);

    // Calculate rates if possible
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

    // Coins/hour
    if (entry['Coins Earned'] && totalHours > 0) {
        let coinsStr = entry['Coins Earned'];
        let coins = parseFloat(coinsStr.replace(/[^\d\.]/g, ''));
        if (coinsStr.includes('B')) coins *= 1e9;
        else if (coinsStr.includes('M')) coins *= 1e6;
        else if (coinsStr.includes('K')) coins *= 1e3;
        let coinsPerHour = coins / totalHours;
        if (coinsPerHour >= 1e9) entry['Coins/hour'] = (coinsPerHour / 1e9).toFixed(2) + 'B/h';
        else if (coinsPerHour >= 1e6) entry['Coins/hour'] = (coinsPerHour / 1e6).toFixed(2) + 'M/h';
        else if (coinsPerHour >= 1e3) entry['Coins/hour'] = (coinsPerHour / 1e3).toFixed(2) + 'K/h';
        else entry['Coins/hour'] = coinsPerHour.toFixed(2) + '/h';
    } else {
        entry['Coins/hour'] = 'N/A';
    }

    // Cash/hour
    if (entry['Cash Earned'] && totalHours > 0) {
        let cashStr = entry['Cash Earned'].replace(/[^0-9\.\-]/g, '');
        let cash = parseFloat(cashStr);
        if (entry['Cash Earned'].includes('B')) cash *= 1e9;
        else if (entry['Cash Earned'].includes('M')) cash *= 1e6;
        else if (entry['Cash Earned'].includes('K')) cash *= 1e3;
        let cashPerHour = cash / totalHours;
        if (cashPerHour >= 1e9) entry['Cash/hour'] = (cashPerHour / 1e9).toFixed(2) + 'B/h';
        else if (cashPerHour >= 1e6) entry['Cash/hour'] = (cashPerHour / 1e6).toFixed(2) + 'M/h';
        else if (cashPerHour >= 1e3) entry['Cash/hour'] = (cashPerHour / 1e3).toFixed(2) + 'K/h';
        else entry['Cash/hour'] = cashPerHour.toFixed(2) + '/h';
    } else {
        entry['Cash/hour'] = 'N/A';
    }

    // Cells/hour
    if (entry['Cells Earned'] && totalHours > 0) {
        let cells = parseFloat(entry['Cells Earned'].replace(/[^\d\.]/g, ''));
        let cellsPerHour = cells / totalHours;
        entry['Cells/hour'] = cellsPerHour.toFixed(2) + '/h';
    } else {
        entry['Cells/hour'] = 'N/A';
    }

    // Reroll Shards/hour
    if (entry['Reroll Shards Earned'] && totalHours > 0) {
        let shardsStr = entry['Reroll Shards Earned'];
        let shards = parseFloat(shardsStr.replace(/[^\d\.]/g, ''));
        if (shardsStr.includes('K')) shards *= 1e3;
        let shardsPerHour = shards / totalHours;
        if (shardsPerHour >= 1e3) entry['Reroll Shards/hour'] = (shardsPerHour / 1e3).toFixed(2) + 'K/h';
        else entry['Reroll Shards/hour'] = shardsPerHour.toFixed(2) + '/h';
    } else {
        entry['Reroll Shards/hour'] = 'N/A';
    }

    return entry;
}
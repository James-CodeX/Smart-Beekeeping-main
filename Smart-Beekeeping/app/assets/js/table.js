// JavaScript for table.html

document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    await loadHiveData();
});

async function loadHiveData() {
    try {
        const historicalData = await getHistoricalHiveData();
        const tableBody = document.getElementById('hiveDataTableBody');
        const totalRecordsSpan = document.getElementById('totalRecords');
        
        if (!historicalData || historicalData.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No data available</td></tr>';
            totalRecordsSpan.textContent = '0';
            return;
        }

        totalRecordsSpan.textContent = historicalData.length;
        
        tableBody.innerHTML = historicalData.map(record => `
            <tr>
                <td>${new Date(record.created_at).toLocaleString()}</td>
                <td>${record.temperature.toFixed(1)}</td>
                <td>${record.humidity.toFixed(1)}</td>
                <td>${record.weight.toFixed(0)}</td>
                <td>${record.sound.toFixed(0)}</td>
                <td>${record.rssi}</td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading hive data:', error);
        alert('Error loading hive data. Please try again.');
    }
} 
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const tableBody = document.getElementById('registrationTableBody');
    const searchInput = document.getElementById('searchInput');
    const totalCount = document.getElementById('totalCount');
    const lastUpdated = document.getElementById('lastUpdated');

    let registrations = [];
    const maleCountEl = document.getElementById('maleCount');
    const femaleCountEl = document.getElementById('femaleCount');

    // Handle Login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();

            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const result = await res.json();
            if (result.success) {
                loginSection.style.display = 'none';
                dashboardSection.style.display = 'block';
                loadData();
            } else {
                alert('Invalid username or password.');
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderTable(searchInput.value.trim());
        });
    }

    async function loadData() {
        const res = await fetch('/api/admin/registrations');
        const result = await res.json();
        if (result.success && tableBody) {
            registrations = Array.isArray(result.data) ? result.data : [];
            updateStats();
            renderTable();
        }
    }

    function getSportSummary(reg) {
        const sports = [
            ...(Array.isArray(reg.selectedSports) ? reg.selectedSports : []),
            ...(Array.isArray(reg.july12Sports) ? reg.july12Sports : []),
            ...(Array.isArray(reg.july19Sports) ? reg.july19Sports : [])
        ];

        if (!sports.length) return '—';

        return sports.map((item) => {
            const name = (item.sportName || '').toString();
            if (name.toLowerCase() === 'only attending the event') return 'Only attending the event';
            const parts = [item.ageCategory || 'N/A'];
            if (item.type) parts.push(item.type);
            if (item.partnerName && item.partnerName !== 'N/A') parts.push(`Partner: ${item.partnerName}`);
            return `${name} (${parts.join(', ')})`;
        }).join(', ');
    }

    function renderTable(filter = '') {
        const normalizedFilter = filter.toLowerCase();
        const rows = registrations
            .filter((reg) => {
                if (!normalizedFilter) return true;
                const sportText = getSportSummary(reg).toLowerCase();
                return [reg.fullName, reg.gender, reg.mobile, sportText]
                    .filter(Boolean)
                    .some((value) => value.toLowerCase().includes(normalizedFilter));
            })
            .map((reg, i) => `
                <tr>
                    <td data-label="#">${i + 1}</td>
                    <td data-label="Name">${reg.fullName || '—'}</td>
                    <td data-label="Gender">${reg.gender || '—'}</td>
                    <td data-label="Mobile">${reg.mobile || '—'}</td>
                    <td data-label="Sports & Category">${getSportSummary(reg)}</td>
                </tr>
            `);

        tableBody.innerHTML = rows.join('') || '<tr><td colspan="5">No registrations found.</td></tr>';
    }

    function updateStats() {
        totalCount.textContent = registrations.length;
        lastUpdated.textContent = new Date().toLocaleString();
        // compute male/female totals
        const counts = registrations.reduce((acc, r) => {
            const g = (r.gender || '').toString().toLowerCase();
            if (g === 'male') acc.male += 1;
            else if (g === 'female') acc.female += 1;
            return acc;
        }, { male: 0, female: 0 });
        if (maleCountEl) maleCountEl.textContent = counts.male;
        if (femaleCountEl) femaleCountEl.textContent = counts.female;
    }

    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            try {
                exportBtn.textContent = '⏳ Exporting...';
                exportBtn.disabled = true;

                const response = await fetch('/api/admin/export');
                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `JSG_Registrations_${new Date().toISOString().split('T')[0]}.xlsx`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                } else {
                    alert('Error exporting data!');
                }
            } catch (error) {
                console.error('Export Error:', error);
                alert('Failed to export data!');
            } finally {
                exportBtn.textContent = '📥 Export to Excel';
                exportBtn.disabled = false;
            }
        });
    }

    // Removed clear-data UI and logic. Showing male/female totals instead.
});
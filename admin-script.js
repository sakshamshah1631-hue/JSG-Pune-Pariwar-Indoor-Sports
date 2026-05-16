document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const tableBody = document.getElementById('registrationTableBody');

    // Handle Login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

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
                alert("Invalid Username or Password!");
            }
        });
    }

    // Load table data
    async function loadData() {
        const res = await fetch('/api/admin/registrations');
        const result = await res.json();
        if (result.success && tableBody) {
            tableBody.innerHTML = result.data.map((reg, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td>${reg.fullName}</td>
                    <td>${reg.mobile}</td>
                    <td>${reg.jsgGroup}</td>
                </tr>
            `).join('');
        }
    }

    // Handle Export to Excel
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
                    
                    exportBtn.textContent = '📥 Export to Excel';
                    exportBtn.disabled = false;
                } else {
                    alert('Error exporting data!');
                    exportBtn.textContent = '📥 Export to Excel';
                    exportBtn.disabled = false;
                }
            } catch (error) {
                console.error('Export Error:', error);
                alert('Failed to export data!');
                exportBtn.textContent = '📥 Export to Excel';
                exportBtn.disabled = false;
            }
        });
    }
});
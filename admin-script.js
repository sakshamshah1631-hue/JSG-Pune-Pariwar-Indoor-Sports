document.addEventListener('DOMContentLoaded', function() {
    const loginSection = document.getElementById('loginSection');
    const dashboardSection = document.getElementById('dashboardSection');
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const totalRegistrationsEl = document.getElementById('totalRegistrations');
    const registrationsTableBody = document.querySelector('#registrationsTable tbody');
    
    // Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            const result = await response.json();
            
            if (result.success) {
                localStorage.setItem('adminLoggedIn', 'true');
                loadDashboard();
            } else {
                alert('Invalid credentials!');
            }
        } catch (error) {
            alert('Login failed. Please try again.');
        }
    });
    
    // Check if already logged in
    if (localStorage.getItem('adminLoggedIn') === 'true') {
        loadDashboard();
    }
    
    async function loadDashboard() {
        try {
            const response = await fetch('/api/admin/registrations');
            const data = await response.json();
            
            totalRegistrationsEl.textContent = data.total;
            populateTable(data.registrations);
            
            loginSection.style.display = 'none';
            dashboardSection.style.display = 'block';
        } catch (error) {
            localStorage.removeItem('adminLoggedIn');
            alert('Session expired. Please login again.');
        }
    }
    
    function populateTable(registrations) {
        registrationsTableBody.innerHTML = '';
        
        registrations.slice(-10).reverse().forEach(reg => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${reg.id}</td>
                <td>${reg.fullName}</td>
                <td>${reg.mobile}</td>
                <td>${reg.age}</td>
                <td>${reg.jsgGroup}</td>
                <td>${reg.july12Sports?.join(', ') || 'None'}</td>
                <td>${reg.july19Sports?.join(', ') || 'None'}</td>
                <td>${new Date(reg.timestamp).toLocaleString()}</td>
            `;
            registrationsTableBody.appendChild(row);
        });
    }
    
    // Logout
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('adminLoggedIn');
        loginSection.style.display = 'flex';
        dashboardSection.style.display = 'none';
        loginForm.reset();
    });
    
    // Auto-refresh table every 30 seconds
    setInterval(loadDashboard, 30000);
});
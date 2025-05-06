let token = localStorage.getItem('token');

// Login functionality
document.getElementById('loginFormElement')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            token = data.token;
            localStorage.setItem('token', token);
            showAdminPanel();
            loadAppointments();
        } else {
            showLoginMessage('Грешно потребителско име или парола', 'bg-red-500/20 text-red-500');
        }
    } catch (error) {
        console.error('Login error:', error);
        showLoginMessage('Грешка при свързване със сървъра', 'bg-red-500/20 text-red-500');
    }
});

// Show/hide panels
function showAdminPanel() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');
}

function showLoginForm() {
    document.getElementById('adminPanel').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
}

function showLoginMessage(message, className) {
    const messageDiv = document.getElementById('loginMessage');
    if (!messageDiv) return;

    messageDiv.textContent = message;
    messageDiv.className = `${className} py-2 px-4 rounded-lg text-center`;
    messageDiv.classList.remove('hidden');
}

// Load appointments
async function loadAppointments() {
    try {
        const response = await fetch('http://localhost:5000/api/appointments', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Unauthorized');
        
        const appointments = await response.json();
        displayAppointments(appointments);
    } catch (error) {
        console.error('Error loading appointments:', error);
        if (error.message === 'Unauthorized') {
            showLoginForm();
        }
    }
}

// Display appointments in table
function displayAppointments(appointments) {
    const tbody = document.getElementById('appointmentsTable');
    if (!tbody) return;

    tbody.innerHTML = appointments
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map(app => {
            const date = new Date(app.date).toLocaleDateString('bg-BG');
            const statusClass = getStatusClass(app.status);
            const serviceNames = {
                'haircut': 'Подстригване',
                'beard': 'Брада',
                'combo': 'Комбо пакет'
            };

            return `
                <tr class="border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
                    <td class="py-3 px-4">${app.name}</td>
                    <td class="py-3 px-4">${app.phone}</td>
                    <td class="py-3 px-4">${serviceNames[app.service]}</td>
                    <td class="py-3 px-4">${date}</td>
                    <td class="py-3 px-4">${app.time}</td>
                    <td class="py-3 px-4">
                        <span class="px-2 py-1 rounded-full text-xs font-medium ${statusClass}">
                            ${getStatusText(app.status)}
                        </span>
                    </td>
                    <td class="py-3 px-4">
                        <select class="bg-gray-700 text-gray-300 rounded px-2 py-1 text-sm border border-gray-600 focus:outline-none focus:border-yellow-500"
                                onchange="updateStatus('${app._id}', this.value)">
                            <option value="pending" ${app.status === 'pending' ? 'selected' : ''}>В изчакване</option>
                            <option value="confirmed" ${app.status === 'confirmed' ? 'selected' : ''}>Потвърден</option>
                            <option value="cancelled" ${app.status === 'cancelled' ? 'selected' : ''}>Отказан</option>
                        </select>
                    </td>
                </tr>
            `;
        })
        .join('');
}

// Update appointment status
async function updateStatus(id, status) {
    try {
        const response = await fetch(`http://localhost:5000/api/appointments/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });

        if (!response.ok) throw new Error('Failed to update status');
        
        // Презареждаме часовете след успешна промяна
        loadAppointments();
    } catch (error) {
        console.error('Error updating status:', error);
        alert('Грешка при обновяване на статуса');
    }
}

// Logout
document.getElementById('logout')?.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.reload();
});

// Helper function for status colors
function getStatusClass(status) {
    switch (status) {
        case 'confirmed': return 'bg-green-500/20 text-green-500';
        case 'cancelled': return 'bg-red-500/20 text-red-500';
        default: return 'bg-yellow-500/20 text-yellow-500';
    }
}

function getStatusText(status) {
    switch (status) {
        case 'confirmed': return 'Потвърден';
        case 'cancelled': return 'Отказан';
        default: return 'В изчакване';
    }
}

// Initial check
if (token) {
    showAdminPanel();
    loadAppointments();
    setInterval(loadAppointments, 30000);
} else {
    showLoginForm();
} 
// Премахваме AOS инициализацията
document.addEventListener('DOMContentLoaded', function() {
    // Оптимизирани галерия снимки - намален брой
    const galleryImages = [
        'images/1.jpg',
        'images/2.jpg',
        'images/3.jpg',
        'images/4.jpg'
    ];

    // Опростена галерия без hover ефекти
    const galleryGrid = document.getElementById('galleryGrid');
    if (galleryGrid) {
        galleryGrid.innerHTML = galleryImages.map(imageUrl => `
            <div class="cursor-pointer">
                <img src="${imageUrl}" class="w-full h-64 object-cover rounded-lg" alt="Gallery" loading="lazy">
            </div>
        `).join('');

        // Опростен модален прозорец
        const imageModal = document.getElementById('imageModal');
        const modalImage = document.getElementById('modalImage');
        
        galleryGrid.addEventListener('click', (e) => {
            const clickedImage = e.target.closest('img');
            if (clickedImage) {
                modalImage.src = clickedImage.src;
                imageModal.classList.remove('hidden');
                setTimeout(() => {
                    imageModal.style.opacity = '1';
                }, 10);
            }
        });

        document.getElementById('closeModal')?.addEventListener('click', () => {
            imageModal.style.opacity = '0';
            setTimeout(() => {
                imageModal.classList.add('hidden');
            }, 300);
        });
    }

    // Опростена система за отзиви
    const reviews = [
        {
            name: 'Иван Петров',
            rating: 5,
            text: 'Невероятно обслужване и професионализъм!',
            date: '2024-02-15'
        },
        {
            name: 'Димитър Георгиев',
            rating: 5,
            text: 'Най-добрият барбершоп!',
            date: '2024-02-10'
        }
    ];

    function displayReviews() {
        const container = document.getElementById('reviewsContainer');
        if (!container) return;
        
        container.innerHTML = reviews.map(review => `
            <div class="bg-gray-800 p-6 rounded-lg">
                <div class="text-yellow-500 text-xl mb-4">
                    ${'★'.repeat(review.rating)}
                </div>
                <p class="mb-4">${review.text}</p>
                <div class="text-sm text-gray-400">
                    <span>${review.name}</span>
                </div>
            </div>
        `).join('');
    }

    displayReviews();

    // Добавяне на отзив
    document.getElementById('addReviewBtn')?.addEventListener('click', () => {
        const rating = prompt('Оценка (1-5 звезди):', '5');
        if (!rating || rating < 1 || rating > 5) return;

        const text = prompt('Вашият отзив:', '');
        if (!text) return;

        const name = prompt('Вашето име:', '');
        if (!name) return;

        reviews.unshift({
            name,
            rating: parseInt(rating),
            text,
            date: new Date().toISOString().split('T')[0]
        });

        displayReviews();
    });

    // Форма за записване на часове
    const initBookingForm = () => {
        const bookingForm = document.getElementById('bookingForm');
        const bookingMessage = document.getElementById('bookingMessage');
        const dateInput = document.getElementById('date');
        const timeSelect = document.getElementById('time');

        if (!bookingForm) return;

        // Задаване на минимална дата (днес)
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateInput.min = tomorrow.toISOString().split('T')[0];

        // Валидация на телефонен номер
        const phoneInput = document.getElementById('phone');
        phoneInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 10) value = value.slice(0, 10);
            e.target.value = value;
        });

        // Проверка за заети часове при избор на дата
        dateInput.addEventListener('change', async (e) => {
            const selectedDate = e.target.value;
            if (!selectedDate) return;

            try {
                const response = await fetch(`http://localhost:5000/api/appointments/available?date=${selectedDate}`);
                if (!response.ok) throw new Error('Грешка при проверка на часовете');
                
                const bookedTimes = await response.json();

                // Обновяване на достъпните часове
                Array.from(timeSelect.options).forEach(option => {
                    if (!option.value) return; // Пропускаме празната опция
                    const isBooked = bookedTimes.includes(option.value);
                    option.disabled = isBooked;
                    option.textContent = isBooked ? `${option.value} (заето)` : option.value;
                });
            } catch (error) {
                console.error('Грешка:', error);
                showBookingMessage('Грешка при проверка на свободните часове', 'bg-red-500/20 text-red-500');
            }
        });

        // Обработка на формата
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(bookingForm);
            const data = {
                name: formData.get('name'),
                phone: formData.get('phone'),
                service: formData.get('service'),
                date: formData.get('date'),
                time: formData.get('time')
            };

            // Валидация
            if (!data.name || data.name.length < 2) {
                showBookingMessage('Моля, въведете валидно име (поне 2 символа)', 'bg-red-500/20 text-red-500');
                return;
            }

            if (!data.phone || !/^\d{10}$/.test(data.phone)) {
                showBookingMessage('Моля, въведете валиден телефонен номер (10 цифри)', 'bg-red-500/20 text-red-500');
                return;
            }

            if (!data.date || !data.time) {
                showBookingMessage('Моля, изберете дата и час', 'bg-red-500/20 text-red-500');
                return;
            }

            showBookingMessage('Обработване на заявката...', 'bg-yellow-500/20 text-yellow-500');

            try {
                const response = await fetch('http://localhost:5000/api/appointments', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok) {
                    showBookingMessage('Успешно запазихте час! Очаквайте обаждане за потвърждение.', 'bg-green-500/20 text-green-500');
                    bookingForm.reset();
                    dateInput.min = tomorrow.toISOString().split('T')[0];
                    
                    // Ресетваме часовете
                    Array.from(timeSelect.options).forEach(option => {
                        if (option.value) {
                            option.disabled = false;
                            option.textContent = option.value;
                        }
                    });
                } else {
                    showBookingMessage(result.message || 'Този час вече е зает', 'bg-red-500/20 text-red-500');
                }
            } catch (error) {
                console.error('Грешка при записване:', error);
                showBookingMessage('Възникна грешка при записването. Моля, опитайте отново.', 'bg-red-500/20 text-red-500');
            }
        });
    };

    // Функция за показване на съобщения
    function showBookingMessage(message, className) {
        const messageDiv = document.getElementById('bookingMessage');
        if (!messageDiv) return;

        messageDiv.textContent = message;
        messageDiv.className = `${className} py-3 px-4 rounded-lg text-center mb-4`;
        messageDiv.classList.remove('hidden');

        if (message.includes('Успешно')) {
            setTimeout(() => {
                messageDiv.classList.add('hidden');
            }, 5000);
        }
    }

    // Инициализиране на формата
    initBookingForm();

    // Променяме плавното скролване
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Добавяме CSS стилове за модалния прозорец
    const modalStyle = document.createElement('style');
    modalStyle.textContent = `
        #imageModal {
            transition: opacity 0.3s ease-in-out;
            opacity: 0;
        }
        #imageModal img {
            transition: transform 0.3s ease-in-out;
        }
        #imageModal:not(.hidden) img {
            transform: scale(1);
        }
    `;
    document.head.appendChild(modalStyle);
}); 
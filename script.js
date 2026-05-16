document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('registrationForm');
    const sportInputs = document.querySelectorAll('.sport-item input[type="checkbox"]');
    const july12Count = document.getElementById('july12-count');
    const july19Count = document.getElementById('july19-count');

    // Handle Responsive Mobile Navbar Menu Toggle
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // Dynamic display calculator implementation
    function updateSportCounts(className, displayElement) {
        const checkedCount = document.querySelectorAll(`.${className} input[type="checkbox"]:checked`).length;
        displayElement.textContent = `${checkedCount}/2 selected`;
    }

    // Dynamic show/hide and setting submenus options to required
    sportInputs.forEach(input => {
        input.addEventListener('change', function () {
            const container = this.closest('.sport-item');
            const isJuly12 = container.classList.contains('july12');
            const currentGroup = isJuly12 ? 'july12' : 'july19';
            const currentCounter = isJuly12 ? july12Count : july19Count;

            const ageGroupContainer = container.querySelector('.sport-age-group');
            const ageSelect = ageGroupContainer.querySelector('select');

            if (this.checked) {
                ageGroupContainer.style.display = 'block';
                ageSelect.required = true;
            } else {
                ageGroupContainer.style.display = 'none';
                ageSelect.required = false;
                ageSelect.value = ''; 
            }

            const selectedInGroup = Array.from(document.querySelectorAll(`.${currentGroup} input[type="checkbox"]:checked`));
            if (selectedInGroup.length > 2) {
                const deselectInput = selectedInGroup[1];
                deselectInput.checked = false;
                const deselectContainer = deselectInput.closest('.sport-item');
                const deselectAgeGroup = deselectContainer.querySelector('.sport-age-group');
                const deselectAgeSelect = deselectAgeGroup.querySelector('select');
                deselectAgeGroup.style.display = 'none';
                deselectAgeSelect.required = false;
                deselectAgeSelect.value = '';
            }

            updateSportCounts(currentGroup, currentCounter);
        });
    });

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const july12Sports = [];
        const july19Sports = [];

        // Collate and process nested array data values
        document.querySelectorAll('.july12 input[type="checkbox"]:checked').forEach(input => {
            const container = input.closest('.sport-item');
            const ageGroup = container.querySelector('.sport-age-group select').value;
            july12Sports.push({
                sportName: input.value,
                ageCategory: ageGroup
            });
        });

        document.querySelectorAll('.july19 input[type="checkbox"]:checked').forEach(input => {
            const container = input.closest('.sport-item');
            const ageGroup = container.querySelector('.sport-age-group select').value;
            july19Sports.push({
                sportName: input.value,
                ageCategory: ageGroup
            });
        });

        // Enforce maximum options limit boundaries
        if (july12Sports.length > 2 || july19Sports.length > 2) {
            alert('Maximum 2 sports allowed per date');
            return;
        }

        // Validate that at least one sport has been configured
        if (july12Sports.length === 0 && july19Sports.length === 0) {
            alert('Selection of sports is mandatory for at least one of the dates.');
            return;
        }

        const data = {
            fullName: form.fullName.value,
            age: form.age.value,
            gender: form.gender.value,
            mobile: form.mobile.value,
            email: form.email.value,
            city: form.city.value,
            jsgGroup: form.jsgGroup.value,
            emergencyContact: form.emergencyContact.value || 'N/A', 
            medicalConditions: form.medicalConditions.value || 'None',
            july12Sports: july12Sports,
            july19Sports: july19Sports
        };

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                // Instantly clean layout route redirect rules execution
                window.location.href = '/thank-you.html';
            } else {
                alert('Registration failed: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error(error);
            alert('Server configuration error execution failed');
        }
    });
});
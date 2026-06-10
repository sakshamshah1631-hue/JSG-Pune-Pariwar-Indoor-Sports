document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('registrationForm');
    const sportInputs = document.querySelectorAll('.sport-item input[type="checkbox"]');
    const july12Count = document.getElementById('july12-count');

    // Handle Responsive Mobile Navbar Menu Toggle
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // Dynamic display calculator implementation
    function updateSportCounts() {
        const noSportsChecked = document.querySelector('.july12 input[data-no-sports]')?.checked;
        if (noSportsChecked) {
            july12Count.textContent = 'Only attending the event selected';
            return;
        }
        const checkedCount = document.querySelectorAll('.july12 input[type="checkbox"]:checked:not([data-no-sports])').length;
        july12Count.textContent = `${checkedCount} selected`;
    }

    // Dynamic show/hide and setting submenus options to required
    sportInputs.forEach(input => {
        input.addEventListener('change', function () {
            const container = this.closest('.sport-item');
            const isNoSports = this.dataset.noSports === 'true';
            const ageGroupContainer = container.querySelector('.sport-age-group');
            const selectFields = Array.from(ageGroupContainer?.querySelectorAll('select') || []);
            const noSportsInput = document.querySelector('.july12 input[data-no-sports]');
            const otherInputs = Array.from(document.querySelectorAll('.july12 input[type="checkbox"]:not([data-no-sports])'));

            if (isNoSports && this.checked) {
                otherInputs.forEach(otherInput => {
                    const otherContainer = otherInput.closest('.sport-item');
                    const otherAgeGroup = otherContainer.querySelector('.sport-age-group');
                    const otherSelects = Array.from(otherAgeGroup.querySelectorAll('select'));
                    otherInput.checked = false;
                    otherInput.disabled = true;
                    otherAgeGroup.style.display = 'none';
                    otherSelects.forEach(select => {
                        select.required = false;
                        select.value = '';
                    });
                });
            }

            if (!isNoSports && this.checked) {
                if (noSportsInput) {
                    noSportsInput.checked = false;
                }
            }

            if (isNoSports && !this.checked) {
                otherInputs.forEach(otherInput => {
                    otherInput.disabled = false;
                });
            }

            if (!isNoSports) {
                if (this.checked) {
                    ageGroupContainer.style.display = 'block';
                    selectFields.forEach(select => select.required = true);
                } else {
                    ageGroupContainer.style.display = 'none';
                    selectFields.forEach(select => {
                        select.required = false;
                        select.value = '';
                    });
                }
            }

            updateSportCounts();
        });
    });

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const selectedSports = [];

        document.querySelectorAll('.july12 input[type="checkbox"]:checked').forEach(input => {
            if (input.dataset.noSports === 'true') {
                selectedSports.push({ sportName: input.value, ageCategory: 'N/A' });
                return;
            }
            const container = input.closest('.sport-item');
            const selects = Array.from(container.querySelectorAll('.sport-age-group select'));
            const ageGroup = selects[0]?.value || 'N/A';
            
            selectedSports.push({ sportName: input.value, ageCategory: ageGroup });
        });

        if (selectedSports.length === 0) {
            alert('Please choose at least one sport, or select Only attending the event.');
            return;
        }

        const mobile = form.mobile.value.trim();
        const mobileValid = /^[0-9]{10}$/.test(mobile);
        if (!mobileValid) {
            alert('Please enter a valid 10-digit mobile number using numbers only.');
            form.mobile.focus();
            return;
        }

        const data = {
            fullName: form.fullName.value,
            age: form.age.value,
            gender: form.gender.value,
            jsgGroup: form.jsgGroup.value,
            mobile: mobile,
            city: 'N/A',
            emergencyContact: form.emergencyContact.value || 'N/A', 
            medicalConditions: form.medicalConditions.value || 'None',
            selectedSports: selectedSports
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
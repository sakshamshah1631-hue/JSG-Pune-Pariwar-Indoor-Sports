document.addEventListener('DOMContentLoaded', function () {

    const form = document.getElementById('registrationForm');

    form.addEventListener('submit', async function (e) {

        e.preventDefault();

        // GET SPORTS
        const july12Sports = [];
        const july19Sports = [];

        document.querySelectorAll('input[name="july12[]"]:checked')
            .forEach(input => {
                july12Sports.push(input.value);
            });

        document.querySelectorAll('input[name="july19[]"]:checked')
            .forEach(input => {
                july19Sports.push(input.value);
            });

        // VALIDATION
        if (july12Sports.length > 2 || july19Sports.length > 2) {
            alert('Maximum 2 sports allowed per date');
            return;
        }

        // FORM DATA
        const data = {
            fullName: form.fullName.value,
            age: form.age.value,
            gender: form.gender.value,
            mobile: form.mobile.value,
            email: form.email.value,
            city: form.city.value,
            jsgGroup: form.jsgGroup.value,
            emergencyContact: form.emergencyContact.value,
            medicalConditions: form.medicalConditions.value,
            july12Sports: july12Sports,
            july19Sports: july19Sports
        };

        console.log("SENDING DATA:");
        console.log(data);

        try {

            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            console.log(result);

            if (result.success) {

                alert('Registration Successful!');

                form.reset();

            } else {

                alert('Registration failed');

            }

        } catch (error) {

            console.log(error);

            alert('Server error');

        }

    });

});
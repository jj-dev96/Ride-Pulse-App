// RidePulse - Profile Setup Logic

document.addEventListener('DOMContentLoaded', () => {
    initSmartGarage();
    initProfileImage();
    loadExistingData();

    // Save Button Handler
    const saveBtn = document.getElementById('saveProfileBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveProfile);
    }
});

function initSmartGarage() {
    const brandSelect = document.getElementById('brandSelect');
    const modelSelect = document.getElementById('modelSelect');
    const modelContainer = document.getElementById('modelContainer');
    const specsContainer = document.getElementById('specsContainer');

    // Populate Brands
    if (window.BIKE_DATABASE) {
        Object.keys(window.BIKE_DATABASE).forEach(brand => {
            const option = document.createElement('option');
            option.value = brand;
            option.textContent = brand;
            brandSelect.appendChild(option);
        });
    }

    // Brand Change Handler
    brandSelect.addEventListener('change', (e) => {
        const brand = e.target.value;
        modelSelect.innerHTML = '<option value="">Select Model</option>';

        if (brand && window.BIKE_DATABASE[brand]) {
            // Enable Model Selection
            modelContainer.classList.remove('opacity-50', 'pointer-events-none');

            // Populate Models
            window.BIKE_DATABASE[brand].models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.id;
                option.textContent = model.name;
                option.dataset.hp = model.hp;
                option.dataset.torque = model.torque;
                option.dataset.weight = model.weight;
                modelSelect.appendChild(option);
            });
        } else {
            modelContainer.classList.add('opacity-50', 'pointer-events-none');
            resetSpecs();
        }
    });

    // Model Change Handler
    modelSelect.addEventListener('change', (e) => {
        const selectedOption = e.target.selectedOptions[0];
        if (selectedOption && selectedOption.value) {
            updateSpecs({
                hp: selectedOption.dataset.hp,
                torque: selectedOption.dataset.torque,
                weight: selectedOption.dataset.weight
            });
            generatePowerCurve(selectedOption.dataset.hp);
        } else {
            resetSpecs();
        }
    });
}

function updateSpecs(specs) {
    animateValue(document.getElementById('specHP'), specs.hp);
    animateValue(document.getElementById('specTorque'), specs.torque);
    animateValue(document.getElementById('specWeight'), specs.weight);
}

function resetSpecs() {
    document.getElementById('specHP').textContent = '--';
    document.getElementById('specTorque').textContent = '--';
    document.getElementById('specWeight').textContent = '--';
    document.getElementById('powerBandGraph').innerHTML = '';
}

function animateValue(obj, end) {
    if (!obj) return;
    let startTimestamp = null;
    const duration = 1000;
    const start = 0;

    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.innerHTML = end;
        }
    };
    window.requestAnimationFrame(step);
}

function generatePowerCurve(maxHp) {
    const container = document.getElementById('powerBandGraph');
    container.innerHTML = '';
    const bars = 20;

    for (let i = 0; i < bars; i++) {
        const bar = document.createElement('div');
        bar.className = 'w-1 bg-accent-neon/50 rounded-t';
        // Simulate a power curve (ease in out)
        let height = Math.sin((i / bars) * Math.PI) * 100;
        bar.style.height = `${height}%`;
        bar.style.opacity = (i + 1) / bars;
        container.appendChild(bar);
    }
}

function initProfileImage() {
    const upload = document.getElementById('profileUpload');
    const preview = document.getElementById('profilePreview');

    if (upload && preview) {
        upload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    preview.src = e.target.result;
                    preview.classList.remove('opacity-50');
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

function saveProfile() {
    const brand = document.getElementById('brandSelect').value;
    const model = document.getElementById('modelSelect').value;
    const modelName = document.getElementById('modelSelect').selectedOptions[0]?.textContent;

    if (!brand || !model) {
        if (window.RidePulse && window.RidePulse.NotificationManager) {
            window.RidePulse.NotificationManager.error('Please configure your machine first.');
        } else {
            alert('Please configure your machine first.');
        }
        return;
    }

    const profileData = {
        bike: {
            brand,
            model,
            modelName,
            hp: document.getElementById('specHP').textContent,
            torque: document.getElementById('specTorque').textContent
        },
        rider: {
            license: document.querySelector('input[placeholder="XXXX-XXXX"]').value,
            bloodType: document.querySelector('select').value
        },
        setupComplete: true
    };

    localStorage.setItem('ridePulseProfile', JSON.stringify(profileData));

    // Simulate Success & Redirect
    const btn = document.getElementById('saveProfileBtn');
    const originalText = btn.innerHTML;

    btn.innerHTML = '<span class="material-icons animate-spin">sync</span> SYNCING...';
    btn.disabled = true;

    setTimeout(() => {
        if (window.RidePulse && window.RidePulse.NotificationManager) {
            window.RidePulse.NotificationManager.success('Neural Link Established.');
        }
        setTimeout(() => {
            window.location.href = 'settings.html';
        }, 1500);
    }, 1500);
}

function loadExistingData() {
    const data = JSON.parse(localStorage.getItem('ridePulseProfile'));
    if (data && data.bike) {
        const brandSelect = document.getElementById('brandSelect');
        brandSelect.value = data.bike.brand;
        brandSelect.dispatchEvent(new Event('change'));

        // Timeout to allow model population
        setTimeout(() => {
            const modelSelect = document.getElementById('modelSelect');
            modelSelect.value = data.bike.model;
            modelSelect.dispatchEvent(new Event('change'));
        }, 100);
    }
}

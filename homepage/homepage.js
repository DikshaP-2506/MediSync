// Function to update the clock
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata" });
    document.querySelector('.clock').innerText = timeString;
}

// Function to redirect to the profile page
function gotoprofile() {
    window.location.href = "../profilepage/profile.html";
}

// Update the clock every second
setInterval(updateClock, 1000);
updateClock();

// Redirect functions for games
function redirectToGameMemory() {
    window.location.href = "../games/memory-game.html";
}

function redirectToGameMaze() {
    window.location.href = "../games/maze-game.html";
}

function redirectToGameWhackamole() {
    window.location.href = "../games/whackamole-game.html";
}

// Save medication data to local storage
function saveMedicationsToLocalStorage(medications) {
    localStorage.setItem("medications", JSON.stringify(medications));
}

// Load medication data from local storage
function loadMedicationsFromLocalStorage() {
    const medications = JSON.parse(localStorage.getItem("medications")) || [];
    return medications;
}

// Add a medication card to the UI
function addMedicationCard(medication) {
    const medList = document.getElementById("medication-list");
    const todayMedList = document.getElementById("today-medication-list");

    const medCard = document.createElement("div");
    medCard.classList.add("med-card");
    medCard.innerHTML = `
        <h3>${medication.medName}</h3>
        <p>🕒 ${medication.medTime}</p>
        <p>💊 ${medication.medQuantity} left</p>
    `;
    medList.appendChild(medCard);

    const todayMedCard = document.createElement("div");
    todayMedCard.classList.add("med-card");
    todayMedCard.innerHTML = `
        <input type="checkbox" class="med-checkbox">
        <h3>${medication.medName}</h3>
        <p>🕒 ${medication.medTime}</p>
        <p>💊 ${medication.medQuantity} left</p>
    `;
    todayMedList.appendChild(todayMedCard);

    // Handle checkbox click (mark as taken)
    todayMedCard.querySelector(".med-checkbox").addEventListener("change", function () {
        todayMedCard.style.opacity = this.checked ? "0.5" : "1";
        if (this.checked) {
            clearNotification(medication.medName);
            markMedicationAsTaken(medication.medName, medication.medTime, medication.phoneNumber);
        }
    });
}

// Function to add a notification
function addNotification(message, type = "reminder") {
    const notificationList = document.getElementById("notification-list");
    if (!notificationList) {
        console.error("Notification list container not found!");
        return;
    }

    const notificationCard = document.createElement("div");
    notificationCard.classList.add("notification-card");
    notificationCard.innerHTML = `
        <p>${message}</p>
        <small>${new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })}</small>
    `;
    notificationList.appendChild(notificationCard);

    // Update notification badge count
    const badge = document.querySelector(".badge");
    if (badge) {
        badge.textContent = parseInt(badge.textContent) + 1;
    }
}

// Function to clear notifications for a specific medication
function clearNotification(medName) {
    const notifications = document.querySelectorAll(".notification-card");
    notifications.forEach(notification => {
        if (notification.textContent.includes(medName)) {
            notification.remove();
        }
    });
}

// Function to mark medication as taken
function markMedicationAsTaken(medName, medTime, phoneNumber) {
    fetch("http://localhost:5000/mark-taken", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medName, medTime, phoneNumber }),
    })
        .then(response => response.json())
        .then(data => console.log(data.message))
        .catch(error => console.error("Error:", error));
}

// Function to check for reminders and missed doses
function checkMedications() {
    const todayMedications = document.querySelectorAll("#today-medication-list .med-card");

    todayMedications.forEach(medCard => {
        const medTime = medCard.querySelector("p").textContent.split("🕒 ")[1]; // Extract time
        const medName = medCard.querySelector("h3").textContent; // Extract medication name
        const checkbox = medCard.querySelector(".med-checkbox");

        // Convert medication time to a Date object in Asia/Kolkata timezone
        const [hours, minutes] = medTime.split(":");
        const medDateTime = new Date();
        medDateTime.setHours(hours, minutes, 0, 0);

        // Get current time in Asia/Kolkata timezone
        const currentTime = new Date();
        const options = { timeZone: "Asia/Kolkata" };
        const currentTimeIST = new Date(currentTime.toLocaleString("en-US", options));

        // Check if it's time to take the medication (reminder)
        if (currentTimeIST >= medDateTime && currentTimeIST <= new Date(medDateTime.getTime() + 60000)) {
            if (!missedDoseNotifications[medName]?.reminderSent) {
                addNotification(`The inventory of <strong>${medName}</strong> is expectedly empty today at ${medTime}.
                    Buy new stock of medicines using <strong>Pharmacy Locator</strong> `, "reminder");
                missedDoseNotifications[medName] = { reminderSent: true, sent10: false, sent30: false };
            }
        }

        // Check if the medication was missed (current time > scheduled time)
        if (currentTimeIST > medDateTime && !checkbox.checked) {
            const timeSinceMissed = (currentTimeIST - medDateTime) / 60000; // Time in minutes

            // Send notification after 10 minutes
            if (timeSinceMissed >= 10 && timeSinceMissed < 11 && !missedDoseNotifications[medName]?.sent10) {
                addNotification(`You missed today's dose of <strong>${medName}</strong> at ${medTime}.`, "missed");
                missedDoseNotifications[medName].sent10 = true;
            }

            // Send notification after 30 minutes
            if (timeSinceMissed >= 30 && timeSinceMissed < 31 && !missedDoseNotifications[medName]?.sent30) {
                addNotification(`You missed today's dose of <strong>${medName}</strong> at ${medTime}.`, "missed");
                missedDoseNotifications[medName].sent30 = true;
            }
        }
    });
}

// Function to calculate the expected end date of medication stock
function calculateEndDate(medQuantity) {
    const now = new Date();
    const endDate = new Date(now.getTime() + medQuantity * 24 * 60 * 60 * 1000); // 1 pill per day
    return endDate;
}

// Function to schedule a low stock notification
function scheduleLowStockNotification(medName, medQuantity) {
    const endDate = calculateEndDate(medQuantity);

    // Schedule a notification for the end date
    const timeUntilEnd = endDate - new Date();
    if (timeUntilEnd > 0) {
        setTimeout(() => {
            addNotification(`Your stock of <strong>${medName}</strong> is expected to run out soon. Please refill.`, "low-stock");
        }, timeUntilEnd);
    }
}

// Track notifications for missed doses
const missedDoseNotifications = {};

// Check for reminders and missed doses every minute
setInterval(checkMedications, 60000); // 60000ms = 1 minute

// Load medications from local storage when the page loads
document.addEventListener("DOMContentLoaded", function () {
    const medications = loadMedicationsFromLocalStorage();
    medications.forEach(med => {
        addMedicationCard(med);
        scheduleLowStockNotification(med.medName, med.medQuantity); // Schedule low stock notification
    });

    // Add Medication Form Submission
    const medForm = document.getElementById("medication-form");
    medForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const medName = document.getElementById("med-name").value;
        const medTime = document.getElementById("med-time").value;
        const medQuantity = document.getElementById("med-quantity").value;
        const phoneNumber = "+19106346492"; // Replace with dynamic user phone number
        const caregiverNumber = "CAREGIVER_MOBILE_NUMBER"; // Replace with dynamic caregiver phone number

        // Send to Backend for SMS Scheduling
        fetch("http://localhost:5000/add-medication", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ medName, medTime, medQuantity, phoneNumber, caregiverNumber }),
        })
            .then(response => response.json())
            .then(data => alert(data.message))
            .catch(error => console.error("Error:", error));

        // Add medication to local storage and UI
        const medication = { medName, medTime, medQuantity, phoneNumber, caregiverNumber };
        const medications = loadMedicationsFromLocalStorage();
        medications.push(medication);
        saveMedicationsToLocalStorage(medications);
        addMedicationCard(medication);
        scheduleLowStockNotification(medName, medQuantity); // Schedule low stock notification
        medForm.reset();
    });

    // Sidebar Tab Switching
    const menuItems = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");

    menuItems.forEach(item => {
        item.addEventListener("click", function () {
            menuItems.forEach(i => i.classList.remove("active"));
            tabContents.forEach(content => content.classList.remove("active"));

            this.classList.add("active");
            const selectedTab = this.getAttribute("data-tab");
            document.getElementById(selectedTab).classList.add("active");
        });
    });

    // Reset badge count when Notifications tab is clicked
    const notificationsTab = document.querySelector('.tab-btn[data-tab="notifications"]');
    if (notificationsTab) {
        notificationsTab.addEventListener("click", function () {
            const badge = document.querySelector(".badge");
            if (badge) {
                badge.textContent = "0"; // Reset badge count to 0
            }
        });
    }

    // --- Chart.js Dashboard Logic ---
    function renderDashboardCharts() {
        // Example: Medication Adherence Chart
        const adherenceCtx = document.getElementById('adherenceChart').getContext('2d');
        new Chart(adherenceCtx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Adherence Rate',
                    data: [85, 90, 88, 92, 87, 95, 89],
                    borderColor: '#2563EB',
                    tension: 0.4,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { callback: v => v + '%' }
                    }
                }
            }
        });

        // Medication Stock Status Chart
        const stockCtx = document.getElementById('stockChart').getContext('2d');
        new Chart(stockCtx, {
            type: 'doughnut',
            data: {
                labels: ['In Stock', 'Low Stock'],
                datasets: [{
                    data: [75, 25],
                    backgroundColor: ['#4CAF50', '#FFA726']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } }
            }
        });

        // Weekly Progress Chart
        const weeklyCtx = document.getElementById('weeklyProgressChart').getContext('2d');
        new Chart(weeklyCtx, {
            type: 'bar',
            data: {
                labels: ['Morning', 'Afternoon', 'Evening', 'Night'],
                datasets: [{
                    label: 'Medications Due',
                    data: [2, 1, 3, 1],
                    backgroundColor: '#2563EB'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });

        // Medication Distribution Chart
        const distributionCtx = document.getElementById('distributionChart').getContext('2d');
        new Chart(distributionCtx, {
            type: 'pie',
            data: {
                labels: ['Tablets', 'Capsules', 'Liquid', 'Other'],
                datasets: [{
                    data: [45, 30, 15, 10],
                    backgroundColor: ['#FFA726', '#66BB6A', '#42A5F5', '#7E57C2']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }

    // Render dashboard charts
    renderDashboardCharts();

    // --- OCR Medication Add Logic ---
    const ocrForm = document.getElementById("ocr-form");
    if (ocrForm) {
        ocrForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const fileInput = document.getElementById('medicationImage');
            const schedule = document.getElementById('schedule').value;
            const dosage = document.getElementById('dosage').value;
            // For demo: just use file name as medName
            const medName = fileInput.files[0] ? fileInput.files[0].name.replace(/\.[^/.]+$/, "") : "Unknown";
            const medQuantity = dosage; // For demo, treat dosage as quantity

            // Save to local storage (simulate OCR add)
            const medications = loadMedicationsFromLocalStorage();
            medications.push({ medName, medTime: schedule, medQuantity });
            saveMedicationsToLocalStorage(medications);

            // Update UI
            addMedicationCard({ medName, medTime: schedule, medQuantity });
            alert("Medication added via OCR!");
            ocrForm.reset();
            const preview = document.getElementById('imagePreview');
            if (preview) preview.style.display = 'none';
        });

        // Image preview for OCR
        const imageInput = document.getElementById('medicationImage');
        if (imageInput) {
            imageInput.addEventListener('change', function (event) {
                const preview = document.getElementById('imagePreview');
                const file = event.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        preview.src = e.target.result;
                        preview.style.display = 'block';
                    }
                    reader.readAsDataURL(file);
                }
            });
        }
    }
});

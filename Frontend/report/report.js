// Global variables
let capturedPhotos = [];
let cameraStream = null;
let isSubmitting = false;

// Helper functions
function setMaxDate(dateInput) {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  dateInput.max = `${year}-${month}-${day}`;
}

function setMaxTime(timeInput) {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  timeInput.max = `${hours}:${minutes}`;
}

function updateTimeMaxValue() {
  const timeInput = document.getElementById("time");
  const dateInput = document.getElementById("date");
  
  if (timeInput && dateInput) {
    const selectedDate = new Date(dateInput.value);
    const today = new Date();
    
    // If selected date is today, set max time to current time
    if (selectedDate.toDateString() === today.toDateString()) {
      setMaxTime(timeInput);
    } else {
      // If selected date is in the past, allow any time
      timeInput.max = "";
    }
  }
}

async function detectStateFromGeolocation() {
  const locationInput = document.getElementById("location");
  const stateSelect = document.getElementById("state");

  return new Promise((resolve) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();

            if (data.address) {
              if (data.display_name) {
                locationInput.value = data.display_name.split(",")[0];
              }
              if (data.address.state) {
                const stateOption = Array.from(stateSelect.options).find(
                  (opt) =>
                    opt.text
                      .toLowerCase()
                      .includes(data.address.state.toLowerCase()) ||
                    opt.value.toLowerCase() === data.address.state.toLowerCase()
                );
                if (stateOption) stateOption.selected = true;
              }
            }
            resolve(true);
          } catch (error) {
            console.error("Geocoding error:", error);
            resolve(false);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          resolve(false);
        }
      );
    } else {
      resolve(false);
    }
  });
}

function openCameraModal() {
  const fileInput = document.getElementById("evidence");
  const totalFiles = fileInput.files.length + capturedPhotos.length;
  if (totalFiles >= 5) {
    alert("Maximum 5 files allowed. Please delete some before adding more.");
    return;
  }

  const modalHTML = `
        <div class="camera-modal">
            <div class="camera-container">
                <video id="camera-view" autoplay playsinline></video>
                <div class="camera-controls">
                    <button id="capture-btn" class="btn-primary"><i data-lucide="camera"></i> Capture</button>
                    <button id="close-camera" class="btn-secondary"><i data-lucide="x"></i> Close</button>
                </div>
                ${
                  capturedPhotos.length > 0
                    ? `
                <div class="camera-gallery">
                    ${capturedPhotos
                      .map(
                        (photo, index) => `
                        <img src="${photo}" class="camera-thumbnail ${
                          index === capturedPhotos.length - 1 ? "active" : ""
                        }" 
                             data-index="${index}" alt="Captured photo ${
                          index + 1
                        }">
                    `
                      )
                      .join("")}
                </div>
                `
                    : ""
                }
            </div>
        </div>
    `;

  document.body.insertAdjacentHTML("beforeend", modalHTML);
  lucide.createIcons();

  startCamera();

  document
    .getElementById("capture-btn")
    .addEventListener("click", capturePhoto);
  document
    .getElementById("close-camera")
    .addEventListener("click", closeCameraModal);

  if (capturedPhotos.length > 0) {
    document.querySelectorAll(".camera-thumbnail").forEach((thumb) => {
      thumb.addEventListener("click", function () {
        document
          .querySelectorAll(".camera-thumbnail")
          .forEach((t) => t.classList.remove("active"));
        this.classList.add("active");
      });
    });
  }
}

async function startCamera() {
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false,
    });
    const cameraView = document.getElementById("camera-view");
    cameraView.srcObject = cameraStream;
  } catch (err) {
    console.error("Camera error:", err);
    alert("Could not access camera. Please check permissions.");
    closeCameraModal();
  }
}

function capturePhoto() {
  const cameraView = document.getElementById("camera-view");
  const canvas = document.createElement("canvas");
  canvas.width = cameraView.videoWidth;
  canvas.height = cameraView.videoHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(cameraView, 0, 0, canvas.width, canvas.height);

  capturedPhotos.push(canvas.toDataURL("image/jpeg", 0.8));
  updateCameraGallery();
}

function updateCameraGallery() {
  const gallery = document.querySelector(".camera-gallery");
  if (!gallery) return;

  gallery.innerHTML = capturedPhotos
    .map(
      (photo, index) => `
        <img src="${photo}" class="camera-thumbnail ${
        index === capturedPhotos.length - 1 ? "active" : ""
      }" 
             data-index="${index}" alt="Captured photo ${index + 1}">
    `
    )
    .join("");

  document.querySelectorAll(".camera-thumbnail").forEach((thumb) => {
    thumb.addEventListener("click", function () {
      document
        .querySelectorAll(".camera-thumbnail")
        .forEach((t) => t.classList.remove("active"));
      this.classList.add("active");
    });
  });
}

function closeCameraModal() {
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
  }

  const modal = document.querySelector(".camera-modal");
  if (modal) modal.remove();

  const hiddenInput = document.getElementById("camera-images");
  if (hiddenInput) {
    hiddenInput.value = JSON.stringify(capturedPhotos);
  }
}

function setupFormNavigation() {
  document.addEventListener("click", function (e) {
    // Handle next buttons
    if (e.target.closest(".btn-next")) {
      const btn = e.target.closest(".btn-next");
      const currentSection = btn.dataset.current;
      const nextSection = btn.dataset.next;

      if (validateSection(currentSection)) {
        switchSection(currentSection, nextSection);

        // If going to review section, populate the review fields
        if (nextSection === "section-review") {
          populateReviewFields();
        }
      }
    }

    // Handle previous buttons
    if (e.target.closest(".btn-prev")) {
      const btn = e.target.closest(".btn-prev");
      const currentSection = btn.dataset.current;
      const prevSection = btn.dataset.prev;

      switchSection(currentSection, prevSection);
    }
  });
}

function validateSection(sectionId) {
  const section = document.getElementById(sectionId);
  const requiredFields = section.querySelectorAll("[required]");
  let isValid = true;

  // Clear previous errors
  document.querySelectorAll(".error-message").forEach((msg) => msg.remove());

  requiredFields.forEach((field) => {
    field.classList.remove("error");

    // Check if field is empty
    if (!field.value.trim()) {
      markFieldAsInvalid(field, "This field is required");
      isValid = false;
      return;
    }

    // Field-specific validations
    switch (field.id) {
      case "name":
        if (!/^[A-Za-z\s]{3,50}$/.test(field.value)) {
          markFieldAsInvalid(
            field,
            "Please enter a valid name (letters only, 3-50 characters)"
          );
          isValid = false;
        }
        break;

      case "email":
        if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(field.value)) {
          markFieldAsInvalid(field, "Please enter a valid email address");
          isValid = false;
        }
        break;

      case "phone":
        if (!/^[0-9]{10}$/.test(field.value)) {
          markFieldAsInvalid(field, "Please enter a 10-digit phone number");
          isValid = false;
        }
        break;

      case "date":
        const selectedDate = new Date(field.value);
        const today = new Date();

        // Reset both to midnight for fair comparison
        selectedDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        if (selectedDate > today) {
          markFieldAsInvalid(field, "Date cannot be in the future");
          isValid = false;
        }
        break;

      case "time":
        const timeInput = field;
        const dateInput = document.getElementById("date");
        
        if (dateInput && dateInput.value) {
          const selectedDate = new Date(dateInput.value);
          const selectedTime = timeInput.value;
          
          // Create a combined date-time object
          const [hours, minutes] = selectedTime.split(':');
          const combinedDateTime = new Date(selectedDate);
          combinedDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          
          const now = new Date();
          
          // If the selected date is today, check if time is in the future
          const isToday = selectedDate.toDateString() === now.toDateString();
          
          if (isToday && combinedDateTime > now) {
            markFieldAsInvalid(field, "Time cannot be in the future");
            isValid = false;
          }
        }
        break;

      case "description":
        if (field.value.length < 20) {
          markFieldAsInvalid(
            field,
            "Description must be at least 20 characters"
          );
          isValid = false;
        }
        break;
    }
  });

  if (!isValid) {
    // Scroll to first error
    const firstError = section.querySelector(".error");
    if (firstError) {
      firstError.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  return isValid;
}

function markFieldAsInvalid(field, message) {
  field.classList.add("error");
  const errorMsg = document.createElement("div");
  errorMsg.className = "error-message";
  errorMsg.textContent = message;
  field.parentNode.insertBefore(errorMsg, field.nextSibling);
}

function switchSection(currentId, nextId) {
  document.getElementById(currentId).classList.remove("active");
  document.getElementById(nextId).classList.add("active");
  updateProgressSteps(nextId);
  document
    .getElementById(nextId)
    .scrollIntoView({ behavior: "smooth", block: "start" });
}

function updateProgressSteps(activeSection) {
  const steps = document.querySelectorAll(".step");
  steps.forEach((step) => step.classList.remove("active"));

  switch (activeSection) {
    case "section-personal":
      document.querySelector('.step[data-step="1"]').classList.add("active");
      break;
    case "section-crime":
      document.querySelector('.step[data-step="1"]').classList.add("active");
      document.querySelector('.step[data-step="2"]').classList.add("active");
      break;
    case "section-review":
      steps.forEach((step) => step.classList.add("active"));
      break;
  }
}

function setupFileUpload() {
  const fileInput = document.getElementById("evidence");
  const filePreview = document.getElementById("file-preview");

  fileInput.addEventListener("change", function () {
    filePreview.innerHTML = "";

    if (this.files.length > 5) {
      alert("Maximum 5 files allowed. Only the first 5 will be uploaded.");
      this.value = "";
      return;
    }

    Array.from(this.files).forEach((file) => {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(
          `File "${file.name}" exceeds 10MB limit. Please choose smaller files.`
        );
        this.value = "";
        return;
      }

      // Check file type
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowedTypes.includes(file.type)) {
        alert(
          `File "${file.name}" has invalid type. Only images, PDFs and Word docs are allowed.`
        );
        this.value = "";
        return;
      }

      const fileItem = document.createElement("div");
      fileItem.className = "file-preview-item";

      const fileName = document.createElement("span");
      fileName.textContent = file.name;

      const fileSize = document.createElement("span");
      fileSize.textContent = `(${(file.size / 1024 / 1024).toFixed(2)}MB)`;

      const removeBtn = document.createElement("button");
      removeBtn.innerHTML = '<i data-lucide="x"></i>';
      removeBtn.className = "remove-file";
      removeBtn.onclick = () => removeFile(file.name);

      fileItem.appendChild(fileName);
      fileItem.appendChild(fileSize);
      fileItem.appendChild(removeBtn);
      filePreview.appendChild(fileItem);
    });

    if (window.lucide) {
      lucide.createIcons();
    }
  });
}

function removeFile(fileName) {
  const dt = new DataTransfer();
  const files = document.getElementById("evidence").files;

  for (let i = 0; i < files.length; i++) {
    if (files[i].name !== fileName) {
      dt.items.add(files[i]);
    }
  }

  document.getElementById("evidence").files = dt.files;
  document.getElementById("evidence").dispatchEvent(new Event("change"));
}

function setupGeolocation() {
  document.getElementById("getLocation").addEventListener("click", function () {
    const locationInput = document.getElementById("location");
    locationInput.placeholder = "Locating...";

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          locationInput.value = `Lat: ${latitude.toFixed(
            6
          )}, Long: ${longitude.toFixed(6)}`;
          locationInput.placeholder = "Address or landmark";
        },
        (error) => {
          console.error("Error getting location:", error);
          locationInput.placeholder = "Address or landmark";
          alert("Unable to retrieve your location. Please enter it manually.");
        }
      );
    } else {
      alert(
        "Geolocation is not supported by your browser. Please enter the location manually."
      );
    }
  });
}

function populateReviewFields() {
  document.getElementById("review-name").textContent = `Name: ${
    document.getElementById("name").value
  }`;
  document.getElementById("review-email").textContent = `Email: ${
    document.getElementById("email").value
  }`;
  document.getElementById("review-phone").textContent = `Phone: ${
    document.getElementById("phone").value
  }`;

  const crimeTypeSelect = document.getElementById("crimeType");
  document.getElementById("review-crimeType").textContent = `Crime Type: ${
    crimeTypeSelect.options[crimeTypeSelect.selectedIndex].text
  }`;

  document.getElementById("review-date").textContent = `Date: ${formatDate(
    document.getElementById("date").value
  )}`;
  document.getElementById("review-location").textContent = `Location: ${
    document.getElementById("location").value
  }`;
  document.getElementById("review-description").textContent = `Description: ${
    document.getElementById("description").value
  }`;

  const fileInput = document.getElementById("evidence");
  if (fileInput.files.length > 0) {
    document.getElementById(
      "review-evidence"
    ).textContent = `Files Attached: ${fileInput.files.length}`;
  } else {
    document.getElementById("review-evidence").textContent =
      "No files attached";
  }
}

function formatDate(dateString) {
  if (!dateString) return "Not specified";
  const options = { year: "numeric", month: "long", day: "numeric" };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

function setupFormSubmission() {
  const crimeForm = document.getElementById("crimeForm");

  crimeForm.addEventListener("submit", async function (e) {
    e.preventDefault(); // Crucial to prevent default form submission
    if (isSubmitting) return;
    isSubmitting = true;

    // Show loading state
    const submitButton = this.querySelector(".btn-submit");
    const originalButtonText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML =
      '<i data-lucide="loader" class="animate-spin"></i> Submitting...';
    lucide.createIcons();

    try {
      // Prepare form data
      const formData = new FormData(this);

      // Add captured photos
      capturedPhotos.forEach((photo, index) => {
        const blob = dataURLtoBlob(photo);
        formData.append(`photo_${index}`, blob, `evidence_${index}.jpg`);
      });

      // Submit to server
      const response = await fetch(
        "http://localhost:5000/api/reports/submit-report",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || `Server error: ${response.status}`);
      }

      const data = await response.json();

      // Show confirmation modal
      showConfirmationModal(data.reportId);

      // Store submission in session storage
      sessionStorage.setItem(
        "lastSubmission",
        JSON.stringify({
          id: data.reportId,
          time: new Date().toISOString(),
        })
      );
    } catch (error) {
      console.error("Submission failed:", error);
      alert(`Error: ${error.message}`);
    } finally {
      // Reset button state
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonText;
      lucide.createIcons();
      isSubmitting = false;
    }
  });
}

function checkPreviousSubmission() {
  const crimeForm = document.getElementById("crimeForm");
  const confirmationModal = document.getElementById("confirmation-modal");

  if (!crimeForm || !confirmationModal) return;

  const lastSubmission = sessionStorage.getItem("lastSubmission");
  if (lastSubmission) {
    const data = JSON.parse(lastSubmission);
    crimeForm.classList.add("hidden");
    confirmationModal.classList.remove("hidden");
    confirmationModal.classList.add("active");
    document.getElementById("reportId").textContent = data.id;
  }
}

document.addEventListener("DOMContentLoaded", function () {
  // Initialize icons
  if (window.lucide) lucide.createIcons();

  // Check for previous submission
  checkPreviousSubmission();

  // Setup date picker
  const dateInput = document.getElementById("date");
  if (dateInput) {
    setMaxDate(dateInput);
    
    // Add event listener to update time max value when date changes
    dateInput.addEventListener("change", updateTimeMaxValue);
  }

  // Setup time picker
  const timeInput = document.getElementById("time");
  if (timeInput) {
    // Set initial max time if date is today
    updateTimeMaxValue();
    
    // Add event listener for real-time validation
    timeInput.addEventListener("change", function() {
      const dateInput = document.getElementById("date");
      if (dateInput && dateInput.value) {
        const selectedDate = new Date(dateInput.value);
        const selectedTime = this.value;
        
        // Create a combined date-time object
        const [hours, minutes] = selectedTime.split(':');
        const combinedDateTime = new Date(selectedDate);
        combinedDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        const now = new Date();
        
        // If the selected date is today, check if time is in the future
        const isToday = selectedDate.toDateString() === now.toDateString();
        
        // Clear previous error
        this.classList.remove("error");
        const existingError = this.parentNode.querySelector(".error-message");
        if (existingError) existingError.remove();
        
        if (isToday && combinedDateTime > now) {
          markFieldAsInvalid(this, "Time cannot be in the future");
        }
      }
    });
  }

  // Initialize all handlers
  setupFormNavigation();
  setupFileUpload();
  setupGeolocation();
  setupFormSubmission();
  setupModalActions(); // Add this line

  // Setup camera if needed
  document
    .getElementById("openCamera")
    ?.addEventListener("click", openCameraModal);
});

function setupModalActions() {
  // Print Report button
  document.getElementById("printReport")?.addEventListener("click", () => {
    window.print();
  });

  // New Report button
  document.getElementById("newReport")?.addEventListener("click", () => {
    resetForm();
  });

  // Go to Dashboard button
  document.getElementById("goDashboard")?.addEventListener("click", () => {
    window.location.href = "/Frontend/landing/index.html";
  });

  // Camera button (if you have one)
  document
    .getElementById("openCamera")
    ?.addEventListener("click", openCameraModal);

  // Close modal when clicking on background
  const modal = document.getElementById("confirmation-modal");
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) {
      resetForm();
    }
  });
}
function showConfirmationModal(reportId) {
  // Hide form
  document.getElementById("crimeForm").classList.add("hidden");

  // Show modal and set report ID
  const modal = document.getElementById("confirmation-modal");
  document.getElementById("reportId").textContent = reportId;
  modal.classList.remove("hidden");
  modal.classList.add("active");
}

function resetForm() {
  // Hide modal
  document.getElementById("confirmation-modal").classList.remove("active");
  document.getElementById("confirmation-modal").classList.add("hidden");

  // Reset form
  document.getElementById("crimeForm").reset();
  document.getElementById("crimeForm").classList.remove("hidden");

  // Reset form state
  document.getElementById("section-review").classList.remove("active");
  document.getElementById("section-personal").classList.add("active");
  updateProgressSteps("section-personal");

  // Clear file previews
  document.getElementById("file-preview").innerHTML = "";
  capturedPhotos = [];

  // Reset file input
  document.getElementById("evidence").value = "";
}
function dataURLtoBlob(dataURL) {
  const arr = dataURL.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new Blob([u8arr], { type: mime });
}

// Add animation class to Lucide loader
document.head.insertAdjacentHTML(
  "beforeend",
  `
    <style>
        .animate-spin {
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    </style>
`
);

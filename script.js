// =====================================================
// CANDIDATE FORM SUBMISSION
// =====================================================

const candidateForm = document.getElementById("candidateForm");

if (candidateForm) {
    candidateForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const fileInput = document.getElementById("resume");
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const maxSizeBytes = 10 * 1024 * 1024; // 10 MB limit
            const allowedExtensions = ["pdf", "doc", "docx"];
            const fileExt = file.name.split(".").pop().toLowerCase();

            if (!allowedExtensions.includes(fileExt)) {
                alert("Please upload a valid resume file (.pdf, .doc, or .docx).");
                return;
            }

            if (file.size > maxSizeBytes) {
                alert("File size exceeds 10 MB limit. Please upload a smaller file.");
                return;
            }
        } else {
            alert("Please select and attach your Resume file (.pdf, .doc, or .docx).");
            return;
        }

        const submitButton = candidateForm.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;

        submitButton.disabled = true;
        submitButton.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Submitting & Sending Email...`;

        const formData = new FormData(candidateForm);

        // Try Vercel Serverless API first, fallback to PHP handler if 404
        fetch("api/submit-candidate", {
            method: "POST",
            body: formData
        })
        .then(function (response) {
            if (response.status === 404) {
                // Fallback to PHP on Localhost/Laragon
                return fetch("submit-candidate.php", {
                    method: "POST",
                    body: formData
                }).then(res => res.json());
            }
            return response.json();
        })
        .then(function (data) {
            if (data && (data.status === "success" || data.success)) {
                alert("Thank you! Your resume and details have been submitted successfully and delivered to Gmail inbox.");
                candidateForm.reset();
            } else {
                alert((data && data.message) || "Failed to submit. Please try again.");
            }
        })
        .catch(function (error) {
            console.error("Candidate form submission error:", error);
            alert("Something went wrong while submitting. Please check your connection or try again.");
        })
        .finally(function () {
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
        });
    });
}


// =====================================================
// EMPLOYER FORM SUBMISSION
// =====================================================

const employerForm = document.getElementById("employerForm");

if (employerForm) {
    employerForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const submitButton = employerForm.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;

        submitButton.disabled = true;
        submitButton.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Sending Enquiry...`;

        const formData = new FormData(employerForm);

        // Try Vercel Serverless API first, fallback to PHP handler if 404
        fetch("api/submit-employer", {
            method: "POST",
            body: formData
        })
        .then(function (response) {
            if (response.status === 404) {
                // Fallback to PHP on Localhost/Laragon
                return fetch("submit-employer.php", {
                    method: "POST",
                    body: formData
                }).then(res => res.json());
            }
            return response.json();
        })
        .then(function (data) {
            if (data && (data.status === "success" || data.success)) {
                alert("Thank you! Your enquiry has been submitted successfully and delivered to Gmail inbox.");
                employerForm.reset();
            } else {
                alert((data && data.message) || "Failed to submit enquiry. Please try again.");
            }
        })
        .catch(function (error) {
            console.error("Employer form submission error:", error);
            alert("Something went wrong while submitting your enquiry.");
        })
        .finally(function () {
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
        });
    });
}


// =====================================================
// MOBILE MENU TOGGLE
// =====================================================

const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
const navbar = document.querySelector(".navbar");

if (mobileMenuBtn && navbar) {
    mobileMenuBtn.addEventListener("click", function () {
        navbar.classList.toggle("active");
    });

    document.querySelectorAll(".nav-link").forEach(function (link) {
        link.addEventListener("click", function () {
            navbar.classList.remove("active");
        });
    });
}


// =====================================================
// ACTIVE NAVIGATION LINK ON SCROLL
// =====================================================

const navLinks = document.querySelectorAll(".nav-link");

window.addEventListener("scroll", function () {
    let currentSection = "";

    document.querySelectorAll("section[id]").forEach(function (section) {
        const sectionTop = section.offsetTop - 150;
        if (window.scrollY >= sectionTop) {
            currentSection = section.getAttribute("id");
        }
    });

    navLinks.forEach(function (link) {
        link.classList.remove("active");
        if (link.getAttribute("href") === "#" + currentSection) {
            link.classList.add("active");
        }
    });
});


// =====================================================
// CURRENT COPYRIGHT YEAR
// =====================================================

const yearElement = document.querySelector(".current-year");

if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}
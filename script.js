// script.js

let start, end, industry, month, prefix;
let currentPage = 1;
const itemsPerPage = 5;
const step = 2000;
let totalPages = 0;
let copiedButtonsByPage = {}; // Track copied buttons per page

const COOKIE_NAME = 'c2cProgress'; // Name of the cookie to store progress
const COOKIE_EXPIRY_DAYS = 7; // Cookie expiry duration

// Utility functions to manage cookies
function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

function getCookie(name) {
    return document.cookie.split('; ').reduce((r, v) => {
        const parts = v.split('=');
        return parts[0] === name ? decodeURIComponent(parts[1]) : r;
    }, '');
}

function eraseCookie(name) {
    setCookie(name, '', -1);
}

// Function to save current progress to cookies
function saveProgress() {
    const data = {
        industry,
        month,
        start,
        end,
        currentPage,
        copiedButtonsByPage: Object.fromEntries(
            Object.entries(copiedButtonsByPage).map(
                ([page, identifiers]) => [page, Array.from(identifiers)]
            )
        )
    };
    setCookie(COOKIE_NAME, JSON.stringify(data), COOKIE_EXPIRY_DAYS);
}

// Function to load progress from cookies
function loadProgress() {
    const cookie = getCookie(COOKIE_NAME);
    if (cookie) {
        try {
            return JSON.parse(cookie);
        } catch (e) {
            console.error('Error parsing cookie data:', e);
            return null;
        }
    }
    return null;
}

// Function to clear progress cookies
function clearProgress() {
    eraseCookie(COOKIE_NAME);
}

// Function to prompt the user to continue with saved progress
function promptLoadProgress() {
    const savedData = loadProgress();
    if (savedData) {
        const useSaved = confirm('You have previous progress. Would you like to continue from where you left off?');
        if (useSaved) {
            restoreProgress(savedData);
        } else {
            clearProgress();
        }
    }
}

// Function to restore progress from saved data
function restoreProgress(savedData) {
    industry = savedData.industry;
    month = savedData.month;
    start = savedData.start;
    end = savedData.end;
    currentPage = savedData.currentPage;
    copiedButtonsByPage = {};

    // Convert arrays back to Sets
    for (const [page, identifiers] of Object.entries(savedData.copiedButtonsByPage)) {
        copiedButtonsByPage[page] = new Set(identifiers);
    }

    prefix = `${industry}_${month}_`;

    // Populate form fields with saved values
    document.getElementById('industry').value = industry;
    document.getElementById('month').value = month;
    document.getElementById('start').value = start;
    document.getElementById('end').value = end;

    // Calculate total pages
    totalPages = Math.ceil((end - start + 1) / (itemsPerPage * step));

    // Hide landing page and show the main application
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';

    // Generate content based on saved progress
    generateNumbersAndFilenames(currentPage);
    updatePaginationButtons();
}

// Handle form submission
document.getElementById('inputForm').addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent form submission

    // Get values from the form
    industry = document.getElementById('industry').value;
    month = document.getElementById('month').value;
    prefix = `${industry}_${month}_`; // For example, 'Retail_NOV_'
    start = parseInt(document.getElementById('start').value, 10);
    end = parseInt(document.getElementById('end').value, 10);

    // Validation
    if (isNaN(start) || isNaN(end)) {
        alert("Please enter valid numeric values for Start and End.");
        return;
    }

    if (start >= end) {
        alert("The start value must be less than the end value. Please enter a valid value.");
        return; // Stop the submission process
    }

    if (start % 10 !== 1) {
        alert("The start value must end in a 1 (e.g., 1, 2001, 5001). Please enter a valid value.");
        return; // Stop the submission process
    }

    // Calculate total pages
    totalPages = Math.ceil((end - start + 1) / (itemsPerPage * step));

    // Hide landing page and show the main application
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';

    // Initialize pagination and content
    generateNumbersAndFilenames(currentPage);
    updatePaginationButtons();

    // Save progress
    saveProgress();
});

// Function to update progress bar
function updateProgressBar() {
    if (totalPages <= 1) {
        document.getElementById('progressFill').style.width = "100%";
        document.getElementById('progressPercent').textContent = `100%`;
        return;
    }

    const progressPercent = ((currentPage - 1) / (totalPages - 1)) * 100;
    document.getElementById('progressFill').style.width = `${progressPercent}%`;
    document.getElementById('progressPercent').textContent = ` ${Math.round(progressPercent)}%`;
}

// Function to copy text to clipboard
function copyToClipboard(text, button, identifier) {
    if (button.disabled) {
        return; // Prevent further action if the button is already disabled
    }

    // Use the modern Clipboard API if available
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            markButtonAsCopied(button, identifier);
        }).catch(err => {
            console.error('Failed to copy:', err);
            fallbackCopyTextToClipboard(text, button, identifier);
        });
    } else {
        // Fallback method for older browsers
        fallbackCopyTextToClipboard(text, button, identifier);
    }
}

// Fallback method for copying text
function fallbackCopyTextToClipboard(text, button, identifier) {
    const tempInput = document.createElement('input');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
        document.execCommand('copy');
        markButtonAsCopied(button, identifier);
    } catch (err) {
        console.error('Fallback: Unable to copy', err);
        alert('Failed to copy text. Please try manually.');
    }
    document.body.removeChild(tempInput);
}

// Function to handle marking a button as copied
function markButtonAsCopied(button, identifier) {
    // Mark the button as copied
    button.classList.add('copied');
    button.disabled = true;

    // Add the identifier to the copied set for the current page
    if (!copiedButtonsByPage[currentPage]) {
        copiedButtonsByPage[currentPage] = new Set();
    }
    copiedButtonsByPage[currentPage].add(identifier);

    // Save progress after copying
    saveProgress();

    // Create the "Copied!" message
    const copiedMessage = document.createElement('div');
    copiedMessage.textContent = "Copied!";
    copiedMessage.style.position = 'absolute';
    copiedMessage.style.backgroundColor = '#4CAF50';
    copiedMessage.style.color = 'white';
    copiedMessage.style.padding = '5px 10px';
    copiedMessage.style.borderRadius = '5px';
    copiedMessage.style.fontSize = '12px';
    copiedMessage.style.top = '-25px'; // Position above the button
    copiedMessage.style.left = '50%';
    copiedMessage.style.transform = 'translateX(-50%)';
    copiedMessage.style.zIndex = '10';

    // Append message above the button
    button.parentNode.style.position = 'relative'; // Ensure parent is positioned
    button.parentNode.appendChild(copiedMessage);

    // Remove the "Copied!" message after a delay
    setTimeout(() => {
        copiedMessage.remove();
    }, 1000);
}

// Function to generate numbers and filenames
function generateNumbersAndFilenames(page) {
    const outputDiv = document.getElementById('output');
    outputDiv.innerHTML = ""; // Clear previous content

    const startIndex = start + (page - 1) * itemsPerPage * step;
    const endIndex = Math.min(startIndex + itemsPerPage * step, end);

    // Create the reset button for the page
    const resetButton = document.createElement('button');
    resetButton.textContent = 'Reset';
    resetButton.classList.add('reset-button');
    resetButton.onclick = () => resetPageButtons(page);

    // Add the reset button at the top
    outputDiv.appendChild(resetButton);
    outputDiv.appendChild(document.createElement('br'));

    for (let i = startIndex; i < endIndex; i += step) {
        const first = i;
        const second = Math.min(i + step - 1, end); // Ensure second does not exceed end

        // Create buttons for numbers
        let firstButton = document.createElement('button');
        firstButton.innerHTML = first;
        firstButton.classList.add('copy-button');
        firstButton.onclick = () => copyToClipboard(first, firstButton, `first-${first}`);

        let secondButton = document.createElement('button');
        secondButton.innerHTML = second;
        secondButton.classList.add('copy-button');
        secondButton.onclick = () => copyToClipboard(second, secondButton, `second-${second}`);

        // Create a button for filename
        let filename = `${prefix}${first}_${second}`;
        let filenameButton = document.createElement('button');
        filenameButton.innerHTML = filename;
        filenameButton.classList.add('copy-button');
        filenameButton.onclick = () => copyToClipboard(filename, filenameButton, `filename-${filename}`);

        // Check if buttons were previously copied
        if (copiedButtonsByPage[currentPage] && copiedButtonsByPage[currentPage].has(`first-${first}`)) {
            firstButton.classList.add('copied');
            firstButton.disabled = true;
        }
        if (copiedButtonsByPage[currentPage] && copiedButtonsByPage[currentPage].has(`second-${second}`)) {
            secondButton.classList.add('copied');
            secondButton.disabled = true;
        }
        if (copiedButtonsByPage[currentPage] && copiedButtonsByPage[currentPage].has(`filename-${filename}`)) {
            filenameButton.classList.add('copied');
            filenameButton.disabled = true;
        }

        // Append buttons to the page
        // Wrap buttons in a container for better styling and positioning
        const buttonContainer = document.createElement('div');
        buttonContainer.style.marginBottom = '10px';
        buttonContainer.style.position = 'relative'; // For positioning the "Copied!" message

        buttonContainer.appendChild(firstButton);
        buttonContainer.appendChild(document.createElement('span')); // Spacer
        buttonContainer.appendChild(secondButton);
        buttonContainer.appendChild(document.createElement('span')); // Spacer
        buttonContainer.appendChild(filenameButton);

        outputDiv.appendChild(buttonContainer);
    }

    document.getElementById('pageNumber').innerText = `Page ${page}`;
    updateProgressBar(); // Update the progress bar whenever the page changes
}

// Function to update pagination buttons
function updatePaginationButtons() {
    const backButton = document.getElementById('backButton');
    const nextButton = document.getElementById('nextButton');
    backButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage === totalPages;
}

// Event listeners for pagination
document.getElementById('backButton').onclick = () => {
    if (currentPage > 1) {
        currentPage--;
        generateNumbersAndFilenames(currentPage);
        updatePaginationButtons();
        saveProgress(); // Save progress after changing page
    }
};

document.getElementById('nextButton').onclick = () => {
    if (currentPage < totalPages) {
        currentPage++;
        generateNumbersAndFilenames(currentPage);
        updatePaginationButtons();
        saveProgress(); // Save progress after changing page
    }
};

// Function to reset copied buttons on the current page
function resetPageButtons(page) {
    // Remove the copied class and re-enable all buttons on the current page
    const outputDiv = document.getElementById('output');
    const buttons = outputDiv.getElementsByClassName('copy-button');
    for (let button of buttons) {
        button.classList.remove('copied');
        button.disabled = false;
    }

    // Clear the copied set for the current page
    copiedButtonsByPage[page] = new Set();

    // Re-render the page buttons
    generateNumbersAndFilenames(page);

    // Save progress after resetting
    saveProgress();
}

// Event listener for the Home button
document.getElementById("homeButton").addEventListener("click", function () {
    if (confirm("Are you sure you want to go back to the home page? This will reset your current progress.")) {
        clearProgress(); // Clear the progress cookies
        location.reload(); // Reload the page to show the landing page
    }
});

// On page load, check for existing progress
window.addEventListener('DOMContentLoaded', () => {
    promptLoadProgress();
});
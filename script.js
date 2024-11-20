let start, end, industry, month;
let currentPage = 1;
let itemsPerPage = 5;
let step = 2000;
let totalPages = 0;
let copiedButtonsByPage = {}; // Track copied buttons per page

window.onload = function () {
    const savedIndustry = getCookie('industry');
    const savedMonth = getCookie('month');
    const savedStart = getCookie('start');
    const savedEnd = getCookie('end');
    const savedClickedButtons = getCookie('clickedButtons');

    if (savedIndustry && savedMonth && savedStart && savedEnd) {
        const useSaved = confirm("We found saved values. Do you want to use them?");
        if (useSaved) {
            // Load saved values
            industry = savedIndustry;
            month = savedMonth;
            start = parseInt(savedStart);
            end = parseInt(savedEnd);
            try {
                copiedButtonsByPage = savedClickedButtons ? JSON.parse(savedClickedButtons) : {};
            } catch (error) {
                copiedButtonsByPage = {};
            }
            
            // Skip the landing page
            totalPages = Math.ceil((end - start + 1) / (itemsPerPage * step));
            document.getElementById('landingPage').style.display = 'none';
            document.getElementById('mainApp').style.display = 'block';
            generateNumbersAndFilenames(currentPage);
            updatePaginationButtons();
        }
    }
};

// Handle form submission
document.getElementById('inputForm').addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent form submission

    // Get values from the form
    industry = document.getElementById('industry').value;
    month = document.getElementById('month').value;
    prefix = industry + "_" + month + "_"; // For example, 'Retail_oct_'
    start = parseInt(document.getElementById('start').value);
    end = parseInt(document.getElementById('end').value);
    if (start >= end) {
        alert("The start value must be less than the end value. Please enter a valid value.");
        return; // Stop the submission process
    }

    if (start % 10 !== 1) {
        alert("The start value must end in a 1 (e.g., 1, 2001, 5001). Please enter a valid value.");
        return; // Stop the submission process
    }
    setCookie('industry', industry, 7);
    setCookie('month', month, 7);
    setCookie('start', start, 7);
    setCookie('end', end, 7);
    setCookie('clickedButtons', JSON.stringify(copiedButtonsByPage), 7);
    // Calculate total pages
    totalPages = Math.ceil((end - start + 1) / (itemsPerPage * step));

    // Hide landing page and show the main application
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';

    // Initialize pagination and content
    generateNumbersAndFilenames(currentPage);
    updatePaginationButtons();
});

// Function to update progress bar
function updateProgressBar() {
    const progressPercent = totalPages > 1 
    ? ((currentPage - 1) / (totalPages - 1)) * 100 
    : 100;
    document.getElementById('progressFill').style.width = progressPercent + "%";
    document.getElementById('progressPercent').textContent = `    ${Math.round(progressPercent)}%`;
}

function copyToClipboard(text, button, identifier) {
    if (button.disabled) {
        return; // Prevent further action if the button is already disabled
    }
    const tempInput = document.createElement('input');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);

    // Mark the button as copied
    button.classList.add('copied');
    button.disabled = true;

    // Add the identifier to the copied set for the current page
    if (!copiedButtonsByPage[currentPage]) {
        copiedButtonsByPage[currentPage] = new Set();
    }
    copiedButtonsByPage[currentPage].add(identifier);
    setCookie('clickedButtons', JSON.stringify(copiedButtonsByPage), 7);
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
    button.parentNode.appendChild(copiedMessage);

    // Remove the "Copied!" message after a delay
    setTimeout(() => {
        copiedMessage.remove();
    }, 1000);
}

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

        // If already copied, mark buttons as red and disable only the clicked button
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
        outputDiv.appendChild(firstButton);
        outputDiv.appendChild(secondButton);
        outputDiv.appendChild(filenameButton);
        outputDiv.appendChild(document.createElement('br'));
    }

    document.getElementById('pageNumber').innerText = `Page ${page}`;
    updateProgressBar(); // Update the progress bar whenever the page changes
}

function updatePaginationButtons() {
    const backButton = document.getElementById('backButton');
    const nextButton = document.getElementById('nextButton');

    backButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage === totalPages;
}

document.getElementById('backButton').onclick = () => {
    if (currentPage > 1) {
        currentPage--;
        generateNumbersAndFilenames(currentPage);
        updatePaginationButtons();
    }
};

document.getElementById('nextButton').onclick = () => {
    if (currentPage < totalPages) {
        currentPage++;
        generateNumbersAndFilenames(currentPage);
        updatePaginationButtons();
    }
};

// Reset copied buttons and disabled state for the current page
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
}
// Home button redirects back to the landing page and resets everything
// Home button redirects back to the landing page and resets everything
document.getElementById("homeButton").addEventListener("click", function () {
    location.reload();
});
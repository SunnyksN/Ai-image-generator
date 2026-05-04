// DOM Elements
const promptInput = document.getElementById('prompt');
const styleSelect = document.getElementById('style');
const negativePromptInput = document.getElementById('negativePrompt');
const guidanceScale = document.getElementById('guidanceScale');
const guidanceValue = document.getElementById('guidanceValue');
const steps = document.getElementById('steps');
const stepsValue = document.getElementById('stepsValue');
const generateBtn = document.getElementById('generateBtn');
const infoBox = document.getElementById('infoBox');
const resultContainer = document.getElementById('resultContainer');
const generatedImage = document.getElementById('generatedImage');
const downloadBtn = document.getElementById('downloadBtn');
const loadingContainer = document.getElementById('loadingContainer');
const errorContainer = document.getElementById('errorContainer');
const historySection = document.getElementById('historySection');
const historyGrid = document.getElementById('historyGrid');

// State
let generationHistory = [];
let currentImageData = null;

// Event Listeners
generateBtn.addEventListener('click', generateImage);
downloadBtn.addEventListener('click', downloadImage);

// Update slider values in real-time
guidanceScale.addEventListener('input', (e) => {
    guidanceValue.textContent = e.target.value;
});

steps.addEventListener('input', (e) => {
    stepsValue.textContent = e.target.value;
});

// Hide info box when user starts typing
promptInput.addEventListener('input', () => {
    if (promptInput.value.trim()) {
        infoBox.style.display = 'none';
    } else {
        infoBox.style.display = 'block';
    }
});

// Generate Image Function
async function generateImage() {
    const prompt = promptInput.value.trim();

    if (!prompt) {
        showError('Please enter a prompt');
        return;
    }

    // Disable button and show loading
    generateBtn.disabled = true;
    const btnText = generateBtn.querySelector('.btn-text');
    const btnLoader = generateBtn.querySelector('.btn-loader');
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline';

    loadingContainer.style.display = 'block';
    resultContainer.style.display = 'none';
    errorContainer.style.display = 'none';
    infoBox.style.display = 'none';

    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: prompt,
                style: styleSelect.value,
                negative_prompt: negativePromptInput.value,
                guidance_scale: parseFloat(guidanceScale.value),
                num_inference_steps: parseInt(steps.value),
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to generate image');
        }

        const data = await response.json();

        // Display the generated image
        generatedImage.src = data.image;
        currentImageData = {
            image: data.image,
            prompt: prompt,
            style: styleSelect.value,
            timestamp: new Date(),
        };

        // Add to history
        generationHistory.unshift(currentImageData);
        updateHistoryDisplay();

        resultContainer.style.display = 'block';
        loadingContainer.style.display = 'none';
    } catch (error) {
        console.error('Error:', error);
        showError(error.message || 'Error generating image. Please try again.');
        loadingContainer.style.display = 'none';
    } finally {
        // Re-enable button
        generateBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
}

// Download Image Function
function downloadImage() {
    if (!currentImageData) return;

    const link = document.createElement('a');
    link.href = currentImageData.image;
    link.download = `generated_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Show Error Message
function showError(message) {
    errorContainer.innerHTML = `
        <div class="error-container">
            <strong>❌ Error:</strong> ${message}
        </div>
    `;
    errorContainer.style.display = 'block';
}

// Update History Display
function updateHistoryDisplay() {
    if (generationHistory.length === 0) {
        historySection.style.display = 'none';
        return;
    }

    historySection.style.display = 'block';

    // Show last 6 images
    const recentHistory = generationHistory.slice(0, 6);
    historyGrid.innerHTML = recentHistory
        .map((item, index) => `
            <div class="history-item" onclick="selectHistoryItem(${index})">
                <img src="${item.image}" alt="Generated image">
                <div class="history-item-info">
                    <div class="history-item-style">${item.style}</div>
                    <div class="history-item-prompt">${item.prompt}</div>
                </div>
            </div>
        `)
        .join('');
}

// Select History Item
function selectHistoryItem(index) {
    const item = generationHistory[index];
    generatedImage.src = item.image;
    currentImageData = item;
    resultContainer.style.display = 'block';
    infoBox.style.display = 'none';
    loadingContainer.style.display = 'none';

    // Scroll to result
    resultContainer.scrollIntoView({ behavior: 'smooth' });
}

// Initialize
promptInput.focus();

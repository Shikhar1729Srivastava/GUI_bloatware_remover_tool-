document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const connectionStatus = document.getElementById('connectionStatus');
    const showAllBtn = document.getElementById('showAll');
    const showSystemBtn = document.getElementById('showSystem');
    const showUserBtn = document.getElementById('showUser');
    const searchBox = document.getElementById('searchBox');
    const packageList = document.getElementById('packageList');
    const packageInput = document.getElementById('packageInput');
    const uninstallBtn = document.getElementById('uninstallBtn');
    const reinstallBtn = document.getElementById('reinstallBtn');
    const output = document.getElementById('output');
    
    // State
    let allPackages = [];
    let filteredPackages = [];
    let lastUninstalled = null;
    let currentFilter = '';

    // Initialize
    checkADBConnection();
    setupEventListeners();

    // ======================
    // Core Functions
    // ======================
    
    function checkADBConnection() {
        fetch('/check-adb')
            .then(res => res.json())
            .then(data => {
                if (data.connected) {
                    connectionStatus.textContent = "🟢 Connected";
                    connectionStatus.style.background = "#2ecc71";
                }
            })
            .catch(() => {
                connectionStatus.textContent = "🔴 ADB Not Found";
            });
    }

    function setupEventListeners() {
        // Filter Buttons
        showAllBtn.addEventListener('click', () => {
            setActiveFilter('', showAllBtn);
            fetchPackages();
        });
        
        showSystemBtn.addEventListener('click', () => {
            setActiveFilter('-s', showSystemBtn);
            fetchPackages();
        });
        
        showUserBtn.addEventListener('click', () => {
            setActiveFilter('-3', showUserBtn);
            fetchPackages();
        });

        // Search Functionality
        searchBox.addEventListener('input', () => {
            filterPackages();
        });

        // Package Actions
        uninstallBtn.addEventListener('click', uninstallPackage);
        reinstallBtn.addEventListener('click', reinstallPackage);
    }

    function setActiveFilter(filter, button) {
        currentFilter = filter;
        document.querySelectorAll('.filter-buttons button').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');
    }

    async function fetchPackages() {
        output.textContent = "⌛ Fetching packages...";
        try {
            const endpoint = currentFilter ? 
                `/list-packages?filter=${currentFilter}` : 
                '/list-packages';
                
            const response = await fetch(endpoint);
            const data = await response.json();
            
            if (data.error) throw new Error(data.error);
            
            allPackages = data.output.split('\n')
                .filter(pkg => pkg.startsWith('package:'))
                .map(pkg => pkg.replace('package:', ''));
                
            filterPackages();
            output.textContent = `✅ Loaded ${allPackages.length} packages`;
            
        } catch (error) {
            output.textContent = `❌ Error: ${error.message}`;
        }
    }

    function filterPackages() {
        const searchTerm = searchBox.value.toLowerCase();
        filteredPackages = allPackages.filter(pkg => 
            pkg.toLowerCase().includes(searchTerm)
        );
        renderPackages();
    }

    function renderPackages() {
        packageList.innerHTML = filteredPackages.map(pkg => `
            <div class="package-item">
                <span>${pkg}</span>
                <button class="copy-btn" data-pkg="${pkg}">Copy</button>
            </div>
        `).join('');

        // Add copy functionality
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const pkg = e.target.getAttribute('data-pkg');
                packageInput.value = pkg;
                output.textContent = `📋 Copied: ${pkg}`;
            });
        });
    }

    async function uninstallPackage() {
        const pkg = packageInput.value.trim();
        if (!pkg) {
            output.textContent = "⚠️ Please enter a package name";
            return;
        }
        
        output.textContent = `⌛ Uninstalling ${pkg}...`;
        try {
            const response = await fetch('/uninstall-package', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ packageName: pkg })
            });
            const result = await response.json();
            
            if (result.error) throw new Error(result.error);
            
            lastUninstalled = pkg;
            output.textContent = `✅ Success! ${pkg} uninstalled.`;
            fetchPackages(); // Refresh list
            
        } catch (error) {
            output.textContent = `❌ Uninstall failed: ${error.message}`;
        }
    }

    async function reinstallPackage() {
        if (!lastUninstalled) {
            output.textContent = "⚠️ No recently uninstalled package";
            return;
        }
        
        output.textContent = `⌛ Reinstalling ${lastUninstalled}...`;
        try {
            const response = await fetch('/reinstall-package', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ packageName: lastUninstalled })
            });
            const result = await response.json();
            
            if (result.error) throw new Error(result.error);
            
            output.textContent = `✅ Success! ${lastUninstalled} reinstalled.`;
            fetchPackages(); // Refresh list
            
        } catch (error) {
            output.textContent = `❌ Reinstall failed: ${error.message}`;
        }
    }
});

// Guide Overlay Control
const guideToggleBtn = document.getElementById('guideToggleBtn');
const guideOverlay = document.getElementById('guideOverlay');
const closeGuideBtn = document.getElementById('closeGuideBtn');

// Toggle overlay
guideToggleBtn.addEventListener('click', () => {
    guideOverlay.style.display = 'flex';
});

closeGuideBtn.addEventListener('click', () => {
    guideOverlay.style.display = 'none';
});

// Close when clicking outside content
guideOverlay.addEventListener('click', (e) => {
    if (e.target === guideOverlay) {
        guideOverlay.style.display = 'none';
    }
});
document.addEventListener('DOMContentLoaded', () => {
    const animalsGrid = document.getElementById('animals-grid');
    const foodTray = document.querySelector('.food-tray');
    const messageArea = document.getElementById('message-area');
    const resetBtn = document.getElementById('reset-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const saveSettingsdBtn = document.getElementById('save-settings');
    const animalSelectionList = document.getElementById('animal-selection-list');

    // Animal definitions
    const animals = {
        bear: { name: 'クマ', open: 'animal_open.png', happy: 'animal_happy.png', sound: 'https://assets.mixkit.co/sfx/preview/mixkit-small-bear-groan-waiting-feed-113.mp3' },
        cat: { name: 'ネコ', open: 'cat_open.png', happy: 'cat_happy.png', sound: 'https://assets.mixkit.co/sfx/preview/mixkit-domestic-cat-hungry-meow-45.mp3' },
        dog: { name: 'イヌ', open: 'dog_open.png', happy: 'dog_happy.png', sound: 'https://assets.mixkit.co/sfx/preview/mixkit-dog-barking-twice-1.mp3' },
        lion: { name: 'ライオン', open: 'lion_open.png', happy: 'lion_happy.png', sound: 'https://assets.mixkit.co/sfx/preview/mixkit-wild-lion-animal-roar-6.mp3' },
        panda: { name: 'パンダ', open: 'panda_open.png', happy: 'panda_happy.png', sound: 'https://assets.mixkit.co/sfx/preview/mixkit-creature-cry-of-hurt-2227.mp3' }
    };

    // Default Config
    let config = {
        activeAnimals: ['bear'] 
    };

    // Audio
    const audioWin = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3');

    // Drag State
    let draggedItem = null;

    // --- Init ---
    loadConfig();
    renderGame();

    // --- Rendering ---
    function renderGame() {
        renderAnimals();
        renderDonuts();
    }

    function renderAnimals() {
        animalsGrid.innerHTML = '';
        
        config.activeAnimals.forEach(key => {
            const animalData = animals[key];
            const div = document.createElement('div');
            div.classList.add('animal-container');
            div.dataset.animalKey = key;
            
            const img = document.createElement('img');
            img.src = animalData.open;
            img.alt = animalData.name;
            img.draggable = false;
            
            div.appendChild(img);
            animalsGrid.appendChild(div);

            // Bind Drop Events specific to this animal
            div.addEventListener('dragover', (e) => {
                e.preventDefault();
                div.classList.add('drag-over');
            });

            div.addEventListener('dragleave', () => {
                div.classList.remove('drag-over');
            });

            div.addEventListener('drop', (e) => {
                e.preventDefault();
                div.classList.remove('drag-over');
                if (draggedItem && draggedItem.classList.contains('food-item')) {
                    feedAnimal(div, key, draggedItem);
                }
            });
        });
    }

    function renderDonuts() {
        foodTray.innerHTML = ''; // Clear tray
        const count = config.activeAnimals.length;

        for (let i = 0; i < count; i++) {
            const donutDiv = document.createElement('div');
            donutDiv.classList.add('food-item');
            donutDiv.draggable = true;
            donutDiv.id = `donut-${i}`;

            const img = document.createElement('img');
            img.src = 'donut.png';
            img.alt = 'ドーナツ';
            img.draggable = false;

            donutDiv.appendChild(img);
            foodTray.appendChild(donutDiv);

            // Bind Drag Events
            donutDiv.addEventListener('dragstart', (e) => {
                draggedItem = donutDiv;
                setTimeout(() => { donutDiv.style.opacity = '0.5'; }, 0);
            });

            donutDiv.addEventListener('dragend', () => {
                setTimeout(() => { donutDiv.style.opacity = '1'; }, 0);
                draggedItem = null;
            });
        }
    }

    // --- Logic ---
    function feedAnimal(container, animalKey, donutElement) {
        if (donutElement.classList.contains('eaten')) return;
        
        const animalData = animals[animalKey];
        const img = container.querySelector('img');

        // Play Sound
        const animalAudio = new Audio(animalData.sound);
        try {
            animalAudio.volume = 0.6;
            animalAudio.play();
        } catch(e) { console.log(e); }
        
        // Hide Donut
        donutElement.classList.add('eaten');
        
        // Animation
        container.classList.add('eating-anim');
        setTimeout(() => {
            img.src = animalData.happy;
            
            // Check Win Condition
            const remainingDonuts = document.querySelectorAll('.food-item:not(.eaten)');
            if (remainingDonuts.length === 0) {
                 messageArea.classList.remove('hidden');
                 try {
                    audioWin.volume = 0.4;
                    audioWin.currentTime = 0;
                    audioWin.play();
                } catch(e) {}
            }
        }, 200);
    }

    // --- Reset ---
    resetBtn.addEventListener('click', () => {
        messageArea.classList.add('hidden');
        renderGame();
    });

    // --- Settings ---
    settingsBtn.addEventListener('click', () => {
        openSettings();
    });

    saveSettingsdBtn.addEventListener('click', () => {
        saveSettings();
        settingsModal.classList.add('hidden');
        renderGame();
    });

    function openSettings() {
        settingsModal.classList.remove('hidden');
        animalSelectionList.innerHTML = '';
        
        Object.keys(animals).forEach(key => {
            const animalData = animals[key];
            const label = document.createElement('label');
            label.classList.add('animal-option');
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = key;
            checkbox.checked = config.activeAnimals.includes(key);
            
            const thumb = document.createElement('img');
            thumb.src = animalData.open;
            
            label.appendChild(checkbox);
            label.appendChild(thumb);
            label.appendChild(document.createTextNode(animalData.name));
            
            animalSelectionList.appendChild(label);
        });
    }

    function saveSettings() {
        const checkboxes = animalSelectionList.querySelectorAll('input[type="checkbox"]');
        const selected = [];
        checkboxes.forEach(cb => {
            if (cb.checked) selected.push(cb.value);
        });
        
        if (selected.length === 0) {
            selected.push('bear');
            alert('ひとつは えらんでね！');
        }
        
        config.activeAnimals = selected;
        localStorage.setItem('animalAppConfig', JSON.stringify(config));
    }

    function loadConfig() {
        const saved = localStorage.getItem('animalAppConfig');
        if (saved) {
            try {
                config = JSON.parse(saved);
            } catch(e) {}
        }
    }
});

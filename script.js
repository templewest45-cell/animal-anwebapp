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
        activeAnimals: ['bear'],
        isRandom: false,
        foodType: 'donut'
    };

    const foodTypes = {
        donut: { name: 'ドーナツ', src: 'donut.png' },
        onigiri: { name: 'おにぎり', src: 'onigiri.png' },
        sandwich: { name: 'サンドイッチ', src: 'sandwich.png' }
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
        renderFood();
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

                // Prevent double feeding
                if (div.classList.contains('fed')) return;

                if (draggedItem && draggedItem.classList.contains('food-item')) {
                    feedAnimal(div, key, draggedItem);
                }
            });
        });
    }

    function renderFood() {
        foodTray.innerHTML = ''; // Clear tray
        const count = config.activeAnimals.length;
        const currentFood = foodTypes[config.foodType] || foodTypes['donut'];

        for (let i = 0; i < count; i++) {
            const donutDiv = document.createElement('div');
            donutDiv.classList.add('food-item');
            donutDiv.draggable = true;
            donutDiv.id = `food-${i}`;

            const img = document.createElement('img');
            img.src = currentFood.src;
            img.alt = currentFood.name;
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

            // Touch handlers are bound globally, but we might need to re-bind if logic was specific
            // Actually global handlers use .food-item class so it should work automatically for new elements
        }
    }

    // --- Touch Support ---
    let initialX, initialY;
    let currentX, currentY;
    let activeTouchDonut = null;

    foodTray.addEventListener('touchstart', (e) => {
        const item = e.target.closest('.food-item');
        if (!item || item.classList.contains('eaten')) return;

        // Prevent scrolling immediately
        e.preventDefault();

        activeTouchDonut = item;
        const touch = e.touches[0];
        initialX = touch.clientX;
        initialY = touch.clientY;

        item.style.opacity = '0.5';
        item.style.transition = 'none';
        item.style.zIndex = '1000';
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
        if (!activeTouchDonut) return;

        e.preventDefault(); // CRITICAL: Stop the scroll

        const touch = e.touches[0];
        currentX = touch.clientX - initialX;
        currentY = touch.clientY - initialY;

        activeTouchDonut.style.transform = `translate(${currentX}px, ${currentY}px) scale(1.1)`;
    }, { passive: false });

    document.addEventListener('touchend', (e) => {
        if (!activeTouchDonut) return;

        const touch = e.changedTouches[0];

        // Temporarily hide the donut from hit testing
        activeTouchDonut.style.pointerEvents = 'none';

        const elementAtPoint = document.elementFromPoint(touch.clientX, touch.clientY);
        const animalZone = elementAtPoint ? elementAtPoint.closest('.animal-container') : null;

        if (animalZone) {
            // Prevent double feeding
            if (!animalZone.classList.contains('fed')) {
                const key = animalZone.dataset.animalKey;
                feedAnimal(animalZone, key, activeTouchDonut);
            }
        }

        // Restore pointer events
        activeTouchDonut.style.pointerEvents = 'auto';
        activeTouchDonut.style.opacity = '1';
        activeTouchDonut.style.transition = 'transform 0.3s ease'; // Smooth snap back
        activeTouchDonut.style.transform = '';
        activeTouchDonut.style.zIndex = '';

        activeTouchDonut = null;
    }, { passive: false });

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
        } catch (e) { console.log(e); }

        // Hide Donut
        donutElement.classList.add('eaten');

        // Create Fed State
        container.classList.add('fed');

        // Animation
        container.classList.add('eating-anim');
        setTimeout(() => {
            img.src = animalData.happy;

            // Check Win Condition
            const remainingDonuts = document.querySelectorAll('.food-item:not(.eaten)');
            if (remainingDonuts.length === 0) {
                const count = config.activeAnimals.length;
                messageArea.querySelector('p').textContent = `${count}こ あげました！`;
                messageArea.classList.remove('hidden');
                try {
                    audioWin.volume = 0.4;
                    audioWin.currentTime = 0;
                    audioWin.play();
                } catch (e) { }
            }
        }, 200);
    }

    // --- Reset ---
    resetBtn.addEventListener('click', () => {
        messageArea.classList.add('hidden');
        if (config.isRandom) {
            applyRandomConfig();
        }
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

        const randomToggle = document.getElementById('random-mode-toggle');
        randomToggle.checked = config.isRandom;

        // Food Selection
        const foodRadios = document.querySelectorAll('input[name="food-choice"]');
        foodRadios.forEach(radio => {
            radio.checked = (radio.value === config.foodType);
        });

        // Disable individual selection if random mode is on
        updateSelectionListState(config.isRandom);

        randomToggle.addEventListener('change', (e) => {
            updateSelectionListState(e.target.checked);
        });

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

    function updateSelectionListState(isRandom) {
        if (isRandom) {
            animalSelectionList.style.opacity = '0.5';
            animalSelectionList.style.pointerEvents = 'none';
        } else {
            animalSelectionList.style.opacity = '1';
            animalSelectionList.style.pointerEvents = 'auto';
        }
    }

    function saveSettings() {
        const randomToggle = document.getElementById('random-mode-toggle');
        config.isRandom = randomToggle.checked;

        // Food Selection
        const selectedFood = document.querySelector('input[name="food-choice"]:checked');
        if (selectedFood) {
            config.foodType = selectedFood.value;
        }

        if (config.isRandom) {
            applyRandomConfig();
        } else {
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
        }

        localStorage.setItem('animalAppConfig', JSON.stringify(config));
    }

    function applyRandomConfig() {
        const animalKeys = Object.keys(animals);
        // Random count between 1 and 5
        const randomCount = Math.floor(Math.random() * 5) + 1;

        // Fisher-Yates Shuffle for reliability
        const shuffled = [...animalKeys];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        config.activeAnimals = shuffled.slice(0, randomCount);
    }

    function loadConfig() {
        const saved = localStorage.getItem('animalAppConfig');
        if (saved) {
            try {
                const loaded = JSON.parse(saved);
                // Merge loaded config with defaults to handle new keys like isRandom
                config = { ...config, ...loaded };
            } catch (e) { }
        }

        // If random mode is on, generate initial random set
        if (config.isRandom) {
            applyRandomConfig();
        }
    }
});

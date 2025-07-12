document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Elements ---
    const pages = {
        mainMenu: document.getElementById('main-menu'),
        game: document.getElementById('game-page'),
        management: document.getElementById('management-page'),
    };

    const buttons = {
        truthBtn: document.getElementById('truth-btn'),
        dareBtn: document.getElementById('dare-btn'),
        manageBtn: document.getElementById('manage-btn'),
        backBtns: document.querySelectorAll('.back-btn'),
        saveItemBtn: document.getElementById('save-item-btn'),
        cancelEditBtn: document.getElementById('cancel-edit-btn'),
        bulkEditBtn: document.getElementById('bulk-edit-btn'),
        saveBulkBtn: document.getElementById('save-bulk-btn'),
        cancelBulkBtn: document.getElementById('cancel-bulk-btn'),
    };

    const gameElements = {
        title: document.getElementById('game-title'),
        diceContainer: document.getElementById('dice-container'),
        dice: document.getElementById('dice'),
        resultDisplay: document.getElementById('result-display'),
        resultText: document.getElementById('result-text'),
    };

    const managementElements = {
        typeSelect: document.getElementById('manage-type-select'),
        itemsList: document.getElementById('items-list'),
        editItemId: document.getElementById('edit-item-id'),
        editItemType: document.getElementById('edit-item-type'),
        itemText: document.getElementById('item-text'),
        itemDifficulty: document.getElementById('item-difficulty'),
        listView: document.getElementById('list-view'),
        bulkEditView: document.getElementById('bulk-edit-view'),
        bulkEditTextarea: document.getElementById('bulk-edit-textarea'),
    };

    // --- Game State & Data ---
    let state = {
        currentPage: 'mainMenu',
        gameMode: null, // 'truths' or 'dares'
        diceRolled: false,
        resultShown: false,
        currentDifficulty: null,
        managementView: 'list', // 'list' or 'bulk'
        data: {
            truths: [],
            dares: [],
        },
    };

    // --- Functions ---

    // Data Persistence
    function loadData() {
        const savedData = localStorage.getItem('truthOrDareData');
        if (savedData) {
            state.data = JSON.parse(savedData);
        } else {
            state.data = JSON.parse(JSON.stringify(initialData)); // Deep copy
            saveData();
        }
    }

    function saveData() {
        localStorage.setItem('truthOrDareData', JSON.stringify(state.data));
    }
    
    // Navigation
    function navigateTo(pageName) {
        Object.values(pages).forEach(page => page.classList.remove('active'));
        pages[pageName].classList.add('active');
        state.currentPage = pageName;
        // When navigating to a page, give it focus to ensure it receives key events.
        if (pages[pageName]) {
            pages[pageName].focus({ preventScroll: true }); // preventScroll avoids jumping
        }
    }

    // Helper function for a weighted dice roll
    function getWeightedDiceRoll() {
        // Creates a weighted distribution where lower numbers are more likely.
        // 1 appears 6 times, 6 appears once. Total items: 21
        const distribution = [
            1, 1, 1, 1, 1, 1, // ~28.6% chance
            2, 2, 2, 2, 2,     // ~23.8% chance
            3, 3, 3, 3,         // ~19.0% chance
            4, 4, 4,             // ~14.3% chance
            5, 5,                 // ~9.5% chance
            6                    // ~4.8% chance
        ];
        const randomIndex = Math.floor(Math.random() * distribution.length);
        return distribution[randomIndex];
    }

    // --- Test Simulation Function ---
    function runTestSimulation() {
        const results = [`--- 10-Round Test Simulation (${state.gameMode}) ---`];
        const gameMode = state.gameMode;

        if (!gameMode) {
            alert("Please start a game (Truth or Dare) before running the test.");
            return;
        }

        for (let i = 1; i <= 10; i++) {
            const diceRoll = getWeightedDiceRoll();
            const availableItems = state.data[gameMode].filter(item => item.difficulty === diceRoll);
            
            let roundResult;
            if (availableItems.length > 0) {
                const randomIndex = Math.floor(Math.random() * availableItems.length);
                const selectedItem = availableItems[randomIndex];
                roundResult = `Round ${i}: Dice[${diceRoll}] -> "${selectedItem.text}" (Difficulty: ${selectedItem.difficulty})`;
            } else {
                roundResult = `Round ${i}: Dice[${diceRoll}] -> No questions found for this difficulty.`;
            }
            results.push(roundResult);
        }
        
        // Use a timeout to ensure the alert doesn't block rendering immediately
        setTimeout(() => {
            alert(results.join('\n\n'));
        }, 0);
    }


    // Game Logic
    function startGame(mode) {
        state.gameMode = mode;
        gameElements.title.textContent = mode === 'truths' ? '真心话' : '大冒险';
        resetGameState();
        navigateTo('game');
    }

    function rollDice() {
        if (state.diceRolled) return;

        gameElements.dice.classList.add('spinning');
        
        setTimeout(() => {
            gameElements.dice.classList.remove('spinning');
            const result = getWeightedDiceRoll(); // Use weighted roll instead of fair roll
            state.currentDifficulty = result;
            
            // This is the fully corrected rotation map.
            const rotations = {
                1: 'rotateY(0deg)',
                2: 'rotateY(-90deg)',
                3: 'rotateX(-90deg)',
                4: 'rotateX(90deg)',
                5: 'rotateY(90deg)',
                6: 'rotateY(180deg)',
            };
            
            gameElements.dice.style.transform = `translateZ(-100px) ${rotations[result]}`;
            
            state.diceRolled = true;
            gameElements.resultDisplay.classList.add('hidden');
            // 不再显示难度等级
        }, 2000);
    }

    function showResult() {
        if (!state.diceRolled) return;

        const availableItems = state.data[state.gameMode].filter(item => item.difficulty === state.currentDifficulty);

        let resultMessage;
        if (availableItems.length > 0) {
            // Pick an item at a random index from the filtered list.
            const randomIndex = Math.floor(Math.random() * availableItems.length);
            const selectedItem = availableItems[randomIndex];
            // Permanently add the difficulty display as requested by the user.
            resultMessage = `${selectedItem.text} (难度: ${selectedItem.difficulty})`;
        } else {
            resultMessage = `哎呀，没有难度为 ${state.currentDifficulty} 的问题/冒险了！换个难度试试或者去管理页添加一些吧。`;
        }

        gameElements.resultText.textContent = resultMessage;
        gameElements.resultDisplay.classList.remove('hidden');
        gameElements.diceContainer.classList.add('hidden');
        state.resultShown = true;
    }
    
    function resetGameState() {
        state.diceRolled = false;
        state.resultShown = false;
        state.currentDifficulty = null;
        gameElements.resultDisplay.classList.add('hidden');
        gameElements.diceContainer.classList.remove('hidden');
        gameElements.dice.style.transform = 'translateZ(-100px) rotateX(0deg) rotateY(0deg)';
    }

    function handleDiceClick() {
        if (state.resultShown) {
            resetGameState();
        } else if (!state.diceRolled) {
            rollDice();
        } else {
            showResult();
        }
    }


    // Management Logic
    function handleManagementTypeChange() {
        if (state.managementView === 'list') {
            renderManagementList();
        } else {
            populateBulkEditArea();
        }
    }

    function toggleManagementView() {
        state.managementView = state.managementView === 'list' ? 'bulk' : 'list';
        renderManagementView();
    }

    function renderManagementView() {
        if (state.managementView === 'list') {
            managementElements.listView.classList.remove('hidden');
            managementElements.bulkEditView.classList.add('hidden');
            buttons.bulkEditBtn.textContent = '切换编辑模式';
            renderManagementList();
        } else {
            managementElements.listView.classList.add('hidden');
            managementElements.bulkEditView.classList.remove('hidden');
            buttons.bulkEditBtn.textContent = '返回列表模式';
            populateBulkEditArea();
        }
    }

    function populateBulkEditArea() {
        const type = managementElements.typeSelect.value;
        const items = state.data[type];
        const formattedText = items.map(item => `${item.text},${item.difficulty}`).join('\n');
        managementElements.bulkEditTextarea.value = formattedText;
    }

    function saveBulkChanges() {
        const type = managementElements.typeSelect.value;
        const text = managementElements.bulkEditTextarea.value;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        
        const newItems = [];
        let errorLines = [];

        lines.forEach((line, index) => {
            const parts = line.split(',');
            if (parts.length >= 2) {
                const difficulty = parseInt(parts.pop().trim());
                const text = parts.join(',').trim();
                if (text && !isNaN(difficulty) && difficulty >= 1 && difficulty <= 6) {
                    newItems.push({ id: Date.now() + index, text, difficulty });
                } else {
                    errorLines.push(index + 1);
                }
            } else {
                errorLines.push(index + 1);
            }
        });

        if (errorLines.length > 0) {
            alert(`保存失败！以下行格式错误，请检查：\n${errorLines.join(', ')}\n\n正确格式应为：内容,难度`);
            return;
        }

        if (confirm(`确定要用这些内容完全覆盖当前的“${type === 'truths' ? '真心话' : '大冒险'}”题库吗？`)) {
            state.data[type] = newItems;
            saveData();
            alert('保存成功！');
            toggleManagementView();
        }
    }

    function renderManagementList() {
        const type = managementElements.typeSelect.value;
        const items = state.data[type];
        managementElements.itemsList.innerHTML = '';

        if (items.length === 0) {
            managementElements.itemsList.innerHTML = '<p>这里空空如也，快来添加一些吧！</p>';
            return;
        }

        items.sort((a,b)=> a.difficulty - b.difficulty).forEach(item => {
            const entry = document.createElement('div');
            entry.className = 'item-entry';
            entry.innerHTML = `
                <span class="item-text">${item.text}</span>
                <span class="item-difficulty">难度: ${item.difficulty}</span>
                <div class="item-actions">
                    <button onclick="window.app.editItem('${type}', ${item.id})">✏️</button>
                    <button onclick="window.app.deleteItem('${type}', ${item.id})">🗑️</button>
                </div>
            `;
            managementElements.itemsList.appendChild(entry);
        });
    }

    function saveItem() {
        const text = managementElements.itemText.value.trim();
        const difficulty = parseInt(managementElements.itemDifficulty.value);
        const id = managementElements.editItemId.value;
        const type = managementElements.editItemType.value || managementElements.typeSelect.value;

        if (!text || !difficulty || difficulty < 1 || difficulty > 6) {
            alert('请填写完整且有效的信息！');
            return;
        }

        if (id) { // Editing
            const itemIndex = state.data[type].findIndex(i => i.id == id);
            if (itemIndex > -1) {
                state.data[type][itemIndex] = { ...state.data[type][itemIndex], text, difficulty };
            }
        } else { // Adding
            const newItem = {
                id: Date.now(),
                text,
                difficulty,
            };
            state.data[type].push(newItem);
        }

        saveData();
        renderManagementList();
        clearEditForm();
    }
    
    function clearEditForm() {
        managementElements.editItemId.value = '';
        managementElements.editItemType.value = '';
        managementElements.itemText.value = '';
        managementElements.itemDifficulty.value = '';
        buttons.cancelEditBtn.classList.add('hidden');
    }

    // --- Global App Object for inline event handlers ---
    window.app = {
        editItem: (type, id) => {
            const item = state.data[type].find(i => i.id === id);
            if (item) {
                managementElements.editItemId.value = id;
                managementElements.editItemType.value = type;
                managementElements.itemText.value = item.text;
                managementElements.itemDifficulty.value = item.difficulty;
                buttons.cancelEditBtn.classList.remove('hidden');
                managementElements.itemText.focus();
            }
        },
        deleteItem: (type, id) => {
            if (confirm('确定要删除这条记录吗？')) {
                state.data[type] = state.data[type].filter(i => i.id !== id);
                saveData();
                renderManagementList();
            }
        }
    };

    // --- Event Listeners ---
    buttons.truthBtn.addEventListener('click', () => startGame('truths'));
    buttons.dareBtn.addEventListener('click', () => startGame('dares'));
    buttons.manageBtn.addEventListener('click', () => {
        renderManagementView();
        navigateTo('management');
    });

    buttons.backBtns.forEach(btn => {
        btn.addEventListener('click', () => navigateTo('mainMenu'));
    });
    
    gameElements.diceContainer.addEventListener('click', handleDiceClick);
    gameElements.resultDisplay.addEventListener('click', handleDiceClick);

    managementElements.typeSelect.addEventListener('change', handleManagementTypeChange);
    buttons.saveItemBtn.addEventListener('click', saveItem);
    buttons.cancelEditBtn.addEventListener('click', clearEditForm);
    buttons.bulkEditBtn.addEventListener('click', toggleManagementView);
    buttons.saveBulkBtn.addEventListener('click', saveBulkChanges);
    buttons.cancelBulkBtn.addEventListener('click', toggleManagementView);

    // Keyboard shortcut for manage button
    function handleKeyPress(event) {
        // Prevent action when user is typing in forms
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }

        const key = event.key.toLowerCase();
        if (key === 'h') {
            if (state.currentPage === 'mainMenu') {
                buttons.manageBtn.classList.toggle('hidden');
            } else if (state.currentPage === 'game') {
                runTestSimulation();
            }
        }
    }

    // Attach listener to window for reliable global event capturing
    window.addEventListener('keydown', handleKeyPress);


    // --- Initialization ---
    loadData();
    navigateTo('mainMenu');
}); 
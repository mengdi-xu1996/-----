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
        batchAddBtn: document.getElementById('batch-add-btn'),
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
        batchFileInput: document.getElementById('batch-file-input'),
    };

    // --- Game State & Data ---
    let state = {
        currentPage: 'mainMenu',
        gameMode: null, // 'truths' or 'dares'
        diceRolled: false,
        resultShown: false,
        currentDifficulty: null,
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
            const result = Math.floor(Math.random() * 6) + 1;
            state.currentDifficulty = result;
            
            const rotations = {
                1: 'rotateX(0deg) rotateY(0deg)',       // front
                2: 'rotateY(90deg) rotateX(0deg)',      // right
                3: 'rotateX(-90deg) rotateY(0deg)',     // top
                4: 'rotateX(90deg) rotateY(0deg)',      // bottom
                5: 'rotateY(-90deg) rotateX(0deg)',     // left
                6: 'rotateY(180deg) rotateX(0deg)',     // back
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
            const randomIndex = Math.floor(Math.random() * availableItems.length);
            resultMessage = availableItems[randomIndex].text;
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

    function handleBatchAdd() {
        const file = managementElements.batchFileInput.files[0];
        if (!file) {
            alert('请先选择一个文件。');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
            const content = event.target.result;
            const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
            const type = managementElements.typeSelect.value;
            let addedCount = 0;

            lines.forEach(line => {
                const parts = line.split(',');
                if (parts.length >= 2) {
                    const text = parts.slice(0, -1).join(',').trim();
                    const difficulty = parseInt(parts[parts.length - 1].trim());
                    if (text && !isNaN(difficulty) && difficulty >= 1 && difficulty <= 6) {
                        state.data[type].push({ id: Date.now() + addedCount, text, difficulty });
                        addedCount++;
                    }
                }
            });

            if (addedCount > 0) {
                saveData();
                renderManagementList();
                alert(`成功导入 ${addedCount} 条记录！`);
            } else {
                alert('没有导入任何记录。请检查文件格式是否正确（例如：问题,难度）。');
            }
            managementElements.batchFileInput.value = ''; // Reset file input
        };
        reader.readAsText(file);
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
        renderManagementList();
        navigateTo('management');
    });

    buttons.backBtns.forEach(btn => {
        btn.addEventListener('click', () => navigateTo('mainMenu'));
    });
    
    gameElements.diceContainer.addEventListener('click', handleDiceClick);
    gameElements.resultDisplay.addEventListener('click', handleDiceClick);

    managementElements.typeSelect.addEventListener('change', renderManagementList);
    buttons.saveItemBtn.addEventListener('click', saveItem);
    buttons.cancelEditBtn.addEventListener('click', clearEditForm);
    buttons.batchAddBtn.addEventListener('click', handleBatchAdd);

    // Keyboard shortcut for manage button
    function handleKeyPress(event) {
        // We use event.key.toLowerCase() to catch both 'h' and 'H'
        if (state.currentPage === 'mainMenu' && event.key.toLowerCase() === 'h') {
            // Prevent toggling when user is typing in forms (if any were on main page)
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
                return;
            }
            buttons.manageBtn.classList.toggle('hidden');
        }
    }

    // Attach listener to window for reliable global event capturing
    window.addEventListener('keydown', handleKeyPress);


    // --- Initialization ---
    loadData();
    navigateTo('mainMenu');
}); 
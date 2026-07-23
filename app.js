/* ═══════════════════════════════════════════════════════
   AlgoCode — Application Logic
   ═══════════════════════════════════════════════════════ */

// ─── State ───
let pyodide = null;
let editor  = null;

let gridRows = 25;
let gridCols = 25;
let gridState = [];       // 2D array: 0 = empty, 1 = wall
let cellElements = [];    // 2D array of DOM elements
let startNode = [1, 1];
let goalNode  = [23, 23];

let currentTool = 'wall';
let isDrawing   = false;
let isRunning   = false;
let executionStopped = false;
let executionStartTime = 0;
let timerInterval = null;
let coordsVisible = false;
let currentLanguage = localStorage.getItem('algocode-lang') || 'python';

// ─── Per-language editor content cache ───
let editorContentCache = { python: null, cpp: null };

// DOM references
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ═══════════════════════════════════════════════════════
//  Initialization
// ═══════════════════════════════════════════════════════

async function init() {
    setLoaderStatus('Setting up editor…', 15);
    initEditor();

    setLoaderStatus('Initializing grid…', 30);
    initGrid();
    renderGrid();

    setLoaderStatus('Loading Python runtime… (this may take a moment)', 40);
    await initPyodide();

    setLoaderStatus('Ready!', 100);
    initEventListeners();

    // Restore saved language preference
    if (currentLanguage === 'cpp') {
        switchLanguage('cpp', true);
    }

    showApp();
}

function setLoaderStatus(text, progress) {
    const statusEl = $('#loader-status');
    const progressEl = $('#loader-progress');
    if (statusEl) statusEl.textContent = text;
    if (progressEl) progressEl.style.width = progress + '%';
}

function showApp() {
    setTimeout(() => {
        const loader = $('#app-loader');
        loader.classList.add('fade-out');
        $('#app').classList.remove('hidden');
        setTimeout(() => loader.style.display = 'none', 500);
        // Resize editor after visible
        setTimeout(() => {
            editor.resize();
            renderGrid();
        }, 100);
    }, 300);
}

// ═══════════════════════════════════════════════════════
//  Ace Editor
// ═══════════════════════════════════════════════════════

function initEditor() {
    editor = ace.edit('editor');
    editor.setTheme('ace/theme/monokai');
    editor.session.setMode('ace/mode/python');
    editor.setOptions({
        fontSize: '13.5px',
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        showPrintMargin: false,
        highlightActiveLine: true,
        highlightSelectedWord: true,
        showGutter: true,
        tabSize: 4,
        useSoftTabs: true,
        wrap: false,
        scrollPastEnd: 0.3,
        displayIndentGuides: true,
        animatedScroll: true,
    });
    editor.setValue(getPythonTemplate(), -1);
    editor.focus();

    // Ctrl+Enter / Cmd+Enter to run
    editor.commands.addCommand({
        name: 'runCode',
        bindKey: { win: 'Ctrl-Enter', mac: 'Cmd-Enter' },
        exec: () => onRun(),
    });
}

function switchLanguage(lang, isInit = false) {
    if (lang === currentLanguage && !isInit) return;
    if (isRunning) return;

    // Cache current editor content
    editorContentCache[currentLanguage] = editor.getValue();

    currentLanguage = lang;
    localStorage.setItem('algocode-lang', lang);

    // Update editor mode
    if (lang === 'python') {
        editor.session.setMode('ace/mode/python');
        editor.setValue(editorContentCache.python || getPythonTemplate(), -1);
    } else {
        editor.session.setMode('ace/mode/c_cpp');
        editor.setValue(editorContentCache.cpp || getCppTemplate(), -1);
    }
    editor.getSession().clearAnnotations();

    // Update UI
    const toggle = $('#lang-toggle');
    toggle.classList.toggle('cpp', lang === 'cpp');
    $('#btn-lang-python').classList.toggle('active', lang === 'python');
    $('#btn-lang-cpp').classList.toggle('active', lang === 'cpp');
    $('#file-badge').textContent = lang === 'python' ? 'algorithm.py' : 'algorithm.cpp';

    setStatusReady();
}

function getPythonTemplate() {
    return `# ═══════════════════════════════════════════════════════════
#  AlgoCode — Write Your Algorithm Here
# ═══════════════════════════════════════════════════════════
#
#  GRID INFO:
#    grid       = visualizer.get_grid()       # 2D list (0=empty, 1=wall)
#    start      = visualizer.get_start()      # (row, col)
#    goal       = visualizer.get_goal()       # (row, col)
#    rows, cols = visualizer.get_grid_size()  # grid dimensions
#
#  VISUALIZATION (instant update):
#    visualizer.visit(node)        # Mark as visited (blue)
#    visualizer.open(node)         # Mark as frontier (amber)
#    visualizer.close(node)        # Mark as explored (purple)
#    visualizer.path(node_list)    # Highlight final path (gold)
#
#  ANIMATION (use 'await'):
#    await visualizer.sleep(ms)            # Pause for ms milliseconds
#    await visualizer.move_robot(path)     # Animate robot along path
#
#  print() → output appears in the console below
# ═══════════════════════════════════════════════════════════

`;
}

function getCppTemplate() {
    return `// ═══════════════════════════════════════════════════════════
//  AlgoCode — Write Your Algorithm Here (C++)
// ═══════════════════════════════════════════════════════════
//
//  GRID INFO:
//    get_grid_cell(row, col)   → returns 0 (empty) or 1 (wall)
//    int start_r, start_c;
//    get_start(start_r, start_c);
//    int goal_r, goal_c;
//    get_goal(goal_r, goal_c);
//    int rows, cols;
//    get_grid_size(rows, cols);
//
//  VISUALIZATION:
//    visit(row, col);          // Mark as visited (blue)
//    open_node(row, col);      // Mark as frontier (amber)
//    close_node(row, col);     // Mark as explored (purple)
//    mark_path(row, col);      // Mark as path (gold)
//    viz_sleep(ms);            // Pause for animation
//    move_robot_to(row, col);  // Move robot to cell
//
//  cout << "text" << endl;  → output appears in the console below
//
//  NOTE: Animation is batched — your code runs first, then
//        visualization commands are replayed with animation.
// ═══════════════════════════════════════════════════════════
#include <iostream>
using namespace std;

int main() {
    // Get grid info
    int start_r, start_c, goal_r, goal_c, rows, cols;
    get_start(start_r, start_c);
    get_goal(goal_r, goal_c);
    get_grid_size(rows, cols);

    cout << "Grid: " << rows << " x " << cols << endl;
    cout << "Start: (" << start_r << ", " << start_c << ")" << endl;
    cout << "Goal: (" << goal_r << ", " << goal_c << ")" << endl;

    // Example: check if a cell is a wall
    // if (get_grid_cell(r, c) == 0) { /* empty */ }

    // Write your algorithm here!

    return 0;
}
`;
}

// ═══════════════════════════════════════════════════════
//  Grid Management
// ═══════════════════════════════════════════════════════

function initGrid() {
    gridState = [];
    for (let r = 0; r < gridRows; r++) {
        gridState[r] = new Array(gridCols).fill(0);
    }
}

function renderGrid() {
    const grid = $('#grid');
    const container = $('#grid-container');

    // Reserve space for labels when visible
    const labelSpace = coordsVisible ? 22 : 0;
    const maxW = container.clientWidth - 32 - labelSpace;
    const maxH = container.clientHeight - 32 - labelSpace;
    const cellSize = Math.max(Math.floor(Math.min(maxW / gridCols, maxH / gridRows)), 8);

    grid.style.gridTemplateColumns = `repeat(${gridCols}, ${cellSize}px)`;
    grid.style.gridTemplateRows    = `repeat(${gridRows}, ${cellSize}px)`;

    grid.innerHTML = '';
    cellElements = [];

    for (let r = 0; r < gridRows; r++) {
        cellElements[r] = [];
        for (let c = 0; c < gridCols; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = r;
            cell.dataset.col = c;

            if (r === startNode[0] && c === startNode[1]) {
                cell.classList.add('start');
            } else if (r === goalNode[0] && c === goalNode[1]) {
                cell.classList.add('goal');
            } else if (gridState[r][c] === 1) {
                cell.classList.add('wall');
            }

            grid.appendChild(cell);
            cellElements[r][c] = cell;
        }
    }

    // Render axis labels
    renderAxisLabels(cellSize);
}

function renderAxisLabels(cellSize) {
    const colLabels = $('#col-labels');
    const rowLabels = $('#row-labels');

    // Column labels (X axis — along the top)
    colLabels.innerHTML = '';
    // Add spacer to align with row-labels width
    if (coordsVisible) {
        const spacer = document.createElement('span');
        spacer.style.width = '22px';
        spacer.style.flexShrink = '0';
        colLabels.appendChild(spacer);
    }
    for (let c = 0; c < gridCols; c++) {
        const label = document.createElement('span');
        label.className = 'axis-label';
        label.textContent = c;
        // +1 accounts for the 1px gap between cells
        label.style.width = (cellSize + 1) + 'px';
        colLabels.appendChild(label);
    }

    // Row labels (Y axis — along the left, 0 at bottom)
    rowLabels.innerHTML = '';
    for (let r = 0; r < gridRows; r++) {
        const label = document.createElement('span');
        label.className = 'axis-label';
        label.textContent = gridRows - 1 - r;
        label.style.height = (cellSize + 1) + 'px';
        rowLabels.appendChild(label);
    }

    // Show/hide based on state
    colLabels.classList.toggle('hidden', !coordsVisible);
    rowLabels.classList.toggle('hidden', !coordsVisible);
}

function updateCellVisual(r, c) {
    const cell = cellElements[r]?.[c];
    if (!cell) return;

    // Remove all state classes
    cell.classList.remove('wall', 'start', 'goal', 'visited', 'open', 'closed', 'path');

    if (r === startNode[0] && c === startNode[1]) {
        cell.classList.add('start');
    } else if (r === goalNode[0] && c === goalNode[1]) {
        cell.classList.add('goal');
    } else if (gridState[r][c] === 1) {
        cell.classList.add('wall');
    }
}

function clearVisualization() {
    for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
            const cell = cellElements[r]?.[c];
            if (cell) {
                cell.classList.remove('visited', 'open', 'closed', 'path');
            }
        }
    }
    hideRobot();
}

function clearGrid() {
    for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
            gridState[r][c] = 0;
        }
    }
    startNode = [1, 1];
    goalNode  = [gridRows - 2, gridCols - 2];
    renderGrid();
}

function changeGridSize(size) {
    gridRows = size;
    gridCols = size;
    startNode = [1, 1];
    goalNode  = [size - 2, size - 2];
    initGrid();
    renderGrid();
}

// ═══════════════════════════════════════════════════════
//  Maze Generation (Iterative Recursive Backtracking)
// ═══════════════════════════════════════════════════════

function generateMaze() {
    // Fill with walls
    for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
            gridState[r][c] = 1;
        }
    }

    // Iterative DFS to carve passages
    const stack = [[1, 1]];
    gridState[1][1] = 0;

    while (stack.length > 0) {
        const [r, c] = stack[stack.length - 1];
        const neighbors = [];

        for (const [dr, dc] of [[-2,0],[2,0],[0,-2],[0,2]]) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr > 0 && nr < gridRows - 1 && nc > 0 && nc < gridCols - 1 && gridState[nr][nc] === 1) {
                neighbors.push([nr, nc, dr, dc]);
            }
        }

        if (neighbors.length > 0) {
            const idx = Math.floor(Math.random() * neighbors.length);
            const [nr, nc, dr, dc] = neighbors[idx];
            // Carve wall between current and neighbor
            gridState[r + dr / 2][c + dc / 2] = 0;
            gridState[nr][nc] = 0;
            stack.push([nr, nc]);
        } else {
            stack.pop();
        }
    }

    // Ensure start and goal are open passages
    startNode = [1, 1];
    goalNode  = [gridRows - 2, gridCols - 2];
    gridState[startNode[0]][startNode[1]] = 0;
    gridState[goalNode[0]][goalNode[1]] = 0;

    // Also open a small area around goal in case maze didn't reach it
    if (gridRows % 2 === 0) {
        if (goalNode[0] > 1) gridState[goalNode[0]-1][goalNode[1]] = 0;
    }
    if (gridCols % 2 === 0) {
        if (goalNode[1] > 1) gridState[goalNode[0]][goalNode[1]-1] = 0;
    }

    clearVisualization();
    renderGrid();
}

// ═══════════════════════════════════════════════════════
//  Grid Interaction (Drawing Tools)
// ═══════════════════════════════════════════════════════

function handleCellInteraction(r, c) {
    if (isRunning) return;

    switch (currentTool) {
        case 'wall':
            if (!isStartOrGoal(r, c)) {
                gridState[r][c] = 1;
                updateCellVisual(r, c);
            }
            break;
        case 'erase':
            if (!isStartOrGoal(r, c)) {
                gridState[r][c] = 0;
                updateCellVisual(r, c);
            }
            break;
        case 'start':
            moveStartNode(r, c);
            break;
        case 'goal':
            moveGoalNode(r, c);
            break;
    }
}

function isStartOrGoal(r, c) {
    return (r === startNode[0] && c === startNode[1]) ||
           (r === goalNode[0]  && c === goalNode[1]);
}

function moveStartNode(r, c) {
    if (r === goalNode[0] && c === goalNode[1]) return;
    const oldR = startNode[0], oldC = startNode[1];
    startNode = [r, c];
    gridState[r][c] = 0; // Clear wall if any
    updateCellVisual(oldR, oldC);
    updateCellVisual(r, c);
}

function moveGoalNode(r, c) {
    if (r === startNode[0] && c === startNode[1]) return;
    const oldR = goalNode[0], oldC = goalNode[1];
    goalNode = [r, c];
    gridState[r][c] = 0;
    updateCellVisual(oldR, oldC);
    updateCellVisual(r, c);
}

function getCellFromEvent(e) {
    const cell = e.target.closest('.cell');
    if (!cell) return null;
    return [parseInt(cell.dataset.row), parseInt(cell.dataset.col)];
}

// ═══════════════════════════════════════════════════════
//  Robot
// ═══════════════════════════════════════════════════════

function showRobotAt(row, col) {
    const cell = cellElements[row]?.[col];
    if (!cell) return;

    const robot = $('#robot');
    const innerEl = $('#grid-inner');
    const innerRect = innerEl.getBoundingClientRect();
    const cellRect = cell.getBoundingClientRect();

    robot.classList.remove('hidden');
    robot.style.left = (cellRect.left - innerRect.left + cellRect.width / 2 - 10) + 'px';
    robot.style.top  = (cellRect.top  - innerRect.top  + cellRect.height / 2 - 10) + 'px';
}

function hideRobot() {
    $('#robot').classList.add('hidden');
}

// ═══════════════════════════════════════════════════════
//  Console
// ═══════════════════════════════════════════════════════

function clearConsole() {
    $('#console-output').innerHTML = '';
}

function appendToConsole(text, type = 'output') {
    const output = $('#console-output');
    const span = document.createElement('span');
    span.className = `console-line ${type}`;
    span.textContent = text;
    output.appendChild(span);
    output.scrollTop = output.scrollHeight;
}

// ═══════════════════════════════════════════════════════
//  Pyodide / Python Integration
// ═══════════════════════════════════════════════════════

async function initPyodide() {
    try {
        pyodide = await loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/',
        });

        // Expose JS functions to Python via globalThis
        setupGlobalBridge();

        // Define the Visualizer class in Python
        await pyodide.runPythonAsync(getPythonSetup());

        setStatusReady();
    } catch (err) {
        console.error('Pyodide init error:', err);
        setLoaderStatus('⚠ Failed to load Python runtime. Check your connection.', 0);
        appendToConsole('❌ Failed to initialize Python: ' + err.message, 'error');
    }
}

function setupGlobalBridge() {
    // Stop flag
    globalThis._executionStopped = false;

    // Console output bridge
    globalThis._consolePrint = function(text) {
        appendToConsole(text, 'output');
    };
    globalThis._consoleError = function(text) {
        appendToConsole(text, 'error');
    };

    // Grid info bridge
    globalThis._getGridState = function() {
        return gridState.map(row => Array.from(row));
    };
    globalThis._getStartNode = function() {
        return Array.from(startNode);
    };
    globalThis._getGoalNode = function() {
        return Array.from(goalNode);
    };
    globalThis._getGridSize = function() {
        return [gridRows, gridCols];
    };

    // Visualization bridge
    globalThis._setCellViz = function(row, col, state) {
        const cell = cellElements[row]?.[col];
        if (!cell) return;
        // Don't override start/goal
        if (cell.classList.contains('start') || cell.classList.contains('goal')) return;
        // Remove viz classes only
        cell.classList.remove('visited', 'open', 'closed', 'path');
        if (state) cell.classList.add(state);
    };

    // Path highlight bridge
    globalThis._setPathViz = function(pathArray) {
        for (let i = 0; i < pathArray.length; i++) {
            const node = pathArray[i];
            globalThis._setCellViz(node[0], node[1], 'path');
        }
    };

    // Robot bridge
    globalThis._moveRobotTo = function(row, col) {
        showRobotAt(row, col);
    };

    // Async sleep bridge — returns a JS Promise
    globalThis._asyncSleep = function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    };
}

function getPythonSetup() {
    return `
import sys
import asyncio
from js import (
    _executionStopped, _consolePrint, _consoleError,
    _getGridState, _getStartNode, _getGoalNode, _getGridSize,
    _setCellViz, _setPathViz, _moveRobotTo, _asyncSleep
)
from pyodide.ffi import to_js

# ─── Redirect stdout/stderr ───
class _StdoutCapture:
    def write(self, text):
        if text and text != '\\n':
            _consolePrint(str(text))
        elif text == '\\n':
            _consolePrint('')
    def flush(self):
        pass

class _StderrCapture:
    def write(self, text):
        if text:
            _consoleError(str(text))
    def flush(self):
        pass

sys.stdout = _StdoutCapture()
sys.stderr = _StderrCapture()

# ─── Visualizer API ───
class Visualizer:
    """
    Visualization API for AlgoCode.
    This class contains NO pathfinding logic.
    It only updates the visual display.
    """

    def _check_stopped(self):
        import js
        if js._executionStopped:
            raise InterruptedError("Execution stopped by user")

    # ── Grid Info ──

    def get_grid(self):
        """Returns the grid as a 2D Python list. 0 = empty, 1 = wall."""
        self._check_stopped()
        import js
        grid_js = js._getGridState()
        return grid_js.to_py()

    def get_start(self):
        """Returns the start node as a (row, col) tuple."""
        self._check_stopped()
        import js
        result = js._getStartNode()
        return tuple(result.to_py())

    def get_goal(self):
        """Returns the goal node as a (row, col) tuple."""
        self._check_stopped()
        import js
        result = js._getGoalNode()
        return tuple(result.to_py())

    def get_grid_size(self):
        """Returns (rows, cols) of the grid."""
        self._check_stopped()
        import js
        result = js._getGridSize()
        return tuple(result.to_py())

    # ── Visualization (synchronous) ──

    def visit(self, node):
        """Mark a node as visited (blue)."""
        self._check_stopped()
        import js
        js._setCellViz(int(node[0]), int(node[1]), 'visited')

    def open(self, node):
        """Mark a node as open/frontier (amber)."""
        self._check_stopped()
        import js
        js._setCellViz(int(node[0]), int(node[1]), 'open')

    def close(self, node):
        """Mark a node as closed/explored (purple)."""
        self._check_stopped()
        import js
        js._setCellViz(int(node[0]), int(node[1]), 'closed')

    def path(self, path_list):
        """Highlight the final path (gold). Accepts a list of (row, col) tuples."""
        self._check_stopped()
        import js
        for node in path_list:
            js._setCellViz(int(node[0]), int(node[1]), 'path')

    # ── Animation (async) ──

    async def sleep(self, ms):
        """Pause execution for ms milliseconds. Allows visual updates. Use with 'await'."""
        self._check_stopped()
        import js
        # Break into chunks for responsive stopping
        chunk = 50
        remaining = ms
        while remaining > 0:
            wait = min(chunk, remaining)
            await js._asyncSleep(wait)
            remaining -= chunk
            self._check_stopped()

    async def move_robot(self, path_list, delay=60):
        """
        Animate a robot moving along the given path.
        path_list: list of (row, col) tuples
        delay: milliseconds between each step (default 60)
        Use with 'await'.
        """
        self._check_stopped()
        import js
        for node in path_list:
            js._moveRobotTo(int(node[0]), int(node[1]))
            await self.sleep(delay)

# Create the global visualizer instance
visualizer = Visualizer()
`;
}

// ═══════════════════════════════════════════════════════
//  Code Execution
// ═══════════════════════════════════════════════════════

async function onRun() {
    if (isRunning) return;
    if (currentLanguage === 'python' && !pyodide) return;

    const code = editor.getValue();
    if (!code.trim()) {
        appendToConsole('⚠ No code to execute.', 'warning');
        return;
    }

    // Prepare
    isRunning = true;
    executionStopped = false;
    globalThis._executionStopped = false;
    updateUIForRunning();
    clearVisualization();
    clearConsole();
    editor.getSession().clearAnnotations();
    appendToConsole(`▶ Running algorithm (${currentLanguage === 'python' ? 'Python' : 'C++'})…\n`, 'info');

    // Timer
    executionStartTime = performance.now();
    startExecutionTimer();

    try {
        if (currentLanguage === 'python') {
            await runPython(code);
        } else {
            await runCpp(code);
        }

        if (!executionStopped) {
            const elapsed = ((performance.now() - executionStartTime) / 1000).toFixed(2);
            appendToConsole(`\n✅ Execution completed in ${elapsed}s`, 'success');
        }
    } catch (err) {
        if (executionStopped) {
            appendToConsole('\n⛔ Execution stopped by user.', 'warning');
        } else if (currentLanguage === 'python') {
            handlePythonError(err);
        } else {
            handleCppError(err);
        }
    } finally {
        isRunning = false;
        stopExecutionTimer();
        updateUIForStopped();
    }
}

async function runPython(code) {
    // Reset stdout redirect in case user overwrote it
    await pyodide.runPythonAsync(`
import sys
sys.stdout = _StdoutCapture()
sys.stderr = _StderrCapture()
visualizer._stopped = False
`);
    // Execute user code
    await pyodide.runPythonAsync(code);
}

function onStop() {
    if (!isRunning) return;
    executionStopped = true;
    globalThis._executionStopped = true;
}

function handlePythonError(err) {
    const msg = err.message || String(err);
    appendToConsole('\n❌ Error:\n' + msg, 'error');

    // Try to extract line number for editor annotation
    const lineMatch = msg.match(/File "<exec>", line (\d+)/);
    if (lineMatch) {
        const lineNum = parseInt(lineMatch[1]);
        // Extract last line of traceback as summary
        const lines = msg.trim().split('\n');
        const summary = lines[lines.length - 1] || 'Error';
        editor.getSession().setAnnotations([{
            row: lineNum - 1,
            column: 0,
            type: 'error',
            text: summary,
        }]);
    }
}

function handleCppError(err) {
    const msg = err.message || String(err);
    appendToConsole('\n❌ C++ Error:\n' + msg, 'error');

    // Try to extract line number from JSCPP error messages
    const lineMatch = msg.match(/line\s*(\d+)/i);
    if (lineMatch) {
        const lineNum = parseInt(lineMatch[1]);
        editor.getSession().setAnnotations([{
            row: lineNum - 1,
            column: 0,
            type: 'error',
            text: msg.split('\n')[0] || 'Error',
        }]);
    }
}

// ═══════════════════════════════════════════════════════
//  C++ Execution Engine (JSCPP)
// ═══════════════════════════════════════════════════════

async function runCpp(userCode) {
    if (typeof JSCPP === 'undefined') {
        throw new Error('JSCPP library not loaded. Check your internet connection and refresh the page.');
    }

    // Collect viz commands for batched replay
    const vizCommands = [];

    // Build wrapper code with our API functions implemented as macros/simple functions
    // JSCPP doesn't support custom function injection easily, so we transpile our API calls
    // into code that uses cout with special markers

    // Pre-process user code to convert our API to cout markers
    let processedCode = preprocessCppCode(userCode);

    const outputLines = [];
    const config = {
        stdio: {
            write: function(s) {
                // Parse output for viz command markers
                const str = String(s);
                if (str.startsWith('__VIZ__:')) {
                    const parts = str.substring(8).trim().split(':');
                    vizCommands.push(parts);
                } else {
                    // Regular output — accumulate
                    outputLines.push(str);
                }
            }
        },
        unsigned_overflow: 'warn',
    };

    // Run JSCPP
    try {
        JSCPP.run(processedCode, '', config);
    } catch (e) {
        // Flush any buffered output first
        flushCppOutput(outputLines);
        throw e;
    }

    // Flush regular output
    flushCppOutput(outputLines);

    // Replay viz commands with animation
    if (vizCommands.length > 0) {
        appendToConsole(`\n🎬 Replaying ${vizCommands.length} visualization steps…`, 'info');
        await replayVizCommands(vizCommands);
    }
}

function flushCppOutput(outputLines) {
    // Join and split by newlines to get proper lines
    const fullText = outputLines.join('');
    if (!fullText) return;
    const lines = fullText.split('\n');
    for (const line of lines) {
        if (line !== '') {
            appendToConsole(line, 'output');
        }
    }
}

function preprocessCppCode(code) {
    // Convert our high-level C++ API calls to cout-based markers that JSCPP can handle
    // This is the transpilation layer

    // Build the bridge: inject helper functions that output special markers
    // JSCPP supports basic function definitions, arrays, loops, etc.
    const bridgeCode = `
#include <iostream>
#include <cstdlib>
using namespace std;

// ═══ AlgoCode Bridge Functions ═══

// Grid data (injected at runtime)
${generateGridDataCode()}

void get_start(int &r, int &c) { r = ${startNode[0]}; c = ${startNode[1]}; }
void get_goal(int &r, int &c) { r = ${goalNode[0]}; c = ${goalNode[1]}; }
void get_grid_size(int &r, int &c) { r = ${gridRows}; c = ${gridCols}; }

void visit(int r, int c) { cout << "__VIZ__:visit:" << r << ":" << c << endl; }
void open_node(int r, int c) { cout << "__VIZ__:open:" << r << ":" << c << endl; }
void close_node(int r, int c) { cout << "__VIZ__:close:" << r << ":" << c << endl; }
void mark_path(int r, int c) { cout << "__VIZ__:path:" << r << ":" << c << endl; }
void viz_sleep(int ms) { cout << "__VIZ__:sleep:" << ms << ":0" << endl; }
void move_robot_to(int r, int c) { cout << "__VIZ__:robot:" << r << ":" << c << endl; }

`;

    // Strip any #include and using namespace from user code since we provide them
    let cleanedCode = code
        .replace(/^\s*#include\s*<[^>]+>\s*$/gm, '// (include handled by bridge)')
        .replace(/^\s*using\s+namespace\s+std\s*;\s*$/gm, '// (namespace handled by bridge)');

    return bridgeCode + cleanedCode;
}

function generateGridDataCode() {
    // Generate C++ array initialization for the grid
    // JSCPP supports basic 2D arrays
    let code = `int _grid_data[${gridRows}][${gridCols}] = {\n`;
    for (let r = 0; r < gridRows; r++) {
        code += '    {';
        for (let c = 0; c < gridCols; c++) {
            code += gridState[r][c];
            if (c < gridCols - 1) code += ',';
        }
        code += '}';
        if (r < gridRows - 1) code += ',';
        code += '\n';
    }
    code += `};\n\n`;

    // JSCPP doesn't support vector, so we provide a get_grid_cell function
    // and a helper to access grid cells
    code += `int get_grid_cell(int r, int c) { return _grid_data[r][c]; }\n`;

    // For compatibility with vector<vector<int>> syntax, provide a workaround
    // Users use get_grid_cell(r, c) instead
    return code;
}

async function replayVizCommands(commands) {
    let sleepMs = 15; // default animation speed

    for (let i = 0; i < commands.length; i++) {
        if (executionStopped) break;

        const cmd = commands[i];
        const action = cmd[0];
        const arg1 = parseInt(cmd[1]);
        const arg2 = parseInt(cmd[2]);

        switch (action) {
            case 'visit':
                globalThis._setCellViz(arg1, arg2, 'visited');
                break;
            case 'open':
                globalThis._setCellViz(arg1, arg2, 'open');
                break;
            case 'close':
                globalThis._setCellViz(arg1, arg2, 'closed');
                break;
            case 'path':
                globalThis._setCellViz(arg1, arg2, 'path');
                break;
            case 'sleep':
                sleepMs = arg1;
                await new Promise(r => setTimeout(r, sleepMs));
                break;
            case 'robot':
                showRobotAt(arg1, arg2);
                await new Promise(r => setTimeout(r, 60));
                break;
        }

        // Add a small delay for non-sleep viz commands to animate
        if (action !== 'sleep' && action !== 'robot') {
            // Batch: only delay every few frames for performance
            if (i % 3 === 0) {
                await new Promise(r => setTimeout(r, sleepMs));
            }
        }
    }
}

// ═══════════════════════════════════════════════════════
//  Execution Timer
// ═══════════════════════════════════════════════════════

function startExecutionTimer() {
    const timerEl = $('#execution-timer');
    timerEl.classList.remove('hidden');
    timerInterval = setInterval(() => {
        const elapsed = ((performance.now() - executionStartTime) / 1000).toFixed(1);
        timerEl.textContent = elapsed + 's';
    }, 100);
}

function stopExecutionTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    const timerEl = $('#execution-timer');
    const elapsed = ((performance.now() - executionStartTime) / 1000).toFixed(2);
    timerEl.textContent = elapsed + 's';
}

// ═══════════════════════════════════════════════════════
//  UI State Updates
// ═══════════════════════════════════════════════════════

function updateUIForRunning() {
    $('#btn-run').disabled  = true;
    $('#btn-stop').disabled = false;
    $('#btn-reset-viz').disabled = true;
    $('#btn-generate').disabled  = true;
    $('#btn-clear-grid').disabled = true;
    $('#grid-size').disabled     = true;
    $$('.btn-tool').forEach(b => b.disabled = true);

    $('#grid-container').classList.add('running');
    setStatus('Running…', 'running');
}

function updateUIForStopped() {
    $('#btn-run').disabled  = false;
    $('#btn-stop').disabled = true;
    $('#btn-reset-viz').disabled = false;
    $('#btn-generate').disabled  = false;
    $('#btn-clear-grid').disabled = false;
    $('#grid-size').disabled     = false;
    $$('.btn-tool').forEach(b => b.disabled = false);

    $('#grid-container').classList.remove('running');
    setStatusReady();
}

function setStatus(text, state) {
    $('#status-text').textContent = text;
    const dot = $('#status-dot');
    dot.classList.remove('running', 'error');
    if (state) dot.classList.add(state);
}

function setStatusReady() {
    const langName = currentLanguage === 'python' ? 'Python' : 'C++';
    setStatus(`${langName} Ready`, '');
}

// ═══════════════════════════════════════════════════════
//  Panel Resizer
// ═══════════════════════════════════════════════════════

function initResizer() {
    const resizer   = $('#panel-resizer');
    const editorPnl = $('#editor-panel');
    const main      = $('#main');
    let startX, startWidth;

    resizer.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        startX = e.clientX;
        startWidth = editorPnl.offsetWidth;
        resizer.classList.add('active');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        function onMove(e) {
            const dx = e.clientX - startX;
            const newWidth = Math.max(280, Math.min(startWidth + dx, main.offsetWidth - 360));
            editorPnl.style.width = newWidth + 'px';
            editor.resize();
            renderGrid();
        }

        function onUp() {
            document.removeEventListener('pointermove', onMove);
            document.removeEventListener('pointerup', onUp);
            resizer.classList.remove('active');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }

        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
    });
}

// ═══════════════════════════════════════════════════════
//  Event Listeners
// ═══════════════════════════════════════════════════════

function initEventListeners() {
    // ─── Buttons ───
    $('#btn-run').addEventListener('click', onRun);
    $('#btn-stop').addEventListener('click', onStop);
    $('#btn-reset-viz').addEventListener('click', () => {
        if (!isRunning) {
            clearVisualization();
            clearConsole();
            appendToConsole('🔄 Visualization reset. Maze preserved.', 'info');
        }
    });
    $('#btn-clear-console').addEventListener('click', clearConsole);
    $('#btn-generate').addEventListener('click', () => {
        if (!isRunning) generateMaze();
    });
    $('#btn-clear-grid').addEventListener('click', () => {
        if (!isRunning) {
            clearGrid();
            clearConsole();
            appendToConsole('🗑️ Grid cleared.', 'info');
        }
    });

    // ─── Language Toggle ───
    $('#btn-lang-python').addEventListener('click', () => switchLanguage('python'));
    $('#btn-lang-cpp').addEventListener('click', () => switchLanguage('cpp'));

    // ─── Coords Toggle ───
    $('#btn-toggle-coords').addEventListener('click', () => {
        coordsVisible = !coordsVisible;
        $('#btn-toggle-coords').classList.toggle('active', coordsVisible);
        renderGrid();
    });

    // ─── Grid Size ───
    $('#grid-size').addEventListener('change', (e) => {
        if (!isRunning) {
            changeGridSize(parseInt(e.target.value));
        }
    });

    // ─── Tool Selection ───
    $$('.btn-tool').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.disabled) return;
            $$('.btn-tool').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTool = btn.dataset.tool;
        });
    });

    // ─── Grid Drawing ───
    const gridEl = $('#grid');

    gridEl.addEventListener('pointerdown', (e) => {
        if (isRunning) return;
        const pos = getCellFromEvent(e);
        if (!pos) return;
        isDrawing = true;
        handleCellInteraction(pos[0], pos[1]);
        gridEl.setPointerCapture(e.pointerId);
    });

    gridEl.addEventListener('pointermove', (e) => {
        if (!isDrawing || isRunning) return;
        const pos = getCellFromPointer(e);
        if (!pos) return;
        // For start/goal tools, only act once on initial click
        if (currentTool === 'wall' || currentTool === 'erase') {
            handleCellInteraction(pos[0], pos[1]);
        }
    });

    gridEl.addEventListener('pointerup', () => {
        isDrawing = false;
    });

    gridEl.addEventListener('pointerleave', () => {
        isDrawing = false;
    });

    // ─── Resizer ───
    initResizer();

    // ─── Window Resize ───
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            editor.resize();
            renderGrid();
        }, 150);
    });
}

function getCellFromPointer(e) {
    const gridEl = $('#grid');
    const rect = gridEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x < 0 || y < 0 || x >= rect.width || y >= rect.height) return null;

    // Calculate cell size (including gap)
    const cellW = rect.width / gridCols;
    const cellH = rect.height / gridRows;
    const col = Math.floor(x / cellW);
    const row = Math.floor(y / cellH);

    if (row < 0 || row >= gridRows || col < 0 || col >= gridCols) return null;
    return [row, col];
}

// ═══════════════════════════════════════════════════════
//  Bootstrap
// ═══════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', init);

# Implementation Plan: IDE-Style File Management

To fulfill your request for an experience where users can manage local files with tabs and seamless saving, we will build a **Multi-Tab File Manager** using the modern web **File System Access API**. 

This will turn the left panel of AlgoCode into a mini-IDE experience similar to VS Code.

## Proposed Changes

### 1. File Tabs UI (`index.html` & `styles.css`)
- Replace the static `algorithm.py` badge with a **scrollable tabs bar** above the editor.
- **Tab Features**:
  - Click to switch active file.
  - **Double-click** to rename the file.
  - Close (`×`) button on each tab.
  - Unsaved indicator (a small dot) if the file has unsaved changes.
- Add a **Toolbar**:
  - `+ New File` button.
  - `📁 Open` button.
  - `💾 Save` button.

### 2. File State Management (`app.js`)
We will replace the single-file cache with a robust state manager:
```javascript
let openFiles = [
    {
        id: "file_123",
        name: "algorithm.py",
        content: "...",
        language: "python", // 'python' or 'cpp'
        isDirty: false,     // true if unsaved changes exist
        fileHandle: null    // Reference to local disk file (if saved/opened)
    }
];
let activeFileId = "file_123";
```

### 3. Local Disk Integration (File System Access API)
We will use modern browser APIs to let the user pick a folder/file on their computer. 
- **Open File**: Calls `window.showOpenFilePicker()`. Reads the local file, creates a new tab, and stores the `fileHandle`.
- **Save File**: 
  - If it's a new file (no `fileHandle`), it calls `window.showSaveFilePicker()` so the user can choose *where* to save it and what to name it.
  - If it already has a `fileHandle` (previously saved/opened), hitting save simply writes the new data directly to that local file without prompting again (just like a real IDE).
  - *Fallback:* For browsers like Firefox/Safari that don't support this API yet, it will fall back to a standard `<input type="file">` upload and a standard file download.

### 4. Language & Execution Integration
- The language toggle (Python ↔ C++) will now operate on the **active tab**. 
- Switching the language of a tab will update its file extension (e.g., `.py` to `.cpp`).
- When the user clicks **Run**, the system executes the code from the currently active tab using the language set for that tab.

## User Review Required

> [!IMPORTANT]
> **Key UX Decisions:**
> 1. **Initial State:** When the user loads the app, should it always start with one default `algorithm.py` tab containing the template?
> 2. **Browser Support:** The seamless "Save" (without downloading a new copy every time) relies on the File System Access API, which works on Chromium browsers (Chrome, Edge, Opera). Safari and Firefox users will get the classic "Download as file" behavior. Is this acceptable?

Once you approve this architecture, I will begin implementing the UI and the file handling logic!

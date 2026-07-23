// ═══════════════════════════════════════════════════════
//  AlgoCode — C++ Coding Guide & Examples
// ═══════════════════════════════════════════════════════
//
//  Welcome! This file teaches you how to write algorithms
//  in C++ for the Pathfinding Sandbox. Copy any example
//  into the editor, hit Run, and watch it execute.
//
//  NOTE: C++ code runs via JSCPP (a browser-based C++
//  interpreter). It supports basic C++ but NOT the STL
//  (no vector, queue, map, etc). Use plain arrays instead.
//
//  Animation is BATCHED: your code runs to completion
//  first, then visualization commands are replayed with
//  animation. Use viz_sleep() to control replay speed.
//
// ═══════════════════════════════════════════════════════


// ┌─────────────────────────────────────────────────────┐
// │  SECTION 1: THE BASICS                              │
// └─────────────────────────────────────────────────────┘
//
//  AlgoCode provides these global functions:
//
//  ── GRID INFO ──
//
//    get_grid_cell(r, c)         // Returns 0 (empty) or 1 (wall)
//    get_start(r, c)             // Sets r, c to start position
//    get_goal(r, c)              // Sets r, c to goal position
//    get_grid_size(rows, cols)   // Sets rows, cols to grid dimensions
//
//  ── VISUALIZATION ──
//
//    visit(r, c)          // Blue    — "I looked at this cell"
//    open_node(r, c)      // Amber   — "This cell is in my frontier"
//    close_node(r, c)     // Purple  — "This cell is fully explored"
//    mark_path(r, c)      // Gold    — "This cell is on the final path"
//
//  ── ANIMATION ──
//
//    viz_sleep(ms)         // Controls animation replay speed
//    move_robot_to(r, c)  // Move robot to a cell
//
//  ── OUTPUT ──
//
//    cout << "text" << endl;   // Output to console
//
//
// ┌─────────────────────────────────────────────────────┐
// │  SECTION 2: YOUR FIRST SCRIPT                      │
// └─────────────────────────────────────────────────────┘
//
//  Copy this into the editor and press Run.
//  It reads grid info and prints it.
//
//  ── Example: Hello Grid ──
//
//  #include <iostream>
//  using namespace std;
//
//  int main() {
//      int start_r, start_c, goal_r, goal_c, rows, cols;
//      get_start(start_r, start_c);
//      get_goal(goal_r, goal_c);
//      get_grid_size(rows, cols);
//
//      cout << "Grid size: " << rows << " x " << cols << endl;
//      cout << "Start: (" << start_r << ", " << start_c << ")" << endl;
//      cout << "Goal: (" << goal_r << ", " << goal_c << ")" << endl;
//
//      // Color start and goal to confirm they work
//      visit(start_r, start_c);
//      open_node(goal_r, goal_c);
//      cout << "Done! Start is blue, goal is amber." << endl;
//
//      return 0;
//  }
//
//
// ┌─────────────────────────────────────────────────────┐
// │  SECTION 3: GETTING NEIGHBORS                      │
// └─────────────────────────────────────────────────────┘
//
//  Since we can't use vectors, we use output parameters
//  or arrays for neighbors:
//
//  // Store neighbors in arrays (max 4 for 4-connected)
//  int nr[4], nc[4], ncount;
//
//  void get_neighbors(int r, int c, int rows, int cols,
//                     int nr[], int nc[], int &ncount) {
//      ncount = 0;
//      int dr[] = {-1, 1, 0, 0};
//      int dc[] = {0, 0, -1, 1};
//      for (int i = 0; i < 4; i++) {
//          int newR = r + dr[i];
//          int newC = c + dc[i];
//          if (newR >= 0 && newR < rows && newC >= 0 && newC < cols
//              && get_grid_cell(newR, newC) == 0) {
//              nr[ncount] = newR;
//              nc[ncount] = newC;
//              ncount++;
//          }
//      }
//  }
//
//
// ┌─────────────────────────────────────────────────────┐
// │  SECTION 4: CONTROLLING ANIMATION SPEED            │
// └─────────────────────────────────────────────────────┘
//
//  viz_sleep(ms) controls the replay animation speed.
//  Call it periodically in your main loop.
//
//  Fast exploration:    viz_sleep(10)
//  Normal speed:        viz_sleep(30)
//  Slow / educational:  viz_sleep(100)
//  Frame-by-frame:      viz_sleep(500)
//


// ═══════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════
//
//       EXAMPLE 1: BREADTH-FIRST SEARCH (BFS)
//
// ═══════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════
//
//  BFS explores level by level using a FIFO queue.
//  Since JSCPP has no std::queue, we implement one
//  with arrays.
//
//  Copy everything below this line into the editor:
// ─────────────────────────────────────────────────────

// #include <iostream>
// using namespace std;
//
// int main() {
//     int start_r, start_c, goal_r, goal_c, rows, cols;
//     get_start(start_r, start_c);
//     get_goal(goal_r, goal_c);
//     get_grid_size(rows, cols);
//
//     // BFS queue (circular buffer)
//     int qr[2500], qc[2500];
//     int qfront = 0, qback = 0;
//
//     // Visited & parent tracking
//     int visited[50][50];
//     int parentR[50][50];
//     int parentC[50][50];
//     for (int i = 0; i < rows; i++)
//         for (int j = 0; j < cols; j++) {
//             visited[i][j] = 0;
//             parentR[i][j] = -1;
//             parentC[i][j] = -1;
//         }
//
//     // Enqueue start
//     qr[qback] = start_r;
//     qc[qback] = start_c;
//     qback++;
//     visited[start_r][start_c] = 1;
//
//     int found = 0;
//     int explored = 0;
//     int dr[] = {-1, 1, 0, 0};
//     int dc[] = {0, 0, -1, 1};
//
//     while (qfront < qback) {
//         int cr = qr[qfront];
//         int cc = qc[qfront];
//         qfront++;
//
//         close_node(cr, cc);
//         viz_sleep(15);
//         explored++;
//
//         if (cr == goal_r && cc == goal_c) {
//             found = 1;
//             cout << "Goal reached!" << endl;
//             break;
//         }
//
//         for (int i = 0; i < 4; i++) {
//             int nr = cr + dr[i];
//             int nc = cc + dc[i];
//             if (nr >= 0 && nr < rows && nc >= 0 && nc < cols
//                 && get_grid_cell(nr, nc) == 0
//                 && visited[nr][nc] == 0) {
//                 visited[nr][nc] = 1;
//                 parentR[nr][nc] = cr;
//                 parentC[nr][nc] = cc;
//                 qr[qback] = nr;
//                 qc[qback] = nc;
//                 qback++;
//                 open_node(nr, nc);
//             }
//         }
//     }
//
//     if (found == 1) {
//         // Reconstruct path
//         int pr[2500], pc[2500];
//         int plen = 0;
//         int cr = goal_r, cc = goal_c;
//         while (cr != -1) {
//             pr[plen] = cr;
//             pc[plen] = cc;
//             plen++;
//             int tr = parentR[cr][cc];
//             int tc = parentC[cr][cc];
//             cr = tr;
//             cc = tc;
//         }
//         // Mark path (reverse order)
//         for (int i = plen - 1; i >= 0; i--) {
//             mark_path(pr[i], pc[i]);
//         }
//         cout << "Path length: " << plen << " steps" << endl;
//         cout << "Nodes explored: " << explored << endl;
//
//         // Animate robot along path
//         viz_sleep(300);
//         for (int i = plen - 1; i >= 0; i--) {
//             move_robot_to(pr[i], pc[i]);
//         }
//     } else {
//         cout << "No path found!" << endl;
//     }
//
//     return 0;
// }


// ═══════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════
//
//       EXAMPLE 2: DEPTH-FIRST SEARCH (DFS)
//
// ═══════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════
//
//  DFS goes deep before backtracking. Uses a stack
//  (LIFO) implemented with arrays.
//
//  Copy everything below this line into the editor:
// ─────────────────────────────────────────────────────

// #include <iostream>
// using namespace std;
//
// int main() {
//     int start_r, start_c, goal_r, goal_c, rows, cols;
//     get_start(start_r, start_c);
//     get_goal(goal_r, goal_c);
//     get_grid_size(rows, cols);
//
//     // DFS stack
//     int sr[2500], sc[2500];
//     int stop = 0;
//
//     int visited[50][50];
//     int parentR[50][50];
//     int parentC[50][50];
//     for (int i = 0; i < rows; i++)
//         for (int j = 0; j < cols; j++) {
//             visited[i][j] = 0;
//             parentR[i][j] = -1;
//             parentC[i][j] = -1;
//         }
//
//     // Push start
//     sr[stop] = start_r;
//     sc[stop] = start_c;
//     stop++;
//     visited[start_r][start_c] = 1;
//
//     int found = 0;
//     int dr[] = {-1, 1, 0, 0};
//     int dc[] = {0, 0, -1, 1};
//
//     while (stop > 0) {
//         stop--;
//         int cr = sr[stop];
//         int cc = sc[stop];
//
//         close_node(cr, cc);
//         viz_sleep(15);
//
//         if (cr == goal_r && cc == goal_c) {
//             found = 1;
//             cout << "Goal reached!" << endl;
//             break;
//         }
//
//         for (int i = 0; i < 4; i++) {
//             int nr = cr + dr[i];
//             int nc = cc + dc[i];
//             if (nr >= 0 && nr < rows && nc >= 0 && nc < cols
//                 && get_grid_cell(nr, nc) == 0
//                 && visited[nr][nc] == 0) {
//                 visited[nr][nc] = 1;
//                 parentR[nr][nc] = cr;
//                 parentC[nr][nc] = cc;
//                 sr[stop] = nr;
//                 sc[stop] = nc;
//                 stop++;
//                 open_node(nr, nc);
//             }
//         }
//     }
//
//     if (found == 1) {
//         int pr[2500], pc[2500];
//         int plen = 0;
//         int cr = goal_r, cc = goal_c;
//         while (cr != -1) {
//             pr[plen] = cr;
//             pc[plen] = cc;
//             plen++;
//             int tr = parentR[cr][cc];
//             int tc = parentC[cr][cc];
//             cr = tr;
//             cc = tc;
//         }
//         for (int i = plen - 1; i >= 0; i--)
//             mark_path(pr[i], pc[i]);
//         cout << "Path length: " << plen << " (not shortest!)" << endl;
//         viz_sleep(300);
//         for (int i = plen - 1; i >= 0; i--)
//             move_robot_to(pr[i], pc[i]);
//     } else {
//         cout << "No path found!" << endl;
//     }
//
//     return 0;
// }


// ═══════════════════════════════════════════════════════
//
//       TIPS & TRICKS
//
// ═══════════════════════════════════════════════════════
//
//  🧪 EXPERIMENT IDEAS:
//
//     • Run BFS in Python, then the same in C++. Compare!
//     • Try implementing A* with a simple priority queue
//       (use a sorted insertion into an array).
//     • Add diagonal movement (8 directions instead of 4).
//
//  🐛 DEBUGGING TIPS:
//
//     • Use cout << liberally — output goes to the Console.
//     • JSCPP errors show line numbers — check the Console.
//     • If you get "JSCPP not loaded", refresh the page.
//     • Remember: no STL! Use plain arrays and loops.
//
//  ⚡ PERFORMANCE:
//
//     • For large grids, reduce viz_sleep: viz_sleep(5)
//     • Arrays are limited to 50×50 in the examples.
//       Increase if using larger grids (41×41 max).
//
//  📐 SUPPORTED C++ FEATURES:
//
//     ✓ Basic types (int, float, char, bool)
//     ✓ Arrays (1D and 2D)
//     ✓ Functions with pass-by-reference (&)
//     ✓ Loops (for, while, do-while)
//     ✓ Conditionals (if/else, switch)
//     ✓ cout / cin
//     ✗ STL containers (vector, queue, map, set)
//     ✗ Classes with inheritance
//     ✗ Templates
//     ✗ Exceptions (try/catch)
//
// ═══════════════════════════════════════════════════════

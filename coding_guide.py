# ═══════════════════════════════════════════════════════════
#  AlgoCode — Coding Guide & Examples
# ═══════════════════════════════════════════════════════════
#
#  Welcome! This file teaches you how to write algorithms
#  in the Pathfinding Sandbox. Copy any example into the
#  editor, hit Run, and watch it execute on the grid.
#
# ═══════════════════════════════════════════════════════════


# ┌─────────────────────────────────────────────────────────┐
# │  SECTION 1: THE BASICS                                  │
# └─────────────────────────────────────────────────────────┘
#
#  AlgoCode gives you a `visualizer` object. It has two
#  types of methods:
#
#  ── SYNCHRONOUS (instant, no 'await' needed) ──
#
#    Reading the grid:
#      grid       = visualizer.get_grid()       # 2D list: 0=empty, 1=wall
#      start      = visualizer.get_start()      # (row, col) tuple
#      goal       = visualizer.get_goal()       # (row, col) tuple
#      rows, cols = visualizer.get_grid_size()  # dimensions
#
#    Coloring cells:
#      visualizer.visit(node)       # Blue    — "I looked at this node"
#      visualizer.open(node)        # Amber   — "This node is in my frontier"
#      visualizer.close(node)       # Purple  — "This node is fully explored"
#      visualizer.path(node_list)   # Gold    — "This is the final path"
#
#  ── ASYNCHRONOUS (needs 'await') ──
#
#      await visualizer.sleep(ms)           # Pause so you can SEE the steps
#      await visualizer.move_robot(path)    # Animate 🤖 along a path
#
#
#  IMPORTANT RULES:
#    1. A 'node' is always a tuple: (row, col)
#    2. You MUST use 'await' before sleep() and move_robot()
#    3. Without sleep() calls, all cells update at once (too fast to see)
#    4. print() output appears in the Console panel below the editor
#    5. If your code has a bug, the traceback shows in the Console
#       and the error line is marked in the editor gutter
#
#
# ┌─────────────────────────────────────────────────────────┐
# │  SECTION 2: YOUR FIRST SCRIPT                          │
# └─────────────────────────────────────────────────────────┘
#
#  Copy this into the editor and press Run.
#  It just reads the grid info and prints it.
#
#  ── Example: Hello Grid ──
#
#  grid = visualizer.get_grid()
#  start = visualizer.get_start()
#  goal = visualizer.get_goal()
#  rows, cols = visualizer.get_grid_size()
#
#  print(f"Grid size: {rows} x {cols}")
#  print(f"Start: {start}")
#  print(f"Goal:  {goal}")
#  print(f"Walls: {sum(cell for row in grid for cell in row)}")
#
#  # Color start and goal to confirm they work
#  visualizer.visit(start)
#  visualizer.open(goal)
#  print("Done! Check the grid — start is blue, goal is amber.")
#
#
# ┌─────────────────────────────────────────────────────────┐
# │  SECTION 3: GETTING NEIGHBORS                          │
# └─────────────────────────────────────────────────────────┘
#
#  The visualizer does NOT give you neighbors — that's YOUR
#  job. Here's how to write a get_neighbors() function:
#
#  def get_neighbors(node, grid, rows, cols):
#      """Return walkable 4-connected neighbors."""
#      r, c = node
#      neighbors = []
#      for dr, dc in [(-1,0), (1,0), (0,-1), (0,1)]:  # Up, Down, Left, Right
#          nr, nc = r + dr, c + dc
#          if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 0:
#              neighbors.append((nr, nc))
#      return neighbors
#
#  Want 8-directional movement? Add diagonals:
#
#  directions = [(-1,0),(1,0),(0,-1),(0,1),(-1,-1),(-1,1),(1,-1),(1,1)]
#
#
# ┌─────────────────────────────────────────────────────────┐
# │  SECTION 4: CONTROLLING ANIMATION SPEED                │
# └─────────────────────────────────────────────────────────┘
#
#  await visualizer.sleep(ms) is your speed controller.
#
#  Fast exploration:    await visualizer.sleep(10)
#  Normal speed:        await visualizer.sleep(30)
#  Slow / educational:  await visualizer.sleep(100)
#  Frame-by-frame:      await visualizer.sleep(500)
#
#  Put sleep() inside your main loop to animate each step.
#  Without it, everything happens instantly.
#
#
# ┌─────────────────────────────────────────────────────────┐
# │  SECTION 5: TYPICAL ALGORITHM STRUCTURE                │
# └─────────────────────────────────────────────────────────┘
#
#  Most pathfinding algorithms follow this skeleton:
#
#  1. Read the grid, start, goal
#  2. Initialize your data structures (queue, visited set, etc.)
#  3. Main loop:
#       a. Pick next node to explore
#       b. Check if it's the goal
#       c. Mark it as visited/closed in the visualizer
#       d. Get its neighbors
#       e. For each neighbor: add to frontier, mark as open
#       f. await visualizer.sleep(ms) to animate
#  4. Reconstruct and display the path
#  5. await visualizer.move_robot(path) for the robot animation


# ═══════════════════════════════════════════════════════════
# ═══════════════════════════════════════════════════════════
#
#       EXAMPLE 1: BREADTH-FIRST SEARCH (BFS)
#
# ═══════════════════════════════════════════════════════════
# ═══════════════════════════════════════════════════════════
#
#  BFS explores level by level using a FIFO queue.
#  It guarantees the shortest path in an unweighted grid.
#
#  Copy everything below this line into the editor:
# ─────────────────────────────────────────────────────────

# from collections import deque
#
# # ── Read grid ──
# grid = visualizer.get_grid()
# start = visualizer.get_start()
# goal = visualizer.get_goal()
# rows, cols = visualizer.get_grid_size()
#
# def get_neighbors(node):
#     r, c = node
#     for dr, dc in [(-1,0), (1,0), (0,-1), (0,1)]:
#         nr, nc = r + dr, c + dc
#         if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 0:
#             yield (nr, nc)
#
# # ── BFS ──
# queue = deque([start])
# came_from = {start: None}
#
# found = False
# while queue:
#     current = queue.popleft()
#     visualizer.close(current)
#     await visualizer.sleep(15)
#
#     if current == goal:
#         found = True
#         print("🎯 Goal reached!")
#         break
#
#     for neighbor in get_neighbors(current):
#         if neighbor not in came_from:
#             came_from[neighbor] = current
#             queue.append(neighbor)
#             visualizer.open(neighbor)
#
# # ── Reconstruct path ──
# if found:
#     path = []
#     node = goal
#     while node is not None:
#         path.append(node)
#         node = came_from[node]
#     path.reverse()
#
#     visualizer.path(path)
#     print(f"📏 Path length: {len(path)} steps")
#     print(f"🔍 Nodes explored: {len(came_from)}")
#
#     await visualizer.sleep(300)
#     await visualizer.move_robot(path)
# else:
#     print("❌ No path found!")


# ═══════════════════════════════════════════════════════════
# ═══════════════════════════════════════════════════════════
#
#       EXAMPLE 2: A* SEARCH
#
# ═══════════════════════════════════════════════════════════
# ═══════════════════════════════════════════════════════════
#
#  A* uses f(n) = g(n) + h(n)
#    g(n) = cost from start to n
#    h(n) = heuristic estimate from n to goal
#
#  It explores the most promising nodes first.
#
#  Copy everything below this line into the editor:
# ─────────────────────────────────────────────────────────

# import heapq
#
# # ── Read grid ──
# grid = visualizer.get_grid()
# start = visualizer.get_start()
# goal = visualizer.get_goal()
# rows, cols = visualizer.get_grid_size()
#
# def get_neighbors(node):
#     r, c = node
#     for dr, dc in [(-1,0), (1,0), (0,-1), (0,1)]:
#         nr, nc = r + dr, c + dc
#         if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 0:
#             yield (nr, nc)
#
# def heuristic(a, b):
#     """Manhattan distance."""
#     return abs(a[0] - b[0]) + abs(a[1] - b[1])
#
# # ── A* ──
# open_set = []
# heapq.heappush(open_set, (0, start))
#
# came_from = {start: None}
# g_score = {start: 0}
#
# found = False
# explored = 0
#
# while open_set:
#     f_current, current = heapq.heappop(open_set)
#
#     if current == goal:
#         found = True
#         print("🎯 Goal reached!")
#         break
#
#     visualizer.close(current)
#     explored += 1
#     await visualizer.sleep(15)
#
#     for neighbor in get_neighbors(current):
#         tentative_g = g_score[current] + 1
#
#         if neighbor not in g_score or tentative_g < g_score[neighbor]:
#             g_score[neighbor] = tentative_g
#             f_score = tentative_g + heuristic(neighbor, goal)
#             heapq.heappush(open_set, (f_score, neighbor))
#             came_from[neighbor] = current
#             visualizer.open(neighbor)
#
# # ── Reconstruct path ──
# if found:
#     path = []
#     node = goal
#     while node is not None:
#         path.append(node)
#         node = came_from[node]
#     path.reverse()
#
#     visualizer.path(path)
#     print(f"📏 Path length: {len(path)} steps")
#     print(f"🔍 Nodes explored: {explored}")
#
#     await visualizer.sleep(300)
#     await visualizer.move_robot(path)
# else:
#     print("❌ No path found!")


# ═══════════════════════════════════════════════════════════
# ═══════════════════════════════════════════════════════════
#
#       EXAMPLE 3: DIJKSTRA'S ALGORITHM
#
# ═══════════════════════════════════════════════════════════
# ═══════════════════════════════════════════════════════════
#
#  Dijkstra is like A* but with h(n) = 0.
#  It explores in all directions equally (no heuristic bias).
#  Great for comparing against A* to see the difference.
#
#  Copy everything below this line into the editor:
# ─────────────────────────────────────────────────────────

# import heapq
#
# grid = visualizer.get_grid()
# start = visualizer.get_start()
# goal = visualizer.get_goal()
# rows, cols = visualizer.get_grid_size()
#
# def get_neighbors(node):
#     r, c = node
#     for dr, dc in [(-1,0), (1,0), (0,-1), (0,1)]:
#         nr, nc = r + dr, c + dc
#         if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 0:
#             yield (nr, nc)
#
# # ── Dijkstra ──
# open_set = []
# heapq.heappush(open_set, (0, start))
# came_from = {start: None}
# cost = {start: 0}
# found = False
# explored = 0
#
# while open_set:
#     current_cost, current = heapq.heappop(open_set)
#
#     if current == goal:
#         found = True
#         print("🎯 Goal reached!")
#         break
#
#     if current_cost > cost.get(current, float('inf')):
#         continue  # Skip stale entries
#
#     visualizer.close(current)
#     explored += 1
#     await visualizer.sleep(10)
#
#     for neighbor in get_neighbors(current):
#         new_cost = cost[current] + 1
#         if neighbor not in cost or new_cost < cost[neighbor]:
#             cost[neighbor] = new_cost
#             heapq.heappush(open_set, (new_cost, neighbor))
#             came_from[neighbor] = current
#             visualizer.open(neighbor)
#
# if found:
#     path = []
#     node = goal
#     while node is not None:
#         path.append(node)
#         node = came_from[node]
#     path.reverse()
#     visualizer.path(path)
#     print(f"📏 Path length: {len(path)} steps")
#     print(f"🔍 Nodes explored: {explored}")
#     await visualizer.sleep(300)
#     await visualizer.move_robot(path)
# else:
#     print("❌ No path found!")


# ═══════════════════════════════════════════════════════════
# ═══════════════════════════════════════════════════════════
#
#       EXAMPLE 4: DEPTH-FIRST SEARCH (DFS)
#
# ═══════════════════════════════════════════════════════════
# ═══════════════════════════════════════════════════════════
#
#  DFS goes as deep as possible before backtracking.
#  It does NOT guarantee the shortest path, but it's
#  interesting to watch — you can see the snake-like
#  exploration pattern.
#
#  Copy everything below this line into the editor:
# ─────────────────────────────────────────────────────────

# grid = visualizer.get_grid()
# start = visualizer.get_start()
# goal = visualizer.get_goal()
# rows, cols = visualizer.get_grid_size()
#
# def get_neighbors(node):
#     r, c = node
#     for dr, dc in [(-1,0), (1,0), (0,-1), (0,1)]:
#         nr, nc = r + dr, c + dc
#         if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 0:
#             yield (nr, nc)
#
# # ── DFS ──
# stack = [start]
# came_from = {start: None}
# found = False
#
# while stack:
#     current = stack.pop()
#
#     if current == goal:
#         found = True
#         print("🎯 Goal reached!")
#         break
#
#     visualizer.close(current)
#     await visualizer.sleep(15)
#
#     for neighbor in get_neighbors(current):
#         if neighbor not in came_from:
#             came_from[neighbor] = current
#             stack.append(neighbor)
#             visualizer.open(neighbor)
#
# if found:
#     path = []
#     node = goal
#     while node is not None:
#         path.append(node)
#         node = came_from[node]
#     path.reverse()
#     visualizer.path(path)
#     print(f"📏 Path length: {len(path)} steps (not necessarily shortest!)")
#     print(f"🔍 Nodes explored: {len(came_from)}")
#     await visualizer.sleep(300)
#     await visualizer.move_robot(path)
# else:
#     print("❌ No path found!")


# ═══════════════════════════════════════════════════════════
# ═══════════════════════════════════════════════════════════
#
#       EXAMPLE 5: GREEDY BEST-FIRST SEARCH
#
# ═══════════════════════════════════════════════════════════
# ═══════════════════════════════════════════════════════════
#
#  Greedy BFS only uses the heuristic h(n) — no g(n).
#  It races toward the goal but can find suboptimal paths.
#  Compare it with A* on the same maze to see the difference.
#
#  Copy everything below this line into the editor:
# ─────────────────────────────────────────────────────────

# import heapq
#
# grid = visualizer.get_grid()
# start = visualizer.get_start()
# goal = visualizer.get_goal()
# rows, cols = visualizer.get_grid_size()
#
# def get_neighbors(node):
#     r, c = node
#     for dr, dc in [(-1,0), (1,0), (0,-1), (0,1)]:
#         nr, nc = r + dr, c + dc
#         if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 0:
#             yield (nr, nc)
#
# def heuristic(a, b):
#     return abs(a[0] - b[0]) + abs(a[1] - b[1])
#
# # ── Greedy Best-First ──
# open_set = []
# heapq.heappush(open_set, (heuristic(start, goal), start))
# came_from = {start: None}
# found = False
# explored = 0
#
# while open_set:
#     _, current = heapq.heappop(open_set)
#
#     if current == goal:
#         found = True
#         print("🎯 Goal reached!")
#         break
#
#     if current in came_from and current != start:
#         visualizer.close(current)
#         explored += 1
#         await visualizer.sleep(15)
#
#     for neighbor in get_neighbors(current):
#         if neighbor not in came_from:
#             came_from[neighbor] = current
#             heapq.heappush(open_set, (heuristic(neighbor, goal), neighbor))
#             visualizer.open(neighbor)
#
# if found:
#     path = []
#     node = goal
#     while node is not None:
#         path.append(node)
#         node = came_from[node]
#     path.reverse()
#     visualizer.path(path)
#     print(f"📏 Path length: {len(path)} steps (may not be optimal!)")
#     print(f"🔍 Nodes explored: {explored}")
#     await visualizer.sleep(300)
#     await visualizer.move_robot(path)
# else:
#     print("❌ No path found!")


# ═══════════════════════════════════════════════════════════
#
#       TIPS & TRICKS
#
# ═══════════════════════════════════════════════════════════
#
#  🧪 EXPERIMENT IDEAS:
#
#     • Run BFS then A* on the same maze. Compare nodes explored.
#     • Try different heuristics: Manhattan, Euclidean, Chebyshev.
#     • Add diagonal movement and see how paths change.
#     • Try weighted grids (modify get_neighbors to return costs).
#     • Write your own maze generator in Python!
#
#  🐛 DEBUGGING TIPS:
#
#     • Use print() liberally — output goes to the Console.
#     • If nothing appears on the grid, you probably forgot
#       'await visualizer.sleep(ms)' — without it, cells update
#       but the browser can't repaint until your code finishes.
#     • If you get "Execution stopped", your code was interrupted
#       via the Stop button. The grid stays intact.
#     • If you see "InterruptedError", that's the stop mechanism —
#       it's normal, not a bug.
#
#  ⚡ PERFORMANCE:
#
#     • For large grids (41×41), reduce sleep time: sleep(5)
#     • For small grids (15×15), increase it: sleep(50)
#     • The robot animation has its own speed via the delay
#       parameter: await visualizer.move_robot(path, delay=100)
#
#  📐 HEURISTIC FUNCTIONS TO TRY:
#
#     # Manhattan (best for 4-directional grids)
#     def h(a, b): return abs(a[0]-b[0]) + abs(a[1]-b[1])
#
#     # Euclidean (best for any-angle movement)
#     import math
#     def h(a, b): return math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2)
#
#     # Chebyshev (best for 8-directional grids)
#     def h(a, b): return max(abs(a[0]-b[0]), abs(a[1]-b[1]))
#
#     # Octile (accurate for 8-directional with √2 diagonal cost)
#     import math
#     def h(a, b):
#         dx, dy = abs(a[0]-b[0]), abs(a[1]-b[1])
#         return max(dx, dy) + (math.sqrt(2) - 1) * min(dx, dy)
#
# ═══════════════════════════════════════════════════════════

# Antigravity Operational Directives

## Token Efficiency & Anti-Loop Rules
1. **Act on Existing Context**: If a bug analysis, root cause, or file location is already established in the conversation history or session summary, DO NOT re-read or browse those files again. Proceed directly to applying edits with `replace_file_content` or running tests.
2. **Strict Read Limit**: Never inspect or call `view_file` on the same file more than twice in a single turn. Never read overlapping line ranges.
3. **No Redundant Scanning**: Do not browse large files line-by-line. Use targeted ripgrep (`grep_search`) if a symbol location is unknown, or go straight to editing.
4. **Action-Oriented Execution**: Transition from analysis to code modification within 1-2 tool calls maximum. Prioritize applying the fix and running typecheck/build.
5. **Direct Responses**: When asked a direct question, answer immediately without performing exploratory file reads unless specifically asked to check a file.

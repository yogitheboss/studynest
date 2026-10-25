const TASK_LINE = /^\s*[-*+]\s+\[[ xX]\]\s+(.*\S)\s*$/;

/**
 * Split a voice note's markdown into checklist items ("- [ ] buy notebook")
 * and everything else, which becomes notes to remember.
 */
export const splitChecklist = (
  markdown: string
): { tasks: string[]; rest: string } => {
  const tasks: string[] = [];
  const rest: string[] = [];
  for (const line of markdown.split("\n")) {
    const match = TASK_LINE.exec(line);
    if (match) tasks.push(match[1]);
    else rest.push(line);
  }
  return { tasks, rest: rest.join("\n").trim() };
};

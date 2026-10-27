/** The named site's pattern map, told to every judge the same way. When the person asks for a page like a named site,
 *  that site's patterns are the brief: a judge that marks them down as decoration, stand-ins or the wrong medium is
 *  penalising what was asked for. One wording per role, so every judge reads the same intent. */
import {existsSync, readFileSync} from 'node:fs';

const ROLE = {
  critic: 'Never count a listed pattern as slop, decoration, a stand-in or a cliché. Judge only whether it is carried at the reference\'s level and in this brand\'s own way.',
  photo: 'The image medium, subjects and treatment listed there are intended. Judge each image as convincing in that medium (a painting as a painting, a sculpture as a sculpture), never against photography, and keep that medium in any better prompt.',
  detail: 'Do not flag a listed pattern as a defect. Judge the craft of how it is executed.',
  motion: 'The named site\'s motion is the target. Do not ask for scenes, pinned sections or effects that the reference does not have; judge how well its own motion is carried.',
};

export function namedIntent(path, role) {
  if (!path || !existsSync(path)) return '';
  const map = readFileSync(path, 'utf8').trim().slice(0, 2400);
  return `\nThe person asked for a page like a named site. The designer's pattern map lists that site's patterns and how this brand carries each:\n${map}\n${ROLE[role]}\n`;
}

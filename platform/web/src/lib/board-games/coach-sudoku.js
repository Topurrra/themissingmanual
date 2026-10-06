// Names each Sudoku hint's technique and points to the Sudoku From Zero phase that teaches it.
const TECHNIQUES = {
  'naked-single': { name: 'Naked single', guide: '/guides/sudoku-from-zero/2' },
  'hidden-single': { name: 'Hidden single', guide: '/guides/sudoku-from-zero/2' },
  'locked-candidates': { name: 'Locked candidates', guide: '/guides/sudoku-from-zero/3' },
  'naked-pair': { name: 'Naked pair', guide: '/guides/sudoku-from-zero/3' }
};

export function techniqueInfo(technique) {
  return TECHNIQUES[technique] ?? { name: 'Deduction', guide: '/guides/sudoku-from-zero/2' };
}

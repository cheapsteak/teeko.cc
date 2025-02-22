export const SIZE = 5;
export const SLOTS = SIZE * SIZE;

export enum Player {
  A,
  B,
}

export type Board = {
  a: number; // Where blue has pieces (bitset)
  b: number; // Where red has pieces (bitset)
  m: Array<number | [number, number]>; // Actions, either drop or move
  p: boolean; // Playing or not
};

export function emptyBoard(): Board {
  return {
    a: 0,
    b: 0,
    m: [],
    p: true,
  };
}

export function pieces(n: number): Set<number> {
  const result: Array<number> = [];
  for (let i = 0; i < SLOTS; i++) {
    if (n & 1) result.push(i);
    n >>= 1;
  }
  return new Set(result);
}

// From north clockwise
export const DIRECTIONS: number[] = [-5, -4, 1, 6, 5, 4, -1, -6];

export const DELTA_TO_DIRECTIONS: Record<number, number> = {
  [-5]: 0,
  [-4]: 1,
  [1]: 2,
  [6]: 3,
  [5]: 4,
  [4]: 5,
  [-1]: 6,
  [-6]: 7,
};

type Delta = {
  dx: number;
  dy: number;
};

export const DIRECTION_TO_DELTAS: Delta[] = [
  { dx: 0, dy: -1 },
  { dx: 1, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 1, dy: 1 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 1 },
  { dx: -1, dy: 0 },
  { dx: -1, dy: -1 },
];

export const NEIGHS_BY_POSITION = [
  98, 229, 458, 916, 776, 3139, 7335, 14670, 29340, 24856, 100448, 234720,
  469440, 938880, 795392, 3214336, 7511040, 15022080, 30044160, 25452544,
  2195456, 5472256, 10944512, 21889024, 9175040,
];

export const WINNING_POSITIONS = new Set([
  99, 198, 396, 792, 3168, 6336, 12672, 25344, 101376, 202752, 405504, 811008,
  3244032, 6488064, 12976128, 25952256, 15, 30, 480, 960, 15360, 30720, 491520,
  983040, 15728640, 31457280, 33825, 67650, 135300, 270600, 541200, 1082400,
  2164800, 4329600, 8659200, 17318400, 266305, 532610, 8521760, 17043520, 34952,
  69904, 1118464, 2236928,
]);

export function x(pos: number) {
  return pos % SIZE;
}

export function y(pos: number) {
  return Math.floor(pos / SIZE);
}

export type State = {
  board: Board;
};

export type Message = {
  join?: string;
  pop?: number;
  st?: State;
};

export function computeMove(board: Board, from: number, to: number) {
  let { a, b, m, p } = board;
  const t = m.length % 2;
  const isA = t === 0;
  m = [...m, [from, to]];

  const [ours, theirs] = isA ? [a, b] : [b, a];
  if (!(ours & (1 << from))) return;
  if (ours & (1 << to)) return;
  if (theirs & (1 << to)) return;
  const result = (ours & ~(1 << from)) | (1 << to);
  if (isA) {
    a = result;
  } else {
    b = result;
  }
  return { a, b, m, p };
}

export function computeDrop(board: Board, pos: number) {
  let { a, b, m, p } = board;
  const t = m.length % 2;
  const isA = t === 0;
  m = [...m, pos];

  const [target, other] = isA ? [a, b] : [b, a];
  if (other & (1 << pos)) return;
  const result = target | (1 << pos);
  if (isA) a = result;
  else b = result;
  return { a, b, m, p };
}

export function computeUndo(board: Board) {
  let { a, b, m: om, p } = board;
  const wasA = om.length % 2 === 1;
  const m = om.slice(0, -1);
  const last = om.length > 0 ? om[m.length] : undefined;
  if (last === undefined) return;

  const target = wasA ? a : b;
  if (Array.isArray(last)) {
    const [to, from] = last;
    const result = (target & ~(1 << from)) | (1 << to);
    if (wasA) a = result;
    else b = result;
    return { a, b, m, p };
  } else {
    const result = target & ~(1 << last);
    if (wasA) a = result;
    else b = result;
    return { a, b, m, p };
  }
}

export function computeReset(board: Board) {
  let { p } = board;
  return { a: 0, b: 0, m: [], p: true };
}

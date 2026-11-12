import type { ModelStats } from '../api';

export const emptyModelStats = (): ModelStats => ({ photos: 0, tiles: 0, wrong: 0, silentWrong: 0, flagged: 0, flaggedWrong: 0, missed: 0, extra: 0, flowersWrong: 0, perfectPhotos: 0, confusions: {} });

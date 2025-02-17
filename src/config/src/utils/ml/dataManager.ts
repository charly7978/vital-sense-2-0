
import { TrainingData } from './types';

export class MLDataManager {
  private memoryBuffer: TrainingData[] = [];
  private readonly maxMemoryEntries: number;

  constructor(maxEntries: number = 1000) {
    this.maxMemoryEntries = maxEntries;
  }

  addData(trainingData: number[][], targetData: number[][]) {
    const newData: TrainingData[] = trainingData.map((input, index) => ({
      input,
      output: targetData[index]
    }));

    this.memoryBuffer.push(...newData);

    if (this.memoryBuffer.length > this.maxMemoryEntries) {
      this.memoryBuffer = this.memoryBuffer.slice(-this.maxMemoryEntries);
    }
  }

  getShuffledData(): TrainingData[] {
    return this.shuffleArray([...this.memoryBuffer]);
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  clear() {
    this.memoryBuffer = [];
  }

  get size(): number {
    return this.memoryBuffer.length;
  }
}

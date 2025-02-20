
export class CircularBuffer {
  private buffer: number[];
  private size: number;
  private pointer: number = 0;

  constructor(size: number) {
    this.size = size;
    this.buffer = new Array(size).fill(0);
  }

  push(value: number): void {
    this.buffer[this.pointer] = value;
    this.pointer = (this.pointer + 1) % this.size;
  }

  getData(): number[] {
    return [...this.buffer.slice(this.pointer), ...this.buffer.slice(0, this.pointer)];
  }

  get(): number[] {
    return this.getData();
  }

  clear(): void {
    this.buffer.fill(0);
    this.pointer = 0;
  }
}


export class AdaptiveThreshold {
  private _current: number;
  private _min: number;
  private _max: number;
  private _alpha: number;

  constructor(initial: number = 0.5, min: number = 0, max: number = 1, alpha: number = 0.1) {
    this._current = initial;
    this._min = min;
    this._max = max;
    this._alpha = alpha;
  }

  get current(): number {
    return this._current;
  }

  get min(): number {
    return this._min;
  }

  get max(): number {
    return this._max;
  }

  get alpha(): number {
    return this._alpha;
  }

  update(value: number, confidence: number = 1): void {
    // Actualizar el umbral usando media móvil exponencial
    const delta = confidence * (value - this._current);
    this._current += this._alpha * delta;
    
    // Asegurar que el umbral se mantenga dentro de los límites
    this._current = Math.max(this._min, Math.min(this._max, this._current));
  }
}

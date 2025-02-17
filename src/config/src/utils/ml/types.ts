
import * as tf from "@tensorflow/tfjs";

export interface TrainingData {
  input: number[];
  output: number[];
}

export interface ModelConfig {
  inputUnits: number;
  hiddenUnits: number;
  learningRate: number;
  dropoutRate: number;
  l2Regularization: number;
}

export interface ModelStats {
  isTrained: boolean;
  isTraining: boolean;
  memoryBufferSize: number;
  modelConfig: ModelConfig;
  defaultValues: number[];
}

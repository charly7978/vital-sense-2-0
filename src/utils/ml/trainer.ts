
import * as tf from "@tensorflow/tfjs";
import { ModelConfig } from './types';

export class MLTrainer {
  async trainModel(
    model: tf.Sequential,
    inputData: number[][],
    outputData: number[][],
    onEpochEnd?: (epoch: number, logs: tf.Logs) => void
  ): Promise<tf.History> {
    let tensors: { xs: tf.Tensor2D; ys: tf.Tensor2D } | null = null;

    try {
      tensors = {
        xs: tf.tensor2d(inputData),
        ys: tf.tensor2d(outputData)
      };

      await tf.engine().startScope();
      return await model.fit(tensors.xs, tensors.ys, {
        epochs: 50,
        batchSize: 32,
        validationSplit: 0.2,
        shuffle: true,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (logs && onEpochEnd) {
              onEpochEnd(epoch, logs);
            }
          }
        }
      });
    } finally {
      if (tensors) {
        tensors.xs.dispose();
        tensors.ys.dispose();
      }
      await tf.engine().endScope();
    }
  }

  initializeModel(config: ModelConfig): tf.Sequential {
    const model = tf.sequential();

    model.add(tf.layers.dense({
      inputShape: [3],
      units: config.inputUnits,
      activation: "relu",
      kernelRegularizer: tf.regularizers.l2({ l2: config.l2Regularization })
    }));

    model.add(tf.layers.dropout({ rate: config.dropoutRate }));

    model.add(tf.layers.dense({
      units: config.hiddenUnits,
      activation: "relu",
      kernelRegularizer: tf.regularizers.l2({ l2: config.l2Regularization })
    }));

    model.add(tf.layers.dense({
      units: 3,
      activation: "linear"
    }));

    model.compile({
      optimizer: tf.train.adam(config.learningRate),
      loss: "meanSquaredError",
      metrics: ["mse"]
    });

    return model;
  }
}

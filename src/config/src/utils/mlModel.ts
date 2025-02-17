
import * as tf from "@tensorflow/tfjs";
import { MLDataManager } from './ml/dataManager';
import { MLTrainer } from './ml/trainer';
import { MLPredictor } from '../../../utils/ml/predictor'; // Actualizada la ruta
import { ModelConfig, ModelStats } from './ml/types';

export class MLModel {
  private model: tf.Sequential;
  private isTrained: boolean = false;
  private readonly defaultValues = [25, 0.5, 0.35];
  private currentTraining: Promise<void> | null = null;
  private readonly modelConfig: ModelConfig = {
    inputUnits: 16,
    hiddenUnits: 8,
    learningRate: 0.001,
    dropoutRate: 0.2,
    l2Regularization: 0.01
  };

  private readonly dataManager: MLDataManager;
  private readonly trainer: MLTrainer;
  private readonly predictor: MLPredictor;

  constructor() {
    this.dataManager = new MLDataManager(1000);
    this.trainer = new MLTrainer();
    this.predictor = new MLPredictor();
    this.model = this.trainer.initializeModel(this.modelConfig);
  }

  async trainModel(trainingData: number[][], targetData: number[][]): Promise<void> {
    if (trainingData.length < 10) {
      console.log("⚠ Datos insuficientes para entrenar");
      return;
    }

    try {
      if (this.currentTraining) {
        console.log("⚠ Esperando a que termine el entrenamiento anterior...");
        await this.currentTraining;
      }

      console.log("✓ Iniciando nuevo entrenamiento del modelo");
      this.currentTraining = this.executeTraining(trainingData, targetData);
      await this.currentTraining;

    } catch (error) {
      console.error("Error entrenando modelo:", error);
      this.handleModelError(error);
    } finally {
      this.currentTraining = null;
    }
  }

  private async executeTraining(trainingData: number[][], targetData: number[][]): Promise<void> {
    this.dataManager.addData(trainingData, targetData);
    const shuffledData = this.dataManager.getShuffledData();
    
    const inputData = shuffledData.map(d => d.input);
    const outputData = shuffledData.map(d => d.output);

    const history = await this.trainer.trainModel(
      this.model,
      inputData,
      outputData,
      (epoch, logs) => {
        if (logs) {
          console.log(
            `Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}, ` +
            `val_loss = ${logs.val_loss.toFixed(4)}, ` +
            `mse = ${logs.mse.toFixed(4)}`
          );
        }
      }
    );

    this.isTrained = true;
    console.log("✔ Modelo ML entrenado correctamente", {
      finalLoss: history.history.loss[history.history.loss.length - 1],
      finalValLoss: history.history.val_loss[history.history.val_loss.length - 1],
      finalMSE: history.history.mse[history.history.mse.length - 1]
    });
  }

  private handleModelError(error: any) {
    console.error("Detalles del error:", {
      message: error.message,
      stack: error.stack,
      modelState: this.isTrained ? "Entrenado" : "No entrenado",
      memoryBufferSize: this.dataManager.size,
      isTraining: this.currentTraining !== null
    });
  }

  async predictOptimizedSettings(inputData: number[]): Promise<number[]> {
    if (!this.isTrained) {
      console.log("⚠ Modelo ML no entrenado. Usando valores por defecto");
      return this.defaultValues;
    }

    try {
      const result = await this.predictor.predict(this.model, inputData);
      const clampedResult = this.predictor.clampPrediction(result);

      console.log("Predicción ML:", {
        entrada: inputData,
        original: result,
        ajustada: clampedResult,
        confianza: this.predictor.calculateConfidence(result, clampedResult)
      });
      
      return clampedResult;
    } catch (error) {
      console.error("Error en predicción:", error);
      this.handleModelError(error);
      return this.defaultValues;
    }
  }

  clearMemory() {
    this.dataManager.clear();
    this.isTrained = false;
    this.currentTraining = null;
    console.log("Memoria del modelo limpiada");
  }

  getModelStats(): ModelStats {
    return {
      isTrained: this.isTrained,
      isTraining: this.currentTraining !== null,
      memoryBufferSize: this.dataManager.size,
      modelConfig: this.modelConfig,
      defaultValues: this.defaultValues
    };
  }
}

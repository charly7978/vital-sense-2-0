const MLX90614_CALIBRATION = {
    offset: -2.5,
    samplingRate: 100, // ms
    readingsCount: 10,
    minValidTemp: 35,
    maxValidTemp: 42
};

class TemperatureSensor {
    constructor(mlx) {
        this.mlx = mlx;
        this.lastReadings = [];
    }

    async readTemperature() {
        try {
            const rawTemp = await this.getAverageTemperature();
            const calibratedTemp = this.calibrateTemperature(rawTemp);
            return this.validateTemperature(calibratedTemp);
        } catch (error) {
            throw new Error(`Error en lectura de temperatura: ${error.message}`);
        }
    }

    async getAverageTemperature() {
        this.lastReadings = [];
        
        for(let i = 0; i < MLX90614_CALIBRATION.readingsCount; i++) {
            const reading = await this.mlx.readObjectTempC();
            this.lastReadings.push(reading);
            await this.delay(MLX90614_CALIBRATION.samplingRate);
        }

        // Eliminar valores atípicos
        const sortedReadings = [...this.lastReadings].sort((a, b) => a - b);
        const filteredReadings = sortedReadings.slice(1, -1); // Eliminar el valor más alto y más bajo
        
        return filteredReadings.reduce((sum, val) => sum + val, 0) / filteredReadings.length;
    }

    calibrateTemperature(rawTemp) {
        return rawTemp + MLX90614_CALIBRATION.offset;
    }

    validateTemperature(temp) {
        if (temp < MLX90614_CALIBRATION.minValidTemp || temp > MLX90614_CALIBRATION.maxValidTemp) {
            throw new Error('Temperatura fuera de rango válido');
        }
        return Number(temp.toFixed(1)); // Redondear a 1 decimal
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

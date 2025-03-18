// VocalRemoverProcessor.js
// Este arquivo define um AudioWorkletProcessor para remoção de vocais em tempo real

class VocalRemoverProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.intensity = 1.0; // Intensidade da remoção (1.0 = máxima)
  }

  // Método chamado para processar cada bloco de áudio
  process(inputs, outputs, parameters) {
    // Verificar se temos entrada e saída
    if (inputs.length === 0 || outputs.length === 0) {
      return true;
    }

    const input = inputs[0];
    const output = outputs[0];

    // Verificar se temos pelo menos dois canais (estéreo)
    if (input.length >= 2 && output.length >= 2) {
      const leftChannel = input[0];
      const rightChannel = input[1];
      const leftOutput = output[0];
      const rightOutput = output[1];

      // Aplicar técnica de cancelamento de fase para remover vocais centrais
      for (let i = 0; i < leftChannel.length; i++) {
        // A voz geralmente está no centro da mixagem (igual nos dois canais)
        // Subtrair um canal do outro cancela o conteúdo central (voz)
        // e mantém o conteúdo lateral (instrumentos)
        leftOutput[i] = (leftChannel[i] - rightChannel[i] * this.intensity);
        rightOutput[i] = (rightChannel[i] - leftChannel[i] * this.intensity);
      }
    } else if (input.length === 1 && output.length >= 1) {
      // Para áudio mono, não podemos fazer remoção de voz efetiva
      // Apenas copiamos o sinal
      const monoChannel = input[0];
      const monoOutput = output[0];

      for (let i = 0; i < monoChannel.length; i++) {
        monoOutput[i] = monoChannel[i];
      }

      // Se temos uma saída estéreo, duplicamos o canal mono
      if (output.length >= 2) {
        const secondOutput = output[1];
        for (let i = 0; i < monoChannel.length; i++) {
          secondOutput[i] = monoChannel[i];
        }
      }
    }

    // Retornar true para continuar processando
    return true;
  }
}

// Registrar o processador
registerProcessor('vocal-remover-processor', VocalRemoverProcessor);

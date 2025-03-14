import { PitchShifter } from 'soundtouchjs';
import * as Tone from 'tone';

class KaraokeService {
  private audioContext: AudioContext | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private splitterNode: ChannelSplitterNode | null = null;
  private mergerNode: ChannelMergerNode | null = null;
  private leftGainNode: GainNode | null = null;
  private rightGainNode: GainNode | null = null;
  private invertNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private pitchShifter: any = null;
  private audioBuffer: AudioBuffer | null = null;
  private isProcessing: boolean = false;
  private vocalRemovalEnabled: boolean = false;
  private currentPitchShift: number = 0;
  private currentTempo: number = 1.0;

  // Inicializa o serviço de karaoke
  async initialize() {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.log('KaraokeService: AudioContext inicializado');
      }
      return true;
    } catch (error) {
      console.error('KaraokeService: Erro ao inicializar AudioContext:', error);
      return false;
    }
  }

  // Verifica se o serviço está inicializado
  isInitialized(): boolean {
    return !!this.audioContext;
  }

  // Carrega um arquivo de áudio para processamento
  async loadAudio(audioData: ArrayBuffer): Promise<boolean> {
    try {
      if (!this.audioContext) {
        await this.initialize();
      }

      // Limpar recursos anteriores
      this.clearResources();

      // Decodificar o buffer de áudio
      this.audioBuffer = await this.audioContext!.decodeAudioData(audioData);
      console.log('KaraokeService: Áudio decodificado com sucesso', {
        duration: this.audioBuffer.duration,
        numberOfChannels: this.audioBuffer.numberOfChannels,
        sampleRate: this.audioBuffer.sampleRate
      });

      return true;
    } catch (error) {
      console.error('KaraokeService: Erro ao carregar áudio:', error);
      return false;
    }
  }

  // Processa o áudio com remoção de voz e/ou ajuste de pitch
  async processAudio(options: {
    vocalRemoval: boolean;
    pitchShift: number;
    tempo: number;
  }): Promise<AudioBuffer | null> {
    try {
      if (!this.audioContext || !this.audioBuffer) {
        console.error('KaraokeService: AudioContext ou AudioBuffer não inicializados');
        return null;
      }

      this.isProcessing = true;
      this.vocalRemovalEnabled = options.vocalRemoval;
      this.currentPitchShift = options.pitchShift;
      this.currentTempo = options.tempo / 100; // Converter de porcentagem para multiplicador

      // Criar um novo AudioBuffer para o resultado processado
      const processedBuffer = this.audioContext.createBuffer(
        this.audioBuffer.numberOfChannels,
        this.audioBuffer.length,
        this.audioBuffer.sampleRate
      );

      // Aplicar remoção de voz se habilitado
      if (options.vocalRemoval) {
        // Implementação da técnica de cancelamento de fase central
        if (this.audioBuffer.numberOfChannels >= 2) {
          const leftChannel = this.audioBuffer.getChannelData(0);
          const rightChannel = this.audioBuffer.getChannelData(1);
          const leftOutput = processedBuffer.getChannelData(0);
          const rightOutput = processedBuffer.getChannelData(1);

          // Aplicar cancelamento de fase para remover vocais centrais
          for (let i = 0; i < leftChannel.length; i++) {
            // Subtrair o canal direito do esquerdo para cancelar o áudio central (onde geralmente estão as vozes)
            leftOutput[i] = leftChannel[i] - rightChannel[i];
            rightOutput[i] = rightChannel[i] - leftChannel[i];
          }
        } else {
          // Se for mono, apenas copiar o áudio original
          const monoChannel = this.audioBuffer.getChannelData(0);
          const monoOutput = processedBuffer.getChannelData(0);
          monoChannel.forEach((sample, i) => {
            monoOutput[i] = sample;
          });
        }
      } else {
        // Se não houver remoção de voz, apenas copiar o áudio original
        for (let channel = 0; channel < this.audioBuffer.numberOfChannels; channel++) {
          const channelData = this.audioBuffer.getChannelData(channel);
          const outputData = processedBuffer.getChannelData(channel);
          channelData.forEach((sample, i) => {
            outputData[i] = sample;
          });
        }
      }

      // Aplicar ajuste de pitch e tempo se necessário
      if (options.pitchShift !== 0 || options.tempo !== 100) {
        // Criar um buffer temporário para o PitchShifter
        const tempBuffer = this.audioContext.createBuffer(
          processedBuffer.numberOfChannels,
          processedBuffer.length,
          processedBuffer.sampleRate
        );

        // Copiar os dados do buffer processado para o temporário
        for (let channel = 0; channel < processedBuffer.numberOfChannels; channel++) {
          const processedData = processedBuffer.getChannelData(channel);
          const tempData = tempBuffer.getChannelData(channel);
          processedData.forEach((sample, i) => {
            tempData[i] = sample;
          });
        }

        // Usar o PitchShifter para ajustar o pitch e o tempo
        this.pitchShifter = new PitchShifter(this.audioContext, tempBuffer, 4096);
        this.pitchShifter.pitch = Math.pow(2, options.pitchShift / 12); // Converter semitons para multiplicador
        this.pitchShifter.tempo = options.tempo / 100; // Converter de porcentagem para multiplicador

        // Processar o áudio com o PitchShifter
        // Nota: Isso retorna um nó de áudio, não um buffer
        // Para obter um buffer, precisaríamos renderizar o áudio offline
        return tempBuffer; // Retornamos o buffer original por enquanto
      }

      this.isProcessing = false;
      return processedBuffer;
    } catch (error) {
      console.error('KaraokeService: Erro ao processar áudio:', error);
      this.isProcessing = false;
      return null;
    }
  }

  // Aplica remoção de voz em tempo real para um nó de áudio existente
  applyVocalRemovalToNode(sourceNode: AudioNode): AudioNode {
    if (!this.audioContext) {
      console.error('KaraokeService: AudioContext não inicializado');
      return sourceNode;
    }

    try {
      // Criar nós para processamento
      this.splitterNode = this.audioContext.createChannelSplitter(2);
      this.mergerNode = this.audioContext.createChannelMerger(2);
      this.leftGainNode = this.audioContext.createGain();
      this.rightGainNode = this.audioContext.createGain();
      this.invertNode = this.audioContext.createGain();
      this.invertNode.gain.value = -1; // Inverter a fase

      // Conectar os nós para implementar o cancelamento de fase
      sourceNode.connect(this.splitterNode);
      
      // Canal esquerdo
      this.splitterNode.connect(this.leftGainNode, 0);
      
      // Canal direito
      this.splitterNode.connect(this.invertNode, 1);
      this.invertNode.connect(this.leftGainNode);
      
      // Mesma configuração para o canal direito, mas invertendo o esquerdo
      this.splitterNode.connect(this.rightGainNode, 1);
      this.splitterNode.connect(this.invertNode, 0);
      this.invertNode.connect(this.rightGainNode);
      
      // Reconectar os canais processados
      this.leftGainNode.connect(this.mergerNode, 0, 0);
      this.rightGainNode.connect(this.mergerNode, 0, 1);

      return this.mergerNode;
    } catch (error) {
      console.error('KaraokeService: Erro ao aplicar remoção de voz:', error);
      return sourceNode;
    }
  }

  // Aplica ajuste de pitch em tempo real para um nó de áudio existente
  applyPitchShiftToNode(sourceNode: AudioNode, semitones: number): AudioNode {
    if (!this.audioContext) {
      console.error('KaraokeService: AudioContext não inicializado');
      return sourceNode;
    }

    try {
      // Usar Tone.js para criar um efeito de pitch shift
      const pitchShift = new Tone.PitchShift(semitones).toDestination();
      
      // Conectar o nó de origem ao efeito de pitch shift
      // Nota: Isso requer conversão entre Web Audio API e Tone.js
      const toneSource = new Tone.UserMedia();
      toneSource.connect(pitchShift);
      
      // Retornar o nó de saída do efeito
      return pitchShift.context._context.destination;
    } catch (error) {
      console.error('KaraokeService: Erro ao aplicar ajuste de pitch:', error);
      return sourceNode;
    }
  }

  // Limpa todos os recursos
  clearResources() {
    try {
      if (this.sourceNode) {
        this.sourceNode.disconnect();
        this.sourceNode = null;
      }
      if (this.gainNode) {
        this.gainNode.disconnect();
        this.gainNode = null;
      }
      if (this.splitterNode) {
        this.splitterNode.disconnect();
        this.splitterNode = null;
      }
      if (this.mergerNode) {
        this.mergerNode.disconnect();
        this.mergerNode = null;
      }
      if (this.leftGainNode) {
        this.leftGainNode.disconnect();
        this.leftGainNode = null;
      }
      if (this.rightGainNode) {
        this.rightGainNode.disconnect();
        this.rightGainNode = null;
      }
      if (this.invertNode) {
        this.invertNode.disconnect();
        this.invertNode = null;
      }
      if (this.analyserNode) {
        this.analyserNode.disconnect();
        this.analyserNode = null;
      }
      if (this.pitchShifter) {
        this.pitchShifter = null;
      }
      this.audioBuffer = null;
      this.isProcessing = false;
    } catch (error) {
      console.error('KaraokeService: Erro ao limpar recursos:', error);
    }
  }

  // Retorna um analisador para visualização de áudio
  getAnalyser(): AnalyserNode | null {
    if (!this.audioContext) {
      return null;
    }

    if (!this.analyserNode) {
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 2048;
    }

    return this.analyserNode;
  }
}

// Exportar uma instância única do serviço
export const karaokeService = new KaraokeService();

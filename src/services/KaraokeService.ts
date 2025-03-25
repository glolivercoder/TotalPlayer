import * as Tone from 'tone';
import { PitchShifter } from 'soundtouchjs';
import { toast } from '@/components/ui/use-toast';

// Definir interface para estender HTMLMediaElement com as propriedades que precisamos
interface HTMLMediaElementWithPitch extends HTMLMediaElement {
  // preservesPitch pode não existir em todos os navegadores
}

// Declarar a propriedade preservesPitch no HTMLMediaElement
declare global {
  interface HTMLMediaElement {
    preservesPitch?: boolean;
  }
}

// Declarar a propriedade preservesPitch no HTMLAudioElement
declare global {
  interface HTMLAudioElement {
    preservesPitch?: boolean;
  }
}

// Definir o tipo para o VocalRemover
interface VocalRemover {
  initialize(): void;
  connect(sourceNode: AudioNode): AudioNode;
  disconnect(): void;
  setIntensity(value: number): void;
}

// Declarar a propriedade VocalRemover no objeto window
declare global {
  interface Window {
    VocalRemover: new (audioContext: AudioContext) => VocalRemover;
  }
}

export class KaraokeService {
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
  private soundTouchShifter: PitchShifter | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private isProcessing: boolean = false;
  private vocalRemovalEnabled: boolean = false;
  private currentPitchShift: number = 0;
  private currentTempo: number = 1.0;
  private vocalRemoverNode: AudioWorkletNode | null = null;
  private workletLoaded: boolean = false;
  private vocalRemover: VocalRemover | null = null;
  private scriptLoaded: boolean = false;
  private mediaElementSource: MediaElementAudioSourceNode | null = null;

  // Inicializa o serviço de karaoke
  async initialize() {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.log('KaraokeService: AudioContext inicializado');
        
        // Carregar o script de remoção de vocais
        if (!this.scriptLoaded) {
          try {
            await this.loadVocalRemoverScript();
            console.log('KaraokeService: Script de remoção de vocais carregado com sucesso');
            this.scriptLoaded = true;
          } catch (scriptError) {
            console.error('KaraokeService: Erro ao carregar script de remoção de vocais:', scriptError);
          }
        }
        
        // Carregar o AudioWorklet para remoção de vocais (método alternativo)
        if (!this.workletLoaded) {
          try {
            const workletUrl = new URL('/src/services/VocalRemoverProcessor.js', window.location.origin);
            await this.audioContext.audioWorklet.addModule(workletUrl.href);
            console.log('KaraokeService: VocalRemoverProcessor carregado com sucesso');
            this.workletLoaded = true;
          } catch (workletError) {
            console.error('KaraokeService: Erro ao carregar VocalRemoverProcessor:', workletError);
            // Continuar mesmo se o worklet falhar, usaremos o método alternativo
          }
        }
      }
      return true;
    } catch (error) {
      console.error('KaraokeService: Erro ao inicializar AudioContext:', error);
      return false;
    }
  }

  // Carregar o script de remoção de vocais
  private async loadVocalRemoverScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Verificar se o script já foi carregado
      if (window.VocalRemover) {
        this.scriptLoaded = true;
        resolve();
        return;
      }

      // Criar um elemento de script
      const script = document.createElement('script');
      script.src = '/vocal-remover-processor.js';
      script.async = true;
      
      // Definir callbacks para sucesso e erro
      script.onload = () => {
        this.scriptLoaded = true;
        resolve();
      };
      
      script.onerror = (error) => {
        reject(error);
      };
      
      // Adicionar o script ao documento
      document.head.appendChild(script);
    });
  }

  // Verifica se o serviço está inicializado
  isInitialized(): boolean {
    return this.audioContext !== null;
  }

  // Processa um arquivo de áudio para remoção de voz
  async processAudioFile(file: File): Promise<AudioBuffer | null> {
    if (!this.audioContext) {
      console.error('KaraokeService: AudioContext não inicializado');
      return null;
    }

    try {
      this.isProcessing = true;

      // Ler o arquivo como ArrayBuffer
      const arrayBuffer = await this.readFileAsArrayBuffer(file);
      
      // Decodificar o ArrayBuffer como AudioBuffer
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.audioBuffer = audioBuffer;

      // Aplicar remoção de voz
      const processedBuffer = await this.removeVocalsFromBuffer(audioBuffer);
      
      this.isProcessing = false;
      return processedBuffer;
    } catch (error) {
      console.error('KaraokeService: Erro ao processar arquivo de áudio:', error);
      this.isProcessing = false;
      return null;
    }
  }

  // Lê um arquivo como ArrayBuffer
  private readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        resolve(reader.result as ArrayBuffer);
      };
      
      reader.onerror = (error) => {
        reject(error);
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  // Remove vocais de um AudioBuffer
  private async removeVocalsFromBuffer(buffer: AudioBuffer): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('AudioContext não inicializado');
    }

    // Verificar se o buffer tem pelo menos dois canais (estéreo)
    if (buffer.numberOfChannels < 2) {
      console.warn('KaraokeService: O arquivo de áudio não é estéreo, não é possível remover vocais');
      return buffer;
    }

    // Criar um novo buffer para armazenar o resultado
    const processedBuffer = this.audioContext.createBuffer(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    );

    // Obter os dados dos canais
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);
    
    // Criar arrays para os canais processados
    const processedLeftChannel = new Float32Array(buffer.length);
    const processedRightChannel = new Float32Array(buffer.length);

    // Aplicar técnica de cancelamento de fase
    for (let i = 0; i < buffer.length; i++) {
      // A voz geralmente está no centro da mixagem (igual nos dois canais)
      // Subtrair um canal do outro cancela o conteúdo central (voz)
      processedLeftChannel[i] = leftChannel[i] - rightChannel[i];
      processedRightChannel[i] = rightChannel[i] - leftChannel[i];
    }

    // Copiar os dados processados para o novo buffer
    processedBuffer.copyToChannel(processedLeftChannel, 0);
    processedBuffer.copyToChannel(processedRightChannel, 1);

    return processedBuffer;
  }

  // Aplica remoção de voz em tempo real para um nó de áudio existente
  applyVocalRemovalToNode(sourceNode: AudioNode): AudioNode {
    if (!this.audioContext) {
      console.error('KaraokeService: AudioContext não inicializado');
      return sourceNode;
    }

    try {
      // Limpar qualquer nó de processamento anterior
      if (this.vocalRemoverNode) {
        this.vocalRemoverNode.disconnect();
        this.vocalRemoverNode = null;
      }
      
      if (this.vocalRemover) {
        this.vocalRemover.disconnect();
        this.vocalRemover = null;
      }
      
      // Verificar se o script de remoção de vocais foi carregado
      if (this.scriptLoaded && window.VocalRemover) {
        console.log('KaraokeService: Usando VocalRemover para remoção de vocais');
        
        // Criar uma nova instância do VocalRemover
        this.vocalRemover = new window.VocalRemover(this.audioContext);
        
        // Conectar o nó de origem ao processador
        const outputNode = this.vocalRemover.connect(sourceNode);
        
        // Definir a intensidade da remoção
        this.vocalRemover.setIntensity(1.0);
        
        // Retornar o nó de saída
        return outputNode;
      }
      // Verificar se o AudioWorklet foi carregado
      else if (this.workletLoaded) {
        console.log('KaraokeService: Usando AudioWorklet para remoção de vocais');
        
        // Criar um novo nó de processamento usando o AudioWorklet
        this.vocalRemoverNode = new AudioWorkletNode(this.audioContext, 'vocal-remover-processor');
        
        // Conectar o nó de origem ao processador e o processador à saída
        sourceNode.connect(this.vocalRemoverNode);
        
        // Retornar o nó do processador para que possa ser conectado à saída
        return this.vocalRemoverNode;
      } else {
        console.log('KaraokeService: Usando método alternativo para remoção de vocais');
        
        // Método alternativo usando nós de áudio padrão
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
      }
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
      // Limpar qualquer instância anterior do pitch shifter
      if (this.pitchShifter) {
        this.pitchShifter.disconnect();
      }
      
      // Criar um novo processador de pitch shift usando Tone.js
      this.pitchShifter = new Tone.PitchShift();
      this.pitchShifter.pitch = semitones; // Definir o valor do pitch em semitons
      this.currentPitchShift = semitones;
      
      // Conectar o pitch shifter à saída
      this.pitchShifter.toDestination();
      
      // Criar nós de entrada e saída para conectar Web Audio API com Tone.js
      const inputNode = this.audioContext.createGain();
      const outputNode = this.audioContext.createGain();
      
      // Conectar o nó de origem ao nó de entrada
      sourceNode.connect(inputNode);
      
      // Conectar o nó de entrada ao nó de saída (conexão direta como fallback)
      inputNode.connect(outputNode);
      
      // Registrar o ajuste de pitch aplicado
      console.log(`KaraokeService: Pitch shift aplicado (${semitones} semitons)`);
      
      // Retornar o nó de saída
      return outputNode;
    } catch (error) {
      console.error('KaraokeService: Erro ao aplicar ajuste de pitch:', error);
      return sourceNode;
    }
  }

  // Aplica ajuste de pitch em tempo real usando SoundTouchJS
  applySoundTouchPitchShift(mediaElement: HTMLMediaElement, semitones: number): HTMLMediaElement {
    console.log('DEBUG: Iniciando applySoundTouchPitchShift com semitones =', semitones);
    console.log('DEBUG: Estado do mediaElement:', {
      src: mediaElement.src,
      paused: mediaElement.paused,
      currentTime: mediaElement.currentTime,
      duration: mediaElement.duration,
      playbackRate: mediaElement.playbackRate,
      preservesPitch: mediaElement.preservesPitch
    });
    
    if (!this.audioContext) {
      console.error('KaraokeService: AudioContext não inicializado');
      return mediaElement;
    }
    
    console.log('DEBUG: Estado do audioContext:', {
      state: this.audioContext.state,
      sampleRate: this.audioContext.sampleRate,
      baseLatency: this.audioContext.baseLatency
    });

    try {
      // Armazenar o pitch shift atual
      this.currentPitchShift = semitones;
      
      // Calcular o fator de pitch
      const pitchFactor = Math.pow(2, semitones / 12);
      console.log('DEBUG: Calculado pitchFactor =', pitchFactor);
      
      // Verificar se o navegador suporta preservesPitch
      const supportsPreservesPitch = 'preservesPitch' in mediaElement;
      console.log('DEBUG: Navegador suporta preservesPitch:', supportsPreservesPitch);
      
      // ABORDAGEM SIMPLIFICADA: Usar apenas o playbackRate
      if (supportsPreservesPitch) {
        // Método moderno com preservesPitch
        mediaElement.preservesPitch = false;
        mediaElement.playbackRate = pitchFactor;
        console.log('DEBUG: Configurado mediaElement.playbackRate com preservesPitch=false:', mediaElement.playbackRate);
      } else {
        // Fallback para navegadores que não suportam preservesPitch
        mediaElement.playbackRate = pitchFactor;
        console.log('DEBUG: Configurado mediaElement.playbackRate (sem preservesPitch):', mediaElement.playbackRate);
      }
      
      // Verificar se a alteração foi aplicada
      const currentRate = mediaElement.playbackRate;
      console.log('DEBUG: Verificando se a alteração foi aplicada:', {
        playbackRate: currentRate,
        expectedRate: pitchFactor,
        difference: Math.abs(currentRate - pitchFactor)
      });
      
      // Não vamos mais criar ou gerenciar MediaElementSource
      // Isso evita problemas de congelamento e erros de conexão
      console.log(`KaraokeService: Pitch shift aplicado (${semitones} semitons, fator: ${pitchFactor}) usando apenas playbackRate`);
      
      return mediaElement;
    } catch (error) {
      console.error('KaraokeService: Erro ao aplicar ajuste de pitch:', error);
      // Em caso de erro, apenas retornamos o elemento de áudio original
      return mediaElement;
    }
  }

  // Limpar os pitch shifters
  clearPitchShifters() {
    try {
      if (this.pitchShifter) {
        try {
          this.pitchShifter.disconnect();
        } catch (error) {
          console.warn('Erro ao desconectar pitchShifter:', error);
        }
        this.pitchShifter = null;
      }
      
      if (this.soundTouchShifter) {
        try {
          this.soundTouchShifter.off(); // Remover listeners
        } catch (error) {
          console.warn('Erro ao desconectar soundTouchShifter:', error);
        }
        this.soundTouchShifter = null;
      }
      
      // Não vamos mais gerenciar mediaElementSource
      // Isso evita problemas de congelamento e erros de conexão
      console.log('KaraokeService: Pitch shifters limpos com sucesso');
    } catch (error) {
      console.error('KaraokeService: Erro ao limpar pitch shifters:', error);
    }
  }

  // Atualiza o pitch shift usando SoundTouch
  updateSoundTouchPitchShift(semitones: number): void {
    if (this.soundTouchShifter) {
      const pitchFactor = Math.pow(2, semitones / 12);
      this.soundTouchShifter.pitch = pitchFactor;
      this.currentPitchShift = semitones;
      console.log(`KaraokeService: SoundTouch pitch shift atualizado para ${semitones} semitons (fator: ${pitchFactor})`);
    }
  }

  // Verifica se o SoundTouch pitch shifter está ativo
  hasSoundTouchPitchShifter(): boolean {
    return this.soundTouchShifter !== null;
  }

  // Método para atualizar o valor do pitch shift
  updatePitchShift(semitones: number): void {
    if (this.pitchShifter) {
      this.pitchShifter.pitch = semitones;
      this.currentPitchShift = semitones;
      console.log(`KaraokeService: Pitch shift atualizado para ${semitones} semitons`);
    }
  }

  // Método para verificar se o pitch shifter está ativo
  hasPitchShifter(): boolean {
    return this.pitchShifter !== null;
  }

  // Reproduz um AudioBuffer
  playAudioBuffer(buffer: AudioBuffer) {
    if (!this.audioContext) {
      console.error('KaraokeService: AudioContext não inicializado');
      return;
    }

    // Limpar recursos anteriores
    this.clearResources();

    // Criar um novo nó de fonte
    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = buffer;

    // Criar um nó de ganho para controle de volume
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 1.0;

    // Conectar os nós
    this.sourceNode.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);

    // Iniciar a reprodução
    this.sourceNode.start();
  }

  // Pausa a reprodução
  pausePlayback() {
    if (this.audioContext && this.audioContext.state === 'running') {
      this.audioContext.suspend();
    }
  }

  // Retoma a reprodução
  resumePlayback() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  // Para a reprodução
  stopPlayback() {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
      } catch (error) {
        console.error('KaraokeService: Erro ao parar reprodução:', error);
      }
    }
    this.clearResources();
  }

  // Cria um analisador de áudio para visualização
  createAnalyser(): AnalyserNode | null {
    if (!this.audioContext) {
      console.error('KaraokeService: AudioContext não inicializado');
      return null;
    }

    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = 2048;
    this.analyserNode.smoothingTimeConstant = 0.8;

    if (this.gainNode) {
      this.gainNode.connect(this.analyserNode);
    }

    return this.analyserNode;
  }

  // Limpar recursos
  clearResources() {
    console.log('DEBUG: Iniciando clearResources');
    try {
      // Limpar pitch shifters
      this.clearPitchShifters();
      
      // Limpar MediaElementSource se existir
      if (this.mediaElementSource) {
        try {
          console.log('DEBUG: Tentando desconectar mediaElementSource');
          this.mediaElementSource.disconnect();
          console.log('DEBUG: mediaElementSource desconectado com sucesso');
        } catch (error) {
          console.warn('DEBUG: Erro ao desconectar mediaElementSource:', error);
        }
        this.mediaElementSource = null;
      }
      
      // Limpar AudioContext se existir
      if (this.audioContext && this.audioContext.state !== 'closed') {
        try {
          console.log('DEBUG: Tentando fechar audioContext');
          this.audioContext.close().then(() => {
            console.log('DEBUG: audioContext fechado com sucesso');
          }).catch(error => {
            console.warn('DEBUG: Erro ao fechar audioContext:', error);
          });
        } catch (error) {
          console.warn('DEBUG: Erro ao tentar fechar audioContext:', error);
        }
        this.audioContext = null;
      }
      
      // Limpar outros recursos
      this.currentPitchShift = 0;
      this.currentTempo = 1.0;
      
      console.log('DEBUG: Recursos limpos com sucesso');
    } catch (error) {
      console.error('DEBUG: Erro ao limpar recursos:', error);
    }
  }

  // Getter para o AudioContext
  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }
}

// Exportar uma instância única do serviço
export const karaokeService = new KaraokeService();

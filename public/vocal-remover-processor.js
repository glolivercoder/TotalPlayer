/**
 * VocalRemover - Classe para remou00e7u00e3o de vocais em tempo real usando o Web Audio API
 * Esta implementau00e7u00e3o utiliza a tu00e9cnica de cancelamento de fase para remover vocais
 * que estu00e3o centralizados na mixagem estu00e9reo.
 */
class VocalRemover {
  /**
   * Construtor
   * @param {AudioContext} audioContext - O contexto de u00e1udio a ser utilizado
   */
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.initialized = false;
    this.intensity = 1.0; // Intensidade da remou00e7u00e3o (0.0 a 1.0)
    
    // Criar os nu00f3s de u00e1udio
    this.inputNode = this.audioContext.createGain();
    this.outputNode = this.audioContext.createGain();
    this.splitterNode = this.audioContext.createChannelSplitter(2);
    this.mergerNode = this.audioContext.createChannelMerger(2);
    this.leftGainNode = this.audioContext.createGain();
    this.rightGainNode = this.audioContext.createGain();
    this.leftInvertNode = this.audioContext.createGain();
    this.rightInvertNode = this.audioContext.createGain();
    this.leftInvertNode.gain.value = -1; // Inverter a fase
    this.rightInvertNode.gain.value = -1; // Inverter a fase
    
    // Configurar o grafo de nu00f3s de u00e1udio
    this.initialize();
  }
  
  /**
   * Inicializa o processador de remou00e7u00e3o de vocais
   */
  initialize() {
    if (this.initialized) return;
    
    try {
      // Configurar o grafo de nu00f3s para o canal esquerdo
      this.inputNode.connect(this.splitterNode);
      
      // Canal esquerdo original
      this.splitterNode.connect(this.leftGainNode, 0);
      
      // Canal direito invertido para o canal esquerdo (cancelamento)
      this.splitterNode.connect(this.rightInvertNode, 1);
      this.rightInvertNode.connect(this.leftGainNode);
      
      // Canal direito original
      this.splitterNode.connect(this.rightGainNode, 1);
      
      // Canal esquerdo invertido para o canal direito (cancelamento)
      this.splitterNode.connect(this.leftInvertNode, 0);
      this.leftInvertNode.connect(this.rightGainNode);
      
      // Conectar os canais processados ao merger
      this.leftGainNode.connect(this.mergerNode, 0, 0);
      this.rightGainNode.connect(this.mergerNode, 0, 1);
      
      // Conectar o merger u00e0 sau00edda
      this.mergerNode.connect(this.outputNode);
      
      this.initialized = true;
      console.log('VocalRemover: Inicializado com sucesso');
    } catch (error) {
      console.error('VocalRemover: Erro ao inicializar:', error);
    }
  }
  
  /**
   * Conecta um nu00f3 de u00e1udio u00e0 entrada do processador
   * @param {AudioNode} sourceNode - O nu00f3 de u00e1udio a ser conectado
   * @returns {AudioNode} O nu00f3 de sau00edda para encadeamento
   */
  connect(sourceNode) {
    if (!this.initialized) {
      this.initialize();
    }
    
    try {
      // Conectar o nu00f3 de origem u00e0 entrada
      sourceNode.connect(this.inputNode);
      console.log('VocalRemover: Nu00f3 de u00e1udio conectado com sucesso');
      return this.outputNode;
    } catch (error) {
      console.error('VocalRemover: Erro ao conectar nu00f3 de u00e1udio:', error);
      return sourceNode; // Retornar o nu00f3 original em caso de erro
    }
  }
  
  /**
   * Desconecta todos os nu00f3s
   */
  disconnect() {
    try {
      this.inputNode.disconnect();
      this.outputNode.disconnect();
      this.splitterNode.disconnect();
      this.mergerNode.disconnect();
      this.leftGainNode.disconnect();
      this.rightGainNode.disconnect();
      this.leftInvertNode.disconnect();
      this.rightInvertNode.disconnect();
      console.log('VocalRemover: Nu00f3s desconectados com sucesso');
    } catch (error) {
      console.error('VocalRemover: Erro ao desconectar nu00f3s:', error);
    }
  }
  
  /**
   * Define a intensidade da remou00e7u00e3o de vocais
   * @param {number} value - Valor entre 0.0 e 1.0
   */
  setIntensity(value) {
    try {
      // Limitar o valor entre 0 e 1
      this.intensity = Math.max(0, Math.min(1, value));
      
      // Ajustar os ganhos com base na intensidade
      // Quando intensity = 0, nu00e3o hu00e1 remou00e7u00e3o (ganho normal = 1, ganho invertido = 0)
      // Quando intensity = 1, remou00e7u00e3o mu00e1xima (ganho normal = 1, ganho invertido = -1)
      this.leftInvertNode.gain.value = -this.intensity;
      this.rightInvertNode.gain.value = -this.intensity;
      
      console.log(`VocalRemover: Intensidade definida para ${this.intensity}`);
    } catch (error) {
      console.error('VocalRemover: Erro ao definir intensidade:', error);
    }
  }
}

// Tornar a classe disponiu00edvel globalmente
window.VocalRemover = VocalRemover;

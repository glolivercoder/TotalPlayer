import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

// Importações das bibliotecas de karaokê serão feitas dinamicamente no useEffect
// para evitar problemas de renderização do lado do servidor

interface KaraokePlayerProps {
  type: 'midi' | 'cdg';
  filePath: string;
  onScoreUpdate?: (score: number) => void;
}

const KaraokePlayer: React.FC<KaraokePlayerProps> = ({ type, filePath, onScoreUpdate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [score, setScore] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [audioContextStarted, setAudioContextStarted] = useState(false);

  // Referências para os players
  const midiPlayerRef = useRef<any>(null);
  const cdgPlayerRef = useRef<any>(null);
  const cdgControlsRef = useRef<any>(null);
  
  // Referências para as bibliotecas carregadas dinamicamente
  const jzzRef = useRef<any>(null);
  const cdgPlayerClassRef = useRef<any>(null);
  const cdgControlsClassRef = useRef<any>(null);

  // Função para adicionar informações de depuração
  const addDebugInfo = (info: string) => {
    console.log(`[KaraokePlayer Debug] ${info}`);
    setDebugInfo(prev => `${prev}\n${new Date().toISOString()}: ${info}`);
  };

  // Função para iniciar o AudioContext após interação do usuário
  const startAudioContext = () => {
    if (audioContextStarted) return;
    
    try {
      // Criar um AudioContext temporário para garantir que seja iniciado
      const tempContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      tempContext.resume().then(() => {
        addDebugInfo('AudioContext iniciado com sucesso após interação do usuário');
        setAudioContextStarted(true);
      });
    } catch (err: any) {
      addDebugInfo(`Erro ao iniciar AudioContext: ${err.message}`);
    }
  };
  
  // Função para inicializar o player apropriado - movida para fora do useEffect
  const initializePlayer = () => {
    if (!containerRef.current) {
      addDebugInfo('Erro: containerRef não encontrado');
      return;
    }

    addDebugInfo('Limpando container');
    // Limpar container de forma segura
    try {
      const container = containerRef.current;
      while (container.firstChild) {
        container.firstChild.remove();
      }
    } catch (err: any) {
      addDebugInfo(`Erro ao limpar container: ${err.message}`);
    }

    if (type === 'midi' && jzzRef.current) {
      try {
        const JZZ = jzzRef.current;
        addDebugInfo('Inicializando player MIDI');
        // Inicializar player MIDI
        const midiout = JZZ.default ? JZZ.default() : JZZ();
        addDebugInfo('JZZ inicializado, tentando abrir saída MIDI');

        midiout.openMidiOut().or((err: any) => {
          const errorMsg = err ? err.toString() : 'Erro desconhecido';
          addDebugInfo(`Erro ao abrir saída MIDI: ${errorMsg}`);
          toast.error(`Não foi possível abrir saída MIDI: ${errorMsg}`);
        });

        addDebugInfo('Saída MIDI aberta com sucesso');

        // Criar elemento para o karaokê
        addDebugInfo('Criando elemento para o karaokê');
        const karaokeElement = document.createElement('div');
        karaokeElement.id = 'karaoke-container';
        containerRef.current.appendChild(karaokeElement);

        // Inicializar o karaokê
        addDebugInfo('Inicializando objeto JZZ.gui.Karaoke');
        if (!JZZ.gui || !JZZ.gui.Karaoke) {
          addDebugInfo('ERRO: JZZ.gui.Karaoke não está disponível');
          console.error('JZZ.gui.Karaoke não está disponível:', JZZ);
          setError('Erro: Biblioteca de karaokê não está disponível');
          return;
        }

        const karaoke = new JZZ.gui.Karaoke('karaoke-container');
        addDebugInfo('Objeto karaokê criado com sucesso');

        // Carregar arquivo MIDI/KAR
        addDebugInfo(`Carregando arquivo MIDI: ${filePath}`);
        fetch(filePath)
          .then(response => {
            if (!response.ok) {
              throw new Error(`Erro HTTP: ${response.status}`);
            }
            addDebugInfo('Arquivo MIDI baixado, convertendo para ArrayBuffer');
            return response.arrayBuffer();
          })
          .then(data => {
            try {
              addDebugInfo(`ArrayBuffer recebido, tamanho: ${data.byteLength} bytes`);
              
              // Verificar se é um arquivo MIDI válido
              const byteArray = new Uint8Array(data);
              if (byteArray.length < 4 || 
                  byteArray[0] !== 0x4D || // 'M'
                  byteArray[1] !== 0x54 || // 'T'
                  byteArray[2] !== 0x68 || // 'h'
                  byteArray[3] !== 0x64) { // 'd'
                throw new Error('Arquivo não é um MIDI válido (cabeçalho MThd não encontrado)');
              }
              
              addDebugInfo('Criando objeto SMF');
              const smf = new JZZ.MIDI.SMF(data);
              addDebugInfo('Objeto SMF criado, inicializando player');
              const player = smf.player();

              addDebugInfo('Carregando SMF no karaokê');
              karaoke.load(smf);
              addDebugInfo('Conectando player ao karaokê');
              player.connect(karaoke);
              addDebugInfo('Conectando player à saída MIDI');
              player.connect(midiout);

              player.onEnd = () => {
                addDebugInfo('Reprodução finalizada');
                karaoke.reset();
                setIsPlaying(false);
              };

              midiPlayerRef.current = {
                player,
                karaoke,
                midiout
              };

              addDebugInfo('Player MIDI inicializado com sucesso');

              // Iniciar simulação de pontuação
              startScoreSimulation();
            } catch (err: any) {
              console.error('Erro ao processar arquivo MIDI:', err);
              addDebugInfo(`Erro ao processar arquivo MIDI: ${err.message}`);
              toast.error(`Erro ao processar arquivo MIDI: ${err.message}`);
            }
          })
          .catch(error => {
            console.error('Erro ao carregar arquivo MIDI:', error);
            addDebugInfo(`Erro ao carregar arquivo MIDI: ${error.message}`);
            toast.error(`Erro ao carregar arquivo MIDI: ${error.message}`);
          });
      } catch (error: any) {
        console.error('Erro ao inicializar player MIDI:', error);
        addDebugInfo(`Erro ao inicializar player MIDI: ${error.message}`);
        toast.error(`Erro ao inicializar player MIDI: ${error.message}`);
      }
    } else if (type === 'cdg' && cdgPlayerClassRef.current && cdgControlsClassRef.current) {
      try {
        const CDGPlayer = cdgPlayerClassRef.current;
        const CDGControls = cdgControlsClassRef.current;
        
        addDebugInfo('Inicializando player CDG');
        
        // Primeiro, garantir que os elementos existam no DOM
        if (!containerRef.current) {
          throw new Error('Container não encontrado');
        }
        
        // Criar os elementos de vídeo e controles
        const videoElement = document.createElement('div');
        videoElement.id = 'karaoke-video';
        videoElement.className = 'w-full h-full';
        containerRef.current.appendChild(videoElement);
        
        const controlsElement = document.createElement('div');
        controlsElement.id = 'karaoke-controls';
        controlsElement.className = 'hidden';
        containerRef.current.appendChild(controlsElement);
        
        addDebugInfo('Elementos DOM criados com sucesso');

        // Inicializar player CDG
        addDebugInfo('Criando objeto CDGPlayer');
        const cdgPlayer = new CDGPlayer('#karaoke-video');
        addDebugInfo('Criando objeto CDGControls');
        const cdgControls = new CDGControls('#karaoke-controls', cdgPlayer);

        cdgPlayerRef.current = cdgPlayer;
        cdgControlsRef.current = cdgControls;

        // Carregar arquivo ZIP (MP3+G)
        addDebugInfo(`Carregando arquivo CDG: ${filePath}`);
        cdgPlayer.load(filePath);

        addDebugInfo('Player CDG inicializado com sucesso');

        // Iniciar simulação de pontuação
        startScoreSimulation();
      } catch (error: any) {
        console.error('Erro ao inicializar player CDG:', error);
        addDebugInfo(`Erro ao inicializar player CDG: ${error.message}`);
        toast.error(`Erro ao inicializar player CDG: ${error.message}`);
      }
    }
  };

  // Simulação de pontuação (para demonstração)
  const startScoreSimulation = () => {
    addDebugInfo('Iniciando simulação de pontuação');
    const scoreInterval = setInterval(() => {
      if (isPlaying) {
        // Simular pontuação aumentando gradualmente
        setScore(prevScore => {
          const newScore = prevScore + Math.floor(Math.random() * 5);
          const clampedScore = Math.min(newScore, 100);

          // Chamar callback se fornecido
          if (onScoreUpdate) {
            onScoreUpdate(clampedScore);
          }

          return clampedScore;
        });
      }
    }, 1000);

    // Retornar função para limpar o intervalo
    return () => clearInterval(scoreInterval);
  };

  // Inicialização dos players
  useEffect(() => {
    let isMounted = true;
    let scoreInterval: NodeJS.Timeout | null = null;

    addDebugInfo(`Iniciando carregamento para tipo: ${type}, arquivo: ${filePath}`);

    // Função para carregar as bibliotecas dinamicamente
    const loadLibraries = async () => {
      try {
        // Carregar bibliotecas dinamicamente
        if (typeof window !== 'undefined') {
          addDebugInfo('Ambiente de navegador detectado, iniciando carregamento de bibliotecas');

          try {
            // Importar JZZ
            addDebugInfo('Tentando importar JZZ');
            const jzzModule = await import('jzz');
            const JZZ = jzzModule.default || jzzModule;
            jzzRef.current = JZZ;
            addDebugInfo('JZZ importado com sucesso');

            // Importar e inicializar os plugins
            if (type === 'midi') {
              addDebugInfo('Tentando importar jzz-midi-smf');
              await import('jzz-midi-smf').then(module => {
                const SMF = module.default || module;
                addDebugInfo('jzz-midi-smf importado, inicializando...');
                SMF(JZZ);
                addDebugInfo('jzz-midi-smf inicializado');
              });

              addDebugInfo('Tentando importar jzz-gui-karaoke');
              await import('jzz-gui-karaoke').then(module => {
                const Karaoke = module.default || module;
                addDebugInfo('jzz-gui-karaoke importado, inicializando...');
                Karaoke(JZZ);
                addDebugInfo('jzz-gui-karaoke inicializado');
              });
            } else if (type === 'cdg') {
              // Importar JSZipUtils primeiro
              addDebugInfo('Tentando importar jszip-utils');
              await import('jszip-utils').then(module => {
                // Adicionar JSZipUtils ao objeto window para que o CDGPlayer possa acessá-lo
                (window as any).JSZipUtils = module.default || module;
                addDebugInfo('jszip-utils importado com sucesso');
              });
              
              addDebugInfo('Tentando importar cdgplayer');
              const cdgModule = await import('cdgplayer');
              cdgPlayerClassRef.current = cdgModule.CDGPlayer;
              cdgControlsClassRef.current = cdgModule.CDGControls;
              addDebugInfo('cdgplayer importado com sucesso');
            }

            if (isMounted) {
              setIsLoaded(true);
              addDebugInfo('Bibliotecas carregadas, iniciando player');
              // Não inicializamos o player aqui, esperamos a interação do usuário
            }
          } catch (err: any) {
            console.error('Erro ao carregar bibliotecas:', err);
            addDebugInfo(`Erro ao carregar bibliotecas: ${err.message}`);
            if (isMounted) {
              setError(`Erro ao carregar bibliotecas: ${err.message}`);
              toast.error(`Erro ao carregar bibliotecas: ${err.message}`);
            }
          }
        }
      } catch (err: any) {
        console.error('Erro ao carregar bibliotecas:', err);
        addDebugInfo(`Erro geral ao carregar bibliotecas: ${err.message}`);
        if (isMounted) {
          setError(`Erro ao carregar bibliotecas: ${err.message}`);
          toast.error(`Erro ao carregar bibliotecas: ${err.message}`);
        }
      }
    };

    // Carregar bibliotecas
    loadLibraries();

    // Cleanup
    return () => {
      addDebugInfo('Desmontando componente, realizando limpeza');
      isMounted = false;

      if (scoreInterval) {
        clearInterval(scoreInterval);
      }

      if (midiPlayerRef.current) {
        if (midiPlayerRef.current.player) {
          addDebugInfo('Parando player MIDI');
          try {
            midiPlayerRef.current.player.stop();
          } catch (err) {
            addDebugInfo('Erro ao parar player MIDI');
          }
        }
        if (midiPlayerRef.current.midiout) {
          addDebugInfo('Fechando saída MIDI');
          try {
            midiPlayerRef.current.midiout.close();
          } catch (err) {
            addDebugInfo('Erro ao fechar saída MIDI');
          }
        }
      }

      if (cdgPlayerRef.current) {
        addDebugInfo('Limpando player CDG');
        // CDGPlayer não tem método de cleanup explícito
      }
      
      // Limpar referências
      midiPlayerRef.current = null;
      cdgPlayerRef.current = null;
      cdgControlsRef.current = null;
      jzzRef.current = null;
      cdgPlayerClassRef.current = null;
      cdgControlsClassRef.current = null;
    };
  }, [type, filePath]);

  // Controle de reprodução
  const togglePlayPause = () => {
    // Iniciar o AudioContext se ainda não foi iniciado
    startAudioContext();
    
    // Inicializar o player se ainda não foi feito
    if (!midiPlayerRef.current && !cdgPlayerRef.current) {
      addDebugInfo('Inicializando player após interação do usuário');
      initializePlayer();
      // Retornar aqui, pois o player ainda não está pronto para reprodução
      return;
    }
    
    if (type === 'midi' && midiPlayerRef.current) {
      if (isPlaying) {
        addDebugInfo('Pausando player MIDI');
        midiPlayerRef.current.player.pause();
      } else {
        addDebugInfo('Iniciando reprodução MIDI');
        midiPlayerRef.current.player.play();
      }
      setIsPlaying(!isPlaying);
    } else if (type === 'cdg' && cdgPlayerRef.current && cdgControlsRef.current) {
      addDebugInfo(`${isPlaying ? 'Pausando' : 'Iniciando'} reprodução CDG`);
      // O CDGControls já gerencia o estado de reprodução
      cdgControlsRef.current.togglePlay();
      setIsPlaying(!isPlaying);
    }
  };

  // Controle de volume
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);

    if (type === 'midi' && midiPlayerRef.current && midiPlayerRef.current.midiout) {
      // Ajustar volume MIDI (0-127)
      const midiVolume = Math.floor(newVolume * 1.27);
      addDebugInfo(`Ajustando volume MIDI para: ${midiVolume}`);
      // Enviar mensagem de volume para todos os canais
      for (let channel = 0; channel < 16; channel++) {
        midiPlayerRef.current.midiout.send([0xB0 + channel, 0x07, midiVolume]);
      }
    } else if (type === 'cdg' && cdgPlayerRef.current) {
      // Ajustar volume do áudio (0-1)
      addDebugInfo(`Ajustando volume CDG para: ${newVolume / 100}`);
      cdgPlayerRef.current.setVolume(newVolume / 100);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-md mb-2">
          {error}
        </div>
      )}

      <div ref={containerRef} className="w-full h-64 bg-black rounded-md overflow-hidden relative">
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Button 
            onClick={togglePlayPause} 
            disabled={!isLoaded}
            className="flex items-center gap-2"
          >
            {isPlaying ? 'Pausar' : 'Reproduzir'}
            {!audioContextStarted && (
              <span className="text-xs bg-yellow-500/20 px-1 py-0.5 rounded">Clique para iniciar áudio</span>
            )}
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm">Volume:</span>
            <Slider
              value={[volume]}
              min={0}
              max={100}
              step={1}
              className="w-32"
              onValueChange={handleVolumeChange}
              disabled={!isLoaded}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">Pontuação:</span>
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${score}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium">{score}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 p-4 bg-muted rounded-md">
        <h3 className="text-sm font-medium mb-2">Informações de Depuração:</h3>
        <pre className="text-xs overflow-auto max-h-40 p-2 bg-background rounded border">
          {debugInfo || 'Nenhuma informação disponível.'}
        </pre>
      </div>
    </div>
  );
};

export default KaraokePlayer;

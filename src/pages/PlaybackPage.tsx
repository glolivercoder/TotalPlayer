import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { FileMusic, Mic2, Music } from 'lucide-react';
import KaraokePlayer from '@/components/KaraokePlayer';

const PlaybackPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'midi' | 'cdg'>('midi');
  const [filePath, setFilePath] = useState<string>('');
  const [score, setScore] = useState<number>(0);
  const [exampleFilesLoaded, setExampleFilesLoaded] = useState(false);

  // Verificar se os arquivos de exemplo existem
  useEffect(() => {
    // Verificar se os arquivos de exemplo estão disponíveis
    const checkExampleFiles = async () => {
      try {
        const midiResponse = await fetch('/examples/valid-midi.mid');
        const cdgResponse = await fetch('/examples/example.zip');

        if (midiResponse.ok && cdgResponse.ok) {
          console.log('Arquivos de exemplo carregados com sucesso');
          setExampleFilesLoaded(true);
        } else {
          console.error('Alguns arquivos de exemplo não foram encontrados');
          toast.error('Alguns arquivos de exemplo não foram encontrados');
        }
      } catch (error) {
        console.error('Erro ao verificar arquivos de exemplo:', error);
      }
    };

    checkExampleFiles();
  }, []);

  // Função para lidar com a seleção de arquivos
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setSelectedFile(file);

    // Determinar o tipo de arquivo
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension === 'mid' || extension === 'kar') {
      setFileType('midi');
    } else if (extension === 'zip' || extension === 'cdg') {
      setFileType('cdg');
    } else {
      toast.error('Formato de arquivo não suportado. Por favor, selecione um arquivo MIDI (.mid, .kar) ou CDG (.zip, .cdg)');
      setSelectedFile(null);
      return;
    }

    // Criar URL para o arquivo
    const objectUrl = URL.createObjectURL(file);
    setFilePath(objectUrl);

    toast.success(`Arquivo ${file.name} carregado com sucesso!`);
  };

  // Função para lidar com a atualização da pontuação
  const handleScoreUpdate = (newScore: number) => {
    setScore(newScore);
  };

  // Função para carregar um arquivo de exemplo
  const loadExampleFile = (type: 'midi' | 'cdg') => {
    setFileType(type);
    if (type === 'midi') {
      // Carregar arquivo MIDI de exemplo
      setFilePath('/examples/valid-midi.mid');
      toast.success('Arquivo MIDI de exemplo carregado!');
    } else {
      // Carregar arquivo CDG de exemplo
      setFilePath('/examples/example.zip');
      toast.success('Arquivo CDG de exemplo carregado!');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header title="Reprodução de Karaokê" />

      <div className="flex-1 p-4 md:p-6 space-y-6 overflow-auto">
        <Tabs defaultValue="player" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="player">Player de Karaokê</TabsTrigger>
            <TabsTrigger value="info">Informações</TabsTrigger>
          </TabsList>

          <TabsContent value="player" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Player de Karaokê</CardTitle>
                <CardDescription>
                  Reproduza arquivos MIDI/KAR ou MP3+G (CDG) com letras sincronizadas.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="file-upload">Selecione um arquivo de karaokê</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".mid,.kar,.cdg,.zip"
                    onChange={handleFileChange}
                  />
                  <p className="text-sm text-muted-foreground">
                    Formatos suportados: MIDI (.mid, .kar), CDG (.cdg, .zip)
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadExampleFile('midi')}
                    className="flex items-center gap-1"
                    disabled={!exampleFilesLoaded}
                  >
                    <Music className="h-4 w-4" />
                    Exemplo MIDI
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadExampleFile('cdg')}
                    className="flex items-center gap-1"
                    disabled={!exampleFilesLoaded}
                  >
                    <FileMusic className="h-4 w-4" />
                    Exemplo CDG
                  </Button>
                </div>

                {filePath ? (
                  <div className="mt-4">
                    <KaraokePlayer
                      type={fileType}
                      filePath={filePath}
                      onScoreUpdate={handleScoreUpdate}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-md">
                    <FileMusic className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Selecione um arquivo para iniciar a reprodução</p>
                  </div>
                )}

                {score > 0 && (
                  <div className="mt-4 p-4 bg-primary/10 rounded-md">
                    <div className="flex items-center gap-2">
                      <Mic2 className="h-5 w-5 text-primary" />
                      <h3 className="font-medium">Sua pontuação</h3>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="w-full h-4 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${score}%` }}
                        ></div>
                      </div>
                      <span className="font-bold">{score}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle>Sobre as Bibliotecas de Karaokê</CardTitle>
                <CardDescription>
                  Informações sobre as bibliotecas utilizadas nesta demonstração.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">JZZ-gui-Karaoke</h3>
                  <p className="text-sm">Biblioteca para reprodução de arquivos MIDI/KAR com exibição sincronizada de letras.</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground pl-4 space-y-1">
                    <li>Suporte a arquivos MIDI com letras embutidas</li>
                    <li>Exibição sincronizada de letras</li>
                    <li>Controle de reprodução e volume</li>
                    <li>Estrutura DOM personalizável para estilização</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">CDGPlayer</h3>
                  <p className="text-sm">Biblioteca para reprodução de arquivos MP3+G (CDG) com gráficos sincronizados.</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground pl-4 space-y-1">
                    <li>Suporte a arquivos MP3+G (em formato ZIP)</li>
                    <li>Renderização de gráficos CD+G</li>
                    <li>Controles de reprodução integrados</li>
                    <li>Suporte a metadados de áudio</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Pontuação de Karaokê</h3>
                  <p className="text-sm">A pontuação nesta demonstração é simulada. Em uma implementação real, seria utilizada detecção de tom para comparar a voz do usuário com as notas esperadas.</p>
                  <p className="text-sm text-muted-foreground">Para implementar pontuação real, seria necessário utilizar bibliotecas adicionais como pitch-detection ou ml5.js para análise de áudio.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PlaybackPage;

import React, { useState } from 'react';

// Mocking Shadcn UI components for demonstration
const Dialog = ({ children }) => <div>{children}</div>;
const DialogContent = ({ children }) => <div style={{ border: '1px solid #ccc', padding: '20px', background: 'white' }}>{children}</div>;
const DialogHeader = ({ children }) => <div>{children}</div>;
const DialogTitle = ({ children }) => <h2>{children}</h2>;
const DialogDescription = ({ children }) => <p>{children}</p>;
const Input = (props) => <input {...props} />;
const Label = (props) => <label {...props} />;
const Button = ({ children, ...props }) => <button {...props}>{children}</button>;

const ImportHoleriteModal = ({ isOpen, setIsOpen, onImportSuccess }) => {
  const [step, setStep] = useState('upload'); // 'upload' or 'validation'
  const [file, setFile] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError('');
  };

  const handleProcessFile = async () => {
    if (!file) {
      setError('Por favor, selecione um arquivo.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      // In a real app, you'd use FormData to send the file.
      // const formData = new FormData();
      // formData.append('holerite', file);
      const response = await fetch('/api/import-holerite', { method: 'POST' /* body: formData */ });
      if (!response.ok) {
        throw new Error('Falha ao processar o arquivo.');
      }
      const data = await response.json();
      setExtractedData(data);
      setStep('validation');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidationChange = (e) => {
    const { name, value } = e.target;
    setExtractedData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/holerites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(extractedData),
      });
      if (!response.ok) {
        throw new Error('Falha ao salvar o holerite.');
      }
      alert('Holerite salvo com sucesso!'); // Simple feedback
      onImportSuccess(); // Callback to refresh data on the main page
      handleClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    // Reset state after a short delay
    setTimeout(() => {
      setStep('upload');
      setFile(null);
      setExtractedData(null);
      setError('');
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar Holerite</DialogTitle>
          <DialogDescription>
            {step === 'upload'
              ? 'Selecione o arquivo do holerite (PDF, JPG, PNG) para extrair os dados.'
              : 'Verifique os dados extraídos e salve as informações.'}
          </DialogDescription>
        </DialogHeader>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        {step === 'upload' && (
          <div>
            <Label htmlFor="holerite-file">Arquivo do Holerite</Label>
            <Input id="holerite-file" type="file" onChange={handleFileChange} />
            <Button onClick={handleProcessFile} disabled={isLoading || !file}>
              {isLoading ? 'Processando...' : 'Processar Arquivo'}
            </Button>
          </div>
        )}

        {step === 'validation' && extractedData && (
          <div>
            {Object.entries(extractedData).map(([key, value]) => (
              <div key={key}>
                <Label htmlFor={key}>{key}</Label>
                <Input
                  id={key}
                  name={key}
                  value={value}
                  onChange={handleValidationChange}
                />
              </div>
            ))}
            <Button onClick={handleSaveChanges} disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar Holerite'}
            </Button>
          </div>
        )}
        <Button onClick={handleClose} variant="secondary">Fechar</Button>
      </DialogContent>
    </Dialog>
  );
};

export default ImportHoleriteModal;

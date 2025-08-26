import React from 'react';

const FileUpload = () => {
  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
      <p className="mb-2 text-sm text-gray-500">Arraste e solte os arquivos aqui ou clique para selecionar</p>
      <input type="file" multiple className="hidden" />
      <button className="mt-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
        Selecionar Arquivos
      </button>
      <p className="mt-2 text-xs text-gray-400">PDF, até 10MB</p>
    </div>
  );
};

export default FileUpload;

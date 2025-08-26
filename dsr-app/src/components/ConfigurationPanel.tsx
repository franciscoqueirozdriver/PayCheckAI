import React from 'react';

const ConfigurationPanel = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-gray-700">Considerar sábado como dia útil?</span>
        <label htmlFor="saturdaySwitch" className="flex items-center cursor-pointer">
          <div className="relative">
            <input type="checkbox" id="saturdaySwitch" className="sr-only" />
            <div className="block bg-gray-600 w-14 h-8 rounded-full"></div>
            <div className="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition"></div>
          </div>
        </label>
      </div>

      <div>
        <label htmlFor="localHolidays" className="block text-sm font-medium text-gray-700 mb-2">
          Feriados locais adicionais (formato: DD/MM/AAAA)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            name="localHolidays"
            id="localHolidays"
            className="flex-grow mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Ex: 25/01/2024"
          />
          <button className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700">
            Adicionar
          </button>
        </div>
        <div className="mt-2 text-sm text-gray-500">
            {/* Lista de feriados adicionados apareceria aqui */}
        </div>
      </div>

      <button className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
        Salvar Configurações
      </button>
    </div>
  );
};

export default ConfigurationPanel;

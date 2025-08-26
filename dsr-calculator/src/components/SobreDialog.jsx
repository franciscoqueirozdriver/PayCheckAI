import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';

export default function SobreDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="text-blue-500 hover:underline">Sobre</button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
          <Dialog.Title className="text-2xl font-bold mb-2">
            Sobre a Calculadora de DSR
          </Dialog.Title>
          <Dialog.Description className="text-gray-700 mb-4">
            Esta é uma ferramenta para auxiliar no cálculo do Descanso Semanal Remunerado (DSR) sobre comissões de vendas.
          </Dialog.Description>
          <p className="text-sm text-gray-600">
            O cálculo leva em consideração os dias úteis, domingos e feriados do mês selecionado, com base na legislação e nas convenções coletivas que geralmente consideram o sábado como dia útil.
          </p>
          <Dialog.Close asChild>
            <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
              Fechar
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

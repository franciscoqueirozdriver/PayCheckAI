// A minimal set of types to support the new extraction script.
// This can be expanded as we build the new extractor.

export interface Holerite {
    nomeFuncionario: string | null;
    cargo: string | null;
    periodo: string | null;
    totalVencimentos: number | null;
    totalDescontos: number | null;
    valorLiquido: number | null;
    detalhes: Array<{
        codigo: string;
        descricao: string;
        referencia: string | null;
        vencimentos: number | null;
        descontos: number | null;
    }>;
}

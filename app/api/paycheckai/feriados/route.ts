import { NextRequest, NextResponse } from 'next/server';
import municipalHolidaysData from '@/src/lib/paycheckai/municipal.json';

// --- Type Definitions ---
interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
  type: 'national' | 'state' | 'municipal';
  scope: string; // e.g., 'BR', 'BR-SP', 'IBGE-3550308'
  source: string;
}

// New type for the Invertexto API response
interface InvertextoFeriado {
    date: string;
    name: string;
    type: 'feriado' | 'facultativo';
    level: 'nacional' | 'estadual';
}

type MunicipalHolidays = Record<string, Record<string, { date: string; name: string }[]>>;

const municipalHolidays: MunicipalHolidays = municipalHolidaysData;

// NOTE: In a real application, this should come from process.env
const INVERTEXTO_TOKEN = '21402|JipPBIvm1zjnQHUesNshTHnz7UsZAXyA';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year');
  const uf = searchParams.get('uf');
  const ibge = searchParams.get('ibge');
  const includeMunicipal = searchParams.get('includeMunicipal') === '1';

  if (!year || !/^\d{4}$/.test(year)) {
    return NextResponse.json({ error: 'Parâmetro "year" (YYYY) é obrigatório.' }, { status: 400 });
  }

  const allHolidays: Holiday[] = [];
  const sources = {
    invertexto: 'invertexto.com',
    municipal: 'local',
  };

  try {
    // --- New Fetch Logic for Invertexto API ---
    let apiUrl = `https://api.invertexto.com/v1/holidays/${year}?token=${INVERTEXTO_TOKEN}`;
    if (uf) {
      apiUrl += `&state=${uf.toUpperCase()}`;
    }

    const invertextoResponse = await fetch(apiUrl, {
        next: { revalidate: 86400 }, // 24h cache
    });

    if (invertextoResponse.ok) {
        const externalHolidays: InvertextoFeriado[] = await invertextoResponse.json();

        externalHolidays
            .filter(h => h.type === 'feriado') // Only include non-optional holidays
            .forEach(h => {
                const isNational = h.level === 'nacional';
                allHolidays.push({
                    date: h.date,
                    name: h.name,
                    type: isNational ? 'national' : 'state',
                    scope: isNational ? 'BR' : `BR-${uf?.toUpperCase()}`,
                    source: sources.invertexto,
                });
            });
    } else {
        console.error('Invertexto API fetch failed:', await invertextoResponse.text());
    }

    // --- Municipal Holiday Logic (Unchanged) ---
    if (includeMunicipal && ibge && municipalHolidays[year] && municipalHolidays[year][ibge]) {
      const holidays = municipalHolidays[year][ibge];
      holidays.forEach(h => {
        allHolidays.push({
          date: h.date,
          name: h.name,
          type: 'municipal',
          scope: `IBGE-${ibge}`,
          source: sources.municipal,
        });
      });
    }

    // --- Deduplication & Sorting (Unchanged) ---
    const uniqueHolidays = new Map<string, Holiday>();
    allHolidays.forEach(h => {
      const key = `${h.date}|${h.type}|${h.scope}`;
      if (!uniqueHolidays.has(key)) {
        uniqueHolidays.set(key, h);
      }
    });

    const finalHolidays = Array.from(uniqueHolidays.values())
      .sort((a, b) => a.date.localeCompare(b.date));

    const responsePayload = {
      year,
      uf: uf || null,
      ibge: ibge || null,
      holidays: finalHolidays,
    };

    return NextResponse.json(responsePayload);

  } catch (error) {
    console.error('Error in /api/feriados:', error);
    return NextResponse.json({ error: 'Erro interno ao processar feriados.' }, { status: 500 });
  }
}

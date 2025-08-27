import { NextRequest, NextResponse } from 'next/server';
import municipalHolidaysData from '@/lib/municipal.json';

// --- Type Definitions ---
interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
  type: 'national' | 'state' | 'municipal';
  scope: string; // e.g., 'BR', 'BR-SP', 'IBGE-3550308'
  source: string;
}

interface BrasilAPIFeriado {
  date: string;
  name: string;
  type: string;
}

interface NagerDateFeriado {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  fixed: boolean;
  global: boolean;
  counties: string[] | null; // e.g., ["BR-SP"]
  launchYear: number | null;
  types: string[]; // e.g., ["Public"]
}

type MunicipalHolidays = Record<string, Record<string, { date: string; name: string }[]>>;

// Cast the imported JSON to our type
const municipalHolidays: MunicipalHolidays = municipalHolidaysData;

// Opt out of caching for this route handler. Fetches within are still cached.
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
    national: 'BrasilAPI',
    state: 'Nager.Date',
    municipal: 'local',
  };

  try {
    // --- Fetch External Holidays in Parallel ---
    const [brasilApiResult, nagerResult] = await Promise.allSettled([
      fetch(`https://brasilapi.com.br/api/feriados/v1/${year}`, { next: { revalidate: 86400 } }), // 24h cache
      uf ? fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/BR`, { next: { revalidate: 86400 } }) : Promise.resolve(null),
    ]);

    // 1. National Holidays (BrasilAPI)
    if (brasilApiResult.status === 'fulfilled' && brasilApiResult.value.ok) {
      const nationalHolidays: BrasilAPIFeriado[] = await brasilApiResult.value.json();
      nationalHolidays.forEach(h => {
        allHolidays.push({
          date: h.date,
          name: h.name,
          type: 'national',
          scope: 'BR',
          source: sources.national,
        });
      });
    } else {
      console.error('BrasilAPI fetch failed:', brasilApiResult.status === 'rejected' ? brasilApiResult.reason : 'Response not OK');
    }

    // 2. State Holidays (Nager.Date)
    if (uf && nagerResult.status === 'fulfilled' && nagerResult.value && nagerResult.value.ok) {
      const nagerHolidays: NagerDateFeriado[] = await nagerResult.value.json();
      const stateScope = `BR-${uf.toUpperCase()}`;
      nagerHolidays.forEach(h => {
        if (h.counties && h.counties.includes(stateScope)) {
          allHolidays.push({
            date: h.date,
            name: h.name,
            type: 'state',
            scope: stateScope,
            source: sources.state,
          });
        }
      });
    } else if (uf) {
      console.error('Nager.Date fetch failed:', nagerResult.status === 'rejected' ? nagerResult.reason : 'Response not OK');
    }

    // 3. Municipal Holidays (Local JSON)
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

    // 4. Deduplication & Sorting
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

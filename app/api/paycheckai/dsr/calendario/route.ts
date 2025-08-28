import { NextRequest, NextResponse } from 'next/server';

interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
  type: 'national' | 'state' | 'municipal';
}

// Opt out of caching for this route handler
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const yearStr = searchParams.get('year');
  const monthStr = searchParams.get('month');
  const uf = searchParams.get('uf');
  const ibge = searchParams.get('ibge');
  const includeSaturday = searchParams.get('includeSaturday') === '1';
  const considerarFeriados = searchParams.get('considerarFeriados') === '1';

  // --- Parameter Validation ---
  if (!yearStr || !/^\d{4}$/.test(yearStr)) {
    return NextResponse.json({ error: 'Parâmetro "year" (YYYY) é obrigatório.' }, { status: 400 });
  }
  if (!monthStr || !/^(1[0-2]|[1-9])$/.test(monthStr)) {
    return NextResponse.json({ error: 'Parâmetro "month" (1-12) é obrigatório.' }, { status: 400 });
  }

  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-based month

  try {
    let holidays: Holiday[] = [];
    if (considerarFeriados) {
      // Internal fetch to our own API
      const baseUrl = request.nextUrl.origin;
      const feriadosUrl = new URL('/api/paycheckai/feriados', baseUrl);
      feriadosUrl.searchParams.set('year', yearStr);
      if (uf) feriadosUrl.searchParams.set('uf', uf);
      if (ibge) feriadosUrl.searchParams.set('ibge', ibge);
      feriadosUrl.searchParams.set('includeMunicipal', '1');

      const feriadosResponse = await fetch(feriadosUrl.toString());
      if (feriadosResponse.ok) {
        const data = await feriadosResponse.json();
        holidays = data.holidays || [];
      } else {
        console.error(`Internal fetch to /api/paycheckai/feriados failed: ${feriadosResponse.status}`);
        // Gracefully degrade: continue calculation without holidays
      }
    }

    const holidayDates = new Set(holidays.map(h => h.date));

    // --- Calendar Calculation (Timezone: UTC) ---
    const daysInMonth: Date[] = [];
    const daysCount = new Date(Date.UTC(year, month, 0)).getUTCDate();

    for (let day = 1; day <= daysCount; day++) {
      daysInMonth.push(new Date(Date.UTC(year, month - 1, day)));
    }

    let sundays = 0;
    let businessDaysWithSaturday = 0;
    let businessDaysWithoutSaturday = 0;
    let holidaysUtil = 0;

    for (const day of daysInMonth) {
      const dayOfWeek = day.getUTCDay(); // 0=Sunday, 6=Saturday
      const dateString = day.toISOString().split('T')[0]; // YYYY-MM-DD

      const isSunday = dayOfWeek === 0;
      const isSaturday = dayOfWeek === 6;
      const isHoliday = holidayDates.has(dateString);

      if (isSunday) {
        sundays++;
      }

      if (isHoliday) {
        // A holiday is "util" (counts as a day off for the DSR numerator)
        // if it falls on what would have been a working day.
        const isHolidayOnWorkday = includeSaturday ? !isSunday : (!isSunday && !isSaturday);
        if (isHolidayOnWorkday) {
            holidaysUtil++;
        }
      }

      // A day is a "business day" (for the DSR divisor) if it's not a day off.
      // Days off are Sundays and holidays. Saturdays are optional.
      if (!isSunday && !isHoliday) {
        businessDaysWithSaturday++;
        if (!isSaturday) {
          businessDaysWithoutSaturday++;
        }
      }
    }

    const responsePayload = {
      year,
      month,
      businessDays: {
        withSaturday: businessDaysWithSaturday,
        withoutSaturday: businessDaysWithoutSaturday,
      },
      sundays,
      holidaysUtil,
      holidays,
    };

    return NextResponse.json(responsePayload);

  } catch (error) {
    console.error('Error in /api/dsr/calendario:', error);
    return NextResponse.json({ error: 'Erro interno ao processar calendário.' }, { status: 500 });
  }
}

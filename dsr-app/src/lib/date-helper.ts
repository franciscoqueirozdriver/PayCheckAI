interface Holiday {
  date: string;
  name: string;
  type: string;
}

/**
 * Fetches the list of national holidays for a given year.
 * It calls our own API endpoint, which caches the result from BrasilAPI.
 * @param year The year to fetch holidays for.
 * @returns A promise that resolves to an array of holiday objects.
 */
async function getHolidays(year: number): Promise<Holiday[]> {
  try {
    // On the server-side, fetch needs the full URL.
    // In a real deployment, this should come from an environment variable.
    const apiBaseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    const response = await fetch(`${apiBaseUrl}/api/holidays?year=${year}`);

    if (!response.ok) {
      console.error(`Failed to fetch holidays for year ${year}. Status: ${response.status}`);
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error("Network error while fetching holidays.", error);
    return [];
  }
}

/**
 * Calculates the number of working days (with and without Saturdays) and rest days for a given month and year.
 * @param year The full year (e.g., 2024).
 * @param month The month (1-12).
 * @returns An object containing the day counts.
 */
export async function getDayCountsForMonth(year: number, month: number) {
  const holidays = await getHolidays(year);
  const feriadosSet = new Set(holidays.map(f => f.date));
  const daysInMonth = new Date(year, month, 0).getDate();

  let diasSemSabado = 0; // Mon-Fri that are not holidays
  let diasComSabado = 0;  // Mon-Sat that are not holidays
  let diasDescanso = 0;   // Sun + Holidays

  for (let d = 1; d <= daysInMonth; d++) {
    const currentDate = new Date(year, month - 1, d);
    const dayOfWeek = currentDate.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const dateStr = currentDate.toISOString().split('T')[0];

    const isHoliday = feriadosSet.has(dateStr);

    if (dayOfWeek === 0 || isHoliday) {
      diasDescanso++;
    } else if (dayOfWeek === 6) { // Saturday
      diasComSabado++;
    } else { // Weekday (Mon-Fri)
      diasSemSabado++;
      diasComSabado++;
    }
  }

  return { diasSemSabado, diasComSabado, diasDescanso };
}

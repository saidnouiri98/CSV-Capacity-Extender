
import { EmployeeEntry } from '../types';

/**
 * Parses DD/MM/YYYY string into a Date object
 */
export const parseDateString = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('/').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Formats a Date object into DD/MM/YYYY string
 */
export const formatDateString = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Processes the raw CSV string
 */
export const processCsvData = (
  rawContent: string,
  targetDate: Date
): { processedContent: string; originalCount: number; addedCount: number } => {
  // Split by lines and clean up
  const lines = rawContent.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) throw new Error('CSV file is empty or missing headers');

  const header = lines[0];
  const dataLines = lines.slice(1);
  
  // Map rows to objects
  // Header: Nom;Capacité;Mois;Année;BU
  const entries: EmployeeEntry[] = dataLines.map(line => {
    const parts = line.split(';');
    return {
      nom: (parts[0] || '').trim(),
      capacite: (parts[1] || '').trim(),
      mois: (parts[2] || '').trim(),
      annee: (parts[3] || '').trim(),
      bu: (parts[4] || '').trim()
    };
  }).filter(e => e.nom !== '');

  // Group by Nom to find latest entry
  const latestEntriesMap = new Map<string, EmployeeEntry>();
  
  entries.forEach(entry => {
    const existing = latestEntriesMap.get(entry.nom);
    if (!existing) {
      latestEntriesMap.set(entry.nom, entry);
    } else {
      const existingDate = parseDateString(existing.mois);
      const currentDate = parseDateString(entry.mois);
      if (currentDate > existingDate) {
        latestEntriesMap.set(entry.nom, entry);
      }
    }
  });

  // Create new entries for the target date
  const targetDateStr = formatDateString(targetDate);
  const targetYearStr = targetDate.getFullYear().toString();
  
  const newEntries: EmployeeEntry[] = Array.from(latestEntriesMap.values()).map(latest => ({
    nom: latest.nom,
    capacite: latest.capacite,
    mois: targetDateStr,
    annee: targetYearStr,
    bu: latest.bu
  }));

  // Combine and sort
  const allEntries = [...entries, ...newEntries];
  
  // Sort by Nom, then by date
  allEntries.sort((a, b) => {
    const nameComp = a.nom.localeCompare(b.nom);
    if (nameComp !== 0) return nameComp;
    
    const dateA = parseDateString(a.mois);
    const dateB = parseDateString(b.mois);
    return dateA.getTime() - dateB.getTime();
  });

  // Build result string
  const resultLines = [header];
  allEntries.forEach(e => {
    resultLines.push(`${e.nom};${e.capacite};${e.mois};${e.annee};${e.bu}`);
  });

  return {
    processedContent: resultLines.join('\n'),
    originalCount: entries.length,
    addedCount: newEntries.length
  };
};

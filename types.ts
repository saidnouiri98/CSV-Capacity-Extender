
export interface EmployeeEntry {
  nom: string;
  capacite: string;
  mois: string;
  annee: string;
  bu: string;
}

export interface ProcessingResult {
  content: string;
  rowCount: number;
  newEntriesCount: number;
  fileName: string;
}

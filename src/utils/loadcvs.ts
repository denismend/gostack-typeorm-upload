import csvParse from 'csv-parse';
import fs from 'fs';

interface CSVFileLinesToImportDTO {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

async function loadCSV(filePath: string): Promise<CSVFileLinesToImportDTO[]> {
  const readCSVStream = fs.createReadStream(filePath);

  const parseStream = csvParse({
    from_line: 2,
    ltrim: true,
    rtrim: true,
  });

  const parseCSV = readCSVStream.pipe(parseStream);

  const lines: CSVFileLinesToImportDTO[] = [];

  parseCSV.on('data', line => {
    lines.push(line);
  });

  await new Promise(resolve => {
    parseCSV.on('end', resolve);
  });

  const linesToImport: CSVFileLinesToImportDTO[] = [];

  lines.forEach(line => {
    const { title, type, value, category } = line;

    linesToImport.push({
      title,
      type,
      value,
      category,
    });
  });

  return linesToImport;
}

export default loadCSV;

#!/usr/bin/env node
/**
 * resolve-conflict-keep-head.js
 *
 * Risolve automaticamente conflitti di merge Git mantenendo SEMPRE la
 * sezione HEAD (locale) e scartando la sezione del branch remoto/incoming.
 *
 * USO:
 *   node resolve-conflict-keep-head.js <file1> <file2> ...
 *
 * ATTENZIONE: pensato per conflitti dove ogni blocco va risolto allo stesso
 * modo (sempre HEAD). NON usarlo se anche un solo blocco del file richiede
 * di tenere la versione remota o di fare merge manuale riga per riga.
 * Lo script si FERMA e non scrive nulla se trova marker di conflitto
 * malformati o annidati in modo inatteso.
 */

const fs = require('fs');
const path = require('path');

function resolveFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  const lines = original.split(/\r?\n/);

  const output = [];
  let i = 0;
  let blocksResolved = 0;
  let inConflict = false;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('<<<<<<<')) {
      if (inConflict) {
        throw new Error(
          `Marker <<<<<<< annidato senza chiusura precedente, riga ${i + 1} in ${filePath}. Interrotto, nessuna modifica scritta.`
        );
      }
      inConflict = true;
      const headLines = [];
      i++;

      // Raccoglie la sezione HEAD fino a =======
      let foundSeparator = false;
      while (i < lines.length) {
        if (lines[i].startsWith('=======')) {
          foundSeparator = true;
          i++;
          break;
        }
        if (lines[i].startsWith('<<<<<<<')) {
          throw new Error(
            `Marker <<<<<<< annidato dentro un blocco HEAD, riga ${i + 1} in ${filePath}. Interrotto, nessuna modifica scritta.`
          );
        }
        headLines.push(lines[i]);
        i++;
      }
      if (!foundSeparator) {
        throw new Error(
          `Separatore ======= non trovato per il blocco apertosi prima della riga ${i + 1} in ${filePath}. Interrotto, nessuna modifica scritta.`
        );
      }

      // Salta la sezione remota fino a >>>>>>>
      let foundEnd = false;
      while (i < lines.length) {
        if (lines[i].startsWith('>>>>>>>')) {
          foundEnd = true;
          i++;
          break;
        }
        i++;
      }
      if (!foundEnd) {
        throw new Error(
          `Marker >>>>>>> non trovato per il blocco apertosi prima della riga ${i + 1} in ${filePath}. Interrotto, nessuna modifica scritta.`
        );
      }

      inConflict = false;
      blocksResolved++;
      output.push(...headLines);
      continue;
    }

    output.push(line);
    i++;
  }

  if (inConflict) {
    throw new Error(`Blocco di conflitto non chiuso correttamente in ${filePath}. Interrotto, nessuna modifica scritta.`);
  }

  return { resolved: output.join('\n'), blocksResolved };
}

function main() {
  const files = process.argv.slice(2);
  if (files.length === 0) {
    console.error('Uso: node resolve-conflict-keep-head.js <file1> [file2] ...');
    process.exit(1);
  }

  let anyError = false;

  for (const file of files) {
    const filePath = path.resolve(file);
    if (!fs.existsSync(filePath)) {
      console.error(`✗ File non trovato: ${filePath}`);
      anyError = true;
      continue;
    }

    try {
      const { resolved, blocksResolved } = resolveFile(filePath);

      if (blocksResolved === 0) {
        console.log(`- ${file}: nessun marker di conflitto trovato, file lasciato invariato.`);
        continue;
      }

      // Backup di sicurezza prima di sovrascrivere
      const backupPath = filePath + '.preconflict.bak';
      fs.writeFileSync(backupPath, fs.readFileSync(filePath));

      fs.writeFileSync(filePath, resolved);
      console.log(`✓ ${file}: risolti ${blocksResolved} blocchi (tenuta sempre la sezione HEAD). Backup salvato in ${path.basename(backupPath)}`);
    } catch (err) {
      console.error(`✗ ${file}: ${err.message}`);
      anyError = true;
    }
  }

  if (anyError) {
    console.error('\nUno o più file NON sono stati modificati per sicurezza. Controlla i messaggi sopra prima di procedere.');
    process.exit(1);
  } else {
    console.log('\nFatto. Ora controlla i file con "git diff" (dovrebbe risultare un diff pulito, senza marker), poi:');
    console.log('  git add <file...>');
    console.log('  git rebase --continue');
  }
}

main();

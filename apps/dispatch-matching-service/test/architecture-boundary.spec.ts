import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Architecture Boundary Guard (ISSUE-004A)', () => {
  const srcDir = path.resolve(__dirname, '../src');

  function getAllTsFiles(dir: string): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...getAllTsFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.ts')) {
        files.push(fullPath);
      }
    }
    return files;
  }

  it('verifies dispatch runtime code has zero direct imports of @fieldforge/database or auth-owned schemas', () => {
    const files = getAllTsFiles(srcDir);
    const forbiddenPatterns = [
      '@fieldforge/database',
      'technicianProfiles',
      'technicianCertifications',
      'technician_profiles',
      'technician_certifications',
      'DrizzleModule',
      'drizzle-orm'
    ];

    const violations: { file: string; pattern: string; line: number; content: string }[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!.trim();
        if (line.startsWith('//') || line.startsWith('*') || line.startsWith('/*')) {
          continue;
        }
        for (const pattern of forbiddenPatterns) {
          if (line.includes(pattern)) {
            violations.push({
              file: path.relative(srcDir, file),
              pattern,
              line: i + 1,
              content: line
            });
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });
});

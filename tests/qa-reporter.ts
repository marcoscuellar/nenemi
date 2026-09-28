import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import fs from 'node:fs';
import path from 'node:path';

// Prints the sweep as one markdown table: View | Viewport | Console Errors | Token Audit | Status.
// Each test adds a `qa-row` annotation (JSON) for every view it covered; a test that failed
// before recording anything still gets a row, so nothing goes missing from the summary.
type Row = { view: string; viewport: string; consoleErrors: number | string; tokenAudit: string; status: 'PASS' | 'FAIL' };

export default class QaReporter implements Reporter {
  private rows: Row[] = [];

  printsToStdio() { return false; }

  onTestEnd(test: TestCase, result: TestResult) {
    const viewport = test.parent.project()?.name ?? '?';
    const failed = result.status !== 'passed' && result.status !== 'skipped';
    const src = result.annotations?.length ? result.annotations : test.annotations; // newer Playwright mirrors them in both
    const own = src.filter(a => a.type === 'qa-row' && a.description);
    const rows = own.map(a => ({ ...(JSON.parse(a.description!) as Omit<Row, 'viewport'>), viewport }));
    this.rows.push(...rows);
    // a crash or timeout the test didn't get to record still shows up as its own FAIL row
    if (failed && !rows.some(r => r.status === 'FAIL'))
      this.rows.push({ view: `${test.title} (stopped: ${result.error?.message?.split('\n')[0].slice(0, 60) ?? result.status})`, viewport, consoleErrors: '—', tokenAudit: '—', status: 'FAIL' });
  }

  onEnd() {
    if (!this.rows.length) return;
    const head = ['View', 'Viewport', 'Console Errors', 'Token Audit', 'Status'];
    // phone first, then desktop; the critical path after the views (tests finish in parallel, out of order)
    const rank = (r: Row) => (r.viewport === 'phone' ? 0 : 1) * 2 + (r.view.startsWith('Path:') ? 1 : 0);
    this.rows.sort((a, b) => rank(a) - rank(b));
    const body = this.rows.map(r => [r.view, r.viewport, String(r.consoleErrors), r.tokenAudit, r.status]);
    const w = head.map((h, i) => Math.max(h.length, ...body.map(b => b[i].length)));
    const line = (cells: string[]) => '| ' + cells.map((c, i) => c.padEnd(w[i])).join(' | ') + ' |';
    const table = [line(head), '| ' + w.map(n => '-'.repeat(n)).join(' | ') + ' |', ...body.map(line)].join('\n');
    const fails = this.rows.filter(r => r.status === 'FAIL').length;
    const summary = `\n## NÈNÈMI AI QA sweep\n\n${table}\n\n${fails ? `**${fails} FAIL**` : '**All PASS**'} · ${this.rows.length} checks\n`;
    console.log(summary);
    try {
      fs.mkdirSync('test-results', { recursive: true });
      fs.writeFileSync(path.join('test-results', 'qa-summary.md'), summary);
    } catch { /* the terminal copy is the one that matters */ }
  }
}

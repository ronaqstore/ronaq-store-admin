import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  formatDateLabel,
  formatNumber,
  formatPercent,
  formatPkrCompact,
  formatPkrFull,
  truncateChartLabel,
} from './formatters.ts';

describe('Dashboard Formatters', () => {
  it('formats full PKR correctly', () => {
    assert.equal(formatPkrFull(0), 'Rs 0');
    assert.equal(formatPkrFull(10000000), 'Rs 100,000');
    assert.equal(formatPkrFull(104843500), 'Rs 1,048,435');
    assert.equal(formatPkrFull(-2500000), '-Rs 25,000');
  });

  it('formats compact PKR with Lakh and Crore', () => {
    assert.equal(formatPkrCompact(0), 'Rs 0');
    assert.equal(formatPkrCompact(50000), 'Rs 500');
    assert.equal(formatPkrCompact(2500000), 'Rs 25K');
    assert.equal(formatPkrCompact(21000000), 'Rs 2.1L');
    assert.equal(formatPkrCompact(1400000000), 'Rs 1.4Cr');
    assert.equal(formatPkrCompact(-21000000), '-Rs 2.1L');
  });

  it('formats percent change correctly', () => {
    assert.equal(formatPercent(12.4), '+12.4%');
    assert.equal(formatPercent(-3.1), '-3.1%');
    assert.equal(formatPercent(0), '0.0%');
  });

  it('formats integer numbers', () => {
    assert.equal(formatNumber(1250), '1,250');
    assert.equal(formatNumber(0), '0');
  });

  it('formats date labels by granularity', () => {
    assert.equal(formatDateLabel('2026-10-15', 'day'), '15 Oct');
    assert.equal(formatDateLabel('2026-10-15', 'month'), 'Oct 2026');
    assert.equal(formatDateLabel('2026-10-15T14:30:00.000Z', 'hour'), '14:30');
  });

  it('truncates long chart axis labels', () => {
    assert.equal(truncateChartLabel('Short', 22), 'Short');
    assert.equal(
      truncateChartLabel('Anker Car Charger Dual 0.5m 3-Port Soft Touch Starlight', 22),
      'Anker Car Charger Dua…',
    );
  });
});

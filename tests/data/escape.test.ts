import { expect, test } from 'vitest'
import { escapeHtml, safeClass } from '../../src/data/escape'

test('escapeHtml', () => { expect(escapeHtml(`<a href="x">'&`)).toBe('&lt;a href=&quot;x&quot;&gt;&#39;&amp;') })
test('safeClass keeps only letters', () => { expect(safeClass('Epic" onload="x')).toBe('Epiconloadx') })

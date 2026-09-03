## Constants

<dl>
<dt><a href="#FREQUENCIES">FREQUENCIES</a></dt>
<dd><p>Cashflow Simulation Logic
Pure functions for generating cashflow events and calculating balances.</p>
</dd>
<dt><a href="#SIMPLE_PERIOD_DAYS">SIMPLE_PERIOD_DAYS</a></dt>
<dd><p>Simple period frequencies mapped to their step size in days.</p>
</dd>
<dt><a href="#MONTH_PERIODS">MONTH_PERIODS</a></dt>
<dd><p>Month-based frequencies mapped to their step size in months.</p>
</dd>
<dt><a href="#ISO_RE">ISO_RE</a></dt>
<dd><p>Date input normalization for user- and CSV-provided date strings.
Dependency-free so it can be used by the SPA and tests alike.</p>
<p>Strategy (per product decision): auto-fix recognizable formats into
strict ISO YYYY-MM-DD; anything ambiguous or unparseable returns null
so the caller can warn the user and reject the input.</p>
</dd>
<dt><a href="#FREQUENCY_RANK">FREQUENCY_RANK</a></dt>
<dd><p>Chronological rank of each frequency, shortest recurrence first.</p>
</dd>
<dt><a href="#OPEN_ENDED">OPEN_ENDED</a></dt>
<dd><p>Open-ended events (no endDate) sort after bounded ones in ascending order.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#getNextMonthYear">getNextMonthYear(currentMonth, currentYear, monthsToAdd)</a> ⇒ <code>Object</code></dt>
<dd><p>Get the next month and year when adding months, handling overflow</p>
</dd>
<dt><a href="#isLeapYear">isLeapYear(year)</a> ⇒ <code>boolean</code></dt>
<dd><p>Check if a year is a leap year</p>
</dd>
<dt><a href="#addMonthsClamped">addMonthsClamped(year, month, monthsToAdd, anchorDay)</a> ⇒ <code>Date</code></dt>
<dd><p>Add <code>monthsToAdd</code> months to y/m, clamping the day to <code>anchorDay</code> and the
target month&#39;s length.</p>
</dd>
<dt><a href="#isValidDate">isValidDate(d)</a> ⇒ <code>boolean</code></dt>
<dd><p>Check if a date is valid (not Invalid Date)</p>
</dd>
<dt><a href="#parseDate">parseDate(dateStr)</a> ⇒ <code>Date</code></dt>
<dd><p>Parse a date string or return as-is if already a Date
Uses UTC to avoid timezone shifts when constructing from YYYY-MM-DD.</p>
</dd>
<dt><a href="#addAnnualClamped">addAnnualClamped(year, month, anchorDay)</a> ⇒ <code>Date</code></dt>
<dd><p>Add one year, clamping Feb 29 to Feb 28 in non-leap years.</p>
</dd>
<dt><a href="#addPeriod">addPeriod(date, frequency, [anchorDay])</a> ⇒ <code>Date</code></dt>
<dd><p>Add a time period to a date (using UTC to avoid timezone shifts).
For month-based frequencies, the resulting day-of-month is clamped to
<code>anchorDay</code> (the event&#39;s original start day) so occurrences do not
permanently drift when a shorter month truncates the day (e.g. Jan 31 →
Feb 28 → Mar 31, not Mar 28).</p>
</dd>
<dt><a href="#getEventEnd">getEventEnd(endDate, [eventName])</a> ⇒ <code>Date</code> | <code>null</code></dt>
<dd><p>Get the event end date or null if not set.
Accepts ISO date strings, Date instances, or empty/whitespace values
(treated as &quot;no end date&quot;). Unparseable values throw instead of being
silently ignored — an Invalid Date poisons all comparisons and would
make the event run forever.</p>
</dd>
<dt><a href="#getEffectiveEnd">getEffectiveEnd(eventEnd, simulationEnd)</a> ⇒ <code>Date</code></dt>
<dd><p>Get the effective end date for the simulation</p>
</dd>
<dt><a href="#findFirstOccurrence">findFirstOccurrence(startDate, targetStart, frequency, [anchorDay])</a> ⇒ <code>Date</code></dt>
<dd><p>Find the first occurrence date on or after a given date</p>
</dd>
<dt><a href="#generateEventCashflows">generateEventCashflows(event, simStart, simEnd)</a> ⇒ <code><a href="#CashflowOccurrence">Array.&lt;CashflowOccurrence&gt;</a></code></dt>
<dd><p>Generate all occurrences of a single event within the simulation range.
Returns array of {date, value, name} objects.</p>
</dd>
<dt><a href="#runSimulation">runSimulation(events, initialBalance, simStart, simEnd)</a> ⇒ <code><a href="#CashflowEntry">Array.&lt;CashflowEntry&gt;</a></code></dt>
<dd><p>Run a full cashflow simulation.
Returns one entry per calendar day from simStart to simEnd (inclusive).
Days with no events have cashflow=0 and balance carried forward.</p>
</dd>
<dt><a href="#isRealDate">isRealDate(year, month, day)</a> ⇒ <code>boolean</code></dt>
<dd><p>Check whether y/m/d form a real calendar date (rejects e.g. 2025-02-30).</p>
</dd>
<dt><a href="#toISO">toISO(year, month, day)</a> ⇒ <code>string</code></dt>
<dd><p>Format y/m/d as a zero-padded ISO date string.</p>
</dd>
<dt><a href="#normalizeIso">normalizeIso(value)</a> ⇒ <code>string</code> | <code>null</code></dt>
<dd><p>Normalize strict (&quot;2025-03-31&quot;) or loose (&quot;2025-3-1&quot;) ISO input.</p>
</dd>
<dt><a href="#normalizeSlash">normalizeSlash(match)</a> ⇒ <code>string</code> | <code>null</code></dt>
<dd><p>Normalize &quot;D/M/YYYY&quot; or &quot;M/D/YYYY&quot;. Only unambiguous inputs (exactly one
of the first two components &gt; 12) are auto-fixed; ambiguous or impossible
combinations return null.</p>
</dd>
<dt><a href="#normalizeDotted">normalizeDotted(match)</a> ⇒ <code>string</code> | <code>null</code></dt>
<dd><p>Normalize European dotted &quot;D.M.YYYY&quot; (day-first convention).</p>
</dd>
<dt><a href="#normalizeDateInput">normalizeDateInput(input)</a> ⇒ <code>string</code> | <code>null</code></dt>
<dd><p>Normalize a free-form date string into strict ISO YYYY-MM-DD.</p>
<p>Accepted inputs:</p>
<ul>
<li>&quot;YYYY-MM-DD&quot; (returned zero-padded as-is when it is a real calendar date)</li>
<li>&quot;YYYY-M-D&quot; (zero-padded)</li>
<li>&quot;D/M/YYYY&quot; or &quot;M/D/YYYY&quot; — only when unambiguous (exactly one of the
first two components is &gt; 12); ambiguous cases return null</li>
<li>&quot;D.M.YYYY&quot; (European dotted convention, day-first)</li>
<li>Date instances (formatted by their UTC components)</li>
</ul>
</dd>
<dt><a href="#periodValue">periodValue(event)</a> ⇒ <code>string</code></dt>
<dd><p>Sortable composite of an event&#39;s period: startDate first, then endDate
(open-ended treated as far future). ISO dates compare lexicographically.</p>
</dd>
<dt><a href="#compareStrings">compareStrings(a, b)</a> ⇒ <code>number</code></dt>
<dd></dd>
<dt><a href="#frequencyRank">frequencyRank(event)</a> ⇒ <code>number</code></dt>
<dd></dd>
<dt><a href="#compareByKey">compareByKey(a, b, key)</a> ⇒ <code>number</code></dt>
<dd><p>Compare two events by the requested sort key only — secondary tie-breaks
are applied by sortEvents so they never flip with the direction.</p>
</dd>
<dt><a href="#signGroup">signGroup(event)</a> ⇒ <code>number</code></dt>
<dd><p>Sign group for the positive-first value order: income block first,
then zeros, then the expense block.</p>
</dd>
<dt><a href="#sortEvents">sortEvents(events, key, direction)</a> ⇒ <code><a href="#SortableEvent">Array.&lt;SortableEvent&gt;</a></code></dt>
<dd><p>Sort events by key and direction without mutating the input.
Equal keys keep their original relative order (stable), and secondary
tie-breaks (period, then original index) stay ascending regardless of
direction so groups of equal rows always appear in a consistent order.</p>
</dd>
<dt><a href="#nextEventSort">nextEventSort(current, key)</a> ⇒ <code><a href="#EventSort">EventSort</a></code> | <code>null</code></dt>
<dd><p>Cycle the sort state when a column header is clicked:
unsorted → ascending → descending → unsorted. The Value column adds a
fourth state (positive values on top, negative values at the bottom):
ascending → descending → positive-first → unsorted. Clicking a
different column always starts ascending.</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#Event">Event</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#CashflowEntry">CashflowEntry</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#CashflowOccurrence">CashflowOccurrence</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#EventSortKey">EventSortKey</a> : <code>&#x27;startDate&#x27;</code> | <code>&#x27;frequency&#x27;</code> | <code>&#x27;value&#x27;</code></dt>
<dd></dd>
<dt><a href="#EventSortDirection">EventSortDirection</a> : <code>&#x27;asc&#x27;</code> | <code>&#x27;desc&#x27;</code> | <code>&#x27;positive-first&#x27;</code></dt>
<dd><p>&#39;positive-first&#39; keeps positive values on top and negative values at the
bottom, ordered by the rule sort(x) if x &gt; 0 else sort(abs(x)) —
incomes ascending, then zeros, then expenses by ascending absolute
value (largest expense last). Only meaningful for &#39;value&#39;.</p>
</dd>
<dt><a href="#EventSort">EventSort</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#SortableEvent">SortableEvent</a> : <code>Object</code></dt>
<dd><p>An event as stored by the SPA: ISO date strings, empty endDate when
open-ended. Mirrors the engine&#39;s Event type with dates as strings —
the jsdoc parser used for API.md cannot resolve cross-file typedefs.</p>
</dd>
</dl>

<a name="FREQUENCIES"></a>

## FREQUENCIES

Cashflow Simulation Logic
Pure functions for generating cashflow events and calculating balances.

**Kind**: global constant  
<a name="SIMPLE_PERIOD_DAYS"></a>

## SIMPLE_PERIOD_DAYS

Simple period frequencies mapped to their step size in days.

**Kind**: global constant  
<a name="MONTH_PERIODS"></a>

## MONTH_PERIODS

Month-based frequencies mapped to their step size in months.

**Kind**: global constant  
<a name="ISO_RE"></a>

## ISO_RE

Date input normalization for user- and CSV-provided date strings.
Dependency-free so it can be used by the SPA and tests alike.

Strategy (per product decision): auto-fix recognizable formats into
strict ISO YYYY-MM-DD; anything ambiguous or unparseable returns null
so the caller can warn the user and reject the input.

**Kind**: global constant  
<a name="FREQUENCY_RANK"></a>

## FREQUENCY_RANK

Chronological rank of each frequency, shortest recurrence first.

**Kind**: global constant  
<a name="OPEN_ENDED"></a>

## OPEN_ENDED

Open-ended events (no endDate) sort after bounded ones in ascending order.

**Kind**: global constant  
<a name="getNextMonthYear"></a>

## getNextMonthYear(currentMonth, currentYear, monthsToAdd) ⇒ <code>Object</code>

Get the next month and year when adding months, handling overflow

**Kind**: global function

| Param        | Type                | Description             |
| ------------ | ------------------- | ----------------------- |
| currentMonth | <code>number</code> | 0-indexed month         |
| currentYear  | <code>number</code> | Full year               |
| monthsToAdd  | <code>number</code> | Number of months to add |

<a name="isLeapYear"></a>

## isLeapYear(year) ⇒ <code>boolean</code>

Check if a year is a leap year

**Kind**: global function

| Param | Type                |
| ----- | ------------------- |
| year  | <code>number</code> |

<a name="addMonthsClamped"></a>

## addMonthsClamped(year, month, monthsToAdd, anchorDay) ⇒ <code>Date</code>

Add `monthsToAdd` months to y/m, clamping the day to `anchorDay` and the
target month's length.

**Kind**: global function

| Param       | Type                | Description                            |
| ----------- | ------------------- | -------------------------------------- |
| year        | <code>number</code> | Full year                              |
| month       | <code>number</code> | 0-indexed month                        |
| monthsToAdd | <code>number</code> | Number of months to add                |
| anchorDay   | <code>number</code> | Day-of-month anchor for the recurrence |

<a name="isValidDate"></a>

## isValidDate(d) ⇒ <code>boolean</code>

Check if a date is valid (not Invalid Date)

**Kind**: global function

| Param | Type              |
| ----- | ----------------- |
| d     | <code>Date</code> |

<a name="parseDate"></a>

## parseDate(dateStr) ⇒ <code>Date</code>

Parse a date string or return as-is if already a Date
Uses UTC to avoid timezone shifts when constructing from YYYY-MM-DD.

**Kind**: global function

| Param   | Type                                     |
| ------- | ---------------------------------------- |
| dateStr | <code>Date</code> \| <code>string</code> |

<a name="addAnnualClamped"></a>

## addAnnualClamped(year, month, anchorDay) ⇒ <code>Date</code>

Add one year, clamping Feb 29 to Feb 28 in non-leap years.

**Kind**: global function

| Param     | Type                | Description                            |
| --------- | ------------------- | -------------------------------------- |
| year      | <code>number</code> | Full year                              |
| month     | <code>number</code> | 0-indexed month                        |
| anchorDay | <code>number</code> | Day-of-month anchor for the recurrence |

<a name="addPeriod"></a>

## addPeriod(date, frequency, [anchorDay]) ⇒ <code>Date</code>

Add a time period to a date (using UTC to avoid timezone shifts).
For month-based frequencies, the resulting day-of-month is clamped to
`anchorDay` (the event's original start day) so occurrences do not
permanently drift when a shorter month truncates the day (e.g. Jan 31 →
Feb 28 → Mar 31, not Mar 28).

**Kind**: global function

| Param       | Type                | Description                                                                                                            |
| ----------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| date        | <code>Date</code>   |                                                                                                                        |
| frequency   | <code>string</code> |                                                                                                                        |
| [anchorDay] | <code>number</code> | Day-of-month to anchor month-based recurrences to. Defaults to the day of `date`. Ignored by daily/weekly frequencies. |

<a name="getEventEnd"></a>

## getEventEnd(endDate, [eventName]) ⇒ <code>Date</code> \| <code>null</code>

Get the event end date or null if not set.
Accepts ISO date strings, Date instances, or empty/whitespace values
(treated as "no end date"). Unparseable values throw instead of being
silently ignored — an Invalid Date poisons all comparisons and would
make the event run forever.

**Kind**: global function  
**Throws**:

- <code>Error</code> When endDate is set but cannot be parsed as a date

| Param       | Type                                                                                    | Description                   |
| ----------- | --------------------------------------------------------------------------------------- | ----------------------------- |
| endDate     | <code>Date</code> \| <code>string</code> \| <code>null</code> \| <code>undefined</code> |                               |
| [eventName] | <code>string</code>                                                                     | Event name for error messages |

<a name="getEffectiveEnd"></a>

## getEffectiveEnd(eventEnd, simulationEnd) ⇒ <code>Date</code>

Get the effective end date for the simulation

**Kind**: global function

| Param         | Type                                   |
| ------------- | -------------------------------------- |
| eventEnd      | <code>Date</code> \| <code>null</code> |
| simulationEnd | <code>Date</code>                      |

<a name="findFirstOccurrence"></a>

## findFirstOccurrence(startDate, targetStart, frequency, [anchorDay]) ⇒ <code>Date</code>

Find the first occurrence date on or after a given date

**Kind**: global function

| Param       | Type                | Description                                     |
| ----------- | ------------------- | ----------------------------------------------- |
| startDate   | <code>Date</code>   |                                                 |
| targetStart | <code>Date</code>   |                                                 |
| frequency   | <code>string</code> |                                                 |
| [anchorDay] | <code>number</code> | Day-of-month anchor for month-based recurrences |

<a name="generateEventCashflows"></a>

## generateEventCashflows(event, simStart, simEnd) ⇒ [<code>Array.&lt;CashflowOccurrence&gt;</code>](#CashflowOccurrence)

Generate all occurrences of a single event within the simulation range.
Returns array of {date, value, name} objects.

**Kind**: global function  
**Throws**:

- <code>Error</code> When startDate or endDate cannot be parsed

| Param    | Type                         |
| -------- | ---------------------------- |
| event    | [<code>Event</code>](#Event) |
| simStart | <code>Date</code>            |
| simEnd   | <code>Date</code>            |

<a name="generateEventCashflows..result"></a>

### generateEventCashflows~result : [<code>Array.&lt;CashflowOccurrence&gt;</code>](#CashflowOccurrence)

**Kind**: inner constant of [<code>generateEventCashflows</code>](#generateEventCashflows)  
<a name="runSimulation"></a>

## runSimulation(events, initialBalance, simStart, simEnd) ⇒ [<code>Array.&lt;CashflowEntry&gt;</code>](#CashflowEntry)

Run a full cashflow simulation.
Returns one entry per calendar day from simStart to simEnd (inclusive).
Days with no events have cashflow=0 and balance carried forward.

**Kind**: global function  
**Throws**:

- <code>Error</code> When any event has an unparseable startDate/endDate, or an invalid frequency

| Param          | Type                                       | Description                 |
| -------------- | ------------------------------------------ | --------------------------- |
| events         | [<code>Array.&lt;Event&gt;</code>](#Event) | Array of events to simulate |
| initialBalance | <code>number</code>                        | Starting balance            |
| simStart       | <code>Date</code> \| <code>string</code>   | Simulation start date       |
| simEnd         | <code>Date</code> \| <code>string</code>   | Simulation end date         |

<a name="isRealDate"></a>

## isRealDate(year, month, day) ⇒ <code>boolean</code>

Check whether y/m/d form a real calendar date (rejects e.g. 2025-02-30).

**Kind**: global function

| Param | Type                | Description     |
| ----- | ------------------- | --------------- |
| year  | <code>number</code> | Full year       |
| month | <code>number</code> | 1-indexed month |
| day   | <code>number</code> | Day of month    |

<a name="toISO"></a>

## toISO(year, month, day) ⇒ <code>string</code>

Format y/m/d as a zero-padded ISO date string.

**Kind**: global function

| Param | Type                | Description     |
| ----- | ------------------- | --------------- |
| year  | <code>number</code> | Full year       |
| month | <code>number</code> | 1-indexed month |
| day   | <code>number</code> | Day of month    |

<a name="normalizeIso"></a>

## normalizeIso(value) ⇒ <code>string</code> \| <code>null</code>

Normalize strict ("2025-03-31") or loose ("2025-3-1") ISO input.

**Kind**: global function

| Param | Type                | Description                     |
| ----- | ------------------- | ------------------------------- |
| value | <code>string</code> | Trimmed, non-empty input string |

<a name="normalizeSlash"></a>

## normalizeSlash(match) ⇒ <code>string</code> \| <code>null</code>

Normalize "D/M/YYYY" or "M/D/YYYY". Only unambiguous inputs (exactly one
of the first two components > 12) are auto-fixed; ambiguous or impossible
combinations return null.

**Kind**: global function

| Param | Type                         | Description                        |
| ----- | ---------------------------- | ---------------------------------- |
| match | <code>RegExpExecArray</code> | SLASH_RE match: [full, a, b, year] |

<a name="normalizeDotted"></a>

## normalizeDotted(match) ⇒ <code>string</code> \| <code>null</code>

Normalize European dotted "D.M.YYYY" (day-first convention).

**Kind**: global function

| Param | Type                         | Description                               |
| ----- | ---------------------------- | ----------------------------------------- |
| match | <code>RegExpExecArray</code> | DOTTED_RE match: [full, day, month, year] |

<a name="normalizeDateInput"></a>

## normalizeDateInput(input) ⇒ <code>string</code> \| <code>null</code>

Normalize a free-form date string into strict ISO YYYY-MM-DD.

Accepted inputs:

- "YYYY-MM-DD" (returned zero-padded as-is when it is a real calendar date)
- "YYYY-M-D" (zero-padded)
- "D/M/YYYY" or "M/D/YYYY" — only when unambiguous (exactly one of the
  first two components is > 12); ambiguous cases return null
- "D.M.YYYY" (European dotted convention, day-first)
- Date instances (formatted by their UTC components)

**Kind**: global function  
**Returns**: <code>string</code> \| <code>null</code> - ISO "YYYY-MM-DD" string, or null when the input
is empty, ambiguous, or not a real calendar date

| Param | Type                                                                                    | Description    |
| ----- | --------------------------------------------------------------------------------------- | -------------- |
| input | <code>string</code> \| <code>Date</code> \| <code>null</code> \| <code>undefined</code> | Raw date value |

<a name="periodValue"></a>

## periodValue(event) ⇒ <code>string</code>

Sortable composite of an event's period: startDate first, then endDate
(open-ended treated as far future). ISO dates compare lexicographically.

**Kind**: global function

| Param | Type                                         |
| ----- | -------------------------------------------- |
| event | [<code>SortableEvent</code>](#SortableEvent) |

<a name="compareStrings"></a>

## compareStrings(a, b) ⇒ <code>number</code>

**Kind**: global function

| Param | Type                |
| ----- | ------------------- |
| a     | <code>string</code> |
| b     | <code>string</code> |

<a name="frequencyRank"></a>

## frequencyRank(event) ⇒ <code>number</code>

**Kind**: global function

| Param | Type                                         |
| ----- | -------------------------------------------- |
| event | [<code>SortableEvent</code>](#SortableEvent) |

<a name="compareByKey"></a>

## compareByKey(a, b, key) ⇒ <code>number</code>

Compare two events by the requested sort key only — secondary tie-breaks
are applied by sortEvents so they never flip with the direction.

**Kind**: global function

| Param | Type                                         |
| ----- | -------------------------------------------- |
| a     | [<code>SortableEvent</code>](#SortableEvent) |
| b     | [<code>SortableEvent</code>](#SortableEvent) |
| key   | [<code>EventSortKey</code>](#EventSortKey)   |

<a name="signGroup"></a>

## signGroup(event) ⇒ <code>number</code>

Sign group for the positive-first value order: income block first,
then zeros, then the expense block.

**Kind**: global function

| Param | Type                                         |
| ----- | -------------------------------------------- |
| event | [<code>SortableEvent</code>](#SortableEvent) |

<a name="sortEvents"></a>

## sortEvents(events, key, direction) ⇒ [<code>Array.&lt;SortableEvent&gt;</code>](#SortableEvent)

Sort events by key and direction without mutating the input.
Equal keys keep their original relative order (stable), and secondary
tie-breaks (period, then original index) stay ascending regardless of
direction so groups of equal rows always appear in a consistent order.

**Kind**: global function

| Param     | Type                                                       |
| --------- | ---------------------------------------------------------- |
| events    | [<code>Array.&lt;SortableEvent&gt;</code>](#SortableEvent) |
| key       | [<code>EventSortKey</code>](#EventSortKey)                 |
| direction | [<code>EventSortDirection</code>](#EventSortDirection)     |

<a name="nextEventSort"></a>

## nextEventSort(current, key) ⇒ [<code>EventSort</code>](#EventSort) \| <code>null</code>

Cycle the sort state when a column header is clicked:
unsorted → ascending → descending → unsorted. The Value column adds a
fourth state (positive values on top, negative values at the bottom):
ascending → descending → positive-first → unsorted. Clicking a
different column always starts ascending.

**Kind**: global function

| Param   | Type                                                      |
| ------- | --------------------------------------------------------- |
| current | [<code>EventSort</code>](#EventSort) \| <code>null</code> |
| key     | [<code>EventSortKey</code>](#EventSortKey)                |

<a name="Event"></a>

## Event : <code>Object</code>

**Kind**: global typedef  
**Properties**

| Name      | Type                                     | Description                               |
| --------- | ---------------------------------------- | ----------------------------------------- | ------ | ------- | --------- | ----------- | ------ |
| name      | <code>string</code>                      |                                           |
| startDate | <code>Date</code> \| <code>string</code> |                                           |
| endDate   | <code>Date</code> \| <code>string</code> |                                           |
| frequency | <code>string</code>                      | daily                                     | weekly | monthly | quarterly | semi-annual | annual |
| value     | <code>number</code>                      | positive for income, negative for expense |

<a name="CashflowEntry"></a>

## CashflowEntry : <code>Object</code>

**Kind**: global typedef  
**Properties**

| Name     | Type                              | Description                                   |
| -------- | --------------------------------- | --------------------------------------------- |
| date     | <code>Date</code>                 |                                               |
| cashflow | <code>number</code>               | total cashflow for this date                  |
| balance  | <code>number</code>               | running balance after this date               |
| items    | <code>Array.&lt;string&gt;</code> | names of events contributing to this cashflow |

<a name="CashflowOccurrence"></a>

## CashflowOccurrence : <code>Object</code>

**Kind**: global typedef  
**Properties**

| Name  | Type                |
| ----- | ------------------- |
| date  | <code>Date</code>   |
| value | <code>number</code> |
| name  | <code>string</code> |

<a name="EventSortKey"></a>

## EventSortKey : <code>&#x27;startDate&#x27;</code> \| <code>&#x27;frequency&#x27;</code> \| <code>&#x27;value&#x27;</code>

**Kind**: global typedef  
<a name="EventSortDirection"></a>

## EventSortDirection : <code>&#x27;asc&#x27;</code> \| <code>&#x27;desc&#x27;</code> \| <code>&#x27;positive-first&#x27;</code>

'positive-first' keeps positive values on top and negative values at the
bottom, ordered by the rule sort(x) if x > 0 else sort(abs(x)) —
incomes ascending, then zeros, then expenses by ascending absolute
value (largest expense last). Only meaningful for 'value'.

**Kind**: global typedef  
<a name="EventSort"></a>

## EventSort : <code>Object</code>

**Kind**: global typedef  
**Properties**

| Name      | Type                                                   |
| --------- | ------------------------------------------------------ |
| key       | [<code>EventSortKey</code>](#EventSortKey)             |
| direction | [<code>EventSortDirection</code>](#EventSortDirection) |

<a name="SortableEvent"></a>

## SortableEvent : <code>Object</code>

An event as stored by the SPA: ISO date strings, empty endDate when
open-ended. Mirrors the engine's Event type with dates as strings —
the jsdoc parser used for API.md cannot resolve cross-file typedefs.

**Kind**: global typedef  
**Properties**

| Name      | Type                | Description                               |
| --------- | ------------------- | ----------------------------------------- | ------ | ------- | --------- | ----------- | ------ |
| name      | <code>string</code> |                                           |
| startDate | <code>string</code> | YYYY-MM-DD                                |
| endDate   | <code>string</code> | YYYY-MM-DD, or '' when open-ended         |
| frequency | <code>string</code> | daily                                     | weekly | monthly | quarterly | semi-annual | annual |
| value     | <code>number</code> | positive for income, negative for expense |

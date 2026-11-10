# Global Academy · KS5 Sports Media

Public course website for students and parents: course outline, curriculum journey, units, weekly log guide and checker, grading, parent information, progression, and a live media jobs board with a CV checker.

- `index.html` – the whole site (one page, hash routes such as `#jobs`, `#units`).
- `jobs.json` – the jobs board data. A scheduled task refreshes it every five days; the page also has a built-in copy as a fallback.

The staff progress tracker is not on this site; it stays private in Claude (linked from the footer).

The CV checker runs entirely in the student's browser. Nothing is uploaded or stored. The optional "deeper check" copies a prompt for the student to paste into their own AI account.

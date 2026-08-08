# Quarterly reports

Save each quarterly report PDF in this folder, named for the quarter it
covers:

    taizan-2027-q1.pdf
    taizan-2027-q2.pdf

That is all that is required. On the next build the report appears on
/performance as a download, with its period and file size filled in
automatically. There is no manifest to edit.

The filename must contain `<year>-q<1-4>` somewhere. Anything before or
after that is ignored, so `taizan-2027-q1.pdf` and `2027-q1-final.pdf`
both work. A file without a recognisable quarter is skipped, and the
build prints a warning saying so — it is never listed under a guessed
date.

## The numbers are separate

Putting a PDF here publishes the *document*. It does not publish the
*returns*. Those live in `src/lib/reports.ts`, in the `QUARTERS` array,
and must be entered by hand from reconciled figures.

That separation is deliberate. A document is a document; a published
return is a claim about money, and the two should not happen by the same
action. A report can be downloadable before its figures are entered, and
the performance page handles that correctly.

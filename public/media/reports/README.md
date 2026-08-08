# Quarterly reports

Drop the PDF here, then register it in `src/lib/reports.ts`.

    public/media/reports/taizan-2027-q1.pdf

```ts
{
  id: "2027-q1",
  label: "Q1 2027",
  period: "January – March 2027",
  published: "2027-04-18",
  href: "/media/reports/taizan-2027-q1.pdf",
  summary: "Portfolio positioning, material changes and commentary.",
}
```

Then fill that quarter's row in `PERFORMANCE` for each portfolio.

Naming: `taizan-<year>-q<n>.pdf`, lowercase, no spaces. Spaces in a media
URL need encoding and break silently across CDNs.

Only reconciled, verified figures. A published return cannot be quietly
corrected later.

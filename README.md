# Georgia 2025 Election Dashboard

Interactive dashboard analyzing the November 4, 2025 Georgia Public Service Commission special election — the first odd-year statewide election in Georgia since 1998.

**Live site:** Deployed via GitHub Pages (see Settings → Pages after first push)

## Features

- **Heat map** with 8 toggleable metrics: turnout %, Dem margin (diverging), Dem/Rep share, total ballots (log-scale), and per-method breakdowns
- **Race toggle** — view PSC District 2 (Alicia Johnson vs Tim Echols), District 3 (Peter Hubbard vs Fitz Johnson), or both combined
- **KPI strip** — 1.58M ballots cast, 21.9% turnout, 62.8% D / 37.2% R, 22 counties flipped from Trump 2024
- **Vote method breakdown** — Election Day vs Early In-Person vs Absentee Mail with party splits
- **Congressional district view** — all 14 CDs ranked by Dem share with rep names
- **Demographics × turnout scatter** with on-the-fly Pearson correlation across 158 counties
- **Sortable county leaderboard** with search filter
- **Drill-down modal** for any county — click the map or table

## Data sources

- **Results:** [Enhanced Voting public results portal](https://app.enhancedvoting.com/results/public/Georgia/elections/MunicipalGeneralSpecialElectionPSC11042025)
- **Demographics:** U.S. Census Bureau ACS 5-year estimates (2023)
- **Geography:** Plotly's US counties GeoJSON, filtered to Georgia
- **Registered voters:** Georgia Secretary of State (statewide official total: 7,235,263)

## Caveats

- County-level turnout uses voting-age population (~77% of total population) as the denominator since registered-voter counts are not published per county on the same export. Statewide turnout uses the official 7,235,263 registered voter denominator.
- Fulton County's D3 Fitz Johnson total was missing from the official JSON export (showed 0); estimated as 47,357 from the parallel D2 Echols Fulton total. Flagged in code with `d3_fitz_estimated: true`.
- The ~25K gap between total ballots cast (1,581,296) and D2/D3 vote totals (~1,556K) reflects undervotes — voters who cast a ballot but didn't vote in the PSC race. This is normal in down-ballot races.

## Local development

```bash
# Serve the static files locally
python3 -m http.server 8765
# Open http://localhost:8765
```

Stack: vanilla JS, [D3 v7](https://d3js.org/) for the choropleth, [Plotly 2.35.2](https://plotly.com/javascript/) for charts. No build step.

## File layout

```
index.html         Layout, KPI cards, filter controls, chart containers
style.css          Design system (sober NYT-inspired palette)
app.js             Rendering logic — D3 map, Plotly charts, Pearson correlation, drill-down
data.js            Bundled county results + demographics + GeoJSON (~190KB)
cd-mapping.js      County→CD lookup and 7-region groupings
data/              Source data files
```

## License

Data: public records (Georgia SoS, U.S. Census Bureau). Code: MIT.

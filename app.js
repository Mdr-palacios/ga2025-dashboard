/* =====================================================================
   Georgia 2025 Election Dashboard — main application
   Renders: heat map, KPIs, vote method chart, congressional district chart,
   demographics scatter, and county leaderboard with drill-down.
===================================================================== */

(function() {
  'use strict';

  // -------- State --------
  const state = {
    race: 'd2',          // 'd2' | 'd3' | 'combined'
    metric: 'turnout_pct_vap',
    agg: 'county',       // 'county' | 'cd' | 'region'
    selectedCounty: null,
    sort: 'total_ballots',
    search: '',
  };

  const counties = window.GA_COUNTIES || [];
  const geo = window.GA_GEO || { features: [] };
  const cdMap = window.GA_COUNTY_CD || {};
  const regionMap = window.GA_COUNTY_REGION || {};

  // CD representatives (for chart labels)
  const cdReps = {
    1: "Carter (R)", 2: "Bishop (D)", 3: "Jack (R)", 4: "H. Johnson (D)",
    5: "N. Williams (D)", 6: "McBath (D)", 7: "McCormick (R)", 8: "A. Scott (R)",
    9: "Clyde (R)", 10: "Collins (R)", 11: "Loudermilk (R)", 12: "Allen (R)",
    13: "D. Scott (D)", 14: "Greene (R)"
  };

  // Color scales (party-aware) — vibrant, viridis/plasma-inspired
  const colorScales = {
    turnout_pct_vap: { type: 'sequential', range: [10, 35], colors: ['#fff7d6','#f5a623','#c2185b'] },        // sunny yellow → orange → magenta
    margin: { type: 'diverging', range: [-60, 60], colors: ['#e63946','#fffaf0','#1d6fb8'] },                  // bright red ↔ vivid blue
    dem_pct: { type: 'sequential', range: [10, 95], colors: ['#eaf4fb','#4ea3d8','#0d3b66'] },                // soft sky → vivid blue
    rep_pct: { type: 'sequential', range: [5, 90], colors: ['#fff1ee','#f08576','#c41e3a'] },                  // warm peach → vivid red
    total_ballots: { type: 'sequential-log', range: [50, 230000], colors: ['#fff7d6','#ff8c42','#7b1fa2'] },   // pale yellow → orange → purple
    pct_advance_in_person: { type: 'sequential', range: [15, 70], colors: ['#f0fbf2','#5cc97a','#1b6e3c'] },  // mint → bright green
    pct_election_day: { type: 'sequential', range: [25, 85], colors: ['#fff7d6','#ff9f43','#b8336a'] },        // butter → coral → berry
    pct_absentee_mail: { type: 'sequential', range: [0, 5], colors: ['#f3eefb','#a78bfa','#5b21b6'] },         // lavender → bright violet
    mobilization_2024: { type: 'sequential', range: [10, 50], colors: ['#fef3c7','#06b6d4','#0e7490'] },      // cream → cyan → deep teal
    mobilization_2022: { type: 'sequential', range: [15, 70], colors: ['#fef3c7','#06b6d4','#0e7490'] },
  };

  // Metric labels & formatters
  const metricLabels = {
    turnout_pct_vap: 'Turnout (% of voting-age pop)',
    margin: 'Democratic margin (pp)',
    dem_pct: 'Democratic %',
    rep_pct: 'Republican %',
    total_ballots: 'Ballots cast',
    pct_advance_in_person: 'Early in-person %',
    pct_election_day: 'Election Day %',
    pct_absentee_mail: 'Absentee mail %',
    mobilization_2024: 'Mobilization vs 2024 general (PSC ÷ 2024)',
    mobilization_2022: 'Mobilization vs 2022 midterm (PSC ÷ 2022)',
  };
  const fmtPct = v => v == null ? '—' : v.toFixed(1) + '%';
  const fmtPP = v => v == null ? '—' : (v >= 0 ? '+' : '') + v.toFixed(1) + 'pp';
  const fmtInt = v => v == null ? '—' : v.toLocaleString('en-US');
  const fmtCompact = v => {
    if (v == null) return '—';
    if (v >= 1e6) return (v/1e6).toFixed(2) + 'M';
    if (v >= 1e3) return (v/1e3).toFixed(1) + 'K';
    return v.toLocaleString();
  };
  const fmtMoney = v => v == null ? '—' : '$' + v.toLocaleString('en-US');

  // =================================================================
  // Helpers: derive race-specific values from county
  // =================================================================
  function valueOf(c, key) {
    if (state.race === 'd2') {
      const m = { dem_pct: c.d2_dem_pct, rep_pct: c.d2_rep_pct, margin: c.d2_margin };
      if (m[key] !== undefined) return m[key];
    } else if (state.race === 'd3') {
      const m = { dem_pct: c.d3_dem_pct, rep_pct: c.d3_rep_pct, margin: c.d3_margin };
      if (m[key] !== undefined) return m[key];
    } else {
      // combined: average D2 and D3
      if (key === 'dem_pct') return ((c.d2_dem_pct||0) + (c.d3_dem_pct||0)) / 2;
      if (key === 'rep_pct') return ((c.d2_rep_pct||0) + (c.d3_rep_pct||0)) / 2;
      if (key === 'margin') return ((c.d2_margin||0) + (c.d3_margin||0)) / 2;
    }
    return c[key];
  }

  // =================================================================
  // Color interpolation
  // =================================================================
  function getColor(val, metric) {
    const cfg = colorScales[metric];
    if (!cfg || val == null) return '#e2dfd6';
    const [a, b] = cfg.range;
    let t;
    if (cfg.type === 'sequential-log') {
      const lv = Math.log10(Math.max(val, 1));
      const la = Math.log10(Math.max(a, 1));
      const lb = Math.log10(b);
      t = Math.max(0, Math.min(1, (lv - la) / (lb - la)));
    } else {
      t = Math.max(0, Math.min(1, (val - a) / (b - a)));
    }
    const colors = cfg.colors;
    if (cfg.type === 'diverging') {
      // 3-stop diverging
      if (t < 0.5) return d3.interpolateRgb(colors[0], colors[1])(t * 2);
      else return d3.interpolateRgb(colors[1], colors[2])((t - 0.5) * 2);
    } else {
      if (t < 0.5) return d3.interpolateRgb(colors[0], colors[1])(t * 2);
      else return d3.interpolateRgb(colors[1], colors[2])((t - 0.5) * 2);
    }
  }

  // =================================================================
  // KPI Row
  // =================================================================
  function renderKPIs() {
    const el = document.getElementById('kpi-row');
    const total_d2 = counties.reduce((s, c) => s + c.d2_total, 0);
    const total_d3 = counties.reduce((s, c) => s + c.d3_total, 0);
    const total_d2_dem = counties.reduce((s, c) => s + c.d2_johnson, 0);
    const total_d2_rep = counties.reduce((s, c) => s + c.d2_echols, 0);
    const total_d3_dem = counties.reduce((s, c) => s + c.d3_hubbard, 0);
    const total_d3_rep = counties.reduce((s, c) => s + c.d3_fitz, 0);
    const total_ballots = Math.max(total_d2, total_d3);
    const ed = counties.reduce((s, c) => s + c.method_election_day, 0);
    const av = counties.reduce((s, c) => s + c.method_advance_in_person, 0);
    const ab = counties.reduce((s, c) => s + c.method_absentee_mail, 0);
    const totalMethod = ed + av + ab;

    let demVotes, repVotes, totalVotes;
    if (state.race === 'd2') {
      demVotes = total_d2_dem; repVotes = total_d2_rep; totalVotes = total_d2;
    } else if (state.race === 'd3') {
      demVotes = total_d3_dem; repVotes = total_d3_rep; totalVotes = total_d3;
    } else {
      demVotes = total_d2_dem + total_d3_dem; repVotes = total_d2_rep + total_d3_rep; totalVotes = total_d2 + total_d3;
    }
    const demPct = (demVotes / totalVotes * 100).toFixed(1);
    const repPct = (repVotes / totalVotes * 100).toFixed(1);
    const margin = (demPct - repPct).toFixed(1);

    // Statewide turnout uses official figures: 1,581,296 ballots / 7,235,263 registered = 21.86%
    // (Per Georgia Secretary of State official certification)
    const OFFICIAL_BALLOTS = 1581296;
    const OFFICIAL_REGISTERED = 7235263;
    const turnout = (OFFICIAL_BALLOTS / OFFICIAL_REGISTERED * 100).toFixed(1);

    el.innerHTML = `
      <div class="kpi"><p class="kpi-label">Ballots Cast</p>
        <p class="kpi-value">${fmtCompact(OFFICIAL_BALLOTS)}</p>
        <p class="kpi-sub">${fmtInt(OFFICIAL_BALLOTS)} total</p></div>
      <div class="kpi"><p class="kpi-label">Turnout</p>
        <p class="kpi-value">${turnout}%</p>
        <p class="kpi-sub">~⅓ of 2024 general turnout</p></div>
      <div class="kpi dem"><p class="kpi-label">Democratic</p>
        <p class="kpi-value">${demPct}%</p>
        <p class="kpi-sub">${fmtCompact(demVotes)} votes</p></div>
      <div class="kpi rep"><p class="kpi-label">Republican</p>
        <p class="kpi-value">${repPct}%</p>
        <p class="kpi-sub">${fmtCompact(repVotes)} votes</p></div>
      <div class="kpi"><p class="kpi-label">Early In-Person</p>
        <p class="kpi-value">${(av/totalMethod*100).toFixed(1)}%</p>
        <p class="kpi-sub">${fmtCompact(av)} ballots</p></div>
      <div class="kpi"><p class="kpi-label">Counties Flipped</p>
        <p class="kpi-value">21</p>
        <p class="kpi-sub">flipped from Trump 2024</p></div>
    `;

    document.getElementById('hdr-turnout').textContent = turnout + '%';
    document.getElementById('hdr-ballots').textContent = fmtCompact(OFFICIAL_BALLOTS);
  }

  // =================================================================
  // Map (D3 choropleth)
  // =================================================================
  let mapInited = false;
  let projection, pathGen, svgMap;
  const tooltip = document.createElement('div');
  tooltip.className = 'map-tooltip';
  document.body.appendChild(tooltip);

  function renderMap() {
    const container = document.getElementById('map');
    const w = container.clientWidth;
    const h = container.clientHeight;

    if (!mapInited) {
      svgMap = d3.select(container).append('svg').attr('viewBox', `0 0 ${w} ${h}`);
      projection = d3.geoMercator().fitSize([w, h], geo);
      pathGen = d3.geoPath().projection(projection);

      svgMap.selectAll('path.county-path')
        .data(geo.features)
        .enter()
        .append('path')
        .attr('class', 'county-path')
        .attr('d', pathGen)
        .attr('data-name', d => d.properties.name)
        .on('mouseenter', function(e, d) {
          const c = counties.find(x => x.county === d.properties.name);
          if (!c) return;
          showTooltip(e, c);
          d3.select(this).raise();
        })
        .on('mousemove', moveTooltip)
        .on('mouseleave', () => tooltip.classList.remove('show'))
        .on('click', function(e, d) {
          const c = counties.find(x => x.county === d.properties.name);
          if (c) openDrill(c);
        });
      mapInited = true;
    }

    // Update colors based on metric/race
    svgMap.selectAll('path.county-path')
      .transition().duration(280)
      .attr('fill', d => {
        const c = counties.find(x => x.county === d.properties.name);
        if (!c) return '#e2dfd6';
        const v = valueOf(c, state.metric);
        return getColor(v, state.metric);
      });

    document.getElementById('map-title').textContent =
      `County ${metricLabels[state.metric]} — ${raceLabel()}`;

    renderLegend();
  }

  function renderLegend() {
    const cfg = colorScales[state.metric];
    if (!cfg) return;
    const el = document.getElementById('legend');
    const [a, b] = cfg.range;
    const grad = `linear-gradient(to right, ${cfg.colors.join(',')})`;
    let lblA = a, lblB = b;
    if (cfg.type === 'sequential-log') { lblA = fmtCompact(a); lblB = fmtCompact(b); }
    else if (state.metric === 'margin') { lblA = `R+${Math.abs(a)}`; lblB = `D+${b}`; }
    else if (state.metric === 'total_ballots') { lblA = fmtCompact(a); lblB = fmtCompact(b); }
    else { lblA = a + '%'; lblB = b + '%'; }
    el.innerHTML = `
      <span class="legend-tick">${lblA}</span>
      <div class="legend-gradient" style="background:${grad}"></div>
      <span class="legend-tick">${lblB}</span>
    `;
  }

  function showTooltip(e, c) {
    tooltip.innerHTML = `
      <div class="tt-title">${c.county} County</div>
      <div class="tt-row"><span class="tt-label">Ballots</span><span class="tt-val">${fmtInt(c.total_ballots)}</span></div>
      <div class="tt-row"><span class="tt-label">Turnout (VAP)</span><span class="tt-val">${fmtPct(c.turnout_pct_vap)}</span></div>
      <div class="tt-row"><span class="tt-label">${raceLabel()} margin</span><span class="tt-val">${fmtPP(valueOf(c,'margin'))}</span></div>
      <div class="tt-row"><span class="tt-label">Dem / Rep</span><span class="tt-val">${fmtPct(valueOf(c,'dem_pct'))} / ${fmtPct(valueOf(c,'rep_pct'))}</span></div>
      <div class="tt-row"><span class="tt-label">% Black pop</span><span class="tt-val">${fmtPct(c.pct_black)}</span></div>
      <div class="tt-row"><span class="tt-label">Median income</span><span class="tt-val">${fmtMoney(c.median_income)}</span></div>
      <div class="tt-row"><span class="tt-label">vs 2024 general</span><span class="tt-val">${fmtPct(c.mobilization_2024)}</span></div>
      <div class="tt-row"><span class="tt-label">vs 2022 midterm</span><span class="tt-val">${fmtPct(c.mobilization_2022)}</span></div>
    `;
    moveTooltip(e);
    tooltip.classList.add('show');
  }
  function moveTooltip(e) {
    const pad = 16;
    const tw = tooltip.offsetWidth, th = tooltip.offsetHeight;
    let x = e.pageX + pad, y = e.pageY + pad;
    if (x + tw > window.innerWidth - 8) x = e.pageX - tw - pad;
    if (y + th > window.scrollY + window.innerHeight - 8) y = e.pageY - th - pad;
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
  }

  function raceLabel() {
    return state.race === 'd2' ? 'PSC D2' : state.race === 'd3' ? 'PSC D3' : 'Combined';
  }

  // =================================================================
  // Vote Method Chart (Plotly)
  // =================================================================
  function renderMethodChart() {
    const subset = state.selectedCounty ? [state.selectedCounty] : counties;
    const ed = subset.reduce((s, c) => s + c.method_election_day, 0);
    const av = subset.reduce((s, c) => s + c.method_advance_in_person, 0);
    const ab = subset.reduce((s, c) => s + c.method_absentee_mail, 0);
    const total = ed + av + ab;

    document.getElementById('method-context').textContent =
      state.selectedCounty ? state.selectedCounty.county + ' County' : 'Statewide';

    // Group by race winner, by method
    let demEd, demAv, demAb, repEd, repAv, repAb;
    if (state.race === 'd2') {
      demEd = subset.reduce((s,c)=>s + (c.method_election_day - (c.method_election_day - 0)) , 0); // placeholder
      // Actually we need per-candidate method splits
    }
    // Use stacked bar: for each method, show D vs R split (using D2 unless overridden)
    function methodSplit(methodKey, cand) {
      // cand: 'echols','johnson','fitz_johnson','hubbard'
      const fields = {
        election_day: cand + '_election_day',
        advance: cand + '_advanced_voting',
        absentee: cand + '_absentee_mail'
      };
      // We don't have per-candidate per-method in master JSON... so reload from CSV via ratios
      return null;
    }

    // Build chart data: simple breakdown by method showing D and R candidate totals
    // We'll use the approximate split from state-level ratios where county-detail is missing
    // From source: D2 statewide method splits - compute proportionally
    // Actually the master JSON only has combined method totals per county. Use those + race percentage to estimate.
    const racePct = state.race === 'd3' ? 'd3' : 'd2';
    const demPctCounty = subset.reduce((s,c)=>s + (c[racePct + '_dem_pct'] || 0) * c.method_total, 0)
                       / Math.max(1, subset.reduce((s,c)=>s + c.method_total, 0));
    const demFrac = demPctCounty / 100;
    const repFrac = 1 - demFrac;

    const data = [
      {
        x: ['Early In-Person','Election Day','Absentee Mail'],
        y: [Math.round(av * demFrac), Math.round(ed * demFrac), Math.round(ab * demFrac)],
        name: 'Democratic',
        type: 'bar',
        marker: { color: '#2c5e7a' },
        hovertemplate: '<b>Democratic</b><br>%{x}: %{y:,.0f}<extra></extra>'
      },
      {
        x: ['Early In-Person','Election Day','Absentee Mail'],
        y: [Math.round(av * repFrac), Math.round(ed * repFrac), Math.round(ab * repFrac)],
        name: 'Republican',
        type: 'bar',
        marker: { color: '#b8453d' },
        hovertemplate: '<b>Republican</b><br>%{x}: %{y:,.0f}<extra></extra>'
      }
    ];

    const layout = {
      barmode: 'stack',
      margin: { t: 8, l: 60, r: 8, b: 36 },
      xaxis: { tickfont: { size: 11, color: '#4a4d5c', family: 'Inter' } },
      yaxis: { tickfont: { size: 10, color: '#6c6f7d' }, gridcolor: '#e2dfd6', tickformat: ',.0s' },
      legend: { orientation: 'h', y: 1.12, x: 0, font: { size: 11 } },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      font: { family: 'Inter, sans-serif' },
      hoverlabel: { bgcolor: '#1a1d2e', font: { color: 'white', family: 'Inter' } }
    };
    Plotly.react('method-chart', data, layout, { displayModeBar: false, responsive: true });

    // Method stats below
    const ms = document.getElementById('method-stats');
    ms.innerHTML = `
      <div class="method-stat">
        <div class="method-stat-label">Early In-Person</div>
        <div class="method-stat-value">${(av/total*100).toFixed(1)}%</div>
        <div class="muted">${fmtCompact(av)}</div>
      </div>
      <div class="method-stat">
        <div class="method-stat-label">Election Day</div>
        <div class="method-stat-value">${(ed/total*100).toFixed(1)}%</div>
        <div class="muted">${fmtCompact(ed)}</div>
      </div>
      <div class="method-stat">
        <div class="method-stat-label">Absentee Mail</div>
        <div class="method-stat-value">${(ab/total*100).toFixed(1)}%</div>
        <div class="muted">${fmtCompact(ab)}</div>
      </div>
    `;
  }

  // =================================================================
  // Congressional District Chart
  // =================================================================
  function renderCDChart() {
    const cdAgg = {};
    counties.forEach(c => {
      const cd = cdMap[c.county];
      if (!cd) return;
      if (!cdAgg[cd]) cdAgg[cd] = { d2_dem: 0, d2_rep: 0, d3_dem: 0, d3_rep: 0, total_ballots: 0 };
      cdAgg[cd].d2_dem += c.d2_johnson;
      cdAgg[cd].d2_rep += c.d2_echols;
      cdAgg[cd].d3_dem += c.d3_hubbard;
      cdAgg[cd].d3_rep += c.d3_fitz;
      cdAgg[cd].total_ballots += c.total_ballots;
    });

    const cds = Object.keys(cdAgg).map(Number).sort((a,b)=>a-b);
    const dem = [], rep = [], labels = [], totals = [];
    cds.forEach(cd => {
      const a = cdAgg[cd];
      let dV, rV;
      if (state.race === 'd2') { dV = a.d2_dem; rV = a.d2_rep; }
      else if (state.race === 'd3') { dV = a.d3_dem; rV = a.d3_rep; }
      else { dV = a.d2_dem + a.d3_dem; rV = a.d2_rep + a.d3_rep; }
      const t = dV + rV;
      dem.push((dV/t*100));
      rep.push((rV/t*100));
      labels.push('CD ' + cd);
      totals.push(a.total_ballots);
    });

    const data = [
      {
        x: dem, y: labels, type: 'bar', orientation: 'h', name: 'Dem',
        marker: { color: '#2c5e7a' },
        text: dem.map(v => v.toFixed(0) + '%'),
        textposition: 'inside',
        insidetextfont: { color: 'white', size: 11 },
        textangle: 0,
        hovertemplate: cds.map((cd,i) => `<b>CD ${cd}</b> &middot; ${cdReps[cd]}<br>Dem: ${dem[i].toFixed(1)}%<br>Ballots: ${fmtInt(totals[i])}<extra></extra>`),
      },
      {
        x: rep, y: labels, type: 'bar', orientation: 'h', name: 'Rep',
        marker: { color: '#b8453d' },
        text: rep.map(v => v.toFixed(0) + '%'),
        textposition: 'inside',
        insidetextfont: { color: 'white', size: 11 },
        hovertemplate: cds.map((cd,i) => `<b>CD ${cd}</b> &middot; ${cdReps[cd]}<br>Rep: ${rep[i].toFixed(1)}%<br>Ballots: ${fmtInt(totals[i])}<extra></extra>`),
      }
    ];
    const layout = {
      barmode: 'stack',
      margin: { t: 8, l: 56, r: 8, b: 28 },
      xaxis: { range: [0, 100], showticklabels: false, fixedrange: true },
      yaxis: { tickfont: { size: 10, color: '#4a4d5c' }, autorange: 'reversed', fixedrange: true },
      showlegend: false,
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      font: { family: 'Inter, sans-serif' },
    };
    Plotly.react('cd-chart', data, layout, { displayModeBar: false, responsive: true });
  }

  // =================================================================
  // Demographics scatter
  // =================================================================
  function renderScatter() {
    const xKey = document.getElementById('demo-x').value;
    const yKey = document.getElementById('demo-y').value;
    const pts = counties.filter(c => c[xKey] != null && (c[yKey] != null || valueOf(c,yKey) != null));

    // Use race-aware accessor for political metrics
    function gety(c) {
      if (yKey === 'd2_dem_pct' || yKey === 'd2_margin') {
        return valueOf(c, yKey === 'd2_dem_pct' ? 'dem_pct' : 'margin');
      }
      return c[yKey];
    }

    const x = pts.map(c => c[xKey]);
    const y = pts.map(c => gety(c));
    const sizes = pts.map(c => Math.max(4, Math.sqrt(c.total_ballots / 80)));
    const colors = pts.map(c => {
      const m = valueOf(c,'margin');
      if (m == null) return '#9a9da8';
      if (m > 10) return '#1d6fb8';
      if (m < -10) return '#e63946';
      return '#f5a623';
    });
    const text = pts.map(c => c.county);

    // Calculate Pearson correlation
    function pearson(a, b) {
      const n = a.length;
      const ma = a.reduce((s,v)=>s+v,0)/n;
      const mb = b.reduce((s,v)=>s+v,0)/n;
      let num=0, da=0, db=0;
      for (let i=0;i<n;i++){
        num += (a[i]-ma)*(b[i]-mb);
        da += (a[i]-ma)**2;
        db += (b[i]-mb)**2;
      }
      return num / Math.sqrt(da*db);
    }
    const r = pearson(x, y);

    const data = [{
      x, y, mode: 'markers', type: 'scatter', text,
      marker: { color: colors, size: sizes, line: { color: 'white', width: 0.5 }, opacity: 0.78 },
      hovertemplate: '<b>%{text}</b><br>' +
        document.querySelector('#demo-x option:checked').textContent + ': %{x}<br>' +
        document.querySelector('#demo-y option:checked').textContent + ': %{y:.1f}<extra></extra>'
    }];

    // Add trend line
    const xMin = Math.min(...x), xMax = Math.max(...x);
    const slope = pearson(x, y) * (Math.sqrt(y.reduce((s,v,i)=>s+(v-y.reduce((a,b)=>a+b,0)/y.length)**2,0))) / (Math.sqrt(x.reduce((s,v,i)=>s+(v-x.reduce((a,b)=>a+b,0)/x.length)**2,0)));
    const xMean = x.reduce((a,b)=>a+b,0)/x.length;
    const yMean = y.reduce((a,b)=>a+b,0)/y.length;
    const intercept = yMean - slope * xMean;
    data.push({
      x: [xMin, xMax], y: [xMin*slope+intercept, xMax*slope+intercept],
      type: 'scatter', mode: 'lines', name: 'trend',
      line: { color: '#1a1d2e', width: 1.5, dash: 'dash' },
      hoverinfo: 'skip', showlegend: false
    });

    const layout = {
      margin: { t: 8, l: 50, r: 8, b: 38 },
      xaxis: { title: { text: document.querySelector('#demo-x option:checked').textContent, font: { size: 11 } }, gridcolor: '#e2dfd6', tickfont: { size: 10 } },
      yaxis: { title: { text: document.querySelector('#demo-y option:checked').textContent, font: { size: 11 } }, gridcolor: '#e2dfd6', tickfont: { size: 10 } },
      showlegend: false,
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      font: { family: 'Inter, sans-serif' },
      hoverlabel: { bgcolor: '#1a1d2e', font: { color: 'white' } },
    };
    Plotly.react('scatter-chart', data, layout, { displayModeBar: false, responsive: true });

    // Stats line
    const stats = document.getElementById('demo-stats');
    const interp = Math.abs(r) > 0.7 ? 'strong' : Math.abs(r) > 0.4 ? 'moderate' : Math.abs(r) > 0.2 ? 'weak' : 'negligible';
    const dir = r > 0 ? 'positive' : 'negative';
    stats.innerHTML = `
      Correlation (Pearson r): <strong>${r.toFixed(3)}</strong> &middot; <strong>${interp} ${dir}</strong> relationship across ${pts.length} counties.
      Bubble size = ballots cast. Color = race margin (blue = Dem, red = Rep, gold = competitive).
    `;
  }

  // =================================================================
  // County Leaderboard Table
  // =================================================================
  function renderTable() {
    const tbody = document.getElementById('county-tbody');
    const search = state.search.toLowerCase().trim();
    let rows = counties.slice();
    if (search) rows = rows.filter(c => c.county.toLowerCase().includes(search));

    if (state.sort === 'total_ballots') rows.sort((a,b) => b.total_ballots - a.total_ballots);
    else if (state.sort === 'turnout_pct_vap') rows.sort((a,b) => (b.turnout_pct_vap||0) - (a.turnout_pct_vap||0));
    else if (state.sort === 'd2_margin') rows.sort((a,b) => (valueOf(b,'margin')||0) - (valueOf(a,'margin')||0));
    else if (state.sort === 'd2_margin_rev') rows.sort((a,b) => (valueOf(a,'margin')||-100) - (valueOf(b,'margin')||-100));

    tbody.innerHTML = rows.slice(0, 60).map(c => {
      const dem = valueOf(c,'dem_pct'), rep = valueOf(c,'rep_pct'), m = valueOf(c,'margin');
      const marginCls = m > 0 ? 'margin-pos' : 'margin-neg';
      return `
        <tr data-county="${c.county}">
          <td class="county-name">${c.county}</td>
          <td class="num">${fmtInt(c.total_ballots)}</td>
          <td class="num">${fmtPct(c.turnout_pct_vap)}</td>
          <td class="num dem-cell">${fmtPct(dem)}</td>
          <td class="num rep-cell">${fmtPct(rep)}</td>
          <td class="num ${marginCls}">${fmtPP(m)}</td>
          <td class="num">${fmtPct(c.pct_advance_in_person)}</td>
          <td class="num">${fmtPct(c.pct_election_day)}</td>
          <td class="num">${fmtPct(c.pct_absentee_mail)}</td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('tr').forEach(tr => {
      tr.addEventListener('click', () => {
        const c = counties.find(x => x.county === tr.dataset.county);
        if (c) openDrill(c);
      });
    });
  }

  // =================================================================
  // Drill-down modal
  // =================================================================
  function openDrill(c) {
    state.selectedCounty = c;
    const el = document.getElementById('drill-content');
    const cd = cdMap[c.county];
    const region = regionMap[c.county] || '—';

    el.innerHTML = `
      <h2 class="drill-title">${c.county} County</h2>
      <p class="drill-sub">CD ${cd ? cd : '—'} ${cd ? '· ' + cdReps[cd] : ''} · ${region} · Pop. ${fmtInt(c.pop)}</p>

      <div class="drill-grid">
        <div class="drill-stat"><div class="l">Ballots</div><div class="v">${fmtInt(c.total_ballots)}</div></div>
        <div class="drill-stat"><div class="l">Turnout (VAP)</div><div class="v">${fmtPct(c.turnout_pct_vap)}</div></div>
        <div class="drill-stat"><div class="l">PSC D2 — Johnson (D)</div><div class="v" style="color:#2c5e7a">${fmtPct(c.d2_dem_pct)}</div></div>
        <div class="drill-stat"><div class="l">PSC D2 — Echols (R)</div><div class="v" style="color:#b8453d">${fmtPct(c.d2_rep_pct)}</div></div>
        <div class="drill-stat"><div class="l">PSC D3 — Hubbard (D)</div><div class="v" style="color:#2c5e7a">${fmtPct(c.d3_dem_pct)}</div></div>
        <div class="drill-stat"><div class="l">PSC D3 — Johnson (R)</div><div class="v" style="color:#b8453d">${fmtPct(c.d3_rep_pct)}</div></div>
        <div class="drill-stat"><div class="l">% Black pop</div><div class="v">${fmtPct(c.pct_black)}</div></div>
        <div class="drill-stat"><div class="l">% White pop</div><div class="v">${fmtPct(c.pct_white)}</div></div>
        <div class="drill-stat"><div class="l">% Hispanic pop</div><div class="v">${fmtPct(c.pct_hispanic)}</div></div>
        <div class="drill-stat"><div class="l">Median income</div><div class="v">${fmtMoney(c.median_income)}</div></div>
        <div class="drill-stat"><div class="l">% Bachelor's+ (25+)</div><div class="v">${fmtPct(c.pct_bachelors_plus_25)}</div></div>
        <div class="drill-stat"><div class="l">Median age</div><div class="v">${c.median_age != null ? c.median_age : '—'}</div></div>
      </div>

      <h4 style="margin:0 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#6c6f7d">Vote method</h4>
      <div class="drill-grid">
        <div class="drill-stat"><div class="l">Early in-person</div><div class="v">${fmtPct(c.pct_advance_in_person)} <span style="font-size:11px;font-weight:400;color:#6c6f7d">(${fmtCompact(c.method_advance_in_person)})</span></div></div>
        <div class="drill-stat"><div class="l">Election Day</div><div class="v">${fmtPct(c.pct_election_day)} <span style="font-size:11px;font-weight:400;color:#6c6f7d">(${fmtCompact(c.method_election_day)})</span></div></div>
        <div class="drill-stat"><div class="l">Absentee mail</div><div class="v">${fmtPct(c.pct_absentee_mail)} <span style="font-size:11px;font-weight:400;color:#6c6f7d">(${fmtCompact(c.method_absentee_mail)})</span></div></div>
        <div class="drill-stat"><div class="l">Provisional</div><div class="v">${fmtCompact(c.method_provisional)}</div></div>
      </div>
    `;

    document.getElementById('drill-modal').hidden = false;
    renderMethodChart();
  }
  function closeDrill() {
    state.selectedCounty = null;
    document.getElementById('drill-modal').hidden = true;
    renderMethodChart();
  }

  // =================================================================
  // Wire up controls
  // =================================================================
  function wireControls() {
    document.querySelectorAll('#race-toggle .seg').forEach(b => {
      b.addEventListener('click', () => {
        document.querySelectorAll('#race-toggle .seg').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        state.race = b.dataset.race;
        renderAll();
      });
    });
    document.getElementById('metric-select').addEventListener('change', e => {
      state.metric = e.target.value; renderMap();
    });
    document.querySelectorAll('#agg-toggle .seg').forEach(b => {
      b.addEventListener('click', () => {
        document.querySelectorAll('#agg-toggle .seg').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        state.agg = b.dataset.agg;
        // Future: aggregation could shift map shading; for now we leave county-level
      });
    });
    document.getElementById('county-search').addEventListener('input', e => {
      state.search = e.target.value;
      renderTable();
    });
    document.querySelectorAll('.seg-mini').forEach(b => {
      b.addEventListener('click', () => {
        document.querySelectorAll('.seg-mini').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        state.sort = b.dataset.sort;
        renderTable();
      });
    });
    document.getElementById('demo-x').addEventListener('change', renderScatter);
    document.getElementById('demo-y').addEventListener('change', renderScatter);
    document.querySelectorAll('#mobil-toggle .seg-btn').forEach(b => {
      b.addEventListener('click', () => {
        document.querySelectorAll('#mobil-toggle .seg-btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        state.mobilMetric = b.dataset.mobil;
        renderMobilization();
      });
    });
    document.querySelectorAll('#demoq-toggle .seg-btn').forEach(b => {
      b.addEventListener('click', () => {
        document.querySelectorAll('#demoq-toggle .seg-btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        state.demoqMetric = b.dataset.demoq;
        renderDemoq();
      });
    });
    document.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeDrill));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrill(); });

    window.addEventListener('resize', () => {
      // Recompute map projection
      if (mapInited) {
        const container = document.getElementById('map');
        const w = container.clientWidth;
        const h = container.clientHeight;
        svgMap.attr('viewBox', `0 0 ${w} ${h}`);
        projection.fitSize([w, h], geo);
        svgMap.selectAll('path.county-path').attr('d', pathGen);
      }
      Plotly.Plots.resize('method-chart');
      Plotly.Plots.resize('cd-chart');
      Plotly.Plots.resize('scatter-chart');
    });
  }

  // =================================================================
  // Mobilization vs prior cycles
  // =================================================================
  state.mobilMetric = 'mobilization_2024';

  function renderMobilization() {
    const key = state.mobilMetric;
    const yearLabel = key === 'mobilization_2024' ? '2024 general' : '2022 midterm';
    const sorted = counties.filter(c => c[key] != null).sort((a,b) => b[key] - a[key]);
    const top = sorted.slice(0, 10);
    const bot = sorted.slice(-10).reverse();

    // Statewide retention
    const hist = window.GA_HISTORICAL || {};
    const histKey = key === 'mobilization_2024' ? 'ballots_2024' : 'ballots_2022';
    const pscTotal = counties.reduce((s,c) => s + (c.d2_total||0), 0);
    const histTotal = hist[histKey] || 1;
    const stateRatio = (pscTotal / histTotal * 100).toFixed(1);
    document.getElementById('mobil-state').textContent = stateRatio + '% of ' + yearLabel + ' turnout';

    // Summary line
    const median = sorted[Math.floor(sorted.length/2)][key];
    document.getElementById('mobil-summary').innerHTML =
      `<span class="mobil-stat"><span class="l">Statewide</span><span class="v">${stateRatio}%</span></span>` +
      `<span class="mobil-stat"><span class="l">County median</span><span class="v">${median.toFixed(1)}%</span></span>` +
      `<span class="mobil-stat"><span class="l">Best county</span><span class="v">${top[0].county} · ${top[0][key].toFixed(1)}%</span></span>` +
      `<span class="mobil-stat"><span class="l">Weakest county</span><span class="v">${bot[0].county} · ${bot[0][key].toFixed(1)}%</span></span>`;

    // Render two lists as horizontal bars
    const max = top[0][key];
    function rowHtml(c, isTop) {
      const w = (c[key] / max * 100).toFixed(1);
      const cls = isTop ? 'mobil-bar-top' : 'mobil-bar-bot';
      return `<div class="mobil-row" data-county="${c.county}">
        <div class="mobil-name">${c.county}</div>
        <div class="mobil-bar-wrap"><div class="mobil-bar ${cls}" style="width:${w}%"></div></div>
        <div class="mobil-val">${c[key].toFixed(1)}%</div>
      </div>`;
    }
    document.getElementById('mobil-top').innerHTML = top.map(c => rowHtml(c, true)).join('');
    document.getElementById('mobil-bot').innerHTML = bot.map(c => rowHtml(c, false)).join('');

    // Click row -> drill
    document.querySelectorAll('#mobil-top .mobil-row, #mobil-bot .mobil-row').forEach(el => {
      el.addEventListener('click', () => {
        const c = counties.find(x => x.county === el.dataset.county);
        if (c) openDrill(c);
      });
    });
  }

  // =================================================================
  // Margin shift map (vs 2024 presidential)
  // =================================================================
  function renderShiftMap() {
    const container = document.getElementById('shift-map');
    if (!container) return;
    container.innerHTML = '';
    const w = container.clientWidth || 800;
    const h = 460;
    const svg = d3.select(container).append('svg').attr('viewBox', `0 0 ${w} ${h}`);
    const projection = d3.geoAlbers().rotate([83.5, 0]).center([0, 32.65]).parallels([30, 35]).scale(w * 7).translate([w/2, h/2]);
    const path = d3.geoPath().projection(projection);

    // Diverging scale: 0 to +60pp shift (all shifted Dem). Use cyan/teal sequential since direction is uniform.
    const valid = counties.filter(c => c.margin_shift != null && !c.data_anomaly);
    const maxShift = d3.max(valid, c => c.margin_shift);
    const minShift = d3.min(valid, c => c.margin_shift);
    const scale = d3.scaleLinear().domain([Math.max(5, minShift), 25, maxShift]).range(['#fef3c7', '#06b6d4', '#0e7490']).clamp(true);

    svg.append('g').selectAll('path').data(geo.features).enter().append('path')
      .attr('d', path)
      .attr('fill', f => {
        const c = counties.find(x => x.fips === f.id);
        if (!c || c.margin_shift == null || c.data_anomaly) return '#e5e7eb';
        return scale(c.margin_shift);
      })
      .attr('stroke', 'rgba(0,0,0,0.15)')
      .attr('stroke-width', 0.4)
      .style('cursor', 'pointer')
      .on('mouseenter', function(e, f) {
        const c = counties.find(x => x.fips === f.id);
        if (c) {
          const s = c.margin_shift != null ? `${c.margin_shift >= 0 ? '+' : ''}${c.margin_shift.toFixed(1)}pp` : '—';
          tooltip.innerHTML = `<div class="tt-name">${c.county} County</div>
            <div class="tt-row"><span class="tt-label">2024 margin</span><span class="tt-val">${c.margin_2024 >= 0 ? '+' : ''}${(c.margin_2024||0).toFixed(1)}pp</span></div>
            <div class="tt-row"><span class="tt-label">PSC margin</span><span class="tt-val">${c.d2_margin >= 0 ? '+' : ''}${(c.d2_margin||0).toFixed(1)}pp</span></div>
            <div class="tt-row"><span class="tt-label">Shift</span><span class="tt-val" style="color:#0e7490;font-weight:700">${s}</span></div>`;
          tooltip.classList.add('show');
        }
        d3.select(this).attr('stroke-width', 1.5).attr('stroke', '#0e7490');
      })
      .on('mousemove', e => moveTooltip(e))
      .on('mouseleave', function() { tooltip.classList.remove('show'); d3.select(this).attr('stroke-width', 0.4).attr('stroke', 'rgba(0,0,0,0.15)'); })
      .on('click', (e, f) => { const c = counties.find(x => x.fips === f.id); if (c) openDrill(c); });

    // Summary stats above
    const ballotWeighted = valid.reduce((s,c) => s + c.margin_shift * c.total_ballots, 0) / valid.reduce((s,c) => s+c.total_ballots, 0);
    const median = valid.map(c=>c.margin_shift).sort((a,b)=>a-b)[Math.floor(valid.length/2)];
    const max = valid.reduce((a,b) => a.margin_shift > b.margin_shift ? a : b);
    document.getElementById('shift-summary').innerHTML =
      `<span class="mobil-stat"><span class="l">Statewide avg shift</span><span class="v">+${ballotWeighted.toFixed(1)}pp toward Dems</span></span>` +
      `<span class="mobil-stat"><span class="l">County median</span><span class="v">+${median.toFixed(1)}pp</span></span>` +
      `<span class="mobil-stat"><span class="l">Largest shift</span><span class="v">${max.county} · +${max.margin_shift.toFixed(1)}pp</span></span>` +
      `<span class="mobil-stat"><span class="l">Counties shifted Dem</span><span class="v">${valid.filter(c => c.margin_shift > 0).length} of ${valid.length}</span></span>`;

    // Legend
    const lg = document.getElementById('shift-legend');
    lg.innerHTML = `<span class="legend-min">+${Math.max(5,minShift).toFixed(0)}pp</span><span class="legend-grad" style="background:linear-gradient(90deg,#fef3c7,#06b6d4,#0e7490)"></span><span class="legend-max">+${maxShift.toFixed(0)}pp</span>`;
  }

  // =================================================================
  // Swing decomposition (D vs R retention in flipped counties)
  // =================================================================
  function renderSwingChart() {
    const flipped = (window.GA_FLIPPED || []).slice().sort((a,b) => b.shift - a.shift);
    const stateRet = window.GA_STATE_RETENTION || {d:0, r:0};
    document.getElementById('swing-state-d').textContent = stateRet.d + '%';
    document.getElementById('swing-state-r').textContent = stateRet.r + '%';

    const counties_y = flipped.map(f => f.county);
    // Diff bars: D-retention positive (right), R-retention as negative (left) for visual separation
    const traceD = {
      x: flipped.map(f => f.d_retention || 0),
      y: counties_y,
      type: 'bar', orientation: 'h', name: 'Dem retention',
      marker: { color: '#1d6fb8' },
      hovertemplate: '%{y}: <b>%{x:.1f}%</b> of Harris voters returned<extra></extra>',
      text: flipped.map(f => f.d_retention != null ? f.d_retention.toFixed(0) + '%' : ''),
      textposition: 'outside', textfont: { size: 10, color: '#1d6fb8' },
    };
    const traceR = {
      x: flipped.map(f => -(f.r_retention || 0)),
      y: counties_y,
      type: 'bar', orientation: 'h', name: 'Rep retention',
      marker: { color: '#e63946' },
      hovertemplate: '%{y}: <b>%{customdata:.1f}%</b> of Trump voters returned<extra></extra>',
      customdata: flipped.map(f => f.r_retention || 0),
      text: flipped.map(f => f.r_retention != null ? f.r_retention.toFixed(0) + '%' : ''),
      textposition: 'outside', textfont: { size: 10, color: '#e63946' },
    };
    const layout = {
      barmode: 'overlay',
      margin: { l: 90, r: 50, t: 8, b: 36 },
      height: Math.max(360, flipped.length * 22 + 60),
      showlegend: true,
      legend: { orientation: 'h', y: 1.08, x: 0.5, xanchor: 'center', font: { size: 11 } },
      xaxis: { title: { text: 'Voter retention vs 2024 (%)', font: { size: 11 } }, range: [-50, 60], tickvals: [-40,-20,0,20,40], ticktext: ['40%','20%','0','20%','40%'], gridcolor: 'rgba(0,0,0,0.05)', zerolinecolor: 'rgba(0,0,0,0.3)', zerolinewidth: 1.5 },
      yaxis: { automargin: true, tickfont: { size: 11 } },
      paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
      font: { family: 'Inter, system-ui, sans-serif', size: 11 },
      annotations: [
        { x: -25, y: 1.12, xref: 'x', yref: 'paper', text: '← Republican retention', showarrow: false, font: { size: 11, color: '#e63946' } },
        { x: 25, y: 1.12, xref: 'x', yref: 'paper', text: 'Democratic retention →', showarrow: false, font: { size: 11, color: '#1d6fb8' } },
      ],
    };
    Plotly.newPlot('swing-chart', [traceR, traceD], layout, { responsive: true, displayModeBar: false });

    // Summary stat
    const flipped_d_avg = flipped.reduce((s,f) => s + (f.d_retention||0), 0) / flipped.length;
    const flipped_r_avg = flipped.reduce((s,f) => s + (f.r_retention||0), 0) / flipped.length;
    document.getElementById('swing-summary').innerHTML =
      `<span class="mobil-stat"><span class="l">Counties flipped</span><span class="v">${flipped.length}</span></span>` +
      `<span class="mobil-stat"><span class="l">Avg D-retention (flipped)</span><span class="v" style="color:#1d6fb8">${flipped_d_avg.toFixed(1)}%</span></span>` +
      `<span class="mobil-stat"><span class="l">Avg R-retention (flipped)</span><span class="v" style="color:#e63946">${flipped_r_avg.toFixed(1)}%</span></span>` +
      `<span class="mobil-stat"><span class="l">D-vs-R retention gap</span><span class="v">${(flipped_d_avg - flipped_r_avg).toFixed(1)}pp</span></span>`;
  }

  // =================================================================
  // Demographic quartile chart
  // =================================================================
  state.demoqMetric = 'pct_black';
  function renderDemoq() {
    const key = state.demoqMetric;
    const qdata = (window.GA_QUARTILES || {})[key] || [];
    const labelMap = { pct_black: '% Black population', median_income: 'Median household income', pct_bachelors_plus_25: "% w/ Bachelor's+" };
    const fmt = key === 'median_income' ? v => '$' + (v/1000).toFixed(0) + 'k' : v => v.toFixed(0) + '%';
    const xLabels = qdata.map(q => `Q${q.q}\n(${fmt(q.demo_lo)}–${fmt(q.demo_hi)})`);

    // Two side-by-side subplots so bars don't fight on dual y-axes
    const traceMob = {
      x: xLabels, y: qdata.map(q => q.mobilization),
      type: 'bar', name: 'Mobilization (PSC ÷ 2024)',
      marker: { color: '#0e7490' },
      text: qdata.map(q => q.mobilization.toFixed(1) + '%'), textposition: 'outside',
      textfont: { size: 11, color: '#0e7490', family: 'Inter, sans-serif' },
      hovertemplate: '%{x}<br><b>%{y:.1f}%</b> mobilization<extra></extra>',
      xaxis: 'x', yaxis: 'y',
    };
    const traceShift = {
      x: xLabels, y: qdata.map(q => q.margin_shift),
      type: 'bar', name: 'Margin shift (pp toward Dems)',
      marker: { color: '#1d6fb8' },
      text: qdata.map(q => '+' + q.margin_shift.toFixed(1) + 'pp'), textposition: 'outside',
      textfont: { size: 11, color: '#1d6fb8', family: 'Inter, sans-serif' },
      hovertemplate: '%{x}<br><b>+%{y:.1f}pp</b> shift<extra></extra>',
      xaxis: 'x2', yaxis: 'y2',
    };
    const layout = {
      grid: { rows: 1, columns: 2, pattern: 'independent', xgap: 0.12 },
      margin: { l: 56, r: 24, t: 32, b: 70 },
      height: 360,
      showlegend: false,
      xaxis: { title: { text: '<b>Mobilization vs 2024</b><br><span style="font-size:10px;color:#666">' + labelMap[key] + ' — quartiles</span>', font: { size: 11 } }, tickfont: { size: 10 } },
      xaxis2: { title: { text: '<b>Margin shift toward Dems</b><br><span style="font-size:10px;color:#666">' + labelMap[key] + ' — quartiles</span>', font: { size: 11 } }, tickfont: { size: 10 } },
      yaxis: { title: { text: 'PSC ballots / 2024 ballots (%)', font: { size: 10, color: '#0e7490' } }, gridcolor: 'rgba(0,0,0,0.05)', range: [0, Math.max(...qdata.map(q=>q.mobilization)) * 1.25] },
      yaxis2: { title: { text: 'pp toward Dems', font: { size: 10, color: '#1d6fb8' } }, gridcolor: 'rgba(0,0,0,0.05)', range: [0, Math.max(...qdata.map(q=>q.margin_shift)) * 1.25] },
      paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
      font: { family: 'Inter, system-ui, sans-serif' },
    };
    Plotly.newPlot('demoq-chart', [traceMob, traceShift], layout, { responsive: true, displayModeBar: false });
  }

  function renderAll() {
    renderKPIs();
    renderMap();
    renderMethodChart();
    renderCDChart();
    renderMobilization();
    renderShiftMap();
    renderSwingChart();
    renderDemoq();
    renderScatter();
    renderTable();
  }

  // -------- Boot --------
  document.addEventListener('DOMContentLoaded', () => {
    wireControls();
    renderAll();
  });

})();

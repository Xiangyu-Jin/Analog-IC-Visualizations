// MOSFET Miller Plateau Interactive Viewer - Application Logic

const PARAMS_CONFIG = [
    { id: 'vbus', label: 'V_{bus} \\text{ / V}', min: 5, max: 40, default: 15, step: 0.1 },
    { id: 'id', label: '\\text{Load current } I_d \\text{ / A}', min: 1, max: 50, default: 17.5, step: 0.1 },
    { id: 'vdrv', label: '\\text{Gate drive } V_{drv} \\text{ / V}', min: 5, max: 20, default: 14.0, step: 0.1 },
    { id: 'rg_on', label: '\\text{Turn-on } R_{g\\_on} \\, / \\, \\Omega', min: 1, max: 100, default: 22.0, step: 0.1 },
    { id: 'rg_off', label: '\\text{Turn-off } R_{g\\_off} \\, / \\, \\Omega', min: 1, max: 100, default: 22.0, step: 0.1 },
    { id: 'vth', label: '\\text{MOSFET } V_{th} \\text{ / V}', min: 1, max: 5, default: 2.5, step: 0.1 },
    { id: 'gm', label: '\\text{Transconductance } g_m \\text{ / S}', min: 0.1, max: 10, default: 3.0, step: 0.1 },
    { id: 'cgs', label: 'C_{gs} \\text{ / nF}', min: 0.1, max: 5, default: 1.7, step: 0.01 },
    { id: 'cgd_eff', label: '\\text{Effective } C_{gd} \\text{ / nF}', min: 0.01, max: 1, default: 0.15, step: 0.01 },
    { id: 'cgd_low', label: '\\text{Low-V}_{ds} \\, C_{gd} \\text{ / nF}', min: 0.01, max: 1.5, default: 0.38, step: 0.01 },
    { id: 'rds_on', label: 'R_{ds(on)} \\text{ / m}\\Omega', min: 1, max: 100, default: 25.0, step: 0.1 },
];

let params = {};
let chartOn = null;
let chartOff = null;

function updateRangeFill(slider) {
    const min = parseFloat(slider.min);
    const max = parseFloat(slider.max);
    const val = parseFloat(slider.value);
    const percentage = ((val - min) / (max - min)) * 100;
    slider.style.background = `linear-gradient(to right, var(--accent) ${percentage}%, #ccc ${percentage}%)`;
}

function initControls() {
    const controlsDiv = document.getElementById('controls');
    PARAMS_CONFIG.forEach(cfg => {
        params[cfg.id] = cfg.default;
        
        const group = document.createElement('div');
        group.className = 'control-group';
        
        const labelDiv = document.createElement('div');
        labelDiv.className = 'control-label';
        const label = document.createElement('span');
        // Render KaTeX for parameter labels
        label.innerHTML = katex.renderToString(cfg.label, {throwOnError: false});
        labelDiv.appendChild(label);
        
        const inputDiv = document.createElement('div');
        inputDiv.className = 'control-input';
        
        const range = document.createElement('input');
        range.type = 'range';
        range.id = `range-${cfg.id}`;
        range.min = cfg.min;
        range.max = cfg.max;
        range.step = cfg.step;
        range.value = cfg.default;
        
        const num = document.createElement('input');
        num.type = 'number';
        num.id = `num-${cfg.id}`;
        num.min = cfg.min;
        num.max = cfg.max;
        num.step = cfg.step;
        num.value = cfg.default;
        
        const syncValues = (val, source) => {
            let v = parseFloat(val);
            if(isNaN(v)) return;
            if(v < cfg.min) v = cfg.min;
            if(v > cfg.max) v = cfg.max;
            range.value = v;
            num.value = v;
            params[cfg.id] = v;
            updateRangeFill(range);
            updateSimulation();
        };

        range.addEventListener('input', (e) => syncValues(e.target.value, 'range'));
        num.addEventListener('change', (e) => syncValues(e.target.value, 'num'));
        
        updateRangeFill(range);
        
        inputDiv.appendChild(range);
        inputDiv.appendChild(num);
        group.appendChild(labelDiv);
        group.appendChild(inputDiv);
        controlsDiv.appendChild(group);
    });
}

function simulateTurnOn(p) {
    const Vplateau = p.vth + p.id / p.gm;
    let data = [];
    if (Vplateau >= p.vdrv) {
        return { data: [], t1:0, t2:0, t3:100, Vplateau, Ig_plateau:0, Qgd:0, t_Miller:0, E:0, error: 'Vplateau >= Vdrv' };
    }
    
    const vds_min = p.id * p.rds_on / 1000;
    const t1 = -p.rg_on * p.cgs * Math.log(1 - Vplateau / p.vdrv);
    const Ig_plateau = (p.vdrv - Vplateau) / p.rg_on;
    const Qgd = p.cgd_eff * Math.max(0, p.vbus - vds_min);
    const t_Miller = Qgd / Ig_plateau;
    const t2 = t1 + t_Miller;
    
    const tau3 = p.rg_on * (p.cgs + p.cgd_low);
    const t3 = t2 + 4 * tau3;
    
    let E = 0;
    const dt = Math.max(0.1, t3 / 600); 
    
    for (let t = 0; t <= t3; t += dt) {
        let vgs, vds, ig, psw;
        if (t < t1) {
            vgs = p.vdrv * (1 - Math.exp(-t / (p.rg_on * p.cgs)));
            vds = p.vbus;
            ig = (p.vdrv - vgs) / p.rg_on;
            let id_t = vgs > p.vth ? Math.min(p.id, p.gm * (vgs - p.vth)) : 0;
            psw = vds * id_t;
        } else if (t < t2) {
            vgs = Vplateau;
            ig = Ig_plateau;
            vds = Math.max(vds_min, p.vbus - (p.vbus - vds_min) * ((t - t1) / t_Miller));
            psw = vds * p.id;
        } else {
            vgs = Vplateau + (p.vdrv - Vplateau) * (1 - Math.exp(-(t - t2) / tau3));
            vds = vds_min;
            ig = (p.vdrv - vgs) / p.rg_on;
            psw = vds * p.id; 
        }
        E += psw * dt * 1e-3; 
        data.push({t, vgs, vds, ig, psw});
    }
    return { data, t1, t2, t3, Vplateau, Ig_plateau, Qgd, t_Miller, E };
}

function simulateTurnOff(p) {
    const Vplateau = p.vth + p.id / p.gm;
    let data = [];
    if (Vplateau >= p.vdrv) {
         return { data: [], t1:0, t2:0, t3:100, Vplateau, Ig_plateau:0, Qgd:0, t_Miller:0, E:0, error: 'Vplateau >= Vdrv' };
    }
    
    const vds_min = p.id * p.rds_on / 1000;
    const tau1 = p.rg_off * (p.cgs + p.cgd_low);
    const t1 = -tau1 * Math.log(Vplateau / p.vdrv);
    
    const Ig_plateau = Vplateau / p.rg_off;
    const Qgd = p.cgd_eff * Math.max(0, p.vbus - vds_min);
    const t_Miller = Qgd / Ig_plateau;
    const t2 = t1 + t_Miller;
    
    const tau3 = p.rg_off * p.cgs;
    const t3 = t2 + 4 * tau3;
    
    let E = 0;
    const dt = Math.max(0.1, t3 / 600);
    
    for (let t = 0; t <= t3; t += dt) {
        let vgs, vds, ig, psw;
        if (t < t1) {
            vgs = p.vdrv * Math.exp(-t / tau1);
            vds = vds_min;
            ig = -vgs / p.rg_off;
            psw = vds * p.id;
        } else if (t < t2) {
            vgs = Vplateau;
            vds = Math.min(p.vbus, vds_min + (p.vbus - vds_min) * ((t - t1) / t_Miller));
            ig = -Ig_plateau;
            psw = vds * p.id;
        } else {
            vgs = Vplateau * Math.exp(-(t - t2) / tau3);
            vds = p.vbus;
            ig = -vgs / p.rg_off;
            let id_t = vgs > p.vth ? Math.min(p.id, p.gm * (vgs - p.vth)) : 0;
            psw = vds * id_t;
        }
        E += psw * dt * 1e-3;
        data.push({t, vgs, vds, ig, psw});
    }
    return { data, t1, t2, t3, Vplateau, Ig_plateau, Qgd, t_Miller, E };
}

// We removed watermark per user request.

function initCharts() {
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: { intersect: false, mode: 'index' },
        layout: {
            padding: { bottom: 0, top: 0 }
        },
        scales: {
            x: {
                type: 'linear',
                title: { display: true, text: 'Time / ns', font: {weight: 'bold'} },
                grid: { color: '#eee' }
            },
            y: {
                title: { display: true, text: 'Voltage / V', font: {weight: 'bold'} },
                grid: { color: '#eee' }
            }
        },
        plugins: {
            legend: {
                position: 'top',
                labels: { usePointStyle: true, boxWidth: 8, font: {size: 11} }
            },
            annotation: { annotations: {} }
        }
    };
    
    const ctxOn = document.getElementById('turnOnChart').getContext('2d');
    chartOn = new Chart(ctxOn, {
        type: 'line',
        data: { datasets: [] },
        options: {
            ...commonOptions
        }
    });
    
    const ctxOff = document.getElementById('turnOffChart').getContext('2d');
    chartOff = new Chart(ctxOff, {
        type: 'line',
        data: { datasets: [] },
        options: {
            ...commonOptions
        }
    });
}

function updateSimulation() {
    const showIg = document.getElementById('show-ig').checked;
    const showPsw = document.getElementById('show-psw').checked;
    
    const resOn = simulateTurnOn(params);
    const resOff = simulateTurnOff(params);
    
    const interp = document.getElementById('interpretation');
    
    if (resOn.error || resOff.error) {
        interp.innerHTML = `<span style="color:red; font-weight:bold;">Error: Vplateau >= Vdrv. Please increase Vdrv or lower Vth / Id.</span>`;
        if (chartOn) chartOn.data.datasets = []; chartOn.update();
        if (chartOff) chartOff.data.datasets = []; chartOff.update();
        return;
    }
    
    updateChart(chartOn, resOn, showIg, showPsw, 'on');
    updateChart(chartOff, resOff, showIg, showPsw, 'off');
    
    const vplat = resOn.Vplateau.toFixed(2);
    const ton = resOn.t_Miller.toFixed(1);
    const toff = resOff.t_Miller.toFixed(1);
    const vth = params.vth.toFixed(2);
    const id = params.id.toFixed(1);
    const gm = params.gm.toFixed(2);
    
    interp.innerHTML = `<strong>Vplateau</strong> ≈ Vth + Id/gm = ${vth} + ${id} / ${gm} = <strong>${vplat} V</strong>.<br><br>
<strong>Turn-on:</strong> gate current charges the gate; during the plateau, most gate current discharges Cgd, so Vgs is nearly constant and Vds falls. t_Miller_on ≈ <strong>${ton} ns</strong>.<br><br>
<strong>Turn-off:</strong> gate current is negative; during the plateau, Cgd is charged while Vds rises. t_Miller_off ≈ <strong>${toff} ns</strong>.<br><br>
<em>If Rg_off is larger than Rg_on, turn-off dv/dt becomes slower.</em>`;
}

function updateChart(chart, res, showIg, showPsw, type) {
    const max_t = res.t3;
    const maxY = Math.ceil(Math.max(params.vbus, params.vdrv) * 1.2);
    
    chart.options.scales.x.max = max_t;
    chart.options.scales.y.max = maxY;
    
    if (type === 'off') {
       chart.options.scales.y.min = showIg ? Math.min(-5, -Math.ceil(res.Ig_plateau*10 * 1.2)) : 0;
    } else {
       chart.options.scales.y.min = 0;
    }

    const dVgs = res.data.map(d => ({x: d.t, y: d.vgs}));
    const dVds = res.data.map(d => ({x: d.t, y: d.vds}));
    const dIg = res.data.map(d => ({x: d.t, y: d.ig * 10})); 
    const dPsw = res.data.map(d => ({x: d.t, y: d.psw / params.id})); 

    const datasets = [
        { label: 'Vgs (V)', data: dVgs, borderColor: '#2196F3', borderWidth: 2.5, pointRadius: 0, tension: 0.1 },
        { label: 'Vds (V)', data: dVds, borderColor: '#F44336', borderWidth: 2.5, pointRadius: 0, tension: 0.1 },
    ];
    if (showIg) {
        datasets.push({ label: 'Ig (x10 A)', data: dIg, borderColor: '#4CAF50', borderWidth: 1.5, borderDash: [2, 2], pointRadius: 0, tension: 0.1 });
    }
    if (showPsw) {
        datasets.push({ label: 'Psw (scaled)', data: dPsw, borderColor: '#9C27B0', borderWidth: 1.5, borderDash: [2, 2], pointRadius: 0, tension: 0.1 });
    }
    
    chart.data.datasets = datasets;
    
    chart.options.plugins.annotation.annotations = {
        box1: {
            type: 'box',
            xMin: res.t1,
            xMax: res.t2,
            backgroundColor: 'rgba(255, 235, 59, 0.25)',
            borderWidth: 0,
            label: {
                display: true,
                content: 'Miller interval',
                color: 'rgba(0,0,0,0.5)',
                font: {size: 11, weight: 'normal'},
                position: 'center'
            }
        },
        line1: {
            type: 'line',
            yMin: res.Vplateau,
            yMax: res.Vplateau,
            borderColor: 'rgba(255, 152, 0, 0.8)',
            borderWidth: 1.5,
            borderDash: [4, 4]
        }
    };
    
    chart.update();

    // KaTeX Overlays
    const titleDiv = document.getElementById(`title-${type}`);
    const statsDiv = document.getElementById(`stats-${type}`);
    const vplatDiv = document.getElementById(`vplat-label-${type}`);

    if (type === 'on') {
        titleDiv.innerHTML = katex.renderToString(`\\text{Turn-On Miller Plateau: } V_{gs} \\text{ stays flat while } V_{ds} \\text{ falls}`, {throwOnError: false});
    } else {
        titleDiv.innerHTML = katex.renderToString(`\\text{Turn-Off Miller Plateau: } V_{gs} \\text{ stays flat while } V_{ds} \\text{ rises}`, {throwOnError: false});
    }

    statsDiv.innerHTML = katex.renderToString(`Q_{gd} \\approx ${res.Qgd.toFixed(1)} \\text{ nC} \\quad \\vert \\quad I_{g\\_plateau} \\approx ${(res.Ig_plateau*1000).toFixed(0)} \\text{ mA} \\quad \\vert \\quad t_{\\text{Miller}} \\approx ${res.t_Miller.toFixed(1)} \\text{ ns} \\quad \\vert \\quad E \\approx ${res.E.toFixed(1)} \\, \\mu\\text{J}`, {throwOnError: false});

    vplatDiv.innerHTML = katex.renderToString(`V_{\\text{plateau}} = ${res.Vplateau.toFixed(2)} \\text{ V}`, {throwOnError: false});
    
    // Position vplatDiv dynamically
    if (chart.chartArea) {
        const topOffset = chart.canvas.offsetTop;
        const leftOffset = chart.canvas.offsetLeft;
        vplatDiv.style.top = `${topOffset + chart.scales.y.getPixelForValue(res.Vplateau)}px`;
        vplatDiv.style.left = `${leftOffset + chart.chartArea.right}px`;
    }
}

document.getElementById('show-ig').addEventListener('change', updateSimulation);
document.getElementById('show-psw').addEventListener('change', updateSimulation);

document.getElementById('btn-reset').addEventListener('click', () => {
    PARAMS_CONFIG.forEach(cfg => {
        params[cfg.id] = cfg.default;
        const range = document.getElementById(`range-${cfg.id}`);
        const num = document.getElementById(`num-${cfg.id}`);
        if(range) { range.value = cfg.default; updateRangeFill(range); }
        if(num) num.value = cfg.default;
    });
    updateSimulation();
});

document.getElementById('btn-export').addEventListener('click', () => {
    const resOn = simulateTurnOn(params);
    const resOff = simulateTurnOff(params);
    if (resOn.error) {
        alert("Cannot export: " + resOn.error);
        return;
    }
    let csv = "Time_on(ns),Vgs_on(V),Vds_on(V),Ig_on(A),Psw_on(W),Time_off(ns),Vgs_off(V),Vds_off(V),Ig_off(A),Psw_off(W)\n";
    const maxLen = Math.max(resOn.data.length, resOff.data.length);
    for (let i = 0; i < maxLen; i++) {
        const dOn = resOn.data[i] || {t:'', vgs:'', vds:'', ig:'', psw:''};
        const dOff = resOff.data[i] || {t:'', vgs:'', vds:'', ig:'', psw:''};
        csv += `${dOn.t},${dOn.vgs},${dOn.vds},${dOn.ig},${dOn.psw},${dOff.t},${dOff.vgs},${dOff.vds},${dOff.ig},${dOff.psw}\n`;
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mosfet_miller_plateau.csv';
    a.click();
    URL.revokeObjectURL(url);
});

window.onload = () => {
    initControls();
    initCharts();
    updateSimulation();
};

const initialData = {
    A1: [26.90, 27.26, 27.13, 27.33, 26.34, 27.31, 27.25, 26.31, 27.24, 27.45],
    B1: [27.04, 27.12, 27.09, 27.17, 27.20, 27.18, 26.40, 27.23, 27.33, 27.44],
    C1: [27.06, 27.02, 27.06, 27.13, 27.21, 27.43, 27.22, 27.28, 27.25, 26.48],
    A2: [27.11, 27.24, 27.15, 27.15, 27.21, 27.16, 27.34, 27.22, 26.56, 27.24],
    B2: [27.05, 27.08, 27.16, 27.30, 27.10, 27.16, 27.03, 26.12, 27.31, 27.23],
    C2: [27.09, 27.27, 27.06, 27.14, 27.18, 27.19, 27.34, 27.34, 27.35, 27.43],
    Spares: [27.41, 26.94, 27.30, 27.61, 25.45]
};

let currentData = {};
let selectedInput = null;

function addLog(message) {
    const logEl = document.getElementById('action-log');
    if (logEl.innerText === "รอการคำนวณ..." || logEl.innerText === "✅ โหลดข้อมูลเริ่มต้นเรียบร้อยแล้ว") {
        logEl.innerText = "";
    } else {
        logEl.innerText += "\n\n";
    }
    logEl.innerText += message;
    logEl.scrollTop = logEl.scrollHeight;
}

// ปรับปรุงฟังก์ชันรีเซ็ตให้ล้างและเขียนทับข้อความ Log ทันที
function resetData() {
    currentData = JSON.parse(JSON.stringify(initialData));
    document.getElementById('action-log').innerText = "✅ โหลดข้อมูลเริ่มต้นเรียบร้อยแล้ว";
    selectedInput = null;
    buildUI();
}

function addSpare() {
    currentData.Spares.push(0.00);
    buildUI();
    addLog(`➕ เพิ่มช่อง Spare ช่องที่ ${currentData.Spares.length} เรียบร้อยแล้ว`);
}

function buildUI() {
    const keys = ['A1', 'B1', 'C1', 'A2', 'B2', 'C2', 'Spares'];
    keys.forEach(phase => {
        const col = document.getElementById(`col-${phase}`);
        col.innerHTML = phase === 'Spares' ? '' : `<div class="phase-title">${phase}</div>`;
        
        currentData[phase].forEach((val, idx) => {
            let label = phase === 'Spares' ? `Sp.${idx+1}` : `${phase}/${idx+1}`;
            col.innerHTML += `
                <div class="cell-row">
                    <div class="cell-label">${label}</div>
                    <input type="number" step="0.01" value="${val.toFixed(2)}" 
                           data-phase="${phase}" data-idx="${idx}" 
                           onchange="updateValue(this)" onclick="handleCellClick(this)" readonly="readonly">
                </div>
            `;
        });
        
        const inputs = col.querySelectorAll('input');
        inputs.forEach(input => {
            // 1. สำหรับการใช้เมาส์ดับเบิลคลิกบนคอมพิวเตอร์
            input.ondblclick = function() { 
                this.removeAttribute('readonly'); 
                this.focus();
            };
            
            // 2. สำหรับการเคาะหน้าจอ 2 ครั้ง (Double Tap) บน iPad / iPhone
            let lastTap = 0;
            input.addEventListener('touchend', function(e) {
                const currentTime = new Date().getTime();
                const tapLength = currentTime - lastTap;
                
                if (tapLength < 400 && tapLength > 0) {
                    // ถ้าตรวจพบการเคาะ 2 ครั้งติดกันภายใน 0.4 วินาที ให้ปลดล็อกช่องตัวเลข
                    this.removeAttribute('readonly');
                    this.focus(); 
                }
                lastTap = currentTime;
            });

            // 3. เมื่อพิมพ์เสร็จแล้วกดพื้นที่อื่นบนจอ ให้ล็อกช่องกลับมาเป็นโหมดสำหรับเลือกสลับตำแหน่งตามเดิม
            input.onblur = function() { 
                this.setAttribute('readonly', 'readonly'); 
            };
        });
    });
    updateCalculations();
}

function updateValue(input) {
    const phase = input.dataset.phase;
    const idx = input.dataset.idx;
    currentData[phase][idx] = parseFloat(input.value) || 0;
    updateCalculations();
}

function handleCellClick(input) {
    if (!selectedInput) {
        selectedInput = input;
        input.classList.add('is-selected');
    } else {
        if (selectedInput === input) {
            input.classList.remove('is-selected');
            selectedInput = null;
            return;
        }
        
        const phase1 = selectedInput.dataset.phase;
        const idx1 = selectedInput.dataset.idx;
        const phase2 = input.dataset.phase;
        const idx2 = input.dataset.idx;
        
        let temp = currentData[phase1][idx1];
        currentData[phase1][idx1] = currentData[phase2][idx2];
        currentData[phase2][idx2] = temp;

        let label1 = phase1 === 'Spares' ? `Sp.${idx1+1}` : `${phase1}/${parseInt(idx1)+1}`;
        let label2 = phase2 === 'Spares' ? `Sp.${idx2+1}` : `${phase2}/${parseInt(idx2)+1}`;

        addLog(`🔄 สลับ (Manual):\n${label1} (${temp.toFixed(2)}) ↔ ${label2} (${currentData[phase1][idx1].toFixed(2)})`);
        
        selectedInput.classList.remove('is-selected');
        selectedInput = null;
        buildUI(); 
    }
}

function calcCeq(arr) {
    let sumReciprocal = 0;
    for(let i=0; i<arr.length; i++){
        if(arr[i] === 0) continue;
        sumReciprocal += (1 / arr[i]);
    }
    return sumReciprocal === 0 ? 0 : 1 / sumReciprocal;
}

function updateCalculations() {
    const groups = {
        1: ['A1', 'B1', 'C1'],
        2: ['A2', 'B2', 'C2']
    };

    for (let g = 1; g <= 2; g++) {
        let ceqs = [];
        groups[g].forEach(phase => {
            let ceq = calcCeq(currentData[phase]);
            ceqs.push(ceq);
            document.getElementById(`res-${phase}`).innerText = ceq.toFixed(8);
        });

        let maxCeq = Math.max(...ceqs);
        let minCeq = Math.min(...ceqs);
        let delta = maxCeq - minCeq;
        
        const deltaBox = document.getElementById(`delta-g${g}`);
        if (delta <= 0.00100001) { 
            deltaBox.className = 'delta-box pass';
            deltaBox.innerText = `Delta ${g}: ${delta.toFixed(8)} (✅ ผ่าน)`;
        } else {
            deltaBox.className = 'delta-box fail';
            deltaBox.innerText = `Delta ${g}: ${delta.toFixed(8)} (❌ ไม่ผ่าน)`;
        }
    }
    
    calculateCTCurrent();
}

function calculateCTCurrent() {
    const V_ph = 115000 / Math.sqrt(3);
    const w = 2 * Math.PI * 50;
    const K_mA = V_ph * w * Math.pow(10, -3);

    let cA1 = calcCeq(currentData['A1']); let cB1 = calcCeq(currentData['B1']); let cC1 = calcCeq(currentData['C1']);
    let cA2 = calcCeq(currentData['A2']); let cB2 = calcCeq(currentData['B2']); let cC2 = calcCeq(currentData['C2']);

    let iA1 = K_mA * cA1, iB1 = K_mA * cB1, iC1 = K_mA * cC1;
    let iA2 = K_mA * cA2, iB2 = K_mA * cB2, iC2 = K_mA * cC2;

    let X1 = iA1 - (0.5 * iB1) - (0.5 * iC1);
    let Y1 = ((Math.sqrt(3)/2) * iC1) - ((Math.sqrt(3)/2) * iB1);

    let X2 = iA2 - (0.5 * iB2) - (0.5 * iC2);
    let Y2 = ((Math.sqrt(3)/2) * iC2) - ((Math.sqrt(3)/2) * iB2);

    let I_CT = (Math.sqrt(Math.pow(X1 - X2, 2) + Math.pow(Y1 - Y2, 2))) / 2;

    const currentBox = document.getElementById('panel-current');
    const currentText = document.getElementById('res-current');
    
    currentText.innerText = I_CT.toFixed(2) + " mA";

    if(I_CT > 150) {
        currentBox.style.backgroundColor = '#fee2e2';
        currentBox.style.borderColor = '#fca5a5';
        currentText.style.color = '#991b1b';
    } else {
        currentBox.style.backgroundColor = '#dcfce7';
        currentBox.style.borderColor = '#86efac';
        currentText.style.color = '#166534';
    }
}

function autoBalance() {
    let tempLog = "🚀 เริ่มการวิเคราะห์หาวิธีสลับอัตโนมัติ...\n";

    let cells = [];
    for(let phase in currentData) {
        currentData[phase].forEach((val, idx) => {
            cells.push({ phase, idx, val });
        });
    }

    function getScore(simData) {
        let ceqA1 = calcCeq(simData['A1']); let ceqB1 = calcCeq(simData['B1']); let ceqC1 = calcCeq(simData['C1']);
        let ceqA2 = calcCeq(simData['A2']); let ceqB2 = calcCeq(simData['B2']); let ceqC2 = calcCeq(simData['C2']);
        
        let d1 = Math.max(ceqA1, ceqB1, ceqC1) - Math.min(ceqA1, ceqB1, ceqC1);
        let d2 = Math.max(ceqA2, ceqB2, ceqC2) - Math.min(ceqA2, ceqB2, ceqC2);
        
        let p1 = d1 > 0.001 ? d1 * 100 : d1;
        let p2 = d2 > 0.001 ? d2 * 100 : d2;
        return p1 + p2;
    }

    for(let step = 1; step <= 3; step++) {
        let bestScore = getScore(currentData);
        let bestSwap = null;

        for(let i=0; i<cells.length; i++) {
            for(let j=i+1; j<cells.length; j++) {
                let phaseI = cells[i].phase, idxI = cells[i].idx;
                let phaseJ = cells[j].phase, idxJ = cells[j].idx;

                let temp = currentData[phaseI][idxI];
                let target = currentData[phaseJ][idxJ];

                if ((phaseI !== 'Spares' && target === 0) || (phaseJ !== 'Spares' && temp === 0)) continue;
                if (temp === 0 && target === 0) continue;

                currentData[phaseI][idxI] = target;
                currentData[phaseJ][idxJ] = temp;

                let currentScore = getScore(currentData);
                if (currentScore < bestScore) {
                    bestScore = currentScore;
                    bestSwap = { i, j };
                }

                currentData[phaseJ][idxJ] = target;
                currentData[phaseI][idxI] = temp;
            }
        }

        if (bestSwap) {
            let cell1 = cells[bestSwap.i];
            let cell2 = cells[bestSwap.j];
            
            let tempVal = currentData[cell1.phase][cell1.idx];
            currentData[cell1.phase][cell1.idx] = currentData[cell2.phase][cell2.idx];
            currentData[cell2.phase][cell2.idx] = tempVal;
            
            cells[bestSwap.i].val = currentData[cell1.phase][cell1.idx];
            cells[bestSwap.j].val = currentData[cell2.phase][cell2.idx];

            let l1 = cell1.phase === 'Spares' ? `Sp.${cell1.idx+1}` : `${cell1.phase}/${cell1.idx+1}`;
            let l2 = cell2.phase === 'Spares' ? `Sp.${cell2.idx+1}` : `${cell2.phase}/${cell2.idx+1}`;
            tempLog += `[ครั้งที่ ${step}] สลับ ${l1} กับ ${l2}\n`;
        } else {
            if (step === 1) tempLog += "✅ ระบบสมดุลอยู่แล้ว ไม่ต้องสลับ\n";
            break;
        }

        let d1 = Math.max(calcCeq(currentData['A1']), calcCeq(currentData['B1']), calcCeq(currentData['C1'])) - Math.min(calcCeq(currentData['A1']), calcCeq(currentData['B1']), calcCeq(currentData['C1']));
        let d2 = Math.max(calcCeq(currentData['A2']), calcCeq(currentData['B2']), calcCeq(currentData['C2'])) - Math.min(calcCeq(currentData['A2']), calcCeq(currentData['B2']), calcCeq(currentData['C2']));
        
        if(d1 <= 0.001 && d2 <= 0.001) {
            tempLog += "🎉 สำเร็จ! ค่า Delta ผ่านเกณฑ์ที่กำหนดแล้ว\n";
            break;
        }
    }

    addLog(tempLog.trim());
    buildUI();
}

resetData();
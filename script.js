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
let editingInput = null;
let totalAutoSteps = 0; // ✅ เพิ่มตัวแปรนี้เพื่อจำจำนวนครั้งการสลับ

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

function resetData() {
    currentData = JSON.parse(JSON.stringify(initialData));
    document.getElementById('action-log').innerText = "✅ โหลดข้อมูลเริ่มต้นเรียบร้อยแล้ว";
    selectedInput = null;
    totalAutoSteps = 0; // ✅ รีเซ็ตตัวนับเมื่อโหลดข้อมูลใหม่
    buildUI();
}

function addSpare() {
    currentData.Spares.push(0.00);
    buildUI();
    addLog(`➕ เพิ่มช่อง Spare ช่องที่ ${currentData.Spares.length} เรียบร้อยแล้ว`);
}

function openEditModal(input){

    editingInput = input;

    const modal = document.getElementById("editModal");
    const valueBox = document.getElementById("modalValue");

    valueBox.value = input.value;

    modal.classList.add("show");

    setTimeout(() => {
        valueBox.focus();
        valueBox.select();
    }, 100);
}

function closeEditModal(){

    document
        .getElementById("editModal")
        .classList
        .remove("show");

    editingInput = null;
}

function saveEditModal(){

    if(!editingInput) return;

    const valueBox =
        document.getElementById("modalValue");

    const num =
        parseFloat(valueBox.value);

    if(isNaN(num)){

        alert("กรุณากรอกตัวเลข");

        return;
    }

    editingInput.value =
        num.toFixed(2);

    updateValue(editingInput);

    closeEditModal();
}

function buildUI() {
    const keys = ['A1', 'B1', 'C1', 'A2', 'B2', 'C2', 'Spares'];
    keys.forEach(phase => {
        const col = document.getElementById(`col-${phase}`);
        col.innerHTML = phase === 'Spares' ? '' : `<div class="phase-title">${phase}</div>`;
        
        currentData[phase].forEach((val, idx) => {
            let label = phase === 'Spares' ? `Sp.${idx+1}` : `${phase}/${idx+1}`;
            // เพิ่ม inputmode="decimal" เพื่อดึงแป้นตัวเลขบน iPad
            col.innerHTML += `
                <div class="cell-row">
                    <div class="cell-label">${label}</div>
                    <input type="number" step="0.01" inputmode="decimal" value="${val.toFixed(2)}" 
                           data-phase="${phase}" data-idx="${idx}" readonly>
                </div>
            `;
        });
    });

    const inputs = document.querySelectorAll('input[data-phase]');
    inputs.forEach(input => {

    let clickTimer = null;
    let lastTouchTime = 0;

    // ===== PC =====

    input.addEventListener("click", function(e){

        if(e.detail === 2){

            clearTimeout(clickTimer);

            openEditModal(input);

            return;
        }

        clickTimer = setTimeout(() => {

            handleCellClick(input);

        }, 250);
    });

    // ===== Touch =====

    input.addEventListener(
        "touchend",
        function(e){

            const now =
                Date.now();

            const diff =
                now - lastTouchTime;

            if(diff < 350){

                e.preventDefault();

                openEditModal(input);

            }

            lastTouchTime = now;
        }
    );

    input.addEventListener(
        "change",
        function(){

            updateValue(this);
        }
    );
});
    
    updateCalculations();
}

function updateValue(input) {
    const phase = input.dataset.phase;
    const idx = input.dataset.idx;
    const oldVal = currentData[phase][idx];
    currentData[phase][idx] = parseFloat(input.value) || 0;
    
    if (oldVal !== currentData[phase][idx]) {
        let label = phase === 'Spares' ? `Sp.${parseInt(idx)+1}` : `${phase}/${parseInt(idx)+1}`;
        addLog(`✏️ พิมพ์แก้ไขค่า: ${label} เปลี่ยนจาก ${oldVal.toFixed(2)} เป็น ${currentData[phase][idx].toFixed(2)}`);
    }
    updateCalculations();
}

// ลอจิกการกดปุ่ม (Tap to Select -> Tap again to Edit)
function handleCellClick(input) {
    if (!selectedInput) {
        // แตะครั้งแรก -> เลือกสลับ (ขึ้นสีฟ้า)
        selectedInput = input;
        input.classList.add('is-selected');
    } else {
        if (selectedInput === input) {
            // แตะครั้งที่ 2 ที่ช่องเดิม -> ปลดล็อกเพื่อพิมพ์แก้ไข
            input.classList.remove('is-selected');
            selectedInput = null;
            
            input.readOnly = false;
            input.focus(); // Safari จะยอมให้คีย์บอร์ดเด้งตรงนี้ทันที
            return;
        }
        
        // แตะครั้งที่ 2 ที่ช่องอื่น -> สลับข้อมูล (Swap)
        const phase1 = selectedInput.dataset.phase;
        const idx1 = selectedInput.dataset.idx;
        const phase2 = input.dataset.phase;
        const idx2 = input.dataset.idx;
        
        let temp = currentData[phase1][idx1];
        currentData[phase1][idx1] = currentData[phase2][idx2];
        currentData[phase2][idx2] = temp;

        let label1 = phase1 === 'Spares' ? `Sp.${parseInt(idx1)+1}` : `${phase1}/${parseInt(idx1)+1}`;
        let label2 = phase2 === 'Spares' ? `Sp.${parseInt(idx2)+1}` : `${phase2}/${parseInt(idx2)+1}`;

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
        let ceqsCalc = [];
        let ceqsMeas = [];
        let validMeas = true;

        groups[g].forEach(phase => {
            // ค่าจากการคำนวณ (Calculated)
            let ceq = calcCeq(currentData[phase]);
            ceqsCalc.push(ceq);
            document.getElementById(`res-${phase}`).innerText = ceq.toFixed(8);

            // ค่าจากการวัดจริง (Measured)
            let measInput = document.getElementById(`meas-${phase}`);
            let errSpan = document.getElementById(`err-${phase}`); // กล่องแสดง Error
            let mVal = parseFloat(measInput?.value);
            
            if (isNaN(mVal)) {
                validMeas = false;
                if (errSpan) {
                    errSpan.innerText = "-";
                    errSpan.className = "err-val"; // รีเซ็ตสีกลับเป็นปกติ
                }
            } else {
                ceqsMeas.push(mVal);
                if (errSpan) {
                    // คำนวณเปอร์เซ็นต์ Error: |Calc - Meas| / Calc * 100
                    let errorPct = Math.abs((ceq - mVal) / ceq) * 100;
                    errSpan.innerText = errorPct.toFixed(2) + "%";
                    
                    // เปลี่ยนสีตามเงื่อนไข
                    if (errorPct < 5) {
                        errSpan.className = "err-val text-pass"; // ผ่าน (เขียว)
                    } else {
                        errSpan.className = "err-val text-fail"; // ไม่ผ่าน (แดง)
                    }
                }
            }
        });

        // --- อัปเดตกล่อง Delta Calculated ---
        let maxCeqCalc = Math.max(...ceqsCalc);
        let minCeqCalc = Math.min(...ceqsCalc);
        let deltaCalc = maxCeqCalc - minCeqCalc;
        
        const deltaCalcBox = document.getElementById(`delta-calc-g${g}`);
        if (deltaCalc <= 0.00100001) { 
            deltaCalcBox.className = 'delta-box pass';
            deltaCalcBox.innerText = `Delta Calculated ${g}: ${deltaCalc.toFixed(8)} (✅ ผ่าน)`;
        } else {
            deltaCalcBox.className = 'delta-box fail';
            deltaCalcBox.innerText = `Delta Calculated ${g}: ${deltaCalc.toFixed(8)} (❌ ไม่ผ่าน)`;
        }

        // --- อัปเดตกล่อง Delta Measured ---
        const deltaMeasBox = document.getElementById(`delta-meas-g${g}`);
        if (validMeas) {
            let maxCeqMeas = Math.max(...ceqsMeas);
            let minCeqMeas = Math.min(...ceqsMeas);
            let deltaMeas = maxCeqMeas - minCeqMeas;

            if (deltaMeas <= 0.00100001) {
                deltaMeasBox.className = 'delta-box pass';
                deltaMeasBox.innerText = `Delta Measured ${g}: ${deltaMeas.toFixed(8)} (✅ ผ่าน)`;
            } else {
                deltaMeasBox.className = 'delta-box fail';
                deltaMeasBox.innerText = `Delta Measured ${g}: ${deltaMeas.toFixed(8)} (❌ ไม่ผ่าน)`;
            }
        } else {
            // กรณีที่ยังกรอกข้อมูลไม่ครบ
            deltaMeasBox.className = 'delta-box pending';
            deltaMeasBox.innerText = `Delta Measured ${g}: รอระบุค่า (Pending)`;
        }
    }
    
    calculateCTCurrent();
}

function calculateICT(
    cA1,cB1,cC1,
    cA2,cB2,cC2
){
    const V_ph =
        115000 / Math.sqrt(3);

    const w =
        2 * Math.PI * 50;

    const K_mA =
        V_ph * w * Math.pow(10,-3);

    let iA1 = K_mA * cA1;
    let iB1 = K_mA * cB1;
    let iC1 = K_mA * cC1;

    let iA2 = K_mA * cA2;
    let iB2 = K_mA * cB2;
    let iC2 = K_mA * cC2;

    let X1 =
        iA1 -
        0.5*iB1 -
        0.5*iC1;

    let Y1 =
        (Math.sqrt(3)/2)*iC1 -
        (Math.sqrt(3)/2)*iB1;

    let X2 =
        iA2 -
        0.5*iB2 -
        0.5*iC2;

    let Y2 =
        (Math.sqrt(3)/2)*iC2 -
        (Math.sqrt(3)/2)*iB2;

    return (
        Math.sqrt(
            Math.pow(X1-X2,2)+
            Math.pow(Y1-Y2,2)
        )
    )/2;
}

function calculateCTCurrent() {
    // ===== Calculated Ceq =====
    let ICT_calc = calculateICT(
        calcCeq(currentData['A1']), calcCeq(currentData['B1']), calcCeq(currentData['C1']),
        calcCeq(currentData['A2']), calcCeq(currentData['B2']), calcCeq(currentData['C2'])
    );

    // ===== Measured Ceq =====
    let mA1 = parseFloat(document.getElementById("meas-A1")?.value);
    let mB1 = parseFloat(document.getElementById("meas-B1")?.value);
    let mC1 = parseFloat(document.getElementById("meas-C1")?.value);
    let mA2 = parseFloat(document.getElementById("meas-A2")?.value);
    let mB2 = parseFloat(document.getElementById("meas-B2")?.value);
    let mC2 = parseFloat(document.getElementById("meas-C2")?.value);

    let ICT_meas = 0;
    let hasMeas = !isNaN(mA1) && !isNaN(mB1) && !isNaN(mC1) && !isNaN(mA2) && !isNaN(mB2) && !isNaN(mC2);
    if(hasMeas){
        ICT_meas = calculateICT(mA1,mB1,mC1, mA2,mB2,mC2);
    }

    // --- 1. อัปเดตและเปลี่ยนสีกล่อง Calculated CT Current ---
    const calcEl = document.getElementById("res-current-calc");
    const calcCard = calcEl.parentElement; // เข้าถึงตัวกล่องรอบนอก
    calcEl.innerText = ICT_calc.toFixed(2) + " mA";
    
    if (ICT_calc > 150) {
        calcCard.style.backgroundColor = "#fee2e2"; // พื้นหลังแดงอ่อน
        calcCard.style.borderColor = "#fca5a5";     // เส้นขอบแดง
        calcEl.style.color = "#b91c1c";             // ตัวหนังสือแดงเข้ม
    } else {
        calcCard.style.backgroundColor = "#d1fae5"; // พื้นหลังเขียวอ่อน
        calcCard.style.borderColor = "#86efac";     // เส้นขอบเขียว
        calcEl.style.color = "#15803d";             // ตัวหนังสือเขียวเข้ม
    }

    // --- 2. อัปเดตและเปลี่ยนสีกล่อง Measured CT Current ---
    const measEl = document.getElementById("res-current-meas");
    const measCard = measEl.parentElement; // เข้าถึงตัวกล่องรอบนอก
    
    if (hasMeas) {
        measEl.innerText = ICT_meas.toFixed(2) + " mA";
        if (ICT_meas > 150) {
            measCard.style.backgroundColor = "#fee2e2"; // พื้นหลังแดงอ่อน
            measCard.style.borderColor = "#fca5a5";     // เส้นขอบแดง
            measEl.style.color = "#b91c1c";             // ตัวหนังสือแดงเข้ม
        } else {
            measCard.style.backgroundColor = "#d1fae5"; // พื้นหลังเขียวอ่อน
            measCard.style.borderColor = "#86efac";     // เส้นขอบเขียว
            measEl.style.color = "#15803d";             // ตัวหนังสือเขียวเข้ม
        }
    } else {
        // กรณีที่ยังกรอกข้อมูลฝั่ง Measured ไม่ครบ (Pending)
        measEl.innerText = "0.00 mA";
        measCard.style.backgroundColor = "#f8fafc"; // พื้นหลังสีเทาอ่อนชั่วคราว
        measCard.style.borderColor = "#cbd5e1";     // ขอบเทา
        measEl.style.color = "#475569";             // ตัวหนังสือสีเทาเข้ม
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
            
            // ✅ บวกตัวเลขสะสมเพิ่มขึ้น 1 ทุกครั้งที่มีการสลับ
            totalAutoSteps++; 
            tempLog += `[ครั้งที่ ${totalAutoSteps}] สลับ ${l1} กับ ${l2}\n`;
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

document
    .getElementById("btnSave")
    .addEventListener(
        "click",
        saveEditModal
    );

document
    .getElementById("btnCancel")
    .addEventListener(
        "click",
        closeEditModal
    );

document
    .getElementById("modalValue")
    .addEventListener(
        "keydown",
        function(e){

            if(e.key === "Enter"){

                saveEditModal();
            }
        }
    );

[
 'meas-A1', 'meas-B1', 'meas-C1',
 'meas-A2', 'meas-B2', 'meas-C2'
].forEach(id => {
    const inputEl = document.getElementById(id);
    
    if (inputEl) {
        // 1. คำนวณค่า Delta และ CT Current แบบ Real-time ขณะพิมพ์
        inputEl.addEventListener("input", updateCalculations);

        // 2. บันทึกประวัติลง Log เมื่อพิมพ์เสร็จแล้ว (คลิกที่อื่น หรือ กด Enter)
        inputEl.addEventListener("change", function() {
            const phase = id.replace('meas-', ''); // ดึงแค่ชื่อเฟส (A1, B1, ...)
            const val = this.value;
            
            if (val !== "") {
                addLog(`📝 ระบุค่า Measured [${phase}]: ${val}`);
            } else {
                addLog(`🗑️ ลบค่า Measured [${phase}]`);
            }
        });
    }
});

resetData();